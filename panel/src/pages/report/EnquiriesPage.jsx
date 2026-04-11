import { useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';

const EnquiriesPage = () => {
  const cols = useMemo(() => [
    { key: 'date', label: 'Date', render: val => <span className="text-slate-500 dark:text-slate-400">{val}</span> },
    { key: 'name', label: 'Name', render: val => <span className="font-medium text-slate-800 dark:text-white">{val}</span> },
    { key: 'phone', label: 'Phone', render: val => <span className="text-slate-600 dark:text-slate-400">{val}</span> },
    { key: 'msg', label: 'Message', render: val => <span className="truncate w-48 block text-slate-700 dark:text-slate-300">{val}</span> }
  ], []);
  const data = useMemo(() => [{ date: '2023-10-01', name: 'Ravi', phone: '9876543210', msg: 'Need wholesale price for 100 boxes.' }], []);
  return <div className="space-y-6 fade-in"><PageHeader title="Contact Enquiries" icon={MessageSquare} /><DataTable columns={cols} data={data} /></div>;
};

export default EnquiriesPage;
