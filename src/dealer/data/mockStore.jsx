// ============================================================
// DEALER APP - CENTRALIZED MOCK DATA STORE
// UPDATED WITH TRANSACTIONS (PAYMENT + BILL + IMAGE)
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react';


// ─── Initial Mock Data ───────────────────────────────────────

const initialInventory = [
  { id: 1, name: 'Gold Flake Kings', grams: '100g', boxes: 20, pieces: 50, price: 280, minStock: 5 },
  { id: 2, name: 'Classic Milds', grams: '200g', boxes: 3, pieces: 10, price: 320, minStock: 5 },
  { id: 3, name: 'Navy Cut', grams: '100g', boxes: 15, pieces: 0, price: 260, minStock: 8 },
  { id: 4, name: 'Four Square', grams: '50g', boxes: 2, pieces: 5, price: 180, minStock: 5 },
  { id: 5, name: 'Wills Classic', grams: '200g', boxes: 10, pieces: 20, price: 350, minStock: 4 },
];

const initialRetailers = [
  {
    id: 1,
    shopName: 'Sharma General Store',
    ownerName: 'Ramesh Sharma',
    phone: '9876543210',
    lastPurchase: '2026-04-01',
    pendingAmount: 1500,
  },
  {
    id: 2,
    shopName: 'Patel Kirana',
    ownerName: 'Suresh Patel',
    phone: '9988776655',
    lastPurchase: '2026-03-28',
    pendingAmount: 0,
  },
  {
    id: 3,
    shopName: 'Kumar Mart',
    ownerName: 'Vijay Kumar',
    phone: '9123456789',
    lastPurchase: '2026-03-20',
    pendingAmount: 3200,
  },
];

const initialLoads = [
  {
    id: 1,
    itemName: 'Gold Flake Kings',
    grams: '100g',
    supplierName: 'ITC Distributor',
    supplierPhone: '9000000001',
    arrivalTime: '2026-04-01T10:00',
    totalAmount: 5600,
    amountPaid: 5600,
    pendingAmount: 0,
    date: '2026-04-01',
  },
];

const initialSellLoads = [
  {
    id: 1,
    retailerId: 1,
    shopName: 'Sharma General Store',
    ownerName: 'Ramesh Sharma',
    phone: '9876543210',
    items: [
      { itemId: 1, itemName: 'Gold Flake Kings', boxes: 2, pieces: 10, dealerPrice: 270, mrpPrice: 280 },
    ],
    total: 550,
    amountPaid: 0,
    balance: 550,
    date: '2026-04-01',
  },
];

const initialExpenses = [
  { id: 1, amount: 500, date: '2026-04-01', note: 'Fuel' },
  { id: 2, amount: 200, date: '2026-04-02', note: 'Printing' },
];

const initialUser = JSON.parse(localStorage.getItem("user")) || null;

// ─── Context ─────────────────────────────────────────────────

export const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(initialUser);
  const [inventory, setInventory] = useState(initialInventory);
  const [retailers, setRetailers] = useState(initialRetailers);
  const [loads, setLoads] = useState(initialLoads);
  const [sellLoads, setSellLoads] = useState(initialSellLoads);
  const [expenses, setExpenses] = useState(initialExpenses);

  // 🔥 NEW: TRANSACTIONS STATE
  const [transactions, setTransactions] = useState(() => {
  const saved = localStorage.getItem("transactions");
  return saved ? JSON.parse(saved) : [];
});
useEffect(() => {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}, [transactions]);

  // ── Auth ─────────────────────────────────────────────
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // ── Inventory Actions ────────────────────────────────
  const addInventoryItem = (item) => {
    const newItem = { ...item, id: Date.now() };
    setInventory((prev) => [...prev, newItem]);
  };

  const updateInventoryItem = (id, updated) => {
    setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
  };

  const deleteInventoryItem = (id) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const deductInventory = (items) => {
    setInventory((prev) =>
      prev.map((inv) => {
        const sold = items.find((s) => s.itemId === inv.id);
        if (!sold) return inv;
        return {
          ...inv,
          boxes: Math.max(0, inv.boxes - (sold.boxes || 0)),
          pieces: Math.max(0, inv.pieces - (sold.pieces || 0)),
        };
      })
    );
  };

  const addStockFromLoad = (itemName, grams, boxesAdded) => {
    setInventory((prev) => {
      const exists = prev.find((i) => i.name === itemName && i.grams === grams);

      if (exists) {
        return prev.map((i) =>
          i.name === itemName && i.grams === grams
            ? { ...i, boxes: i.boxes + Number(boxesAdded) }
            : i
        );
      }

      return [
        ...prev,
        {
          id: Date.now(),
          name: itemName,
          grams,
          boxes: Number(boxesAdded),
          pieces: 0,
          price: 0,
          minStock: 5,
        },
      ];
    });
  };

  // ── Load Actions ─────────────────────────────────────
  const addLoad = (load) => {
    const newLoad = {
      ...load,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    setLoads((prev) => [...prev, newLoad]);
    addStockFromLoad(load.itemName, load.grams, load.boxes || 0);
  };

  // ── Sell Load Actions ────────────────────────────────
  const addSellLoad = (sell) => {
    const newSell = { ...sell, id: Date.now() };
    setSellLoads((prev) => [...prev, newSell]);
    deductInventory(sell.items);

    setRetailers((prev) => {
      const exists = prev.find((r) => r.id === sell.retailerId);

      if (exists) {
        return prev.map((r) =>
          r.id === sell.retailerId
            ? {
                ...r,
                pendingAmount: r.pendingAmount + sell.balance,
                lastPurchase: sell.date,
              }
            : r
        );
      }

      return [
        ...prev,
        {
          id: sell.retailerId || Date.now(),
          shopName: sell.shopName,
          ownerName: sell.ownerName,
          phone: sell.phone,
          pendingAmount: sell.balance,
          lastPurchase: sell.date,
        },
      ];
    });
  };

  // ── Retailer Actions ─────────────────────────────────

  const addRetailer = (retailer) => {
    const newRetailer = {
      ...retailer,
      id: Date.now(),
      pendingAmount: 0,
      lastPurchase: '',
    };
    setRetailers((prev) => [...prev, newRetailer]);
  };

  const updateRetailer = (id, updated) => {
    setRetailers((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  };

  // 🔥 UPDATED PAYMENT (WITH DATE + TRANSACTION)
  const recordPayment = (retailerId, amount, date) => {
    setRetailers((prev) =>
      prev.map((r) =>
        r.id === retailerId
          ? { ...r, pendingAmount: Math.max(0, r.pendingAmount - Number(amount)) }
          : r
      )
    );

    const newTransaction = {
      id: Date.now(),
      retailerId,
      type: "payment",
      amount: Number(amount),
      date,
      image: null,
    };

    setTransactions((prev) => [newTransaction, ...prev]);
  };

  // 🔥 NEW BILL FUNCTION (WITH IMAGE)
  const addBill = (retailerId, amount, date, image) => {
    const newTransaction = {
      id: Date.now(),
      retailerId,
      type: "bill",
      amount: Number(amount),
      date,
      image,
    };

    setTransactions((prev) => [newTransaction, ...prev]);
  };

  // ── Expense Actions ──────────────────────────────────
  const addExpense = (expense) => {
    const newExpense = { ...expense, id: Date.now() };
    setExpenses((prev) => [...prev, newExpense]);
  };

  // ── Dashboard Stats ──────────────────────────────────
  const getDashboardStats = () => {
    const totalItems = inventory.length;
    const lowStock = inventory.filter((i) => i.boxes <= i.minStock);
    const totalPending = retailers.reduce((sum, r) => sum + r.pendingAmount, 0);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = expenses
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return { totalItems, lowStock, totalPending, monthlyExpenses };
  };

  const value = {
    user, login, logout,

    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    loads, addLoad,
    sellLoads, addSellLoad,

    retailers, addRetailer, updateRetailer,

    // 🔥 NEW
    transactions,
    recordPayment,
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
