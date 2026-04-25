// Boot screen — one-shot splash. Runs only on first ever launch.

import { useEffect, useState } from 'react';

export default function BootScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 450);
    const t2 = setTimeout(() => setPhase(2), 1100);
    const t3 = setTimeout(() => onDone?.(), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className={`gb-boot gb-boot-phase-${phase}`}>
      <div className="gb-boot-stadium" aria-hidden="true">
        <div className="gb-boot-light gb-boot-light-1"/>
        <div className="gb-boot-light gb-boot-light-2"/>
        <div className="gb-boot-light gb-boot-light-3"/>
        <div className="gb-boot-pitch"/>
      </div>
      <div className="gb-boot-lockup">
        <div className="gb-boot-mark">
          <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
            <defs>
              <linearGradient id="gbootG" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#00e8d0"/><stop offset="1" stopColor="#ff8855"/>
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="34" fill="none" stroke="url(#gbootG)" strokeWidth="3"/>
            <path d="M22 50 L40 28 L58 50 Z" fill="#00e8d0" opacity="0.9"/>
            <circle cx="40" cy="46" r="6" fill="#ffe6a8"/>
          </svg>
        </div>
        <div className="gb-boot-wordmark">GOALBOUND</div>
        <div className="gb-boot-tagline">One pitch. One minute. All yours.</div>
      </div>
      <div className="gb-boot-progress"><span/></div>
    </div>
  );
}
