import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, LoaderCircle, PenTool, Save, UploadCloud } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/FormFields';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { apiRequest, getAssetUrl } from '../../lib/api';

const initialFormValues = {
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  blog_name: '',
  feet_content: '',
};

const stripHtml = (value = '') =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const BlogFormPage = () => {
  const navigate = useNavigate();
  const { blogId } = useParams();
  const { addToast } = useToast();
  const isEditMode = Boolean(blogId);

  const [formValues, setFormValues] = useState(initialFormValues);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadBlog = useCallback(async () => {
    if (!isEditMode) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest('/settings/blogs');
      const blog = (response.data || []).find((item) => String(item.id) === String(blogId));

      if (!blog) {
        throw new Error('Blog not found.');
      }

      setFormValues({
        meta_title: blog.meta_title || '',
        meta_description: blog.meta_description || '',
        meta_keywords: blog.meta_keywords || '',
        blog_name: blog.title || '',
        feet_content: blog.content || '',
      });
      setExistingImage(blog.image || '');
      setPreviewUrl(blog.image ? getAssetUrl(blog.image) : '');
    } catch (error) {
      addToast(error.message || 'Unable to load blog.', 'error');
      navigate('/seo/blog');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, blogId, isEditMode, navigate]);

  useEffect(() => {
    loadBlog();
  }, [loadBlog]);

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
    if (!formValues.meta_title.trim()) return 'Meta title is required.';
    if (!formValues.meta_description.trim()) return 'Meta description is required.';
    if (!formValues.meta_keywords.trim()) return 'Meta key is required.';
    if (!formValues.blog_name.trim()) return 'Blog name is required.';
    if (!stripHtml(formValues.feet_content)) return 'Feet content is required.';
    if (!isEditMode && !selectedFile) return 'Blog image is required.';
    if (isEditMode && !selectedFile && !existingImage) return 'Blog image is required.';
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
      payload.append('meta_title', formValues.meta_title.trim());
      payload.append('meta_description', formValues.meta_description.trim());
      payload.append('meta_keywords', formValues.meta_keywords.trim());
      payload.append('blog_name', formValues.blog_name.trim());
      payload.append('feet_content', formValues.feet_content);

      if (existingImage) {
        payload.append('existing_image', existingImage);
      }

      if (selectedFile) {
        payload.append('image', selectedFile);
      }

      if (isEditMode) {
        await apiRequest(`/settings/blogs/${blogId}`, {
          method: 'PUT',
          body: payload,
        });
        addToast('Blog updated successfully.');
      } else {
        await apiRequest('/settings/blogs', {
          method: 'POST',
          body: payload,
        });
        addToast('Blog created successfully.');
      }

      navigate('/seo/blog');
    } catch (error) {
      addToast(error.message || 'Unable to save blog.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-6 fade-in max-w-6xl"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <PageHeader
        title={isEditMode ? 'Edit Blog' : 'Add Blog'}
        icon={PenTool}
        subtitle="Open the blog in a full page and manage metadata, cover image, and rich article content."
        action={
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/seo/blog')} icon={ArrowLeft}>
              Back
            </Button>
            <Button type="submit" icon={Save} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Blog' : 'Create Blog'}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading blog...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Meta Title *"
                name="meta_title"
                value={formValues.meta_title}
                onChange={handleInputChange}
                placeholder="Enter meta title"
                disabled={isSubmitting}
              />
              <label className="flex flex-col gap-1.5 md:col-span-2">
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
                placeholder="festival, crackers, guide"
                disabled={isSubmitting}
              />
              <Input
                label="Blog Name *"
                name="blog_name"
                value={formValues.blog_name}
                onChange={handleInputChange}
                placeholder="Best Cracker Brands in India"
                disabled={isSubmitting}
              />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">
                Image * <span className="text-rose-400">(650 x 500 px)</span>
              </span>
              <div className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:bg-slate-100 dark:border-white/20 dark:bg-white/[0.01] dark:hover:bg-white/[0.03]">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <UploadCloud className="mx-auto mb-3 h-9 w-9 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to choose blog image</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PNG, JPG, WEBP, SVG up to 10MB</p>
              </div>
            </label>

            <RichTextEditor
              label="Feet Content *"
              name="feet_content"
              value={formValues.feet_content}
              onChange={handleInputChange}
              placeholder="Write blog content here..."
              disabled={isSubmitting}
            />
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Eye className="h-4 w-4 text-amber-500" />
              Image Preview
            </div>

            <div className="flex aspect-[13/10] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f0f15]">
              {previewUrl ? (
                <img src={previewUrl} alt="Blog preview" className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  Upload a blog image to preview it here.
                </span>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Meta Title</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                  {formValues.meta_title || 'Blog meta title'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Blog Name</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{formValues.blog_name || 'Blog name'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Content Preview</p>
                <p className="mt-1 line-clamp-6 text-sm text-slate-700 dark:text-slate-300">
                  {stripHtml(formValues.feet_content) || 'Blog content preview appears here.'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </form>
  );
};

export default BlogFormPage;
