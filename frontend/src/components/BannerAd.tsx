import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const BannerAd: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    // Exclude the BannerAd from the landing page as requested
    if (location.pathname === '/') return;

    const bannerElem = containerRef.current;
    if (!bannerElem) return;

    // A small timeout ensures React finishes its render cycle before we manipulate the DOM
    const t = setTimeout(() => {
      // Clear previous ad debris
      bannerElem.innerHTML = '';

      // The ad network requires `atOptions` to be set on the global window object.
      // We safely attach it for the 468x60 banner.
      (window as any).atOptions = {
        'key' : '9eb1615aebc7ae1feb66fcdc6363aae9',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };

      // Create and inject the network script specifically for this format
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.highperformanceformat.com/9eb1615aebc7ae1feb66fcdc6363aae9/invoke.js';
      
      bannerElem.appendChild(script);
    }, 100);

    return () => {
      clearTimeout(t);
      if (bannerElem) {
        bannerElem.innerHTML = '';
      }
    };
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
