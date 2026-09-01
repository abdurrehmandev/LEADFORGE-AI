import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../storage';
import { UserRole, Workspace, WorkspaceMember } from '../../src/types';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  isDemo?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  workspace?: Workspace;
  membership?: WorkspaceMember;
}

/**
 * Returns whether Demo Mode is explicitly enabled via server environment variable.
 */
export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE === 'true';
}

/**
 * Express middleware to authenticate callers using Firebase ID tokens.
 * Rejects missing, invalid, or expired tokens with HTTP 401.
 * Demo token authentication is strictly disabled in production.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Authorization header with Bearer token is missing.',
      });
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Bearer token is missing or empty.',
      });
    }

    // Isolated demo tokens are only permitted when DEMO_MODE is explicitly enabled via environment variable
    if (token === 'demo_token' || token === 'demo_guest_token') {
      if (isDemoModeEnabled()) {
        req.user = {
          uid: 'demo_guest_uid',
          name: 'Demo Evaluator',
          email: 'evaluator@leadforge.demo',
          isDemo: true,
        };
        return next();
      } else {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Demo authentication is disabled in production. Valid Firebase credentials required.',
        });
      }
    }

    // Verify token using Firebase Admin SDK
    try {
      const decoded = await getAuth().verifyIdToken(token);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        picture: decoded.picture,
        isDemo: false,
      };
      return next();
    } catch (verifyError: any) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid, expired, or revoked authentication token.',
      });
    }
  } catch (err: any) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication verification failed.',
    });
  }
}

/**
 * Express middleware to authorize callers against the requested workspace and required roles.
 * Never authorizes based solely on workspaceId parameter without membership verification.
 */
export function requireWorkspaceAccess(allowedRoles?: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId =
        req.params.id ||
        req.params.workspaceId ||
        (req.body && req.body.workspaceId) ||
        (req.query && (req.query.workspaceId as string));

      if (!workspaceId || typeof workspaceId !== 'string') {
        return res.status(400).json({ error: 'Workspace ID is required for this operation.' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const workspace = db.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found.' });
      }

      // Check if this is a demo workspace and DEMO_MODE is active
      if (isDemoModeEnabled() && (workspace.isDemo || workspace.id === 'ws_northstar_solar_demo')) {
        const demoRole: UserRole = (req.headers['x-demo-role'] as UserRole) || 'OWNER';
        req.workspace = workspace;
        req.membership = {
          userId: req.user.uid,
          name: req.user.name || 'Demo Member',
          email: req.user.email || 'demo@leadforge.demo',
          role: demoRole,
          joinedAt: workspace.createdAt,
        };

        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(demoRole)) {
          return res.status(403).json({
            error: 'Forbidden',
            message: `Role ${demoRole} is insufficient for this operation. Required: ${allowedRoles.join(', ')}`,
          });
        }
        return next();
      }

      // Look up membership in persistent multi-tenant storage
      const member = db.getWorkspaceMember(workspaceId, req.user.uid);
      const isOwner = workspace.ownerId === req.user.uid;

      if (!member && !isOwner) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this organization workspace.',
        });
      }

      const role: UserRole = isOwner ? 'OWNER' : (member?.role || 'VIEWER');

      // Check role authorization
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Insufficient permissions. Your role '${role}' cannot perform this action. Required: ${allowedRoles.join(', ')}`,
        });
      }

      req.workspace = workspace;
      req.membership = member || {
        userId: req.user.uid,
        name: req.user.name || 'Owner',
        email: req.user.email || '',
        role: 'OWNER',
        joinedAt: workspace.createdAt,
      };

      return next();
    } catch (err: any) {
      console.error('[Authorization Error]:', err);
      return res.status(500).json({ error: 'Authorization verification failed.' });
    }
  };
}

/**
 * Helper to require specific workspace roles
 */
export function requireWorkspaceRole(roles: UserRole[]) {
  return requireWorkspaceAccess(roles);
}

