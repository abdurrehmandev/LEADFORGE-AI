import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory bucket store
const ipStores: Map<string, RateLimitRecord> = new Map();

// Periodic cleanup of stale IP buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000;
  for (const [key, record] of ipStores.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < maxAge);
    if (record.timestamps.length === 0) {
      ipStores.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max allowed requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Lightweight, robust sliding-window rate limiter middleware.
 */
export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress) || '127.0.0.1';
      return `${ip}:${req.baseUrl || req.path}`;
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in automated testing environment
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = ipStores.get(key);
    if (!record) {
      record = { timestamps: [] };
      ipStores.set(key, record);
    }

    // Filter timestamps within current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxRequests) {
      const retryAfter = Math.ceil((record.timestamps[0] + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter > 0 ? retryAfter : 1);
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfterSeconds: retryAfter > 0 ? retryAfter : 1,
      });
    }

    record.timestamps.push(now);
    return next();
  };
}

// Predefined rate limiter instances for specialized security zones
export const aiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 40, // 40 AI requests per minute per IP
  message: 'AI rate limit exceeded. Please wait a moment before sending more requests.',
});

export const webhookRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 120, // 120 webhook payloads per minute per IP
  message: 'Webhook rate limit exceeded.',
});

export const invitationRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 30, // 30 invitations per minute per IP
  message: 'Invitation rate limit reached. Please wait before issuing more invitations.',
});
