import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addItem } from "../services/firebaseService"; // ✅ Firebase
import './Inventory.css';

const GRAMS_OPTIONS = ['50g', '100g', '150g', '200g', '250g', '500g', '1kg'];

export default function AddItem() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    grams: '100g',
    boxes: '',
    pieces: '',
    price: '',
    minStock: '5',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Item name required';
    if (!form.boxes || isNaN(form.boxes) || Number(form.boxes) < 0)
      e.boxes = 'Enter valid boxes count';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      e.price = 'Enter valid price';
    if (!form.minStock || isNaN(form.minStock))
      e.minStock = 'Min stock required';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  // ✅ IMPORTANT: async + Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      await addItem({
        ...form,
        boxes: Number(form.boxes),
        pieces: Number(form.pieces || 0),
        price: Number(form.price),
        minStock: Number(form.minStock),
      });

      console.log("Saved to Firebase ✅");

      navigate('/inventory');
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="page-title">Add Item</h2>
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label">Item Name *</label>
          <input
            className={`field-input ${errors.name ? 'error' : ''}`}
            placeholder="e.g. Gold Flake Kings"
            value={form.name}
            onChange={handleChange('name')}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field-group">
          <label className="field-label">Grams</label>
          <input
            className="field-input"
            type="number"
            placeholder="Enter grams (e.g. 100)"
            value={form.grams}
            onChange={handleChange('grams')}
          />
        </div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Boxes *</label>
            <input
              className={`field-input ${errors.boxes ? 'error' : ''}`}
              type="number"
              min="0"
              placeholder="0"
              value={form.boxes}
              onChange={handleChange('boxes')}
            />
            {errors.boxes && <span className="field-error">{errors.boxes}</span>}
          </div>

          <div className="field-group flex-1">
            <label className="field-label">Pieces</label>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="0"
              value={form.pieces}
              onChange={handleChange('pieces')}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Price (₹) *</label>
            <input
              className={`field-input ${errors.price ? 'error' : ''}`}
              type="number"
              min="0"
              placeholder="0"
              value={form.price}
              onChange={handleChange('price')}
            />
            {errors.price && <span className="field-error">{errors.price}</span>}
          </div>

          <div className="field-group flex-1">
            <label className="field-label">Min Stock *</label>
            <input
              className={`field-input ${errors.minStock ? 'error' : ''}`}
              type="number"
              min="0"
              placeholder="5"
              value={form.minStock}
              onChange={handleChange('minStock')}
            />
            {errors.minStock && <span className="field-error">{errors.minStock}</span>}
          </div>
        </div>

        <button id="add-item-submit" className="btn-primary btn-block" type="submit">
          ✅ Add to Inventory
        </button>
      </form>
    </div>
  );
}