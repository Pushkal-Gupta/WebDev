import { useEffect, useState } from 'react';

// Returns true only when 3D backdrops should render: WebGL is available,
// the user hasn't requested reduced motion, and the device looks capable
// enough to handle ~30 light meshes at 60fps.
//
// Cheap heuristics — we don't run actual frame timing. False is the safe
// default; the existing CSS atmosphere is the fallback.
export function useCanRender3D() {
  const [ok, setOk] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return false;
    } catch { return false; }
    // Cap at 4 cores as a soft floor — older mobiles/laptops without
    // adequate threads are better served by the CSS atmosphere.
    if ((navigator.hardwareConcurrency || 4) < 4) return false;
    return true;
  });

  useEffect(() => {
    if (!ok) return;
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => { if (mq.matches) setOk(false); };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [ok]);

  return ok;
}
