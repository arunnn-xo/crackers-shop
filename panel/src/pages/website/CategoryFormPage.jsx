import { useEffect, useState } from 'react';
import { ArrowLeft, List, LoaderCircle, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/FormFields';
import { apiRequest } from '../../lib/api';

const initialForm = {
  data_id: '',
  name: '',
  sort_order: '0',
  is_active: '1',
};

const CategoryFormPage = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const { addToast } = useToast();
  const isEditMode = Boolean(categoryId);

  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let isMounted = true;

    const loadCategory = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest(`/categories/${categoryId}`);

        if (!isMounted) {
          return;
        }

        const category = response.data || {};
        setForm({
          data_id: category.data_id || '',
          name: category.name || '',
          sort_order: String(category.sort_order ?? 0),
          is_active: String(Number(category.is_active ?? 1)),
        });
      } catch (error) {
        addToast(error.message || 'Unable to load category.', 'error');
        navigate('/website/categories');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCategory();

    return () => {
      isMounted = false;
    };
  }, [addToast, categoryId, isEditMode, navigate]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      addToast('Category name is required.', 'error');
      return;
    }

    if (isEditMode && !form.data_id.trim()) {
      addToast('Category Data ID is required.', 'error');
      return;
    }

    const payload = {
      data_id: form.data_id.trim(),
      name: form.name.trim(),
      sort_order: String(Number(form.sort_order || 0)),
      is_active: form.is_active,
    };

    try {
      setIsSubmitting(true);

      if (isEditMode) {
        await apiRequest(`/categories/${categoryId}`, {
          method: 'PUT',
          body: payload,
        });
        addToast('Category updated successfully.');
      } else {
        await apiRequest('/categories', {
          method: 'POST',
          body: payload,
        });
        addToast('Category created successfully.');
      }

      navigate('/website/categories');
    } catch (error) {
      addToast(error.message || 'Unable to save category.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <PageHeader
        title={isEditMode ? 'Edit Category' : 'Add Category'}
        icon={List}
        subtitle="Use a dedicated page to manage category details."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/website/categories')} icon={ArrowLeft}>
              Back
            </Button>
            <Button onClick={handleSubmit} icon={Save} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading category...</span>
          </div>
        </div>
      ) : (
        <Card className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Category Name"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              placeholder="Sparklers"
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

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Data ID"
              name="data_id"
              value={form.data_id}
              onChange={handleInputChange}
              disabled={!isEditMode}
              placeholder={isEditMode ? 'CAT-001' : 'Auto-generated when you save'}
            />
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
          </div>
        </Card>
      )}
    </div>
  );
};

export default CategoryFormPage;
