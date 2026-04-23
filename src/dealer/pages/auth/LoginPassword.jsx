import { useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
 import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";


export default function LoginPassword() {
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

 
const handleLogin = async () => {
  try {
    // 🔥 Firestore logic (case-insensitive + trim)
    const usersRef = collection(db, "users");
    const snap = await getDocs(usersRef);
    let foundUser = null;

    const userInput = input.trim().toLowerCase();

    snap.forEach(doc => {
      const data = doc.data();
      const dbPhone = data.phone?.toString().trim().toLowerCase();
      const dbName = data.name?.toString().trim().toLowerCase();
      const dbEmail = data.email?.toString().trim().toLowerCase();

      if (dbPhone === userInput || dbName === userInput || dbEmail === userInput) {
        if (data.password === password.trim()) {
          foundUser = { ...data, uid: doc.id };
        }
      }
    });

    if (foundUser) {
      localStorage.setItem("user", JSON.stringify(foundUser));
      localStorage.setItem("isLoggedIn", "true");
      navigate("/dashboard");
    } else {
      alert("User not found or wrong password");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed");
  }
};

  return (
    <div className="login-screen">

      <div className="login-container">

        {/* 🔥 HEADER */}
        <div className="login-header">
          <h1 className="login-title">Dealrix</h1>
          <p className="login-subtitle">Welcome back</p>
        </div>

        {/* 🔥 LOGIN CARD */}
        <div className="login-form">

          <div className="field-group">
            <label>Username</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="field-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button className="btn-primary" onClick={handleLogin}>
            Login →
          </button>

        </div>
      </div>
    </div>
  );
}