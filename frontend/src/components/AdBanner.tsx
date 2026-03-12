import React, { useEffect, useRef } from 'react';

/**
 * ChessDate ad slot
 */
const AdBanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ad loading logic removed to prevent errors and improve performance
    return () => {};
  }, []);

  return (
    <div
      className="card"
      style={{
        marginTop: 16,
        padding: 0,
        borderRadius: 22,
        background: 'rgba(255, 240, 245, 0.92)',
        border: '1px solid #ffdae2',
        overflow: 'hidden',
        minHeight: 60,
      }}
      ref={containerRef}
    />
  );
};

export default AdBanner;

