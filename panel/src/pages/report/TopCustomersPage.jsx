import { useMemo } from 'react';
import { Award } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';

const TopCustomersPage = () => {
  const cols = useMemo(() => [
    { key: 'rank', label: 'Rank', render: val => <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">{val}</span> },
    { key: 'customer', label: 'Customer', render: val => <span className="font-semibold text-slate-800 dark:text-white">{val}</span> },
    { key: 'orders', label: 'Total Orders', render: val => <span className="text-slate-600 dark:text-slate-400 font-medium">{val}</span> },
    { key: 'value', label: 'Total Value', render: val => <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{val}</span> }
  ], []);
  const data = useMemo(() => Array.from({length: 10}).map((_, i) => ({ rank: i+1, customer: `VIP Customer ${i+1}`, orders: 45 - i*3, value: 150000 - i*10000 })), []);
  return <div className="space-y-6 fade-in"><PageHeader title="Top Customers" icon={Award} /><DataTable columns={cols} data={data} /></div>;
};

export default TopCustomersPage;
