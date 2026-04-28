// Cut the Rope — target creature ("Mochi"). Original character: round
// body with two ear-tufts, white belly, dot eyes that track the candy,
// mouth that animates by phase: idle → anticipate → chomp / sad.
//
// Designed in a clean silhouette — the animation states are driven by
// the gameplay loop calling setPhase().

import * as THREE from 'three';

export function makeTarget(palette, def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);

  const bodyMat  = new THREE.MeshStandardMaterial({ color: palette.target,      roughness: 0.6 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: palette.targetBelly, roughness: 0.5 });
  const eyeMat   = new THREE.MeshBasicMaterial({ color: 0x110d10 });
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x1c1218 });

  const bodyGeo = new THREE.SphereGeometry(0.6, 24, 18);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1.05, 0.95, 0.85);
  group.add(body);

  const bellyGeo = new THREE.SphereGeometry(0.42, 22, 16);
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.scale.set(0.95, 0.65, 0.5);
  belly.position.set(0, 0.1, 0.32);
  group.add(belly);

  const earGeo = new THREE.SphereGeometry(0.16, 14, 10);
  const earL = new THREE.Mesh(earGeo, bodyMat);
  earL.position.set(-0.32, -0.42, 0.05);
  earL.scale.set(0.9, 1.2, 0.9);
  const earR = earL.clone();
  earR.position.x = 0.32;
  group.add(earL); group.add(earR);

  const eyeGeo = new THREE.SphereGeometry(0.08, 12, 10);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.18, -0.08, 0.5);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.18;
  group.add(eyeL); group.add(eyeR);

  const mouthGeo = new THREE.SphereGeometry(0.18, 14, 10);
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.scale.set(0.8, 0.35, 0.2);
  mouth.position.set(0, 0.18, 0.55);
  group.add(mouth);

  let elapsed = 0;
  let phase = 'idle';                 // idle | anticipate | chomp | sad
  let phaseT = 0;

  return {
    pos: { x: def.x, y: def.y },
    mesh: group,
    setPhase(next) { if (phase !== next) { phase = next; phaseT = 0; } },
    update(dt, candyPos) {
      elapsed += dt; phaseT += dt;
      const bob = Math.sin(elapsed * 1.7) * 0.05;
      group.position.set(def.x, def.y + bob, 0);

      if (candyPos) {
        const dx = candyPos.x - def.x;
        const dy = candyPos.y - def.y;
        const d = Math.hypot(dx, dy);
        if (phase === 'idle' && d < 1.6 && dy < -0.05) this.setPhase('anticipate');
        if (phase === 'anticipate' && d > 2.2) this.setPhase('idle');
        const tex = Math.max(-0.04, Math.min(0.04, dx * 0.04));
        const tey = Math.max(-0.03, Math.min(0.03, dy * 0.03));
        eyeL.position.x = -0.18 + tex; eyeR.position.x = 0.18 + tex;
        eyeL.position.y = -0.08 + tey; eyeR.position.y = -0.08 + tey;
      }

      let sx = 0.8, sy = 0.35;
      if (phase === 'anticipate') {
        sx = 0.85; sy = 0.55 + Math.min(0.3, phaseT * 0.6);
      } else if (phase === 'chomp') {
        const k = Math.min(1, phaseT / 0.22);
        sy = 0.35 + (1 - k) * 0.7;
      } else if (phase === 'sad') {
        sy = 0.18;
      }
      mouth.scale.set(sx, sy, 0.2);
    },
    dispose() {
      bodyGeo.dispose(); bellyGeo.dispose();
      earGeo.dispose(); eyeGeo.dispose(); mouthGeo.dispose();
      bodyMat.dispose(); bellyMat.dispose();
      eyeMat.dispose(); mouthMat.dispose();
    },
  };
}
