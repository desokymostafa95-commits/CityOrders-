import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { ProtectedRoute } from './auth/protected-route';
import { AdminLayout } from './components/layout/admin-layout';
import { Toaster } from 'sonner';
import { LoginPage } from './pages/login';
import { Dashboard } from './pages/dashboard';
import { SettingsPage } from './pages/settings';
import { PaymentMethodsPage } from './pages/payment-methods';
import { SubscriptionPlansPage } from './pages/subscription-plans';
import { PaymentRequestsPage } from './pages/payment-requests';
import { MerchantApprovalsPage } from './pages/merchant-approvals';
import { SubscriptionsMonitoringPage } from './pages/subscriptions';
import { SubscriptionDetailsPage } from './pages/subscriptions/details';
import { AuditLogPage } from './pages/audit-log';
import { CategoriesPage } from './pages/categories';
import { PromosPage } from './pages/promos';
import { AdminUsersPage } from './pages/admin-users';
import { GlobalAnnouncementsPage } from './pages/announcements';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/merchant-approvals" element={<MerchantApprovalsPage />} />
                <Route path="/payment-methods" element={<PaymentMethodsPage />} />
                <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
                <Route path="/subscription-payment-requests" element={<PaymentRequestsPage />} />
                <Route path="/subscriptions" element={<SubscriptionsMonitoringPage />} />
                <Route path="/merchants/:merchantId/subscription" element={<SubscriptionDetailsPage />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/staff" element={<AdminUsersPage />} />
                <Route path="/promos" element={<PromosPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/announcements" element={<GlobalAnnouncementsPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
