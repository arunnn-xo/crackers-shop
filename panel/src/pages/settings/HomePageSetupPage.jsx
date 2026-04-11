import { Monitor } from 'lucide-react';
import { SettingsLayout, TabContent } from './SettingsLayout';
import { Input } from '../../components/ui/FormFields';
import { Button } from '../../components/ui/Button';
import { WYSIWYGEditor } from '../../components/ui/WYSIWYGEditor';

const HomePageSetupPage = () => (
  <SettingsLayout title="Home Page Setup" icon={Monitor} tabs={['Welcome Section', 'Featured Products', 'Why Choose Us']}>
    <TabContent tabName="Welcome Section" className="space-y-6 animate-in fade-in">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Input label="Hero Eyebrow" defaultValue="WELCOME TO SPARKLE" />
          <Input label="Main Heading" defaultValue="Premium Fireworks for Every Occasion" />
          <WYSIWYGEditor label="Welcome Description" />
          <div className="flex gap-4">
            <Input label="CTA Button Text" defaultValue="Shop Now" className="flex-1" />
            <Input label="Button Link URL" defaultValue="/products" className="flex-1" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-6 border border-dashed border-slate-300 dark:border-white/20 rounded-xl bg-slate-50 dark:bg-white/[0.01]">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Section Image (1920x686px)</p>
            <img src="https://picsum.photos/seed/hero/400/150" className="w-full h-32 object-cover rounded mb-4 shadow-sm" alt="Hero" />
            <Button variant="secondary" className="w-full">Replace Image</Button>
          </div>
          <div className="space-y-4 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/[0.02] shadow-sm">
            <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Feature Badges</h4>
            <Input defaultValue="100% Safe" />
            <Input defaultValue="Wholesale Price" />
            <Input defaultValue="Fast Delivery" />
          </div>
        </div>
      </div>
    </TabContent>
    <TabContent tabName="Featured Products"><p className="text-slate-500 dark:text-slate-400 p-4">Select featured products grid...</p></TabContent>
    <TabContent tabName="Why Choose Us"><p className="text-slate-500 dark:text-slate-400 p-4">Why choose us content...</p></TabContent>
  </SettingsLayout>
);

export default HomePageSetupPage;
