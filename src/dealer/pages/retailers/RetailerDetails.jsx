import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import Card from '../../components/Card';
import './Retailers.css';

export default function RetailerDetails() {
  const { id } = useParams();
  const { retailers, sellLoads, recordPayment, updateRetailer } = useStore();
  const navigate = useNavigate();

  const retailer = retailers.find((r) => r.id === Number(id));
  const [paymentAmt, setPaymentAmt] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  if (!retailer) {
    return <div className="screen"><div className="empty-state"><p>Retailer not found.</p></div></div>;
  }

  const myLoads = sellLoads.filter((s) => s.retailerId === Number(id));

  const handlePayment = () => {
    const amt = Number(paymentAmt);
    if (!amt || amt <= 0) return;
    recordPayment(Number(id), amt);
    setPaymentAmt('');
    setShowPayModal(false);
  };

  const handleEditSave = () => {
    updateRetailer(Number(id), editForm);
    setEditing(false);
  };

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="page-title">Retailer</h2>
        <button className="btn-outline btn-sm" onClick={() => { setEditing(true); setEditForm({ shopName: retailer.shopName, ownerName: retailer.ownerName, phone: retailer.phone }); }}>
          ✏️ Edit
        </button>
      </div>

      <div className="list-container">
        {/* Profile Card */}
        <Card className="retailer-profile-card">
          <div className="profile-avatar">{retailer.shopName[0].toUpperCase()}</div>
          <h3 className="profile-shop">{retailer.shopName}</h3>
          <p className="profile-owner">{retailer.ownerName}</p>
          <div className="profile-actions">
            <a href={`tel:${retailer.phone}`} className="action-chip action-green">📞 Call</a>
            <a href={`https://wa.me/91${retailer.phone}`} className="action-chip action-teal" target="_blank" rel="noreferrer">💬 WhatsApp</a>
          </div>
        </Card>

        {/* Payment Summary */}
        <Card className={`pending-card ${retailer.pendingAmount > 0 ? 'pending-card-red' : 'pending-card-green'}`}>
          <div className="pending-row">
            <div>
              <p className="pending-label">Pending Amount</p>
              <p className="pending-amount">₹{retailer.pendingAmount.toLocaleString()}</p>
            </div>
            {retailer.pendingAmount > 0 && (
              <button id="record-payment-btn" className="btn-primary btn-sm" onClick={() => setShowPayModal(true)}>
                💳 Record Payment
              </button>
            )}
          </div>
        </Card>

        {/* Purchase History */}
        <h3 className="section-title">Purchase History</h3>
        {myLoads.length === 0 && <p className="empty-text">No purchases yet.</p>}
        {myLoads.map((load) => (
          <Card key={load.id} className="load-hist-card">
            <div className="load-hist-row">
              <div>
                <p className="load-hist-date">{load.date}</p>
                <p className="load-hist-items">{load.items.map((i) => i.itemName).join(', ')}</p>
              </div>
              <div className="load-hist-right">
                <p className="load-hist-total">₹{load.total.toLocaleString()}</p>
                {load.balance > 0 && <span className="badge badge-red">₹{load.balance} due</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="preview-overlay">
          <div className="preview-modal">
            <h3 className="preview-title">💳 Record Payment</h3>
            <p style={{ color: '#555', marginBottom: 16, textAlign: 'center' }}>
              Pending: <strong>₹{retailer.pendingAmount.toLocaleString()}</strong>
            </p>
            <div className="field-group">
              <label className="field-label">Amount Received</label>
              <input className="field-input" type="number" min="1" placeholder="₹0" value={paymentAmt} onChange={(e) => setPaymentAmt(e.target.value)} autoFocus />
            </div>
            <div className="preview-actions">
              <button className="btn-outline" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button id="confirm-payment-btn" className="btn-primary" onClick={handlePayment}>✅ Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="preview-overlay">
          <div className="preview-modal">
            <h3 className="preview-title">✏️ Edit Retailer</h3>
            <div className="field-group">
              <label className="field-label">Shop Name</label>
              <input className="field-input" value={editForm.shopName} onChange={(e) => setEditForm((p) => ({ ...p, shopName: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Owner Name</label>
              <input className="field-input" value={editForm.ownerName} onChange={(e) => setEditForm((p) => ({ ...p, ownerName: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Phone</label>
              <input className="field-input" type="tel" maxLength={10} value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="preview-actions">
              <button className="btn-outline" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleEditSave}>💾 Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="section-spacer" />
    </div>
  );
}
