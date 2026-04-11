import { useMemo } from 'react';
import { List, Edit, Trash, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';

const CategoriesPage = () => {
  const cols = useMemo(() => [
    { key: 'id', label: 'S.No' },
    { key: 'dataId', label: 'Data ID', render: (val) => <span className="font-mono text-slate-500 dark:text-slate-400">{val}</span> },
    { key: 'name', label: 'Category Name', render: (val) => <span className="font-medium text-slate-800 dark:text-white">{val}</span> },
    { key: 'actions', label: 'Actions', render: () => (
      <div className="flex gap-2">
        <button className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><Edit className="w-4 h-4"/></button>
        <button className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"><Trash className="w-4 h-4"/></button>
      </div>
    )}
  ], []);
  const data = useMemo(() => ['Sparklers', 'Rockets', 'Fountains', 'Bombs'].map((n, i) => ({ id: i+1, dataId: `CAT-0${i+1}`, name: n })), []);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Categories" icon={List} />
      <DataTable columns={cols} data={data} actions={<Button icon={Plus}>Add Category</Button>} />
    </div>
  );
};

export default CategoriesPage;
