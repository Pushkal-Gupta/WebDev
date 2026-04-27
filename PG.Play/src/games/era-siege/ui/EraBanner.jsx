// EraBanner — full-width ribbon that announces an era-up. Pops in,
// holds for ~700ms, slides out. Honors prefers-reduced-motion via the
// CSS animation-duration override.

import { useEffect, useState } from 'react';
import { getEraByIndex } from '../content/eras.js';

export default function EraBanner({ eraIndex, version }) {
  // `version` increments each time the parent wants to re-show the banner
  // (e.g. on every successful evolve). Without it, navigating back to
  // the same era wouldn't trigger a re-mount.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (version == null) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(t);
  }, [version]);

  if (!visible) return null;
  const era = getEraByIndex(eraIndex);
  if (!era) return null;
  return (
    <div className="es-banner" role="status" aria-live="polite">
      <div className="es-banner-inner">
        <span className="es-banner-eyebrow">Era {eraIndex + 1} of 5</span>
        <span className="es-banner-name">{era.name}</span>
        <span className="es-banner-blurb">{era.blurb}</span>
      </div>
    </div>
  );
}
