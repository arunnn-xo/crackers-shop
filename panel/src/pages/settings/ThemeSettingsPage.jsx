import { Palette } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';

const ThemeSettingsPage = () => {
  const { addToast } = useToast();
  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <PageHeader title="Theme Settings" icon={Palette} />
      <Card>
        <div className="grid sm:grid-cols-2 gap-8">
          {[
            { label: 'Primary (Background)', key: 'primary', def: '#f8fafc' },
            { label: 'Secondary (Card Background)', key: 'secondary', def: '#ffffff' },
            { label: 'Tertiary (Text/Highlight)', key: 'tertiary', def: '#f59e0b' },
            { label: 'Quaternary (Buttons/Header)', key: 'quaternary', def: '#ec4899' },
          ].map(c => (
            <div key={c.key} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{c.label}</label>
              <div className="flex items-center gap-3">
                <input type="color" defaultValue={c.def} className="w-12 h-12 rounded cursor-pointer bg-white dark:bg-[#0a0a0f] border border-slate-300 dark:border-white/10 p-1 shadow-sm" />
                <Input defaultValue={c.def} className="flex-1" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
          <Button onClick={() => addToast('Colors updated successfully')}>Update Colors</Button>
        </div>
      </Card>
    </div>
  );
};

export default ThemeSettingsPage;
