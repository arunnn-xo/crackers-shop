import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ClipboardEdit, Edit, LoaderCircle, Plus, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiRequest } from '../../lib/api';

const OrderStatusPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  const loadStatuses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/settings/order-statuses');
      setStatuses(response.data || []);
    } catch (error) {
      addToast(error.message || 'Unable to load order statuses.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const handleDelete = async (status) => {
    const confirmed = window.confirm(`Delete status "${status.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingId(status.id);
      await apiRequest(`/settings/order-statuses/${status.id}`, { method: 'DELETE' });
      addToast('Order status deleted successfully.');
      await loadStatuses();
    } catch (error) {
      addToast(error.message || 'Unable to delete order status.', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleMove = async (statusId, direction) => {
    const currentIndex = statuses.findIndex((status) => status.id === statusId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= statuses.length) {
      return;
    }

    const nextStatuses = [...statuses];
    [nextStatuses[currentIndex], nextStatuses[nextIndex]] = [nextStatuses[nextIndex], nextStatuses[currentIndex]];

    const payload = nextStatuses.map((status, index) => ({
      id: status.id,
      sort_order: index + 1,
    }));

    try {
      setIsReordering(true);
      setStatuses(
        nextStatuses.map((status, index) => ({
          ...status,
          sort_order: index + 1,
        }))
      );

      await apiRequest('/settings/order-statuses/reorder', {
        method: 'PUT',
        body: { statuses: payload },
      });

      addToast('Order status order updated.');
      await loadStatuses();
    } catch (error) {
      addToast(error.message || 'Unable to reorder statuses.', 'error');
      await loadStatuses();
    } finally {
      setIsReordering(false);
    }
  };

  const tableRows = useMemo(
    () =>
      statuses.map((status, index) => ({
        ...status,
        serial: index + 1,
        usageCount: Number(status.usage_count || 0),
      })),
    [statuses]
  );

  const columns = useMemo(
    () => [
      { key: 'serial', label: 'S.No' },
      {
        key: 'name',
        label: 'Status Name',
        render: (value) => <Badge status={value} />,
      },
      {
        key: 'color',
        label: 'Color',
        render: (value) => (
          <div className="flex items-center gap-3">
            <span
              className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10"
              style={{ backgroundColor: `${value || '#64748b'}22`, borderColor: value || '#64748b', color: value || '#64748b' }}
            >
              {value || '#64748b'}
            </span>
            <span
              className="h-5 w-5 rounded-full border border-white/10 shadow-sm"
              style={{ backgroundColor: value || '#64748b' }}
            />
          </div>
        ),
      },
      {
        key: 'sort_order',
        label: 'Sort Order',
        render: (value) => <span className="font-medium text-slate-700 dark:text-slate-300">{value}</span>,
      },
      {
        key: 'usageCount',
        label: 'Used By Orders',
        render: (value) => (
          <span className="font-medium text-slate-700 dark:text-slate-300">{value}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleMove(row.id, -1)}
              disabled={isReordering || row.serial === 1}
              className="rounded bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              title="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleMove(row.id, 1)}
              disabled={isReordering || row.serial === statuses.length}
              className="rounded bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              title="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate(`/orders/status/${row.id}/edit`)}
              className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              title="Edit status"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row)}
              disabled={isDeletingId === row.id || row.usageCount > 0}
              className="rounded bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              title={row.usageCount > 0 ? 'Status is used by existing orders' : 'Delete status'}
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [isDeletingId, isReordering, navigate, statuses.length]
  );

  return (
    <div className="space-y-6 fade-in max-w-6xl">
      <PageHeader
        title="Order Status Management"
        icon={ClipboardEdit}
        subtitle="Manage the shared status list used across billing and order workflows."
        badge={`${statuses.length} statuses`}
        action={
          <Button icon={Plus} onClick={() => navigate('/orders/status/new')}>
            Add Status
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading order statuses...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableRows}
          exportable={false}
          searchPlaceholder="Search order statuses..."
        />
      )}
    </div>
  );
};

export default OrderStatusPage;
