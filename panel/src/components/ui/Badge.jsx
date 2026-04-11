import { STATUS_COLORS } from '../../data/constants';

export const Badge = ({ status }) => (
  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${STATUS_COLORS[status] || 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10'}`}>
    {status}
  </span>
);
