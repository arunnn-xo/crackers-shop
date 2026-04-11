import { useState, useMemo } from 'react';
import { Map, Edit, Trash, Plus, UploadCloud } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';

const GeographyPage = () => {
  const [activeTab, setActiveTab] = useState('States');
  const tabs = ['States', 'Cities', 'Areas'];
  
  const cols = useMemo(() => {
    if(activeTab === 'States') return [{ key: 'name', label: 'State Name', render: val => <span className="font-medium text-slate-800 dark:text-white">{val}</span> }, { key: 'actions', label: 'Actions', render:()=><div className="flex gap-2"><button className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><Edit className="w-4 h-4"/></button><button className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"><Trash className="w-4 h-4"/></button></div> }];
    if(activeTab === 'Cities') return [{ key: 'name', label: 'City Name', render: val => <span className="font-medium text-slate-800 dark:text-white">{val}</span> }, { key: 'state', label: 'State', render: val => <span className="text-slate-500 dark:text-slate-400">{val}</span> }, { key: 'code', label: 'City Code', render: val => <span className="font-mono font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">{val}</span> }, { key: 'actions', label: 'Actions', render:()=><div className="flex gap-2"><button className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><Edit className="w-4 h-4"/></button></div> }];
    return [{ key: 'name', label: 'Area Name', render: val => <span className="font-medium text-slate-800 dark:text-white">{val}</span> }, { key: 'city', label: 'City', render: val => <span className="text-slate-500 dark:text-slate-400">{val}</span> }, { key: 'pin', label: 'Pincode', render: val => <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{val}</span> }, { key: 'actions', label: 'Actions', render:()=><div className="flex gap-2"><button className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><Edit className="w-4 h-4"/></button></div> }];
  }, [activeTab]);

  const data = useMemo(() => {
    if(activeTab === 'States') return [{ name: 'Tamil Nadu' }, { name: 'Kerala' }, { name: 'Karnataka' }];
    if(activeTab === 'Cities') return [{ name: 'Coimbatore', state: 'Tamil Nadu', code: 'CBE' }, { name: 'Sivakasi', state: 'Tamil Nadu', code: 'SVK' }];
    return [{ name: 'Gandhipuram', city: 'Coimbatore', pin: '641012' }, { name: 'Town Hall', city: 'Coimbatore', pin: '641001' }];
  }, [activeTab]);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Geography Setup" icon={Map} />
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-px">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === t ? 'border-amber-500 text-amber-600 dark:text-amber-400 dark:bg-amber-500/10 bg-amber-50' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}>{t}</button>
        ))}
      </div>
      <DataTable 
        columns={cols} 
        data={data} 
        actions={<><Button variant="secondary" icon={UploadCloud}>Bulk Upload</Button><Button icon={Plus}>Add {activeTab.slice(0,-1)}</Button></>}
      />
    </div>
  );
};

export default GeographyPage;
