import { useMemo } from 'react';
import { Receipt, Plus, Search } from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { MOCK_ORDERS, REVENUE_DATA } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Input, Select } from '../../components/ui/FormFields';

const BillingInvoicesPage = () => {
  const { isDark } = useTheme();
  
  const tooltipStyle = {
    backgroundColor: isDark ? '#13131a' : '#ffffff',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    borderRadius: '8px',
    color: isDark ? '#f8fafc' : '#0f172a'
  };

  const kpis = [
    { title: 'Total Revenue', value: '₹14,50,000', color: 'text-amber-600 dark:text-amber-400' },
    { title: "Today's Billing", value: '₹45,200', color: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Pending Orders', value: '124', color: 'text-rose-600 dark:text-rose-400' },
    { title: 'Completed', value: '1,150', color: 'text-cyan-600 dark:text-cyan-400' },
  ];

  const cols = useMemo(() => [
    { key: 'date', label: 'Invoice Date', render: val => <span className="text-slate-600 dark:text-slate-400">{val}</span> },
    { key: 'id', label: 'Order NO', render: val => <span className="font-bold text-amber-600 dark:text-amber-400">{val}</span> },
    { key: 'customer', label: 'Customer', render: val => <span className="font-medium text-slate-800 dark:text-white">{val}</span> },
    { key: 'subTotal', label: 'Sub Total', render: val => <span className="text-slate-500 dark:text-slate-400">₹{val}</span> },
    { key: 'shipping', label: 'Shipping', render: val => <span className="text-slate-500 dark:text-slate-400">₹{val}</span> },
    { key: 'total', label: 'Total Amount', render: val => <span className="font-bold text-slate-900 dark:text-white">₹{val}</span> },
    { key: 'type', label: 'Type', render: val => <Badge status={val} /> },
    { key: 'status', label: 'Status', render: val => <Badge status={val} /> },
  ], []);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader 
        title="Billing & Invoices" 
        icon={Receipt} 
        action={<Button icon={Plus}>New Bill / Order</Button>} 
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/5 p-5 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{k.title}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Monthly Revenue">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff10" : "#e2e8f0"} vertical={false}/>
                <XAxis dataKey="name" stroke="#64748b"/>
                <YAxis stroke="#64748b"/>
                <RechartsTooltip cursor={{fill: isDark ? '#ffffff05' : '#f8fafc'}} contentStyle={tooltipStyle}/>
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Order Split">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{name:'ONLINE', value:60}, {name:'BILLING', value:40}]} innerRadius={50} outerRadius={80} dataKey="value">
                  <Cell fill="#06b6d4"/><Cell fill="#ec4899"/>
                </Pie>
                <RechartsTooltip contentStyle={tooltipStyle}/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex flex-wrap gap-4 mb-4 items-end bg-white dark:bg-white/[0.01] p-4 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
          <Select label="Status" options={['All Status', 'Pending', 'Paid', 'Dispatch']} />
          <Select label="Type" options={['All Types', 'ONLINE', 'BILLING']} />
          <Input label="Start Date" type="date" />
          <Input label="End Date" type="date" />
          <Button variant="secondary" icon={Search}>Filter</Button>
        </div>
        <DataTable columns={cols} data={MOCK_ORDERS} />
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-6 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Total Invoices: <span className="text-slate-800 dark:text-white font-bold">50</span></span>
          <span className="text-slate-500 dark:text-slate-400">Delivered: <span className="text-emerald-600 dark:text-emerald-400 font-bold">35</span></span>
          <span className="text-slate-500 dark:text-slate-400">Total Revenue: <span className="text-amber-600 dark:text-amber-400 font-bold">₹4,50,000</span></span>
        </div>
      </div>
    </div>
  );
};

export default BillingInvoicesPage;
