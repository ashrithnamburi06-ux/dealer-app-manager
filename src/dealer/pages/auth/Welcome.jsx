import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/mockStore';
import './Welcome.css';

export default function Welcome() {
  const { user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/dashboard'), 2200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome-screen">
      <div className="welcome-animation">
        <div className="welcome-icon">🎉</div>
        <h1 className="welcome-heading">Welcome Back!</h1>
        <p className="welcome-name">{user?.name}</p>
        <p className="welcome-agency">{user?.agency}</p>
        <div className="welcome-loader">
          <div className="loader-bar" />
        </div>
        <p className="welcome-sub">Loading your dashboard…</p>
      </div>
    </div>
  );
}
