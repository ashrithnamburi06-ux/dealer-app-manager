import { useState } from 'react';
import { useStore } from "../data/mockStore";
import './Transactions.css';


export default function Transactions() {
  const [activeTab, setActiveTab] = useState('company');

  // ✅ GET DATA FROM STORE
  const { transactions } = useStore();

  // ✅ FILTER BASED ON TAB
  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 'company') return t.type === 'add';
    if (activeTab === 'retailer') return t.retailerId;
    if (activeTab === 'expenses') return t.type === 'expense';
    return false;
  });

  return (
    <div className="screen transactions-screen">

      {/* 🔵 Header */}
      <div className="transactions-header">
        <div className="header-row">
          <span className="header-icon">📄</span>
          <h2 className="header-title">Transactions</h2>
        </div>
      </div>

      <div className="transactions-content">

        {/* 🧭 Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            Company
          </button>

          <button
            className={`tab ${activeTab === 'retailer' ? 'active' : ''}`}
            onClick={() => setActiveTab('retailer')}
          >
            Retailer
          </button>

          <button
            className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            Expenses
          </button>
        </div>

        {/* 📥 Export Button */}
        <button className="export-btn">
          📥 Export PDF
        </button>

        {/* ✅ TRANSACTIONS LIST */}
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions available</p>
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div key={t.id} className="txn-card">

              <div className="txn-row">
                <div>
                  <p className="txn-type">
                    {t.type === 'add' && "📦 Stock Added"}
                    {t.type === 'sell' && "🛒 Sold Load"}
                    {t.type === 'expense' && "💸 Expense"}
                  </p>
                  {/* ✅ PRODUCT NAME */}
{t.product && (
  <p>Product: <strong>{t.product}</strong></p>
)}

{t.name && (
  <p>Retailer: <strong>{t.name}</strong></p>
)}

{t.amount && (
  <p>Amount: ₹{t.amount}</p>
)}


                  {/* ✅ GST */}
                  {t.gst && (
                    <p className="txn-gst">GST: {t.gst}</p>
                  )}

                  <p className="txn-date">{t.date}</p>
                </div>
              </div>

              {/* ✅ IMAGE */}
              {t.image && (
                <img src={t.image} alt="bill" className="txn-image" />
              )}

            </div>
          ))
        )}

      </div>
    </div>
  );
}
export const subscribeTransactions = (callback) => {
  try {
    const ref = getUserCollection("transactions");

    return onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      callback(data);
    });

  } catch (error) {
    console.error("Realtime transaction error:", error);
  }
};