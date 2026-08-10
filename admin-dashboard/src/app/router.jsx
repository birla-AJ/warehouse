import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppShell } from '../layouts/AppShell';
import { ProtectedRoute } from '../components/ProtectedRoute';

function lazyImport(loader, name) {
  return lazy(() => loader().then((m) => ({ default: m[name] })));
}

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function withSuspense(Component) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  );
}

const LoginPage = lazyImport(() => import('../modules/auth/pages/LoginPage'), 'LoginPage');
const OtpLoginPage = lazyImport(() => import('../modules/auth/pages/OtpLoginPage'), 'OtpLoginPage');
const ForgotPasswordPage = lazyImport(() => import('../modules/auth/pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyImport(() => import('../modules/auth/pages/ResetPasswordPage'), 'ResetPasswordPage');

const DashboardPage = lazyImport(() => import('../modules/dashboard/DashboardPage'), 'DashboardPage');
const WarehousesListPage = lazyImport(() => import('../modules/warehouses/WarehousesListPage'), 'WarehousesListPage');
const WarehouseDetailPage = lazyImport(() => import('../modules/warehouses/WarehouseDetailPage'), 'WarehouseDetailPage');
const FarmersListPage = lazyImport(() => import('../modules/farmers/FarmersListPage'), 'FarmersListPage');
const FarmerDetailPage = lazyImport(() => import('../modules/farmers/FarmerDetailPage'), 'FarmerDetailPage');
const CropsPage = lazyImport(() => import('../modules/crops/CropsPage'), 'CropsPage');
const BagsListPage = lazyImport(() => import('../modules/inventory/BagsListPage'), 'BagsListPage');
const BagDetailPage = lazyImport(() => import('../modules/inventory/BagDetailPage'), 'BagDetailPage');
const QrResolvePage = lazyImport(() => import('../modules/inventory/QrResolvePage'), 'QrResolvePage');
const WeighbridgePage = lazyImport(() => import('../modules/weighbridge/WeighbridgePage'), 'WeighbridgePage');
const BillingPage = lazyImport(() => import('../modules/billing/BillingPage'), 'BillingPage');
const InvoiceDetailPage = lazyImport(() => import('../modules/billing/InvoiceDetailPage'), 'InvoiceDetailPage');
const PaymentsPage = lazyImport(() => import('../modules/payments/PaymentsPage'), 'PaymentsPage');
const DispatchListPage = lazyImport(() => import('../modules/dispatch/DispatchListPage'), 'DispatchListPage');
const DispatchDetailPage = lazyImport(() => import('../modules/dispatch/DispatchDetailPage'), 'DispatchDetailPage');
const ReportsPage = lazyImport(() => import('../modules/reports/ReportsPage'), 'ReportsPage');
const CctvPage = lazyImport(() => import('../modules/cctv/CctvPage'), 'CctvPage');
const EmployeesPage = lazyImport(() => import('../modules/employees/EmployeesPage'), 'EmployeesPage');
const NotificationsPage = lazyImport(() => import('../modules/notifications/NotificationsPage'), 'NotificationsPage');
const DocumentsPage = lazyImport(() => import('../modules/documents/DocumentsPage'), 'DocumentsPage');
const AdminUsersPage = lazyImport(() => import('../modules/admin/AdminUsersPage'), 'AdminUsersPage');
const SettingsPage = lazyImport(() => import('../modules/settings/SettingsPage'), 'SettingsPage');
const AuditLogPage = lazyImport(() => import('../modules/auditlog/AuditLogPage'), 'AuditLogPage');
const ProfilePage = lazyImport(() => import('../modules/profile/ProfilePage'), 'ProfilePage');
const NotFoundPage = lazyImport(() => import('../modules/dashboard/NotFoundPage'), 'NotFoundPage');

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: withSuspense(LoginPage) },
      { path: '/login/otp', element: withSuspense(OtpLoginPage) },
      { path: '/forgot-password', element: withSuspense(ForgotPasswordPage) },
      { path: '/reset-password', element: withSuspense(ResetPasswordPage) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: withSuspense(DashboardPage) },

          { path: '/warehouses', element: withSuspense(WarehousesListPage) },
          { path: '/warehouses/:id', element: withSuspense(WarehouseDetailPage) },

          { path: '/farmers', element: withSuspense(FarmersListPage) },
          { path: '/farmers/:id', element: withSuspense(FarmerDetailPage) },

          { path: '/crops', element: withSuspense(CropsPage) },

          { path: '/inventory', element: withSuspense(BagsListPage) },
          { path: '/inventory/qr', element: withSuspense(QrResolvePage) },
          { path: '/inventory/bags/:id', element: withSuspense(BagDetailPage) },

          { path: '/weighbridge', element: withSuspense(WeighbridgePage) },

          { path: '/billing', element: withSuspense(BillingPage) },
          { path: '/billing/invoices/:id', element: withSuspense(InvoiceDetailPage) },

          { path: '/payments', element: withSuspense(PaymentsPage) },

          { path: '/dispatch', element: withSuspense(DispatchListPage) },
          { path: '/dispatch/:id', element: withSuspense(DispatchDetailPage) },

          { path: '/reports', element: withSuspense(ReportsPage) },
          { path: '/cctv', element: withSuspense(CctvPage) },
          { path: '/employees', element: withSuspense(EmployeesPage) },
          { path: '/notifications', element: withSuspense(NotificationsPage) },
          { path: '/documents', element: withSuspense(DocumentsPage) },
          { path: '/admin/users', element: withSuspense(AdminUsersPage) },
          { path: '/settings', element: withSuspense(SettingsPage) },
          { path: '/audit-log', element: withSuspense(AuditLogPage) },
          { path: '/profile', element: withSuspense(ProfilePage) },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  // A user hitting an unknown URL sees a real 404 with a way back, instead
  // of being silently bounced to /dashboard as before.
  { path: '*', element: withSuspense(NotFoundPage) },
]);
