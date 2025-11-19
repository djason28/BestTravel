import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/common/Toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

import { HomePage } from './pages/public/HomePage';
import { PackagesPage } from './pages/public/PackagesPage';
import { PackageDetailPage } from './pages/public/PackageDetailPage';
import { ContactPage } from './pages/public/ContactPage';
import { AboutPage } from './pages/public/AboutPage';

import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { PackagesPage as AdminPackagesPage } from './pages/admin/PackagesPage';
import { PackageFormPage } from './pages/admin/PackageFormPage';
import { PackagePreviewPage } from './pages/admin/PackagePreviewPage';
import { InquiriesPage } from './pages/admin/InquiriesPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ToastContainer />
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
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
