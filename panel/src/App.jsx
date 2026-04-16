import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';

// Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import BannersPage from './pages/website/BannersPage';
import BannerFormPage from './pages/website/BannerFormPage';
import CategoriesPage from './pages/website/CategoriesPage';
import CategoryFormPage from './pages/website/CategoryFormPage';
import ProductsPage from './pages/website/ProductsPage';
import ProductFormPage from './pages/website/ProductFormPage';
import CustomersPage from './pages/website/CustomersPage';
import CustomerFormPage from './pages/website/CustomerFormPage';
import GeographyPage from './pages/website/GeographyPage';
import OnOffStatusPage from './pages/orders/OnOffStatusPage';
import BillingInvoicesPage from './pages/orders/BillingInvoicesPage';
import BillingInvoiceFormPage from './pages/orders/BillingInvoiceFormPage';
import OrderStatusPage from './pages/orders/OrderStatusPage';
import OrderStatusFormPage from './pages/orders/OrderStatusFormPage';
import TodayOrdersPage from './pages/orders/TodayOrdersPage';
import AllOrdersPage from './pages/orders/AllOrdersPage';
import TopCustomersPage from './pages/report/TopCustomersPage';
import EnquiriesPage from './pages/report/EnquiriesPage';
import BrandsPage from './pages/report/BrandsPage';
import SeoHeadingPage from './pages/seo/SeoHeadingPage';
import SeoDetailsPage from './pages/seo/SeoDetailsPage';
import BlogPage from './pages/seo/BlogPage';
import GlobalSettingsPage from './pages/settings/GlobalSettingsPage';
import ThemeSettingsPage from './pages/settings/ThemeSettingsPage';
import TermsConditionsPage from './pages/settings/TermsConditionsPage';
import AboutUsSetupPage from './pages/settings/AboutUsSetupPage';
import ContactUsSetupPage from './pages/settings/ContactUsSetupPage';
import HomePageSetupPage from './pages/settings/HomePageSetupPage';
import PaymentSetupPage from './pages/settings/PaymentSetupPage';

function AppContent() {
  const { isAuthenticated, validateLogin, completeLogin } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage onValidate={validateLogin} onLoginComplete={completeLogin} />;
  }

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
            
          {/* Website Routes */}
          <Route path="/website/banners" element={<BannersPage />} />
          <Route path="/website/banners/new" element={<BannerFormPage />} />
          <Route path="/website/banners/:bannerId/edit" element={<BannerFormPage />} />
          <Route path="/website/categories" element={<CategoriesPage />} />
          <Route path="/website/categories/new" element={<CategoryFormPage />} />
          <Route path="/website/categories/:categoryId/edit" element={<CategoryFormPage />} />
          <Route path="/website/products" element={<ProductsPage />} />
          <Route path="/website/products/new" element={<ProductFormPage />} />
          <Route path="/website/products/:productId/edit" element={<ProductFormPage />} />
          <Route path="/website/customers" element={<CustomersPage />} />
          <Route path="/website/customers/new" element={<CustomerFormPage />} />
          <Route path="/website/customers/:customerId/edit" element={<CustomerFormPage />} />
          <Route path="/website/geography" element={<GeographyPage />} />
          
          {/* Orders Routes */}
          <Route path="/orders/status-toggle" element={<OnOffStatusPage />} />
          <Route path="/orders/billing" element={<BillingInvoicesPage />} />
          <Route path="/orders/billing/new" element={<BillingInvoiceFormPage />} />
          <Route path="/orders/billing/:invoiceId/edit" element={<BillingInvoiceFormPage />} />
          <Route path="/orders/status" element={<OrderStatusPage />} />
          <Route path="/orders/status/new" element={<OrderStatusFormPage />} />
          <Route path="/orders/status/:statusId/edit" element={<OrderStatusFormPage />} />
          <Route path="/orders/today" element={<TodayOrdersPage />} />
          <Route path="/orders/all" element={<AllOrdersPage />} />
          
          {/* Report Routes */}
          <Route path="/report/top-customers" element={<TopCustomersPage />} />
          <Route path="/report/enquiries" element={<EnquiriesPage />} />
          <Route path="/report/brands" element={<BrandsPage />} />
          
          {/* SEO Routes */}
          <Route path="/seo/heading" element={<SeoHeadingPage />} />
          <Route path="/seo/details" element={<SeoDetailsPage />} />
          <Route path="/seo/blog" element={<BlogPage />} />
          
          {/* Settings Routes */}
          <Route path="/settings/global" element={<GlobalSettingsPage />} />
          <Route path="/settings/theme" element={<ThemeSettingsPage />} />
          <Route path="/settings/terms" element={<TermsConditionsPage />} />
          <Route path="/settings/about" element={<AboutUsSetupPage />} />
          <Route path="/settings/contact" element={<ContactUsSetupPage />} />
          <Route path="/settings/homepage" element={<HomePageSetupPage />} />
          <Route path="/settings/payment" element={<PaymentSetupPage />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
