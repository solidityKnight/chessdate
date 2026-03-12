import React, { useEffect, useRef } from 'react';

/**
 * ChessDate ad slot using the provided EffectiveGate native banner tag.
 *
 * We:
 * - inject the network script dynamically on mount inside the container
 * - render the expected container div
 * - wrap it in a soft, on‑brand card so it visually matches the UI
 * - ensure it gracefully re-runs during React route changes
 */
const AdBanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bannerElem = containerRef.current;
    if (!bannerElem) return;
    
    // Empty the container inside to remove any stale DOM from previous loads
    bannerElem.innerHTML = '';
    
    const script = document.createElement('script');
    script.async = true;
    // @ts-ignore – custom data attribute from provider
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl28898793.effectivegatecpm.com/b4fcdd67008c5670ef4321cf8b4a150e/invoke.js';
    
    bannerElem.appendChild(script);

    return () => {
      if (bannerElem) {
        bannerElem.innerHTML = '';
      }
    };
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
      }}
    >
      <div
        id="container-b4fcdd67008c5670ef4321cf8b4a150e"
        ref={containerRef}
        style={{
          width: '100%',
          minHeight: 60,
        }}
      />
    </div>
  );
};

export default AdBanner;

