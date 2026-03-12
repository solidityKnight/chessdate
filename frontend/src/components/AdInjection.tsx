import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AdInjection: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Ad injection logic removed to prevent errors and improve performance
    return () => {};
  }, [location.pathname]);

  return null;
};

export default AdInjection;
