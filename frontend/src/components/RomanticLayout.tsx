import React from 'react';
import RomanticNavbar from './RomanticNavbar';

type RomanticLayoutProps = {
  children: React.ReactNode;
  showNavbar?: boolean;
  showNavbarAuthButton?: boolean;
};

const RomanticLayout: React.FC<RomanticLayoutProps> = ({
  children,
  showNavbar = true,
  showNavbarAuthButton = true,
}) => {
  return (
    <div className="page">
      <div className="floating-heart" style={{ top: '15%', left: '5%' }}>♡</div>
      <div className="floating-heart" style={{ bottom: '12%', left: '15%', transform: 'rotate(-5deg)' }}>❤️</div>
      <div className="floating-heart" style={{ top: '30%', right: '3%' }}>🌸</div>

      {showNavbar && <RomanticNavbar showAuthButton={showNavbarAuthButton} />}
      {children}
    </div>
  );
};

export default RomanticLayout;
