import { CreditCard } from 'lucide-react';
import { SettingsLayout, TabContent } from './SettingsLayout';
import { Input } from '../../components/ui/FormFields';
import { Button } from '../../components/ui/Button';
import { WYSIWYGEditor } from '../../components/ui/WYSIWYGEditor';

const PaymentSetupPage = () => (
  <SettingsLayout title="Payment Setup" icon={CreditCard} tabs={['Bank Transfer', 'QR Codes (UPI)', 'Page Headers']}>
    <TabContent tabName="Bank Transfer" className="space-y-6 animate-in fade-in">
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <Input label="Account Holder Name" defaultValue="Sparkle Fireworks Pvt Ltd" />
        <Input label="Account Number" defaultValue="0000111122223333" />
        <Input label="Bank Name" defaultValue="HDFC Bank" />
        <Input label="IFSC Code" defaultValue="HDFC0001234" />
        <Input label="Branch Name" defaultValue="Sivakasi Main" className="md:col-span-2" />
      </div>
      <WYSIWYGEditor label="Payment Instructions" value="Please transfer the total amount and share screenshot via WhatsApp." />
    </TabContent>
    <TabContent tabName="QR Codes (UPI)" className="space-y-8 animate-in fade-in max-w-4xl">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 border border-slate-200 dark:border-white/10 shadow-sm rounded-xl bg-white dark:bg-[#13131a] text-center space-y-4">
          <h4 className="font-bold text-slate-800 dark:text-white">Google Pay</h4>
          <Input label="Label + Number" defaultValue="GPay: +91 9876543210" />
          <div className="w-40 h-40 mx-auto bg-slate-50 dark:bg-white border border-slate-200 dark:border-white/10 shadow-sm p-2 rounded flex items-center justify-center text-slate-800 font-bold">QR Image</div>
          <Button variant="secondary" size="sm">Upload GPay QR</Button>
        </div>
        <div className="p-6 border border-slate-200 dark:border-white/10 shadow-sm rounded-xl bg-white dark:bg-[#13131a] text-center space-y-4">
          <h4 className="font-bold text-slate-800 dark:text-white">PhonePe</h4>
          <Input label="Label + Number" defaultValue="PhonePe: +91 9876543210" />
          <div className="w-40 h-40 mx-auto bg-slate-50 dark:bg-white border border-slate-200 dark:border-white/10 shadow-sm p-2 rounded flex items-center justify-center text-slate-800 font-bold">QR Image</div>
          <Button variant="secondary" size="sm">Upload PhonePe QR</Button>
        </div>
      </div>
    </TabContent>
    <TabContent tabName="Page Headers"><Input label="Payment Header Title" /></TabContent>
  </SettingsLayout>
);

export default PaymentSetupPage;
