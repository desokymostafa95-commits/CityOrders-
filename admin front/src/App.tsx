import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { ProtectedRoute } from './auth/protected-route';
import { PageGuard } from './auth/page-guard';
import { AdminLayout } from './components/layout/admin-layout';
import { Toaster } from 'sonner';
import { LanguageProvider } from './context/LanguageContext';
import { LoginPage } from './pages/login';
import { Dashboard } from './pages/dashboard';
import { SettingsPage } from './pages/settings';
import { SecurityPage } from './pages/security';
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
import { RolesPermissionsPage } from './pages/roles-permissions';
import { ChatsPage } from './pages/chats';
import { DeliveryNetworkPage } from './pages/delivery-network';
import { useAuth } from './auth/auth-context';
import { getFirstAllowedAdminPath } from './data/admin-page-permissions';

const queryClient = new QueryClient();

const DefaultAdminRoute = () => {
  const { permissions, isSystemAdmin } = useAuth();
  return <Navigate to={getFirstAllowedAdminPath(permissions, isSystemAdmin)} replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/dashboard" element={<PageGuard permission="page:dashboard"><Dashboard /></PageGuard>} />
                  <Route path="/merchant-approvals" element={<PageGuard permission="page:merchant-approvals"><MerchantApprovalsPage /></PageGuard>} />
                  <Route path="/payment-methods" element={<PageGuard permission="page:payment-methods"><PaymentMethodsPage /></PageGuard>} />
                  <Route path="/subscription-plans" element={<PageGuard permission="page:subscription-plans"><SubscriptionPlansPage /></PageGuard>} />
                  <Route path="/subscription-payment-requests" element={<PageGuard permission="page:subscription-payment-requests"><PaymentRequestsPage /></PageGuard>} />
                  <Route path="/subscriptions" element={<PageGuard permission="page:subscriptions"><SubscriptionsMonitoringPage /></PageGuard>} />
                  <Route path="/merchants/:merchantId/subscription" element={<PageGuard permission="page:subscriptions"><SubscriptionDetailsPage /></PageGuard>} />
                  <Route path="/audit-log" element={<PageGuard permission="page:audit-log"><AuditLogPage /></PageGuard>} />
                  <Route path="/categories" element={<PageGuard permission="page:categories"><CategoriesPage /></PageGuard>} />
                  <Route path="/staff" element={<PageGuard permission="page:staff"><AdminUsersPage /></PageGuard>} />
                  <Route path="/roles-permissions" element={<PageGuard permission="page:roles-permissions"><RolesPermissionsPage /></PageGuard>} />
                  <Route path="/promos" element={<PageGuard permission="page:promos"><PromosPage /></PageGuard>} />
                  <Route path="/settings" element={<PageGuard permission="page:settings"><SettingsPage /></PageGuard>} />
                  <Route path="/security" element={<PageGuard permission="page:security"><SecurityPage /></PageGuard>} />
                  <Route path="/announcements" element={<PageGuard permission="page:announcements"><GlobalAnnouncementsPage /></PageGuard>} />
                  <Route path="/chats" element={<PageGuard permission="page:chats"><ChatsPage /></PageGuard>} />
                  <Route path="/delivery-network" element={<PageGuard permission="page:delivery-network"><DeliveryNetworkPage /></PageGuard>} />
                  <Route path="/" element={<DefaultAdminRoute />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
