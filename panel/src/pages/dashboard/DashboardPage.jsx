import { useMemo } from 'react';
import { 
  LayoutDashboard, List, Image as ImageIcon, Package, ShoppingBag, 
  IndianRupee, Award, Box, Users, MoreVertical, Plus, Clock, 
  TrendingUp, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../data/constants';
import { MOCK_ORDERS, MOCK_CUSTOMERS, REVENUE_DATA, ORDER_STATUS_DATA } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';

const DashboardPage = () => {
  const { isDark } = useTheme();

  const tooltipStyle = {
    backgroundColor: isDark ? '#13131a' : '#ffffff',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    borderRadius: '8px',
    color: isDark ? '#f8fafc' : '#0f172a'
  };

  const stats = [
    { title: 'Total Categories', value: '24', icon: List, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/20' },
    { title: 'Total Banners', value: '6', icon: ImageIcon, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-500/20' },
    { title: 'Global Discount', value: '15%', icon: Award, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20' },
    { title: 'Total Products', value: '142', icon: Package, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-500/20' },
    { title: 'Total Orders', value: '1,284', icon: ShoppingBag, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    { title: 'Total Income', value: '₹ 45.2L', icon: IndianRupee, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/20' },
  ];

  const columns = useMemo(() => [
    { key: 'id', label: 'Order NO', render: (val) => <span className="flex items-center gap-1.5"><Box className="w-4 h-4 text-slate-400"/> {val}</span> },
    { key: 'customer', label: 'Customer', render: (val) => <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400"/> {val}</span> },
    { key: 'total', label: 'Amount', render: (val) => <span className="font-semibold text-slate-800 dark:text-white flex items-center"><IndianRupee className="w-3.5 h-3.5 text-slate-500 mr-0.5"/>{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <Badge status={val} /> },
  ], []);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader 
        title="Dashboard" 
        icon={LayoutDashboard} 
        subtitle="Welcome back! Here's what's happening today." 
        action={<Button icon={Plus}>New Order</Button>} 
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#13131a] p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-slate-300 dark:hover:border-white/10 transition-colors">
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full ${s.bg} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Revenue Overview" icon={TrendingUp}>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff10" : "#e2e8f0"} vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: isDark ? '#13131a' : '#ffffff', stroke: '#f59e0b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Order Status" icon={PieChartIcon}>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ORDER_STATUS_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {ORDER_STATUS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Recent Orders" icon={Clock}>
          <DataTable columns={columns} data={MOCK_ORDERS.slice(0, 5)} searchPlaceholder="Search orders..." exportable={false} />
        </Card>
        <Card title="New Customers" icon={Users}>
          <div className="space-y-4">
            {MOCK_CUSTOMERS.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-white/[0.02] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{c.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.city}</p>
                </div>
                <Button variant="ghost" className="p-1.5"><MoreVertical className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button variant="secondary" className="w-full mt-2">View All Customers</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
