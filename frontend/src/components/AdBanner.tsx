import React, { useEffect } from 'react';

/**
 * ChessDate ad slot using the provided EffectiveGate native banner tag.
 *
 * We:
 * - inject the network script once (per browser session)
 * - render the expected container div
 * - wrap it in a soft, on‑brand card so it visually matches the UI
 */
const AdBanner: React.FC = () => {
  useEffect(() => {
    const scriptId = 'egcpm-script-b4fcdd67008c5670ef4321cf8b4a150e';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    // @ts-ignore – custom data attribute from provider
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl28898793.effectivegatecpm.com/b4fcdd67008c5670ef4321cf8b4a150e/invoke.js';
    document.body.appendChild(script);
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
        style={{
          width: '100%',
          minHeight: 60,
        }}
      />
    </div>
  );
};

export default AdBanner;

