import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB33B9Bp8_8DkJAt1BPdG9bDbcBSIgzWnQ",
  authDomain: "dealer-app-a4db1.firebaseapp.com",
  projectId: "dealer-app-a4db1",
  storageBucket: "dealer-app-a4db1.firebasestorage.app",
  messagingSenderId: "44431343875",
  appId: "1:44431343875:web:0a267fcb7831fbb45de936"
  
};

const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);

// Enable auth persistence so users stay logged in across sessions
// This must be called once during app initialization
setPersistence(firebaseAuth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Firebase auth persistence enabled (browserLocalPersistence)");
  })
  .catch((error) => {
    console.error("❌ Error setting auth persistence:", error);
  });

export const auth = firebaseAuth;
export const db = getFirestore(app);