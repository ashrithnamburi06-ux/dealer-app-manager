import { useNavigate } from 'react-router-dom';
import './Login.css';
import { auth, db } from '@/firebase';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    agency: ''
  });

  const [errors, setErrors] = useState({});

  // ✅ REMOVED: Automatic redirects to prevent flicker
  useEffect(() => {
    // Auth observer removed to rely purely on manual login flow
  }, []);

  // ✅ VALIDATION (UNCHANGED)
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter valid phone';
    if (!form.agency.trim()) e.agency = 'Shop name required';
    return e;
  };

  // ✅ GOOGLE SIGNUP LOGIC (UNCHANGED + SAFE)
  const handleGoogleSignup = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // 🟢 NEW USER
        await setDoc(ref, {
          name: form.name,
          phone: form.phone,
          agency: form.agency,
          email: user.email,
          password: "",
          createdAt: new Date()
        });

        navigate("/set-password");
      } else {
        const data = snap.data();

        if (!data.password) {
          navigate("/set-password");
        } else {
          navigate("/login-password");
        }
      }

    } catch (err) {
      console.error("Google login failed:", err);
      alert("Google login failed");
    }
  };

  // ✅ INPUT HANDLER (UNCHANGED)
  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="login-screen">

      <div className="login-container">

        <div className="login-header">
          <h1 className="login-title">Dealrix</h1>
          <p className="login-subtitle">Distribution Management System</p>
        </div>

        <div className="login-form">

          <div className="field-group">
            <label>Your Name</label>
            <input value={form.name} onChange={handleChange('name')} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="field-group">
            <label>Phone Number</label>
            <input value={form.phone} onChange={handleChange('phone')} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="field-group">
            <label>Shop Name</label>
            <input value={form.agency} onChange={handleChange('agency')} />
            {errors.agency && <span className="field-error">{errors.agency}</span>}
          </div>

          <button className="btn-primary" onClick={handleGoogleSignup}>
            Continue with Google →
          </button>

          <button
            className="btn-outline"
            onClick={() => navigate("/login-password")}
          >
            Already have account? Login
          </button>

        </div>
      </div>

    </div>
  );
}