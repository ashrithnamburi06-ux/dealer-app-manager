import { db, auth } from "@/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export const subscribeOrdersAnalytics = (callback) => {
  const unsubscribeAuth = auth.onAuthStateChanged((user) => {
    if (!user) {
      console.log("❌ No user for analytics");
      callback({
        totalRevenue: 0,
        totalOrders: 0,
        paidOrdersCount: 0,
        pendingOrdersCount: 0,
        orders: [],
      });
      return;
    }

    console.log("✅ Analytics: User ready:", user.uid);
    const ordersRef = collection(db, "users", user.uid, "orders");
  
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      console.log("🔥 Analytics: Orders updated, count:", snapshot.size);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate analytics
      const paidOrders = orders.filter(order => order.status === 'paid');
      const pendingOrders = orders.filter(order => order.status === 'pending');
      
      const totalRevenue = paidOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
      
      const analytics = {
        totalRevenue,
        totalOrders: orders.length,
        paidOrdersCount: paidOrders.length,
        pendingOrdersCount: pendingOrders.length,
        orders: orders,
      };

      callback(analytics);
    }, (error) => {
      console.error('Error fetching analytics:', error);
      callback({
        totalRevenue: 0,
        totalOrders: 0,
        paidOrdersCount: 0,
        pendingOrdersCount: 0,
        orders: [],
      });
    });

    return unsubscribe;
  });

  return () => {
    unsubscribeAuth();
  };
};
