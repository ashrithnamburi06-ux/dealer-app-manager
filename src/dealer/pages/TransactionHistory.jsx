import { useState } from 'react';
import './Transactions.css';

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="screen transactions-screen">

      {/* 🔵 Header (fixed like dashboard) */}
      <div className="transactions-header">
        <div className="header-row">
          <span className="header-icon">📄</span>
          <h2 className="header-title">Transactions</h2>
        </div>
      </div>

      {/* 📦 Content Area */}
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

        {/* 📭 Empty State */}
        <div className="empty-state">
          <p>No transactions available</p>
        </div>

      </div>
    </div>
  );
}