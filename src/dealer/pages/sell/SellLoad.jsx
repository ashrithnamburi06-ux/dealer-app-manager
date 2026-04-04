import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import './SellLoad.css';

const STEPS = ['Retailer', 'Items', 'Payment', 'Preview'];

export default function SellLoad() {
  const { inventory, retailers, addSellLoad, addRetailer } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Step 1: Retailer
  const [retailerMode, setRetailerMode] = useState('existing'); // 'existing' | 'new'
  const [selectedRetailerId, setSelectedRetailerId] = useState('');
  const [newRetailer, setNewRetailer] = useState({ shopName: '', ownerName: '', phone: '' });

  // Step 2: Items
  const [items, setItems] = useState([
  { itemId: '', boxes: '', pieces: '', dealerPrice: '', mrpPrice: '', totalPrice: '' },
]);
  

  // Step 3: Payment
  const [amountPaid, setAmountPaid] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  // ── Computed values ──────────────────────────────────────────
  const getItemById = (id) => inventory.find((i) => i.id === Number(id));

  const itemTotals = items.map((it) => {
    const inv = getItemById(it.itemId);
    const qty = (Number(it.boxes || 0) * (inv?.pieces || 1)) + Number(it.pieces || 0);
    return Number(it.dealerPrice || 0) * (Number(it.boxes || 0) + Number(it.pieces || 0) * 0.1);
  });

  // Simpler: total = boxes * dealerPrice  (per box)
  const grandTotal = items.reduce((sum, it) => {
  return sum + Number(it.totalPrice || 0);
}, 0);

  const balance = Math.max(0, grandTotal - Number(amountPaid || 0));

  const getRetailer = () => {
    if (retailerMode === 'existing') return retailers.find((r) => r.id === Number(selectedRetailerId));
    return newRetailer;
  };

  // ── Validation per step ──────────────────────────────────────
  const [errors, setErrors] = useState({});

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (retailerMode === 'existing' && !selectedRetailerId) e.retailer = 'Select a retailer';
      if (retailerMode === 'new') {
        if (!newRetailer.shopName.trim()) e.shopName = 'Shop name required';
        if (!newRetailer.ownerName.trim()) e.ownerName = 'Owner name required';
        if (!/^\d{10}$/.test(newRetailer.phone)) e.phone = 'Valid 10-digit phone required';
      }
    }
    if (step === 1) {
      if (items.length === 0) e.items = 'Add at least one item';
      items.forEach((it, i) => {
        if (!it.itemId) e[`item_${i}`] = 'Select item';
        if (!it.boxes && !it.pieces) e[`qty_${i}`] = 'Enter boxes or pieces';
        if (!it.totalPrice) e[`price_${i}`] = 'Total price required';
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step === 2) { setShowPreview(true); return; }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step === 0) { navigate(-1); return; }
    setStep((s) => s - 1);
  };

  // ── Items handlers ───────────────────────────────────────────
  const updateItem = (i, field, val) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      // Auto-fill dealer price from inventory
      if (field === 'itemId') {
        const inv = getItemById(val);
        if (inv) next[i].dealerPrice = String(inv.price);
      }
      return next;
    });
    setErrors((p) => { const n = { ...p }; delete n[`item_${i}`]; delete n[`qty_${i}`]; delete n[`price_${i}`]; return n; });
  };

  const addItemRow = () =>
  setItems((p) => [
    ...p,
    { itemId: '', boxes: '', pieces: '', dealerPrice: '', mrpPrice: '', totalPrice: '' }
  ]);
  const removeItemRow = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = () => {
    let retailerId;
    let shopName, ownerName, phone;

    if (retailerMode === 'existing') {
      const r = retailers.find((r) => r.id === Number(selectedRetailerId));
      retailerId = r.id;
      shopName = r.shopName;
      ownerName = r.ownerName;
      phone = r.phone;
    } else {
      const newId = Date.now();
      addRetailer({ ...newRetailer, id: newId });
      retailerId = newId;
      shopName = newRetailer.shopName;
      ownerName = newRetailer.ownerName;
      phone = newRetailer.phone;
    }

    addSellLoad({
      retailerId,
      shopName,
      ownerName,
      phone,
      items: items.map((it) => ({
        itemId: Number(it.itemId),
        itemName: getItemById(it.itemId)?.name || '',
        boxes: Number(it.boxes || 0),
        pieces: Number(it.pieces || 0),
        dealerPrice: Number(it.dealerPrice),
        mrpPrice: Number(it.mrpPrice || 0),
        totalPrice: Number(it.totalPrice || 0),
      })),
      total: grandTotal,
      amountPaid: Number(amountPaid || 0),
      balance,
      date: saleDate,
    });

    navigate('/selling-loads');
  };
  

  // ── Render ───────────────────────────────────────────────────
  const retailer = getRetailer();

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={handleBack}>← Back</button>
        <h2 className="page-title">Sell Load</h2>
      </div>

      {/* Step Indicator */}
      <div className="steps-row">
        {STEPS.map((s, i) => (
          <div key={s} className={`step-dot ${i <= step ? 'step-active' : ''}`}>
            <div className="step-circle">{i < step ? '✓' : i + 1}</div>
            <span className="step-label">{s}</span>
          </div>
        ))}
      </div>

      <div className="form-body">

        {/* ── STEP 0: Retailer ─────────────────────────── */}
        {step === 0 && (
          <div>
            <div className="toggle-row">
              <button
                className={`toggle-btn ${retailerMode === 'existing' ? 'toggle-active' : ''}`}
                onClick={() => setRetailerMode('existing')}
              >Existing Retailer</button>
              <button
                className={`toggle-btn ${retailerMode === 'new' ? 'toggle-active' : ''}`}
                onClick={() => setRetailerMode('new')}
              >New Retailer</button>
            </div>

            {retailerMode === 'existing' && (
              <div className="field-group">
                <label className="field-label">Select Retailer *</label>
                <select
                  className={`field-input ${errors.retailer ? 'error' : ''}`}
                  value={selectedRetailerId}
                  onChange={(e) => { setSelectedRetailerId(e.target.value); setErrors({}); }}
                >
                  <option value="">-- Choose Retailer --</option>
                  {retailers.map((r) => (
                    <option key={r.id} value={r.id}>{r.shopName} ({r.ownerName})</option>
                  ))}
                </select>
                {errors.retailer && <span className="field-error">{errors.retailer}</span>}
                {selectedRetailerId && (() => {
                  const r = retailers.find((x) => x.id === Number(selectedRetailerId));
                  return r ? (
                    <div className="retailer-preview-chip">
                      <p>🏪 {r.shopName}</p>
                      <p>👤 {r.ownerName} · 📞 {r.phone}</p>
                      {r.pendingAmount > 0 && <p className="chip-pending">⚠️ Pending: ₹{r.pendingAmount}</p>}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {retailerMode === 'new' && (
              <>
                <div className="field-group">
                  <label className="field-label">Shop Name *</label>
                  <input className={`field-input ${errors.shopName ? 'error' : ''}`} placeholder="Shop name" value={newRetailer.shopName} onChange={(e) => { setNewRetailer((p) => ({ ...p, shopName: e.target.value })); setErrors({}); }} />
                  {errors.shopName && <span className="field-error">{errors.shopName}</span>}
                </div>
                <div className="field-group">
                  <label className="field-label">Owner Name *</label>
                  <input className={`field-input ${errors.ownerName ? 'error' : ''}`} placeholder="Owner name" value={newRetailer.ownerName} onChange={(e) => { setNewRetailer((p) => ({ ...p, ownerName: e.target.value })); setErrors({}); }} />
                  {errors.ownerName && <span className="field-error">{errors.ownerName}</span>}
                </div>
                <div className="field-group">
                  <label className="field-label">Phone *</label>
                  <input className={`field-input ${errors.phone ? 'error' : ''}`} type="tel" maxLength={10} placeholder="10-digit phone" value={newRetailer.phone} onChange={(e) => { setNewRetailer((p) => ({ ...p, phone: e.target.value })); setErrors({}); }} />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 1: Items ────────────────────────────── */}
        {step === 1 && (
          <div>
            {errors.items && <div className="field-error" style={{ marginBottom: 10 }}>{errors.items}</div>}
            {items.map((it, i) => (
              <div key={i} className="item-row-card">
                <div className="item-row-header">
                  <span className="item-row-num">Item {i + 1}</span>
                  {items.length > 1 && (
                    <button className="remove-btn" onClick={() => removeItemRow(i)}>✕</button>
                  )}
                </div>

                <div className="field-group">
                  <label className="field-label">Select Item *</label>
                  <select
                    className={`field-input ${errors[`item_${i}`] ? 'error' : ''}`}
                    value={it.itemId}
                    onChange={(e) => updateItem(i, 'itemId', e.target.value)}
                  >
                    <option value="">-- Choose --</option>
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.grams}) · {inv.boxes} boxes
                      </option>
                    ))}
                  </select>
                  {errors[`item_${i}`] && <span className="field-error">{errors[`item_${i}`]}</span>}
                </div>

                <div className="field-row">
                  <div className="field-group flex-1">
                    <label className="field-label">Boxes</label>
                    <input className={`field-input ${errors[`qty_${i}`] ? 'error' : ''}`} type="number" min="0" placeholder="0" value={it.boxes} onChange={(e) => updateItem(i, 'boxes', e.target.value)} />
                  </div>
                  <div className="field-group flex-1">
                    <label className="field-label">Pieces (opt.)</label>
                    <input className="field-input" type="number" min="0" placeholder="0" value={it.pieces} onChange={(e) => updateItem(i, 'pieces', e.target.value)} />
                  </div>
                </div>
                <div className="field-group">
  <label className="field-label">Total Price *</label>
  <input
    className={`field-input ${errors[`price_${i}`] ? 'error' : ''}`}
    type="number"
    min="0"
    placeholder="₹0"
    value={it.totalPrice}
    onChange={(e) => updateItem(i, 'totalPrice', e.target.value)}
  />
  {errors[`price_${i}`] && (
    <span className="field-error">{errors[`price_${i}`]}</span>
  )}
</div>

                <div className="field-row">
                  <div className="field-group flex-1">
                    <label className="field-label">Dealer Price *</label>
                    <input className={`field-input ${errors[`price_${i}`] ? 'error' : ''}`} type="number" min="0" placeholder="₹0" value={it.dealerPrice} onChange={(e) => updateItem(i, 'dealerPrice', e.target.value)} />
                    {errors[`price_${i}`] && <span className="field-error">{errors[`price_${i}`]}</span>}
                  </div>
                  <div className="field-group flex-1">
                    <label className="field-label">MRP Price</label>
                    <input className="field-input" type="number" min="0" placeholder="₹0" value={it.mrpPrice} onChange={(e) => updateItem(i, 'mrpPrice', e.target.value)} />
                  </div>
                </div>

                
              </div>
            ))}

            <button className="btn-outline btn-block" onClick={addItemRow}>+ Add Another Item</button>

            {grandTotal > 0 && (
              <div className="grand-total-chip">
                Grand Total: ₹{grandTotal.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Payment ──────────────────────────── */}
        {step === 2 && (
          <div>
            <div className="payment-summary-card">
              <div className="pay-row">
                <span>Grand Total</span>
                <span className="pay-val">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Amount Paid</label>
              <input className="field-input" type="number" min="0" placeholder="₹0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
            </div>

            <div className="field-group">
              <label className="field-label">Date</label>
              <input className="field-input" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
            </div>

            <div className={`balance-chip ${balance > 0 ? 'balance-red' : 'balance-green'}`}>
              {balance > 0 ? `⚠️ Balance Due: ₹${balance.toLocaleString()}` : '✅ Fully Paid'}
            </div>
          </div>
        )}

        <button id="sell-next-btn" className="btn-primary btn-block" style={{ marginTop: 20 }} onClick={handleNext}>
          {step < 2 ? 'Next →' : '👁 Preview & Save'}
        </button>
      </div>

      {/* ── Preview Modal ─────────────────────────────────── */}
      {showPreview && (
        <div className="preview-overlay">
          <div className="preview-modal">
            <h3 className="preview-title">📋 Sell Load Preview</h3>

            <div className="preview-section">
              <p className="preview-sub">Retailer</p>
              <p><strong>{retailerMode === 'existing' ? retailers.find(r => r.id === Number(selectedRetailerId))?.shopName : newRetailer.shopName}</strong></p>
              <p className="preview-detail">{retailerMode === 'existing' ? retailers.find(r => r.id === Number(selectedRetailerId))?.ownerName : newRetailer.ownerName}</p>
            </div>

            <div className="preview-section">
              <p className="preview-sub">Items</p>
              {items.map((it, i) => {
                const inv = getItemById(it.itemId);
                return (
                  <div key={i} className="preview-item-row">
                    <span>{inv?.name || '—'}</span>
                    <span>{it.boxes} boxes</span>
                    <span>₹{Number(it.totalPrice || 0).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            <div className="preview-section">
              <div className="pay-row"><span>Total</span><span><strong>₹{grandTotal.toLocaleString()}</strong></span></div>
              <div className="pay-row"><span>Paid</span><span className="text-green">₹{Number(amountPaid || 0).toLocaleString()}</span></div>
              <div className="pay-row"><span>Balance</span><span className={balance > 0 ? 'text-red' : 'text-green'}>₹{balance.toLocaleString()}</span></div>
            </div>

            <div className="preview-actions">
              <button className="btn-outline" onClick={() => setShowPreview(false)}>✏️ Edit</button>
              <button id="sell-confirm-btn" className="btn-primary" onClick={handleSave}>✅ Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
