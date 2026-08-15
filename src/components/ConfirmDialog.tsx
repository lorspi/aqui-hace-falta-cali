import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type DialogVariant = 'confirm' | 'success' | 'error' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  /** If true, only shows a single "accept" button (for alerts) */
  isAlert?: boolean;
}

const VARIANT_CONFIG: Record<DialogVariant, { icon: React.ElementType; iconClass: string; bgClass: string }> = {
  confirm: { icon: AlertTriangle, iconClass: 'text-amber-600', bgClass: 'bg-amber-100 border-amber-200' },
  success: { icon: CheckCircle2, iconClass: 'text-emerald-600', bgClass: 'bg-emerald-100 border-emerald-200' },
  error: { icon: AlertTriangle, iconClass: 'text-rose-600', bgClass: 'bg-rose-100 border-rose-200' },
  info: { icon: Info, iconClass: 'text-blue-600', bgClass: 'bg-blue-100 border-blue-200' },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  variant = 'confirm',
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  isAlert = false,
}) => {
  // Block body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const defaultConfirmLabel = isAlert ? 'Aceptar' : (variant === 'confirm' ? 'Confirmar' : 'Aceptar');

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 fade-in duration-150">
        {/* Header */}
        <div className="p-5 pb-3 flex items-start gap-3">
          <div className={`p-2 rounded-xl border ${config.bgClass} shrink-0`}>
            <Icon className={`w-5 h-5 ${config.iconClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="font-bold text-slate-900 text-base leading-tight">
              {title}
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 shrink-0 -mt-1 -mr-1"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 flex items-center justify-end gap-2">
          {!isAlert && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={() => { if (onConfirm) onConfirm(); else onCancel(); }}
            autoFocus
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors shadow-xs ${
              variant === 'error' || variant === 'confirm'
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : variant === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {confirmLabel || defaultConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Hook for imperative usage ---

type DialogState = {
  isOpen: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  isAlert: boolean;
  resolve: ((value: boolean) => void) | null;
};

const initialState: DialogState = {
  isOpen: false,
  title: '',
  message: '',
  variant: 'confirm',
  confirmLabel: undefined,
  cancelLabel: undefined,
  isAlert: false,
  resolve: null,
};

let globalSetDialog: React.Dispatch<React.SetStateAction<DialogState>> | null = null;

/**
 * Show a custom confirmation dialog (replaces window.confirm).
 * Returns a Promise<boolean>.
 */
export function showConfirm(
  message: string,
  options?: { title?: string; confirmLabel?: string; cancelLabel?: string; variant?: DialogVariant }
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!globalSetDialog) {
      // Fallback to native confirm if provider not mounted
      resolve(window.confirm(message));
      return;
    }
    globalSetDialog({
      isOpen: true,
      title: options?.title || 'Confirmar acción',
      message,
      variant: options?.variant || 'confirm',
      confirmLabel: options?.confirmLabel,
      cancelLabel: options?.cancelLabel,
      isAlert: false,
      resolve,
    });
  });
}

/**
 * Show a custom alert dialog (replaces window.alert).
 * Returns a Promise<void>.
 */
export function showAlert(
  message: string,
  options?: { title?: string; variant?: DialogVariant }
): Promise<void> {
  return new Promise((resolve) => {
    if (!globalSetDialog) {
      window.alert(message);
      resolve();
      return;
    }
    globalSetDialog({
      isOpen: true,
      title: options?.title || 'Aviso',
      message,
      variant: options?.variant || 'info',
      confirmLabel: 'Aceptar',
      cancelLabel: undefined,
      isAlert: true,
      resolve: () => { resolve(); return true; },
    });
  });
}

/**
 * Provider component — mount once at root level.
 * Renders the dialog when triggered by showConfirm/showAlert.
 */
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = React.useState<DialogState>(initialState);

  React.useEffect(() => {
    globalSetDialog = setDialog;
    return () => { globalSetDialog = null; };
  }, []);

  const handleConfirm = () => {
    dialog.resolve?.(true);
    setDialog(initialState);
  };

  const handleCancel = () => {
    dialog.resolve?.(false);
    setDialog(initialState);
  };

  return (
    <>
      {children}
      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        variant={dialog.variant}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        isAlert={dialog.isAlert}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};
