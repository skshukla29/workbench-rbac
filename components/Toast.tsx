'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { Toast, ToastType } from '@/types';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Context ─────────────────────────────────────────────────

interface ToastContextValue {
  addToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: ToastContextValue = {
    addToast,
    success: (title, msg) => addToast('success', title, msg),
    error: (title, msg) => addToast('error', title, msg),
    warning: (title, msg) => addToast('warning', title, msg),
    info: (title, msg) => addToast('info', title, msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

// ─── Toast Container ─────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
  error:   <XCircle    className="w-5 h-5 text-red-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  info:    <Info       className="w-5 h-5 text-blue-400 shrink-0" />,
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error:   'border-l-red-500',
  warning: 'border-l-amber-500',
  info:    'border-l-blue-500',
};

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-start gap-3 p-4 rounded-lg
            bg-neutral-800 border border-neutral-700 border-l-4 ${BORDER_COLORS[toast.type]}
            shadow-2xl backdrop-blur-sm
            animate-in slide-in-from-right-5 fade-in duration-200
          `}
        >
          {ICONS[toast.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="shrink-0 text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
