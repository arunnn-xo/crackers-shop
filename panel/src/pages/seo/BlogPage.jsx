import { useMemo } from 'react';
import { PenTool, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';

const BlogPage = () => {
  const cols = useMemo(() => [
    { key: 'title', label: 'Blog Title', render: val => <span className="font-medium text-slate-800 dark:text-white">{val}</span> },
    { key: 'meta', label: 'Meta Title', render: val => <span className="text-slate-600 dark:text-slate-400">{val}</span> },
    { key: 'date', label: 'Date', render: val => <span className="text-slate-500 dark:text-slate-500">{val}</span> }
  ], []);
  const data = useMemo(() => [{ title: 'Safety Tips for Diwali', meta: 'Diwali Crackers Safety', date: 'Oct 15, 2023' }], []);
  return <div className="space-y-6 fade-in"><PageHeader title="Blog Management" icon={PenTool} /><DataTable columns={cols} data={data} actions={<Button icon={Plus}>Add Blog</Button>} /></div>;
};

export default BlogPage;
