import { useMemo } from 'react';
import { ClipboardEdit, Trash, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const OrderStatusPage = () => {
  const statuses = useMemo(() => ['Pending', 'Dispatch', 'Complete', 'Payment Pending', 'Printed', 'Paid', 'Call Not Pick', 'Later Call', 'Dont Call'].map((s, i) => ({ id: i+1, name: s })), []);
  const cols = useMemo(() => [
    { key: 'id', label: 'S.No' },
    { key: 'name', label: 'Status Name', render: val => <Badge status={val} /> },
    { key: 'actions', label: 'Actions', render: () => <button className="p-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded transition-colors"><Trash className="w-4 h-4"/></button> }
  ], []);
  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <PageHeader title="Order Status Management" icon={ClipboardEdit} />
      <DataTable columns={cols} data={statuses} actions={<Button icon={Plus}>Add Status</Button>} exportable={false} />
    </div>
  );
};

export default OrderStatusPage;
