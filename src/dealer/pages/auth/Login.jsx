
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import './Login.css';
import { auth, db } from '../../../firebase';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

import { doc, setDoc } from "firebase/firestore";

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
  navigate("/dashboard");
}
  });

  return () => unsub();
}, [navigate]);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    agency: ''
  });

  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ VALIDATION
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (!form.agency.trim()) e.agency = 'Agency / Shop Name is required';
    return e;
  };

  // ✅ SETUP RECAPTCHA (FIXED)
  const setupRecaptcha = async () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }

    window.recaptchaVerifier = new RecaptchaVerifier(
      'recaptcha-container',
      { size: 'invisible' },
      auth
    );

    await window.recaptchaVerifier.render();
  };

  // ✅ SEND OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      await setupRecaptcha();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        '+91' + form.phone,
        window.recaptchaVerifier
      );

      window.confirmationResult = confirmationResult;

      setShowOtp(true);
      alert('OTP Sent ✅');

    } catch (err) {
      console.error("OTP ERROR:", err);
      alert(err.message);
    }
  };

  // ✅ VERIFY OTP
  const verifyOtp = async () => {
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: form.name,
          phone: form.phone,
          agency: form.agency,
          createdAt: new Date()
        },
        { merge: true }
      );

      login({
        ...form,
        uid: user.uid
      });

      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      alert('Invalid OTP ❌');
    }
  };

  // ✅ GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: user.displayName,
          email: user.email,
          createdAt: new Date()
        },
        { merge: true }
      );

      login({
        name: user.displayName,
        phone: user.phoneNumber || "",
        agency: form.agency || "New User",
        uid: user.uid
      });

      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      alert('Google login failed');
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: ''
    }));
  };
  

  return (
    <div className="login-screen">
      <div className="login-header">
        <div className="login-logo">🟢</div>
        <h1 className="login-title">Dealer App</h1>
        <p className="login-subtitle">Distribution Management System</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        
        <div className="field-group">
          <label className="field-label">Your Name</label>
          <input
            className={`field-input ${errors.name ? 'error' : ''}`}
            value={form.name}
            onChange={handleChange('name')}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field-group">
          <label className="field-label">Phone Number</label>
          <input
            className={`field-input ${errors.phone ? 'error' : ''}`}
            type="tel"
            maxLength={10}
            value={form.phone}
            onChange={handleChange('phone')}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="field-group">
          <label className="field-label">Agency / Shop Name</label>
          <input
            className={`field-input ${errors.agency ? 'error' : ''}`}
            value={form.agency}
            onChange={handleChange('agency')}
          />
          {errors.agency && <span className="field-error">{errors.agency}</span>}
        </div>

        <button className="btn-primary login-btn" type="submit">
          Login →
        </button>

        {/* 🔐 GOOGLE BUTTON */}
        <button
          type="button"
          className="btn-primary login-btn"
          onClick={handleGoogleLogin}
        >
          🔐 Login with Google
        </button>

        {showOtp && (
          <>
            <div className="field-group">
              <label className="field-label">Enter OTP</label>
              <input
                className="field-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-primary login-btn"
              onClick={verifyOtp}
            >
              Verify OTP →
            </button>
          </>
        )}
      </form>

      <p className="login-footer">Dealer Distribution Management</p>

      <div id="recaptcha-container"></div>
    </div>
  );
}