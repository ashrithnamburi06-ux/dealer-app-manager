import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import './Inventory.css';

const GRAMS_OPTIONS = ['50g', '100g', '150g', '200g', '250g', '500g', '1kg'];

export default function EditItem() {
  const { id } = useParams();
  const { inventory, updateInventoryItem } = useStore();
  const navigate = useNavigate();

  const item = inventory.find((i) => i.id === Number(id));

  const [form, setForm] = useState(
    item
      ? { ...item, boxes: String(item.boxes), pieces: String(item.pieces), price: String(item.price), minStock: String(item.minStock) }
      : {}
  );
  const [errors, setErrors] = useState({});

  if (!item) {
    return (
      <div className="screen">
        <div className="empty-state"><p>Item not found.</p></div>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Item name required';
    if (!form.boxes || isNaN(form.boxes) || Number(form.boxes) < 0) e.boxes = 'Enter valid boxes count';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Enter valid price';
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
    updateInventoryItem(Number(id), {
      ...form,
      boxes: Number(form.boxes),
      pieces: Number(form.pieces || 0),
      price: Number(form.price),
      minStock: Number(form.minStock),
    });
    navigate('/inventory');
  };

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="page-title">Edit Item</h2>
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label">Item Name *</label>
          <input className={`field-input ${errors.name ? 'error' : ''}`} value={form.name} onChange={handleChange('name')} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field-group">
          <label className="field-label">Grams</label>
          <select className="field-input" value={form.grams} onChange={handleChange('grams')}>
            {GRAMS_OPTIONS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Boxes *</label>
            <input className={`field-input ${errors.boxes ? 'error' : ''}`} type="number" min="0" value={form.boxes} onChange={handleChange('boxes')} />
            {errors.boxes && <span className="field-error">{errors.boxes}</span>}
          </div>
          <div className="field-group flex-1">
            <label className="field-label">Pieces</label>
            <input className="field-input" type="number" min="0" value={form.pieces} onChange={handleChange('pieces')} />
          </div>
        </div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Price (₹) *</label>
            <input className={`field-input ${errors.price ? 'error' : ''}`} type="number" min="0" value={form.price} onChange={handleChange('price')} />
            {errors.price && <span className="field-error">{errors.price}</span>}
          </div>
          <div className="field-group flex-1">
            <label className="field-label">Min Stock</label>
            <input className="field-input" type="number" min="0" value={form.minStock} onChange={handleChange('minStock')} />
          </div>
        </div>

        <button id="edit-item-submit" className="btn-primary btn-block" type="submit">
          💾 Save Changes
        </button>
      </form>
    </div>
  );
}
