import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCheck,
  Eye,
  LoaderCircle,
  Mail,
  MessageSquare,
  Phone,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/FormFields';
import { apiRequest } from '../../lib/api';

const DEFAULT_FILTERS = {
  search: '',
  readStatus: 'All',
  dateRange: 'All',
};

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

const formatDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const createDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateRangeFilters = (dateRange) => {
  const today = new Date();

  if (dateRange === 'Today') {
    const dateValue = createDateValue(today);
    return { start_date: dateValue, end_date: dateValue };
  }

  if (dateRange === 'This Week') {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    return { start_date: createDateValue(startDate), end_date: createDateValue(today) };
  }

  return {};
};

const getStatusChipClass = (isRead) =>
  isRead
    ? 'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300'
    : 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300';

const getWhatsAppLink = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
};

const EnquiriesPage = () => {
  const { addToast } = useToast();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [enquiries, setEnquiries] = useState([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const buildQueryString = useCallback((nextFilters) => {
    const query = new URLSearchParams();
    const trimmedSearch = nextFilters.search.trim();

    if (trimmedSearch) {
      query.set('search', trimmedSearch);
    }

    if (nextFilters.readStatus === 'Unread') {
      query.set('is_read', '0');
    }

    if (nextFilters.readStatus === 'Read') {
      query.set('is_read', '1');
    }

    const dateFilters = getDateRangeFilters(nextFilters.dateRange);
    if (dateFilters.start_date) {
      query.set('start_date', dateFilters.start_date);
    }
    if (dateFilters.end_date) {
      query.set('end_date', dateFilters.end_date);
    }

    return query.toString();
  }, []);

  const loadEnquiries = useCallback(
    async (nextFilters = DEFAULT_FILTERS, { showLoader = false } = {}) => {
      try {
        setErrorMessage('');
        if (showLoader) setIsLoading(true);
        else setIsRefreshing(true);

        const queryString = buildQueryString(nextFilters);
        const response = await apiRequest(`/settings/enquiries${queryString ? `?${queryString}` : ''}`);
        const nextEnquiries = (response.data || []).map((enquiry) => ({
          ...enquiry,
          is_read: Number(enquiry.is_read || 0),
        }));

        setEnquiries(nextEnquiries);
        setSelectedEnquiry((current) => {
          if (!current?.id) {
            return current;
          }

          return nextEnquiries.find((enquiry) => enquiry.id === current.id) || null;
        });
      } catch (error) {
        const nextErrorMessage = error.message || 'Unable to load enquiries.';
        setErrorMessage(nextErrorMessage);
        addToast(nextErrorMessage, 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast, buildQueryString]
  );

  useEffect(() => {
    loadEnquiries(DEFAULT_FILTERS, { showLoader: true });
  }, [loadEnquiries]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadEnquiries(filters);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    loadEnquiries(DEFAULT_FILTERS);
  };

  const handleToggleRead = async (enquiry, nextReadState) => {
    try {
      setIsSaving(true);
      await apiRequest(`/settings/enquiries/${enquiry.id}/read`, {
        method: 'PUT',
        body: { is_read: nextReadState },
      });

      addToast(`Enquiry marked as ${nextReadState ? 'read' : 'unread'}.`);
      await loadEnquiries(filters);
    } catch (error) {
      addToast(error.message || 'Unable to update enquiry status.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (enquiry) => {
    const confirmed = window.confirm(`Delete enquiry from "${enquiry.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      await apiRequest(`/settings/enquiries/${enquiry.id}`, { method: 'DELETE' });
      if (selectedEnquiry?.id === enquiry.id) {
        setSelectedEnquiry(null);
      }
      addToast('Enquiry deleted successfully.');
      await loadEnquiries(filters);
    } catch (error) {
      addToast(error.message || 'Unable to delete enquiry.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const summary = useMemo(() => {
    const todayKey = createDateValue(new Date());
    const unreadCount = enquiries.filter((enquiry) => enquiry.is_read === 0).length;
    const todayCount = enquiries.filter((enquiry) => formatDateKey(enquiry.created_at) === todayKey).length;
    const latestEnquiryTime = enquiries.length > 0 ? enquiries[0].created_at : null;

    return {
      total: enquiries.length,
      unread: unreadCount,
      today: todayCount,
      latestEnquiryTime,
    };
  }, [enquiries]);

  const tableRows = useMemo(
    () =>
      enquiries.map((enquiry) => ({
        ...enquiry,
        statusLabel: enquiry.is_read ? 'Read' : 'New',
        receivedAt: formatDateTime(enquiry.created_at),
        messagePreview: enquiry.message,
      })),
    [enquiries]
  );

  const columns = useMemo(
    () => [
      {
        key: 'statusLabel',
        label: 'Status',
        render: (value, row) => (
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClass(row.is_read)}`}>
            {value}
          </span>
        ),
      },
      {
        key: 'receivedAt',
        label: 'Received',
        render: (value) => <span className="text-slate-600 dark:text-slate-400">{value}</span>,
      },
      {
        key: 'name',
        label: 'Name',
        render: (value) => <span className="font-semibold text-slate-800 dark:text-white">{value}</span>,
      },
      {
        key: 'phone',
        label: 'Phone',
        render: (value) => <span className="text-slate-600 dark:text-slate-300">{value || '-'}</span>,
      },
      {
        key: 'email',
        label: 'Email',
        render: (value) => <span className="text-slate-600 dark:text-slate-300">{value || '-'}</span>,
      },
      {
        key: 'messagePreview',
        label: 'Message',
        render: (value) => (
          <span className="block max-w-xs truncate text-slate-700 dark:text-slate-300">
            {value}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedEnquiry(row)}
              className="rounded bg-sky-50 p-1.5 text-sky-600 transition-colors hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
              title="View enquiry"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleToggleRead(row, row.is_read === 1 ? 0 : 1)}
              className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              title={row.is_read ? 'Mark as unread' : 'Mark as read'}
              disabled={isSaving}
            >
              <CheckCheck className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="rounded bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              title="Delete enquiry"
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete, handleToggleRead, isSaving]
  );

  const summaryCards = useMemo(
    () => [
      {
        title: 'Total Enquiries',
        value: String(summary.total),
        icon: MessageSquare,
        valueClass: 'text-slate-900 dark:text-white',
      },
      {
        title: 'Unread Enquiries',
        value: String(summary.unread),
        icon: Mail,
        valueClass: 'text-amber-600 dark:text-amber-400',
      },
      {
        title: 'Today Enquiries',
        value: String(summary.today),
        icon: UserRound,
        valueClass: 'text-slate-900 dark:text-white',
      },
      {
        title: 'Latest Enquiry',
        value: summary.latestEnquiryTime ? formatDateTime(summary.latestEnquiryTime) : 'No enquiries',
        icon: RefreshCcw,
        valueClass: 'text-slate-900 dark:text-white text-base',
      },
    ],
    [summary]
  );

  const hasActiveFilters =
    filters.search.trim().length > 0 || filters.readStatus !== 'All' || filters.dateRange !== 'All';

  const emptyStateTitle = hasActiveFilters ? 'No enquiries match current filters' : 'No enquiries yet';
  const emptyStateDescription = hasActiveFilters
    ? 'Try clearing the search or filters to see more incoming enquiries.'
    : 'New website contact enquiries will appear here once customers start reaching out.';

  const selectedWhatsAppLink = getWhatsAppLink(selectedEnquiry?.phone);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Contact Enquiries"
        icon={MessageSquare}
        subtitle="Review website enquiries, open full details, and keep the inbox under control."
        badge={`${summary.total} enquiries`}
        action={
          <Button variant="secondary" icon={RefreshCcw} onClick={() => loadEnquiries(filters)} disabled={isRefreshing || isSaving}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
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

      <Card className="space-y-4">
        <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Name, phone, email, message"
          />
          <Select
            label="Read Status"
            name="readStatus"
            value={filters.readStatus}
            onChange={handleFilterChange}
            options={['All', 'Unread', 'Read']}
          />
          <Select
            label="Date Range"
            name="dateRange"
            value={filters.dateRange}
            onChange={handleFilterChange}
            options={['All', 'Today', 'This Week']}
          />
          <div className="flex gap-3">
            <Button className="w-full sm:w-auto" icon={Search} onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button className="w-full sm:w-auto" variant="secondary" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading enquiries...</span>
          </div>
        </div>
      ) : errorMessage && enquiries.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Unable to load enquiries</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
            </div>
            <Button onClick={() => loadEnquiries(filters, { showLoader: true })}>Retry</Button>
          </div>
        </Card>
      ) : enquiries.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{emptyStateTitle}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{emptyStateDescription}</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <DataTable
                columns={columns}
                data={tableRows}
                exportFileName="contact-enquiries"
                showSearch={false}
                getRowClassName={(row) =>
                  row.is_read === 0
                    ? 'bg-amber-50/70 dark:bg-amber-500/[0.08]'
                    : ''
                }
              />
            </Card>
          </div>

          <div className="space-y-4 md:hidden">
            {enquiries.map((enquiry) => (
              <Card
                key={enquiry.id}
                className={enquiry.is_read === 0 ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/[0.06]' : ''}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{enquiry.name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(enquiry.created_at)}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClass(enquiry.is_read)}`}>
                      {enquiry.is_read ? 'Read' : 'New'}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <p>{enquiry.phone || '-'}</p>
                    <p>{enquiry.email || '-'}</p>
                    <p className="line-clamp-3 text-slate-700 dark:text-slate-300">{enquiry.message}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" className="flex-1" icon={Eye} onClick={() => setSelectedEnquiry(enquiry)}>
                      View
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      icon={CheckCheck}
                      onClick={() => handleToggleRead(enquiry, enquiry.is_read === 1 ? 0 : 1)}
                      disabled={isSaving}
                    >
                      {enquiry.is_read ? 'Mark Unread' : 'Mark Read'}
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full"
                      icon={Trash2}
                      onClick={() => handleDelete(enquiry)}
                      disabled={isSaving}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        isOpen={Boolean(selectedEnquiry)}
        onClose={() => setSelectedEnquiry(null)}
        title={selectedEnquiry ? `Enquiry from ${selectedEnquiry.name}` : 'Enquiry Details'}
        maxWidthClass="max-w-3xl"
      >
        {!selectedEnquiry ? null : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Status</p>
                <div className="mt-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClass(selectedEnquiry.is_read)}`}>
                    {selectedEnquiry.is_read ? 'Read' : 'New'}
                  </span>
                </div>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Received</p>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{formatDateTime(selectedEnquiry.created_at)}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Phone</p>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{selectedEnquiry.phone || '-'}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Email</p>
                <p className="mt-3 break-all text-sm font-semibold text-slate-900 dark:text-white">{selectedEnquiry.email || '-'}</p>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <Card title="Contact Details">
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedEnquiry.name}</p>
                  <p>{selectedEnquiry.phone || 'No phone shared'}</p>
                  <p className="break-all">{selectedEnquiry.email || 'No email shared'}</p>
                </div>
              </Card>

              <Card title="Full Message">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
                  {selectedEnquiry.message || '-'}
                </p>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              {selectedEnquiry.phone ? (
                <a
                  href={`tel:${selectedEnquiry.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  Call Customer
                </a>
              ) : null}

              {selectedEnquiry.email ? (
                <a
                  href={`mailto:${selectedEnquiry.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <Mail className="h-4 w-4" />
                  Email Customer
                </a>
              ) : null}

              {selectedWhatsAppLink ? (
                <a
                  href={selectedWhatsAppLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 font-medium text-emerald-700 shadow-sm transition-all duration-300 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </a>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                icon={CheckCheck}
                onClick={() => handleToggleRead(selectedEnquiry, selectedEnquiry.is_read === 1 ? 0 : 1)}
                disabled={isSaving}
              >
                {selectedEnquiry.is_read ? 'Mark as Unread' : 'Mark as Read'}
              </Button>
              <Button variant="danger" icon={Trash2} onClick={() => handleDelete(selectedEnquiry)} disabled={isSaving}>
                Delete Enquiry
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnquiriesPage;
