import { Bold, Italic, Underline, AlignLeft, Link as LinkIcon, Image as ImageIcon, CheckSquare } from 'lucide-react';

export const WYSIWYGEditor = ({ label, value, onChange, name, placeholder = 'Enter content here...' }) => {
  const isControlled = typeof onChange === 'function';

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>}
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition-colors focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-white/10 dark:bg-[#0a0a0f]">
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.02]">
          {[Bold, Italic, Underline, AlignLeft, LinkIcon, ImageIcon, CheckSquare].map((Icon, i) => (
            <button
              key={i}
              type="button"
              className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <textarea
          className="min-h-[150px] w-full resize-y bg-transparent p-4 text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-slate-600"
          placeholder={placeholder}
          name={name}
          {...(isControlled ? { value: value ?? '', onChange } : { defaultValue: value })}
        />
      </div>
    </div>
  );
};
