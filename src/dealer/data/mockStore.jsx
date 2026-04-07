import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  subscribeInventory,
  subscribeTransactions,
  subscribeSales,
  subscribeLoads,
  subscribeExpenses,
  subscribeRetailers,
  addItem as fbAddItem,
  updateInventoryItem as fbUpdateInventoryItem,
  deleteInventoryItem as fbDeleteInventoryItem,
  addLoad as fbAddLoad,
  addTransaction as fbAddTransaction,
  sellItem as fbSellItem,
  addExpense as fbAddExpense,
  addRetailer as fbAddRetailer,
  updateRetailer as fbUpdateRetailer,
  recordPayment as fbRecordPayment,
  addBill as fbAddBill
} from '../../services/firebaseService';

// ─── Context ─────────────────────────────────────────
export const StoreContext = createContext(null);

export function StoreProvider({ children }) {

  // ── USER ───────────────────────────────────────────
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user")) || null;
  });

  // ── FIREBASE AUTH STATE ────────────────────────────
  const [firebaseUser, setFirebaseUser] = useState(null);

  // ── DATA STATES (populated by Firebase realtime) ──
  const [inventory, setInventory] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [sellLoads, setSellLoads] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // ── SAVE USER TO LOCALSTORAGE ─────────────────────
  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  // ── FIREBASE AUTH LISTENER ────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (!u) {
        // Clear all data when logged out
        setInventory([]);
        setRetailers([]);
        setLoads([]);
        setSellLoads([]);
        setExpenses([]);
        setTransactions([]);
      }
    });
    return () => unsubAuth();
  }, []);

  // ── FIREBASE REALTIME SUBSCRIPTIONS ───────────────
  useEffect(() => {
    if (!firebaseUser) return;

    const unsub1 = subscribeInventory((data) => setInventory(data));
    const unsub2 = subscribeTransactions((data) => setTransactions(data));
    const unsub3 = subscribeSales((data) => setSellLoads(data));
    const unsub4 = subscribeLoads((data) => setLoads(data));
    const unsub5 = subscribeExpenses((data) => setExpenses(data));
    const unsub6 = subscribeRetailers((data) => setRetailers(data));

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [firebaseUser]);

  // ── AUTH ───────────────────────────────────────────
  const login = (userData) => setUser(userData);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
    setUser(null);
    localStorage.removeItem("user");
  };

  // ── INVENTORY (Firebase-backed) ───────────────────
  const addInventoryItem = async (item) => {
    try {
      await fbAddItem(item);
    } catch (err) {
      console.error("Add inventory item error:", err);
    }
  };

  const updateInventoryItem = async (id, updated) => {
    try {
      await fbUpdateInventoryItem(String(id), updated);
    } catch (err) {
      console.error("Update inventory item error:", err);
    }
  };

  const deleteInventoryItem = async (id) => {
    try {
      await fbDeleteInventoryItem(String(id));
    } catch (err) {
      console.error("Delete inventory item error:", err);
    }
  };

  // ── LOADS (Firebase-backed) ────────────────────────
  const addLoad = async (load) => {
    try {
      await fbAddLoad(load);
    } catch (err) {
      console.error("Add load error:", err);
    }
  };

  // ── SELL LOAD (Firebase-backed) ────────────────────
  const addSellLoad = async (sell) => {
    try {
      await fbSellItem(sell);
    } catch (err) {
      console.error("Add sell load error:", err);
    }
  };

  // ── RETAILERS (Firebase-backed) ────────────────────
  const addRetailer = async (retailer) => {
    try {
      const newId = await fbAddRetailer(retailer);
      return newId;
    } catch (err) {
      console.error("Add retailer error:", err);
    }
  };

  const updateRetailer = async (id, updated) => {
    try {
      await fbUpdateRetailer(String(id), updated);
    } catch (err) {
      console.error("Update retailer error:", err);
    }
  };

  // ── EXPENSE (Firebase-backed) ──────────────────────
  const addExpense = async (expense) => {
    try {
      await fbAddExpense(expense);
    } catch (err) {
      console.error("Add expense error:", err);
    }
  };

  // ── TRANSACTION (Firebase-backed) ──────────────────
  const addTransaction = async (tx) => {
    try {
      await fbAddTransaction(tx);
    } catch (err) {
      console.error("Add transaction error:", err);
    }
  };

  // ── PAYMENTS (Firebase-backed) ─────────────────────
  const recordPayment = async (retailerId, amount, date) => {
    try {
      await fbRecordPayment(String(retailerId), amount, date);
    } catch (err) {
      console.error("Record payment error:", err);
    }
  };

  const addBill = async (retailerId, amount, date, image) => {
    try {
      await fbAddBill(String(retailerId), amount, date, image);
    } catch (err) {
      console.error("Add bill error:", err);
    }
  };

  // ── DASHBOARD ──────────────────────────────────────
  const getDashboardStats = () => {
    const totalItems = inventory.length;
    const lowStock = inventory.filter((i) => (Number(i.boxes) || 0) <= (Number(i.minStock) || 0));
    const totalPending = retailers.reduce((sum, r) => sum + (Number(r.pendingAmount) || 0), 0);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = expenses
      .filter((e) => (e.date || "").startsWith(currentMonth))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return { totalItems, lowStock, totalPending, monthlyExpenses };
  };

  const value = {
    user, login, logout, addTransaction,

    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    loads, addLoad,
    sellLoads, addSellLoad,

    retailers, addRetailer, updateRetailer,

    transactions, recordPayment,
    addBill,

    expenses, addExpense,
    getDashboardStats,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}