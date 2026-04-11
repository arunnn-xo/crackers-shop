export const PageHeader = ({ title, icon: Icon, subtitle, action, badge }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex items-center gap-3.5">
      {Icon && (
        <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shadow-sm border border-amber-200/50 dark:border-amber-500/20">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div>
        <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
            {badge && <span className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-white/10 border border-slate-300 dark:border-white/10 px-2.5 py-0.5 rounded-full">{badge}</span>}
        </div>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);
