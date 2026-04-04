import { createContext, useContext, useState, useEffect } from 'react';

// ─── Context ─────────────────────────────────────────
export const StoreContext = createContext(null);

export function StoreProvider({ children }) {

  // ── USER ───────────────────────────────────────────
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user")) || null;
  });

  // ── INVENTORY ──────────────────────────────────────
  const [inventory, setInventory] = useState(() => {
    return JSON.parse(localStorage.getItem("inventory")) || [];
  });

  // ── RETAILERS ──────────────────────────────────────
  const [retailers, setRetailers] = useState(() => {
    return JSON.parse(localStorage.getItem("retailers")) || [];
  });

  // ── LOADS ──────────────────────────────────────────
  const [loads, setLoads] = useState(() => {
    return JSON.parse(localStorage.getItem("loads")) || [];
  });

  // ── SELL LOADS ─────────────────────────────────────
  const [sellLoads, setSellLoads] = useState(() => {
    return JSON.parse(localStorage.getItem("sellLoads")) || [];
  });

  // ── EXPENSES ───────────────────────────────────────
  const [expenses, setExpenses] = useState(() => {
    return JSON.parse(localStorage.getItem("expenses")) || [];
  });

  // ── TRANSACTIONS ───────────────────────────────────
  const [transactions, setTransactions] = useState(() => {
    return JSON.parse(localStorage.getItem("transactions")) || [];
  });

  // ── SAVE TO LOCALSTORAGE ───────────────────────────
  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("retailers", JSON.stringify(retailers));
  }, [retailers]);

  useEffect(() => {
    localStorage.setItem("loads", JSON.stringify(loads));
  }, [loads]);

  useEffect(() => {
    localStorage.setItem("sellLoads", JSON.stringify(sellLoads));
  }, [sellLoads]);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  // ── AUTH ───────────────────────────────────────────
  const login = (userData) => setUser(userData);
  const logout = () => {
    setUser(null);
    localStorage.clear(); // 🔥 RESET APP FOR NEW USER
  };
  

  // ── INVENTORY ──────────────────────────────────────
  const addInventoryItem = (item) => {
    setInventory((prev) => [...prev, { ...item, id: Date.now() }]);
  };

  const updateInventoryItem = (id, updated) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updated } : i))
    );
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

  // ── LOADS ──────────────────────────────────────────
  const addLoad = (load) => {
    const newLoad = {
      ...load,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    setLoads((prev) => [...prev, newLoad]);
    addStockFromLoad(load.itemName, load.grams, load.boxes || 0);
  };

  // ── SELL LOAD ──────────────────────────────────────
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

  // ── RETAILERS ──────────────────────────────────────
  const addRetailer = (retailer) => {
    setRetailers((prev) => [
      ...prev,
      { ...retailer, id: Date.now(), pendingAmount: 0, lastPurchase: '' },
    ]);
  };

  const updateRetailer = (id, updated) => {
    setRetailers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
  };

  // ── PAYMENT ────────────────────────────────────────
  const recordPayment = (retailerId, amount, date) => {
    setRetailers((prev) =>
      prev.map((r) =>
        r.id === retailerId
          ? { ...r, pendingAmount: Math.max(0, r.pendingAmount - Number(amount)) }
          : r
      )
    );

    setTransactions((prev) => [
      {
        id: Date.now(),
        retailerId,
        type: "payment",
        amount: Number(amount),
        date,
        image: null,
      },
      ...prev,
    ]);
  };

  // ── BILL ───────────────────────────────────────────
  const addBill = (retailerId, amount, date, image) => {
    setTransactions((prev) => [
      {
        id: Date.now(),
        retailerId,
        type: "bill",
        amount: Number(amount),
        date,
        image,
      },
      ...prev,
    ]);
  };

  // ── EXPENSE ────────────────────────────────────────
  const addExpense = (expense) => {
    setExpenses((prev) => [...prev, { ...expense, id: Date.now() }]);
  };

  // ── DASHBOARD ──────────────────────────────────────
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

    transactions, recordPayment, addBill,

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