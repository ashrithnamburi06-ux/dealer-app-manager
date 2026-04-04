import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import Card from '../../components/Card';
import './Expenses.css';

export default function ExpenseList() {
  const { expenses } = useStore();
  const navigate = useNavigate();

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((s, e) => s + Number(e.amount), 0);

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="screen">
      <div className="top-bar">
        <h2 className="page-title">Expenses</h2>
        <button id="add-expense-nav-btn" className="btn-primary btn-sm" onClick={() => navigate('/add-expense')}>
          + Add
        </button>
      </div>

      <div className="expense-summary-row">
        <div className="expense-sum-chip green">
          <p className="exp-chip-label">This Month</p>
          <p className="exp-chip-val">₹{monthTotal.toLocaleString()}</p>
        </div>
        <div className="expense-sum-chip orange">
          <p className="exp-chip-label">All Time</p>
          <p className="exp-chip-val">₹{total.toLocaleString()}</p>
        </div>
      </div>

      <div className="list-container">
        {sorted.length === 0 && (
          <div className="empty-state">
            <p>💸 No expenses recorded yet.</p>
            <button className="btn-primary" onClick={() => navigate('/add-expense')}>Add First Expense</button>
          </div>
        )}

        {sorted.map((exp) => (
          <Card key={exp.id} className="expense-card">
            <div className="expense-row">
              <div className="expense-icon-wrap">💸</div>
              <div className="expense-info">
                <p className="expense-note">{exp.note || 'Expense'}</p>
                <p className="expense-date">{exp.date}</p>
              </div>
              <p className="expense-amount">₹{Number(exp.amount).toLocaleString()}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="section-spacer" />
    </div>
  );
}
