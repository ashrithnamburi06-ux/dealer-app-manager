import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { subscribeOrdersAnalytics } from './services/analyticsService';

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    paidOrdersCount: 0,
    pendingOrdersCount: 0,
    orders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeOrdersAnalytics((data) => {
      setAnalytics(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = [
    {
      label: 'Total Revenue',
      value: `₹${analytics.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: 'green',
    },
    {
      label: 'Total Orders',
      value: analytics.totalOrders,
      icon: '📦',
      color: 'blue',
    },
    {
      label: 'Paid Orders',
      value: analytics.paidOrdersCount,
      icon: '✅',
      color: 'green',
    },
    {
      label: 'Pending Orders',
      value: analytics.pendingOrdersCount,
      icon: '⏳',
      color: analytics.pendingOrdersCount > 0 ? 'orange' : 'green',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="screen" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px' }}>Analytics Dashboard</h2>
        <p style={{ margin: 0, color: '#666' }}>Track your payment performance</p>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        {stats.map((stat, i) => (
          <Card key={i} className={`stat-card stat-${stat.color}`}>
            <span className="stat-icon">{stat.icon}</span>
            <p className="stat-value">{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* RECENT ORDERS */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px' }}>Recent Orders</h3>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {analytics.orders.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No orders yet
            </div>
          ) : (
            <div>
              {analytics.orders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>Order: {order.id?.slice(0, 8)}...</p>
                    <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#666' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#1b7835' }}>
                      ₹{order.amount?.toLocaleString()}
                    </p>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: order.status === 'paid' ? '#d1fae5' : '#fef3c7',
                        color: order.status === 'paid' ? '#065f46' : '#92400e',
                      }}
                    >
                      {order.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          padding: '12px 24px',
          cursor: 'pointer',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#666',
          color: 'white',
          fontSize: '16px',
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
