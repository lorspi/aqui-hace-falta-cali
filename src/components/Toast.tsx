import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

const VARIANT_CONFIG: Record<ToastVariant, { icon: React.ElementType; iconClass: string; barClass: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-emerald-600', barClass: 'bg-emerald-500' },
  error: { icon: AlertTriangle, iconClass: 'text-rose-600', barClass: 'bg-rose-500' },
  info: { icon: Info, iconClass: 'text-blue-600', barClass: 'bg-blue-500' },
};

let globalPushToast: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

/**
 * Show a lightweight, auto-dismissing toast notification.
 */
export function showToast(
  message: string,
  options?: { variant?: ToastVariant; duration?: number }
): void {
  const toast = {
    message,
    variant: options?.variant || 'success',
    duration: options?.duration ?? 3500,
  };
  if (!globalPushToast) {
    // Provider not mounted — silently ignore (non-critical UI feedback)
    return;
  }
  globalPushToast(toast);
}

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  const config = VARIANT_CONFIG[toast.variant];
  const Icon = config.icon;

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-2xl border border-slate-200 pl-4 pr-3 py-3 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden animate-in slide-in-from-right-4 fade-in duration-200"
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconClass}`} />
      <p className="flex-1 text-sm text-slate-800 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 -mt-0.5 -mr-0.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Provider component — mount once at root level.
 * Renders the toast stack when triggered by showToast().
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    globalPushToast = (toast) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...toast, id }]);
    };
    return () => { globalPushToast = null; };
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </>
  );
};
