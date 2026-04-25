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
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = q.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);
  camera.position.set(0, 6, 12);

  // Sky dome — three-stop vertical gradient driven by biome.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color('#f5cb86') },
      uMid: { value: new THREE.Color('#e99668') },
      uBot: { value: new THREE.Color('#8c4a32') },
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
      uniform vec3 uTop, uMid, uBot;
      void main() {
        float h = clamp((normalize(vWorld).y + 0.25) * 0.8, 0.0, 1.0);
        vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.5, h));
        col = mix(col, uTop, smoothstep(0.5, 1.0, h));
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

  scene.fog = new THREE.FogExp2(0xc98e58, 0.018);

  // Resize handling.
  let width = 1, height = 1;
  function resize(w, h) {
    width = w; height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Apply biome look.
  function applyBiome(b) {
    skyMat.uniforms.uTop.value.copy(b.sky.top);
    skyMat.uniforms.uMid.value.copy(b.sky.mid);
    skyMat.uniforms.uBot.value.copy(b.sky.bot);
    scene.fog.color.copy(b.fog.color);
    scene.fog.density = b.fog.density;
    sun.color.copy(b.sun.color);
    sun.intensity = b.sun.intensity;
    sun.position.set(b.sun.angle[0] * 60, -b.sun.angle[1] * 60, b.sun.angle[2] * 60);
    hemi.color.copy(b.sky.top);
    hemi.groundColor.copy(b.ground.darken);
    hemi.intensity = 0.55;
    ambient.color.copy(b.ambient.color);
    ambient.intensity = b.ambient.intensity;
    renderer.setClearColor(b.fog.color);
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

  return { renderer, scene, camera, sun, hemi, ambient, q, resize, applyBiome, dispose, getSize: () => ({ w: width, h: height }) };
}
