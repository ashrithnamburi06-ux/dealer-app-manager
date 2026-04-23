import { useState } from "react";
import { auth, db } from "@/firebase"; // ✅ FIXED (added db)
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSave = async () => {
    try {
      if (!password) return alert("Enter password");

      const user = auth.currentUser;

      if (!user) {
        alert("User not logged in");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        password: password,
      });

      alert("Password saved ✅");
      navigate("/dashboard");

    } catch (error) {
      console.error("Error saving password:", error);
      alert("Something went wrong ❌");
    }
  };

  return (
    <div className="login-screen">
      <h2>Set Password</h2>

      <input
        type="password"
        placeholder="Enter password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleSave}>Save</button>
    </div>
  );
}