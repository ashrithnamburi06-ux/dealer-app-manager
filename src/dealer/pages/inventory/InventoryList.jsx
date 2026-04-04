import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import Card from '../../components/Card';
import './Inventory.css';

export default function InventoryList() {
  const { inventory, deleteInventoryItem } = useStore();
  const navigate = useNavigate();

  return (
    <div className="screen">
      <div className="top-bar">
        <h2 className="page-title">Inventory</h2>
        <button
          id="inv-add-btn"
          className="btn-primary btn-sm"
          onClick={() => navigate('/inventory/add')}
        >
          + Add Item
        </button>
      </div>

      <div className="inv-summary">
        <span className="inv-total">Total: {inventory.length} items</span>
        <span className="inv-low-badge">
          {inventory.filter((i) => i.boxes <= i.minStock).length} low stock
        </span>
      </div>

      <div className="list-container">
        {inventory.length === 0 && (
          <div className="empty-state">
            <p>📦 No inventory items yet.</p>
            <button className="btn-primary" onClick={() => navigate('/inventory/add')}>
              Add First Item
            </button>
          </div>
        )}

        {inventory.map((item) => {
          const isLow = item.boxes <= item.minStock;
          return (
            <Card key={item.id} className={`inv-card ${isLow ? 'inv-low' : 'inv-ok'}`}>
              <div className="inv-card-top">
                <div>
                  <p className="inv-name">{item.name}</p>
                  <p className="inv-sub">{item.grams} · ₹{item.price}</p>
                </div>
                <span className={`badge ${isLow ? 'badge-red' : 'badge-green'}`}>
                  {isLow ? '🔴 Low' : '🟢 OK'}
                </span>
              </div>
              <div className="inv-stats">
                <div className="inv-stat">
                  <span className="inv-stat-val">{item.boxes}</span>
                  <span className="inv-stat-lbl">Boxes</span>
                </div>
                <div className="inv-stat">
                  <span className="inv-stat-val">{item.pieces}</span>
                  <span className="inv-stat-lbl">Pieces</span>
                </div>
                <div className="inv-stat">
                  <span className="inv-stat-val">{item.minStock}</span>
                  <span className="inv-stat-lbl">Min Stock</span>
                </div>
              </div>
              <div className="inv-actions">
                <button
                  className="btn-outline btn-sm"
                  onClick={() => navigate(`/inventory/edit/${item.id}`)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn-danger btn-sm"
                  onClick={() => {
                    if (window.confirm(`Delete "${item.name}"?`)) deleteInventoryItem(item.id);
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="section-spacer" />
    </div>
  );
}
