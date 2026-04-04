import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import './AddLoad.css';

const GRAMS_OPTIONS = ['50g', '100g', '150g', '200g', '250g', '500g', '1kg'];

export default function AddLoad() {
  const { addLoad, inventory } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    itemName: '', grams: '100g', boxes: '',
    supplierName: '', supplierPhone: '',
    arrivalTime: '', totalAmount: '', amountPaid: '',
  });
  const [errors, setErrors] = useState({});

  const pendingAmount = Math.max(0, Number(form.totalAmount || 0) - Number(form.amountPaid || 0));

  const validate = () => {
    const e = {};
    if (!form.itemName.trim()) e.itemName = 'Item name required';
    if (!form.boxes || Number(form.boxes) < 0) e.boxes = 'Enter boxes';
    if (!form.supplierName.trim()) e.supplierName = 'Supplier name required';
    if (!form.totalAmount || Number(form.totalAmount) <= 0) e.totalAmount = 'Enter total amount';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    addLoad({
      ...form,
      boxes: Number(form.boxes),
      totalAmount: Number(form.totalAmount),
      amountPaid: Number(form.amountPaid || 0),
      pendingAmount,
    });
    navigate('/dashboard');
  };

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="page-title">Add Load</h2>
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        <div className="form-section-title">📦 Stock Info</div>

        <div className="field-group">
          <label className="field-label">Item Name *</label>
          <input
            className={`field-input ${errors.itemName ? 'error' : ''}`}
            list="inv-names"
            placeholder="e.g. Gold Flake Kings"
            value={form.itemName}
            onChange={handleChange('itemName')}
          />
          <datalist id="inv-names">
            {inventory.map((i) => <option key={i.id} value={i.name} />)}
          </datalist>
          {errors.itemName && <span className="field-error">{errors.itemName}</span>}
        </div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Units</label>
            <input
  className="field-input"
  type="number"
  placeholder="Enter grams (e.g. 100)"
  value={form.grams}
  onChange={handleChange('grams')}
/>
          </div>
          <div className="field-group flex-1">
            <label className="field-label">Boxes *</label>
            <input
              className={`field-input ${errors.boxes ? 'error' : ''}`}
              type="number" min="0" placeholder="0"
              value={form.boxes} onChange={handleChange('boxes')}
            />
            {errors.boxes && <span className="field-error">{errors.boxes}</span>}
          </div>
        </div>

        <div className="form-section-title">🚚 Supplier Info</div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Supplier Name *</label>
            <input
              className={`field-input ${errors.supplierName ? 'error' : ''}`}
              placeholder="Supplier name"
              value={form.supplierName} onChange={handleChange('supplierName')}
            />
            {errors.supplierName && <span className="field-error">{errors.supplierName}</span>}
          </div>
          <div className="field-group flex-1">
            <label className="field-label">Phone</label>
            <input className="field-input" type="tel" placeholder="Phone no." value={form.supplierPhone} onChange={handleChange('supplierPhone')} />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Arrival Time</label>
          <input className="field-input" type="datetime-local" value={form.arrivalTime} onChange={handleChange('arrivalTime')} />
        </div>

        <div className="form-section-title">💰 Payment</div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Total Amount *</label>
            <input
              className={`field-input ${errors.totalAmount ? 'error' : ''}`}
              type="number" min="0" placeholder="₹0"
              value={form.totalAmount} onChange={handleChange('totalAmount')}
            />
            {errors.totalAmount && <span className="field-error">{errors.totalAmount}</span>}
          </div>
          <div className="field-group flex-1">
            <label className="field-label">Amount Paid</label>
            <input className="field-input" type="number" min="0" placeholder="₹0" value={form.amountPaid} onChange={handleChange('amountPaid')} />
          </div>
        </div>

        {Number(form.totalAmount) > 0 && (
          <div className={`pending-chip ${pendingAmount > 0 ? 'pending-red' : 'pending-green'}`}>
            {pendingAmount > 0
              ? `⚠️ Pending: ₹${pendingAmount.toLocaleString()}`
              : '✅ Fully Paid'}
          </div>
        )}

        <button id="add-load-submit" className="btn-primary btn-block" type="submit">
          📥 Record Load
        </button>
      </form>
    </div>
  );
}
