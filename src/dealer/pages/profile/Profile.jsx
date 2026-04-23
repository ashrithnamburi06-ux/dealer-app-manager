import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import Card from '../../components/Card';
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import './Profile.css';

export default function Profile() {

  // ✅ SINGLE STORE CALL (FIXED)
  const { 
    user, 
    getDashboardStats, 
    inventory, 
    retailers, 
    sellLoads, 
    expenses,
    logout 
  } = useStore();

  const navigate = useNavigate();

  const { totalItems, monthlyExpenses, totalPending } = getDashboardStats();

  const totalSales = sellLoads.reduce(
    (s, l) => s + (Number(l.total) || 0), 
    0
  );

  // ✅ CLEAN LOGOUT (STABLE)
 const handleLogout = async () => {
  if (window.confirm('Logout from Dealer App?')) {
    try {
      await signOut(auth);   // Firebase logout
      logout();              // Clear store
      navigate('/login');    // Redirect

    } catch (err) {
      console.error("Logout error:", err);
    }
  }
};

  return (
    <div className="screen">
      <div className="top-bar">
        <h2 className="page-title">Profile</h2>
      </div>

      <div className="profile-hero">
        <div className="profile-hero-avatar">
          {(user?.name || 'D')[0].toUpperCase()}
        </div>
        <h2 className="profile-hero-name">{user?.name}</h2>
        <p className="profile-hero-agency">{user?.agency}</p>
        <p className="profile-hero-phone">📞 {user?.phone}</p>
      </div>

      <div className="profile-stats-grid">
        <div className="p-stat">
          <p className="p-stat-val">{totalItems}</p>
          <p className="p-stat-lbl">Items</p>
        </div>
        <div className="p-stat">
          <p className="p-stat-val">{retailers.length}</p>
          <p className="p-stat-lbl">Retailers</p>
        </div>
        <div className="p-stat">
          <p className="p-stat-val">{sellLoads.length}</p>
          <p className="p-stat-lbl">Sales</p>
        </div>
        <div className="p-stat">
          <p className="p-stat-val">₹{(totalSales / 1000).toFixed(1)}k</p>
          <p className="p-stat-lbl">Revenue</p>
        </div>
      </div>

      <div className="list-container">
        <h3 className="section-title">App Modules</h3>

        {[
          { icon: '📦', label: 'Inventory', count: `${inventory.length} items`, path: '/inventory' },
          { icon: '📥', label: 'Add Load', count: 'Incoming stock', path: '/add-load' },
          { icon: '🛒', label: 'Sell Load', count: 'Make a sale', path: '/sell-load' },
          { icon: '🏪', label: 'Retailers', count: `${retailers.length} retailers`, path: '/retailers' },
          { icon: '📋', label: 'Sell History', count: `${sellLoads.length} loads`, path: '/selling-loads' },
          { icon: '💸', label: 'Expenses', count: `₹${monthlyExpenses} this month`, path: '/expenses' },
        ].map((item) => (
          <Card
            key={item.path}
            className="profile-nav-card"
            onClick={() => navigate(item.path)}
          >
            <span className="p-nav-icon">{item.icon}</span>
            <div className="p-nav-info">
              <p className="p-nav-label">{item.label}</p>
              <p className="p-nav-sub">{item.count}</p>
            </div>
            <span className="p-nav-arrow">›</span>
          </Card>
        ))}

        {/* ✅ LOGOUT */}
        <button
          id="logout-btn"
          className="btn-danger btn-block"
          style={{ marginTop: 20 }}
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>

      <div className="section-spacer" />
    </div>
  );
}