import { useCallback, useEffect, useMemo, useState } from 'react';
import { List, Edit, Trash, Plus, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiRequest } from '../../lib/api';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/categories');
      setCategories(response.data || []);
    } catch (error) {
      addToast(error.message || 'Unable to load categories.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDelete = async (category) => {
    const confirmed = window.confirm(`Delete category "${category.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/categories/${category.id}`, { method: 'DELETE' });
      addToast('Category deleted successfully.');
      await loadCategories();
    } catch (error) {
      addToast(error.message || 'Unable to delete category.', 'error');
    }
  };

  const tableRows = useMemo(
    () =>
      categories.map((category, index) => ({
        ...category,
        serial: index + 1,
        statusLabel: Number(category.is_active) === 1 ? 'Active' : 'Inactive',
      })),
    [categories]
  );

  const columns = [
    { key: 'serial', label: 'S.No' },
    {
      key: 'data_id',
      label: 'Data ID',
      render: (value) => <span className="font-mono text-slate-500 dark:text-slate-400">{value}</span>,
    },
    {
      key: 'name',
      label: 'Category Name',
      render: (value) => <span className="font-medium text-slate-800 dark:text-white">{value}</span>,
    },
    { key: 'sort_order', label: 'Order' },
    {
      key: 'statusLabel',
      label: 'Status',
      render: (value) => <Badge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/website/categories/${row.id}/edit`)}
            className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
            aria-label={`Edit ${row.name}`}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="rounded bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
            aria-label={`Delete ${row.name}`}
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Categories"
        icon={List}
        subtitle="Manage category master data with direct database sync."
        badge={`${categories.length} total`}
        action={
          <Button icon={Plus} onClick={() => navigate('/website/categories/new')} className="w-full sm:w-auto">
            Add Category
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading categories...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableRows}
          searchPlaceholder="Search categories..."
          exportable={false}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
