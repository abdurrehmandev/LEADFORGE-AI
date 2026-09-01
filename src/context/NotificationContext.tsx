import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'hot';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ type, title, message, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newToast: ToastMessage = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <NotificationContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast floating container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const bgColors = {
            success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/50',
            error: 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-950/50',
            warning: 'bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-950/50',
            info: 'bg-slate-900/90 border-indigo-500/50 text-slate-100 shadow-slate-950/50',
            hot: 'bg-orange-950/95 border-orange-500/80 text-orange-100 shadow-orange-950/60 ring-1 ring-orange-400/40',
          }[toast.type];

          const icon = {
            success: '✓',
            error: '✕',
            warning: '⚠️',
            info: 'ℹ',
            hot: '🔥',
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 ${bgColors}`}
            >
              <span className="text-lg leading-none shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-snug">{toast.title}</div>
                {toast.message && (
                  <div className="text-xs opacity-85 mt-1 leading-relaxed break-words">{toast.message}</div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-xs opacity-60 hover:opacity-100 p-1 -mr-1 -mt-1 rounded transition-opacity"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
