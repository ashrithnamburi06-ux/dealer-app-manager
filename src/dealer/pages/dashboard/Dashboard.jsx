import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import { subscribeRetailers } from "../../../services/firebaseService";
import {
  subscribeInventory,
  subscribeTransactions,
  subscribeSales,
  subscribeLoads
} from "../../../services/firebaseService";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase";
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);

  // ✅ YOUR ORIGINAL STATES (unchanged)
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sales, setSales] = useState([]);
  const [loads, setLoads] = useState([]);
  const [user, setUser] = useState(null);
  const [retailers, setRetailers] = useState([]);

  // ✅ SINGLE AUTH LISTENER (FIXED - NO DUPLICATE)
  useEffect(() => {
    let unsub1 = () => {};
    let unsub2 = () => {};
    let unsub3 = () => {};
    let unsub4 = () => {};
    let unsub5 = () => {};

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        console.log("Waiting for user...");

        // ✅ SAFE REDIRECT (NO LOOP)
        if (window.location.pathname !== "/login") {
          navigate("/login");
        }

        setInventory([]);
        setTransactions([]);
        setSales([]);
        setLoads([]);
        setRetailers([]);
        return;
      }

      console.log("User ready:", u.uid);
      setUser(u);

      unsub1 = subscribeInventory((data) => {
        console.log("Inventory:", data);
        setInventory(data || []);
      });

      unsub2 = subscribeTransactions((data) => {
        console.log("Transactions:", data);
        setTransactions(data || []);
      });

      unsub3 = subscribeSales((data) => {
        setSales(data || []);
      });

      unsub4 = subscribeLoads((data) => {
        setLoads(data || []);
      });

      unsub5 = subscribeRetailers((data) => setRetailers(data || []));
    });

    return () => {
      unsubAuth();
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, []);

  // ✅ SAME LOGIC (UNCHANGED)
  const totalItems = inventory?.length || 0;

  const lowStock = (inventory || []).filter(item => {
    const boxes = Number(item?.boxes || item?.qty || 0);
    const minStock = Number(item?.minStock || item?.min || 0);
    return boxes <= minStock;
  });

  const monthlyExpenses = (transactions || [])
    .filter(t => (t?.type || t?.category) === 'expense')
    .reduce((sum, t) => sum + Number(t?.amount || t?.amt || 0), 0);

  const totalPending = (retailers || [])
    .reduce((sum, r) => sum + Number(r.pendingAmount || 0), 0);

  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: '📦',
      color: 'green',
      action: () => navigate('/inventory')
    },
    {
      label: 'Low Stock',
      value: lowStock.length,
      icon: '⚠️',
      color: lowStock.length > 0 ? 'red' : 'green',
      action: () => navigate('/inventory')
    },
    {
      label: 'Monthly Expenses',
      value: `₹${monthlyExpenses.toLocaleString()}`,
      icon: '💸',
      color: 'orange',
      action: () => navigate('/expenses')
    },
    {
      label: 'Pending Payments',
      value: `₹${totalPending.toLocaleString()}`,
      icon: '💳',
      color: totalPending > 0 ? 'red' : 'green',
      action: () => navigate('/retailers')
    },
  ];

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <p className="header-greeting">Good day 👋</p>
          <h2 className="header-title">{user?.displayName || 'Dealer'}</h2>
          <p className="header-sub">{user?.email}</p>
        </div>
        <div className="header-avatar">
          {(user?.displayName || 'D')[0].toUpperCase()}
        </div>
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
                    <p className="alert-item-sub">
                      {item.grams} · Min: {item.minStock || item.min} boxes
                    </p>
                  </div>
                  <div className="alert-stock">
                    <span className="badge badge-red">
                      {item.boxes || item.qty || 0} left
                    </span>
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

          <button className="action-btn action-green" onClick={() => navigate('/add-load')}>
            📥 Add Load
          </button>

          <button className="action-btn action-orange" onClick={() => navigate('/add-expense')}>
            💸 Add Expense
          </button>

          <button className="action-btn action-teal" onClick={() => navigate('/sell-load')}>
            🛒 Sell Load
          </button>

          <button className="action-btn action-blue" onClick={() => navigate('/retailers')}>
            🏪 Retailers
          </button>

          <button className="action-btn action-blue" onClick={() => navigate('/transactions')}>
            📄 Transactions
          </button>

        </div>
      </div>

      <div className="section-spacer" />
    </div>
  );
}