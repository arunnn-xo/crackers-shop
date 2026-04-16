export const Input = ({ label, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>}
    <input 
      className="bg-white dark:bg-[#0a0a0f] border border-slate-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm"
      {...props} 
    />
  </div>
);

export const Select = ({ label, options, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>}
    <select 
      className="bg-white dark:bg-[#0a0a0f] border border-slate-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 appearance-none shadow-sm"
      {...props}
    >
      {options.map((opt, index) => {
        const isObjectOption = typeof opt === 'object' && opt !== null;
        const value = isObjectOption ? opt.value ?? '' : opt;
        const label = isObjectOption ? opt.label ?? String(value) : opt;
        const key = isObjectOption ? `${String(value)}-${index}` : `${String(opt)}-${index}`;

        return (
          <option key={key} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  </div>
);
