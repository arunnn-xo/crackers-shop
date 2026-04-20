import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, LoaderCircle, Save, Star, UploadCloud } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/FormFields';
import { apiRequest, getAssetUrl } from '../../lib/api';

const initialForm = {
  name: '',
  sort_order: '0',
  is_active: '1',
};

const BrandFormPage = () => {
  const navigate = useNavigate();
  const { brandId } = useParams();
  const { addToast } = useToast();
  const isEditMode = Boolean(brandId);

  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let isMounted = true;

    const loadBrand = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('/settings/brands');
        const brand = (response.data || []).find((item) => String(item.id) === String(brandId));

        if (!brand) {
          throw new Error('Brand not found.');
        }

        if (!isMounted) {
          return;
        }

        setForm({
          name: brand.name || '',
          sort_order: String(brand.sort_order ?? 0),
          is_active: String(Number(brand.is_active ?? 1)),
        });
        setPreviewUrl(getAssetUrl(brand.logo));
      } catch (error) {
        addToast(error.message || 'Unable to load brand.', 'error');
        navigate('/report/brands');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBrand();

    return () => {
      isMounted = false;
    };
  }, [addToast, brandId, isEditMode, navigate]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      addToast('Brand name is required.', 'error');
      return;
    }

    if (!isEditMode && !selectedFile) {
      addToast('Brand logo is required.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append('name', form.name.trim());
      payload.append('sort_order', String(Number(form.sort_order || 0)));
      payload.append('is_active', form.is_active);

      if (selectedFile) {
        payload.append('logo', selectedFile);
      }

      if (isEditMode) {
        await apiRequest(`/settings/brands/${brandId}`, { method: 'PUT', body: payload });
        addToast('Brand updated successfully.');
      } else {
        await apiRequest('/settings/brands', { method: 'POST', body: payload });
        addToast('Brand created successfully.');
      }

      navigate('/report/brands');
    } catch (error) {
      addToast(error.message || 'Unable to save brand.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      <PageHeader
        title={isEditMode ? 'Edit Brand Logo' : 'Add Brand Logo'}
        icon={Star}
        subtitle="Upload transparent PNG, SVG, JPG, or WEBP brand logos for website trust sections."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/report/brands')} icon={ArrowLeft}>
              Back
            </Button>
            <Button onClick={handleSubmit} icon={Save} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Brand' : 'Create Brand'}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading brand...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Brand Name"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Standard Fireworks"
              />
              <Input
                label="Sort Order"
                name="sort_order"
                type="number"
                min="0"
                value={form.sort_order}
                onChange={handleInputChange}
              />
            </div>

            <Select
              label="Status"
              name="is_active"
              value={form.is_active}
              onChange={handleInputChange}
              options={[
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' },
              ]}
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Brand Logo</span>
              <div className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:bg-slate-100 dark:border-white/20 dark:bg-white/[0.01] dark:hover:bg-white/[0.03]">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <UploadCloud className="mx-auto mb-3 h-9 w-9 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Click to upload PNG, JPG, WEBP or SVG
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Transparent PNG or SVG recommended for best website display
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Max file size 10MB</p>
              </div>
            </label>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Preview</p>
              <Badge status={form.is_active === '1' ? 'Active' : 'Inactive'} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0f0f15]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Brand preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-center text-sm text-slate-400 dark:text-slate-500">
                    Upload a brand logo to preview it here.
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{form.name || 'Brand name'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sort order: {Number(form.sort_order || 0)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Eye className="h-4 w-4 text-amber-500" />
                Website Trust Strip
              </div>
              <div className="mt-3 flex h-16 items-center justify-center rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#0f0f15]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Website preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">Logo will appear here on the public site.</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BrandFormPage;
