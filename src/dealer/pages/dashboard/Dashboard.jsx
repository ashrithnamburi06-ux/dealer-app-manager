import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Card from '../../components/Card';

import {
  subscribeInventory,
  subscribeTransactions,
  subscribeSales,
  subscribeLoads,
  subscribeRetailers,
  subscribeExpenses
} from "../services/firebaseService";

import { getDealer, saveUpiId, generateDealerLink } from "../services/dealerService";
import { createOrder } from "../services/orderService";

import { checkDueReminders } from "@/utils/dueReminder";
import { checkStockReminders } from "@/utils/stockReminder";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sales, setSales] = useState([]);
  const [loads, setLoads] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState(null);
  const [retailers, setRetailers] = useState([]);

  const [upi, setUpi] = useState("");
  const [showUpi, setShowUpi] = useState(false);

  useEffect(() => {
    let unsub1 = () => {};
    let unsub2 = () => {};
    let unsub3 = () => {};
    let unsub4 = () => {};
    let unsub5 = () => {};
    let unsub6 = () => {};

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser({ displayName: "Dealer", email: "local@user" });
      } else {
        setUser(u);
      }

      console.log("📊 Dashboard: Setting up subscriptions for user:", u.uid);
      
      unsub1 = subscribeInventory((data) => {
        console.log("📊 Dashboard: Inventory updated, count:", data.length);
        setInventory(data || []);
      });
      unsub2 = subscribeTransactions((data) => {
        console.log("📊 Dashboard: Transactions updated, count:", data.length);
        setTransactions(data || []);
      });
      unsub3 = subscribeSales((data) => {
        console.log("📊 Dashboard: Sales updated, count:", data.length);
        setSales(data || []);
      });
      unsub4 = subscribeLoads((data) => {
        console.log("📊 Dashboard: Loads updated, count:", data.length);
        setLoads(data || []);
      });
      unsub5 = subscribeRetailers((data) => {
        console.log("📊 Dashboard: Retailers updated, count:", data.length);
        setRetailers(data || []);
      });
      unsub6 = subscribeExpenses((data) => {
        console.log("📊 Dashboard: Expenses updated, count:", data.length);
        setExpenses(data || []);
      });
    });

    return () => {
      unsubAuth();
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (retailers.length && loads.length) {
      checkStockReminders(loads, retailers);
      checkDueReminders(retailers, loads);
    }
  }, [retailers, loads]);

  const handleGenerateLink = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const dealer = await getDealer(user.uid);

    if (!dealer?.upiId) {
      setShowUpi(true);
      return;
    }

    const link = await generateDealerLink(user.uid);
    alert("Share this link:\n" + link);
  };

  const handleSaveUpi = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    await saveUpiId(user.uid, upi);

    const link = await generateDealerLink(user.uid);
    alert("Link:\n" + link);

    setShowUpi(false);
  };

  const handleCreateOrderLink = async () => {
    try {
      const orderId = await createOrder(0); // Amount will be calculated after customer selects items
      const orderLink = `${window.location.origin}/order/${orderId}`;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(orderLink);
        alert("Order link copied to clipboard:\n" + orderLink);
      } else {
        alert("Share this order link:\n" + orderLink);
      }
    } catch (error) {
      console.error("Error creating order link:", error);
      alert("Failed to create order link. Please try again.");
    }
  };

  const totalItems = inventory?.length || 0;

  const lowStock = (inventory || []).filter(item => {
    const boxes = Number(item?.boxes || item?.qty || 0);
    const minStock = Number(item?.minStock || item?.min || 0);
    return boxes <= minStock;
  });

  const monthlyExpenses = (expenses || [])
    .filter(e => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

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

      {/* HEADER */}
      <div className="page-header">
        <div>
          <p className="header-greeting">Good day 👋</p>
          <h2 className="header-title">{user?.displayName || 'Dealer'}</h2>
          <p className="header-sub">{user?.email}</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <Card key={i} className={`stat-card stat-${s.color}`} onClick={s.action}>
            <span className="stat-icon">{s.icon}</span>
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* EXTRA CARDS */}
      <div className="stats-grid">
        <Card className="stat-card stat-blue" onClick={handleCreateOrderLink}>
          <span className="stat-icon">🔗</span>
          <p className="stat-value">Create</p>
          <p className="stat-label">Order Link</p>
        </Card>

        <Card className="stat-card stat-orange" onClick={() => navigate('/analytics')}>
          <span className="stat-icon">📊</span>
          <p className="stat-value">View</p>
          <p className="stat-label">Analytics</p>
        </Card>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>

        <div className="actions-grid">

          <div className="action-card blue" onClick={() => navigate('/add-load')}>
            <div className="icon">📦</div>
            <div className="text">Add Load</div>
          </div>

          <div className="action-card orange" onClick={() => navigate('/add-expense')}>
            <div className="icon">💰</div>
            <div className="text">Add Expense</div>
          </div>

          <div className="action-card green" onClick={() => navigate('/sell-load')}>
            <div className="icon">🛒</div>
            <div className="text">Sell Load</div>
          </div>

          <div className="action-card purple" onClick={() => navigate('/retailers')}>
            <div className="icon">🏪</div>
            <div className="text">Retailers</div>
          </div>

          <div className="action-card violet" onClick={() => navigate('/transactions')}>
            <div className="icon">📄</div>
            <div className="text">Transactions</div>
          </div>

        </div>
      </div>

      {/* UPI INPUT */}
      {showUpi && (
        <div style={{ marginTop: '15px' }}>
          <input
            type="text"
            placeholder="Enter UPI ID"
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            style={{ padding: '10px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <button onClick={handleSaveUpi} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '5px', border: 'none', backgroundColor: '#1b7835', color: 'white' }}>
            Save
          </button>
          <button onClick={() => { setShowUpi(false); setUpi(""); }} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '5px', border: 'none', backgroundColor: '#666', color: 'white', marginLeft: '5px' }}>
            Cancel
          </button>
        </div>
      )}

    </div>
  );
}