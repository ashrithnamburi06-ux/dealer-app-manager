import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './dealer/data/mockStore';
import Navbar from './dealer/components/Navbar';
import InstallButton from './dealer/components/InstallButton'; // ✅ make sure this file exists

// Auth
import Login from './dealer/pages/auth/Login';
import Welcome from './dealer/pages/auth/Welcome';

// Dashboard
import Dashboard from './dealer/pages/dashboard/Dashboard';
import TransactionHistory from "./dealer/pages/TransactionHistory";

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
      <InstallButton /> {/* ✅ safe now */}
    </div>
  );
}

// ── Auth Guard ───────────────────────────────
function ProtectedRoute({ children }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/" replace />;
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
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route path="/welcome" element={<Welcome />} />

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
      <Route path="/transactions" element={<TransactionHistory />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── Root App ─────────────────────────────────
export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  );
}