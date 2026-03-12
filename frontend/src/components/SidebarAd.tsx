import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SidebarAd: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    // The user requested NO sidebar ad on Landing, Login, or Play pages
    const restrictedRoutes = ['/', '/login', '/play'];
    if (restrictedRoutes.includes(location.pathname)) return;

    const bannerElem = containerRef.current;
    if (!bannerElem) return;

    // Small delay to ensure the React DOM represents the final layout before execution
    const t = setTimeout(() => {
      bannerElem.innerHTML = '';

      // The ad network config for the tall skyscraper ad
      (window as any).atOptions = {
        'key' : '69a4ff78d56e2c0548171ca96c87c0fe',
        'format' : 'iframe',
        'height' : 600,
        'width' : 160,
        'params' : {}
      };

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.highperformanceformat.com/69a4ff78d56e2c0548171ca96c87c0fe/invoke.js';
      
      bannerElem.appendChild(script);
    }, 150);

    return () => {
      clearTimeout(t);
      if (bannerElem) {
        bannerElem.innerHTML = '';
      }
    };
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
