export const Card = ({ children, className = '', title, action, icon: Icon }) => (
  <div className={`bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/5 rounded-xl shadow-sm overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
        {title && (
          <div className="flex items-center gap-2.5">
            {Icon && <div className="p-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded shadow-sm"><Icon className="w-4 h-4 text-amber-500" /></div>}
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white tracking-wide">{title}</h3>
          </div>
        )}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);
