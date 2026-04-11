import { Phone } from 'lucide-react';
import { SettingsLayout, TabContent } from './SettingsLayout';
import { Input } from '../../components/ui/FormFields';

const ContactUsSetupPage = () => (
  <SettingsLayout title="Contact Us Setup" icon={Phone} tabs={['Contact Details', 'Page Headers', 'Map & Visuals']}>
    <TabContent tabName="Contact Details" className="space-y-6 animate-in fade-in max-w-2xl">
      <Input label="Phone Number" defaultValue="+91 98765 43210" />
      <Input label="Email Address" defaultValue="support@sparklefireworks.com" />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Physical Address</label>
        <textarea className="w-full bg-white dark:bg-[#0a0a0f] border border-slate-300 dark:border-white/10 rounded-lg p-4 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm" rows="4" defaultValue="123 Sparkle Street, Sivakasi, Tamil Nadu, India." />
      </div>
    </TabContent>
    <TabContent tabName="Page Headers"><Input label="Header Title" /></TabContent>
    <TabContent tabName="Map & Visuals"><Input label="Google Maps Embed URL" /></TabContent>
  </SettingsLayout>
);

export default ContactUsSetupPage;
