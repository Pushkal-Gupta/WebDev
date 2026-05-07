// Snip — target creature ("Mochi"). A flat layered character drawn in
// the paper-craft idiom: round body silhouette + outline + soft fill +
// belly highlight + ear tufts + eyes that track the candy + brows +
// mouth that animates per phase.
//
// All shading is baked into the shaders inside `_paper.js`; nothing
// here uses lighting. The character is intentionally readable as a
// 2D illustration, not a 3D model. Each layer also has an explicit
// z offset so transparency-sort renders them back-to-front reliably.

import * as THREE from 'three';
import { paperDisk, paperPill, paperShadow, disposePaperGroup } from './_paper.js';

export function makeTarget(palette, def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);

  // Layered z stack: shadow -> ears (back) -> outline -> body -> belly
  // -> brows / eyes / mouth -> glints (front).

  const shadow = paperShadow(1, 1, 0.32);
  shadow.scale.set(0.95, 0.22, 1);
  shadow.position.set(0, 0.66, -0.08);
  group.add(shadow);

  // Ears go BEHIND the body so they read as tufts protruding from the head.
  const earL = paperDisk(1, palette.target, { highlight: 0.18, shade: 0.18, outline: palette.targetRim, outlineWidth: 0.10 });
  earL.scale.set(0.22, 0.30, 1);
  earL.position.set(-0.50, -0.42, -0.04);
  earL.rotation.z = -0.15;
  const earR = paperDisk(1, palette.target, { highlight: 0.18, shade: 0.18, outline: palette.targetRim, outlineWidth: 0.10 });
  earR.scale.set(0.22, 0.30, 1);
  earR.position.set( 0.50, -0.42, -0.04);
  earR.rotation.z =  0.15;
  group.add(earL); group.add(earR);

  // Body silhouette / outline (slightly bigger, behind body).
  const bodyOutline = paperDisk(1, palette.targetRim, { highlight: 0, shade: 0 });
  bodyOutline.scale.set(0.78 * 1.05, 0.74 * 1.05, 1);
  bodyOutline.position.z = -0.02;
  group.add(bodyOutline);

  // Body fill.
  const body = paperDisk(1, palette.target, { highlight: 0.20, shade: 0.24 });
  body.scale.set(0.78, 0.74, 1);
  group.add(body);

  // Belly highlight — slightly lighter ellipse low on the body.
  const belly = paperDisk(1, palette.targetBelly, { highlight: 0.10, shade: 0.04 });
  belly.scale.set(0.50, 0.34, 1);
  belly.position.set(0, 0.30, 0.02);
  group.add(belly);

  // Eye whites + pupils. Pupils translate based on the candy's relative
  // direction; the whites stay put.
  const eyeWhiteL = paperDisk(1, '#fffaf0', {
    highlight: 0, shade: 0, outline: '#1c1218', outlineWidth: 0.18,
  });
  eyeWhiteL.scale.set(0.13, 0.13, 1);
  eyeWhiteL.position.set(-0.20, -0.06, 0.05);
  const eyeWhiteR = paperDisk(1, '#fffaf0', {
    highlight: 0, shade: 0, outline: '#1c1218', outlineWidth: 0.18,
  });
  eyeWhiteR.scale.set(0.13, 0.13, 1);
  eyeWhiteR.position.set( 0.20, -0.06, 0.05);
  group.add(eyeWhiteL); group.add(eyeWhiteR);

  const pupilL = paperDisk(1, '#1c1218', { highlight: 0, shade: 0 });
  pupilL.scale.set(0.052, 0.052, 1);
  pupilL.position.set(-0.20, -0.06, 0.07);
  const pupilR = paperDisk(1, '#1c1218', { highlight: 0, shade: 0 });
  pupilR.scale.set(0.052, 0.052, 1);
  pupilR.position.set( 0.20, -0.06, 0.07);
  group.add(pupilL); group.add(pupilR);

  // Glints — tiny white specks that give the eyes life.
  const glintL = paperDisk(1, '#ffffff', { highlight: 0, shade: 0 });
  glintL.scale.set(0.022, 0.022, 1);
  glintL.position.set(pupilL.position.x + 0.022, pupilL.position.y - 0.014, 0.08);
  const glintR = paperDisk(1, '#ffffff', { highlight: 0, shade: 0 });
  glintR.scale.set(0.022, 0.022, 1);
  glintR.position.set(pupilR.position.x + 0.022, pupilR.position.y - 0.014, 0.08);
  group.add(glintL); group.add(glintR);

  // Brows — short pills above each eye. Tilt animates per phase.
  const browL = paperPill(0.18, 0.045, '#1c1218');
  browL.position.set(-0.20, -0.22, 0.06);
  const browR = paperPill(0.18, 0.045, '#1c1218');
  browR.position.set( 0.20, -0.22, 0.06);
  group.add(browL); group.add(browR);

  // Mouth — a soft pill that scales horizontally for idle and grows tall
  // for chomp. Sits clear of the belly highlight so they don't overlap.
  const mouth = paperPill(0.40, 0.16, '#1c1218');
  mouth.position.set(0, 0.10, 0.06);
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
        const ex = Math.max(-0.05, Math.min(0.05, dx * 0.05));
        const ey = Math.max(-0.04, Math.min(0.04, dy * 0.04));
        pupilL.position.x = -0.20 + ex; pupilR.position.x = 0.20 + ex;
        pupilL.position.y = -0.06 + ey; pupilR.position.y = -0.06 + ey;
        glintL.position.x = pupilL.position.x + 0.022;
        glintR.position.x = pupilR.position.x + 0.022;
        glintL.position.y = pupilL.position.y - 0.014;
        glintR.position.y = pupilR.position.y - 0.014;
      }

      // Mouth and brow per phase.
      if (phase === 'idle') {
        mouth.scale.set(0.40, 0.10, 1);
        mouth.position.y = 0.12;
        browL.rotation.z = 0; browR.rotation.z = 0;
      } else if (phase === 'anticipate') {
        const open = Math.min(0.22, phaseT * 0.6);
        mouth.scale.set(0.36, 0.10 + open, 1);
        mouth.position.y = 0.12 + open * 0.4;
        browL.rotation.z = -0.20;
        browR.rotation.z =  0.20;
      } else if (phase === 'chomp') {
        const k = Math.min(1, phaseT / 0.22);
        const open = (1 - k) * 0.45;
        mouth.scale.set(0.40 + (1 - k) * 0.06, 0.10 + open, 1);
        mouth.position.y = 0.12 + open * 0.4;
      } else if (phase === 'sad') {
        mouth.scale.set(0.30, 0.06, 1);
        mouth.position.y = 0.18;
        browL.rotation.z =  0.22;
        browR.rotation.z = -0.22;
      }
    },
    dispose() {
      disposePaperGroup(group);
    },
  };
}
