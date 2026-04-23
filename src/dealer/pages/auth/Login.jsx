import { useNavigate } from 'react-router-dom';
import './Login.css';
import { auth, db } from '@/firebase';
import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    shopName: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isNewUser, setIsNewUser] = useState(true);

  // Check if user is already logged in and has data in Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("🔐 User already logged in:", user.email);
        // Check if user exists in Firestore
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          console.log("✅ Existing user found, redirecting to dashboard");
          navigate("/dashboard");
        } else {
          console.log("ℹ️ New user, showing onboarding form");
          setIsNewUser(true);
          setCheckingAuth(false);
        }
      } else {
        console.log("ℹ️ No user logged in, showing login form");
        setIsNewUser(true);
        setCheckingAuth(false);
      }
    });

    return () => unsub();
  }, [navigate]);

  // Validate form before login
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter valid 10-digit phone number';
    if (!form.shopName.trim()) e.shopName = 'Shop name is required';
    return e;
  };

  // Handle Google login with onboarding data
  const handleGoogleLogin = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log("🔐 Starting Google login with onboarding data:", form);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("✅ Google login successful:", user.email);

      // Check if user exists in Firestore
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // New user - create document with onboarding data
        console.log("📝 Creating new user document with onboarding data");
        await setDoc(ref, {
          uid: user.uid,
          email: user.email,
          name: form.name,
          phone: form.phone,
          shopName: form.shopName,
          createdAt: new Date()
        });
        console.log("✅ User document created successfully");
      } else {
        console.log("ℹ️ User already exists in Firestore, using existing data");
      }

      console.log("✅ Login complete, navigating to dashboard");
      navigate("/dashboard");

    } catch (err) {
      console.error("❌ Google login failed:", err);
      alert("Google login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Input handler
  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Show loading while checking auth state
  if (checkingAuth) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="login-header">
            <h1 className="login-title">Dealrix</h1>
            <p className="login-subtitle">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <input 
              value={form.name} 
              onChange={handleChange('name')}
              placeholder="Enter your full name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="field-group">
            <label>Phone Number</label>
            <input 
              value={form.phone} 
              onChange={handleChange('phone')}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="field-group">
            <label>Shop Name</label>
            <input 
              value={form.shopName} 
              onChange={handleChange('shopName')}
              placeholder="Enter your shop name"
            />
            {errors.shopName && <span className="field-error">{errors.shopName}</span>}
          </div>

          <button 
            className="btn-primary" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Continue with Google →'}
          </button>
        </div>
      </div>
    </div>
  );
}