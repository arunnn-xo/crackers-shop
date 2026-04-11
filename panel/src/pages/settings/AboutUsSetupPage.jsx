import { Info } from 'lucide-react';
import { SettingsLayout, TabContent } from './SettingsLayout';
import { Input } from '../../components/ui/FormFields';
import { Button } from '../../components/ui/Button';
import { WYSIWYGEditor } from '../../components/ui/WYSIWYGEditor';

const AboutUsSetupPage = () => (
  <SettingsLayout title="About Us Setup" icon={Info} tabs={['Story & Visuals', 'Badges & Stats', 'Purpose & CTA']}>
    <TabContent tabName="Story & Visuals" className="space-y-6 animate-in fade-in">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input label="Hero Eyebrow Text" defaultValue="OUR STORY" />
          <Input label="Main Heading" defaultValue="Lighting up your celebrations since 1995." />
          <WYSIWYGEditor label="Description" />
        </div>
        <div className="space-y-4">
          <div className="p-4 border border-dashed border-slate-300 dark:border-white/20 rounded-xl text-center bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Top Banner Image</p>
            <Button variant="secondary" size="sm">Upload</Button>
          </div>
          <div className="p-4 border border-dashed border-slate-300 dark:border-white/20 rounded-xl text-center bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Main Content Image</p>
            <Button variant="secondary" size="sm">Upload</Button>
          </div>
        </div>
      </div>
    </TabContent>
    <TabContent tabName="Badges & Stats"><p className="text-slate-500 dark:text-slate-400 p-4">Stats configuration fields...</p></TabContent>
    <TabContent tabName="Purpose & CTA"><p className="text-slate-500 dark:text-slate-400 p-4">CTA configuration fields...</p></TabContent>
  </SettingsLayout>
);

export default AboutUsSetupPage;
