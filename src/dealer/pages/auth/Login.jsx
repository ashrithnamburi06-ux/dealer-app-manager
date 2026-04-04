import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import './Login.css';

export default function Login() {
  const { login } = useStore(); // ✅ use login (not setUser)
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    agency: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (!form.agency.trim()) e.agency = 'Agency / Shop Name is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // ✅ SAVE LOGIN + PERSIST
    login({ ...form });

    // ✅ REDIRECT TO DASHBOARD
    navigate('/dashboard');
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
      </form>

      <p className="login-footer">Dealer Distribution Management</p>
    </div>
  );
}