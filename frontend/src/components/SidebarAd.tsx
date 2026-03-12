import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SidebarAd: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    // Ad loading logic removed to prevent errors and improve performance
    return () => {};
  }, [location.pathname]);

  const restrictedRoutes = ['/', '/login', '/play'];
  if (restrictedRoutes.includes(location.pathname)) return null;

  // We place the sidebar ad fixed on the right side of the screen 
  // so it doesn't break the heavily flex-centered layout on Guide/Profile pages.
  return (
    <div style={{ position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 40 }}>
      {/* 160x600 format container */}
      <div 
        ref={containerRef} 
        style={{ width: 160, minHeight: 600, background: 'rgba(255, 240, 245, 0.4)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 12px rgba(200, 50, 80, 0.1)' }}
      ></div>
    </div>
  );
};

export default SidebarAd;
