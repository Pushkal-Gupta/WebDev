// Snip — target creature ("Mochi"). A flat layered character drawn in
// the paper-craft idiom: round body silhouette + outline + soft fill +
// belly highlight + ear tufts + eyes that track the candy + brows +
// mouth that animates per phase.
//
// All shading is baked into the shaders inside `_paper.js`; nothing
// here uses lighting. The character is intentionally readable as a
// 2D illustration, not a 3D model.

import * as THREE from 'three';
import { paperDisk, paperEllipse, paperPill, paperShadow, disposePaperGroup } from './_paper.js';

export function makeTarget(palette, def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);

  // ── Layers (back-to-front) ──────────────────────────────────────────
  // Ground shadow — soft ellipse that sits *under* mochi.
  const shadow = paperShadow(0.78, 0.18, 0.28);
  shadow.position.set(0, 0.62, -0.05);
  group.add(shadow);

  // Outline silhouette — body fill drawn slightly larger in the rim color.
  const bodyOutline = paperDisk(0.66, palette.targetRim || '#3a2c25', { highlight: 0, shade: 0 });
  bodyOutline.position.set(0, 0, -0.01);
  bodyOutline.scale.set(0.66 * 1.04, 0.62 * 1.04, 1);
  group.add(bodyOutline);

  // Body fill — soft-shaded.
  const body = paperDisk(0.62, palette.target, { highlight: 0.18, shade: 0.22 });
  body.scale.set(0.66, 0.62, 1);
  group.add(body);

  // Belly highlight — slightly lighter ellipse near the chin.
  const belly = paperEllipse(0.42, 0.30, palette.targetBelly, {
    highlight: 0.10, shade: 0.05,
  });
  belly.position.set(0, 0.18, 0.04);
  group.add(belly);

  // Ear tufts (two small disks tilted outward, slightly behind the body).
  const earL = paperDisk(0.18, palette.target, { highlight: 0.18, shade: 0.18 });
  earL.position.set(-0.42, -0.40, -0.02);
  earL.scale.set(0.20, 0.24, 1);
  const earR = paperDisk(0.18, palette.target, { highlight: 0.18, shade: 0.18 });
  earR.position.set( 0.42, -0.40, -0.02);
  earR.scale.set(0.20, 0.24, 1);
  group.add(earL); group.add(earR);

  // Eye whites + pupils. Whites keep position; pupils translate based
  // on the candy's relative direction.
  const eyeWhiteL = paperDisk(0.10, '#fffaf0', { highlight: 0.0, shade: 0.0, outline: '#1c1218', outlineWidth: 0.16 });
  eyeWhiteL.position.set(-0.18, -0.05, 0.08);
  const eyeWhiteR = paperDisk(0.10, '#fffaf0', { highlight: 0.0, shade: 0.0, outline: '#1c1218', outlineWidth: 0.16 });
  eyeWhiteR.position.set( 0.18, -0.05, 0.08);
  group.add(eyeWhiteL); group.add(eyeWhiteR);

  const pupilL = paperDisk(0.045, '#1c1218', { highlight: 0.0, shade: 0.0 });
  pupilL.position.set(-0.18, -0.05, 0.10);
  const pupilR = paperDisk(0.045, '#1c1218', { highlight: 0.0, shade: 0.0 });
  pupilR.position.set( 0.18, -0.05, 0.10);
  group.add(pupilL); group.add(pupilR);

  // Pupil glints (the white dot that gives the eyes life).
  const glintL = paperDisk(0.018, '#ffffff', { highlight: 0, shade: 0 });
  glintL.position.set(-0.18 + 0.018, -0.062, 0.11);
  const glintR = paperDisk(0.018, '#ffffff', { highlight: 0, shade: 0 });
  glintR.position.set( 0.18 + 0.018, -0.062, 0.11);
  group.add(glintL); group.add(glintR);

  // Brows — two short pills above each eye. Tilt animates per phase.
  const browL = paperPill(0.16, 0.04, '#1c1218');
  browL.position.set(-0.18, -0.20, 0.10);
  const browR = paperPill(0.16, 0.04, '#1c1218');
  browR.position.set( 0.18, -0.20, 0.10);
  group.add(browL); group.add(browR);

  // Mouth — a soft pill that scales horizontally for idle and grows tall
  // for chomp. Sad phase flips the curvature by setting Y small.
  const mouth = paperPill(0.34, 0.14, '#1c1218');
  mouth.position.set(0, 0.18, 0.10);
  group.add(mouth);

  let elapsed = 0;
  let phase = 'idle';
  let phaseT = 0;

  return {
    pos: { x: def.x, y: def.y },
    mesh: group,
    setPhase(next) { if (phase !== next) { phase = next; phaseT = 0; } },
    update(dt, candyPos) {
      elapsed += dt; phaseT += dt;
      // Gentle idle bob — small breathing motion.
      const bob = Math.sin(elapsed * 1.7) * 0.04;
      group.position.set(def.x, def.y + bob, 0);

      // Phase transitions driven by candy proximity.
      if (candyPos) {
        const dx = candyPos.x - def.x;
        const dy = candyPos.y - def.y;
        const d = Math.hypot(dx, dy);
        if (phase === 'idle' && d < 1.6 && dy < -0.05) this.setPhase('anticipate');
        if (phase === 'anticipate' && d > 2.2) this.setPhase('idle');
        // Eye tracking — pupils slide a few pixels toward the candy.
        const ex = Math.max(-0.04, Math.min(0.04, dx * 0.05));
        const ey = Math.max(-0.03, Math.min(0.03, dy * 0.04));
        pupilL.position.x = -0.18 + ex; pupilR.position.x = 0.18 + ex;
        pupilL.position.y = -0.05 + ey; pupilR.position.y = -0.05 + ey;
        glintL.position.x = pupilL.position.x + 0.018;
        glintR.position.x = pupilR.position.x + 0.018;
        glintL.position.y = pupilL.position.y - 0.012;
        glintR.position.y = pupilR.position.y - 0.012;
      }

      // Mouth and brow per phase.
      if (phase === 'idle') {
        mouth.scale.set(0.34, 0.10, 1);
        mouth.position.y = 0.20;
        browL.rotation.z = 0; browR.rotation.z = 0;
      } else if (phase === 'anticipate') {
        // Mouth opens vertically, brows tilt up (excited).
        const open = Math.min(0.22, phaseT * 0.6);
        mouth.scale.set(0.30, 0.10 + open, 1);
        mouth.position.y = 0.20 + open * 0.5;
        browL.rotation.z = -0.20;
        browR.rotation.z =  0.20;
      } else if (phase === 'chomp') {
        // Big open then snap shut over ~0.22s.
        const k = Math.min(1, phaseT / 0.22);
        const open = (1 - k) * 0.45;
        mouth.scale.set(0.32 + (1 - k) * 0.06, 0.10 + open, 1);
        mouth.position.y = 0.20 + open * 0.4;
      } else if (phase === 'sad') {
        mouth.scale.set(0.26, 0.06, 1);
        mouth.position.y = 0.24;
        browL.rotation.z =  0.22;
        browR.rotation.z = -0.22;
      }
    },
    dispose() {
      disposePaperGroup(group);
    },
  };
}
