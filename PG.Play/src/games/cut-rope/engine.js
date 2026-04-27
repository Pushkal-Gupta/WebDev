// Cut the Rope — Three.js engine bootstrap.
// Owns the renderer, scene, ortho camera, lights, and the backdrop
// gradient mesh. Returns a handle the gameplay code uses to mount
// per-level entities.

import * as THREE from 'three';

const FRUSTUM_HEIGHT = 7.6;        // world units visible vertically
const FRUSTUM_PAD_X  = 0.6;        // extra horizontal headroom on widescreen

export function makeEngine({ canvas }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();

  // Orthographic camera looking down the -Z axis. World "up" in our
  // gameplay coords is -Y (because +Y is "down toward the floor"), so
  // we just flip the camera vertically by negating its scale.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(0, 2, 10);
  camera.lookAt(0, 2, 0);

  // Backdrop — a single full-frustum quad; its material is swapped per
  // level theme. Sits at z = -2 so candy/rope/everything renders in front.
  const backdropMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color('#fff3e2') },
      uBot: { value: new THREE.Color('#f3c79f') },
      uVignette: { value: 0.55 },
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
      uniform float uVignette;
      varying vec2 vUv;
      void main() {
        vec3 col = mix(uTop, uBot, vUv.y);
        float d = distance(vUv, vec2(0.5));
        float v = smoothstep(0.78, 0.30, 1.0 - d * uVignette);
        col *= 0.85 + 0.15 * v;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backdropMat);
  backdrop.position.z = -3.5;
  backdrop.frustumCulled = false;
  scene.add(backdrop);

  // Lights — one warm directional key, one cool fill, soft warm ambient.
  const key = new THREE.DirectionalLight(0xffd9a8, 1.4);
  key.position.set(2.5, -3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcde0ff, 0.45);
  fill.position.set(-2.5, -1, 4);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0xfff5e7, 0.32));

  // Container groups for entity meshes — keeps level swap simple.
  const sceneRoot = new THREE.Group();
  scene.add(sceneRoot);

  // Sizing — keep frustum height fixed; expand width with aspect.
  const fit = (cssW, cssH) => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW, cssH, false);
    const aspect = cssW / cssH;
    const halfH = FRUSTUM_HEIGHT / 2;
    const halfW = halfH * aspect + FRUSTUM_PAD_X;
    camera.left = -halfW;
    camera.right =  halfW;
    camera.top = -halfH;        // flipped so +y in gameplay = down on screen
    camera.bottom = halfH;
    camera.position.x = 0;
    camera.position.y = 2;
    camera.updateProjectionMatrix();
    backdrop.scale.set(halfW * 2.4, halfH * 2.4, 1);
  };

  function setBackdrop(top, bot) {
    backdropMat.uniforms.uTop.value.set(top);
    backdropMat.uniforms.uBot.value.set(bot);
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

// Convert a screen-pixel coordinate (relative to the canvas) to world XY.
export function screenToWorld(camera, canvas, sx, sy) {
  const r = canvas.getBoundingClientRect();
  const nx =  ((sx - r.left) / r.width)  * 2 - 1;
  const ny = -((sy - r.top)  / r.height) * 2 + 1;
  // Inverse projection: ortho camera maps NDC linearly to its frustum.
  const wx = camera.left + (nx + 1) * 0.5 * (camera.right - camera.left);
  // Camera flipped vertically (top < bottom), so the math swaps.
  const wy = camera.top  + (1 - (ny + 1) * 0.5) * (camera.bottom - camera.top);
  return { x: wx, y: wy };
}
