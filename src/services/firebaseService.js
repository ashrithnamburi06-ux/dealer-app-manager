import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ==================
// ADD DATA
// ==================

export const addItem = async (item) => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const ref = collection(db, "users", uid, "inventory");

    await addDoc(ref, {
      ...item,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Add item error:", err);
  }
};

export const addTransaction = async (data) => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const ref = collection(db, "users", uid, "transactions");

    await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Add transaction error:", err);
  }
};

export const addSale = async (sale) => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const ref = collection(db, "users", uid, "sales");

    await addDoc(ref, {
      ...sale,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Add sale error:", err);
  }
};

import { getDoc } from "firebase/firestore";

export const addLoad = async (load) => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // 1️⃣ Save load
    const loadsRef = collection(db, "users", uid, "loads");

    await addDoc(loadsRef, {
      ...load,
      createdAt: serverTimestamp()
    });

    // 2️⃣ Update inventory (FINAL FIX)
    if (!load.itemId) {
      console.warn("No itemId provided");
      return;
    }

    const itemRef = doc(db, "users", uid, "inventory", load.itemId);

    // 🔥 get current inventory data
    const snap = await getDoc(itemRef);

    if (!snap.exists()) {
      console.warn("Item not found in inventory");
      return;
    }

    const currentBoxes = Number(snap.data().boxes) || 0;
    const boxesToAdd = Number(load.boxesAdded) || 0;

    // 🔥 update properly (no increment issues)
    await updateDoc(itemRef, {
      boxes: currentBoxes + boxesToAdd,
      updatedAt: serverTimestamp()
    });

  } catch (err) {
    console.error("Add load error:", err);
  }
};
// ==================
// UPDATE
// ==================

export const updateInventoryItem = async (id, data) => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const ref = doc(db, "users", uid, "inventory", id);

    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Update error:", err);
  }
};

// ==================
// REAL-TIME (FINAL FIX)
// ==================

const safeSubscribe = (name, callback) => {
  let unsubscribeSnapshot = () => {};

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (!user) {
      callback([]);
      return;
    }

    const ref = collection(db, "users", user.uid, name);

    unsubscribeSnapshot = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        callback(data);
      },
      (error) => {
        console.error(`Realtime ${name} error:`, error);
        callback([]);
      }
    );
  });

  return () => {
    unsubscribeAuth();
    unsubscribeSnapshot();
  };
};

// ==================
// EXPORTS
// ==================

export const subscribeInventory = (cb) => safeSubscribe("inventory", cb);
export const subscribeTransactions = (cb) => safeSubscribe("transactions", cb);
export const subscribeSales = (cb) => safeSubscribe("sales", cb);
export const subscribeLoads = (cb) => safeSubscribe("loads", cb);