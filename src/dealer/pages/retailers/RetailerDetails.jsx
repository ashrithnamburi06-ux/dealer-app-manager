import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import Card from '../../components/Card';
import './Retailers.css';

export default function RetailerDetails() {
  const { id } = useParams();
  const { retailers, sellLoads, recordPayment, updateRetailer, transactions, addBill } = useStore();
  const navigate = useNavigate();

  const retailer = retailers.find((r) => r.id === id);

  const [paymentAmt, setPaymentAmt] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [billImage, setBillImage] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  if (!retailer) {
    return <div className="screen"><div className="empty-state"><p>Retailer not found.</p></div></div>;
  }

  const myLoads = sellLoads.filter((s) => s.retailerId === id);

  // ✅ FIXED FUNCTION
  const handlePayment = async () => {
    const amt = Number(paymentAmt);

    if (!paymentAmt || isNaN(amt) || amt <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      await recordPayment(id, amt, paymentDate);

      if (billImage !== null && billImage !== undefined) {
        await addBill(id, amt, paymentDate, billImage);
      }

      setPaymentAmt('');
      setBillImage(null);
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setShowPayModal(false);

    } catch (err) {
      console.error("Payment Error:", err);
      alert("Error while saving payment");
    }
  };

  const handleEditSave = async () => {
    try {
      await updateRetailer(id, editForm);
      setEditing(false);
    } catch (err) {
      console.error("Edit retailer error:", err);
    }
  };

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="page-title">Retailer</h2>
        <button className="btn-outline btn-sm" onClick={() => {
          setEditing(true);
          setEditForm({
            shopName: retailer.shopName,
            ownerName: retailer.ownerName,
            phone: retailer.phone
          });
        }}>
          ✏️ Edit
        </button>
      </div>

      <div className="list-container">

        <Card className="retailer-profile-card">
          <div className="profile-avatar">{retailer.shopName[0].toUpperCase()}</div>
          <h3 className="profile-shop">{retailer.shopName}</h3>
          <p className="profile-owner">{retailer.ownerName}</p>
        </Card>

        <Card className={`pending-card ${retailer.pendingAmount > 0 ? 'pending-card-red' : 'pending-card-green'}`}>
          <div className="pending-row">
            <div>
              <p className="pending-label">Pending Amount</p>
              <p className="pending-amount">₹{retailer.pendingAmount.toLocaleString()}</p>
            </div>
            {retailer.pendingAmount > 0 && (
              <button className="btn-primary btn-sm" onClick={() => setShowPayModal(true)}>
                💳 Record Payment
              </button>
            )}
          </div>
        </Card>

        <h3 className="section-title">Purchase History</h3>
        {myLoads.map((load) => (
          <Card key={load.id} className="load-hist-card">
            <div className="load-hist-row">
              <div>
                <p className="load-hist-date">{load.date}</p>
                <p className="load-hist-items">{load.items.map((i) => i.itemName).join(', ')}</p>
              </div>
              <div className="load-hist-right">
                <p className="load-hist-total">₹{load.total}</p>
              </div>
            </div>
          </Card>
        ))}

      </div>

      <h3 className="section-title">Transaction History</h3>

      {transactions.filter(t => String(t.retailerId) === String(retailer.id)).length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        transactions
          .filter(t => String(t.retailerId) === String(retailer.id))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((t) => (
            <Card key={t.id} className="load-hist-card">

              <div className="load-hist-row">
                <div>
                  <p className="load-hist-date">{t.date}</p>
                  <p className="load-hist-items">
                    {t.type === "payment" ? "💳 Payment" : "🧾 Bill"}
                  </p>
                </div>

                <div className="load-hist-right">
                  <p className="load-hist-total">
                    {t.type === "payment" ? "+" : "-"}₹{t.amount}
                  </p>
                </div>
              </div>

              {t.image && (
                <img
                  src={t.image}
                  alt="bill"
                  className="txn-image"
                  onClick={() => setPreviewImage(t.image)}
                />
              )}

            </Card>
          ))
      )}

      {previewImage && (
        <div className="preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="preview-modal">
            <img src={previewImage} alt="full" style={{ width: "100%" }} />
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="preview-overlay">
          <div className="preview-modal">

            <h3 className="preview-title">💳 Record Payment</h3>

            <div className="field-group">
              <label>Amount</label>
              <input type="number" value={paymentAmt} onChange={(e) => setPaymentAmt(e.target.value)} />
            </div>

            <div className="field-group">
              <label>Date</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>

            <div className="field-group">
              <label>Upload Bill</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => setBillImage(reader.result);
                  reader.readAsDataURL(file);
                }}
              />
            </div>

            <button className="btn-primary" onClick={handlePayment}>
              Confirm
            </button>

          </div>
        </div>
      )}

    </div>
  );
}