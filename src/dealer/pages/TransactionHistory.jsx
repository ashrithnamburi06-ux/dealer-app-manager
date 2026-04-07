import { useState, useEffect } from 'react';
import { subscribeTransactions } from "../../services/firebaseService";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import './Transactions.css';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('company');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    let unsubSnapshot = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubSnapshot = subscribeTransactions((data) => {
          setTransactions(Array.isArray(data) ? data : []);
        });
      } else {
        setTransactions([]);
      }
    });

    return () => {
      unsubAuth();
      unsubSnapshot();
    };
  }, []);

  // ✅ FILTER
  const filteredTransactions = (transactions || []).filter((t) => {
    if (activeTab === 'company') return t.type === 'add';
    if (activeTab === 'retailer') return t.retailerId;
    if (activeTab === 'expenses') return t.type === 'expense';
    return false;
  });

  // ✅ PDF EXPORT
 

const handleExportPDF = () => {
  try {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 20);

    // Table Data
    const tableData = filteredTransactions.map((t) => [
      t.type || "",
      t.name || "",
      t.product || "",
      `₹${t.amount || 0}`,
      t.date || ""
    ]);

    // Table
    autoTable(doc, {
      startY: 30,
      head: [["Type", "Name", "Product", "Amount", "Date"]],
      body: tableData,
      styles: {
        fontSize: 10
      },
      headStyles: {
        fillColor: [41, 128, 185] // blue header
      }
    });

    // 🔥 TOTAL CALCULATION
    const total = filteredTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const finalY = doc.lastAutoTable.finalY || 40;

    doc.setFontSize(12);
    doc.text(`Total Amount: ₹${total}`, 14, finalY + 10);

    // Save
    doc.save("transactions-report.pdf");

  } catch (err) {
    console.error("PDF error:", err);
  }
};

  return (
    <div className="screen transactions-screen">

      {/* Header */}
      <div className="transactions-header">
        <div className="header-row">
          <span className="header-icon">📄</span>
          <h2 className="header-title">Transactions</h2>
        </div>
      </div>

      <div className="transactions-content">

        {/* Tabs */}
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

        {/* Export Button */}
        <button className="export-btn" onClick={handleExportPDF}>
          📥 Export PDF
        </button>

        {/* Transactions */}
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
                    {t.type === 'payment' && "💳 Payment"}
                    {t.type === 'bill' && "🧾 Bill"}
                  </p>

                  {t.product && (
                    <p>Product: <strong>{t.product}</strong></p>
                  )}

                  {t.name && (
                    <p>Retailer: <strong>{t.name}</strong></p>
                  )}

                  {t.amount && (
                    <p>Amount: ₹{t.amount}</p>
                  )}

                  {t.gst && (
                    <p className="txn-gst">GST: {t.gst}</p>
                  )}

                  <p className="txn-date">{t.date}</p>
                </div>
              </div>

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