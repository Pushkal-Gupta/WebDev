// SLIPSHOT — original movement-FPS for PG.Play.
//
// Design notes (short on purpose — repository code stays lean):
//  • Fantasy: "you are pure momentum." Chain a slide into a jump to
//    preserve horizontal speed (slidehop). Movement is the skill ceiling.
//  • Arena is a compact sealed box with vertical cover + crossing pillars.
//  • Two weapons: Pulse (fast, low damage, peek-and-spray) and Slug (slow,
//    heavy-impact, committed shots). Switch with 1 / 2 / Q.
//  • Scoring rewards speed: kills × 100 + max(0, 400 − seconds).
//  • Multiplayer: Supabase Realtime Broadcast + Presence; trust-the-shooter.
//    Bots fill empty slots so a solo player always has targets.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { supabase } from '../supabase.js';
import { submitScore } from '../scoreBus.js';

const PLAYER_EYE    = 1.62;
const CROUCH_EYE    = 0.95;
const RADIUS        = 0.38;
const WALK_SPEED    = 6.2;
const SPRINT_SPEED  = 9.4;
const SLIDE_SPEED   = 13.0;
const SLIDE_DECAY   = 0.92;
const SLIDE_FRICTION_MIN = 4.8;
const JUMP_V        = 7.1;
const GRAVITY       = 21;
const MAX_HP        = 100;
const BULLET_LIFE   = 1.5;
const WIN_KILLS     = 10;
const BOT_COUNT     = 3;

const WEAPONS = {
  pulse: { name: 'Pulse', cd: 0.085, speed: 78,  damage: 18, ammo: 32, spread: 0.012 },
  slug:  { name: 'Slug',  cd: 0.75,  speed: 100, damage: 60, ammo: 8,  spread: 0.0 },
};

// Arena geometry: flat floor with crossing pillars + scattered cover.
const WALLS = [
  [  0,   0, 22,  3.2, 1.4],
  [  0,   0, 1.4, 3.2, 22 ],
  [ -8, -10, 3,   2.4, 3 ],
  [  8,  10, 3,   2.4, 3 ],
  [-14,  12, 2.4, 2.4, 2.4],
  [ 14, -12, 2.4, 2.4, 2.4],
  [  5,  -5, 1.6, 5,   1.6],
  [ -5,   5, 1.6, 5,   1.6],
  [ 18,   0, 1.6, 3,   8 ],
  [-18,   0, 1.6, 3,   8 ],
  [  0,  18, 8,   3,   1.6],
  [  0, -18, 8,   3,   1.6],
];
const ARENA_HALF = 22;

const COLORS = [0x00fff5, 0xff4d6d, 0xffe14f, 0x35f0c9, 0xa78bfa, 0xff8a3a, 0x6fbf2a, 0x35c7f5];
const NAMES  = ['Wisp', 'Axis', 'Rove', 'Flint', 'Relay', 'Zephyr', 'Lark', 'Hatch', 'Drifter', 'Coda'];
const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const pickName  = () => NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(10 + Math.random() * 89);

const collidesCube = (x, z, r) => {
  for (const [cx, cz, sx, , sz] of WALLS) {
    const dx = Math.abs(x - cx) - sx / 2;
    const dz = Math.abs(z - cz) - sz / 2;
    if (dx < r && dz < r) return true;
  }
  return Math.abs(x) > ARENA_HALF - r || Math.abs(z) > ARENA_HALF - r;
};

const randSpawn = () => {
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * (ARENA_HALF - 2) * 2;
    const z = (Math.random() - 0.5) * (ARENA_HALF - 2) * 2;
    if (!collidesCube(x, z, 0.6)) return { x, z };
  }
  return { x: 0, z: 10 };
};

export default function SlipshotGame() {
  const mountRef    = useRef(null);
  const channelRef  = useRef(null);
  const meRef       = useRef({
    id: 'c' + Math.random().toString(36).slice(2, 9),
    name: pickName(),
    color: pickColor(),
  });

  const [hp, setHp]       = useState(MAX_HP);
  const [kills, setKills] = useState(0);
  const [remote, setRemote] = useState(0);
  const [weapon, setWeapon] = useState('pulse');
  const [ammo, setAmmo]   = useState(WEAPONS.pulse.ammo);
  const [time, setTime]   = useState(0);
  const [speed, setSpeed] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [locked, setLocked]   = useState(false);
  const [status, setStatus]   = useState('playing');

  useEffect(() => {
    const mount = mountRef.current;
    const me = meRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a1014);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1014, 22, 62);
    const camera = new THREE.PerspectiveCamera(78, mount.clientWidth / mount.clientHeight, 0.1, 200);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(10, 20, 5);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA_HALF * 2, ARENA_HALF * 2),
      new THREE.MeshStandardMaterial({ color: 0x141e24, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(ARENA_HALF * 2, 44, 0x1b2630, 0x101a21);
    grid.position.y = 0.01;
    scene.add(grid);

    const wallMat   = new THREE.MeshStandardMaterial({ color: 0x1b2731, roughness: 0.88 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x00fff5, emissive: 0x003c38, emissiveIntensity: 0.7, roughness: 0.35 });

    [[0, ARENA_HALF, ARENA_HALF * 2, 3, 0.5], [0, -ARENA_HALF, ARENA_HALF * 2, 3, 0.5],
     [ARENA_HALF, 0, 0.5, 3, ARENA_HALF * 2], [-ARENA_HALF, 0, 0.5, 3, ARENA_HALF * 2]].forEach(([cx, cz, sx, sy, sz]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
      m.position.set(cx, sy / 2, cz);
      scene.add(m);
    });
    WALLS.forEach(([cx, cz, sx, sy, sz]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
      m.position.set(cx, sy / 2, cz);
      scene.add(m);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.08, sz), accentMat);
      trim.position.set(cx, sy + 0.04, cz);
      scene.add(trim);
    });

    const gun = new THREE.Group();
    gun.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.48), new THREE.MeshStandardMaterial({ color: 0x0e1620 })));
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.58), new THREE.MeshStandardMaterial({ color: 0x2a3a46 }));
    barrel.position.z = -0.5;
    gun.add(barrel);
    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.48), new THREE.MeshStandardMaterial({ color: 0x00fff5, emissive: 0x00c8c0, emissiveIntensity: 0.8 }));
    accent.position.y = 0.08;
    gun.add(accent);
    gun.position.set(0.22, -0.2, -0.36);
    camera.add(gun);
    scene.add(camera);

    const spawn = randSpawn();
    const player = {
      pos: new THREE.Vector3(spawn.x, PLAYER_EYE, spawn.z),
      vel: new THREE.Vector3(),
      yaw: 0, pitch: 0,
      onGround: true, crouching: false, sliding: false,
      slideTimer: 0, eye: PLAYER_EYE,
      hp: MAX_HP, kills: 0,
      weapon: 'pulse',
      ammo: { pulse: WEAPONS.pulse.ammo, slug: WEAPONS.slug.ammo },
      fireCd: 0, reloadIn: 0,
    };

    const bots = Array.from({ length: BOT_COUNT }).map((_, i) => {
      const s = randSpawn();
      const mat = new THREE.MeshStandardMaterial({ color: COLORS[(i + 3) % COLORS.length], roughness: 0.6 });
      const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.2, 4, 10), mat);
      capsule.position.set(s.x, 1, s.z);
      scene.add(capsule);
      return {
        id: `bot${i}`, mesh: capsule, hp: MAX_HP,
        pos: new THREE.Vector3(s.x, 1, s.z),
        fireCd: 1 + Math.random() * 1.2,
        strafe: Math.random() > 0.5 ? 1 : -1,
        strafeTick: 0,
      };
    });

    const remotes = new Map();
    const ensureRemote = (id, data) => {
      let r = remotes.get(id);
      if (!r) {
        const color = data.color || 0xff4d6d;
        const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.2, 4, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
        mesh.position.set(data.x ?? 0, 1, data.z ?? 0);
        scene.add(mesh);
        r = { mesh, target: { x: data.x, z: data.z, yaw: 0 }, hp: MAX_HP, color, name: data.name || 'Player' };
        remotes.set(id, r);
      }
      r.target.x = data.x ?? r.target.x;
      r.target.z = data.z ?? r.target.z;
      r.target.yaw = data.yaw ?? r.target.yaw;
      if (typeof data.hp === 'number') r.hp = data.hp;
      return r;
    };

    const bullets = [];
    const bulletGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const myMat   = new THREE.MeshStandardMaterial({ color: 0xffe14f, emissive: 0xffc140, emissiveIntensity: 1 });
    const rMat    = new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xbb3040, emissiveIntensity: 1 });
    const slugMat = new THREE.MeshStandardMaterial({ color: 0x00fff5, emissive: 0x00c8c0, emissiveIntensity: 1.2 });
    const makeBullet = (pos, vel, fromId, isSlug) => {
      const mat = fromId === me.id ? (isSlug ? slugMat : myMat) : rMat;
      const mesh = new THREE.Mesh(bulletGeo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      bullets.push({ mesh, vel: vel.clone(), life: BULLET_LIFE, from: fromId, damage: isSlug ? WEAPONS.slug.damage : WEAPONS.pulse.damage });
    };

    const channel = supabase.channel('pgplay-slipshot', {
      config: { presence: { key: me.id }, broadcast: { ack: false, self: false } },
    });
    const respawnMe = () => {
      const s = randSpawn();
      player.pos.set(s.x, PLAYER_EYE, s.z);
      player.vel.set(0, 0, 0);
      player.hp = MAX_HP;
      player.ammo.pulse = WEAPONS.pulse.ammo;
      player.ammo.slug  = WEAPONS.slug.ammo;
      setHp(MAX_HP);
      setAmmo(player.ammo[player.weapon]);
      setStatus('playing');
    };
    channel
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        if (!payload || payload.id === me.id) return;
        ensureRemote(payload.id, payload);
      })
      .on('broadcast', { event: 'shot' }, ({ payload }) => {
        if (!payload || payload.id === me.id) return;
        const origin = new THREE.Vector3(payload.x, payload.y, payload.z);
        const dir = new THREE.Vector3(payload.dx, payload.dy, payload.dz);
        makeBullet(origin, dir.multiplyScalar(payload.speed || 78), payload.id, payload.slug);
      })
      .on('broadcast', { event: 'hit' }, ({ payload }) => {
        if (!payload || payload.target !== me.id || player.hp <= 0) return;
        player.hp = Math.max(0, player.hp - (payload.damage || 20));
        setHp(player.hp);
        if (player.hp <= 0) {
          setStatus('dead');
          setTimeout(respawnMe, 2000);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const s = channel.presenceState();
        const ids = Object.keys(s).filter((id) => id !== me.id);
        setRemote(ids.length);
        [...remotes.keys()].forEach((id) => {
          if (!ids.includes(id)) {
            const r = remotes.get(id);
            if (r?.mesh) scene.remove(r.mesh);
            remotes.delete(id);
          }
        });
      })
      .subscribe(async (st) => {
        if (st === 'SUBSCRIBED') await channel.track({ id: me.id, name: me.name, color: me.color });
      });
    channelRef.current = channel;

    const switchTo = (w) => {
      if (w === player.weapon) return;
      player.weapon = w;
      setWeapon(w);
      setAmmo(player.ammo[w]);
    };

    const keys = {};
    let firing = false;
    const onKD = (e) => {
      keys[e.code] = true;
      if (e.code === 'Digit1') switchTo('pulse');
      if (e.code === 'Digit2') switchTo('slug');
      if (e.code === 'KeyQ') switchTo(player.weapon === 'pulse' ? 'slug' : 'pulse');
      if (e.code === 'KeyR') {
        const w = WEAPONS[player.weapon];
        if (player.ammo[player.weapon] < w.ammo) player.reloadIn = 1.1;
      }
    };
    const onKU = (e) => { keys[e.code] = false; };
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);

    const onClick = () => {
      if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock?.();
      }
    };
    renderer.domElement.addEventListener('click', onClick);
    const onLock = () => setLocked(document.pointerLockElement === renderer.domElement);
    document.addEventListener('pointerlockchange', onLock);
    const onMM = (e) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      player.yaw -= e.movementX * 0.0022;
      player.pitch -= e.movementY * 0.0022;
      player.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, player.pitch));
    };
    document.addEventListener('mousemove', onMM);
    const onMD = () => { if (document.pointerLockElement === renderer.domElement) firing = true; };
    const onMU = () => { firing = false; };
    renderer.domElement.addEventListener('mousedown', onMD);
    window.addEventListener('mouseup', onMU);
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const fire = () => {
      const w = WEAPONS[player.weapon];
      if (player.fireCd > 0 || player.hp <= 0) return;
      if (player.ammo[player.weapon] <= 0) { player.reloadIn = 1.1; return; }
      player.fireCd = w.cd;
      player.ammo[player.weapon]--;
      setAmmo(player.ammo[player.weapon]);
      const origin = camera.position.clone();
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      if (w.spread > 0) {
        dir.x += (Math.random() - 0.5) * w.spread;
        dir.y += (Math.random() - 0.5) * w.spread;
        dir.normalize();
      }
      origin.add(dir.clone().multiplyScalar(0.8));
      makeBullet(origin, dir.clone().multiplyScalar(w.speed), me.id, player.weapon === 'slug');
      channelRef.current?.send({
        type: 'broadcast', event: 'shot',
        payload: {
          id: me.id,
          x: origin.x, y: origin.y, z: origin.z,
          dx: dir.x, dy: dir.y, dz: dir.z,
          speed: w.speed, slug: player.weapon === 'slug',
        },
      });
    };

    const botStep = (dt) => {
      bots.forEach((b) => {
        if (b.hp <= 0) return;
        const dx = player.pos.x - b.pos.x;
        const dz = player.pos.z - b.pos.z;
        const d = Math.hypot(dx, dz);
        const ang = Math.atan2(dz, dx);
        b.mesh.rotation.y = -ang + Math.PI / 2;
        const move = d > 10 ? 3.4 : d < 5 ? -2.2 : 0;
        const nx = b.pos.x + Math.cos(ang) * move * dt;
        const nz = b.pos.z + Math.sin(ang) * move * dt;
        if (!collidesCube(nx, b.pos.z, 0.5)) b.pos.x = nx;
        if (!collidesCube(b.pos.x, nz, 0.5)) b.pos.z = nz;
        b.strafeTick += dt;
        if (b.strafeTick > 1.3) { b.strafeTick = 0; b.strafe = Math.random() > 0.5 ? 1 : -1; }
        const sx = b.pos.x + Math.cos(ang + Math.PI / 2) * 2.4 * dt * b.strafe;
        const sz = b.pos.z + Math.sin(ang + Math.PI / 2) * 2.4 * dt * b.strafe;
        if (!collidesCube(sx, b.pos.z, 0.5)) b.pos.x = sx;
        if (!collidesCube(b.pos.x, sz, 0.5)) b.pos.z = sz;
        b.mesh.position.set(b.pos.x, 1, b.pos.z);
        b.fireCd -= dt;
        if (b.fireCd <= 0 && d < 26 && player.hp > 0) {
          b.fireCd = 1.0 + Math.random() * 0.8;
          const origin = new THREE.Vector3(b.pos.x, 1.4, b.pos.z);
          const dir = new THREE.Vector3(dx, player.pos.y - 1.4, dz).normalize();
          makeBullet(origin, dir.clone().multiplyScalar(68), b.id, false);
        }
      });
    };

    const interpRemotes = (dt) => {
      remotes.forEach((r) => {
        const cur = r.mesh.position;
        cur.x += (r.target.x - cur.x) * Math.min(1, dt * 12);
        cur.z += (r.target.z - cur.z) * Math.min(1, dt * 12);
        r.mesh.rotation.y = r.target.yaw || 0;
      });
    };

    const bulletStep = (dt, startT) => {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const pos = b.mesh.position;
        const next = pos.clone().addScaledVector(b.vel, dt);
        if (collidesCube(next.x, next.z, 0.08) || next.y < 0 || next.y > 10) {
          scene.remove(b.mesh); bullets.splice(i, 1); continue;
        }
        pos.copy(next);
        b.life -= dt;
        if (b.life <= 0) { scene.remove(b.mesh); bullets.splice(i, 1); continue; }

        if (b.from !== me.id && player.hp > 0) {
          const dx = pos.x - player.pos.x;
          const dy = pos.y - (player.pos.y - 0.6);
          const dz = pos.z - player.pos.z;
          if (dx * dx + dy * dy + dz * dz < 0.55 * 0.55 + 0.9 * 0.9) {
            player.hp = Math.max(0, player.hp - (b.damage || 18));
            setHp(player.hp);
            scene.remove(b.mesh); bullets.splice(i, 1);
            if (player.hp <= 0) { setStatus('dead'); setTimeout(respawnMe, 2000); }
            continue;
          }
        }

        if (b.from === me.id) {
          let consumed = false;
          for (const bot of bots) {
            if (bot.hp <= 0) continue;
            const dx = pos.x - bot.pos.x;
            const dy = pos.y - 1;
            const dz = pos.z - bot.pos.z;
            if (dx * dx + dy * dy + dz * dz < 0.6 * 0.6 + 1.0 * 1.0) {
              bot.hp -= b.damage;
              scene.remove(b.mesh); bullets.splice(i, 1); consumed = true;
              if (bot.hp <= 0) {
                player.kills++;
                setKills(player.kills);
                if (player.kills >= WIN_KILLS) {
                  const t = (performance.now() - startT) / 1000;
                  setStatus('won');
                  submitScore('slipshot', player.kills * 100 + Math.max(0, 400 - Math.round(t)), { kills: player.kills, time: Math.round(t) });
                }
                scene.remove(bot.mesh);
                setTimeout(() => {
                  const s = randSpawn();
                  bot.pos.set(s.x, 1, s.z); bot.hp = MAX_HP;
                  scene.add(bot.mesh);
                }, 1500);
              }
              break;
            }
          }
          if (consumed) continue;
          for (const [rid, r] of remotes) {
            if (r.hp <= 0) continue;
            const dx = pos.x - r.target.x;
            const dy = pos.y - 1;
            const dz = pos.z - r.target.z;
            if (dx * dx + dy * dy + dz * dz < 0.55 * 0.55 + 1.0 * 1.0) {
              channelRef.current?.send({
                type: 'broadcast', event: 'hit',
                payload: { target: rid, from: me.id, damage: b.damage },
              });
              player.kills++;
              setKills(player.kills);
              if (player.kills >= WIN_KILLS) {
                const t = (performance.now() - startT) / 1000;
                setStatus('won');
                submitScore('slipshot', player.kills * 100 + Math.max(0, 400 - Math.round(t)), { kills: player.kills, time: Math.round(t) });
              }
              scene.remove(b.mesh); bullets.splice(i, 1);
              break;
            }
          }
        }
      }
    };

    const startT = performance.now();
    const clock = new THREE.Clock();
    let raf = 0;
    let broadcastAcc = 0;
    let hudTick = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, clock.getDelta());

      if (player.reloadIn > 0) {
        player.reloadIn -= dt;
        if (player.reloadIn <= 0) {
          const w = WEAPONS[player.weapon];
          player.ammo[player.weapon] = w.ammo;
          setAmmo(w.ammo);
        }
      }
      player.fireCd -= dt;

      if (status === 'playing' && player.hp > 0 && document.pointerLockElement === renderer.domElement) {
        const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
        const right   = new THREE.Vector3( Math.cos(player.yaw), 0, -Math.sin(player.yaw));

        const wish = new THREE.Vector3();
        if (keys.KeyW) wish.add(forward);
        if (keys.KeyS) wish.sub(forward);
        if (keys.KeyD) wish.add(right);
        if (keys.KeyA) wish.sub(right);
        const wishLen = wish.length();
        if (wishLen > 0) wish.normalize();

        const crouchHeld = keys.ControlLeft || keys.ControlRight || keys.KeyC;
        if (!player.sliding && crouchHeld && player.onGround && wishLen > 0.1) {
          player.sliding = true;
          player.slideTimer = 0;
          const boost = Math.max(SPRINT_SPEED, SLIDE_SPEED);
          player.vel.x = wish.x * boost;
          player.vel.z = wish.z * boost;
        }
        if (player.sliding && !crouchHeld) player.sliding = false;

        if (player.sliding) {
          const steer = 6 * dt;
          player.vel.x += wish.x * steer;
          player.vel.z += wish.z * steer;
          const s = Math.hypot(player.vel.x, player.vel.z);
          if (s > SLIDE_FRICTION_MIN) {
            const decay = Math.pow(SLIDE_DECAY, dt * 60);
            player.vel.x *= decay;
            player.vel.z *= decay;
          }
          player.slideTimer += dt;
          if (player.slideTimer > 1.4 && Math.hypot(player.vel.x, player.vel.z) < SPRINT_SPEED) player.sliding = false;
          setSliding(true);
        } else {
          setSliding(false);
          const maxSpd = keys.ShiftLeft ? SPRINT_SPEED : WALK_SPEED;
          if (player.onGround) {
            const friction = 10 * dt;
            const cur = Math.hypot(player.vel.x, player.vel.z);
            if (cur > 0.01) {
              const drop = Math.max(0, cur - maxSpd) * (1 - Math.pow(1 - friction, 1)) + friction * 0.6;
              const k = Math.max(0, cur - drop) / cur;
              player.vel.x *= k;
              player.vel.z *= k;
            }
          }
          const accel = player.onGround ? 55 : 25;
          if (wishLen > 0) {
            const desired = maxSpd;
            const curWish = player.vel.x * wish.x + player.vel.z * wish.z;
            const add = Math.min(accel * dt, Math.max(0, desired - curWish));
            player.vel.x += wish.x * add;
            player.vel.z += wish.z * add;
          }
        }

        if (keys.Space && player.onGround) {
          player.vel.y = JUMP_V;
          player.onGround = false;
        }
        player.vel.y -= GRAVITY * dt;

        const nx = player.pos.x + player.vel.x * dt;
        const nz = player.pos.z + player.vel.z * dt;
        if (!collidesCube(nx, player.pos.z, RADIUS)) player.pos.x = nx;
        else player.vel.x *= -0.2;
        if (!collidesCube(player.pos.x, nz, RADIUS)) player.pos.z = nz;
        else player.vel.z *= -0.2;

        player.pos.y += player.vel.y * dt;
        const targetEye = player.sliding ? CROUCH_EYE : PLAYER_EYE;
        player.eye += (targetEye - player.eye) * Math.min(1, dt * 14);
        if (player.pos.y <= player.eye) { player.pos.y = player.eye; player.vel.y = 0; player.onGround = true; }

        if (firing) fire();
      }

      camera.position.copy(player.pos);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = player.yaw;
      camera.rotation.x = player.pitch;

      botStep(dt);
      interpRemotes(dt);
      bulletStep(dt, startT);

      broadcastAcc += dt;
      if (broadcastAcc > 0.08) {
        broadcastAcc = 0;
        channelRef.current?.send({
          type: 'broadcast', event: 'state',
          payload: { id: me.id, name: me.name, color: me.color, x: player.pos.x, z: player.pos.z, yaw: player.yaw, hp: player.hp },
        });
      }

      hudTick += dt;
      if (hudTick > 0.15) {
        hudTick = 0;
        if (status === 'playing') setTime(Math.round((performance.now() - startT) / 1000));
        setSpeed(Math.round(Math.hypot(player.vel.x, player.vel.z) * 10) / 10);
      }

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      window.removeEventListener('mouseup', onMU);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerlockchange', onLock);
      document.removeEventListener('mousemove', onMM);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('mousedown', onMD);
      channel.unsubscribe();
      renderer.dispose();
      mount.innerHTML = '';
    };
  }, []);

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="slipshot">
      <div className="slipshot-bar">
        <span>HP <b style={{color: hp < 30 ? '#ff4d6d' : 'var(--text)'}}>{hp}</b></span>
        <span>Ammo <b>{ammo}</b>/{WEAPONS[weapon].ammo}</span>
        <span>Kills <b style={{color: 'var(--accent)'}}>{kills}</b>/{WIN_KILLS}</span>
        <span>Others <b>{remote}</b></span>
        <span>Time <b>{fmtTime(time)}</b></span>
        <span>Speed <b>{speed}</b></span>
        {sliding && <span className="slipshot-tag">SLIDE</span>}
        <span className="slipshot-wselect">
          <span className={weapon === 'pulse' ? 'is-active' : ''}>1 · Pulse</span>
          <span className={weapon === 'slug' ? 'is-active' : ''}>2 · Slug</span>
        </span>
      </div>
      <div className="slipshot-mount" ref={mountRef}>
        {!locked && status === 'playing' && (
          <div className="slipshot-overlay">
            <div className="slipshot-title">Click to enter the arena</div>
            <div className="slipshot-sub">
              <b>WASD</b> move · <b>Mouse</b> look · <b>Shift</b> sprint · <b>Ctrl</b> slide · <b>Space</b> jump
              (slide → jump = slidehop) · <b>1/2/Q</b> switch weapons · <b>R</b> reload · <b>Click</b> fire · <b>Esc</b> release
            </div>
          </div>
        )}
        {status === 'won' && (
          <div className="slipshot-overlay">
            <div className="slipshot-title" style={{color: 'var(--accent)'}}>Round cleared · {kills} kills · {fmtTime(time)}</div>
            <div className="slipshot-sub">Score submitted. Click to queue another round.</div>
          </div>
        )}
        {status === 'dead' && (
          <div className="slipshot-overlay">
            <div className="slipshot-title" style={{color: '#ff4d6d'}}>Down</div>
            <div className="slipshot-sub">Respawning…</div>
          </div>
        )}
      </div>
      <div className="slipshot-hint">First to {WIN_KILLS} kills wins · faster clears score higher · slidehop to chain momentum</div>
    </div>
  );
}
