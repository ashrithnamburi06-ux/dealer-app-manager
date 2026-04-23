import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from "react";

import { StoreProvider, useStore } from './dealer/data/mockStore';
import Navbar from './dealer/components/Navbar';
import InstallButton from './dealer/components/InstallButton';
import SplashScreen from "./dealer/components/SplashScreen";
import CustomerOrder from "./dealer/pages/order/CustomerOrder";

// ✅ COMMENTED (until files exist)
// import PrivacyPolicy from "./dealer/pages/PrivacyPolicy";
// import Terms from "./dealer/pages/Terms";
// import Contact from "./dealer/pages/Contact";

// Auth
import Login from './dealer/pages/auth/Login';
import Welcome from './dealer/pages/auth/Welcome';
import LoginPassword from "./dealer/pages/auth/LoginPassword";
import SetPassword from "./dealer/pages/auth/SetPassword";

// Payment
import PaymentPage from './dealer/pages/PaymentPage';
import OrderPage from './dealer/pages/OrderPage';

// Dashboard
import Dashboard from './dealer/pages/dashboard/Dashboard';
import TransactionHistory from "./dealer/pages/TransactionHistory";
import AnalyticsDashboard from './dealer/pages/AnalyticsDashboard';

// Inventory
import InventoryList from './dealer/pages/inventory/InventoryList';
import AddItem from './dealer/pages/inventory/AddItem';
import EditItem from './dealer/pages/inventory/EditItem';

// Load
import AddLoad from './dealer/pages/load/AddLoad';

// Sell
import SellLoad from './dealer/pages/sell/SellLoad';

// Retailers
import RetailerList from './dealer/pages/retailers/RetailerList';
import RetailerDetails from './dealer/pages/retailers/RetailerDetails';

// Selling History
import SellingLoads from './dealer/pages/selling/SellingLoads';

// Expenses
import AddExpense from './dealer/pages/expenses/AddExpense';
import ExpenseList from './dealer/pages/expenses/ExpenseList';

// Profile
import Profile from './dealer/pages/profile/Profile';


// ── Protected Layout ─────────────────────────
function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <div className="app-content">{children}</div>
      <Navbar />
      <InstallButton />
    </div>
  );
}

// ── Auth Guard ───────────────────────────────
function ProtectedRoute({ children }) {
  // TEMP FIX: return children directly (no auth check for now)
  return children;
}

// ── Router ───────────────────────────────────
function AppRoutes() {
  const { user } = useStore();

  return (
    <Routes>

      {/* Public */}
      <Route
        path="/"
        element={<Login />}
      />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login-password" element={<LoginPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      {/* Public Order Page */}
      <Route path="/order" element={<CustomerOrder />} />
      {/* Payment Routes - Public */}
      <Route path="/pay/:id" element={<PaymentPage />} />
      <Route path="/order/:id" element={<OrderPage />} />

      {/* Protected */}
      
      <Route path="/dashboard" element={
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute><AppLayout><InventoryList /></AppLayout></ProtectedRoute>
      } />

      <Route path="/inventory/add" element={
        <ProtectedRoute><AppLayout><AddItem /></AppLayout></ProtectedRoute>
      } />

      <Route path="/inventory/edit/:id" element={
        <ProtectedRoute><AppLayout><EditItem /></AppLayout></ProtectedRoute>
      } />

      <Route path="/add-load" element={
        <ProtectedRoute><AppLayout><AddLoad /></AppLayout></ProtectedRoute>
      } />

      <Route path="/sell-load" element={
        <ProtectedRoute><AppLayout><SellLoad /></AppLayout></ProtectedRoute>
      } />

      <Route path="/retailers" element={
        <ProtectedRoute><AppLayout><RetailerList /></AppLayout></ProtectedRoute>
      } />

      <Route path="/retailers/:id" element={
        <ProtectedRoute><AppLayout><RetailerDetails /></AppLayout></ProtectedRoute>
      } />

      <Route path="/selling-loads" element={
        <ProtectedRoute><AppLayout><SellingLoads /></AppLayout></ProtectedRoute>
      } />

      <Route path="/add-expense" element={
        <ProtectedRoute><AppLayout><AddExpense /></AppLayout></ProtectedRoute>
      } />

      <Route path="/expenses" element={
        <ProtectedRoute><AppLayout><ExpenseList /></AppLayout></ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
      } />

      <Route path="/transactions" element={
        <ProtectedRoute>
          <AppLayout>
            <TransactionHistory />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/analytics" element={
        <ProtectedRoute>
          <AppLayout>
            <AnalyticsDashboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

// ── Root App ─────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  );
}