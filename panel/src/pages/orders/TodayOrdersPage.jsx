import { useMemo } from 'react';
import { ShoppingBasket } from 'lucide-react';
import { MOCK_ORDERS } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';

const TodayOrdersPage = () => {
  const cols = useMemo(() => [
    { key: 'id', label: 'Order NO', render: val => <span className="font-bold text-slate-800 dark:text-white">{val}</span> },
    { key: 'customer', label: 'Customer Name', render: val => <span className="font-medium text-slate-700 dark:text-slate-300">{val}</span> },
    { key: 'phone', label: 'Phone Number', render: val => <span className="text-slate-600 dark:text-slate-400">{val}</span> },
    { key: 'total', label: 'Amount', render: val => <span className="font-semibold text-slate-900 dark:text-white">₹{val}</span> },
    { key: 'status', label: 'Status', render: val => <Badge status={val} /> },
    { key: 'actions', label: 'Action', render: () => <button className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded text-xs font-bold transition-colors">View</button> }
  ], []);
  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Today's Orders" icon={ShoppingBasket} />
      <DataTable columns={cols} data={MOCK_ORDERS.slice(0, 15)} />
    </div>
  );
};

export default TodayOrdersPage;
