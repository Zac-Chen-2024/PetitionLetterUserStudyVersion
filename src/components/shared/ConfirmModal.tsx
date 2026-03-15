import type { ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, title, message, confirmText, cancelText, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl border border-slate-200 p-6 max-w-sm w-full mx-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">{title}</h3>
        <div className="text-sm text-slate-600 mb-5">{message}</div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
