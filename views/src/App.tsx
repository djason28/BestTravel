import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ToastContainer } from "./components/common/Toast";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ContentLoader } from "./components/common/ContentLoader";
import { NavigationProvider } from "./contexts/NavigationContext";

import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { LangProvider } from "./contexts/LangContext";
import { IdleTasks } from "./components/system/IdleTasks";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrap named exports so React.lazy gets a default
const HomePage = lazy(() =>
  import("./pages/public/HomePage").then((m) => ({ default: m.HomePage })),
);
const PackagesPage = lazy(() =>
  import("./pages/public/PackagesPage").then((m) => ({
    default: m.PackagesPage,
  })),
);
const PackageDetailPage = lazy(() =>
  import("./pages/public/PackageDetailPage").then((m) => ({
    default: m.PackageDetailPage,
  })),
);
const ContactPage = lazy(() =>
  import("./pages/public/ContactPage").then((m) => ({
    default: m.ContactPage,
  })),
);
const AboutPage = lazy(() =>
  import("./pages/public/AboutPage").then((m) => ({ default: m.AboutPage })),
);

const LoginPage = lazy(() =>
  import("./pages/admin/LoginPage").then((m) => ({
    default: m.default || m.LoginPage,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/admin/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const AdminPackagesPage = lazy(() =>
  import("./pages/admin/PackagesPage").then((m) => ({
    default: m.PackagesPage,
  })),
);
const PackageFormPage = lazy(() =>
  import("./pages/admin/PackageFormPage").then((m) => ({
    default: m.PackageFormPage,
  })),
);
const PackagePreviewPage = lazy(() =>
  import("./pages/admin/PackagePreviewPage").then((m) => ({
    default: m.PackagePreviewPage,
  })),
);
const InquiriesPage = lazy(() =>
  import("./pages/admin/InquiriesPage").then((m) => ({
    default: m.InquiriesPage,
  })),
);
const PublicCarsPage = lazy(() =>
  import("./pages/public/CarsPage").then((m) => ({ default: m.CarsPage })),
);
const AdminCarsPage = lazy(() =>
  import("./pages/admin/CarsPage").then((m) => ({ default: m.CarsPage })),
);
const CarFormPage = lazy(() =>
  import("./pages/admin/CarFormPage").then((m) => ({ default: m.CarFormPage })),
);
const CarDetailPage = lazy(() =>
  import("./pages/public/CarDetailPage").then((m) => ({
    default: m.CarDetailPage,
  })),
);
const ProfilePage = lazy(() =>
  import("./pages/admin/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);
const AdminsPage = lazy(() =>
  import("./pages/admin/AdminsPage").then((m) => ({
    default: m.AdminsPage,
  })),
);


function AppRoutes() {
  const location = useLocation();
  const bgLocation = (
    location.state as { backgroundLocation?: typeof location } | null
  )?.backgroundLocation;

  return (
    <>
      <Suspense fallback={<ContentLoader overlay minHeight={400} />}>
        <Routes location={bgLocation ?? location}>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="packages/:slug" element={<PackageDetailPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="cars" element={<PublicCarsPage />} />
            <Route path="cars/:slug" element={<CarDetailPage />} />
          </Route>

          {!bgLocation && <Route path="/admin/login" element={<LoginPage />} />}

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
            <Route
              path="packages/:id/preview"
              element={<PackagePreviewPage />}
            />
            <Route path="inquiries" element={<InquiriesPage />} />
            <Route path="cars" element={<AdminCarsPage />} />
            <Route path="cars/new" element={<CarFormPage />} />
            <Route path="cars/:id/edit" element={<CarFormPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admins" element={<AdminsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {bgLocation && (
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
          </Routes>
        )}
      </Suspense>
      <IdleTasks />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <LangProvider>
            <AuthProvider>
              <QueryClientProvider client={queryClient}>
                <NavigationProvider>
                  <ToastProvider>
                    <ToastContainer />
                    <AppRoutes />
                  </ToastProvider>
                </NavigationProvider>
              </QueryClientProvider>
            </AuthProvider>
          </LangProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
