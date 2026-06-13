// Grudgewood — Three.js engine bootstrap.
// Owns: renderer, scene, camera, lights, sky dome, fog, render loop, resize.
// Quality presets are applied here so the sim and gameplay code stays clean.

import * as THREE from 'three';

const QUALITY = {
  low:    { dpr: 1.0, shadows: false, foliage: 0.4, particles: 0.4, postSize: 1.0 },
  medium: { dpr: 1.25, shadows: true, foliage: 0.7, particles: 0.7, postSize: 1.0 },
  high:   { dpr: 1.5, shadows: true, foliage: 1.0, particles: 1.0, postSize: 1.0 },
};

export function pickQuality(setting) {
  if (setting === 'low' || setting === 'medium' || setting === 'high') return QUALITY[setting];
  // auto
  const m = (navigator.deviceMemory || 4);
  const cores = (navigator.hardwareConcurrency || 4);
  if (m <= 2 || cores <= 2) return QUALITY.low;
  if (m <= 4 || cores <= 4) return QUALITY.medium;
  return QUALITY.high;
}

export function makeEngine({ canvas, qualitySetting = 'auto' }) {
  const q = pickQuality(qualitySetting);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: q !== QUALITY.low,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.dpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = q.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);
  camera.position.set(0, 6, 12);

  // Sky dome — three-stop vertical gradient driven by biome, plus a sun
  // disc + bloom-ish halo so the directional light has a visible source.
  // The halo doubles as cheap atmospheric scattering near the horizon.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color('#f5cb86') },
      uMid: { value: new THREE.Color('#e99668') },
      uBot: { value: new THREE.Color('#8c4a32') },
      uSunDir: { value: new THREE.Vector3(0.5, 0.6, 0.4).normalize() },
      uSunColor: { value: new THREE.Color('#ffe6c0') },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vWorld;
      uniform vec3 uTop, uMid, uBot, uSunColor;
      uniform vec3 uSunDir;
      void main() {
        vec3 dir = normalize(vWorld);
        float h = clamp((dir.y + 0.25) * 0.8, 0.0, 1.0);
        vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.5, h));
        col = mix(col, uTop, smoothstep(0.5, 1.0, h));
        // Sun disc + halo. The tight pow gives the disc, the loose pow a
        // broad warm glow that bleeds into the gradient.
        float s = max(dot(dir, uSunDir), 0.0);
        col += uSunColor * (pow(s, 800.0) * 1.6 + pow(s, 24.0) * 0.35 + pow(s, 4.0) * 0.10);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // Lights — sun + ambient. Sun casts shadows when quality allows.
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(40, 60, 30);
  sun.castShadow = q.shadows;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(sun.target);

  const hemi = new THREE.HemisphereLight(0xddccaa, 0x2a1a10, 0.6);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0x553322, 0.4);
  scene.add(ambient);

  // Cool fill from the opposite side of the sun — lifts shadowed faces so
  // flat-shaded geometry keeps its facets instead of collapsing to black.
  const fill = new THREE.DirectionalLight(0xa8bcd8, 0.95);
  fill.position.set(-40, 30, -30);
  scene.add(fill);

  scene.fog = new THREE.FogExp2(0xc98e58, 0.018);

  // ── Ambient particle field ────────────────────────────────────────────
  // Drifting motes (fireflies / pollen / embers) in a box that follows a
  // focus point (the player). Count and colour come from biome.particle —
  // the config existed in biomes.js long before this implementation.
  const FIELD = { x: 56, y: 13, z: 56 };
  const particleCount = Math.round(220 * q.particles);
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  const pSeed = new Float32Array(particleCount * 3);   // per-point drift phase
  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * FIELD.x;
    pPos[i * 3 + 1] = Math.random() * FIELD.y + 0.4;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * FIELD.z;
    pSeed[i * 3] = Math.random() * Math.PI * 2;
    pSeed[i * 3 + 1] = 0.4 + Math.random() * 0.8;      // fall/drift speed scale
    pSeed[i * 3 + 2] = Math.random() * Math.PI * 2;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xffe2a0, size: 0.09, sizeAttenuation: true,
    transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const motes = new THREE.Points(pGeo, pMat);
  motes.frustumCulled = false;
  scene.add(motes);
  let motesFall = false;
  let motesVisibleCount = particleCount;
  let fxTime = 0;

  // ── Dust puffs ────────────────────────────────────────────────────────
  // Tiny pooled billboards for footsteps / landings. spawnPuff() grabs the
  // next slot; expired puffs shrink to nothing and hide.
  const PUFF_POOL = 24;
  const puffGeo = new THREE.SphereGeometry(0.5, 6, 5);
  const puffs = [];
  for (let i = 0; i < PUFF_POOL; i++) {
    const m = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({
      color: 0xcdbb96, transparent: true, opacity: 0, depthWrite: false,
    }));
    m.visible = false;
    scene.add(m);
    puffs.push({ mesh: m, t: 1, dur: 1, vy: 0 });
  }
  let puffIdx = 0;
  function spawnPuff(x, y, z, { scale = 1, color = null } = {}) {
    const p = puffs[puffIdx]; puffIdx = (puffIdx + 1) % PUFF_POOL;
    p.t = 0; p.dur = 0.45; p.vy = 0.7;
    p.mesh.visible = true;
    p.mesh.position.set(x, y + 0.08, z);
    p.mesh.scale.setScalar(0.22 * scale);
    if (color) p.mesh.material.color.set(color);
    p.mesh.material.opacity = 0.5;
    p._scale = scale;
  }

  // Per-frame FX tick — drifts the mote field around `focus`, ages active
  // puffs, and re-anchors the sun rig (light + shadow camera) on the
  // focus so shadow quality is identical everywhere in the endless world.
  const _focusDelta = new THREE.Vector3();
  const sunOffset = new THREE.Vector3(36, 42, -27);
  function tickFx(dt, focus) {
    fxTime += dt;
    if (focus) {
      sun.target.position.set(focus.x, 0, focus.z);
      sun.position.copy(sun.target.position).add(sunOffset);
      _focusDelta.set(focus.x - motes.position.x, 0, focus.z - motes.position.z);
      motes.position.x = focus.x;
      motes.position.z = focus.z;
    }
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      const j = i * 3;
      // Keep points stationary in world space when the field recenters.
      if (focus) { arr[j] -= _focusDelta.x; arr[j + 2] -= _focusDelta.z; }
      const sp = pSeed[j + 1];
      if (motesFall) {
        arr[j + 1] -= dt * 1.6 * sp;
        arr[j] += Math.sin(fxTime * 1.3 + pSeed[j]) * dt * 0.5;
        if (arr[j + 1] < 0.1) arr[j + 1] = FIELD.y;
      } else {
        arr[j] += Math.sin(fxTime * 0.6 + pSeed[j]) * dt * 0.35;
        arr[j + 1] += Math.cos(fxTime * 0.5 + pSeed[j + 2]) * dt * 0.22;
        arr[j + 2] += Math.cos(fxTime * 0.7 + pSeed[j]) * dt * 0.35;
        if (arr[j + 1] < 0.2) arr[j + 1] = 0.2;
        if (arr[j + 1] > FIELD.y) arr[j + 1] = FIELD.y;
      }
      // Wrap drifters that fall outside the field box.
      if (arr[j] > FIELD.x / 2) arr[j] -= FIELD.x; else if (arr[j] < -FIELD.x / 2) arr[j] += FIELD.x;
      if (arr[j + 2] > FIELD.z / 2) arr[j + 2] -= FIELD.z; else if (arr[j + 2] < -FIELD.z / 2) arr[j + 2] += FIELD.z;
    }
    pGeo.attributes.position.needsUpdate = true;

    for (const p of puffs) {
      if (!p.mesh.visible) continue;
      p.t += dt;
      const k = p.t / p.dur;
      if (k >= 1) { p.mesh.visible = false; continue; }
      p.mesh.position.y += p.vy * dt;
      p.mesh.scale.setScalar((0.22 + k * 0.55) * (p._scale || 1));
      p.mesh.material.opacity = 0.5 * (1 - k);
    }
  }

  // Resize handling.
  let width = 1, height = 1;
  function resize(w, h) {
    width = w; height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Apply biome look. When `next` and `t` are provided we blend toward the
  // next biome by `t` in [0,1] so transitions in a continuous world feel
  // breath-y instead of snapping at chunk boundaries.
  const _tmpColor = new THREE.Color();
  const lerpInto = (out, a, b, t) => out.copy(a).lerp(b, t);
  function applyBiome(b, next = null, t = 0) {
    const blend = next ? Math.max(0, Math.min(1, t)) : 0;
    const target = next || b;
    lerpInto(skyMat.uniforms.uTop.value, b.sky.top, target.sky.top, blend);
    lerpInto(skyMat.uniforms.uMid.value, b.sky.mid, target.sky.mid, blend);
    lerpInto(skyMat.uniforms.uBot.value, b.sky.bot, target.sky.bot, blend);
    lerpInto(scene.fog.color, b.fog.color, target.fog.color, blend);
    scene.fog.density = THREE.MathUtils.lerp(b.fog.density, target.fog.density, blend);
    lerpInto(sun.color, b.sun.color, target.sun.color, blend);
    sun.intensity = THREE.MathUtils.lerp(b.sun.intensity, target.sun.intensity, blend);
    // Sun OFFSET from the focus point — tickFx re-anchors the whole sun
    // rig on the player every frame so the shadow camera's ±50m box is
    // always centred where the player actually is. (Previously the rig
    // was parked at the world origin and shadows degraded with distance.)
    sunOffset.set(
      THREE.MathUtils.lerp(b.sun.angle[0], target.sun.angle[0], blend) * 60,
      -THREE.MathUtils.lerp(b.sun.angle[1], target.sun.angle[1], blend) * 60,
      THREE.MathUtils.lerp(b.sun.angle[2], target.sun.angle[2], blend) * 60,
    );
    sun.position.copy(sun.target.position).add(sunOffset);
    lerpInto(hemi.color, b.sky.top, target.sky.top, blend);
    lerpInto(hemi.groundColor, b.ground.darken, target.ground.darken, blend);
    hemi.intensity = 0.72;
    lerpInto(ambient.color, b.ambient.color, target.ambient.color, blend);
    ambient.intensity = THREE.MathUtils.lerp(b.ambient.intensity, target.ambient.intensity, blend);
    renderer.setClearColor(_tmpColor.copy(b.fog.color).lerp(target.fog.color, blend));
    // Sun disc in the sky shader tracks the directional light.
    skyMat.uniforms.uSunDir.value.copy(sun.position).normalize();
    lerpInto(skyMat.uniforms.uSunColor.value, b.sun.color, target.sun.color, blend);
    // Ambient mote field — colour, density and fall behaviour per biome.
    if (b.particle) {
      const tp = target.particle || b.particle;
      lerpInto(pMat.color, b.particle.color, tp.color, blend);
      motesFall = (blend > 0.5 ? tp : b.particle).fall === true;
      const want = Math.round(
        THREE.MathUtils.lerp(b.particle.count, tp.count, blend) * 1.4 * q.particles,
      );
      if (want !== motesVisibleCount) {
        motesVisibleCount = Math.min(want, particleCount);
        pGeo.setDrawRange(0, motesVisibleCount);
      }
    }
  }

  function dispose() {
    renderer.dispose();
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
        else o.material.dispose?.();
      }
    });
  }

  return {
    renderer, scene, camera, sun, hemi, ambient, q,
    resize, applyBiome, tickFx, spawnPuff, dispose,
    getSize: () => ({ w: width, h: height }),
  };
}
