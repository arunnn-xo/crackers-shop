import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, LoaderCircle, Printer, RefreshCcw, Save, Search, ShoppingBasket, Wallet } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { apiRequest } from '../../lib/api';

const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Failed'];
const FALLBACK_ORDER_STATUSES = ['Pending', 'Dispatch', 'Complete', 'Payment Pending', 'Printed', 'Paid'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value, withTime = false) => {
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
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};

const getCustomerAddress = (order) =>
  [order.customer_address, order.customer_city, order.customer_state, order.customer_pincode].filter(Boolean).join(', ');

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

const TodayOrdersPage = () => {
  const { addToast } = useToast();
  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    payment_status: 'All',
    search: '',
  });
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    completedOrders: 0,
  });
  const [orderStatuses, setOrderStatuses] = useState(FALLBACK_ORDER_STATUSES);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('Pending');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const loadReferenceData = useCallback(async () => {
    const [statusResponse, settingsResponse] = await Promise.all([
      apiRequest('/settings/order-statuses'),
      apiRequest('/settings'),
    ]);

    setOrderStatuses(
      (statusResponse.data || []).length > 0
        ? statusResponse.data.map((status) => status.name)
        : FALLBACK_ORDER_STATUSES
    );
    setSettings(settingsResponse.data || {});
  }, []);

  const loadTodayOrders = useCallback(
    async (nextFilters = filters, { showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const query = new URLSearchParams();
        if (nextFilters.type && nextFilters.type !== 'All') {
          query.set('type', nextFilters.type);
        }
        if (nextFilters.status && nextFilters.status !== 'All') {
          query.set('status', nextFilters.status);
        }
        if (nextFilters.payment_status && nextFilters.payment_status !== 'All') {
          query.set('payment_status', nextFilters.payment_status);
        }
        if (nextFilters.search.trim()) {
          query.set('search', nextFilters.search.trim());
        }

        const queryString = query.toString();
        const [ordersResponse, statsResponse] = await Promise.all([
          apiRequest(`/orders/today${queryString ? `?${queryString}` : ''}`),
          apiRequest(`/orders/today/stats${queryString ? `?${queryString}` : ''}`),
        ]);

        setOrders(ordersResponse.data || []);
        setStats(statsResponse.data || {});
      } catch (error) {
        addToast(error.message || 'Unable to load today orders.', 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast, filters]
  );

  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        await Promise.all([loadReferenceData(), loadTodayOrders(filters)]);
      } catch (error) {
        addToast(error.message || 'Unable to load today orders page.', 'error');
        setIsLoading(false);
      }
    };

    loadPage();
  }, [addToast, filters, loadReferenceData, loadTodayOrders]);

  const fetchOrderDetail = useCallback(async (orderId) => {
    const response = await apiRequest(`/orders/${orderId}`);
    return response.data;
  }, []);

  const openViewModal = async (orderId) => {
    try {
      const order = await fetchOrderDetail(orderId);
      setSelectedOrder(order);
      setIsViewModalOpen(true);
    } catch (error) {
      addToast(error.message || 'Unable to load order details.', 'error');
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status || 'Pending');
    setIsStatusModalOpen(true);
  };

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setSelectedPaymentStatus(order.payment_status || 'Pending');
    setIsPaymentModalOpen(true);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadTodayOrders(filters);
  };

  const handleResetFilters = () => {
    const nextFilters = {
      type: 'All',
      status: 'All',
      payment_status: 'All',
      search: '',
    };
    setFilters(nextFilters);
    loadTodayOrders(nextFilters);
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder?.id) {
      return;
    }

    try {
      setIsSavingStatus(true);
      await apiRequest(`/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        body: { status: selectedStatus },
      });
      addToast('Order status updated successfully.');
      setIsStatusModalOpen(false);
      await loadTodayOrders(filters);
      if (isViewModalOpen && selectedOrder.id) {
        const updatedOrder = await fetchOrderDetail(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      addToast(error.message || 'Unable to update order status.', 'error');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!selectedOrder?.id) {
      return;
    }

    try {
      setIsSavingPayment(true);
      await apiRequest(`/orders/${selectedOrder.id}/payment-status`, {
        method: 'PUT',
        body: { payment_status: selectedPaymentStatus },
      });
      addToast('Payment status updated successfully.');
      setIsPaymentModalOpen(false);
      await loadTodayOrders(filters);
      if (isViewModalOpen && selectedOrder.id) {
        const updatedOrder = await fetchOrderDetail(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      addToast(error.message || 'Unable to update payment status.', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handlePrintInvoice = async (orderId) => {
    try {
      const order = selectedOrder?.id === orderId ? selectedOrder : await fetchOrderDetail(orderId);
      const printWindow = window.open('', '_blank', 'width=1100,height=800');

      if (!printWindow) {
        addToast('Popup blocked. Allow popups to print invoices.', 'error');
        return;
      }

      printWindow.document.write(buildInvoiceHtml({ invoice: order, settings }));
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      addToast(error.message || 'Unable to print invoice.', 'error');
    }
  };

  const tableRows = useMemo(
    () =>
      orders.map((order, index) => ({
        ...order,
        serial: index + 1,
        customerLabel: order.customer_name || 'Unknown customer',
        createdLabel: formatDate(order.created_at, true),
      })),
    [orders]
  );

  const columns = useMemo(
    () => [
      { key: 'serial', label: 'S.No' },
      {
        key: 'order_no',
        label: 'Order No',
        render: (value) => <span className="font-semibold text-slate-900 dark:text-white">{value}</span>,
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
        key: 'order_type',
        label: 'Type',
        render: (value) => <Badge status={value || 'ONLINE'} />,
      },
      {
        key: 'status',
        label: 'Order Status',
        render: (value) => <Badge status={value || 'Pending'} />,
      },
      {
        key: 'payment_status',
        label: 'Payment',
        render: (value) => <Badge status={value || 'Pending'} />,
      },
      {
        key: 'total',
        label: 'Amount',
        render: (value) => <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(value)}</span>,
      },
      {
        key: 'createdLabel',
        label: 'Created At',
        render: (value) => <span className="text-slate-600 dark:text-slate-300">{value}</span>,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openViewModal(row.id)}
              className="rounded bg-sky-50 p-1.5 text-sky-600 transition-colors hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
              title="View order"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => openStatusModal(row)}
              className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              title="Update order status"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={() => openPaymentModal(row)}
              className="rounded bg-violet-50 p-1.5 text-violet-600 transition-colors hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20"
              title="Update payment status"
            >
              <Wallet className="h-4 w-4" />
            </button>
            {row.order_type === 'BILLING' && (
              <button
                onClick={() => handlePrintInvoice(row.id)}
                className="rounded bg-amber-50 p-1.5 text-amber-600 transition-colors hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                title="Print invoice"
              >
                <Printer className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Today's Orders"
        icon={ShoppingBasket}
        subtitle="Track today’s orders, inspect details, and update live order operations from one place."
        badge={`${orders.length} orders`}
        action={
          <Button variant="secondary" icon={RefreshCcw} onClick={() => loadTodayOrders(filters)} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Today Total Orders',
            value: String(stats.totalOrders || 0),
            color: 'text-white',
            boxClass: 'border-0 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 shadow-[0_12px_30px_rgba(245,158,11,0.28)]',
            pillClass: 'bg-white/20 text-white',
            labelClass: 'text-amber-50/90',
          },
          {
            title: 'Today Revenue',
            value: formatCurrency(stats.totalRevenue),
            color: 'text-white',
            boxClass: 'border-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-[0_12px_30px_rgba(16,185,129,0.25)]',
            pillClass: 'bg-white/20 text-white',
            labelClass: 'text-emerald-50/90',
          },
          {
            title: 'Pending Payments Today',
            value: String(stats.pendingPayments || 0),
            color: 'text-white',
            boxClass: 'border-0 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 shadow-[0_12px_30px_rgba(244,63,94,0.26)]',
            pillClass: 'bg-white/20 text-white',
            labelClass: 'text-rose-50/90',
          },
          {
            title: 'Completed Today',
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Order Type"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            options={['All', 'ONLINE', 'BILLING']}
          />
          <Select
            label="Order Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={['All', ...orderStatuses]}
          />
          <Select
            label="Payment Status"
            name="payment_status"
            value={filters.payment_status}
            onChange={handleFilterChange}
            options={['All', ...PAYMENT_STATUS_OPTIONS]}
          />
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Order no, customer, phone"
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
            <span>Loading today orders...</span>
          </div>
        </div>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={tableRows}
            searchPlaceholder="Search within the loaded today orders..."
            exportFileName="today-orders"
          />
        </Card>
      )}

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedOrder(null);
        }}
        title={selectedOrder ? `Order ${selectedOrder.order_no}` : 'Order Details'}
        maxWidthClass="max-w-4xl"
      >
        {!selectedOrder ? (
          <div className="flex min-h-40 items-center justify-center text-slate-500 dark:text-slate-400">
            Loading order...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Order No</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{selectedOrder.order_no}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Created</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{formatDate(selectedOrder.created_at, true)}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Order Status</p>
                <div className="mt-2">
                  <Badge status={selectedOrder.status || 'Pending'} />
                </div>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Payment</p>
                <div className="mt-2">
                  <Badge status={selectedOrder.payment_status || 'Pending'} />
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Customer Details">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedOrder.customer_name || '-'}</p>
                  <p>{selectedOrder.customer_phone || '-'}</p>
                  <p>{getCustomerAddress(selectedOrder) || '-'}</p>
                </div>
              </Card>
              <Card title="Notes">
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedOrder.notes || '-'}</p>
              </Card>
            </div>

            <Card title="Order Items">
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
                    {(selectedOrder.items || []).map((item) => (
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
                  <strong>{formatCurrency(selectedOrder.sub_total)}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Shipping</span>
                  <strong>{formatCurrency(selectedOrder.shipping)}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Discount</span>
                  <strong>{formatCurrency(selectedOrder.discount)}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900 dark:border-white/10 dark:text-white">
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => openStatusModal(selectedOrder)}>
                Update Status
              </Button>
              <Button variant="secondary" onClick={() => openPaymentModal(selectedOrder)}>
                Update Payment
              </Button>
              {selectedOrder.order_type === 'BILLING' && (
                <Button onClick={() => handlePrintInvoice(selectedOrder.id)} icon={Printer}>
                  Print Invoice
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={selectedOrder ? `Update Order Status - ${selectedOrder.order_no}` : 'Update Order Status'}
      >
        <div className="space-y-4">
          <Select
            label="Order Status"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            options={orderStatuses.map((status) => ({ label: status, value: status }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsStatusModalOpen(false)} disabled={isSavingStatus}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrderStatus} disabled={isSavingStatus}>
              {isSavingStatus ? 'Saving...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={selectedOrder ? `Update Payment Status - ${selectedOrder.order_no}` : 'Update Payment Status'}
      >
        <div className="space-y-4">
          <Select
            label="Payment Status"
            value={selectedPaymentStatus}
            onChange={(event) => setSelectedPaymentStatus(event.target.value)}
            options={PAYMENT_STATUS_OPTIONS.map((status) => ({ label: status, value: status }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)} disabled={isSavingPayment}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePaymentStatus} disabled={isSavingPayment}>
              {isSavingPayment ? 'Saving...' : 'Update Payment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TodayOrdersPage;
