import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Edit, Trash, Plus, LoaderCircle, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiRequest, getAssetUrl } from '../../lib/api';

const BannersPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/banners');
      setBanners(response.data || []);
    } catch (error) {
      addToast(error.message || 'Unable to load banners.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const handleDelete = async (banner) => {
    const confirmed = window.confirm(`Delete banner "${banner.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/banners/${banner.id}`, { method: 'DELETE' });
      addToast('Banner deleted successfully.');
      await loadBanners();
    } catch (error) {
      addToast(error.message || 'Unable to delete banner.', 'error');
    }
  };

  const tableRows = useMemo(
    () =>
      banners.map((banner) => ({
        ...banner,
        imageUrl: getAssetUrl(banner.image),
        statusLabel: Number(banner.is_active) === 1 ? 'Active' : 'Inactive',
      })),
    [banners]
  );

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'imageUrl',
      label: 'Image',
      render: (value, row) => (
        <img
          src={value}
          className="h-14 w-28 rounded-lg border border-slate-200 object-cover shadow-sm dark:border-white/10"
          alt={row.name}
        />
      ),
    },
    {
      key: 'name',
      label: 'Banner Name',
      render: (value) => <span className="font-medium text-slate-800 dark:text-white">{value}</span>,
    },
    {
      key: 'link',
      label: 'Link',
      render: (value) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-[220px] items-center gap-2 truncate text-sm text-amber-600 hover:text-amber-500 dark:text-amber-400"
          >
            <LinkIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{value}</span>
          </a>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">No link</span>
        ),
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
            onClick={() => navigate(`/website/banners/${row.id}/edit`)}
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
        title="Home Banners"
        icon={ImageIcon}
        subtitle="Add, update, and reorder home page banners with live database sync."
        badge={`${banners.length} total`}
        action={
          <Button icon={Plus} onClick={() => navigate('/website/banners/new')} className="w-full sm:w-auto">
            Add Banner
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading banners...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableRows}
          searchPlaceholder="Search banners..."
          exportable={false}
        />
      )}
    </div>
  );
};

export default BannersPage;
