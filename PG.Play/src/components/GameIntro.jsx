import { lazy, Suspense, useEffect, useState } from 'react';
import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';
import GameShell from './GameShell.jsx';
import { useIsMobile } from '../input/useVirtualControls.jsx';

// Code-split every game so opening the lobby doesn't pull in Three.js or
// game-specific bundles. Games load on demand when the player clicks play.
const PLAYABLE = {
  connect4:   lazy(() => import('../games/Connect4Game.jsx')),
  eightball:  lazy(() => import('../games/EightBallGame.jsx')),
  g2048:      lazy(() => import('../games/Game2048.jsx')),
  cutrope:    lazy(() => import('../games/CutRopeGame.jsx')),
  hook:       lazy(() => import('../games/SwingwireGame.jsx')),
  fps:        lazy(() => import('../games/RaycasterFPS.jsx')),
  grudgewood: lazy(() => import('../games/GrudgewoodGame.jsx')),
  arena:      lazy(() => import('../games/ArenaGame.jsx')),
  slipshot:   lazy(() => import('../games/SlipshotGame.jsx')),
  slither:    lazy(() => import('../games/SlitherLiteGame.jsx')),
  basket:     lazy(() => import('../games/HoopShotGame.jsx')),
  aow:        lazy(() => import('../games/EraLaneGame.jsx')),
  bloons:     lazy(() => import('../games/LoftDefenseGame.jsx')),
  vex:        lazy(() => import('../games/TraceGame.jsx')),
  bob:        lazy(() => import('../games/NightShiftGame.jsx')),
  goalbound:  lazy(() => import('../games/GoalboundGame.jsx')),
  fbwg:       lazy(() => import('../games/EmberTideGame.jsx')),
  badicecream: lazy(() => import('../games/FrostFightGame.jsx')),
  papa:        lazy(() => import('../games/ShortOrderGame.jsx')),
  happywheels: lazy(() => import('../games/FaceplantGame.jsx')),
};

// Per-game shell content. Keeps the shell generic while each game gets
// tailored goals / controls / tips in the companion panel.
const SHELL_CONFIG = {
  goalbound: {
    goals: {
      lead: 'Outscore your rival in 60 seconds — or sudden-death golden goal if you can’t.',
      bullets: [
        'First to 3 goals wins early.',
        'Wall-bounces are legal — use them for impossible angles.',
        'Hold kick to charge; release near the ball for a curler.',
      ],
    },
    controls: [
      { title: 'Player 1', items: [
        { keys: ['A','D'], label: 'Move left / right' },
        { keys: ['W'],     label: 'Jump' },
        { keys: ['S'],     label: 'Kick (hold to charge)' },
      ]},
      { title: 'Player 2', items: [
        { keys: ['←','→'], label: 'Move left / right' },
        { keys: ['↑'],     label: 'Jump' },
        { keys: ['/'],     label: 'Kick (hold to charge)' },
      ]},
      { title: 'Shell', items: [
        { keys: ['P'], label: 'Pause / resume' },
        { keys: ['R'], label: 'Restart match' },
        { keys: ['M'], label: 'Mute / unmute' },
        { keys: ['F'], label: 'Fullscreen' },
      ]},
    ],
    tips: [
      'Jumping keepers clear deep crosses but leave the line open.',
      'A running kick curves slightly up and away — great for finishes.',
      'On mobile, long-press Kick for a charged power shot.',
    ],
  },
  grudgewood: {
    goals: {
      lead: 'Walk home through a forest that has plans. 3D third-person; the trees remember every visit.',
      bullets: [
        'Six biomes — Mosswake, Rotbog, Heart, Trickster Grove, the Cliffside, the Axe Sanctum.',
        'Trap language: branch whips, root snares, pressure mushrooms, rolling logs, predator trees, fake stumps.',
        'Checkpoints between segments. Every lethal hazard has a tell — the forest is fair, not kind.',
        'Find the secret hats. Earn the axe. Bring it through the Sanctum.',
      ],
    },
    controls: [
      { title: 'Movement', items: [
        { keys: ['A','D','←','→'], label: 'Walk left / right' },
        { keys: ['Shift'],          label: 'Sprint' },
        { keys: ['Space','W','↑'],  label: 'Jump' },
      ]},
      { title: 'Shell', items: [
        { keys: ['P'], label: 'Pause' },
        { keys: ['R'], label: 'Restart run' },
        { keys: ['M'], label: 'Mute' },
        { keys: ['F'], label: 'Fullscreen' },
      ]},
    ],
    tips: [
      'Sprint is a commitment — many traps trigger on speed.',
      'A creaking branch is a 200 ms warning. A pulsing mushroom cap is your last chance to leave.',
      'Stumps lie about being stumps. Watch the rim.',
      'On mobile the d-pad + Jump dispatch the same keys as the keyboard.',
    ],
  },
  hook: {
    goals: {
      lead: 'Reach the OUT portal at the end of each course. One button. Don’t touch anything solid.',
      bullets: [
        'Hold to fire a wire at the nearest overhead anchor.',
        'Release to detach — late releases arc farther than early ones.',
        'Three courses: Night Shift, Flux, Last Call. Splat = respawn at last checkpoint.',
      ],
    },
    controls: [
      { title: 'Wire', items: [
        { keys: ['Space','W','↑'], label: 'Hold to swing' },
        { keys: ['Click'],         label: 'Hold mouse to swing' },
        { keys: ['Tap'],           label: 'Hold the on-screen pad' },
      ]},
      { title: 'Shell', items: [
        { keys: ['P'], label: 'Pause' },
        { keys: ['R'], label: 'Restart course' },
        { keys: ['M'], label: 'Mute' },
        { keys: ['F'], label: 'Fullscreen' },
      ]},
    ],
    tips: [
      'The wire auto-aims to anchors above and ahead of your motion — you can’t mis-target.',
      'Speed comes from gravity. Let go at the bottom of the arc to launch flat and far.',
      'On mobile the wire button on the right does the same thing as Space.',
    ],
  },
  slipshot: {
    goals: {
      lead: 'Three minutes of pure momentum. The combo meter decays the moment you stop.',
      bullets: ['Bronze is a clean run.', 'Silver chains slides.', 'Gold is flow.'],
    },
    controls: [
      { title: 'Movement', items: [
        { keys: ['WASD'],  label: 'Move' },
        { keys: ['Space'], label: 'Jump' },
        { keys: ['Shift'], label: 'Slide (ground) / Airdash (air)' },
        { keys: ['Mouse'], label: 'Aim' },
      ]},
      { title: 'Combat', items: [
        { keys: ['LMB'],       label: 'Fire' },
        { keys: ['1','2','Q'], label: 'Swap weapon' },
        { keys: ['R'],         label: 'Reload' },
      ]},
    ],
    tips: [
      'Airborne kills refund the dash — chain dash→kill→dash.',
      'Pulse spread tightens while moving; standing still costs accuracy.',
      'A kill within 1.5s keeps the combo climbing toward ×3.',
    ],
  },
  arena: {
    goals: { lead: 'Five kills to win. Real players drop in live.', bullets: ['Walls are friends.', 'Predict — don’t trust the crosshair.'] },
    controls: [
      { title: 'Controls', items: [
        { keys: ['WASD'],  label: 'Move' },
        { keys: ['Mouse'], label: 'Aim' },
        { keys: ['Click'], label: 'Fire' },
      ]},
    ],
    tips: ['Never stand still.', 'Bots are training wheels — real players arrive unannounced.'],
  },

  // Co-op / story
  fbwg: {
    goals: {
      lead: 'Collect every gem, reach your own door together.',
      bullets: ['Ember burns — stay out of water.', 'Tide cools — stay out of fire.', 'Acid kills both. Share a keyboard.'],
    },
    controls: [
      { title: 'Ember (P1)', items: [
        { keys: ['A','D'], label: 'Move' },
        { keys: ['W'],     label: 'Jump' },
      ]},
      { title: 'Tide (P2)', items: [
        { keys: ['←','→'], label: 'Move' },
        { keys: ['↑'],     label: 'Jump' },
      ]},
    ],
    tips: ['If one falls, both restart the room.', 'Blue doors for Tide. Red doors for Ember.'],
  },

  bob: {
    goals: {
      lead: 'Reach the green exit without filling the detection meter.',
      bullets: ['Vision cones fill the meter fast if you stand still.', 'Tiptoe (Shift) halves detection rate.', 'Three floors. Three nights.'],
    },
    controls: [
      { title: 'Movement', items: [
        { keys: ['A','D'],   label: 'Walk' },
        { keys: ['Shift'],   label: 'Tiptoe' },
        { keys: ['R'],       label: 'Restart floor' },
      ]},
    ],
    tips: ['Read the patrol loop before you enter the cone.', 'Tiptoeing past a guard beats sprinting past three.'],
  },

  badicecream: {
    goals: {
      lead: 'Collect every fruit piece, then step on the open door.',
      bullets: ['Freeze the tile you face to seal a corridor.', 'Melt an ice block you made to re-open the path.', 'Strawberries are fast; blueberries are patient.'],
    },
    controls: [
      { title: 'Movement', items: [
        { keys: ['WASD'],  label: 'Step tile-to-tile' },
        { keys: ['Space'], label: 'Freeze / melt' },
      ]},
    ],
    tips: ['Commit — you can’t change direction mid-step.', 'Trap fruit between two walls and walk around.'],
  },

  aow: {
    goals: {
      lead: 'Destroy the enemy base before they destroy yours.',
      bullets: ['Gold regenerates on a clock.', 'Scouts are cheap; Spears trade up; Heavies break the wall.', 'Every 30 seconds the enemy escalates.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['Tap'],   label: 'Spawn unit (bottom bar)' },
        { keys: ['Tap'],   label: 'Buy tech (top right)' },
      ]},
    ],
    tips: ['Don’t empty your gold — one upgrade late is fatal.', 'Heavies in front, scouts behind. Always.'],
  },

  vex: {
    goals: {
      lead: 'Reach the green flag. Die fast. Respawn faster.',
      bullets: ['Six rooms, each a fresh idea.', 'Wall-slide, wall-jump, coyote-time — the kit forgives you.', 'Spikes and saws = instant restart.'],
    },
    controls: [
      { title: 'Movement', items: [
        { keys: ['A','D'], label: 'Run' },
        { keys: ['Space'], label: 'Jump / wall-jump' },
      ]},
    ],
    tips: ['Hold jump for height.', 'Wall-slide holds you if you press into the wall.'],
  },

  papa: {
    goals: {
      lead: 'Clear tickets. Don’t run out of time. Don’t tap the wrong step.',
      bullets: ['Each ticket has a strict recipe — left to right.', 'Wrong tap = four-second timer penalty.', 'Tip = 10 + seconds left on clear.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['Tap'],       label: 'Action button' },
        { keys: ['Mouse'],     label: 'Click to act' },
      ]},
    ],
    tips: ['Memorise the recipe at a glance before the first tap.', 'The leftmost ticket is always the active one.'],
  },

  g2048: {
    goals: {
      lead: 'Slide tiles. Merge matching numbers. Get to 2048.',
      bullets: ['Board never rotates — plan your corner.', 'Every move spawns a 2 or 4.', 'Lock yourself out and the run ends.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['Arrows','WASD'], label: 'Slide the board' },
        { keys: ['Swipe'],         label: 'Slide (mobile)' },
      ]},
    ],
    tips: ['Pick a corner and anchor your largest tile there.', 'Never use Up unless you really have to.'],
  },

  cutrope: {
    goals: {
      lead: 'Cut the rope. Feed the candy to Om Nom.',
      bullets: ['Stars on the candy’s path are bonus — grab all three.', 'Gravity and momentum are yours to use.', 'Three hand-tuned levels.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['Click','Drag'], label: 'Slice across the rope' },
        { keys: ['Touch','Drag'], label: 'Slice (mobile)' },
      ]},
    ],
    tips: ['The candy keeps the velocity it had at cut.', 'Sometimes the ugly angle is the only angle.'],
  },

  bloons: {
    goals: {
      lead: 'Hold the line. Ten waves. Three tower types.',
      bullets: ['Tap empty ground to place a tower.', 'Tap a tower to upgrade or sell.', 'Every leak costs a life.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['Tap','Click'], label: 'Place / upgrade / sell' },
      ]},
    ],
    tips: ['Splash is great against bunched waves, wasted on fast singles.', 'Slow towers at the chokepoint. Damage towers on the straights.'],
  },

  slither: {
    goals: {
      lead: 'Eat orbs. Grow. Don’t touch another snake.',
      bullets: ['Other snakes die the same way you do.', 'Bigger = slower, but also a wall.', 'No levels. Just one run.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['Mouse','Touch'], label: 'Steer toward cursor' },
        { keys: ['WASD','Arrows'], label: 'Hard steer' },
      ]},
    ],
    tips: ['Encircle a smaller snake and it has nowhere to go.', 'Leave dead snake orbs for a quick size spike.'],
  },

  happywheels: {
    goals: {
      lead: 'Reach the green flag. Keep the rider alive.',
      bullets: ['Three spike fields between you and the finish.', 'Lean into hills, lean back off drops.', 'Faster clears score higher.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['D'],     label: 'Throttle' },
        { keys: ['A'],     label: 'Brake / reverse' },
        { keys: ['W','S'], label: 'Lean forward / back' },
      ]},
    ],
    tips: ['Air-lean early. Corrections in the air are expensive.', 'A dead rider is a slow restart.'],
  },

  fps: {
    goals: {
      lead: 'Clear the corridor. Four drifting enemies. One gun.',
      bullets: ['Classic fake-3D Wolfenstein-style.', 'Enemies drift and fire — strafe and hold the line.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['WASD'],          label: 'Move' },
        { keys: ['Arrows','Mouse'], label: 'Turn' },
        { keys: ['Click','Space'], label: 'Fire' },
      ]},
    ],
    tips: ['Strafe, don’t circle — the raycaster rewards side-to-side.', 'Back off when ammo is low; they push, too.'],
  },

  connect4: {
    goals: {
      lead: 'Four in a row wins — horizontal, vertical, or diagonal.',
      bullets: ['Red moves first.', 'Bot thinks three moves ahead.', 'Best of three.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['Click','Tap'], label: 'Drop in a column' },
      ]},
    ],
    tips: ['Two open threats = one forced win.', 'Control the centre column; the diagonals follow.'],
  },

  eightball: {
    goals: {
      lead: 'Rack, break, claim your suit, leave the 8-ball for last.',
      bullets: ['Pocket your suit first.', 'Sink the 8-ball early and you lose.', 'Scratches on the cue pay out — drop back to hand.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['Move'],  label: 'Aim line follows the pointer' },
        { keys: ['Hold'],  label: 'Charge power' },
        { keys: ['Release'], label: 'Shoot' },
      ]},
    ],
    tips: ['Leaving yourself a shot is half the game.', 'Soft is safer than hard when the cue is in a tight spot.'],
  },

  basket: {
    goals: {
      lead: 'Ninety seconds. One sliding hoop. Drag, release, swish.',
      bullets: ['Swishes score 3; rim kisses score 2.', 'Streaks stack a small bonus per consecutive make.', 'Hoop speeds up as your score climbs.'],
    },
    controls: [
      { title: 'Controls', items: [
        { keys: ['Press','Drag'],   label: 'Pull back to aim + power' },
        { keys: ['Release'],        label: 'Shoot' },
      ]},
    ],
    tips: ['Further drag = more power, higher arc.', 'Anticipate the hoop. Never aim at where it is now.'],
  },
};

const MODE_OPTIONS = {
  goalbound: () => [
    { id: 'arcade',   label: 'Enter Goalbound',  tone: 'primary' },
    { id: 'shootout', label: 'Penalty Shootout', tone: 'ghost' },
  ],
  _vsDefault: (game) => [
    { id: '2p',  label: game.players.includes('1-8') ? 'Join arena' : '2 Player', tone: 'primary' },
    ...(game.players.includes('1-8') ? [] : [{ id: 'bot', label: 'vs Bot', tone: 'ghost' }]),
  ],
  _storyDefault: (game) => [
    { id: 'start', label: game.players.includes('co-op') ? 'Start Co-op' : 'Start Story', tone: 'primary' },
  ],
};

const getModeOptions = (game) => {
  if (MODE_OPTIONS[game.id]) return MODE_OPTIONS[game.id](game);
  if (game.kind === 'vs') return MODE_OPTIONS._vsDefault(game);
  return MODE_OPTIONS._storyDefault(game);
};

function PlayPlaceholder({ game }) {
  const Cover = GAME_COVERS[game.id];
  return (
    <div className="play-placeholder">
      <div className="play-placeholder-art">{Cover && <Cover/>}</div>
      <div>
        <div className="play-placeholder-kicker">Coming soon</div>
        <div className="play-placeholder-title">Chapter queued</div>
        <div className="play-placeholder-sub">
          The playable build for {game.name} ships in a future update. Try
          {' '}<b>Goalbound</b>, <b>Slipshot</b>, or <b>Grudgewood</b> in the meantime.
        </div>
      </div>
    </div>
  );
}

function LoadingGame({ game }) {
  return (
    <div className="play-placeholder play-placeholder-loading" role="status" aria-live="polite">
      <div className="play-placeholder-kicker">Loading</div>
      <div className="play-placeholder-title">{game.name}</div>
      <div className="play-placeholder-pulse" aria-hidden="true"/>
    </div>
  );
}

export default function GameIntro({ game, best, onClose }) {
  const [stage, setStage]        = useState('intro');
  const [mode, setMode]          = useState(null);
  const [restartKey, setRestart] = useState(0);
  const Cover = GAME_COVERS[game.id];
  const isMobile = useIsMobile();
  const modes = getModeOptions(game);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && stage !== 'play') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [stage, onClose]);

  const start = (m) => { setMode(m); setStage('play'); };
  const shellCfg = SHELL_CONFIG[game.id] || {};

  if (stage === 'play') {
    const GameComp = PLAYABLE[game.id];
    // Games that own their own viewport sizing (camera-driven, fullscreen
    // canvas, etc.) opt into the fluid viewport so the canvas stretches
    // edge-to-edge instead of preserving its intrinsic dimensions.
    const FLUID_GAMES = new Set(['slither', 'grudgewood', 'goalbound', 'fps']);
    const viewportClassName = FLUID_GAMES.has(game.id) ? 'is-fluid' : '';
    return (
      <div className="intro intro-playing">
        <GameShell
          game={game}
          mode={mode}
          best={best}
          onExit={onClose}
          onRestart={() => setRestart((k) => k + 1)}
          goals={shellCfg.goals}
          controls={shellCfg.controls}
          tips={shellCfg.tips}
          helpTitle={`${game.name} — how to play`}
          viewportClassName={viewportClassName}>
          {GameComp ? (
            <Suspense fallback={<LoadingGame game={game}/>}>
              <GameComp key={restartKey} mode={mode}/>
            </Suspense>
          ) : <PlayPlaceholder game={game}/>}
        </GameShell>
      </div>
    );
  }

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <button className="intro-back" onClick={onClose} aria-label="Back to lobby">
        {Icon.back} Back
      </button>
      <div className="intro-body">
        <div className="intro-cover" aria-hidden="true">
          {Cover && <Cover/>}
        </div>
        <div className="intro-copy">
          <div className="intro-eyebrow">
            {game.cat} · {game.players} · {game.levels === '∞' ? 'endless' : `${game.levels} levels`}
            {best !== undefined && best !== null && <> · your best {best}</>}
          </div>
          <h1 id="intro-title" className="intro-title">{game.name}</h1>
          <div className="intro-tagline">{game.tagline}</div>
          <p className="intro-story">{game.story}</p>

          <div className="intro-cta-label">
            {game.kind === 'vs' ? 'Choose your match' : 'Ready when you are'}
          </div>
          <div className="intro-ctas">
            {modes.map((m) => {
              const blocked = m.desktopOnly && isMobile;
              return (
                <button
                  key={m.id}
                  className={`btn ${m.tone === 'primary' ? 'btn-primary' : 'btn-ghost'}${blocked ? ' is-disabled' : ''}`}
                  onClick={() => !blocked && start(m.id)}
                  disabled={blocked}
                  title={blocked ? 'Best on desktop — pass the laptop for local versus' : undefined}>
                  {m.tone === 'primary' && Icon.play}
                  <span>{m.label}</span>
                  {blocked && <span className="intro-cta-hint">desktop</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
