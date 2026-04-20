import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  IndianRupee,
  LayoutDashboard,
  List,
  LoaderCircle,
  Package,
  PieChart as PieChartIcon,
  Plus,
  ShoppingBag,
  TrendingUp,
  Users,
  Image as ImageIcon,
  Eye,
  Award,
  CalendarDays,
  CheckCheck,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../data/constants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiRequest } from '../../lib/api';

const CHART_COLORS = [...Object.values(COLORS), '#10b981', '#f97316', '#6366f1'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value, withTime = false) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('') || 'CU';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isDark } = useTheme();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalCategories: 0,
      totalBanners: 0,
      globalDiscount: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalIncome: 0,
      totalCustomers: 0,
    },
    revenueData: [],
    statusData: [],
    recentOrders: [],
    newCustomers: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tooltipStyle = {
    backgroundColor: isDark ? '#13131a' : '#ffffff',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    borderRadius: '8px',
    color: isDark ? '#f8fafc' : '#0f172a',
  };

  const loadDashboard = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const response = await apiRequest('/dashboard');
        setDashboardData({
          stats: response.data?.stats || {},
          revenueData: (response.data?.revenueData || []).map((point) => ({
            ...point,
            revenue: Number(point.revenue || 0),
          })),
          statusData: (response.data?.statusData || []).map((point) => ({
            ...point,
            value: Number(point.value || 0),
          })),
          recentOrders: response.data?.recentOrders || [],
          newCustomers: response.data?.newCustomers || [],
        });
      } catch (error) {
        addToast(error.message || 'Unable to load dashboard data.', 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    loadDashboard({ showLoader: true });
  }, [loadDashboard]);

  const statsCards = useMemo(
    () => [
      {
        title: 'Total Billed Amount',
        value: formatCurrency(dashboardData.stats.totalRevenue),
        icon: IndianRupee,
        iconColor: 'text-white',
        valueColor: 'text-white',
        labelColor: 'text-orange-50/90',
        pillClass: 'bg-white/18 text-white',
        iconBg: 'bg-white/16',
        cardClass: 'border-0 bg-gradient-to-r from-[#ff8100] to-[#ff5200] shadow-[0_14px_34px_rgba(255,129,0,0.24)]',
      },
      {
        title: "Today's Billing",
        value: formatCurrency(dashboardData.stats.todaysBilling),
        icon: CalendarDays,
        iconColor: 'text-white',
        valueColor: 'text-white',
        labelColor: 'text-emerald-50/90',
        pillClass: 'bg-white/18 text-white',
        iconBg: 'bg-white/16',
        cardClass: 'border-0 bg-gradient-to-r from-[#21c89f] to-[#04a090] shadow-[0_14px_34px_rgba(33,200,159,0.24)]',
      },
      {
        title: 'Pending Payment Invoices',
        value: dashboardData.stats.pendingOrders || 0,
        icon: Clock,
        iconColor: 'text-white',
        valueColor: 'text-white',
        labelColor: 'text-pink-50/90',
        pillClass: 'bg-white/18 text-white',
        iconBg: 'bg-white/16',
        cardClass: 'border-0 bg-gradient-to-r from-[#fc3d7a] to-[#c604ec] shadow-[0_14px_34px_rgba(252,61,122,0.24)]',
      },
      {
        title: 'Completed Invoices',
        value: dashboardData.stats.completedOrders || 0,
        icon: CheckCheck,
        iconColor: 'text-white',
        valueColor: 'text-white',
        labelColor: 'text-sky-50/90',
        pillClass: 'bg-white/18 text-white',
        iconBg: 'bg-white/16',
        cardClass: 'border-0 bg-gradient-to-r from-[#20c8f5] to-[#0563eb] shadow-[0_14px_34px_rgba(32,200,245,0.24)]',
      },
    ],
    [dashboardData.stats]
  );

  const recentOrders = useMemo(
    () =>
      (dashboardData.recentOrders || []).map((order) => ({
        ...order,
        customerLabel: order.customer_name || 'Unknown customer',
        createdLabel: formatDate(order.created_at, true),
      })),
    [dashboardData.recentOrders]
  );

  if (isLoading) {
    return (
      <div className="space-y-6 fade-in">
        <PageHeader title="Dashboard" icon={LayoutDashboard} subtitle="Loading your live business summary." />
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Dashboard"
        icon={LayoutDashboard}
        subtitle="Track catalog, revenue, and recent activity from one live admin overview."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => loadDashboard()} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button icon={Plus} onClick={() => navigate('/orders/billing/new')}>
              New Order
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <div
            key={card.title}
            className={`group relative overflow-hidden rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5 ${card.cardClass}`}
          >
            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/14 blur-2xl"></div>
            <div className="absolute bottom-0 left-6 h-14 w-14 rounded-full bg-black/10 blur-xl"></div>
            <div className="relative flex items-start justify-between gap-3">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${card.pillClass}`}>
                Summary
              </span>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
            <div className="relative mt-8">
              <p className={`text-3xl font-black tracking-tight ${card.valueColor}`}>{card.value}</p>
              <p className={`mt-1 text-xs font-medium uppercase tracking-[0.18em] ${card.labelColor}`}>{card.title}</p>
            </div>
            <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/12">
              <div className="h-full w-2/3 rounded-full bg-white/70"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Revenue Overview" icon={TrendingUp}>
          <div className="h-[300px] w-full">
            {dashboardData.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${Math.round(Number(value || 0) / 1000)}k`}
                  />
                  <RechartsTooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4, fill: isDark ? '#13131a' : '#ffffff', stroke: '#f59e0b', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                No revenue data available.
              </div>
            )}
          </div>
        </Card>

        <Card title="Order Status" icon={PieChartIcon}>
          <div className="h-[300px] w-full">
            {dashboardData.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboardData.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={82} paddingAngle={5} dataKey="value">
                    {dashboardData.statusData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                No order status data available.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Recent Orders"
          icon={Clock}
          action={
            <Button variant="secondary" onClick={() => navigate('/orders/all')}>
              View All Orders
            </Button>
          }
        >
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <tr>
                    {['Order No', 'Customer', 'Type', 'Status', 'Payment', 'Amount', 'Created', 'Action'].map((label) => (
                      <th key={label} className="px-3 py-3 font-semibold">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 dark:border-white/5">
                      <td className="px-3 py-3 font-semibold text-amber-600 dark:text-amber-400">{order.order_no}</td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{order.customerLabel}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge status={order.order_type || 'ONLINE'} />
                      </td>
                      <td className="px-3 py-3">
                        <Badge status={order.status || 'Pending'} />
                      </td>
                      <td className="px-3 py-3">
                        <Badge status={order.payment_status || 'Pending'} />
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white">{formatCurrency(order.total)}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{order.createdLabel}</td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => navigate(`/orders/all?search=${encodeURIComponent(order.order_no)}`)}
                          className="rounded bg-sky-50 p-1.5 text-sky-600 transition-colors hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
                          title="Open order in All Orders"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              No recent orders available.
            </div>
          )}
        </Card>

        <Card title="New Customers" icon={Users}>
          <div className="space-y-4">
            {dashboardData.newCustomers.length > 0 ? (
              dashboardData.newCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-slate-100 hover:bg-slate-50 dark:hover:border-white/5 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{customer.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {[customer.city || 'Unknown city', customer.phone || 'No phone'].join(' • ')}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{formatDate(customer.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                No new customers available.
              </div>
            )}
            <Button variant="secondary" className="w-full" onClick={() => navigate('/website/customers')}>
              View All Customers
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
