import { db } from "@/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

// 🔍 Get Dealer Data
export const getDealer = async (dealerId) => {
  try {
    const snap = await getDoc(doc(db, "dealers", dealerId));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("Error fetching dealer:", error);
    throw error;
  }
};

// 💳 Save UPI ID
export const saveUpiId = async (dealerId, upiId) => {
  try {
    await updateDoc(doc(db, "dealers", dealerId), { upiId });
  } catch (error) {
    console.error("Error saving UPI ID:", error);
    throw error;
  }
};

// 🔗 Generate Dealer Order Link
export const generateDealerLink = async (dealerId) => {
  try {
    const token = Math.random().toString(36).substring(2, 10);

    await setDoc(doc(db, "dealerLinks", token), {
      dealerId
    });

    return `${window.location.origin}/order?token=${token}`;
  } catch (error) {
    console.error("Error generating dealer link:", error);
    throw error;
  }
};