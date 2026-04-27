// Portrait warning for mobile players. Shown when viewport h > w on a
// touch/mobile device. Dismissible per-session — the rule is that the
// game runs fine in portrait, but landscape gives 1.5–2× the lane width
// and most players prefer it.

import { useEffect, useState } from 'react';

export default function OrientationGuide({ deviceClass }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (deviceClass === 'desktop' || dismissed) { setVisible(false); return; }
    const check = () => {
      if (typeof window === 'undefined') return;
      setVisible(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, [deviceClass, dismissed]);

  if (!visible) return null;
  return (
    <div className="es-orient" role="dialog" aria-label="Rotate your device for the best experience">
      <div className="es-orient-card">
        <div className="es-orient-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="3" width="14" height="18" rx="2"/>
            <path d="M9 21h6"/>
            <path d="M15.5 13.5 19 10l-3.5-3.5"/>
            <path d="M19 10H6"/>
          </svg>
        </div>
        <div className="es-orient-text">
          <strong>Rotate to landscape</strong>
          <span>Era Siege uses a wide single-lane battlefield. Landscape gives you twice the strategy.</span>
        </div>
        <button type="button" className="es-orient-dismiss" onClick={() => setDismissed(true)}>
          Play anyway
        </button>
      </div>
    </div>
  );
}
