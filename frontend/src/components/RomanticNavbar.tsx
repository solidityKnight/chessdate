import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

type RomanticNavbarProps = {
  showAuthButton?: boolean;
};

const RomanticNavbar: React.FC<RomanticNavbarProps> = ({ showAuthButton = true }) => {
  const navigate = useNavigate();
  const token = useGameStore((s) => s.token);

  return (
    <header className="navbar">
      <div className="logo">
        <div className="logo-icon"></div>
        ChessDate.in
      </div>
      <nav>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>HOME</a>
        <a href="/play" onClick={(e) => { e.preventDefault(); navigate('/play'); }}>PLAY</a>
        <a href="/guides" onClick={(e) => { e.preventDefault(); navigate('/guides'); }}>GUIDES</a>
        <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>ABOUT</a>
      </nav>
      {showAuthButton && (
        token ? (
          <button className="domain-btn" onClick={() => navigate('/profile')}>Profile</button>
        ) : (
          <button className="domain-btn" onClick={() => navigate('/login')}>Login</button>
        )
      )}
    </header>
  );
};

export default RomanticNavbar;
