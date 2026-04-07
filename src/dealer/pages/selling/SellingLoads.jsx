import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import Card from '../../components/Card';
import './SellingLoads.css';

export default function SellingLoads() {
  const { sellLoads, retailers } = useStore();
  const navigate = useNavigate();

  const sorted = [...sellLoads].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalBalance = sellLoads.reduce((s, l) => s + (Number(l.balance) || 0), 0);

  return (
    <div className="screen">
      <div className="top-bar">
        <h2 className="page-title">Sell History</h2>
        <button id="new-sell-btn" className="btn-primary btn-sm" onClick={() => navigate('/sell-load')}>
          + Sell
        </button>
      </div>

      {totalBalance > 0 && (
        <div className="sells-summary">
          <span className="badge badge-red">⚠️ Total Outstanding: ₹{totalBalance.toLocaleString()}</span>
        </div>
      )}

      <div className="list-container">
        {sorted.length === 0 && (
          <div className="empty-state">
            <p>🛒 No sell loads recorded yet.</p>
            <button className="btn-primary" onClick={() => navigate('/sell-load')}>Make First Sale</button>
          </div>
        )}

        {sorted.map((load) => (
          <Card key={load.id} className="sell-card" onClick={() => navigate(`/retailers/${load.retailerId}`)}>
            <div className="sell-top">
              <div>
                <p className="sell-shop">{load.shopName}</p>
                <p className="sell-owner">{load.ownerName}</p>
              </div>
              <div className="sell-right">
                <p className="sell-total">₹{load.total.toLocaleString()}</p>
                <p className="sell-date">{load.date}</p>
              </div>
            </div>

            <div className="sell-items">
              {load.items.map((it, i) => (
                <span key={i} className="sell-item-chip">{it.itemName} ×{it.boxes}</span>
              ))}
            </div>

            <div className="sell-footer">
              <span className="sell-paid">Paid: ₹{load.amountPaid.toLocaleString()}</span>
              {load.balance > 0 ? (
                <span className="badge badge-red">Balance: ₹{load.balance.toLocaleString()}</span>
              ) : (
                <span className="badge badge-green">✓ Settled</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="section-spacer" />
    </div>
  );
}
