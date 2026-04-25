// GOALBOUND — static content.
//
//   Teams, players, arenas, weather, difficulty tiers, tournament
//   templates, and challenges. Purely data; no runtime state.
//
//   Team/player names are fictional so no real-world IP is involved.
//   Crests are procedural SVG so the bundle stays tiny.

export const DIFFICULTIES = [
  { id: 'casual',  label: 'Casual',  blurb: 'Warm up. Forgiving AI — room to learn the ball.',
    reactTime: 0.28, aim: 0.45, contestAir: 0.22, punish: 0.30, chase: 0.70, mistakes: 0.25,
    tint: '#7ad7b0' },
  { id: 'pro',     label: 'Pro',     blurb: 'A real challenge. AI punishes neutral positioning.',
    reactTime: 0.17, aim: 0.20, contestAir: 0.55, punish: 0.60, chase: 0.90, mistakes: 0.10,
    tint: '#00e8d0' },
  { id: 'hard',    label: 'Hard',    blurb: 'Tight. The keeper anticipates and closes angles.',
    reactTime: 0.11, aim: 0.12, contestAir: 0.80, punish: 0.78, chase: 1.05, mistakes: 0.04,
    tint: '#ffb74d' },
  { id: 'legend',  label: 'Legend',  blurb: 'Brutal. Legendary AI — near-flawless reads.',
    reactTime: 0.06, aim: 0.06, contestAir: 0.95, punish: 0.92, chase: 1.15, mistakes: 0.01,
    tint: '#ff5a7a' },
];

// Twelve fictional clubs — each a distinct silhouette/palette.
export const TEAMS = [
  { id:'cyan-falcons',    name:'Cyan Falcons',    short:'FAL', primary:'#00e8d0', secondary:'#0b2430',  rating:82,
    crest:'bird',     nation:'NOR', stadium:'Dusk Bowl',        tagline:'Precision in the final third.' },
  { id:'ember-lions',     name:'Ember Lions',     short:'EMB', primary:'#ff8855', secondary:'#2a1410',  rating:80,
    crest:'flame',    nation:'SAV', stadium:'Furnace Yard',     tagline:'Counter-attacking pressure.' },
  { id:'ivory-voltage',   name:'Ivory Voltage',   short:'IVO', primary:'#e9e3cd', secondary:'#1b2028',  rating:78,
    crest:'bolt',     nation:'HLV', stadium:'Arc Coliseum',     tagline:'High line. Higher stakes.' },
  { id:'tidal-oaks',      name:'Tidal Oaks',      short:'TID', primary:'#4fb3d9', secondary:'#0d2839',  rating:81,
    crest:'wave',     nation:'CRV', stadium:'Harbor Gardens',   tagline:'Wave after wave.' },
  { id:'sable-wolves',    name:'Sable Wolves',    short:'SAB', primary:'#b19cd9', secondary:'#120a1e',  rating:79,
    crest:'wolf',     nation:'NEM', stadium:'Moonrise Park',    tagline:'Quiet teeth. Loud strikes.' },
  { id:'solar-argents',   name:'Solar Argents',   short:'SOL', primary:'#ffd166', secondary:'#241808',  rating:84,
    crest:'sun',      nation:'DOR', stadium:'Radiant Arena',    tagline:'The sun never sets on form.' },
  { id:'verdant-kites',   name:'Verdant Kites',   short:'VRD', primary:'#6fcf97', secondary:'#0f1f17',  rating:77,
    crest:'kite',     nation:'MLR', stadium:'Greenwater Bowl',  tagline:'Patient, relentless build-up.' },
  { id:'crimson-stags',   name:'Crimson Stags',   short:'CRM', primary:'#e94560', secondary:'#1c0f14',  rating:83,
    crest:'stag',     nation:'KRT', stadium:'Antler Deep',      tagline:'Horns down, chest out.' },
  { id:'steel-gryphons',  name:'Steel Gryphons',  short:'STL', primary:'#9db4c0', secondary:'#121a20',  rating:76,
    crest:'gryphon',  nation:'ALT', stadium:'Ironway Stands',   tagline:'Industrial grit.' },
  { id:'magma-cobras',    name:'Magma Cobras',    short:'MAG', primary:'#ff5a7a', secondary:'#1a0614',  rating:78,
    crest:'serpent',  nation:'ZAR', stadium:'Caldera',          tagline:'Strike fast. Strike low.' },
  { id:'arctic-foxes',    name:'Arctic Foxes',    short:'ARC', primary:'#e4f6f7', secondary:'#0c1822',  rating:75,
    crest:'fox',      nation:'VAL', stadium:'Whitewall Cup',    tagline:'Quick feet. Quieter nights.' },
  { id:'dune-phoenix',    name:'Dune Phoenix',    short:'DUN', primary:'#f4a261', secondary:'#241309',  rating:82,
    crest:'phoenix',  nation:'HET', stadium:'Red Silk Square',  tagline:'Reborn every whistle.' },
];

// Six fictional players per team. Shirt numbers 7/9/10/11/14/22 —
// arcade icon positions, not a real squad list. Stats out of 99.
const P = (id, name, num, role, power, jump, speed, control) =>
  ({ id, name, num, role, power, jump, speed, control });

export const ROSTERS = {
  'cyan-falcons':   [ P('fal-k','Kato Ren',       10,'striker', 88,74,82,84),
                      P('fal-s','Silva Vex',       9,'forward', 83,70,88,78),
                      P('fal-a','Arne Holst',      7,'winger',  76,72,92,80),
                      P('fal-m','Marko Dain',     14,'midfield',78,76,80,86),
                      P('fal-j','Jules Pernt',    22,'keeper',  70,92,62,72),
                      P('fal-n','Noor Ozin',      11,'allround',80,80,80,82) ],
  'ember-lions':    [ P('emb-t','Tito Canal',      9,'striker', 90,72,80,76),
                      P('emb-v','Vila Reis',      10,'playmaker',82,68,84,90),
                      P('emb-r','Rafiq Orem',     11,'winger',  78,78,90,78),
                      P('emb-d','Dante Peel',      7,'winger',  74,74,92,76),
                      P('emb-g','Goran Volk',     14,'anchor',  84,80,74,80),
                      P('emb-c','Coda Ness',      22,'keeper',  72,88,64,74) ],
  'ivory-voltage':  [ P('ivo-e','Elian Vars',     10,'striker', 86,76,82,86),
                      P('ivo-p','Petra Ashen',     9,'forward', 80,74,84,82),
                      P('ivo-l','Lio Brant',      11,'winger',  76,70,90,80),
                      P('ivo-k','Kaya Wynd',       7,'playmaker',78,68,82,90),
                      P('ivo-o','Osric Vale',     22,'keeper',  68,90,60,70),
                      P('ivo-s','Sana Plume',     14,'midfield',82,76,82,84) ],
  'tidal-oaks':     [ P('tid-m','Milo Berg',      10,'striker', 84,78,80,88),
                      P('tid-n','Nori Sund',       9,'forward', 82,72,82,80),
                      P('tid-h','Halia Wren',     11,'winger',  74,70,94,76),
                      P('tid-c','Cade Oleon',      7,'midfield',78,74,82,84),
                      P('tid-a','Aris Vail',      22,'keeper',  70,94,62,74),
                      P('tid-b','Bran Maris',     14,'defender',86,82,76,78) ],
  'sable-wolves':   [ P('sab-x','Xal Nereth',      9,'striker', 90,70,78,78),
                      P('sab-v','Vex Orlow',      10,'playmaker',80,66,84,90),
                      P('sab-t','Talos Drin',     11,'winger',  76,74,92,78),
                      P('sab-r','Riven Uhl',       7,'winger',  74,76,90,78),
                      P('sab-k','Keel Marn',      14,'anchor',  84,80,76,80),
                      P('sab-p','Paxen Vos',      22,'keeper',  70,88,62,72) ],
  'solar-argents':  [ P('sol-d','Dori Sal',       10,'striker', 92,78,82,88),
                      P('sol-i','Iora Vent',       9,'forward', 86,74,84,84),
                      P('sol-c','Caius Ran',      11,'winger',  80,72,94,80),
                      P('sol-e','Elo Ysari',       7,'midfield',80,70,86,88),
                      P('sol-b','Bera Noth',      22,'keeper',  74,92,64,76),
                      P('sol-h','Hanu Vex',       14,'anchor',  86,82,78,82) ],
  'verdant-kites':  [ P('vrd-w','Wren Colb',      10,'striker', 82,74,82,84),
                      P('vrd-s','Sela Mora',       9,'forward', 78,72,84,82),
                      P('vrd-o','Ossa Pend',      11,'winger',  74,70,92,78),
                      P('vrd-f','Finn Arda',       7,'playmaker',76,68,82,90),
                      P('vrd-e','Ever Kant',      22,'keeper',  68,88,62,70),
                      P('vrd-n','Naim Coril',     14,'allround',80,78,82,82) ],
  'crimson-stags':  [ P('crm-a','Arcel Varo',     10,'striker', 90,80,82,86),
                      P('crm-l','Leif Ondra',      9,'forward', 84,76,84,82),
                      P('crm-p','Pia Trevan',     11,'winger',  78,72,92,80),
                      P('crm-g','Gavran Ryl',      7,'midfield',82,74,84,86),
                      P('crm-t','Tane Osol',      22,'keeper',  74,90,64,76),
                      P('crm-m','Mira Cernin',    14,'defender',86,82,78,80) ],
  'steel-gryphons': [ P('stl-r','Rav Orel',       10,'striker', 84,72,80,82),
                      P('stl-u','Ursa Fain',       9,'forward', 80,70,82,78),
                      P('stl-k','Koll Benth',     11,'winger',  76,68,88,76),
                      P('stl-i','Iro Vance',       7,'winger',  74,72,90,76),
                      P('stl-b','Bren Moraz',     14,'anchor',  82,78,74,80),
                      P('stl-e','Era Halvard',    22,'keeper',  70,88,62,72) ],
  'magma-cobras':   [ P('mag-z','Zorin Vek',      10,'striker', 88,72,82,80),
                      P('mag-q','Quell Aris',      9,'forward', 82,70,84,80),
                      P('mag-t','Taran Osa',      11,'winger',  76,74,90,76),
                      P('mag-d','Dagna Orl',       7,'winger',  74,72,92,76),
                      P('mag-c','Cin Veral',      14,'anchor',  84,78,76,80),
                      P('mag-o','Onar Pesh',      22,'keeper',  70,86,62,72) ],
  'arctic-foxes':   [ P('arc-k','Kirra Noll',     10,'striker', 80,74,82,82),
                      P('arc-h','Hedge Vaelis',    9,'forward', 76,70,84,80),
                      P('arc-s','Sten Moravi',    11,'winger',  72,68,92,76),
                      P('arc-l','Linn Orean',      7,'midfield',74,72,84,84),
                      P('arc-w','Wen Fernel',     22,'keeper',  68,88,62,70),
                      P('arc-a','Avi Trosse',     14,'defender',80,78,76,78) ],
  'dune-phoenix':   [ P('dun-n','Nasir Vol',      10,'striker', 90,76,82,84),
                      P('dun-y','Yusa Imrin',      9,'forward', 84,74,84,82),
                      P('dun-t','Tamsir Ode',     11,'winger',  78,72,92,78),
                      P('dun-a','Amal Teris',      7,'playmaker',80,70,82,90),
                      P('dun-r','Rha Farish',     22,'keeper',  72,90,64,74),
                      P('dun-k','Khaled Vur',     14,'anchor',  84,80,78,80) ],
};

// Six arenas — each defines a palette, pitch hue, and a couple of
// render hints (ambience intensity, crowd density, light color).
export const ARENAS = [
  { id:'dusk-bowl',      label:'Dusk Bowl',      blurb:'Twilight stands. Warm lamps. Home of the Falcons.',
    sky:['#1a2f3e','#2a4557'], pitch:['#1a5530','#0f3a1f'], lights:'#ffe6a8', crowd:0.9 },
  { id:'furnace-yard',   label:'Furnace Yard',   blurb:'Industrial heat. Smoky reds. A partisan crowd.',
    sky:['#2a120c','#421a16'], pitch:['#1d2a19','#0e1b10'], lights:'#ff8855', crowd:1.0 },
  { id:'arc-coliseum',   label:'Arc Coliseum',   blurb:'Electric vault. Cool whites and steel.',
    sky:['#0d1524','#1d2a42'], pitch:['#1a3a50','#0e2136'], lights:'#cfe6ff', crowd:0.85 },
  { id:'moonrise-park',  label:'Moonrise Park',  blurb:'Violet night. Quiet stands. Moonlit glare.',
    sky:['#161030','#2a1f4a'], pitch:['#1b3526','#0a1c12'], lights:'#b19cd9', crowd:0.7 },
  { id:'radiant-arena',  label:'Radiant Arena',  blurb:'Golden hour. Maximum noise.',
    sky:['#322208','#5b3a12'], pitch:['#2a5516','#16320a'], lights:'#ffd166', crowd:1.0 },
  { id:'whitewall-cup',  label:'Whitewall Cup',  blurb:'Cold north. Silver floodlights.',
    sky:['#1c2634','#2f3e50'], pitch:['#3c545c','#24333a'], lights:'#e4f6f7', crowd:0.8 },
];

export const WEATHER_PRESETS = [
  { id:'clear',  label:'Clear',  blurb:'Pure touch — no wind, no weather.',     wind:0,    rain:0, snow:0 },
  { id:'breeze', label:'Breeze', blurb:'Light wind. Crosses hang a beat longer.', wind:0.4,  rain:0, snow:0 },
  { id:'gale',   label:'Gale',   blurb:'Heavy wind. Lofted balls behave wildly.', wind:1.0,  rain:0, snow:0 },
  { id:'rain',   label:'Rain',   blurb:'Wet pitch. Ball skids. Bounces die.',    wind:0.3,  rain:1, snow:0 },
  { id:'snow',   label:'Snow',   blurb:'Soft ground. Dampened bounces, slow run.', wind:0.2, rain:0, snow:1 },
];

export const BALL_TYPES = [
  { id:'classic', label:'Classic',   blurb:'The reliable. Neutral bounce, neutral weight.',   bounceMul:1.0,  powerMul:1.0, dragMul:1.0 },
  { id:'feather', label:'Feather',   blurb:'Lofts higher. Curlier. Easier to charge.',        bounceMul:1.15, powerMul:1.1, dragMul:0.95 },
  { id:'granite', label:'Granite',   blurb:'Heavy and hard. Punishing shots. Dies fast.',     bounceMul:0.8,  powerMul:1.15, dragMul:1.10 },
  { id:'neon',    label:'Neon',      blurb:'High bounce, flashy. Pure arcade.',               bounceMul:1.25, powerMul:1.05, dragMul:0.96 },
];

export const MATCH_DURATIONS = [
  { id:'45',  label:'45s',  seconds:45 },
  { id:'60',  label:'60s',  seconds:60 },
  { id:'90',  label:'90s',  seconds:90 },
  { id:'120', label:'2m',   seconds:120 },
];

export const CROWD_MODIFIERS = [
  { id:'quiet',   label:'Quiet',   blurb:'Small crowd. Minimal influence.',           energy:0.4 },
  { id:'normal',  label:'Normal',  blurb:'Balanced crowd. Amp up on goals.',          energy:0.7 },
  { id:'roaring', label:'Roaring', blurb:'Packed stands. Goals shake the screen.',    energy:1.0 },
  { id:'chaos',   label:'Chaos',   blurb:'Unhinged. Extra particles. Extra drama.',    energy:1.25 },
];

// Two tournament templates.
// - mini-cup: 4 teams, round-robin, top scorer wins.
// - continental: 8 teams, 2 groups of 4, top 2 → semis → final.
export const TOURNAMENT_TEMPLATES = [
  { id:'mini-cup',    label:'Mini Cup',          teams:4, groups:0, groupSize:0, knockoutFrom:'round-robin',
    blurb:'Four-team sprint. Round-robin. Most points hoists the trophy.' },
  { id:'continental', label:'Continental Cup',   teams:8, groups:2, groupSize:4, knockoutFrom:'group',
    blurb:'Two groups of four. Top two qualify. Single-leg knockouts.' },
  { id:'world',       label:'World Series',      teams:8, groups:0, groupSize:0, knockoutFrom:'straight',
    blurb:'Straight knockouts. Win or go home. For the confident.' },
];

// Challenge definitions. Each is a modifier over a match plus a
// win/lose evaluator. `goal` is a short text spec.
export const CHALLENGES = [
  { id:'opener',       label:'First Whistle',     stars:1, goal:'Score in 20 seconds.',
    modifiers:{ duration:45, mustScoreBy:20 },
    check:(r) => r.firstGoalAt !== null && r.firstGoalAt >= 45 - 20 + 45 - 45 && r.firstGoalAt <= 45 && (45 - r.firstGoalAt) <= 20 && r.won },
  { id:'comeback',     label:'Comeback Kid',      stars:2, goal:'Win after being down 0–2.',
    modifiers:{ duration:90, enemyHead:2 },
    check:(r) => r.wasDownBy2 && r.won },
  { id:'no-jump',      label:'Ground Control',    stars:2, goal:'Win without jumping.',
    modifiers:{ duration:60, noJump:true },
    check:(r) => r.won && r.jumpCount === 0 },
  { id:'clean-sheet',  label:'No Entry',          stars:2, goal:'Win with a clean sheet.',
    modifiers:{ duration:60 },
    check:(r) => r.won && r.conceded === 0 },
  { id:'hat-trick',    label:'Hat-Trick Hero',    stars:3, goal:'Score three or more goals.',
    modifiers:{ duration:90 },
    check:(r) => r.scored >= 3 && r.won },
  { id:'gale-force',   label:'Into the Gale',     stars:2, goal:'Win with the wind at max.',
    modifiers:{ duration:60, weather:'gale' },
    check:(r) => r.won },
  { id:'sudden-death', label:'Golden Legend',     stars:3, goal:'Win by golden goal vs Legend AI.',
    modifiers:{ duration:45, difficulty:'legend', goldenOnly:true },
    check:(r) => r.won && r.endReason === 'golden' },
];

// Physics — used by the match engine. Centralized so tuning is easy.
export const PHYSICS = {
  W: 760, H: 420, FLOOR: 360,
  P_W: 28, P_H: 48,
  BALL_R: 10,
  GRAVITY: 1500,
  PLAYER_MOVE: 280,
  PLAYER_ACCEL: 2400,
  PLAYER_DECEL: 2800,
  PLAYER_JUMP: -560,
  BALL_FRICTION_AIR: 0.995,
  BALL_BOUNCE_GROUND: 0.58,
  BALL_BOUNCE_WALL: 0.75,
  KICK_CD: 0.30,
  KICK_RANGE: 44,
  KICK_POWER: 460,
  KICK_CHARGE_MAX: 0.55,
  GOAL_W: 76, GOAL_H: 146,
  WIN_GOALS: 3,
  GOLDEN_SECONDS: 45,
};

// Keyboard binding reference (for Help screen).
export const CONTROLS = {
  p1: [
    { keys:['A','D'], label:'Move' },
    { keys:['W'],     label:'Jump' },
    { keys:['S','Space'], label:'Kick (hold to charge)' },
  ],
  p2: [
    { keys:['←','→'], label:'Move' },
    { keys:['↑'],     label:'Jump' },
    { keys:['/','Shift'], label:'Kick (hold to charge)' },
  ],
  shell: [
    { keys:['P'],     label:'Pause / resume' },
    { keys:['R'],     label:'Restart match' },
    { keys:['M'],     label:'Mute / unmute' },
    { keys:['F'],     label:'Fullscreen' },
    { keys:['Esc'],   label:'Back / close overlay' },
  ],
};

export const teamById    = (id) => TEAMS.find((t) => t.id === id) || TEAMS[0];
export const playerById  = (teamId, pid) => (ROSTERS[teamId] || []).find((p) => p.id === pid) || (ROSTERS[teamId] || [])[0];
export const arenaById   = (id) => ARENAS.find((a) => a.id === id) || ARENAS[0];
export const weatherById = (id) => WEATHER_PRESETS.find((w) => w.id === id) || WEATHER_PRESETS[0];
export const ballById    = (id) => BALL_TYPES.find((b) => b.id === id) || BALL_TYPES[0];
export const crowdById   = (id) => CROWD_MODIFIERS.find((c) => c.id === id) || CROWD_MODIFIERS[1];
export const difficultyById = (id) => DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[0];
export const durationById   = (id) => MATCH_DURATIONS.find((d) => d.id === id) || MATCH_DURATIONS[1];
export const templateById   = (id) => TOURNAMENT_TEMPLATES.find((t) => t.id === id) || TOURNAMENT_TEMPLATES[1];
