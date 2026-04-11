import { useMemo } from 'react';
import { Box, Edit, FileText, Plus, Search } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { MOCK_ORDERS } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Input, Select } from '../../components/ui/FormFields';

const AllOrdersPage = () => {
  const { isDark } = useTheme();

  const tooltipStyle = {
    backgroundColor: isDark ? '#13131a' : '#ffffff',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    borderRadius: '8px',
    color: isDark ? '#f8fafc' : '#0f172a'
  };

  const cols = useMemo(() => [
    { key: 'date', label: 'Date', render: val => <span className="text-slate-500 dark:text-slate-400">{val}</span> },
    { key: 'id', label: 'Order NO', render: val => <span className="font-bold text-amber-600 dark:text-amber-400">{val}</span> },
    { key: 'customer', label: 'Customer Name', render: val => <span className="font-medium text-slate-800 dark:text-white">{val}</span> },
    { key: 'total', label: 'Amount', render: val => <span className="font-semibold text-slate-900 dark:text-white">₹{val}</span> },
    { key: 'type', label: 'Type', render: val => <Badge status={val} /> },
    { key: 'status', label: 'Order Status', render: val => <Badge status={val} /> },
    { key: 'actions', label: 'Actions', render: () => (
      <div className="flex gap-2">
        <button className="p-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded tooltip transition-colors" title="Print"><FileText className="w-4 h-4"/></button>
        <button className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded tooltip transition-colors" title="Edit"><Edit className="w-4 h-4"/></button>
        <button className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded tooltip transition-colors" title="Add Products"><Plus className="w-4 h-4"/></button>
      </div>
    )}
  ], []);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="All Orders" icon={Box} />
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full"></div>
          <p className="text-amber-100 font-medium mb-2">Total Order Value</p>
          <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md">₹ 84,50,290</h2>
        </div>
        <Card>
          <div className="h-32">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{name:'Paid', value:500}, {name:'Pending', value:300}, {name:'Call Not Pick', value:100}]} innerRadius={30} outerRadius={50} dataKey="value">
                  <Cell fill="#10b981"/><Cell fill="#f59e0b"/><Cell fill="#f43f5e"/>
                </Pie>
                <RechartsTooltip contentStyle={tooltipStyle}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex flex-wrap gap-4 mb-4 items-end bg-white dark:bg-white/[0.01] p-4 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
          <Select label="Status" options={['All', 'Pending', 'Paid', 'Dispatch']} className="w-40" />
          <Select label="Type" options={['All', 'ONLINE', 'BILLING']} className="w-40" />
          <Input label="Start Date" type="date" />
          <Input label="End Date" type="date" />
          <Button icon={Search}>Apply Filters</Button>
          <Button variant="secondary">Reset</Button>
        </div>
        <DataTable columns={cols} data={MOCK_ORDERS} />
      </div>
    </div>
  );
};

export default AllOrdersPage;
