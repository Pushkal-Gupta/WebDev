// Snip — Three.js engine bootstrap.
//
// Aesthetic: clean 2D paper-craft under an orthographic camera. We
// deliberately do NOT use directional lights or PBR materials on the
// gameplay layer — those expose the low-poly facets of the geometry
// that gameplay objects are made of. Instead, every gameplay entity
// uses a custom unlit shader (or flat MeshBasic with carefully
// chosen colors) and bakes its shading by stacking layered shapes.
//
// The backdrop is a single shader quad: a soft vertical gradient, a
// soft radial light bloom from upper-left, and a subtle paper-grain
// noise. Combined this reads as a printed page — never as a 3D scene.

import * as THREE from 'three';

const FRUSTUM_HEIGHT = 7.6;
const FRUSTUM_PAD_X  = 0.6;

export function makeEngine({ canvas }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Linear tone-mapping keeps our hand-picked palette colors intact;
  // ACES would warm them in ways we don't want.
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(0, 2, 10);
  camera.lookAt(0, 2, 0);

  // Backdrop — a full-frustum quad shaded entirely in fragment.
  const backdropMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uTop:   { value: new THREE.Color('#fff3e2') },
      uBot:   { value: new THREE.Color('#f3c79f') },
      uFloor: { value: new THREE.Color('#a87649') },
      uLight: { value: new THREE.Color('#ffffff') },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uTop;
      uniform vec3 uBot;
      uniform vec3 uFloor;
      uniform vec3 uLight;
      varying vec2 vUv;

      // Hash-based 2D noise; cheap paper-grain.
      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        // 1) vertical gradient: top at vUv.y=0, bottom at vUv.y=1.
        float t = smoothstep(0.0, 0.78, vUv.y);
        vec3 col = mix(uTop, uBot, t);

        // 2) horizon line + floor band — gives the world a clear ground.
        float floorMask = smoothstep(0.84, 0.88, vUv.y);
        col = mix(col, uFloor, floorMask * 0.85);
        // soft shadow just above the floor line
        float horizon = smoothstep(0.86, 0.84, vUv.y) * smoothstep(0.78, 0.84, vUv.y);
        col *= 1.0 - horizon * 0.10;

        // 3) soft radial bloom from upper-left.
        vec2 d = vUv - vec2(0.22, 0.18);
        float r = length(d * vec2(1.6, 1.0));
        float bloom = smoothstep(0.55, 0.0, r);
        col = mix(col, uLight, bloom * 0.10);

        // 4) edge vignette.
        float vig = smoothstep(1.05, 0.45, length(vUv - 0.5));
        col *= 0.86 + 0.14 * vig;

        // 5) paper grain — subtle multi-octave noise.
        float n = hash21(vUv * 720.0) * 0.03 + hash21(vUv * 180.0) * 0.015;
        col += (n - 0.022);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backdropMat);
  backdrop.position.z = -3.5;
  backdrop.frustumCulled = false;
  scene.add(backdrop);

  // Soft ambient — keeps any incidental MeshStandardMaterial in the
  // scene legible, but most gameplay objects are unlit/shader-shaded.
  scene.add(new THREE.AmbientLight(0xffffff, 0.95));

  const sceneRoot = new THREE.Group();
  scene.add(sceneRoot);

  const fit = (cssW, cssH) => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW, cssH, false);
    const aspect = cssW / cssH;
    const halfH = FRUSTUM_HEIGHT / 2;
    const halfW = halfH * aspect + FRUSTUM_PAD_X;
    camera.left = -halfW;
    camera.right =  halfW;
    camera.top = -halfH;
    camera.bottom = halfH;
    camera.position.x = 0;
    camera.position.y = 2;
    camera.updateProjectionMatrix();
    backdrop.scale.set(halfW * 2.4, halfH * 2.4, 1);
  };

  function setBackdrop(top, bot, floor) {
    backdropMat.uniforms.uTop.value.set(top);
    backdropMat.uniforms.uBot.value.set(bot);
    if (floor) backdropMat.uniforms.uFloor.value.set(floor);
  }

  function dispose() {
    sceneRoot.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material?.dispose();
      }
    });
    backdropMat.dispose();
    backdrop.geometry.dispose();
    renderer.dispose();
  }

  return {
    renderer, scene, camera, sceneRoot,
    fit, setBackdrop, dispose,
    constants: { FRUSTUM_HEIGHT, FRUSTUM_PAD_X },
  };
}

const _unprojScratch = new THREE.Vector3();
export function screenToWorld(camera, canvas, sx, sy) {
  const r = canvas.getBoundingClientRect();
  const nx =  ((sx - r.left) / r.width)  * 2 - 1;
  const ny = -((sy - r.top)  / r.height) * 2 + 1;
  _unprojScratch.set(nx, ny, 0).unproject(camera);
  return { x: _unprojScratch.x, y: _unprojScratch.y };
}
