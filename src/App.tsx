import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuthContext } from './context/auth-context';
import { Layout } from './components/custom/layout';
import { LandingPage } from './pages/landing';
import { OnboardingPage } from './pages/onboarding';
import { HomePage } from './pages/home';
import { FilmsPage } from './pages/films';
import { SeriesPage } from './pages/series';
import { SearchPage } from './pages/search';
import { validateEnv } from './config/env';
import { Loader2 } from 'lucide-react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Validate environment variables on app load
validateEnv();

function AppRoutes() {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />
            }
          />

          {/* Protected routes */}
          <Route
            path="/onboarding"
            element={
              isAuthenticated ? <OnboardingPage /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/home"
            element={
              isAuthenticated ? (
                <Layout>
                  <HomePage />
                </Layout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/films"
            element={
              isAuthenticated ? (
                <Layout>
                  <FilmsPage />
                </Layout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/series"
            element={
              isAuthenticated ? (
                <Layout>
                  <SeriesPage />
                </Layout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/search"
            element={
              isAuthenticated ? (
                <Layout>
                  <SearchPage />
                </Layout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-center" />
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
