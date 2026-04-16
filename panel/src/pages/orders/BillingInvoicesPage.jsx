import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
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

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
};

const getCustomerAddress = (invoice) =>
  [invoice.customer_address, invoice.customer_city, invoice.customer_state, invoice.customer_pincode]
    .filter(Boolean)
    .join(', ');

const buildInvoiceHtml = ({ invoice, settings }) => {
  const companyName = settings.company_name || 'Crackers Shop';
  const companyPhone = settings.primary_phone || '';
  const companyEmail = settings.email || '';
  const companyAddress = settings.address || '';
  const customerAddress = getCustomerAddress(invoice);
  const itemsHtml = (invoice.items || [])
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.product_name || `Product #${item.product_id}`}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.price)}</td>
          <td>${formatCurrency(item.total)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <html>
      <head>
        <title>${invoice.order_no}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; margin-bottom: 28px; gap: 32px; }
          .title { font-size: 28px; font-weight: 700; margin: 0 0 10px; }
          .muted { color: #475569; font-size: 13px; line-height: 1.6; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; }
          .totals { width: 340px; margin-left: auto; margin-top: 20px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .totals-row.total { font-size: 18px; font-weight: 700; border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <p class="title">${companyName}</p>
            <div class="muted">
              <div>${companyAddress}</div>
              <div>${companyPhone}</div>
              <div>${companyEmail}</div>
            </div>
          </div>
          <div>
            <p class="title">Invoice</p>
            <div class="muted">
              <div><strong>Invoice No:</strong> ${invoice.order_no}</div>
              <div><strong>Date:</strong> ${formatDate(invoice.order_date)}</div>
              <div><strong>Order Status:</strong> ${invoice.status}</div>
              <div><strong>Payment:</strong> ${invoice.payment_status}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Bill To</div>
          <div class="muted">
            <div><strong>${invoice.customer_name || 'Walk-in Customer'}</strong></div>
            <div>${invoice.customer_phone || ''}</div>
            <div>${customerAddress || '-'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Sub Total</span><strong>${formatCurrency(invoice.sub_total)}</strong></div>
          <div class="totals-row"><span>Shipping</span><strong>${formatCurrency(invoice.shipping)}</strong></div>
          <div class="totals-row"><span>Discount</span><strong>${formatCurrency(invoice.discount)}</strong></div>
          <div class="totals-row total"><span>Grand Total</span><span>${formatCurrency(invoice.total)}</span></div>
        </div>

        <div class="section" style="margin-top: 28px;">
          <div class="section-title">Notes</div>
          <div class="muted">${invoice.notes || '-'}</div>
        </div>
      </body>
    </html>
  `;
};

const BillingInvoicesPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [filters, setFilters] = useState({
    payment_status: 'All',
    status: 'All',
    start_date: '',
    end_date: '',
    search: '',
  });
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayBilling: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState(FALLBACK_ORDER_STATUSES);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(createInitialInvoiceForm());
  const [customerForm, setCustomerForm] = useState(createInitialCustomerForm());
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('Pending');
  const [invoiceProductOverrides, setInvoiceProductOverrides] = useState([]);

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
    const [customersResponse, productsResponse, statusResponse, settingsResponse] = await Promise.all([
      apiRequest('/customers?limit=500'),
      apiRequest('/products?limit=500'),
      apiRequest('/settings/order-statuses'),
      apiRequest('/settings'),
    ]);

    setCustomers(customersResponse.data || []);
    setProducts(productsResponse.data || []);
    setOrderStatuses(
      (statusResponse.data || []).length > 0
        ? statusResponse.data.map((status) => status.name)
        : FALLBACK_ORDER_STATUSES
    );
    setSettings(settingsResponse.data || {});
  }, []);

  const loadBillingData = useCallback(
    async (nextFilters = filters, { showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const query = new URLSearchParams({
          type: 'BILLING',
          limit: '500',
        });

        if (nextFilters.status && nextFilters.status !== 'All') {
          query.set('status', nextFilters.status);
        }
        if (nextFilters.payment_status && nextFilters.payment_status !== 'All') {
          query.set('payment_status', nextFilters.payment_status);
        }
        if (nextFilters.start_date) {
          query.set('start_date', nextFilters.start_date);
        }
        if (nextFilters.end_date) {
          query.set('end_date', nextFilters.end_date);
        }
        if (nextFilters.search.trim()) {
          query.set('search', nextFilters.search.trim());
        }

        const [invoicesResponse, statsResponse] = await Promise.all([
          apiRequest(`/orders?${query.toString()}`),
          apiRequest('/orders/stats?type=BILLING'),
        ]);

        setInvoices(invoicesResponse.data || []);
        setStats(statsResponse.data || {});
      } catch (error) {
        addToast(error.message || 'Unable to load billing invoices.', 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        await Promise.all([loadReferenceData(), loadBillingData(filters)]);
      } catch (error) {
        addToast(error.message || 'Unable to load billing desk.', 'error');
        setIsLoading(false);
      }
    };

    loadPage();
  }, [addToast, loadBillingData, loadReferenceData]);

  const fetchInvoiceDetail = useCallback(async (invoiceId) => {
    const response = await apiRequest(`/orders/${invoiceId}`);
    return response.data;
  }, []);

  const resetInvoiceModal = () => {
    setEditingInvoiceId(null);
    setInvoiceForm(createInitialInvoiceForm());
    setInvoiceProductOverrides([]);
    setIsInvoiceModalOpen(false);
  };

  const openCreateInvoiceModal = () => {
    setEditingInvoiceId(null);
    setInvoiceForm(createInitialInvoiceForm());
    setInvoiceProductOverrides([]);
    setIsInvoiceModalOpen(true);
  };

  const openEditInvoiceModal = async (invoiceId) => {
    try {
      const invoice = await fetchInvoiceDetail(invoiceId);
      const missingProducts = (invoice.items || [])
        .filter(
          (item) => !activeProducts.some((product) => String(product.id) === String(item.product_id))
        )
        .map((item) => ({
          id: item.product_id,
          name: item.product_name || `Product #${item.product_id}`,
          price: item.price,
          sale_price: item.price,
          is_active: 0,
        }));

      setEditingInvoiceId(invoice.id);
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
      setIsInvoiceModalOpen(true);
    } catch (error) {
      addToast(error.message || 'Unable to load invoice for editing.', 'error');
    }
  };

  const openViewInvoiceModal = async (invoiceId) => {
    try {
      const invoice = await fetchInvoiceDetail(invoiceId);
      setSelectedInvoice(invoice);
      setIsViewModalOpen(true);
    } catch (error) {
      addToast(error.message || 'Unable to load invoice details.', 'error');
    }
  };

  const openPaymentStatusModal = (invoice) => {
    setSelectedInvoice(invoice);
    setSelectedPaymentStatus(invoice.payment_status || 'Pending');
    setIsPaymentModalOpen(true);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadBillingData(filters);
  };

  const handleResetFilters = () => {
    const nextFilters = {
      payment_status: 'All',
      status: 'All',
      start_date: '',
      end_date: '',
      search: '',
    };
    setFilters(nextFilters);
    loadBillingData(nextFilters);
  };

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
          const selectedProduct = activeProducts.find((product) => String(product.id) === String(value));
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
      setIsSubmittingInvoice(true);

      if (editingInvoiceId) {
        await apiRequest(`/orders/${editingInvoiceId}`, {
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

      resetInvoiceModal();
      await loadBillingData(filters);
    } catch (error) {
      addToast(error.message || 'Unable to save billing invoice.', 'error');
    } finally {
      setIsSubmittingInvoice(false);
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

  const handlePaymentStatusUpdate = async () => {
    if (!selectedInvoice?.id) {
      return;
    }

    try {
      setIsSubmittingPayment(true);
      await apiRequest(`/orders/${selectedInvoice.id}/payment-status`, {
        method: 'PUT',
        body: { payment_status: selectedPaymentStatus },
      });
      setIsPaymentModalOpen(false);
      addToast('Payment status updated successfully.');
      await loadBillingData(filters);
      if (isViewModalOpen && selectedInvoice.id) {
        const updatedInvoice = await fetchInvoiceDetail(selectedInvoice.id);
        setSelectedInvoice(updatedInvoice);
      }
    } catch (error) {
      addToast(error.message || 'Unable to update payment status.', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handlePrintInvoice = async (invoiceId) => {
    try {
      const invoice = selectedInvoice?.id === invoiceId ? selectedInvoice : await fetchInvoiceDetail(invoiceId);
      const printWindow = window.open('', '_blank', 'width=1100,height=800');

      if (!printWindow) {
        addToast('Popup blocked. Allow popups to print invoices.', 'error');
        return;
      }

      printWindow.document.write(buildInvoiceHtml({ invoice, settings }));
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      addToast(error.message || 'Unable to print invoice.', 'error');
    }
  };

  const tableRows = useMemo(
    () =>
      invoices.map((invoice, index) => ({
        ...invoice,
        serial: index + 1,
        invoiceDate: formatDate(invoice.order_date),
        customerLabel: invoice.customer_name || 'Unknown customer',
        subTotalLabel: invoice.sub_total,
        shippingLabel: invoice.shipping,
        totalLabel: invoice.total,
      })),
    [invoices]
  );

  const columns = useMemo(
    () => [
      { key: 'serial', label: 'S.No' },
      { key: 'invoiceDate', label: 'Invoice Date' },
      {
        key: 'order_no',
        label: 'Invoice No',
        render: (value) => <span className="font-semibold text-amber-600 dark:text-amber-400">{value}</span>,
      },
      {
        key: 'customerLabel',
        label: 'Customer',
        render: (value, row) => (
          <div>
            <p className="font-medium text-slate-800 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.customer_phone || '-'}</p>
          </div>
        ),
      },
      {
        key: 'subTotalLabel',
        label: 'Sub Total',
        render: (value) => <span className="text-slate-600 dark:text-slate-300">{formatCurrency(value)}</span>,
      },
      {
        key: 'shippingLabel',
        label: 'Shipping',
        render: (value) => <span className="text-slate-600 dark:text-slate-300">{formatCurrency(value)}</span>,
      },
      {
        key: 'totalLabel',
        label: 'Total',
        render: (value) => <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(value)}</span>,
      },
      {
        key: 'payment_status',
        label: 'Payment',
        render: (value) => <Badge status={value || 'Pending'} />,
      },
      {
        key: 'status',
        label: 'Order Status',
        render: (value) => <Badge status={value || 'Pending'} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => (
          <div className="flex gap-2">
            <button
              onClick={() => openViewInvoiceModal(row.id)}
              className="rounded bg-sky-50 p-1.5 text-sky-600 transition-colors hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
              title="View invoice"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate(`/orders/billing/${row.id}/edit`)}
              className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              title="Edit invoice"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => openPaymentStatusModal(row)}
              className="rounded bg-violet-50 p-1.5 text-violet-600 transition-colors hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20"
              title="Update payment status"
            >
              <Wallet className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePrintInvoice(row.id)}
              className="rounded bg-amber-50 p-1.5 text-amber-600 transition-colors hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
              title="Print invoice"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Billing & Invoices"
        icon={Receipt}
        subtitle="Create counter bills, manage invoice statuses, and print clean customer-ready invoices."
        badge={`${invoices.length} invoices`}
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" icon={RefreshCcw} onClick={() => loadBillingData(filters)} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button icon={Plus} onClick={() => navigate('/orders/billing/new')}>
              New Bill / Order
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total Billed Amount',
            value: formatCurrency(stats.totalRevenue),
            color: 'text-white',
            boxClass: 'border-0 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 shadow-[0_12px_30px_rgba(245,158,11,0.28)]',
            pillClass: 'bg-white/20 text-white',
            labelClass: 'text-amber-50/90',
          },
          {
            title: "Today's Billing",
            value: formatCurrency(stats.todayBilling),
            color: 'text-white',
            boxClass: 'border-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-[0_12px_30px_rgba(16,185,129,0.25)]',
            pillClass: 'bg-white/20 text-white',
            labelClass: 'text-emerald-50/90',
          },
          {
            title: 'Pending Payment Invoices',
            value: String(stats.pendingOrders || 0),
            color: 'text-white',
            boxClass: 'border-0 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 shadow-[0_12px_30px_rgba(244,63,94,0.26)]',
            pillClass: 'bg-white/20 text-white',
            labelClass: 'text-rose-50/90',
          },
          {
            title: 'Completed Invoices',
            value: String(stats.completedOrders || 0),
            color: 'text-white',
            boxClass: 'border-0 bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600 shadow-[0_12px_30px_rgba(14,165,233,0.25)]',
            pillClass: 'bg-white/20 text-white',
            labelClass: 'text-sky-50/90',
          },
        ].map((card) => (
          <Card key={card.title} className={`relative overflow-hidden ${card.boxClass}`}>
            <div className="absolute -right-6 top-0 h-24 w-24 rounded-full bg-white/15 blur-2xl"></div>
            <div className="absolute bottom-0 left-6 h-16 w-16 rounded-full bg-white/10 blur-xl"></div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${card.pillClass}`}>Summary</span>
            <p className={`mt-4 text-sm font-medium ${card.labelClass}`}>{card.title}</p>
            <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Select
            label="Payment Status"
            name="payment_status"
            value={filters.payment_status}
            onChange={handleFilterChange}
            options={['All', ...PAYMENT_STATUS_OPTIONS]}
          />
          <Select
            label="Order Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={['All', ...orderStatuses]}
          />
          <Input label="Start Date" name="start_date" type="date" value={filters.start_date} onChange={handleFilterChange} />
          <Input label="End Date" name="end_date" type="date" value={filters.end_date} onChange={handleFilterChange} />
          <Input
            label="Customer / Invoice Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Invoice no, customer, phone"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button className="w-full sm:w-auto" icon={Search} onClick={handleApplyFilters}>
            Apply Filters
          </Button>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={handleResetFilters}>
            Reset
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading billing invoices...</span>
          </div>
        </div>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={tableRows}
            searchPlaceholder="Search within the loaded billing invoices..."
            exportFileName="billing-invoices"
          />
          <div className="mt-4 flex flex-wrap justify-end gap-6 border-t border-slate-200 pt-4 text-sm dark:border-white/10">
            <span className="text-slate-500 dark:text-slate-400">
              Total Invoices: <span className="font-bold text-slate-800 dark:text-white">{invoices.length}</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Pending Payments:{' '}
              <span className="font-bold text-rose-600 dark:text-rose-400">{stats.pendingOrders || 0}</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Total Revenue:{' '}
              <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(stats.totalRevenue)}</span>
            </span>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedInvoice(null);
        }}
        title={selectedInvoice ? `Invoice ${selectedInvoice.order_no}` : 'Invoice Details'}
        maxWidthClass="max-w-4xl"
      >
        {!selectedInvoice ? (
          <div className="flex min-h-40 items-center justify-center text-slate-500 dark:text-slate-400">
            Loading invoice...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Invoice No</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{selectedInvoice.order_no}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Invoice Date</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{formatDate(selectedInvoice.order_date)}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Order Status</p>
                <div className="mt-2">
                  <Badge status={selectedInvoice.status || 'Pending'} />
                </div>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Payment</p>
                <div className="mt-2">
                  <Badge status={selectedInvoice.payment_status || 'Pending'} />
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Customer Details">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedInvoice.customer_name || '-'}</p>
                  <p>{selectedInvoice.customer_phone || '-'}</p>
                  <p>{getCustomerAddress(selectedInvoice) || '-'}</p>
                </div>
              </Card>
              <Card title="Notes">
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedInvoice.notes || '-'}</p>
              </Card>
            </div>
            <Card title="Invoice Items">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Rate</th>
                      <th className="px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoice.items || []).map((item) => (
                      <tr key={`${item.product_id}-${item.id}`} className="border-b border-slate-100 dark:border-white/5">
                        <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">
                          {item.product_name || `Product #${item.product_id}`}
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{item.quantity}</td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(item.price)}</td>
                        <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="ml-auto w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Sub Total</span>
                  <strong>{formatCurrency(selectedInvoice.sub_total)}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Shipping</span>
                  <strong>{formatCurrency(selectedInvoice.shipping)}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Discount</span>
                  <strong>{formatCurrency(selectedInvoice.discount)}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900 dark:border-white/10 dark:text-white">
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  navigate(`/orders/billing/${selectedInvoice.id}/edit`);
                }}
              >
                Edit Invoice
              </Button>
              <Button onClick={() => handlePrintInvoice(selectedInvoice.id)} icon={Printer}>
                Print Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={selectedInvoice ? `Update Payment Status - ${selectedInvoice.order_no}` : 'Update Payment Status'}
      >
        <div className="space-y-4">
          <Select
            label="Payment Status"
            value={selectedPaymentStatus}
            onChange={(event) => setSelectedPaymentStatus(event.target.value)}
            options={PAYMENT_STATUS_OPTIONS.map((status) => ({ label: status, value: status }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)} disabled={isSubmittingPayment}>
              Cancel
            </Button>
            <Button onClick={handlePaymentStatusUpdate} disabled={isSubmittingPayment}>
              {isSubmittingPayment ? 'Saving...' : 'Update Payment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BillingInvoicesPage;
