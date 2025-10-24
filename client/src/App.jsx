import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import InventoryPage from "./pages/InventoryPage";
import OrdersPage from "./pages/OrdersPage";
import WorkersPage from "./pages/WorkersPage";
import TransactionsPage from "./pages/TransactionsPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import ClientsPage from "./pages/ClientsPage";
import TaskManagementPage from "./pages/TaskManagementPage";
import ViolationsPage from "./pages/ViolationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SMSPage from "./pages/SMSPage";
import InventoryDebug from "./components/debug/InventoryDebug";
import { Button } from '@/components/ui/button';

const ProtectedRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout><Outlet /></Layout>;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/task-management" element={<TaskManagementPage />} />
        <Route path="/violations" element={<ViolationsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/sms" element={<SMSPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/debug/inventory" element={<InventoryDebug />} />
      </Route>

      <Route element={<ProtectedRoute requireAdmin />}>
        <Route path="/users" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
