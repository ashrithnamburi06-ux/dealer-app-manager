import { db, auth } from "@/firebase";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";

// Create a new order in Firestore
export const createOrder = async (amount) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User not authenticated');

  const orderData = {
    amount: Number(amount),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, "users", uid, "orders"), orderData);
  return docRef.id; // Return the auto-generated document ID as orderId
};

// Get order by ID from Firestore
export const getOrder = async (orderId) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User not authenticated');

  const orderRef = doc(db, "users", uid, "orders", orderId);
  const orderSnap = await getDoc(orderRef);

  if (!orderSnap.exists()) {
    return null;
  }

  return {
    id: orderSnap.id,
    ...orderSnap.data(),
  };
};

// Update order status after payment verification (with atomic check to prevent race conditions)
export const updateOrderStatus = async (orderId, paymentId, razorpayOrderId, items = null, totalAmount = null, customerName = null, customerPhone = null) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User not authenticated');

  const orderRef = doc(db, "users", uid, "orders", orderId);
  
  // First, fetch the current order to check status
  const orderSnap = await getDoc(orderRef);
  
  if (!orderSnap.exists()) {
    throw new Error('Order not found');
  }

  const currentOrder = orderSnap.data();

  // Prevent double payment: only update if status is still 'pending'
  if (currentOrder.status === 'paid') {
    throw new Error('Order already paid');
  }

  // Update order with payment details
  const updateData = {
    status: 'paid',
    paymentId: paymentId,
    razorpayOrderId: razorpayOrderId,
    paidAt: new Date().toISOString(),
  };

  // Add customer details if provided
  if (customerName) {
    updateData.customerName = customerName;
  }
  if (customerPhone) {
    updateData.customerPhone = customerPhone;
  }

  // Add items and totalAmount if provided
  if (items) {
    updateData.items = items;
  }
  if (totalAmount) {
    updateData.totalAmount = totalAmount;
  }

  await updateDoc(orderRef, updateData);
};

// Legacy function for backward compatibility
export const saveOrder = async (order) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User not authenticated');

  const orderData = {
    orderId: order.orderId,
    paymentId: order.paymentId || null,
    razorpayOrderId: order.razorpayOrderId || null,
    amount: order.amount,
    status: order.status || 'pending',
    createdAt: order.createdAt || new Date().toISOString(),
  };

  await addDoc(collection(db, "users", uid, "orders"), orderData);
};