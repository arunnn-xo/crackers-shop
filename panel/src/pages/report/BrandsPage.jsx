import { Star, Edit, Trash, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';

const BrandsPage = () => {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Brand Logos" icon={Star} action={<Button icon={Plus}>Add Brand</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#13131a] p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col items-center gap-3 relative group hover:shadow-md transition-shadow">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button className="p-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded text-slate-600 dark:text-white transition-colors"><Edit className="w-3 h-3"/></button>
              <button className="p-1 bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 rounded transition-colors"><Trash className="w-3 h-3"/></button>
            </div>
            <img src={`https://picsum.photos/seed/brand${i}/100/100`} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-white/10 shadow-sm" alt="Brand" />
            <span className="text-sm font-semibold text-slate-800 dark:text-white">Brand {i+1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandsPage;
