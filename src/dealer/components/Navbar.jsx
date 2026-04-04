import { NavLink } from 'react-router-dom';
import { useStore } from '../data/mockStore';
import './Navbar.css';

const tabs = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/inventory', icon: '📦', label: 'Inventory' },
  { to: '/add-load', icon: '➕', label: 'Add' },
  { to: '/sell-load', icon: '🛒', label: 'Sell' },
  { to: '/retailers', icon: '🏪', label: 'Suppliers' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function Navbar() {
  const { getDashboardStats } = useStore();
  const { lowStock } = getDashboardStats();

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">
            {tab.icon}
            {tab.label === 'Inventory' && lowStock.length > 0 && (
              <span className="nav-badge">{lowStock.length}</span>
            )}
          </span>
          <span className="nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
