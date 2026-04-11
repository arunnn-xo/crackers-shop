import { Bold, Italic, Underline, AlignLeft, Link as LinkIcon, Image as ImageIcon, CheckSquare } from 'lucide-react';

export const WYSIWYGEditor = ({ label, value }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>}
    <div className="border border-slate-300 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-[#0a0a0f] focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-colors shadow-sm">
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
        {[Bold, Italic, Underline, AlignLeft, LinkIcon, ImageIcon, CheckSquare].map((Icon, i) => (
          <button key={i} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors"><Icon className="w-4 h-4" /></button>
        ))}
      </div>
      <textarea 
        className="w-full bg-transparent p-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none min-h-[150px] resize-y"
        placeholder="Enter content here..."
        defaultValue={value}
      />
    </div>
  </div>
);
