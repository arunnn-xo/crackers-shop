import { useMemo } from 'react';
import { Package, Edit, Trash, Plus, Award, UploadCloud } from 'lucide-react';
import { MOCK_PRODUCTS } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const ProductsPage = () => {
  const cols = useMemo(() => [
    { key: 'image', label: 'Image', render: (val) => <img src={val} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 shadow-sm" alt="product"/> },
    { key: 'category', label: 'Category', render: (val) => <span className="text-slate-500 dark:text-slate-400">{val}</span> },
    { key: 'name', label: 'Product Name', render: (val) => <span className="font-semibold text-slate-800 dark:text-white">{val}</span> },
    { key: 'price', label: 'Price', render: (val) => <span className="line-through text-slate-400 dark:text-slate-500">₹{val}</span> },
    { key: 'salePrice', label: 'Sale Price', render: (val) => <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{val}</span> },
    { key: 'unit', label: 'Content/Unit' },
    { key: 'stock', label: 'Stock', render: (val) => <Badge status={val} /> },
    { key: 'actions', label: 'Actions', render: () => (
      <div className="flex gap-2">
        <button className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><Edit className="w-4 h-4"/></button>
        <button className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"><Trash className="w-4 h-4"/></button>
      </div>
    )}
  ], []);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader 
        title="Products" 
        icon={Package} 
        badge="142 items"
        action={
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hidden sm:flex shadow-sm">
            <Award className="w-5 h-5"/> Global Discount: 15%
          </div>
        } 
      />
      <DataTable 
        columns={cols} 
        data={MOCK_PRODUCTS} 
        actions={
          <>
            <Button variant="secondary" icon={Award}>Set Discount</Button>
            <Button variant="secondary" icon={UploadCloud}>Bulk Upload</Button>
            <Button variant="danger" icon={Trash}>Delete All</Button>
            <Button icon={Plus}>Add Product</Button>
          </>
        } 
      />
    </div>
  );
};

export default ProductsPage;
