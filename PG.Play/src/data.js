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
//   sessionLength   'instant' | 'short' | 'medium' | 'long' — expected minutes per run
//   isOriginal      boolean — we built it ourselves, no legacy IP
//   updated         boolean — shipped or refreshed this pass
//
// See docs/mobile-support-matrix.md and docs/game-roadmap.md for rationale.

export const GAMES = [
  // STORY / CO-OP
  { id:'fbwg', name:'Ember & Tide', cat:'Co-op', kind:'story', players:'1-2 co-op', levels:3,
    tagline:'Two friends, one keyboard, three chambers.',
    story:'Ember burns, Tide cools. Ember can\'t touch water. Tide can\'t touch fire. Acid hates everyone. Share a keyboard — W A D for Ember, arrows for Tide — collect every gem, step onto your own door at the same time. Three hand-designed chambers. Same-team forgiveness: if one falls, you both restart the room.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'desktop-only', inputs:['keyboard'], orientation:'landscape',
    skillTags:['spatial','planning','coop'], sessionLength:'short' },

  { id:'bob', name:'Night Shift', cat:'Stealth', kind:'story', players:'1P', levels:3,
    tagline:'Three floors. Three nights. One flashlight too many.',
    story:'A quiet walk past guards who don\'t want you there. Read patrol paths, step into gaps between vision cones, hold Shift to tiptoe when you need to go silent. Detection fills a meter — fill it and the shift restarts. Three handcrafted nights: reception, second floor, penthouse.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['timing','stealth','planning'], sessionLength:'short' },

  { id:'badicecream', name:'Frost Fight', cat:'Arcade', kind:'story', players:'1P', levels:3,
    tagline:'Fruit, ice, and not much else.',
    story:'A grid maze, a handful of angry fruits, and one small ice cream. Step tile-to-tile, freeze the tile you\'re facing to wall them off, melt it to open the way. Collect every fruit piece in the room — only then does the exit accept you. Three rooms: Pantry, Cold Room, Aisle.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['spatial','planning','reflex'], sessionLength:'short' },

  { id:'aow', name:'Era Lane', cat:'Strategy', kind:'story', players:'1P', levels:5,
    tagline:'Five eras. One lane. One base you can\'t afford to lose.',
    story:'A single lane, your base on the left, theirs on the right. Gold grows on a clock; units cost gold and cooldown. Scouts are cheap and fast; Spears hit harder; Heavies punch through a wall of them. Every thirty seconds the enemy escalates. Destroy their base before they destroy yours.',
    playable:true, badge:'new',
    mobileSupport:'native', inputs:['mouse','tap'], orientation:'landscape',
    skillTags:['planning','resource-mgmt'], sessionLength:'medium', isOriginal:true },

  { id:'vex', name:'Trace', cat:'Platformer', kind:'story', players:'1P', levels:6,
    tagline:'Six rooms. Read the line. Run it.',
    story:'A precision platformer with six hand-designed rooms — tutorial, spike pit, saw alley, wall-jump chimney, saw timing, finale. Coyote time and jump buffering keep controls forgiving; death is instant and so is the respawn. Score rewards clean runs: fewer deaths and fewer seconds = higher finish.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['reflex','timing','movement'], sessionLength:'short' },

  { id:'papa', name:'Short Order', cat:'Time-mgmt', kind:'story', players:'1P', levels:'∞',
    tagline:'Ninety-second shift. Tips in the jar.',
    story:'Tickets pile up. Eight big buttons for every step — dough, sauce, cheese, pepperoni, veggies, oven, slice, box. Tap them in the right order for the leftmost ticket; wrong tap costs four seconds; running a ticket out of time costs a life. Three lives, ninety seconds, and a tip jar that scales with speed.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'native', inputs:['tap','mouse','keyboard'], orientation:'any',
    skillTags:['timing','memory','routing'], sessionLength:'short' },

  { id:'hook', name:'Stickman Hook', cat:'Platformer', kind:'story', players:'1P', levels:3,
    tagline:'Swing through the impossible.',
    story:'One button. Attach, detach, pendulum, fling. Three neon courses between you and the flag — miss the grab, you splat. Land it, and you loop back through levels you thought were too long for a human arm.',
    playable:true,
    mobileSupport:'touch-ok', inputs:['mouse','touch','keyboard'], orientation:'landscape',
    skillTags:['timing','reflex','physics'], sessionLength:'short' },

  { id:'g2048', name:'2048', cat:'Puzzle', kind:'story', players:'1P', levels:'∞',
    tagline:'Numbers, merged.',
    story:'The tile Threes fell in love with the tile Fives, but math is math — you can only merge equals. Slide the board. Fuse 2 into 4, 4 into 8, all the way to that elusive 2048 tile. Then keep going, because pride.',
    playable:true,
    mobileSupport:'native', inputs:['swipe','keyboard'], orientation:'portrait',
    skillTags:['planning','spatial'], sessionLength:'short' },

  { id:'cutrope', name:'Cut the Rope', cat:'Puzzle', kind:'story', players:'1P', levels:3,
    tagline:'Om Nom is hungry.',
    story:'A small green creature in a cardboard box, staring up at a piece of candy on a string. Your job: slice the rope at the right angle, collect every star on the way down, feed the monster. Three levels, one satisfying crunch.',
    playable:true,
    mobileSupport:'native', inputs:['touch','mouse'], orientation:'landscape',
    skillTags:['physics','timing','spatial'], sessionLength:'instant' },

  { id:'bloons', name:'Bloons TD', cat:'Tower-Def', kind:'story', players:'1P', levels:20,
    tagline:'Defend the track. Pop everything.',
    story:'Balloons float along a path. You place dart-throwing monkeys, boomerang monkeys, ice monkeys, eventually super monkeys. Twenty rounds of increasingly absurd balloon waves — camo, lead, ceramic, MOAB. None must reach the end.',
    mobileSupport:'native', inputs:['tap','mouse'], orientation:'landscape',
    skillTags:['planning','resource-mgmt','routing'], sessionLength:'long' },

  { id:'slither', name:'Coil', cat:'Arcade', kind:'story', players:'1P', levels:'∞',
    tagline:'Grow without touching.',
    story:'An empty arena and one thought: eat the orbs, don\'t touch anything but orbs. Steer with a finger, a mouse, or WASD. Other coils drift around looking for a mistake — yours or theirs. Bigger is slower, but bigger is also a wall.',
    playable:true, badge:'new',
    mobileSupport:'native', inputs:['touch','mouse','keyboard'], orientation:'any',
    skillTags:['reflex','spatial','movement'], sessionLength:'short', isOriginal:true },

  { id:'happywheels', name:'Faceplant', cat:'Physics', kind:'story', players:'1P', levels:1,
    tagline:'Ride the course. Keep your head off the dirt.',
    story:'One bike, one rider, one hand-drawn track of hills, bumps, and three spike fields between you and a green flag. Throttle, brake, and lean. Land wrong and the rider\'s head introduces itself to the ground. Faster clears score higher.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'desktop-first', inputs:['keyboard'], orientation:'landscape',
    skillTags:['physics','reflex','timing'], sessionLength:'short' },

  { id:'fps', name:'Raycaster FPS', cat:'Shooter', kind:'story', players:'1P', levels:1,
    tagline:'One corridor, four enemies, one gun.',
    story:'A single level, a classic corridor, and a handful of drifting creatures that want you gone. Wolfenstein-grade fake-3D rendered one column at a time. Aim, click, clear the sector — the old-school way.',
    playable:true,
    mobileSupport:'desktop-first', inputs:['keyboard','mouse'], orientation:'landscape',
    skillTags:['reflex','aim'], sessionLength:'short', isOriginal:true },

  { id:'grudgewood', name:'Grudgewood', cat:'Rage', kind:'story', players:'1P', levels:6,
    tagline:'The forest remembers.',
    story:'A hostile-environment trap-survival built around a single idea: the forest is the villain. Six trap families — branch whips, root snares, pressure mushrooms, rolling logs, predator trees, fake stumps — each teaches itself, varies, then combines. Three biomes: warm deceptive Mosswake, sickly Rotbog, and the crimson ember-raining Heart. One-hit deaths, ~500ms respawn, ragdoll slow-mo, checkpoint pylons between stages. Every lethal surprise has a tell. You are meant to feel tricked — never cheated.',
    playable:true, badge:'new',
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['reflex','memory','timing','movement'], sessionLength:'medium',
    isOriginal:true, updated:true },

  { id:'arena', name:'Arena', cat:'Multiplayer', kind:'vs', players:'1-8', levels:1,
    tagline:'Top-down realtime shootout.',
    story:'A boxed arena, walls to hide behind, bots to warm up on, and real players dropping in through Supabase Realtime. Five kills to win the round. Click to fire, keep moving — the crosshair is a suggestion.',
    playable:true, badge:'new',
    mobileSupport:'touch-ok', inputs:['keyboard','mouse'], orientation:'landscape',
    skillTags:['reflex','aim','movement'], sessionLength:'short', isOriginal:true },

  { id:'slipshot', name:'SLIPSHOT', cat:'FPS', kind:'story', players:'1P', levels:'∞',
    tagline:'Three minutes. Pure momentum.',
    story:'A corporate training chamber. Holo-targets blink along the walls. Drones drift in from the ceiling. You have 180 seconds. Slide into a jump, chain the landing into another slide, airdash between kills. The combo meter only climbs while you keep moving — stop, and it falls. Bronze is a clean line. Silver is a pattern. Gold is a song.',
    playable:true, badge:'new',
    mobileSupport:'desktop-only', inputs:['keyboard','mouse'], orientation:'landscape',
    skillTags:['movement','reflex','aim'], sessionLength:'short', isOriginal:true, updated:true },


  // HEAD-TO-HEAD
  { id:'connect4', name:'Connect 4', cat:'Classic', kind:'vs', players:'1-2', levels:3,
    tagline:'Four in a row. Old as time.',
    story:'Drop checkers, yellow vs red, into a seven-by-six grid. First to align four — horizontal, vertical, diagonal — wins. The bot thinks three moves ahead; your friend across the couch thinks zero. Your call.',
    playable:true,
    mobileSupport:'native', inputs:['tap','mouse','touch'], orientation:'any',
    skillTags:['planning','spatial'], sessionLength:'short' },

  { id:'eightball', name:'8-Ball Pool', cat:'Classic', kind:'vs', players:'1-2', levels:3,
    tagline:'Solids vs stripes. Finish on the 8.',
    story:'Rack them, break them, claim your suit, sink them one by one. Pocket the 8-ball last — not before. Play the bot for a quick match, or swap sticks with someone across the table.',
    playable:true,
    mobileSupport:'touch-ok', inputs:['mouse','touch','drag'], orientation:'landscape',
    skillTags:['physics','aim','planning'], sessionLength:'medium' },

  { id:'goalbound', name:'Goalbound', cat:'Sports', kind:'vs', players:'1-2', levels:3,
    tagline:'One pitch. One minute. All yours.',
    story:'Two rivals, one minute, and a pitch small enough to make every touch matter. Jump a cross, half-volley a wall-bounce, bury the rebound. Face AI on three tiers or pass the keyboard — whoever blinks first is out. Penalty Shootout mode works on a single phone when nobody else is around.',
    playable:true, featured:true, badge:'new', isOriginal:true, updated:true,
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['timing','reflex','physics'], sessionLength:'short' },

  { id:'basket', name:'Hoop Shot', cat:'Sports', kind:'story', players:'1P', levels:'∞',
    tagline:'Ninety seconds. One sliding hoop.',
    story:'A drag-back-release basket shootout. The hoop slides; you don\'t. Press the ball, drag back to aim, release to launch. Swishes score three, rim kisses score two, consecutive makes add a streak bonus that scales. Ninety seconds to rack up. Touch, mouse, both.',
    playable:true, badge:'new',
    mobileSupport:'native', inputs:['touch','mouse','drag'], orientation:'landscape',
    skillTags:['aim-trajectory','timing','physics'], sessionLength:'short', isOriginal:true },
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
    ids: ['goalbound', 'connect4', 'eightball', 'arena'],
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
    ids: ['slipshot', 'fps', 'hook', 'arena', 'goalbound'],
  },
  {
    id: 'mean-and-funny',
    title: 'Mean, but funny',
    blurb: 'Games designed to make you laugh at yourself while you restart for the fifteenth time.',
    ids: ['grudgewood', 'happywheels', 'vex'],
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
    ids: ['g2048', 'cutrope', 'slither', 'connect4', 'basket', 'goalbound'],
  },
  {
    id: 'originals',
    title: 'PG.Play Originals',
    blurb: 'Built here, shipped here. No legacy licenses, no clones — our own games, our own calls.',
    ids: ['slipshot', 'grudgewood', 'goalbound', 'arena', 'slither', 'basket', 'aow', 'fps'],
  },
  {
    id: 'new-updated',
    title: 'New & updated',
    blurb: 'Fresh ships and recent refreshes. If you haven’t been back in a week, start here.',
    ids: ['goalbound', 'slipshot', 'slither', 'arena', 'aow', 'basket'],
  },
];

// The staff picks live above the filter grid. Four hand-chosen titles,
// rotated when the roster meaningfully changes — not automated.
export const EDITORS_PICKS = ['goalbound', 'slipshot', 'grudgewood', 'g2048'];

// Filter taxonomy used by the homepage tabs.
export const FILTERS = [
  { id:'all',      label:'All',      match: () => true },
  { id:'solo',     label:'Solo',     match: (g) => g.kind === 'story' && g.players === '1P' },
  { id:'coop',     label:'Co-op',    match: (g) => g.players.includes('co-op') },
  { id:'versus',   label:'Versus',   match: (g) => g.kind === 'vs' },
  { id:'playable', label:'Playable', match: (g) => !!g.playable },
];
