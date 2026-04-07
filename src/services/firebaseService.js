import { db, auth } from "../firebase";
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

  const inventoryRef = collection(db, "users", uid, "inventory");

  const q = query(
    inventoryRef,
    where("name", "==", load.itemName),
    where("grams", "==", load.grams)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    const ref = snap.docs[0].ref;

    await updateDoc(ref, {
      boxes: increment(load.boxes),
      updatedAt: serverTimestamp()
    });
  } else {
    const newRef = doc(inventoryRef);

    await setDoc(newRef, {
      name: load.itemName,
      grams: load.grams,
      boxes: load.boxes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  await addDoc(collection(db, "users", uid, "loads"), {
    ...load,
    createdAt: serverTimestamp()
  });
};

// ==================
// ADD EXPENSE
// ==================
export const addExpense = async (expense) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

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
};

// ==================
// SELL ITEM
// ==================
export const sellItem = async (saleData) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  for (const item of saleData.items) {
    const ref = doc(db, "users", uid, "inventory", String(item.itemId));
    const snap = await getDoc(ref);

    if (!snap.exists()) continue;

    const current = Number(snap.data().boxes) || 0;
    const sell = Number(item.boxes) || 0;

    if (sell > current) {
      throw new Error("Not enough stock");
    }

    await updateDoc(ref, {
      boxes: increment(-sell),
      updatedAt: serverTimestamp()
    });
  }

  await addDoc(collection(db, "users", uid, "sales"), {
    ...saleData,
    createdAt: serverTimestamp()
  });

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
  let unsubSnap = () => {};

  const unsubAuth = onAuthStateChanged(auth, (user) => {
    if (!user) {
      callback([]);
      return;
    }

    const ref = collection(db, "users", user.uid, name);

    unsubSnap = onSnapshot(ref, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      callback(data);
    });
  });

  return () => {
    unsubAuth();
    unsubSnap();
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