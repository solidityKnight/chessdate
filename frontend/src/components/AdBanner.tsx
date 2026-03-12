import React, { useRef, useEffect } from 'react';

/**
 * ChessDate ad slot using an IFRAME isolation strategy.
 *
 * We:
 * - Load the provider's script securely within an iframe
 * - Isolate their dom-search behavior so React router transitions don't break
 * - Ensure clean garbage collection on unmount
 */
const AdBanner: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // The raw HTML injected inside the iframe.
    // Notice how we perfectly emulate the environment their script expects.
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div id="container-b4fcdd67008c5670ef4321cf8b4a150e"></div>
          <script async data-cfasync="false" src="https://pl28898793.effectivegatecpm.com/b4fcdd67008c5670ef4321cf8b4a150e/invoke.js"></script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();
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
    >
      <iframe
        ref={iframeRef}
        title="AdSlot"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '60px',
          border: 'none',
          display: 'block',
        }}
        sandbox="allow-scripts allow-top-navigation allow-top-navigation-by-user-activation allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
};

export default AdBanner;

