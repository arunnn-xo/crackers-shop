import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Moon, Save, UploadCloud } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';
import { Badge } from '../../components/ui/Badge';
import { apiRequest, getAssetUrl } from '../../lib/api';

const initialConfig = {
  is_store_open: '1',
  min_order_value: '2000',
  global_discount: '0',
  off_banner_image: '',
};

const OnOffStatusPage = () => {
  const { addToast } = useToast();
  const [storeConfig, setStoreConfig] = useState(initialConfig);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadStoreConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/settings/store');
      const config = response.data || {};

      setStoreConfig({
        is_store_open: String(Number(config.is_store_open ?? 1)),
        min_order_value: String(config.min_order_value ?? 2000),
        global_discount: String(config.global_discount ?? 0),
        off_banner_image: config.off_banner_image || '',
      });
      setSelectedBanner(null);
      setPreviewUrl(config.off_banner_image ? getAssetUrl(config.off_banner_image) : '');
    } catch (error) {
      addToast(error.message || 'Unable to load order settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadStoreConfig();
  }, [loadStoreConfig]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleToggle = () => {
    setStoreConfig((current) => ({
      ...current,
      is_store_open: current.is_store_open === '1' ? '0' : '1',
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setStoreConfig((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleBannerChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedBanner(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const minimumOrderValue = Number(storeConfig.min_order_value);

    if (!Number.isFinite(minimumOrderValue) || minimumOrderValue < 0) {
      addToast('Minimum order value must be a valid non-negative number.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = new FormData();
      payload.append('is_store_open', storeConfig.is_store_open);
      payload.append('min_order_value', String(minimumOrderValue));
      payload.append('global_discount', String(Number(storeConfig.global_discount || 0)));

      if (selectedBanner) {
        payload.append('off_banner_image', selectedBanner);
      }

      await apiRequest('/settings/store', {
        method: 'PUT',
        body: payload,
      });

      addToast('Order settings updated successfully.');
      await loadStoreConfig();
    } catch (error) {
      addToast(error.message || 'Unable to save order settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isStoreOpen = storeConfig.is_store_open === '1';

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      <PageHeader
        title="Order Settings"
        icon={Moon}
        subtitle="Control online ordering availability, the minimum order amount, and the customer-facing off banner."
        badge={isStoreOpen ? 'Store Open' : 'Store Closed'}
        action={
          <Button onClick={handleSave} icon={Save} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading order settings...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="space-y-8">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Accepting Online Orders</h3>
                  <Badge status={isStoreOpen ? 'Active' : 'Inactive'} />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  When turned off, `ONLINE` orders are blocked by the backend and the off banner can be shown on the website.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggle}
                className={`relative flex h-9 w-20 flex-shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  isStoreOpen 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_4px_14px_rgba(245,158,11,0.25)]' 
                    : 'bg-rose-500 shadow-inner'
                }`}
                aria-pressed={isStoreOpen}
                aria-label="Toggle store online status"
              >
                <span className="sr-only">Toggle store status</span>
                
                <span className={`absolute inset-y-0 left-0 flex w-[48px] items-center justify-center text-xs font-bold tracking-wider text-white transition-opacity duration-300 ${
                  isStoreOpen ? 'opacity-100' : 'opacity-0'
                }`}>
                  ON
                </span>
                
                <span className={`absolute inset-y-0 right-0 flex w-[48px] items-center justify-center text-xs font-bold tracking-wider text-white transition-opacity duration-300 ${
                  isStoreOpen ? 'opacity-0' : 'opacity-100'
                }`}>
                  OFF
                </span>
                
                <span className={`absolute top-1 left-1 flex h-7 w-7 transform items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
                  isStoreOpen ? 'translate-x-11' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Minimum Order Value"
                name="min_order_value"
                type="number"
                min="0"
                step="0.01"
                value={storeConfig.min_order_value}
                onChange={handleInputChange}
                placeholder="2000"
              />
              <Input
                label="Global Discount"
                name="global_discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={storeConfig.global_discount}
                onChange={handleInputChange}
                disabled
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 p-5 dark:border-white/10">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-white">Store Off Banner</h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Upload the image that should be shown to customers when online ordering is disabled.
                </p>
              </div>

              <label className="block">
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                <div className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:bg-slate-100 dark:border-white/20 dark:bg-white/[0.01] dark:hover:bg-white/[0.03]">
                  <UploadCloud className="mx-auto mb-3 h-9 w-9 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Click to upload off banner image
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    PNG, JPG, WEBP or SVG up to 10MB
                  </p>
                </div>
              </label>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Customer View Preview</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Preview of the banner used while the store is turned off.
                </p>
              </div>
              <Badge status={isStoreOpen ? 'Active' : 'Inactive'} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
              {previewUrl ? (
                <img src={previewUrl} alt="Store off banner preview" className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center px-4 text-center text-sm text-slate-400 dark:text-slate-500">
                  Upload an off banner image to preview how customers will see the store-closed state.
                </div>
              )}

              <div className="space-y-2 border-t border-slate-200 p-4 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {isStoreOpen ? 'Orders are currently open' : 'Orders are currently closed'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimum order value: {Number(storeConfig.min_order_value || 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OnOffStatusPage;
