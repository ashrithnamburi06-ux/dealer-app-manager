import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import './Login.css';
import { auth } from '../../../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    agency: ''
  });

  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Setup Recaptcha (safe)
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        { size: 'invisible' }
      );
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (!form.agency.trim()) e.agency = 'Agency / Shop Name is required';
    return e;
  };

  // ✅ Send OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setupRecaptcha();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        '+91' + form.phone,
        window.recaptchaVerifier
      );

      window.confirmationResult = confirmationResult;

      setShowOtp(true);
      alert('OTP Sent ✅');
    } catch (err) {
      console.error(err);
      alert('Error sending OTP ❌');
    }
  };

  // ✅ Verify OTP
  const verifyOtp = async () => {
    try {
      const result = await window.confirmationResult.confirm(otp);

      const user = result.user;

      // Save user with UID
      login({
        ...form,
        uid: user.uid
      });

      console.log('UID:', user.uid);

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Invalid OTP ❌');
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
            placeholder="e.g. Rajesh Kumar"
            value={form.name}
            onChange={handleChange('name')}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field-group">
          <label className="field-label">Phone Number</label>
          <input
            className={`field-input ${errors.phone ? 'error' : ''}`}
            placeholder="10-digit mobile number"
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
            placeholder="e.g. Kumar Distributors"
            value={form.agency}
            onChange={handleChange('agency')}
          />
          {errors.agency && <span className="field-error">{errors.agency}</span>}
        </div>

        <button className="btn-primary login-btn" type="submit">
          Login →
        </button>

        {showOtp && (
          <>
            <div className="field-group">
              <label className="field-label">Enter OTP</label>
              <input
                className="field-input"
                placeholder="Enter OTP"
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

      {/* ✅ Required for Firebase */}
      <div id="recaptcha-container"></div>
    </div>
  );
}