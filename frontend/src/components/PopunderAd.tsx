import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PopunderAd: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Popunder loading logic removed to prevent errors and improve performance
    return () => {};
  }, [location.pathname]);

  return null;
};

export default PopunderAd;
