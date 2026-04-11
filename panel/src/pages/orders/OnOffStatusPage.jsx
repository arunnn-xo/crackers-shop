import { useState } from 'react';
import { Moon, UploadCloud } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';

const OnOffStatusPage = () => {
  const { addToast } = useToast();
  const [isOn, setIsOn] = useState(true);

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <PageHeader title="Order Settings" icon={Moon} />
      <Card>
        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Accepting Orders</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Toggle to turn off the website ordering capability.</p>
            </div>
            <button onClick={() => { setIsOn(!isOn); addToast(`Store is now ${!isOn ? 'ON' : 'OFF'}`); }} className={`w-14 h-8 rounded-full p-1 transition-colors relative shadow-inner ${isOn ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {!isOn && (
            <div className="space-y-4 border-l-2 border-amber-500 pl-4">
              <h4 className="font-medium text-slate-800 dark:text-white">Page Off Banner Preview</h4>
              <img src="https://picsum.photos/seed/off/800/200" alt="Off Banner" className="w-full h-40 object-cover rounded-lg border border-slate-200 dark:border-white/10 shadow-sm" />
              <Button variant="secondary" icon={UploadCloud}>Update Banner Image</Button>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
            <h4 className="font-medium text-slate-800 dark:text-white">Minimum Order Value</h4>
            <div className="flex gap-4">
              <Input type="number" defaultValue={2000} className="w-64" />
              <Button onClick={() => addToast('Value saved')}>Save Value</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OnOffStatusPage;
