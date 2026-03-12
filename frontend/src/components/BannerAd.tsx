import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const BannerAd: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    // Ad loading logic removed to prevent errors and improve performance
    return () => {};
  }, [location.pathname]);

  // If on landing page, render nothing.
  if (location.pathname === '/') return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '16px 0', zIndex: 10 }}>
      {/* We set absolute height/width constraints directly on the wrapper so layout doesn't jump */}
      <div 
        ref={containerRef} 
        style={{ width: 468, minHeight: 60, background: 'rgba(255, 240, 245, 0.4)', borderRadius: 8, overflow: 'hidden' }}
      >
        {/* The ad script will inject the iframe here */}
      </div>
    </div>
  );
};

export default BannerAd;
