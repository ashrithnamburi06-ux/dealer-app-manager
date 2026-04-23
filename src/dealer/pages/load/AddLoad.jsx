import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddLoad.css';
import { addLoad, addTransaction, subscribeInventory } from "../services/firebaseService";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { useEffect } from "react";

const UNITS = [
  { label: "Liters", value: "liters" },
  { label: "Kg", value: "kg" },
  { label: "Ton", value: "ton" },
  { label: "Quinta", value: "quinta" },
  { label: "Grams", value: "Grams" },
  { label: "Other", value: "other" }
];

export default function AddLoad() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribeSnapshot = subscribeInventory(setInventory);
      } else {
        setInventory([]);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  const [form, setForm] = useState({
    itemName: '',
    quantity: '',
    unit: 'kg',
    boxes: '',
    dealerBoxPrice: '',
    supplierName: '',
    supplierPhone: '',
    arrivalTime: '',
    totalAmount: '',
    amountPaid: '',
  });

  const [gst, setGst] = useState("");
  const [billImage, setBillImage] = useState(null);
  const [errors, setErrors] = useState({});

  const pendingAmount = Math.max(
    0,
    Number(form.totalAmount || 0) - Number(form.amountPaid || 0)
  );

  // Auto-calculate total amount when boxes or dealerBoxPrice changes
  useEffect(() => {
    const boxes = Number(form.boxes) || 0;
    const dealerBoxPrice = Number(form.dealerBoxPrice) || 0;
    const total = boxes * dealerBoxPrice;
    
    if (total > 0) {
      setForm(prev => ({ ...prev, totalAmount: total.toString() }));
    }
  }, [form.boxes, form.dealerBoxPrice]);

  const validate = () => {
    const e = {};
    if (!form.itemName.trim()) e.itemName = 'Item name required';
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Enter quantity';
    if (!form.boxes || Number(form.boxes) <= 0) e.boxes = 'Enter boxes';
    if (!form.dealerBoxPrice || Number(form.dealerBoxPrice) <= 0) e.dealerBoxPrice = 'Enter dealer box price';
    if (!form.supplierName.trim()) e.supplierName = 'Supplier name required';
    if (!form.totalAmount || Number(form.totalAmount) <= 0)
      e.totalAmount = 'Enter total amount';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
   

const selectedItem = inventory.find(
  (i) =>
    i.name?.trim().toLowerCase() === form.itemName.trim().toLowerCase()
    && String(i.grams) === String(form.quantity + form.unit)
);

// ✅ Allow new items
const itemId = selectedItem?.id || null;// 🔥 fallback to first item



      // ✅ FIRESTORE LOAD
      await addLoad({
        itemId: itemId,
        itemName: form.itemName,
        quantity: Number(form.quantity),
        unit: form.unit,
        boxes: Number(form.boxes),
        dealerBoxPrice: Number(form.dealerBoxPrice),
        supplierName: form.supplierName,
        totalAmount: Number(form.totalAmount),
        amountPaid: Number(form.amountPaid || 0),
        pendingAmount,
        gst,
        image: billImage,
      });

      // ✅ FIRESTORE TRANSACTION
      await addTransaction({
        type: "add",
        gst,
        image: billImage,
        name: form.supplierName,
        product: form.itemName,
        amount: Number(form.totalAmount),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      });

      console.log("Load saved to Firebase ✅");

      navigate('/dashboard');
    } catch (error) {
      console.error("Error saving load:", error);
    }
  };

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="page-title">Add Load</h2>
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        <div className="form-section-title">📦 Item Info</div>

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
            {inventory.map((i) => (
              <option key={i.id} value={i.name} />
            ))}
          </datalist>
          {errors.itemName && (
            <span className="field-error">{errors.itemName}</span>
          )}
        </div>

        <div className="form-section-title">⚖️ Quantity & Unit</div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Quantity *</label>
            <input
              className={`field-input ${errors.quantity ? 'error' : ''}`}
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter quantity"
              value={form.quantity}
              onChange={handleChange('quantity')}
            />
            {errors.quantity && (
              <span className="field-error">{errors.quantity}</span>
            )}
          </div>

          <div className="field-group flex-1">
            <label className="field-label">Unit *</label>
            <select
              className="field-input"
              value={form.unit}
              onChange={handleChange('unit')}
            >
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section-title">📦 Pricing</div>

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
            {errors.boxes && (
              <span className="field-error">{errors.boxes}</span>
            )}
          </div>

          <div className="field-group flex-1">
            <label className="field-label">Dealer Box Price *</label>
            <input
              className={`field-input ${errors.dealerBoxPrice ? 'error' : ''}`}
              type="number"
              min="0"
              step="0.01"
              placeholder="₹0"
              value={form.dealerBoxPrice}
              onChange={handleChange('dealerBoxPrice')}
            />
            {errors.dealerBoxPrice && (
              <span className="field-error">{errors.dealerBoxPrice}</span>
            )}
          </div>
        </div>

        <div className="form-section-title">🚚 Supplier Info</div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Supplier Name *</label>
            <input
              className={`field-input ${errors.supplierName ? 'error' : ''}`}
              placeholder="Supplier name"
              value={form.supplierName}
              onChange={handleChange('supplierName')}
            />
            {errors.supplierName && (
              <span className="field-error">{errors.supplierName}</span>
            )}
          </div>

          <div className="field-group flex-1">
            <label className="field-label">Phone</label>
            <input
              className="field-input"
              type="tel"
              placeholder="Phone no."
              value={form.supplierPhone}
              onChange={handleChange('supplierPhone')}
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Arrival Time</label>
          <input
            className="field-input"
            type="datetime-local"
            value={form.arrivalTime}
            onChange={handleChange('arrivalTime')}
          />
        </div>

        <div className="form-section-title">💰 Payment</div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label className="field-label">Total Amount *</label>
            <input
              className={`field-input ${errors.totalAmount ? 'error' : ''}`}
              type="number"
              min="0"
              step="0.01"
              placeholder="₹0"
              value={form.totalAmount}
              onChange={handleChange('totalAmount')}
            />
            {errors.totalAmount && (
              <span className="field-error">{errors.totalAmount}</span>
            )}
          </div>

          <div className="field-group flex-1">
            <label className="field-label">Amount Paid</label>
            <input
              className="field-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="₹0"
              value={form.amountPaid}
              onChange={handleChange('amountPaid')}
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Pending Amount</label>
          <input
            className="field-input"
            type="number"
            value={pendingAmount}
            readOnly
            style={{ backgroundColor: '#f5f5f5' }}
          />
        </div>

        <div className="form-section-title">🧾 GST & Bill</div>

        <div className="field-group">
          <label className="field-label">GST Number</label>
          <input
            className="field-input"
            placeholder="Enter GST Number"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Upload Bill</label>
          <input
            className="field-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onloadend = () => setBillImage(reader.result);
              reader.readAsDataURL(file);
            }}
          />
        </div>

        <button
          id="add-load-submit"
          className="btn-primary btn-block"
          type="submit"
        >
          📥 Record Load
        </button>
      </form>
    </div>
  );
}