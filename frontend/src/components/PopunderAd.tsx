import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PopunderAd: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // We do not want popunders on the landing page (which is strictly '/')
    if (location.pathname === '/') return;

    // We do not want to inject multiple times if navigating between non-landing pages
    const scriptId = 'effectivegate-popunder';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://pl28899272.effectivegatecpm.com/a9/5b/b1/a95bb1d7c9a44d79996f52408814507c.js';
    script.async = true;

    document.head.appendChild(script);

    // Note: We don't remove the script on unmount/route change because 
    // it's meant to be "one per page view" across the app minus the landing page.
  }, [location.pathname]);

  return null;
};

export default PopunderAd;
