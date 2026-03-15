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
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] backdrop-enter" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-md border border-slate-200/80 p-6 max-w-sm w-full mx-4 modal-enter">
        <h3 className="text-sm font-semibold text-slate-800 mb-2 tracking-tight">{title}</h3>
        <div className="text-sm text-slate-500 mb-5 leading-relaxed">{message}</div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.97] rounded-lg transition-all duration-200 ease-out"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.97] rounded-lg transition-all duration-200 ease-out shadow-sm hover:shadow-md"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
