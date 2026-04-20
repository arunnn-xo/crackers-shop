import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, FileSearch, LoaderCircle, Save, UploadCloud } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/FormFields';
import { WYSIWYGEditor } from '../../components/ui/WYSIWYGEditor';
import { apiRequest, getAssetUrl } from '../../lib/api';

const initialFormValues = {
  seo_heading_id: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  name: '',
  description: '',
  alt_key: '',
  url: '',
  canonical: '',
  feet_content: '',
};

const SeoDetailFormPage = () => {
  const navigate = useNavigate();
  const { seoDetailId } = useParams();
  const { addToast } = useToast();
  const isEditMode = Boolean(seoDetailId);

  const [formValues, setFormValues] = useState(initialFormValues);
  const [seoHeadings, setSeoHeadings] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const headingOptions = useMemo(
    () => [
      { label: 'Select SEO Heading', value: '' },
      ...seoHeadings.map((heading) => ({
        label: heading.page_name || `Heading #${heading.id}`,
        value: String(heading.id),
      })),
    ],
    [seoHeadings]
  );

  const currentHeading = useMemo(
    () => seoHeadings.find((heading) => String(heading.id) === String(formValues.seo_heading_id)),
    [formValues.seo_heading_id, seoHeadings]
  );

  const loadPageData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [headingsResponse, detailsResponse] = await Promise.all([
        apiRequest('/settings/seo-headings'),
        isEditMode ? apiRequest('/settings/seo-details') : Promise.resolve({ data: [] }),
      ]);

      const headings = headingsResponse.data || [];
      setSeoHeadings(headings);

      if (headings.length === 0) {
        addToast('Create at least one SEO heading before adding SEO details.', 'error');
        navigate('/seo/heading');
        return;
      }

      if (!isEditMode) {
        return;
      }

      const seoDetail = (detailsResponse.data || []).find((item) => String(item.id) === String(seoDetailId));
      if (!seoDetail) {
        throw new Error('SEO detail not found.');
      }

      setFormValues({
        seo_heading_id: String(seoDetail.seo_heading_id ?? ''),
        meta_title: seoDetail.meta_title || '',
        meta_description: seoDetail.meta_description || '',
        meta_keywords: seoDetail.meta_keywords || '',
        name: seoDetail.name || '',
        description: seoDetail.description || '',
        alt_key: seoDetail.alt_key || '',
        url: seoDetail.url || '',
        canonical: seoDetail.canonical || '',
        feet_content: seoDetail.feet_content || '',
      });
      setExistingImage(seoDetail.image || '');
      setPreviewUrl(seoDetail.image ? getAssetUrl(seoDetail.image) : '');
    } catch (error) {
      addToast(error.message || 'Unable to load SEO detail.', 'error');
      navigate('/seo/details');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, isEditMode, navigate, seoDetailId]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreviewUrl((current) => {
      if (current.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
  };

  const validateForm = () => {
    if (!formValues.seo_heading_id) return 'SEO heading is required.';
    if (!formValues.meta_title.trim()) return 'Meta title is required.';
    if (!formValues.meta_description.trim()) return 'Meta description is required.';
    if (!formValues.meta_keywords.trim()) return 'Meta key is required.';
    if (!formValues.name.trim()) return 'Name is required.';
    if (!formValues.description.trim()) return 'Description is required.';
    if (!formValues.alt_key.trim()) return 'Alt key is required.';
    if (!formValues.url.trim()) return 'URL is required.';
    if (!formValues.feet_content.trim()) return 'Feet content is required.';
    if (!isEditMode && !selectedFile) return 'SEO image is required.';
    return '';
  };

  const handleSubmit = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      addToast(validationMessage, 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = new FormData();
      payload.append('seo_heading_id', formValues.seo_heading_id);
      payload.append('meta_title', formValues.meta_title.trim());
      payload.append('meta_description', formValues.meta_description.trim());
      payload.append('meta_keywords', formValues.meta_keywords.trim());
      payload.append('name', formValues.name.trim());
      payload.append('description', formValues.description.trim());
      payload.append('alt_key', formValues.alt_key.trim());
      payload.append('url', formValues.url.trim());
      payload.append('canonical', formValues.canonical.trim());
      payload.append('feet_content', formValues.feet_content.trim());

      if (existingImage) {
        payload.append('existing_image', existingImage);
      }

      if (selectedFile) {
        payload.append('image', selectedFile);
      }

      if (isEditMode) {
        await apiRequest(`/settings/seo-details/${seoDetailId}`, {
          method: 'PUT',
          body: payload,
        });
        addToast('SEO detail updated successfully.');
      } else {
        await apiRequest('/settings/seo-details', {
          method: 'POST',
          body: payload,
        });
        addToast('SEO detail created successfully.');
      }

      navigate('/seo/details');
    } catch (error) {
      addToast(error.message || 'Unable to save SEO detail.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-6xl">
      <PageHeader
        title={isEditMode ? 'Edit SEO Detail' : 'Add SEO Detail'}
        icon={FileSearch}
        subtitle="Open the SEO record in a full page and manage metadata, image content, canonical links, and footer copy."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/seo/details')} icon={ArrowLeft}>
              Back
            </Button>
            <Button onClick={handleSubmit} icon={Save} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update SEO' : 'Create SEO'}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading SEO detail...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Select
                label="Choose SEO Heading *"
                name="seo_heading_id"
                value={formValues.seo_heading_id}
                onChange={handleInputChange}
                options={headingOptions}
                disabled={isSubmitting}
              />
              <Input
                label="Meta Title *"
                name="meta_title"
                value={formValues.meta_title}
                onChange={handleInputChange}
                placeholder="Enter meta title"
                disabled={isSubmitting}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Meta Description *</span>
                <textarea
                  name="meta_description"
                  value={formValues.meta_description}
                  onChange={handleInputChange}
                  placeholder="Enter meta description"
                  disabled={isSubmitting}
                  className="min-h-28 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-[#0a0a0f] dark:text-white"
                />
              </label>
              <Input
                label="Meta Key *"
                name="meta_keywords"
                value={formValues.meta_keywords}
                onChange={handleInputChange}
                placeholder="crackers, fireworks, diwali"
                disabled={isSubmitting}
              />
              <Input
                label="Name *"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Enter name"
                disabled={isSubmitting}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Description *</span>
                <textarea
                  name="description"
                  value={formValues.description}
                  onChange={handleInputChange}
                  placeholder="Enter description"
                  disabled={isSubmitting}
                  className="min-h-28 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-[#0a0a0f] dark:text-white"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Image * <span className="text-rose-400">(1200 x 630 px)</span>
                </span>
                <div className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:bg-slate-100 dark:border-white/20 dark:bg-white/[0.01] dark:hover:bg-white/[0.03]">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <UploadCloud className="mx-auto mb-3 h-9 w-9 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to choose SEO image</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PNG, JPG, WEBP, SVG up to 10MB</p>
                </div>
              </label>
              <Input
                label="Alt Key *"
                name="alt_key"
                value={formValues.alt_key}
                onChange={handleInputChange}
                placeholder="Enter alt key"
                disabled={isSubmitting}
              />
              <Input
                label="Url *"
                name="url"
                value={formValues.url}
                onChange={handleInputChange}
                placeholder="/products"
                disabled={isSubmitting}
              />
              <Input
                label="Canonical"
                name="canonical"
                value={formValues.canonical}
                onChange={handleInputChange}
                placeholder="https://example.com/products"
                disabled={isSubmitting}
              />
            </div>

            <WYSIWYGEditor
              label="Feet Content *"
              name="feet_content"
              value={formValues.feet_content}
              onChange={handleInputChange}
              placeholder="Enter feet content here..."
            />
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Eye className="h-4 w-4 text-amber-500" />
              SEO Preview
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex aspect-[1200/630] items-center justify-center rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0f0f15]">
                {previewUrl ? (
                  <img src={previewUrl} alt="SEO preview" className="max-h-full max-w-full rounded object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">Upload an SEO image to preview it here.</span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                  {formValues.meta_title || 'Meta title preview'}
                </p>
                <p className="line-clamp-3 text-xs text-slate-500 dark:text-slate-400">
                  {formValues.meta_description || 'Meta description preview'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {currentHeading?.page_name || 'Select an SEO heading'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Link Details</p>
              <div className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <p>URL: {formValues.url || '-'}</p>
                <p>Canonical: {formValues.canonical || '-'}</p>
                <p>Alt key: {formValues.alt_key || '-'}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SeoDetailFormPage;
