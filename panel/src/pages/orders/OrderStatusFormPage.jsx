import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardEdit, LoaderCircle, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/FormFields';
import { apiRequest } from '../../lib/api';

const createInitialForm = () => ({
  name: '',
  color: '#64748b',
  sort_order: '1',
});

const fallbackBadgeClasses =
  'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10';

const OrderStatusFormPage = () => {
  const navigate = useNavigate();
  const { statusId } = useParams();
  const { addToast } = useToast();
  const isEditMode = Boolean(statusId);

  const [form, setForm] = useState(createInitialForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('/settings/order-statuses');
        const statuses = response.data || [];

        if (!isMounted) {
          return;
        }

        if (isEditMode) {
          const status = statuses.find((item) => String(item.id) === String(statusId));
          if (!status) {
            throw new Error('Order status not found.');
          }

          setForm({
            name: status.name || '',
            color: status.color || '#64748b',
            sort_order: String(Number(status.sort_order || 1)),
          });
        } else {
          setForm({
            name: '',
            color: '#64748b',
            sort_order: String((statuses.length || 0) + 1),
          });
        }
      } catch (error) {
        addToast(error.message || 'Unable to load order status form.', 'error');
        navigate('/orders/status');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [addToast, isEditMode, navigate, statusId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      addToast('Status name is required.', 'error');
      return;
    }

    const payload = {
      name: form.name.trim(),
      color: form.color || '#64748b',
      sort_order: Number(form.sort_order || 1),
    };

    try {
      setIsSubmitting(true);

      if (isEditMode) {
        await apiRequest(`/settings/order-statuses/${statusId}`, {
          method: 'PUT',
          body: payload,
        });
        addToast('Order status updated successfully.');
      } else {
        await apiRequest('/settings/order-statuses', {
          method: 'POST',
          body: payload,
        });
        addToast('Order status created successfully.');
      }

      navigate('/orders/status');
    } catch (error) {
      addToast(error.message || 'Unable to save order status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <PageHeader
        title={isEditMode ? 'Edit Order Status' : 'Add Order Status'}
        icon={ClipboardEdit}
        subtitle="Create and maintain the shared order status list used across order workflows."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/orders/status')}>
              Back
            </Button>
            <Button icon={Save} onClick={handleSubmit} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Status' : 'Create Status'}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading order status...</span>
          </div>
        </div>
      ) : (
        <Card className="space-y-6">
          <Input
            label="Status Name"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            placeholder="Enter status name"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Color"
              name="color"
              type="color"
              value={form.color}
              onChange={handleInputChange}
              className="[&>input]:h-11 [&>input]:cursor-pointer [&>input]:p-1.5"
            />
            <Input
              label="Sort Order"
              name="sort_order"
              type="number"
              min="1"
              value={form.sort_order}
              onChange={handleInputChange}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.02]">
            <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">Preview</p>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${fallbackBadgeClasses}`}
              style={{
                backgroundColor: `${form.color || '#64748b'}22`,
                borderColor: form.color || '#64748b',
                color: form.color || '#64748b',
              }}
            >
              {form.name || 'Status Preview'}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OrderStatusFormPage;
