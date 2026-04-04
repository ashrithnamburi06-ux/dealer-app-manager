import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import Card from '../../components/Card';
import './Dashboard.css';

export default function Dashboard() {
  const { getDashboardStats, user } = useStore();
  const navigate = useNavigate();
const statsData = getDashboardStats();

const totalItems = statsData.totalItems;
const lowStock = statsData.lowStock;
const totalPending = statsData.totalPending;
const monthlyExpenses = statsData.monthlyExpenses;
  const stats = [
    { label: 'Total Items', value: totalItems, icon: '📦', color: 'green', action: () => navigate('/inventory') },
    { label: 'Low Stock', value: lowStock.length, icon: '⚠️', color: lowStock.length > 0 ? 'red' : 'green', action: () => navigate('/inventory') },
    { label: 'Monthly Expenses', value: `₹${monthlyExpenses.toLocaleString()}`, icon: '💸', color: 'orange', action: () => navigate('/expenses') },
    { label: 'Pending Payments', value: `₹${totalPending.toLocaleString()}`, icon: '💳', color: totalPending > 0 ? 'red' : 'green', action: () => navigate('/retailers') },
  ];

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <p className="header-greeting">Good day 👋</p>
          <h2 className="header-title">{user?.name || 'Dealer'}</h2>
          <p className="header-sub">{user?.agency}</p>
        </div>
        <div className="header-avatar">{(user?.name || 'D')[0].toUpperCase()}</div>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <Card key={i} className={`stat-card stat-${s.color}`} onClick={s.action}>
            <span className="stat-icon">{s.icon}</span>
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </Card>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="alert-section">
          <h3 className="section-title">🔴 Low Stock Alerts</h3>
          <div className="alert-list">
            {lowStock.map((item) => (
              <Card key={item.id} className="alert-card">
                <div className="alert-row">
                  <div>
                    <p className="alert-item-name">{item.name}</p>
                    <p className="alert-item-sub">{item.grams} · Min: {item.minStock} boxes</p>
                  </div>
                  <div className="alert-stock">
                    <span className="badge badge-red">{item.boxes} left</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-row">
          <button
            id="dashboard-add-load"
            className="action-btn action-green"
            onClick={() => navigate('/add-load')}
          >
            <span>📥</span>
            <span>Add Load</span>
          </button>
          <button
            id="dashboard-add-expense"
            className="action-btn action-orange"
            onClick={() => navigate('/add-expense')}
          >
            <span>💸</span>
            <span>Add Expense</span>
          </button>
          <button
            id="dashboard-sell"
            className="action-btn action-teal"
            onClick={() => navigate('/sell-load')}
          >
            <span>🛒</span>
            <span>Sell Load</span>
          </button>
          <button
            id="dashboard-retailers"
            className="action-btn action-blue"
            onClick={() => navigate('/retailers')}
          >
            <span>🏪</span>
            <span>Retailers</span>
          </button>
        </div>
      </div>

      <div className="section-spacer" />
    </div>
  );
}

