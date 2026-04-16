import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidthClass = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
      <div className={`bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl w-full ${maxWidthClass} max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-76px)] overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
};
