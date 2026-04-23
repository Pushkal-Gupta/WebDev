// PG.Play game registry.
//
// Schema (extended for the platform audit):
//   id              unique slug
//   name            display title (original-safe for internal use)
//   cat             one-word category label
//   kind            'story' (solo / same-team co-op) | 'vs' (head-to-head)
//   players         human-readable ("1P", "1-2", "1-2 co-op", "1-8")
//   levels          number or '∞'
//   tagline         one-liner
//   story           short description, one paragraph
//
//   playable        boolean — true if a game component exists
//   featured        boolean — hero pick on home
//   badge           optional 'new' | 'hot' | 'co-op' etc.
//
//   mobileSupport   'native' | 'touch-ok' | 'desktop-first' | 'desktop-only'
//   inputs          array of: 'keyboard' | 'mouse' | 'touch' | 'swipe' | 'tap' | 'drag'
//   orientation     'any' | 'landscape' | 'portrait'
//   skillTags       array of skills exercised: reflex / timing / planning / spatial / memory / aim / physics / movement / coop / stealth / routing / resource-mgmt / aim-trajectory
//
// See docs/mobile-support-matrix.md and docs/game-roadmap.md for rationale.

export const GAMES = [
  // STORY / CO-OP
  { id:'fbwg', name:'Fireboy & Watergirl', cat:'Co-op', kind:'story', players:'1-2 co-op', levels:32,
    tagline:'Two elementals. One forgotten temple.',
    story:'Fireboy burns hot. Watergirl runs cool. Together they brave the four temples — Forest, Light, Ice, Crystal — scavenging gems and outwitting pressure plates. Separated, they fail. Split a keyboard, split the gems, get out alive.',
    playable:true, featured:true,
    mobileSupport:'desktop-only', inputs:['keyboard'], orientation:'landscape',
    skillTags:['spatial','planning','coop'] },

  { id:'bob', name:'Bob the Robber', cat:'Stealth', kind:'story', players:'1P', levels:20,
    tagline:'A burglar with a conscience.',
    story:'Bob grew up hearing whispers about crooked bankers and dirty politicians. Grown up, he took matters into his gloved hands. Slip past guards, crack safes, dodge the beam of every patrolling flashlight — and only steal from the ones who had it coming.',
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['timing','stealth','planning'] },

  { id:'badicecream', name:'Bad Ice Cream', cat:'Co-op', kind:'story', players:'1-2 co-op', levels:40,
    tagline:'Fruit. Ice. No mercy.',
    story:'You are an ice cream. The fruit has gone feral. Freeze tunnels through ice blocks, corner the marching strawberries, and never, ever stand next to a bomb. Works solo, works better as a two-cone tag-team.',
    mobileSupport:'desktop-only', inputs:['keyboard'], orientation:'landscape',
    skillTags:['spatial','coop','timing'] },

  { id:'aow', name:'Age of War 2', cat:'Strategy', kind:'story', players:'1P', levels:5,
    tagline:'From spear to spaceship.',
    story:'Five ages of warfare — Caveman, Castle, Renaissance, Modern, Future — and one base you have to keep breathing. Spawn troops, upgrade turrets, evolve your civilization before the other side overruns your gate.',
    mobileSupport:'native', inputs:['mouse','tap'], orientation:'landscape',
    skillTags:['planning','resource-mgmt'] },

  { id:'vex', name:'Vex', cat:'Platformer', kind:'story', players:'1P', levels:10,
    tagline:'Act IX: the parkour nightmare.',
    story:'Buzzsaws spin. Spikes ambush. You have no name, no weapon, just a stickman\'s balance and a wall-jump. Each act is a trial — slide under, leap over, and never trust a block that moves on its own.',
    mobileSupport:'desktop-first', inputs:['keyboard'], orientation:'landscape',
    skillTags:['reflex','timing','movement'] },

  { id:'papa', name:"Papa's Pizzeria", cat:'Time-mgmt', kind:'story', players:'1P', levels:30,
    tagline:'Papa Louie left you in charge.',
    story:'Monday: you were bussing tables. Tuesday: Papa handed you the apron and vanished. Take orders, build pies to exact topping specs, slide them into a screaming oven, slice with a steady hand. Thirty shifts. No burning.',
    mobileSupport:'native', inputs:['mouse','touch','drag'], orientation:'landscape',
    skillTags:['timing','memory','routing'] },

  { id:'hook', name:'Stickman Hook', cat:'Platformer', kind:'story', players:'1P', levels:3,
    tagline:'Swing through the impossible.',
    story:'One button. Attach, detach, pendulum, fling. Three neon courses between you and the flag — miss the grab, you splat. Land it, and you loop back through levels you thought were too long for a human arm.',
    playable:true,
    mobileSupport:'touch-ok', inputs:['mouse','touch','keyboard'], orientation:'landscape',
    skillTags:['timing','reflex','physics'] },

  { id:'g2048', name:'2048', cat:'Puzzle', kind:'story', players:'1P', levels:'∞',
    tagline:'Numbers, merged.',
    story:'The tile Threes fell in love with the tile Fives, but math is math — you can only merge equals. Slide the board. Fuse 2 into 4, 4 into 8, all the way to that elusive 2048 tile. Then keep going, because pride.',
    playable:true,
    mobileSupport:'native', inputs:['swipe','keyboard'], orientation:'portrait',
    skillTags:['planning','spatial'] },

  { id:'cutrope', name:'Cut the Rope', cat:'Puzzle', kind:'story', players:'1P', levels:3,
    tagline:'Om Nom is hungry.',
    story:'A small green creature in a cardboard box, staring up at a piece of candy on a string. Your job: slice the rope at the right angle, collect every star on the way down, feed the monster. Three levels, one satisfying crunch.',
    playable:true,
    mobileSupport:'native', inputs:['touch','mouse'], orientation:'landscape',
    skillTags:['physics','timing','spatial'] },

  { id:'bloons', name:'Bloons TD', cat:'Tower-Def', kind:'story', players:'1P', levels:20,
    tagline:'Defend the track. Pop everything.',
    story:'Balloons float along a path. You place dart-throwing monkeys, boomerang monkeys, ice monkeys, eventually super monkeys. Twenty rounds of increasingly absurd balloon waves — camo, lead, ceramic, MOAB. None must reach the end.',
    mobileSupport:'native', inputs:['tap','mouse'], orientation:'landscape',
    skillTags:['planning','resource-mgmt','routing'] },

  { id:'slither', name:'Coil', cat:'Arcade', kind:'story', players:'1P', levels:'∞',
    tagline:'Grow without touching.',
    story:'An empty arena and one thought: eat the orbs, don\'t touch anything but orbs. Steer with a finger, a mouse, or WASD. Other coils drift around looking for a mistake — yours or theirs. Bigger is slower, but bigger is also a wall.',
    playable:true, badge:'new',
    mobileSupport:'native', inputs:['touch','mouse','keyboard'], orientation:'any',
    skillTags:['reflex','spatial','movement'] },

  { id:'happywheels', name:'Happy Wheels', cat:'Physics', kind:'story', players:'1P', levels:15,
    tagline:'Gravity has opinions.',
    story:'A man in a wheelchair with a rocket strapped to the back. A kid on a scooter chasing his dad down a hill. Fifteen hand-crafted tracks of ramps, spikes, cannons and questionable decisions. Finish the course — bones optional.',
    mobileSupport:'desktop-first', inputs:['keyboard'], orientation:'landscape',
    skillTags:['physics','reflex','timing'] },

  { id:'fps', name:'Raycaster FPS', cat:'Shooter', kind:'story', players:'1P', levels:1,
    tagline:'One corridor, four enemies, one gun.',
    story:'A single level, a classic corridor, and a handful of drifting creatures that want you gone. Wolfenstein-grade fake-3D rendered one column at a time. Aim, click, clear the sector — the old-school way.',
    playable:true,
    mobileSupport:'desktop-first', inputs:['keyboard','mouse'], orientation:'landscape',
    skillTags:['reflex','aim'] },

  { id:'grudgewood', name:'Grudgewood', cat:'Rage', kind:'story', players:'1P', levels:'∞',
    tagline:'Quiet forest. Bad intentions.',
    story:'A sleepy-looking grove on a sleepy-looking afternoon. Problem: the trees remember something. Most are harmless. Some are waiting. Ten trap kinds — spikes, logs, saws, quiet traps you won\'t see until it\'s too late. Each death arms one more tree. Three checkpoints save your spot. The forest is mean, but legible — if you pay attention.',
    playable:true,
    mobileSupport:'touch-ok', inputs:['keyboard'], orientation:'landscape',
    skillTags:['reflex','memory','timing'] },

  { id:'arena', name:'Arena', cat:'Multiplayer', kind:'vs', players:'1-8', levels:1,
    tagline:'Top-down realtime shootout.',
    story:'A boxed arena, walls to hide behind, bots to warm up on, and real players dropping in through Supabase Realtime. Five kills to win the round. Click to fire, keep moving — the crosshair is a suggestion.',
    playable:true, badge:'new',
    mobileSupport:'touch-ok', inputs:['keyboard','mouse'], orientation:'landscape',
    skillTags:['reflex','aim','movement'] },

  { id:'slipshot', name:'SLIPSHOT', cat:'FPS', kind:'story', players:'1P', levels:'∞',
    tagline:'Three minutes. Pure momentum.',
    story:'A corporate training chamber. Holo-targets blink along the walls. Drones drift in from the ceiling. You have 180 seconds. Slide into a jump, chain the landing into another slide, airdash between kills. The combo meter only climbs while you keep moving — stop, and it falls. Bronze is a clean line. Silver is a pattern. Gold is a song.',
    playable:true, badge:'new',
    mobileSupport:'desktop-only', inputs:['keyboard','mouse'], orientation:'landscape',
    skillTags:['movement','reflex','aim'] },

  { id:'nightcap', name:'Nightcap', cat:'Rage', kind:'story', players:'1P', levels:7,
    tagline:'A complimentary nightmare.',
    story:'A roadside motel. 3 AM. The front desk forgot about you. The room fixtures did not. Seven rooms between you and the exit sign — lobby, hallway, vending alcove, ice room, pool, laundry, Room 13. Every plate, fan, fake-safe tile and ice block has a tell if you watch. One-hit deaths, instant respawn. A short stay. A long check-out.',
    playable:true, badge:'new',
    mobileSupport:'touch-ok', inputs:['keyboard'], orientation:'landscape',
    skillTags:['reflex','memory','timing'] },

  // HEAD-TO-HEAD
  { id:'connect4', name:'Connect 4', cat:'Classic', kind:'vs', players:'1-2', levels:3,
    tagline:'Four in a row. Old as time.',
    story:'Drop checkers, yellow vs red, into a seven-by-six grid. First to align four — horizontal, vertical, diagonal — wins. The bot thinks three moves ahead; your friend across the couch thinks zero. Your call.',
    playable:true,
    mobileSupport:'native', inputs:['tap','mouse','touch'], orientation:'any',
    skillTags:['planning','spatial'] },

  { id:'eightball', name:'8-Ball Pool', cat:'Classic', kind:'vs', players:'1-2', levels:3,
    tagline:'Solids vs stripes. Finish on the 8.',
    story:'Rack them, break them, claim your suit, sink them one by one. Pocket the 8-ball last — not before. Play the bot for a quick match, or swap sticks with someone across the table.',
    playable:true,
    mobileSupport:'touch-ok', inputs:['mouse','touch','drag'], orientation:'landscape',
    skillTags:['physics','aim','planning'] },

  { id:'football', name:'Football Legends', cat:'Sports', kind:'vs', players:'1-2', levels:3,
    tagline:'2v2 street-ball chaos.',
    story:'A two-on-two pitch, oversized nets, trick kicks that defy physics. Pick your legend, shoot a curled bicycle from midfield, and yell at your teammate — whether that\'s the bot or the friend on the other keyboard.',
    mobileSupport:'touch-ok', inputs:['keyboard'], orientation:'landscape',
    skillTags:['timing','reflex','coop'] },

  { id:'basket', name:'Basket Champs', cat:'Sports', kind:'vs', players:'1-2', levels:3,
    tagline:'Aim. Arc. Drain the three.',
    story:'Two characters, one hoop, twenty-one points. Each turn you drag to aim, release to shoot — angle and power, that\'s it. Miss and the ball drops to the floor; your opponent lines up next. The court is yours until it isn\'t.',
    mobileSupport:'native', inputs:['touch','mouse','drag'], orientation:'landscape',
    skillTags:['aim-trajectory','timing','physics'] },
];

// Editorial collections. Curated by hand, not by algorithm. Each blurb is
// an opinion — these are written to feel selected, not scraped.
export const COLLECTIONS = [
  {
    id: 'start-in-ten',
    title: 'Start in ten seconds',
    blurb: 'Zero tutorial. See the game, understand it, get into a run before you finish reading this sentence.',
    ids: ['g2048', 'connect4', 'cutrope', 'hook'],
  },
  {
    id: 'pass-the-laptop',
    title: 'Pass the laptop',
    blurb: 'Two people, one keyboard, no setup. The games where handing over the laptop is half the fun.',
    ids: ['connect4', 'eightball', 'football', 'basket'],
  },
  {
    id: 'brainy',
    title: 'Brainy',
    blurb: 'For the reader’s corner: games that reward planning over reflex. Good for a rainy afternoon.',
    ids: ['g2048', 'cutrope', 'bloons', 'connect4'],
  },
  {
    id: 'twitch',
    title: 'Fast twitch',
    blurb: 'Movement, aim, timing. Sessions end in seconds; mastery takes hours. Headphones help.',
    ids: ['slipshot', 'fps', 'hook', 'arena'],
  },
  {
    id: 'mean-and-funny',
    title: 'Mean, but funny',
    blurb: 'Games designed to make you laugh at yourself while you restart for the fifteenth time.',
    ids: ['grudgewood', 'nightcap', 'happywheels', 'vex'],
  },
  {
    id: 'couch-coop',
    title: 'Same-team co-op',
    blurb: 'You and a friend on the same side. Clearing the level is the celebration.',
    ids: ['fbwg', 'badicecream'],
  },
  {
    id: 'phone-friendly',
    title: 'Works on your phone',
    blurb: 'Touch-native by design. Same game, smaller screen, no compromise.',
    ids: ['g2048', 'cutrope', 'slither', 'connect4'],
  },
];

// Filter taxonomy used by the homepage tabs.
export const FILTERS = [
  { id:'all',      label:'All',      match: () => true },
  { id:'solo',     label:'Solo',     match: (g) => g.kind === 'story' && g.players === '1P' },
  { id:'coop',     label:'Co-op',    match: (g) => g.players.includes('co-op') },
  { id:'versus',   label:'Versus',   match: (g) => g.kind === 'vs' },
  { id:'playable', label:'Playable', match: (g) => !!g.playable },
];
