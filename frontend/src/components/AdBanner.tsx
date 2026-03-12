import React, { useEffect, useRef } from 'react';

/**
 * ChessDate ad slot
 */
const AdBanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bannerElem = containerRef.current;
    if (!bannerElem) return;

    // Use a small timeout to ensure the React mount cycle has fully completed
    const t = setTimeout(() => {
      // Clear out previous script tags or ad debris
      bannerElem.innerHTML = '';
      
      // Inject exactly the HTML string requested by the user, forcing the browser to parse it natively
      // Since innerHTML doesn't execute <script> tags, we have to use document contexts.
      
      const adContainer = document.createElement('div');
      adContainer.id = 'container-b4fcdd67008c5670ef4321cf8b4a150e';
      bannerElem.appendChild(adContainer);

      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl28898793.effectivegatecpm.com/b4fcdd67008c5670ef4321cf8b4a150e/invoke.js';
      bannerElem.appendChild(script);
    }, 100);

    return () => {
      clearTimeout(t);
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
        minHeight: 60,
      }}
      ref={containerRef}
    />
  );
};

export default AdBanner;

