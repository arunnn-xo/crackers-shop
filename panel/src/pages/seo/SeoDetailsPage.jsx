import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit, FileSearch, LoaderCircle, Plus, RefreshCcw, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiRequest } from '../../lib/api';

const SeoDetailsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [seoDetails, setSeoDetails] = useState([]);
  const [seoHeadings, setSeoHeadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadSeoDetailsPageData = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        setErrorMessage('');
        if (showLoader) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const [seoDetailsResponse, seoHeadingsResponse] = await Promise.all([
          apiRequest('/settings/seo-details'),
          apiRequest('/settings/seo-headings'),
        ]);

        setSeoDetails(seoDetailsResponse.data || []);
        setSeoHeadings(seoHeadingsResponse.data || []);
      } catch (error) {
        const nextMessage = error.message || 'Unable to load SEO details.';
        setErrorMessage(nextMessage);
        addToast(nextMessage, 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    loadSeoDetailsPageData({ showLoader: true });
  }, [loadSeoDetailsPageData]);

  const openCreateModal = () => {
    if (seoHeadings.length === 0) {
      addToast('Create at least one SEO heading before adding SEO details.', 'error');
      return;
    }

    navigate('/seo/details/new');
  };

  const handleDelete = async (seoDetail) => {
    const confirmed = window.confirm(`Delete SEO detail "${seoDetail.meta_title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      await apiRequest(`/settings/seo-details/${seoDetail.id}`, {
        method: 'DELETE',
      });
      addToast('SEO detail deleted successfully.');
      await loadSeoDetailsPageData();
    } catch (error) {
      addToast(error.message || 'Unable to delete SEO detail.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tableRows = useMemo(
    () =>
      seoDetails.map((seoDetail, index) => ({
        ...seoDetail,
        serial: index + 1,
        pageNameLabel: seoDetail.heading_page_name || seoDetail.page_name || '-',
      })),
    [seoDetails]
  );

  const columns = useMemo(
    () => [
      { key: 'serial', label: 'S.No' },
      {
        key: 'meta_title',
        label: 'Meta Title',
        render: (value) => <span className="font-medium text-slate-800 dark:text-white">{value}</span>,
      },
      {
        key: 'meta_description',
        label: 'Meta Des',
        render: (value) => <span className="block max-w-xs truncate text-slate-600 dark:text-slate-400">{value}</span>,
      },
      {
        key: 'meta_keywords',
        label: 'Meta key',
        render: (value) => (
          <span className="line-clamp-2 text-xs font-medium text-slate-600 dark:text-slate-400">{value}</span>
        ),
      },
      {
        key: 'name',
        label: 'Name',
        render: (value, row) => (
          <div className="space-y-1">
            <span className="block font-medium text-slate-800 dark:text-white">{value}</span>
            <span className="block text-xs text-slate-400 dark:text-slate-500">{row.pageNameLabel}</span>
          </div>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        render: (value) => <span className="block max-w-xs truncate text-slate-600 dark:text-slate-400">{value}</span>,
      },
      {
        key: 'actions',
        label: 'Action',
        render: (_, row) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/seo/details/${row.id}/edit`)}
              className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              title={`Edit ${row.meta_title}`}
              disabled={isSaving}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="rounded bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              title={`Delete ${row.meta_title}`}
              disabled={isSaving}
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete, isSaving, navigate]
  );

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="SEO Details"
        icon={FileSearch}
        subtitle="Manage per-page SEO metadata, support text, image content, and canonical links."
        badge={`${seoDetails.length} records`}
        action={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={RefreshCcw}
              onClick={() => loadSeoDetailsPageData()}
              disabled={isRefreshing || isSaving}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button icon={Plus} onClick={openCreateModal} disabled={isSaving}>
              Add SEO
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading SEO details...</span>
          </div>
        </div>
      ) : errorMessage && tableRows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Unable to load SEO details</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
            </div>
            <Button onClick={() => loadSeoDetailsPageData({ showLoader: true })}>Retry</Button>
          </div>
        </Card>
      ) : tableRows.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">No SEO details added yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add the first SEO record to manage metadata, URLs, and footer content for your pages.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={tableRows}
            exportVariant="buttons"
            showColumnVisibility
            exportFileName="seo-details"
            searchPlaceholder="Search SEO details..."
          />
        </Card>
      )}
    </div>
  );
};

export default SeoDetailsPage;
