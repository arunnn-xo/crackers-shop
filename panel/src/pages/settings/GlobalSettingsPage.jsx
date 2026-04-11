import { Globe } from 'lucide-react';
import { SettingsLayout, TabContent } from './SettingsLayout';
import { Input } from '../../components/ui/FormFields';
import { Button } from '../../components/ui/Button';

const GlobalSettingsPage = () => (
  <SettingsLayout title="Global Settings" icon={Globe} tabs={['Brand & Logos', 'Contact & Social', 'Advanced & SEO']}>
    <TabContent tabName="Brand & Logos" className="space-y-6 animate-in fade-in">
      <div className="grid md:grid-cols-2 gap-6">
        <Input label="Company Name" defaultValue="Sparkle Fireworks" />
        <Input label="SEO Meta Title (Global)" defaultValue="Sparkle Fireworks | Best Crackers Online" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-white/[0.02]">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Main Logo (140x69px)</p>
          <div className="flex items-center gap-4">
            <div className="w-32 h-16 bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 shadow-sm rounded flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">Logo Preview</div>
            <Button variant="secondary" size="sm">Upload Logo</Button>
          </div>
        </div>
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-white/[0.02]">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Favicon (40x40px)</p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 shadow-sm rounded flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">ICO</div>
            <Button variant="secondary" size="sm">Upload Favicon</Button>
          </div>
        </div>
      </div>
    </TabContent>
    <TabContent tabName="Contact & Social" className="space-y-6"><Input label="Primary Phone" /><Input label="Facebook URL" /></TabContent>
    <TabContent tabName="Advanced & SEO" className="space-y-6"><Input label="Google Analytics ID" /></TabContent>
  </SettingsLayout>
);

export default GlobalSettingsPage;
