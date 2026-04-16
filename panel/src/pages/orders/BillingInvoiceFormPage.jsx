import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, LoaderCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { apiRequest } from '../../lib/api';

const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Failed'];
const FALLBACK_ORDER_STATUSES = ['Pending', 'Dispatch', 'Complete', 'Payment Pending', 'Printed', 'Paid'];

const createEmptyItem = () => ({
  product_id: '',
  quantity: '1',
  price: '',
});

const createInitialInvoiceForm = () => ({
  customer_id: '',
  status: 'Pending',
  payment_status: 'Pending',
  shipping: '0',
  discount: '0',
  notes: '',
  items: [createEmptyItem()],
});

const createInitialCustomerForm = () => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
});

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const BillingInvoiceFormPage = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const { addToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState(FALLBACK_ORDER_STATUSES);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  
  const [invoiceForm, setInvoiceForm] = useState(createInitialInvoiceForm());
  const [customerForm, setCustomerForm] = useState(createInitialCustomerForm());
  const [invoiceProductOverrides, setInvoiceProductOverrides] = useState([]);

  const isEditing = Boolean(invoiceId);

  const activeProducts = useMemo(
    () => products.filter((product) => Number(product.is_active ?? 1) === 1),
    [products]
  );

  const customerOptions = useMemo(
    () => [
      { label: 'Select Customer', value: '' },
      ...customers.map((customer) => ({
        label: `${customer.name} (${customer.phone})`,
        value: String(customer.id),
      })),
    ],
    [customers]
  );

  const productOptions = useMemo(
    () => [
      { label: 'Select Product', value: '' },
      ...[...activeProducts, ...invoiceProductOverrides]
        .filter((product, index, productsList) => index === productsList.findIndex((entry) => String(entry.id) === String(product.id)))
        .map((product) => ({
        label: `${product.name} - ${formatCurrency(product.sale_price || product.price)}`,
        value: String(product.id),
      })),
    ],
    [activeProducts, invoiceProductOverrides]
  );

  const orderStatusOptions = useMemo(
    () => orderStatuses.map((status) => ({ label: status, value: status })),
    [orderStatuses]
  );

  const loadReferenceData = useCallback(async () => {
    const [customersResponse, productsResponse, statusResponse] = await Promise.all([
      apiRequest('/customers?limit=500'),
      apiRequest('/products?limit=500'),
      apiRequest('/settings/order-statuses'),
    ]);

    setCustomers(customersResponse.data || []);
    setProducts(productsResponse.data || []);
    setOrderStatuses(
      (statusResponse.data || []).length > 0
        ? statusResponse.data.map((status) => status.name)
        : FALLBACK_ORDER_STATUSES
    );
  }, []);

  const loadInvoiceData = useCallback(async () => {
    try {
      const response = await apiRequest(`/orders/${invoiceId}`);
      const invoice = response.data;
      
      const missingProducts = (invoice.items || [])
        .filter(
          (item) => !products.some((product) => String(product.id) === String(item.product_id))
        )
        .map((item) => ({
          id: item.product_id,
          name: item.product_name || `Product #${item.product_id}`,
          price: item.price,
          sale_price: item.price,
          is_active: 0,
        }));

      setInvoiceProductOverrides(missingProducts);
      setInvoiceForm({
        customer_id: String(invoice.customer_id || ''),
        status: invoice.status || 'Pending',
        payment_status: invoice.payment_status || 'Pending',
        shipping: String(invoice.shipping ?? 0),
        discount: String(invoice.discount ?? 0),
        notes: invoice.notes || '',
        items:
          (invoice.items || []).map((item) => ({
            product_id: String(item.product_id || ''),
            quantity: String(item.quantity ?? 1),
            price: String(item.price ?? 0),
          })) || [createEmptyItem()],
      });
    } catch (error) {
      addToast(error.message || 'Unable to load invoice details.', 'error');
      navigate('/orders/billing');
    }
  }, [invoiceId, products, addToast, navigate]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadReferenceData();
      if (isEditing) {
        await loadInvoiceData();
      }
      setIsLoading(false);
    };
    init();
  }, [isEditing, loadReferenceData]); // loadInvoiceData omitted to avoid refetch loop since products dependency changes

  useEffect(() => {
    if (isEditing && products.length > 0 && isLoading === false) {
       // We handle the initial load differently so missing products can be found
    }
  }, [isEditing, products, isLoading]);
  
  // A better approach for loading invoice after products map is initialized
  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [customersResponse, productsResponse, statusResponse] = await Promise.all([
          apiRequest('/customers?limit=500'),
          apiRequest('/products?limit=500'),
          apiRequest('/settings/order-statuses'),
        ]);
        
        if (!active) return;
        
        setCustomers(customersResponse.data || []);
        const loadedProducts = productsResponse.data || [];
        setProducts(loadedProducts);
        setOrderStatuses(
          (statusResponse.data || []).length > 0
            ? statusResponse.data.map((status) => status.name)
            : FALLBACK_ORDER_STATUSES
        );

        if (isEditing) {
          const response = await apiRequest(`/orders/${invoiceId}`);
          const invoice = response.data;
          
          const missingProducts = (invoice.items || [])
            .filter(
              (item) => !loadedProducts.some((product) => String(product.id) === String(item.product_id))
            )
            .map((item) => ({
              id: item.product_id,
              name: item.product_name || `Product #${item.product_id}`,
              price: item.price,
              sale_price: item.price,
              is_active: 0,
            }));

          setInvoiceProductOverrides(missingProducts);
          setInvoiceForm({
            customer_id: String(invoice.customer_id || ''),
            status: invoice.status || 'Pending',
            payment_status: invoice.payment_status || 'Pending',
            shipping: String(invoice.shipping ?? 0),
            discount: String(invoice.discount ?? 0),
            notes: invoice.notes || '',
            items:
              (invoice.items || []).map((item) => ({
                product_id: String(item.product_id || ''),
                quantity: String(item.quantity ?? 1),
                price: String(item.price ?? 0),
              })) || [createEmptyItem()],
          });
        }
      } catch (error) {
        addToast(error.message || 'Unable to load data.', 'error');
        if (isEditing) navigate('/orders/billing');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, [isEditing, invoiceId, navigate, addToast]);


  const handleInvoiceFieldChange = (event) => {
    const { name, value } = event.target;
    setInvoiceForm((current) => ({ ...current, [name]: value }));
  };

  const handleInvoiceItemChange = (index, field, value) => {
    setInvoiceForm((current) => {
      const nextItems = current.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const nextItem = { ...item, [field]: value };

        if (field === 'product_id') {
          const selectedProduct = activeProducts.find((product) => String(product.id) === String(value)) || 
                                  invoiceProductOverrides.find((product) => String(product.id) === String(value));
          if (selectedProduct) {
            nextItem.price = String(selectedProduct.sale_price || selectedProduct.price || 0);
          }
        }

        return nextItem;
      });

      return { ...current, items: nextItems };
    });
  };

  const addInvoiceItem = () => {
    setInvoiceForm((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()],
    }));
  };

  const removeInvoiceItem = (index) => {
    setInvoiceForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const invoiceTotals = useMemo(() => {
    const subTotal = invoiceForm.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
      0
    );
    const shipping = Number(invoiceForm.shipping || 0);
    const discount = Number(invoiceForm.discount || 0);
    return {
      subTotal,
      shipping,
      discount,
      grandTotal: subTotal + shipping - discount,
    };
  }, [invoiceForm]);

  const handleSubmitInvoice = async () => {
    if (!invoiceForm.customer_id) {
      addToast('Customer is required.', 'error');
      return;
    }

    if (invoiceForm.items.length === 0) {
      addToast('Add at least one product line item.', 'error');
      return;
    }

    const itemsPayload = invoiceForm.items.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    if (itemsPayload.some((item) => !item.product_id || item.quantity <= 0 || item.price < 0)) {
      addToast('Each line item needs a product, positive quantity, and valid price.', 'error');
      return;
    }

    if (invoiceTotals.grandTotal < 0) {
      addToast('Grand total cannot be negative.', 'error');
      return;
    }

    const payload = {
      customer_id: Number(invoiceForm.customer_id),
      items: itemsPayload,
      order_type: 'BILLING',
      shipping: Number(invoiceForm.shipping || 0),
      discount: Number(invoiceForm.discount || 0),
      payment_status: invoiceForm.payment_status,
      status: invoiceForm.status,
      notes: invoiceForm.notes.trim(),
    };

    try {
      setIsSubmitting(true);

      if (isEditing) {
        await apiRequest(`/orders/${invoiceId}`, {
          method: 'PUT',
          body: payload,
        });
        addToast('Billing invoice updated successfully.');
      } else {
        await apiRequest('/orders', {
          method: 'POST',
          body: payload,
        });
        addToast('Billing invoice created successfully.');
      }
      
      navigate('/orders/billing');
    } catch (error) {
      addToast(error.message || 'Unable to save billing invoice.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerFieldChange = (event) => {
    const { name, value } = event.target;
    setCustomerForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateCustomer = async () => {
    if (!customerForm.name.trim()) {
      addToast('Customer name is required.', 'error');
      return;
    }

    if (!customerForm.phone.trim()) {
      addToast('Phone number is required.', 'error');
      return;
    }

    const payload = {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      email: customerForm.email.trim(),
      address: customerForm.address.trim(),
      city: customerForm.city.trim(),
      state: customerForm.state.trim(),
      pincode: customerForm.pincode.trim(),
    };

    try {
      setIsSubmittingCustomer(true);
      const response = await apiRequest('/customers', {
        method: 'POST',
        body: payload,
      });

      const nextCustomer = {
        id: response.id,
        ...payload,
      };

      setCustomers((current) => [nextCustomer, ...current]);
      setInvoiceForm((current) => ({ ...current, customer_id: String(response.id) }));
      setCustomerForm(createInitialCustomerForm());
      setIsCustomerModalOpen(false);
      addToast('Customer created successfully.');
    } catch (error) {
      addToast(error.message || 'Unable to create customer.', 'error');
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span>Loading invoice data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto">
      <PageHeader
        title={isEditing ? 'Edit Billing Invoice' : 'New Billing Invoice'}
        icon={isEditing ? Save : Plus}
        action={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/orders/billing')}>
            Back to Invoices
          </Button>
        }
      />

      <Card>
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Customer Details</h3>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <Select
                label="Customer"
                name="customer_id"
                value={invoiceForm.customer_id}
                onChange={handleInvoiceFieldChange}
                options={customerOptions}
              />
              <div className="flex items-end">
                <Button variant="secondary" onClick={() => setIsCustomerModalOpen(true)}>
                  Quick Add Customer
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Order Details</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Select
                label="Order Status"
                name="status"
                value={invoiceForm.status}
                onChange={handleInvoiceFieldChange}
                options={orderStatusOptions}
              />
              <Select
                label="Payment Status"
                name="payment_status"
                value={invoiceForm.payment_status}
                onChange={handleInvoiceFieldChange}
                options={PAYMENT_STATUS_OPTIONS.map((status) => ({ label: status, value: status }))}
              />
              <Input
                label="Shipping"
                name="shipping"
                type="number"
                min="0"
                step="0.01"
                value={invoiceForm.shipping}
                onChange={handleInvoiceFieldChange}
              />
              <Input
                label="Discount"
                name="discount"
                type="number"
                min="0"
                step="0.01"
                value={invoiceForm.discount}
                onChange={handleInvoiceFieldChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Line Items</h3>
              <Button variant="secondary" onClick={addInvoiceItem} icon={Plus}>
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {invoiceForm.items.map((item, index) => (
                <div key={`${index}-${item.product_id}`} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_120px_140px_140px_auto]">
                    <Select
                      label={`Product ${index + 1}`}
                      value={item.product_id}
                      onChange={(event) => handleInvoiceItemChange(index, 'product_id', event.target.value)}
                      options={productOptions}
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) => handleInvoiceItemChange(index, 'quantity', event.target.value)}
                    />
                    <Input
                      label="Rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(event) => handleInvoiceItemChange(index, 'price', event.target.value)}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Line Total</label>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-white/[0.02] dark:text-white">
                        {formatCurrency(Number(item.quantity || 0) * Number(item.price || 0))}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="danger"
                        onClick={() => removeInvoiceItem(index)}
                        disabled={invoiceForm.items.length === 1}
                        icon={Trash2}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Notes</label>
              <textarea
                name="notes"
                value={invoiceForm.notes}
                onChange={handleInvoiceFieldChange}
                rows={5}
                placeholder="Add invoice notes or billing remarks"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-[#0a0a0f] dark:text-white dark:placeholder-slate-600"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.02]">
              <h4 className="text-base font-semibold text-slate-800 dark:text-white">Totals</h4>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Sub Total</span>
                  <strong>{formatCurrency(invoiceTotals.subTotal)}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Shipping</span>
                  <strong>{formatCurrency(invoiceTotals.shipping)}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Discount</span>
                  <strong>{formatCurrency(invoiceTotals.discount)}</strong>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900 dark:border-white/10 dark:text-white">
                  <span>Grand Total</span>
                  <span>{formatCurrency(invoiceTotals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <Button variant="secondary" onClick={() => navigate('/orders/billing')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitInvoice} icon={Save} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Quick Add Customer"
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Customer Name" name="name" value={customerForm.name} onChange={handleCustomerFieldChange} />
            <Input label="Phone Number" name="phone" value={customerForm.phone} onChange={handleCustomerFieldChange} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Email" name="email" value={customerForm.email} onChange={handleCustomerFieldChange} />
            <Input label="Pincode" name="pincode" value={customerForm.pincode} onChange={handleCustomerFieldChange} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="City" name="city" value={customerForm.city} onChange={handleCustomerFieldChange} />
            <Input label="State" name="state" value={customerForm.state} onChange={handleCustomerFieldChange} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Address</label>
            <textarea
              name="address"
              value={customerForm.address}
              onChange={handleCustomerFieldChange}
              rows={4}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-[#0a0a0f] dark:text-white dark:placeholder-slate-600"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsCustomerModalOpen(false)} disabled={isSubmittingCustomer}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} icon={Save} disabled={isSubmittingCustomer}>
              {isSubmittingCustomer ? 'Saving...' : 'Create Customer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BillingInvoiceFormPage;
