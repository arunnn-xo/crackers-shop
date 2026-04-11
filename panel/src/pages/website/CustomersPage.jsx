import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';

const CustomersPage = () => {
  const cols = useMemo(() => [
    { key: 'name', label: 'Name', render: (val, row) => (
      <div className="flex items-center gap-3">
        <img src={row.avatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 shadow-sm" alt="" />
        <span className="font-semibold text-slate-800 dark:text-white">{val}</span>
      </div>
    )},
    { key: 'email', label: 'Email', render: (val) => <span className="text-slate-600 dark:text-slate-400">{val}</span> },
    { key: 'phone', label: 'Phone Number', render: (val) => <span className="font-medium text-slate-700 dark:text-slate-300">{val}</span> },
    { key: 'address', label: 'Address', render: (val) => <span className="text-slate-500 dark:text-slate-400 truncate block w-48">{val}</span> },
    { key: 'city', label: 'City' },
  ], []);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Customers" icon={Users} />
      <DataTable columns={cols} data={MOCK_CUSTOMERS} />
    </div>
  );
};

export default CustomersPage;
