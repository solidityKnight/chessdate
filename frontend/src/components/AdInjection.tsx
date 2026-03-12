import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AdInjection: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if the current path is landing page ('/') or login page ('/login')
    const excludePaths = ['/', '/login'];
    
    // We also want to match if there is a trailing slash (though react-router usually handles it)
    if (excludePaths.includes(location.pathname)) {
      return;
    }

    const scriptId = 'effectivegate-ad-script';
    
    // Check if script already exists
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://pl28901980.effectivegatecpm.com/b9/f5/68/b9f56821cfcc3e4f713b24fa76a28ecf.js';
      script.async = true;
      
      // Insert right before the closing body tag
      document.body.appendChild(script);
    }
    
    return () => {
      // In this case, we might not want to clean it up when navigating between 
      // allowed pages, but we DO want to remove it when going TO an excluded page.
      // So let's handle cleanup in a different way or just remove it here.
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [location.pathname]);

  return null;
};

export default AdInjection;
