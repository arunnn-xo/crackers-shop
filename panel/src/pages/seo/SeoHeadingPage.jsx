import { useMemo } from 'react';
import { Type, Edit, Trash, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';

const SeoHeadingPage = () => {
  const cols = useMemo(() => [
    { key: 'id', label: 'S.No' },
    { key: 'name', label: 'Name', render: val => <span className="font-medium text-slate-800 dark:text-white">{val}</span> },
    { key: 'actions', label: 'Actions', render: () => (
      <div className="flex gap-2">
        <button className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded transition-colors"><Edit className="w-4 h-4"/></button>
        <button className="p-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded transition-colors"><Trash className="w-4 h-4"/></button>
      </div>
    )}
  ], []);
  const data = useMemo(() => [{ id: 1, name: 'Home Page' }, { id: 2, name: 'Products Page' }], []);
  return <div className="space-y-6 fade-in"><PageHeader title="SEO Heading" icon={Type} /><DataTable columns={cols} data={data} actions={<Button icon={Plus}>Add SEO Heading</Button>} /></div>;
};

export default SeoHeadingPage;
