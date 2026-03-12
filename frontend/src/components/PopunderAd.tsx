import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PopunderAd: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const scriptId = 'effectivegate-popunder';
    const existingScript = document.getElementById(scriptId);

    // Restricted routes where we absolutely do NOT want popunders
    const restrictedRoutes = ['/', '/play'];
    const isRestricted = restrictedRoutes.includes(location.pathname);

    if (isRestricted) {
      // If we navigate to a restricted route and the script exists, remove it
      if (existingScript) {
        existingScript.remove();
      }
      return;
    }

    // If we are on an allowed page, only inject if it doesn't already exist
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://pl28899272.effectivegatecpm.com/a9/5b/b1/a95bb1d7c9a44d79996f52408814507c.js';
    script.async = true;

    document.head.appendChild(script);

    // Note: We don't return a cleanup function here because we want the script
    // to persist across ALLOWED route changes (e.g. going from /profile to /about).
    // The explicit removal happens above when hitting a restricted route.
  }, [location.pathname]);

  return null;
};

export default PopunderAd;
