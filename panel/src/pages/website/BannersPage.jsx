import { useState, useMemo } from 'react';
import { Image as ImageIcon, Edit, Trash, Plus, UploadCloud } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/FormFields';

const BannersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();
  
  const banners = useMemo(() => Array.from({length: 4}).map((_, i) => ({
    id: i+1, name: `Diwali Offer ${i+1}`, image: `https://picsum.photos/seed/ban${i}/800/200`, status: 'Active'
  })), []);

  const cols = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'image', label: 'Image Preview', render: (val) => <img src={val} className="h-12 w-32 object-cover rounded border border-slate-200 dark:border-white/10 shadow-sm" alt="Banner" /> },
    { key: 'name', label: 'Banner Name', render: (val) => <span className="font-medium text-slate-800 dark:text-white">{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <Badge status={val === 'Active' ? 'Paid' : 'Pending'} /> },
    { key: 'actions', label: 'Actions', render: () => (
      <div className="flex gap-2">
        <button onClick={() => setIsModalOpen(true)} className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><Edit className="w-4 h-4"/></button>
        <button className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"><Trash className="w-4 h-4"/></button>
      </div>
    )}
  ], []);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Home Banners" icon={ImageIcon} />
      <DataTable columns={cols} data={banners} actions={<Button icon={Plus} onClick={() => setIsModalOpen(true)}>Add Banner</Button>} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Banner">
        <div className="space-y-4">
          <Input label="Banner Name" defaultValue="Diwali Offer" />
          <div className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-lg p-8 text-center bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors cursor-pointer">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Drag & drop image here or click to browse</p>
          </div>
          <Button className="w-full" onClick={() => { setIsModalOpen(false); addToast('Banner saved'); }}>Save Changes</Button>
        </div>
      </Modal>
    </div>
  );
};

export default BannersPage;
