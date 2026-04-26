// ERA LANE — original lane tug-of-war strategy game.
//
//  • Single lane, your base on the left, enemy base on the right.
//  • Earn gold over time and from enemy kills. Tap unit buttons to spawn.
//  • Three unit archetypes: Scout (cheap, fast, weak), Spear (medium),
//    Heavy (expensive, slow, punches through). Each costs gold + cooldown.
//  • Destroy the enemy base before they destroy yours. Five "eras" of
//    escalating enemy aggression.
//  • Touch-native: taps on big buttons. Works on mobile in landscape.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { sizeCanvasFluid } from '../util/canvasDpr.js';

// Default render dimensions; the fluid sizer overrides view.w / view.h
// on every fit. Lane left/right are recomputed off the live width so
// the bases always sit a fixed margin from the edges.
const W = 820;
const H = 420;
const LANE_MARGIN = 110;        // distance from base to canvas edge
const GROUND_BOTTOM_PAD = 100;  // ground sits this far above the bottom
const BASE_HP = 500;

const UNITS = {
  scout: { name: 'Scout',  cost: 40,  cd: 0.9, hp: 35,  dmg: 6,   speed: 66, range: 22, color: '#35f0c9', w: 18, h: 22 },
  spear: { name: 'Spear',  cost: 75,  cd: 1.8, hp: 80,  dmg: 14,  speed: 48, range: 28, color: '#ffe14f', w: 22, h: 26 },
  heavy: { name: 'Heavy',  cost: 140, cd: 3.6, hp: 200, dmg: 26,  speed: 28, range: 26, color: '#ff4d6d', w: 28, h: 32 },
};

const ERA_GOALS = [100, 220, 360, 520, 700];  // destroy enemy base hp at different player-dmg thresholds (unused — era advances over time)
const ERA_TICKS = [0, 30, 60, 100, 150];       // seconds when era increments
const GOLD_RATE_PER_ERA = [12, 14, 16, 19, 22]; // gold/sec at each era
const ENEMY_BUDGET_PER_ERA = [0.6, 1.0, 1.4, 1.8, 2.4]; // enemy aggression multiplier

const unitDraw = (ctx, u, x, y, side) => {
  // legs
  ctx.fillStyle = side === 'me' ? u.color : '#fff';
  ctx.fillRect(x - u.w / 2, y - u.h / 2, u.w, u.h * 0.55);
  // head
  ctx.beginPath();
  ctx.arc(x, y - u.h / 2 - 6, 7, 0, Math.PI * 2);
  ctx.fill();
  // weapon direction
  ctx.strokeStyle = '#0a0d0e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const wx = side === 'me' ? 12 : -12;
  ctx.moveTo(x + wx * 0.25, y - 6);
  ctx.lineTo(x + wx, y - 10);
  ctx.stroke();
  // hp bar
  const hpR = u.hpCur / u.hp;
  ctx.fillStyle = '#0008';
  ctx.fillRect(x - 14, y - u.h / 2 - 18, 28, 3);
  ctx.fillStyle = hpR > 0.5 ? '#35f0c9' : hpR > 0.25 ? '#ffe14f' : '#ff4d6d';
  ctx.fillRect(x - 14, y - u.h / 2 - 18, 28 * Math.max(0, hpR), 3);
};

export default function EraLaneGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const viewRef = useRef({ w: W, h: H, laneLeft: LANE_MARGIN, laneRight: W - LANE_MARGIN, groundY: H - GROUND_BOTTOM_PAD });
  const [gold, setGold] = useState(120);
  const [myHP, setMyHP] = useState(BASE_HP);
  const [enemyHP, setEnemyHP] = useState(BASE_HP);
  const [era, setEra] = useState(1);
  const [cds, setCds] = useState({ scout: 0, spear: 0, heavy: 0 });
  const [time, setTime] = useState(0);
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  const submittedRef = useRef(false);

  const reset = () => {
    stateRef.current = {
      myUnits: [],
      enemyUnits: [],
      gold: 120,
      myHP: BASE_HP,
      enemyHP: BASE_HP,
      cds: { scout: 0, spear: 0, heavy: 0 },
      enemyCd: 2.5,
      lastTime: performance.now(),
      elapsed: 0,
      era: 1,
      goldAcc: 0,
      particles: [],
      unitId: 0,
    };
    setGold(120); setMyHP(BASE_HP); setEnemyHP(BASE_HP);
    setEra(1); setCds({ scout: 0, spear: 0, heavy: 0 });
    setTime(0); setStatus('playing');
    submittedRef.current = false;
  };

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const spawnMine = (kind) => {
    const s = stateRef.current; if (!s || status !== 'playing') return;
    const u = UNITS[kind];
    if (s.gold < u.cost) return;
    if (s.cds[kind] > 0) return;
    s.gold -= u.cost;
    s.cds[kind] = u.cd;
    setGold(s.gold);
    setCds({ ...s.cds });
    const v = viewRef.current;
    const id = ++s.unitId;
    s.myUnits.push({
      ...u, kind,
      id,
      x: v.laneLeft + 10,
      y: v.groundY,
      side: 'me',
      hpCur: u.hp,
      atkCd: 0,
      laneY: ((id % 3) - 1) * 2,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    // Fluid sizer — lane endpoints stay a fixed margin from each edge
    // so a wider canvas just means more room for the fight to stretch
    // across. Ground sits a fixed distance from the bottom.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      const w = cssW, h = cssH;
      viewRef.current = {
        w, h,
        laneLeft: LANE_MARGIN,
        laneRight: w - LANE_MARGIN,
        groundY: h - GROUND_BOTTOM_PAD,
      };
      // Stick existing units onto the new ground; clamp positions inside
      // the new lane so a shrink doesn't strand anyone past a base.
      const s = stateRef.current; if (!s) return;
      const v = viewRef.current;
      [...s.myUnits, ...s.enemyUnits].forEach((u) => {
        u.y = v.groundY;
        u.x = Math.max(v.laneLeft - 30, Math.min(v.laneRight + 30, u.x));
      });
    });

    const clock = { last: performance.now() };
    let raf = 0;

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const v = viewRef.current;
      const W = v.w, H = v.h, GROUND_Y = v.groundY, LANE_LEFT = v.laneLeft, LANE_RIGHT = v.laneRight;

      // sky
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      const eraIdx = Math.min(4, s.era - 1);
      const eraTints = [
        ['#ff8a3a', '#c84d1a'], // Era 1 — dusk
        ['#dba85a', '#8a4a1a'], // Era 2
        ['#86758a', '#3a2044'], // Era 3
        ['#3c5777', '#121f2f'], // Era 4
        ['#1a2f4f', '#0a0612'], // Era 5
      ];
      grad.addColorStop(0, eraTints[eraIdx][0]);
      grad.addColorStop(1, eraTints[eraIdx][1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // mountains
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.moveTo(0, 250);
      for (let i = 0; i <= 10; i++) {
        const x = i * (W / 10);
        const y = 230 + ((i * 37) % 60);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, GROUND_Y);
      ctx.lineTo(0, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // ground
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.fillStyle = '#1e1608';
      for (let x = 0; x < W; x += 22) ctx.fillRect(x, GROUND_Y + 10, 2, 6);

      // bases
      const drawBase = (x, label, hp, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x - 38, GROUND_Y - 86, 76, 86);
        ctx.strokeStyle = '#0a0d0e';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 38, GROUND_Y - 86, 76, 86);
        // crenellations
        for (let k = 0; k < 4; k++) {
          ctx.fillRect(x - 36 + k * 20, GROUND_Y - 94, 10, 8);
        }
        // flag
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y - 86); ctx.lineTo(x, GROUND_Y - 116);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y - 116);
        ctx.lineTo(x + 20, GROUND_Y - 110);
        ctx.lineTo(x, GROUND_Y - 104);
        ctx.closePath();
        ctx.fill();
        // hp bar
        const hpR = hp / BASE_HP;
        ctx.fillStyle = '#0008';
        ctx.fillRect(x - 38, GROUND_Y - 102, 76, 4);
        ctx.fillStyle = hpR > 0.5 ? '#35f0c9' : hpR > 0.25 ? '#ffe14f' : '#ff4d6d';
        ctx.fillRect(x - 38, GROUND_Y - 102, 76 * Math.max(0, hpR), 4);
        ctx.fillStyle = '#fff';
        ctx.font = '11px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, GROUND_Y + 28);
      };
      drawBase(LANE_LEFT - 50, 'YOU',    s.myHP,    '#00e5dd');
      drawBase(LANE_RIGHT + 50, 'ENEMY', s.enemyHP, '#ff4d6d');

      // units — laneY stagger keeps overlapping units from z-fighting
      [...s.myUnits, ...s.enemyUnits].forEach((u) => unitDraw(ctx, u, u.x, u.y + (u.laneY || 0), u.side));

      // particles
      s.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 30));
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        ctx.globalAlpha = 1;
      });

      // era label
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '14px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`— ERA ${s.era} —`, W / 2, 30);
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s) return;
      const v = viewRef.current;
      const LANE_LEFT = v.laneLeft, LANE_RIGHT = v.laneRight, GROUND_Y = v.groundY;

      if (status === 'playing') {
        s.elapsed += dt;
        // Era progression
        const newEra = Math.min(5, 1 + ERA_TICKS.filter((t, i) => i > 0 && s.elapsed >= t).length);
        if (newEra !== s.era) {
          s.era = newEra;
          setEra(newEra);
        }

        // Gold accrual
        s.goldAcc += GOLD_RATE_PER_ERA[s.era - 1] * dt;
        if (s.goldAcc >= 1) {
          const add = Math.floor(s.goldAcc);
          s.goldAcc -= add;
          s.gold = Math.min(999, s.gold + add);
          setGold(s.gold);
        }

        // Cooldowns
        let cdChanged = false;
        Object.keys(s.cds).forEach((k) => {
          if (s.cds[k] > 0) { s.cds[k] = Math.max(0, s.cds[k] - dt); cdChanged = true; }
        });
        if (cdChanged) setCds({ ...s.cds });

        // Enemy AI: spawns from right
        s.enemyCd -= dt;
        if (s.enemyCd <= 0) {
          const budget = ENEMY_BUDGET_PER_ERA[s.era - 1];
          const r = Math.random();
          let kind = 'scout';
          if (r < 0.15 * budget) kind = 'heavy';
          else if (r < 0.55 * budget) kind = 'spear';
          const u = UNITS[kind];
          const eid = ++s.unitId;
          s.enemyUnits.push({
            ...u, kind,
            id: eid,
            x: LANE_RIGHT - 10,
            y: GROUND_Y,
            side: 'enemy',
            hpCur: u.hp,
            atkCd: 0,
            laneY: ((eid % 3) - 1) * 2,
          });
          s.enemyCd = 2.4 / budget + Math.random() * 1.2;
        }

        // Unit updates (movement + combat)
        const stepUnits = (own, foes, foeBaseX) => {
          for (const u of own) {
            if (u.hpCur <= 0) continue;
            // Find nearest foe in range or the base
            let target = null, tgtD = Infinity, targetBase = false;
            const dir = u.side === 'me' ? 1 : -1;
            for (const f of foes) {
              if (f.hpCur <= 0) continue;
              const d = f.x - u.x;
              const forward = dir > 0 ? d > 0 : d < 0;
              if (!forward) continue;
              const ad = Math.abs(d);
              if (ad < tgtD) { target = f; tgtD = ad; }
            }
            const baseD = Math.abs(foeBaseX - u.x);
            if (baseD < tgtD) { target = null; tgtD = baseD; targetBase = true; }

            if (tgtD > u.range) {
              // Advance
              u.x += dir * u.speed * dt;
            } else {
              // Attack
              u.atkCd -= dt;
              if (u.atkCd <= 0) {
                u.atkCd = 0.6;
                if (targetBase) {
                  if (u.side === 'me') { s.enemyHP -= u.dmg; setEnemyHP(Math.max(0, s.enemyHP)); }
                  else                 { s.myHP    -= u.dmg; setMyHP(Math.max(0, s.myHP)); }
                  // Spark
                  s.particles.push({ x: foeBaseX, y: GROUND_Y - 40, vx: -dir * 60 * Math.random(), vy: -80 - Math.random() * 80, life: 24, color: '#ffe14f' });
                } else if (target) {
                  target.hpCur -= u.dmg;
                  if (target.hpCur <= 0) {
                    // Gold reward for player kills
                    if (u.side === 'me') {
                      const reward = Math.max(8, Math.floor(target.cost * 0.25));
                      s.gold = Math.min(999, s.gold + reward);
                      setGold(s.gold);
                    }
                    for (let k = 0; k < 10; k++) {
                      s.particles.push({ x: target.x, y: target.y - 10, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 80, life: 22, color: '#ff4d6d' });
                    }
                  }
                }
              }
            }
          }
        };
        stepUnits(s.myUnits, s.enemyUnits, LANE_RIGHT + 50);
        stepUnits(s.enemyUnits, s.myUnits, LANE_LEFT - 50);

        // Same-side inter-unit repulsion so stacked friendlies fan out
        // along the lane instead of reading as a single sprite. O(n²)
        // is fine — units.length is typically <30. Opposite-side pairs
        // are skipped so combat distance stays untouched.
        const UNIT_SPACING = 22;
        const repel = (arr) => {
          for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
              const a = arr[i], b = arr[j];
              if (a.hpCur <= 0 || b.hpCur <= 0) continue;
              const delta = a.x - b.x;
              const ad = Math.abs(delta);
              if (ad < UNIT_SPACING) {
                const push = (UNIT_SPACING - ad) / 2;
                if (delta >= 0) { a.x += push; b.x -= push; }
                else            { a.x -= push; b.x += push; }
              }
            }
          }
        };
        repel(s.myUnits);
        repel(s.enemyUnits);

        s.myUnits   = s.myUnits.filter((u)   => u.hpCur > 0);
        s.enemyUnits = s.enemyUnits.filter((u) => u.hpCur > 0);

        // particles
        s.particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= 1; });
        s.particles = s.particles.filter((p) => p.life > 0);

        // Win/lose
        if (s.enemyHP <= 0 && !submittedRef.current) {
          submittedRef.current = true;
          setStatus('won');
          const score = Math.max(0, 1200 - Math.round(s.elapsed) * 4);
          submitScore('aow', score, { era: s.era, time: Math.round(s.elapsed) });
        } else if (s.myHP <= 0 && !submittedRef.current) {
          submittedRef.current = true;
          setStatus('lost');
          const score = Math.max(0, Math.round(s.elapsed) * 6);
          submitScore('aow', score, { era: s.era, time: Math.round(s.elapsed), defeat: true });
        }

        setTime(Math.round(s.elapsed));
      }

      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const button = (kind) => {
    const u = UNITS[kind];
    const disabled = gold < u.cost || cds[kind] > 0 || status !== 'playing';
    return (
      <button key={kind} className={'era-btn' + (disabled ? ' is-disabled' : '')} onClick={() => spawnMine(kind)}>
        <div className="era-btn-name" style={{color: u.color}}>{u.name}</div>
        <div className="era-btn-cost">{u.cost}g</div>
        {cds[kind] > 0 && <div className="era-btn-cd" style={{width: `${Math.min(100, (cds[kind] / u.cd) * 100)}%`}}/>}
      </button>
    );
  };

  return (
    <div className="era" style={{ width: '100%', height: '100%' }}>
      <div className="era-bar">
        <span>Gold <b style={{color:'var(--accent)'}}>{gold}</b></span>
        <span>Era <b>{era}/5</b></span>
        <span>Time <b>{time}s</b></span>
        <span>You <b>{myHP}</b></span>
        <span>Enemy <b>{enemyHP}</b></span>
        {status !== 'playing' && (
          <button className="btn btn-primary btn-sm" onClick={reset}>Play again</button>
        )}
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="era-canvas"/>
      </div>
      <div className="era-buttons">
        {button('scout')}
        {button('spear')}
        {button('heavy')}
      </div>
      {status !== 'playing' && (
        <div className="era-result">
          <b style={{color: status === 'won' ? 'var(--accent)' : '#ff4d6d'}}>
            {status === 'won' ? 'Enemy base destroyed' : 'Your base fell'}
          </b>
          {' · Era '}<b>{era}</b>{' · '}<b>{time}s</b>
        </div>
      )}
      <div className="era-hint">Tap a unit to spawn from your base · gold grows over time · destroy the enemy base to win</div>
    </div>
  );
}
