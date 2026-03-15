import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

type RomanticNavbarProps = {
  showAuthButton?: boolean;
};

const RomanticNavbar: React.FC<RomanticNavbarProps> = ({ showAuthButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useGameStore((s) => s.token);
  const navItems = [
    { label: 'HOME', path: '/' },
    { label: 'PLAY', path: '/play' },
    { label: 'LEADERBOARD', path: '/leaderboard' },
    { label: 'FIND PLAYERS', path: '/find' },
    { label: 'CONTACT', path: '/contact' },
  ];

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="navbar">
      <div className="logo">
        <div className="logo-icon"></div>
        ChessDate.in
      </div>
      <nav>
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`nav-link${isActive(item.path) ? ' is-active' : ''}`}
            aria-current={isActive(item.path) ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.path);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      {showAuthButton && (
        token ? (
          <button
            className={`domain-btn${isActive('/profile') ? ' is-active' : ''}`}
            type="button"
            onClick={() => navigate('/profile')}
          >
            Profile
          </button>
        ) : (
          <button className="domain-btn" type="button" onClick={() => navigate('/login')}>
            Login
          </button>
        )
      )}
    </header>
  );
};

export default RomanticNavbar;
