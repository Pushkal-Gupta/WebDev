// HatsScreen — wardrobe view. Shows all hats; locked ones are silhouetted
// with a hint string. The equipped hat persists between runs.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HATS, HAT_UNLOCK, HAT_HINT } from '../hats.js';
import { Icon } from '../../../icons.jsx';

export default function HatsScreen({ save, onEquip, onBack }) {
  return (
    <div className="gw-menu">
      <div className="gw-menu-card gw-menu-card--wide">
        <div className="gw-menu-title">Hats</div>
        <div className="gw-menu-sub">Wear something the forest will mock differently.</div>
        <div className="gw-hat-grid">
          {Object.entries(HATS).map(([id, def]) => {
            const owned = !!save.hats[id];
            const canUnlock = HAT_UNLOCK[id]?.(save);
            const equipped = save.equippedHat === id;
            return (
              <button
                key={id}
                className={`gw-hat-tile ${owned ? '' : 'gw-hat-tile--locked'} ${equipped ? 'gw-hat-tile--equipped' : ''}`}
                onClick={() => owned && onEquip(id)}
                disabled={!owned}
              >
                <HatPreview id={id} owned={owned} />
                <div className="gw-hat-name">{def.name}</div>
                <div className="gw-hat-blurb">{owned ? def.blurb : (canUnlock ? '— claim it —' : HAT_HINT[id])}</div>
                {equipped ? <div className="gw-hat-eq">Equipped</div> : null}
              </button>
            );
          })}
        </div>
        <div className="gw-menu-foot">
          <button className="gw-link" onClick={onBack}><span className="gw-hud-icon">{Icon.back}</span> Back</button>
        </div>
      </div>
    </div>
  );
}

// Tiny per-tile Three.js preview. Cheap because each scene has just the hat.
function HatPreview({ id, owned }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 110;
    const h = el.clientHeight || 110;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h, false);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
    camera.position.set(0, 0.3, 1.6);
    camera.lookAt(0, 0.2, 0);

    const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(2, 4, 3); scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    let hatMesh = null;
    if (HATS[id]) {
      hatMesh = HATS[id].build();
      hatMesh.scale.setScalar(1.4);
      // Silhouette locked hats — flatten color via override material.
      if (!owned) {
        hatMesh.traverse((o) => {
          if (o.material) {
            o.material = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.9 });
          }
        });
      }
      scene.add(hatMesh);
    }

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.012;
      if (hatMesh) hatMesh.rotation.y = t;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
          else o.material.dispose?.();
        }
      });
      el.removeChild(renderer.domElement);
    };
  }, [id, owned]);

  return <div className="gw-hat-preview" ref={ref} />;
}
