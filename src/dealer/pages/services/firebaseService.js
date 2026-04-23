import { db, auth } from "@/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  getDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ==================
// ADD ITEM
// ==================
export const addItem = async (item) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await addDoc(collection(db, "users", uid, "inventory"), {
    ...item,
    createdAt: serverTimestamp()
  });
};

// ==================
// ADD TRANSACTION
// ==================
export const addTransaction = async (data) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await addDoc(collection(db, "users", uid, "transactions"), {
    ...data,
    createdAt: serverTimestamp()
  });
};

// ==================
// ADD LOAD (MERGE)
// ==================
export const addLoad = async (load) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  console.log("📦 Adding load:", load);

  const inventoryRef = collection(db, "users", uid, "inventory");

  // Query by item name only (to handle both old and new structures)
  const q = query(
    inventoryRef,
    where("name", "==", load.itemName)
  );

  const snap = await getDocs(q);

  let foundMatch = false;

  if (!snap.empty) {
    // Check if any matching item has the same unit or grams
    for (const docSnap of snap.docs) {
      const itemData = docSnap.data();
      const ref = docSnap.ref;
      
      // Check if unit matches (new structure) or grams matches (old structure)
      const unitMatch = itemData.unit === load.unit;
      const gramsMatch = itemData.grams === (load.quantity + load.unit) || 
                        itemData.grams === load.quantity;
      
      if (unitMatch || gramsMatch) {
        foundMatch = true;
        
        // Update existing item
        const updateData = {
          boxes: increment(load.boxes),
          dealerBoxPrice: load.dealerBoxPrice,
          updatedAt: serverTimestamp()
        };

        // If old structure (has grams), migrate to new structure
        if (itemData.grams && !itemData.quantity) {
          updateData.quantity = increment(Number(load.quantity));
          updateData.unit = load.unit;
          console.log("🔄 Migrating old item to new structure:", load.itemName);
        } else {
          // New structure - just update
          updateData.quantity = increment(Number(load.quantity));
        }

        await updateDoc(ref, updateData);
        console.log("✅ Inventory updated (existing item):", load.itemName);
        break;
      }
    }
  }

  if (!foundMatch) {
    // Create new item with new structure
    const newRef = doc(inventoryRef);

    await setDoc(newRef, {
      name: load.itemName,
      quantity: Number(load.quantity),
      unit: load.unit,
      boxes: load.boxes,
      dealerBoxPrice: load.dealerBoxPrice,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("✅ Inventory created (new item):", load.itemName);
  }

  // Save to loads collection
  await addDoc(collection(db, "users", uid, "loads"), {
    ...load,
    createdAt: serverTimestamp()
  });
  console.log("✅ Load saved to Firestore");
};

// ==================
// ADD EXPENSE
// ==================
export const addExpense = async (expense) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  console.log("💰 Adding expense:", expense);

  await addDoc(collection(db, "users", uid, "expenses"), {
    ...expense,
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, "users", uid, "transactions"), {
    type: "expense",
    amount: Number(expense.amount),
    note: expense.note || "",
    date: expense.date,
    createdAt: serverTimestamp()
  });
  console.log("✅ Expense saved to Firestore");
};

// ==================
// SELL ITEM
// ==================
export const sellItem = async (saleData) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  console.log("🛒 Selling items:", saleData);

  for (const item of saleData.items) {
    const ref = doc(db, "users", uid, "inventory", String(item.itemId));
    const snap = await getDoc(ref);

    if (!snap.exists()) continue;

    const currentData = snap.data();
    const currentBoxes = Number(currentData.boxes) || 0;
    const currentQuantity = Number(currentData.quantity) || 0;
    const sellBoxes = Number(item.boxes) || 0;
    const sellQuantity = Number(item.quantity) || 0;

    // Check stock based on new structure (quantity) or old structure (boxes only)
    if (currentData.quantity) {
      // New structure - check quantity
      if (sellQuantity > currentQuantity) {
        throw new Error("Not enough stock (quantity)");
      }
    } else {
      // Old structure - check boxes
      if (sellBoxes > currentBoxes) {
        throw new Error("Not enough stock (boxes)");
      }
    }

    const updateData = {
      boxes: increment(-sellBoxes),
      updatedAt: serverTimestamp()
    };

    // If new structure, also decrement quantity
    if (currentData.quantity) {
      updateData.quantity = increment(-sellQuantity);
    }

    await updateDoc(ref, updateData);
    console.log("✅ Inventory updated for sale:", currentData.name);
  }

  // Save sale record
  await addDoc(collection(db, "users", uid, "sales"), {
    ...saleData,
    createdAt: serverTimestamp()
  });

  // Update retailer pending amount
  const retailerRef = doc(db, "users", uid, "retailers", String(saleData.retailerId));
  const snap = await getDoc(retailerRef);

  if (snap.exists()) {
    await updateDoc(retailerRef, {
      pendingAmount: increment(Number(saleData.balance || 0)),
      updatedAt: serverTimestamp()
    });
  } else {
    await setDoc(retailerRef, {
      shopName: saleData.shopName,
      ownerName: saleData.ownerName,
      phone: saleData.phone || "",
      pendingAmount: Number(saleData.balance || 0),
      createdAt: serverTimestamp()
    });
  }

  // Add transaction record
  await addDoc(collection(db, "users", uid, "transactions"), {
    type: "sell",
    retailerId: String(saleData.retailerId),
    name: saleData.shopName,
    product: saleData.items.map(i => i.itemName).join(", "),
    amount: Number(saleData.amountPaid || 0),
    total: Number(saleData.total || 0),
    pending: Number(saleData.balance || 0),
    date: saleData.date,
    createdAt: serverTimestamp()
  });
  console.log("✅ Sale recorded successfully");
};

// ==================
// RETAILERS
// ==================
export const addRetailer = async (retailer) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const ref = collection(db, "users", uid, "retailers");

  const docRef = await addDoc(ref, {
    ...retailer,
    pendingAmount: retailer.pendingAmount || 0,
    createdAt: serverTimestamp()
  });

  return docRef.id;
};

export const updateRetailer = async (id, data) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await updateDoc(doc(db, "users", uid, "retailers", String(id)), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// ==================
// PAYMENTS
// ==================
export const recordPayment = async (retailerId, amount, date) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const ref = doc(db, "users", uid, "retailers", String(retailerId));
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const current = Number(snap.data().pendingAmount) || 0;

    await updateDoc(ref, {
      pendingAmount: Math.max(0, current - Number(amount)),
      updatedAt: serverTimestamp()
    });
  }

  await addDoc(collection(db, "users", uid, "transactions"), {
    type: "payment",
    retailerId,
    amount,
    date,
    createdAt: serverTimestamp()
  });
};

// ==================
// UPDATE INVENTORY
// ==================
export const updateInventoryItem = async (id, data) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await updateDoc(doc(db, "users", uid, "inventory", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// ==================
// DELETE
// ==================
export const deleteInventoryItem = async (id) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await deleteDoc(doc(db, "users", uid, "inventory", id));
};

// ==================
// REALTIME
// ==================
const safeSubscribe = (name, callback) => {
  let unsubscribeSnapshot = () => {};

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log("❌ No user for", name);
      callback([]);
      return;
    }

    console.log("✅ User ready for", name, ":", user.uid);

    const ref = collection(db, "users", user.uid, name);

    // 🔥 attach snapshot properly
    unsubscribeSnapshot = onSnapshot(ref, (snap) => {
      console.log(`🔥 ${name} updated, docs count:`, snap.size);

      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      callback(data);
    });
  });

  // 🔥 return BOTH unsubscribes correctly
  return () => {
    unsubscribeAuth();
    unsubscribeSnapshot();
  };
};

// ==================
// ADD BILL
// ==================

export const addBill = async (retailerId, amount, date, image) => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await addDoc(collection(db, "users", uid, "transactions"), {
      type: "bill",
      retailerId: String(retailerId),
      amount: Number(amount),
      date: date,
      image: image || null,
      createdAt: serverTimestamp()
    });

  } catch (err) {
    console.error("Add bill error:", err);
  }
};

// ==================
// EXPORTS
// ==================
export const subscribeInventory = (cb) => safeSubscribe("inventory", cb);
export const subscribeTransactions = (cb) => safeSubscribe("transactions", cb);
export const subscribeSales = (cb) => safeSubscribe("sales", cb);
export const subscribeLoads = (cb) => safeSubscribe("loads", cb);
export const subscribeExpenses = (cb) => safeSubscribe("expenses", cb);
export const subscribeRetailers = (cb) => safeSubscribe("retailers", cb);
export const subscribeOrders = (cb) => safeSubscribe("orders", cb);