import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster, toast } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeServiceWorker } from './utils/serviceWorkerRegistration';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import CasualsPage from './pages/CasualsPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

// Layout
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Layout>
              <InventoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Layout>
              <OrdersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/casuals"
        element={
          <ProtectedRoute>
            <Layout>
              <CasualsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Layout>
              <TransactionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/users"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <UsersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  // Initialize service worker
  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        const reg = await initializeServiceWorker();
        if (reg) {
          setRegistration(reg);
          
          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  toast.info('A new version is available!', {
                    action: {
                      label: 'Update',
                      onClick: () => window.location.reload(),
                    },
                    duration: 10000,
                  });
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    initServiceWorker();

    // Set up online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('You are back online', { duration: 3000 });
      // Sync any pending changes when coming back online
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_DATA' });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are currently offline. Some features may be limited.', { 
        duration: 5000,
        position: 'top-center'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleResetError = () => {
    // Clear any error-related state if needed
    console.log('Error boundary was reset');
  };

  return (
    <ErrorBoundary onReset={handleResetError}>
      <div className={`app ${!isOnline ? 'offline' : ''}`}>
        {!isOnline && (
          <div className="bg-yellow-100 text-yellow-800 p-2 text-center text-sm">
            You are currently offline. Some features may be limited.
          </div>
        )}
        <Router>
          <AuthProvider>
            <Toaster position="top-right" />
            <AppRoutes isOnline={isOnline} />
          </AuthProvider>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App;
