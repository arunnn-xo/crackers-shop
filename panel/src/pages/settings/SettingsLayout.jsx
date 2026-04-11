import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const TabContent = ({ children, className }) => (
  <div className={className}>{children}</div>
);

export const SettingsLayout = ({ title, icon, tabs, children }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { addToast } = useToast();

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      <PageHeader 
        title={title} 
        icon={icon} 
        action={<Button onClick={() => addToast('Settings saved successfully!')} icon={Check}>Save Settings</Button>} 
      />
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-px overflow-x-auto custom-scrollbar">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === t ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}>{t}</button>
        ))}
      </div>
      <Card>
        {React.Children.map(children, child => 
          child.props.tabName === activeTab ? child : null
        )}
      </Card>
    </div>
  );
};

export { TabContent };
