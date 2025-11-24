import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/common/Toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { Loading } from './components/common/Loading';


import React, { Suspense, lazy } from 'react';
// Wrap named exports so React.lazy gets a default
const HomePage = lazy(() => import('./pages/public/HomePage').then(m => ({ default: m.HomePage })));
const PackagesPage = lazy(() => import('./pages/public/PackagesPage').then(m => ({ default: m.PackagesPage })));
const PackageDetailPage = lazy(() => import('./pages/public/PackageDetailPage').then(m => ({ default: m.PackageDetailPage })));
const ContactPage = lazy(() => import('./pages/public/ContactPage').then(m => ({ default: m.ContactPage })));
const AboutPage = lazy(() => import('./pages/public/AboutPage').then(m => ({ default: m.AboutPage })));

const LoginPage = lazy(() => import('./pages/admin/LoginPage').then(m => ({ default: m.default || m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdminPackagesPage = lazy(() => import('./pages/admin/PackagesPage').then(m => ({ default: m.PackagesPage })));
const PackageFormPage = lazy(() => import('./pages/admin/PackageFormPage').then(m => ({ default: m.PackageFormPage })));
const PackagePreviewPage = lazy(() => import('./pages/admin/PackagePreviewPage').then(m => ({ default: m.PackagePreviewPage })));
const InquiriesPage = lazy(() => import('./pages/admin/InquiriesPage').then(m => ({ default: m.InquiriesPage })));

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ToastContainer />
            <Suspense fallback={<Loading fullScreen size="md" />}>
            <Routes>
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="packages" element={<PackagesPage />} />
                <Route path="packages/:slug" element={<PackageDetailPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="about" element={<AboutPage />} />
              </Route>

              <Route path="/admin/login" element={<LoginPage />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="packages" element={<AdminPackagesPage />} />
                <Route path="packages/new" element={<PackageFormPage />} />
                <Route path="packages/:id/edit" element={<PackageFormPage />} />
                <Route path="packages/:id/preview" element={<PackagePreviewPage />} />
                <Route path="inquiries" element={<InquiriesPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
