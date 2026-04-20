import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, LoaderCircle, RefreshCcw, Search, ShoppingBasket, Users, Wallet } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';
import { apiRequest } from '../../lib/api';

const REPORT_LIMIT = 10;
const DEFAULT_FILTERS = { start_date: '', end_date: '' };

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
};

const TopCustomersPage = () => {
  const { addToast } = useToast();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    customer_count: 0,
    total_orders: 0,
    total_value: 0,
    top_customer_name: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const buildQueryString = useCallback((nextFilters) => {
    const query = new URLSearchParams({ limit: String(REPORT_LIMIT) });
    if (nextFilters.start_date) query.set('start_date', nextFilters.start_date);
    if (nextFilters.end_date) query.set('end_date', nextFilters.end_date);
    return query.toString();
  }, []);

  const loadReport = useCallback(
    async (nextFilters = DEFAULT_FILTERS, { showLoader = false } = {}) => {
      try {
        setErrorMessage('');
        if (showLoader) setIsLoading(true);
        else setIsRefreshing(true);

        const response = await apiRequest(`/customers/top?${buildQueryString(nextFilters)}`);
        setCustomers(response.data || []);
        setSummary(
          response.summary || {
            customer_count: 0,
            total_orders: 0,
            total_value: 0,
            top_customer_name: null,
          }
        );
        setFilters({
          start_date: response.filters?.start_date || '',
          end_date: response.filters?.end_date || '',
        });
      } catch (error) {
        const nextErrorMessage = error.message || 'Unable to load top customers report.';
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
    loadReport(DEFAULT_FILTERS, { showLoader: true });
  }, [loadReport]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadReport(filters);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    loadReport(DEFAULT_FILTERS);
  };

  const tableData = useMemo(
    () =>
      customers.map((customer, index) => ({
        customer_id: customer.customer_id,
        rank: index + 1,
        customer: customer.name,
        customer_meta: [customer.phone, customer.city].filter(Boolean).join(' • '),
        total_orders: customer.total_orders,
        total_value: formatCurrency(customer.total_value),
        last_order_date: formatDate(customer.last_order_date),
      })),
    [customers]
  );

  const columns = useMemo(
    () => [
      {
        key: 'rank',
        label: 'Rank',
        render: (value) => (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-100 text-sm font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400">
            {value}
          </span>
        ),
      },
      {
        key: 'customer',
        label: 'Customer',
        render: (value, row) => (
          <div>
            <p className="font-semibold text-slate-800 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.customer_meta || 'No phone or city'}</p>
          </div>
        ),
      },
      {
        key: 'total_orders',
        label: 'Total Orders',
        render: (value) => <span className="font-medium text-slate-700 dark:text-slate-300">{value}</span>,
      },
      {
        key: 'total_value',
        label: 'Total Value',
        render: (value) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{value}</span>,
      },
      {
        key: 'last_order_date',
        label: 'Last Order Date',
        render: (value) => <span className="text-slate-600 dark:text-slate-400">{value}</span>,
      },
    ],
    []
  );

  const summaryCards = useMemo(
    () => [
      {
        title: 'Top Customer',
        value: summary.top_customer_name || 'No paid orders',
        icon: Award,
        valueClass: 'text-slate-900 dark:text-white',
      },
      {
        title: 'Paid Revenue',
        value: formatCurrency(summary.total_value),
        icon: Wallet,
        valueClass: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        title: 'Paid Orders',
        value: String(summary.total_orders || 0),
        icon: ShoppingBasket,
        valueClass: 'text-slate-900 dark:text-white',
      },
      {
        title: 'Ranked Customers',
        value: String(summary.customer_count || 0),
        icon: Users,
        valueClass: 'text-slate-900 dark:text-white',
      },
    ],
    [summary]
  );

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Top Customers"
        icon={Award}
        subtitle="Track the highest-value customers based on paid revenue across ONLINE and BILLING orders."
        badge={`Top ${REPORT_LIMIT}`}
        action={
          <Button variant="secondary" icon={RefreshCcw} onClick={() => loadReport(filters)} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-slate-200 dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                <p className={`mt-3 text-2xl font-bold ${card.valueClass}`}>{card.value}</p>
              </div>
              <div className="rounded-xl border border-amber-200/70 bg-amber-50 p-2.5 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label="Start Date" name="start_date" type="date" value={filters.start_date} onChange={handleFilterChange} />
          <Input label="End Date" name="end_date" type="date" value={filters.end_date} onChange={handleFilterChange} />
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
            <span>Loading top customers report...</span>
          </div>
        </div>
      ) : errorMessage && customers.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Unable to load report</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
            </div>
            <Button onClick={() => loadReport(filters, { showLoader: true })}>Retry</Button>
          </div>
        </Card>
      ) : customers.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">No paid customers found</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Adjust the date range or wait for paid orders to appear in the system.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={tableData}
            searchPlaceholder="Search top customers..."
            exportFileName="top-customers"
          />
        </Card>
      )}
    </div>
  );
};

export default TopCustomersPage;
