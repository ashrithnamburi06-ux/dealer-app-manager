import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import Card from '../../components/Card';
import './Retailers.css';

export default function RetailerList() {
  const { retailers } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = retailers.filter(
    (r) =>
      r.shopName.toLowerCase().includes(search.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = retailers.reduce((s, r) => s + (Number(r.pendingAmount) || 0), 0);

  return (
    <div className="screen">
      <div className="top-bar">
        <h2 className="page-title">Retailers</h2>
        <button id="add-retailer-btn" className="btn-primary btn-sm" onClick={() => navigate('/sell-load')}>
          + Sell
        </button>
      </div>

      {totalPending > 0 && (
        <div className="retailers-summary">
          <span className="badge badge-red">⚠️ Total Pending: ₹{totalPending.toLocaleString()}</span>
        </div>
      )}

      <div className="list-container">
        <div className="search-wrap">
          <input
            id="retailer-search"
            className="field-input"
            placeholder="🔍 Search retailer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <p>🏪 No retailers found.</p>
          </div>
        )}

        {filtered.map((r) => (
          <Card
            key={r.id}
            className="retailer-card"
            onClick={() => navigate(`/retailers/${r.id}`)}
          >
            <div className="r-row">
              <div className="r-avatar">{r.shopName[0].toUpperCase()}</div>
              <div className="r-info">
                <p className="r-shop">{r.shopName}</p>
                <p className="r-owner">{r.ownerName} · {r.phone}</p>
                {r.lastPurchase && (
                  <p className="r-date">Last: {r.lastPurchase}</p>
                )}
              </div>
              <div className="r-right">
                {r.pendingAmount > 0 ? (
                  <span className="badge badge-red">₹{r.pendingAmount.toLocaleString()}</span>
                ) : (
                  <span className="badge badge-green">Clear</span>
                )}
                <span className="r-arrow">›</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="section-spacer" />
    </div>
  );
}
