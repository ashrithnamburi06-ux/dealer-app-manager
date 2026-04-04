import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import './Expenses.css';

export default function AddExpense() {
  const { addExpense } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.date) e.date = 'Date required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    addExpense({ ...form, amount: Number(form.amount) });
    navigate('/expenses');
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  const QUICK_AMOUNTS = [100, 200, 500, 1000];

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="page-title">Add Expense</h2>
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label">Amount (₹) *</label>
          <input
            id="expense-amount"
            className={`field-input amount-input ${errors.amount ? 'error' : ''}`}
            type="number"
            min="0"
            placeholder="0"
            value={form.amount}
            onChange={handleChange('amount')}
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
          <div className="quick-amounts">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                type="button"
                key={amt}
                className="quick-chip"
                onClick={() => { setForm((p) => ({ ...p, amount: String(amt) })); setErrors({}); }}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Date *</label>
          <input
            className={`field-input ${errors.date ? 'error' : ''}`}
            type="date"
            value={form.date}
            onChange={handleChange('date')}
          />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>

        <div className="field-group">
          <label className="field-label">Note (Optional)</label>
          <input
            className="field-input"
            placeholder="e.g. Fuel, Printing..."
            value={form.note}
            onChange={handleChange('note')}
          />
        </div>

        <button id="add-expense-submit" className="btn-primary btn-block" type="submit">
          💸 Add Expense
        </button>
      </form>
    </div>
  );
}
