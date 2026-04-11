import { useMemo } from 'react';
import { FileSearch, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';

const SeoDetailsPage = () => {
  const cols = useMemo(() => [
    { key: 'name', label: 'Page Name', render: val => <span className="font-medium text-slate-800 dark:text-white">{val}</span> },
    { key: 'title', label: 'Meta Title', render: val => <span className="text-slate-600 dark:text-slate-400">{val}</span> },
    { key: 'desc', label: 'Meta Description', render: val => <span className="truncate w-48 block text-slate-500 dark:text-slate-500">{val}</span> },
    { key: 'key', label: 'Meta Keys', render: val => <span className="font-mono text-xs bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{val}</span> }
  ], []);
  const data = useMemo(() => [{ name: 'Home', title: 'Buy Best Crackers Online', desc: 'Premium quality fireworks from Sivakasi at best prices.', key: 'crackers, fireworks, diwali' }], []);
  return <div className="space-y-6 fade-in"><PageHeader title="SEO Details" icon={FileSearch} /><DataTable columns={cols} data={data} actions={<Button icon={Plus}>Add SEO Details</Button>} /></div>;
};

export default SeoDetailsPage;
