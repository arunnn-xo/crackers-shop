import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Edit,
  Eye,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Power,
  RefreshCcw,
  Star,
  Trash,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/FormFields';
import { apiRequest, getAssetUrl } from '../../lib/api';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const BrandsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadBrands = useCallback(
    async (nextSearch = '', { showLoader = false } = {}) => {
      try {
        setErrorMessage('');
        if (showLoader) setIsLoading(true);
        else setIsRefreshing(true);

        const query = new URLSearchParams();
        if (nextSearch.trim()) {
          query.set('search', nextSearch.trim());
        }

        const response = await apiRequest(`/settings/brands${query.toString() ? `?${query.toString()}` : ''}`);
        setBrands(response.data || []);
      } catch (error) {
        const nextErrorMessage = error.message || 'Unable to load brand logos.';
        setErrorMessage(nextErrorMessage);
        addToast(nextErrorMessage, 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    loadBrands('', { showLoader: true });
  }, [loadBrands]);

  const handleSearchApply = () => {
    loadBrands(search);
  };

  const handleSearchReset = () => {
    setSearch('');
    loadBrands('');
  };

  const handleDelete = async (brand) => {
    const confirmed = window.confirm(`Delete brand "${brand.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      await apiRequest(`/settings/brands/${brand.id}`, { method: 'DELETE' });
      addToast('Brand deleted successfully.');
      await loadBrands(search);
    } catch (error) {
      addToast(error.message || 'Unable to delete brand.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (brand) => {
    try {
      setIsSaving(true);
      await apiRequest(`/settings/brands/${brand.id}`, {
        method: 'PUT',
        body: {
          name: brand.name,
          logo: brand.logo,
          sort_order: brand.sort_order,
          is_active: Number(brand.is_active) === 1 ? 0 : 1,
        },
      });
      addToast(`Brand ${Number(brand.is_active) === 1 ? 'deactivated' : 'activated'} successfully.`);
      await loadBrands(search);
    } catch (error) {
      addToast(error.message || 'Unable to update brand status.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const enrichedBrands = useMemo(
    () =>
      brands.map((brand) => ({
        ...brand,
        logoUrl: getAssetUrl(brand.logo),
        statusLabel: Number(brand.is_active) === 1 ? 'Active' : 'Inactive',
        createdLabel: formatDateTime(brand.created_at),
      })),
    [brands]
  );

  const summary = useMemo(() => {
    const activeCount = enrichedBrands.filter((brand) => Number(brand.is_active) === 1).length;
    const inactiveCount = enrichedBrands.length - activeCount;
    const latestBrand = [...enrichedBrands]
      .sort((left, right) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime())[0];

    return {
      total: enrichedBrands.length,
      active: activeCount,
      inactive: inactiveCount,
      latestBrand: latestBrand?.name || 'No brands',
    };
  }, [enrichedBrands]);

  const columns = useMemo(
    () => [
      {
        key: 'logoUrl',
        label: 'Logo',
        render: (value, row) => (
          <div className="flex h-16 w-28 items-center justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0f0f15]">
            <img src={value} alt={row.name} className="max-h-full max-w-full object-contain" />
          </div>
        ),
      },
      {
        key: 'name',
        label: 'Brand Name',
        render: (value) => <span className="font-semibold text-slate-800 dark:text-white">{value}</span>,
      },
      {
        key: 'sort_order',
        label: 'Order',
      },
      {
        key: 'statusLabel',
        label: 'Status',
        render: (value) => <Badge status={value} />,
      },
      {
        key: 'createdLabel',
        label: 'Added',
        render: (value) => <span className="text-slate-600 dark:text-slate-400">{value}</span>,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/report/brands/${row.id}/edit`)}
              className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              title={`Edit ${row.name}`}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleToggleStatus(row)}
              className="rounded bg-sky-50 p-1.5 text-sky-600 transition-colors hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
              title={Number(row.is_active) === 1 ? 'Deactivate brand' : 'Activate brand'}
              disabled={isSaving}
            >
              <Power className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="rounded bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              title={`Delete ${row.name}`}
              disabled={isSaving}
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete, handleToggleStatus, isSaving, navigate]
  );

  const summaryCards = [
    {
      title: 'Total Brands',
      value: String(summary.total),
      icon: Star,
      valueClass: 'text-slate-900 dark:text-white',
    },
    {
      title: 'Active Brands',
      value: String(summary.active),
      icon: Power,
      valueClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Inactive Brands',
      value: String(summary.inactive),
      icon: Eye,
      valueClass: 'text-slate-900 dark:text-white',
    },
    {
      title: 'Latest Added',
      value: summary.latestBrand,
      icon: ImageIcon,
      valueClass: 'text-slate-900 dark:text-white text-base',
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Brand Logos"
        icon={Star}
        subtitle="Manage trusted brand logos that appear on the customer-facing website."
        badge={`${summary.total} total`}
        action={
          <div className="flex gap-3">
            <Button variant="secondary" icon={RefreshCcw} onClick={() => loadBrands(search)} disabled={isRefreshing || isSaving}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button icon={Plus} onClick={() => navigate('/report/brands/new')}>
              Add Brand
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                <p className={`mt-3 font-bold ${card.valueClass}`}>{card.value}</p>
              </div>
              <div className="rounded-xl border border-amber-200/70 bg-amber-50 p-2.5 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <Input
                label="Search Brands"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by brand name"
              />
              <div className="flex flex-col justify-end gap-3 sm:flex-row md:justify-start">
                <Button className="w-full sm:w-auto" onClick={handleSearchApply}>
                  Search
                </Button>
                <Button className="w-full sm:w-auto" variant="secondary" onClick={handleSearchReset}>
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span>Loading brand logos...</span>
              </div>
            </div>
          ) : errorMessage && enrichedBrands.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Unable to load brand logos</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
                </div>
                <Button onClick={() => loadBrands(search, { showLoader: true })}>Retry</Button>
              </div>
            </Card>
          ) : enrichedBrands.length === 0 ? (
            <Card>
              <div className="py-10 text-center">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">No brand logos added yet</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add trusted brand marks here to display them on the customer website.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="hidden md:block">
                <Card>
                  <DataTable
                    columns={columns}
                    data={enrichedBrands}
                    exportable={false}
                    showSearch={false}
                  />
                </Card>
              </div>

              <div className="space-y-4 md:hidden">
                {enrichedBrands.map((brand) => (
                  <Card key={brand.id} className={Number(brand.is_active) === 1 ? '' : 'opacity-80'}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-20 items-center justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0f0f15]">
                            <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{brand.name}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sort order: {brand.sort_order}</p>
                            <div className="mt-2">
                              <Badge status={brand.statusLabel} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" className="flex-1" icon={Edit} onClick={() => navigate(`/report/brands/${brand.id}/edit`)}>
                          Edit
                        </Button>
                        <Button variant="secondary" className="flex-1" icon={Power} onClick={() => handleToggleStatus(brand)} disabled={isSaving}>
                          {Number(brand.is_active) === 1 ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="danger" className="w-full" icon={Trash} onClick={() => handleDelete(brand)} disabled={isSaving}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <Card title="Website Preview" icon={Eye} className="h-fit">
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Active brand logos will appear in this kind of trust strip on the customer website.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Trusted Brands</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {enrichedBrands.filter((brand) => Number(brand.is_active) === 1).slice(0, 6).map((brand) => (
                  <div key={brand.id} className="flex h-16 items-center justify-center rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#0f0f15]">
                    <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
                  </div>
                ))}
                {enrichedBrands.filter((brand) => Number(brand.is_active) === 1).length === 0 ? (
                  <div className="col-span-2 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400 dark:border-white/15 dark:text-slate-500">
                    Activate brands to preview how they will show on the website.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BrandsPage;
