import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';

type RomanticNavbarProps = {
  showAuthButton?: boolean;
};

const RomanticNavbar: React.FC<RomanticNavbarProps> = ({ showAuthButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useGameStore((s) => s.token);
  const unreadFriendMessages = useGameStore((s) => s.unreadFriendMessages);
  const setUnreadFriendMessages = useGameStore((s) => s.setUnreadFriendMessages);
  const navItems = [
    { label: 'HOME', path: '/' },
    { label: 'PLAY', path: '/play' },
    { label: 'LEADERBOARD', path: '/leaderboard' },
    { label: 'FIND PLAYERS', path: '/find' },
    { label: 'MESSAGES', path: '/friends' },
    { label: 'CONTACT', path: '/contact' },
  ];

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setUnreadFriendMessages(0);
      return () => {
        isActive = false;
      };
    }

    api
      .get('/messages/unread-count')
      .then((response) => {
        if (isActive) {
          setUnreadFriendMessages(response.data.unreadCount || 0);
        }
      })
      .catch((error) => {
        console.error('Failed to load unread message count', error);
      });

    return () => {
      isActive = false;
    };
  }, [setUnreadFriendMessages, token]);

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
            <span className="nav-link-content">
              <span>{item.label}</span>
              {item.path === '/friends' && token && unreadFriendMessages > 0 && (
                <span className="nav-badge">
                  {unreadFriendMessages > 99 ? '99+' : unreadFriendMessages}
                </span>
              )}
            </span>
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
