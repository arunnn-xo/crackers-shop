import { useEffect, useState } from 'react';
import { ArrowLeft, Save, UserRound, LoaderCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/FormFields';
import { apiRequest } from '../../lib/api';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
};

const CustomerFormPage = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { addToast } = useToast();
  const isEditMode = Boolean(customerId);

  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let isMounted = true;

    const loadCustomer = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest(`/customers/${customerId}`);

        if (!isMounted) {
          return;
        }

        const customer = response.data || {};
        setForm({
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          pincode: customer.pincode || '',
        });
      } catch (error) {
        addToast(error.message || 'Unable to load customer.', 'error');
        navigate('/website/customers');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCustomer();

    return () => {
      isMounted = false;
    };
  }, [addToast, customerId, isEditMode, navigate]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      addToast('Customer name is required.', 'error');
      return;
    }

    if (!form.phone.trim()) {
      addToast('Phone number is required.', 'error');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    };

    try {
      setIsSubmitting(true);

      if (isEditMode) {
        await apiRequest(`/customers/${customerId}`, {
          method: 'PUT',
          body: payload,
        });
        addToast('Customer updated successfully.');
      } else {
        await apiRequest('/customers', {
          method: 'POST',
          body: payload,
        });
        addToast('Customer created successfully.');
      }

      navigate('/website/customers');
    } catch (error) {
      addToast(error.message || 'Unable to save customer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      <PageHeader
        title={isEditMode ? 'Edit Customer' : 'Add Customer'}
        icon={UserRound}
        subtitle="Store customer contact and address details for orders and admin tracking."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/website/customers')} icon={ArrowLeft}>
              Back
            </Button>
            <Button onClick={handleSubmit} icon={Save} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading customer...</span>
          </div>
        </div>
      ) : (
        <Card className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Customer Name"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              placeholder="Arun Kumar"
            />
            <Input
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleInputChange}
              placeholder="9876543210"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="customer@example.com"
            />
            <Input
              label="Pincode"
              name="pincode"
              value={form.pincode}
              onChange={handleInputChange}
              placeholder="600001"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={handleInputChange}
              placeholder="Chennai"
            />
            <Input
              label="State"
              name="state"
              value={form.state}
              onChange={handleInputChange}
              placeholder="Tamil Nadu"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleInputChange}
              rows={4}
              placeholder="Street, area, landmark"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-[#0a0a0f] dark:text-white dark:placeholder-slate-600"
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default CustomerFormPage;
