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
    story:'Ember burns. Tide cools. They need each other to leave the room. Share the keyboard with someone you trust — and find out fast whether you should.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'desktop-only', inputs:['keyboard'], orientation:'landscape',
    skillTags:['spatial','planning','coop'], sessionLength:'short' },

  { id:'bob', name:'Night Shift', cat:'Stealth', kind:'story', players:'1P', levels:3,
    tagline:'Three floors. Three nights. One flashlight too many.',
    story:'A building you are not supposed to be in. Guards who would rather you weren\'t. Read the room, time the gap, and slip through without ever being seen.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['timing','stealth','planning'], sessionLength:'short' },

  { id:'badicecream', name:'Frost Fight', cat:'Arcade', kind:'story', players:'1-2 co-op', levels:40,
    tagline:'A maze. Some angry fruit. One small ice cream.',
    story:'You are a small ice cream in a place that does not want you here. The fruit is patient and the corridors are short. Freeze a row to buy a second. Melt a row to take it back. Bring a friend if the lonely freezes in your chest. The deeper you go, the meaner the orchard gets.',
    playable:true, badge:'new', updated:true, isOriginal:true,
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['spatial','planning','reflex','coop'], sessionLength:'short' },

  { id:'aow', name:'Era Siege', cat:'Strategy', kind:'story', players:'1P', levels:5,
    tagline:'Five eras of warfare. One lane. One base you can\'t afford to lose.',
    story:'A single lane across the long arc of history. Spawn the unit, build the turret, save for the next age. Hold long enough and your enemy ages with you — just meaner, and not always patient enough to wait.',
    playable:true, badge:'new', updated:true,
    mobileSupport:'native', inputs:['mouse','tap','keyboard'], orientation:'landscape',
    skillTags:['planning','resource-mgmt'], sessionLength:'medium', isOriginal:true },

  { id:'vex', name:'Trace', cat:'Platformer', kind:'story', players:'1P', levels:6,
    tagline:'Read the line. Run it.',
    story:'The room shows you the path and dares you to take it without flinching. Death is instant. So is the next try. You will be quicker the second time. You will not be quick enough the third.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['reflex','timing','movement'], sessionLength:'short' },

  { id:'papa', name:'Short Order', cat:'Time-mgmt', kind:'story', players:'1P', levels:'∞',
    tagline:'Ninety-second shift. Tips in the jar.',
    story:'The tickets pile up faster than you can read them. Move quickly, finish strong, watch the jar fill. Mess up and the next one is already cold. Move clean and the rush is the reward.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'native', inputs:['tap','mouse','keyboard'], orientation:'any',
    skillTags:['timing','memory','routing'], sessionLength:'short' },

  { id:'hook', name:'Swingwire', cat:'Action', kind:'story', players:'1P', levels:3,
    tagline:'One button. Momentum is the reward.',
    story:'A neon skyline at night. You are a silhouette with one input and the next swing depends on the last one. Let go too early and you fall short. Hold too long and the wire snaps. Find the line.',
    playable:true, badge:'new', isOriginal:true, updated:true,
    mobileSupport:'touch-ok', inputs:['mouse','touch','keyboard'], orientation:'landscape',
    skillTags:['timing','reflex','physics','movement'], sessionLength:'short' },

  { id:'g2048', name:'2048', cat:'Puzzle', kind:'story', players:'1P', levels:'∞',
    tagline:'Numbers, merged.',
    story:'Slide the board, fuse the matches, chase that 2048 tile. Then keep going, because pride. The good run is always one move away.',
    playable:true,
    mobileSupport:'native', inputs:['swipe','keyboard'], orientation:'portrait',
    skillTags:['planning','spatial'], sessionLength:'short' },

  { id:'cutrope', name:'Snip', cat:'Puzzle', kind:'story', players:'1P', levels:16,
    tagline:'Slice. Steer. Feed Mochi.',
    story:'Mochi is hungry. There is candy at the end of a few inconvenient ropes and a small army of physics in between. Cut things in the right order. Mochi gets fed. Mochi is satisfied. You win.',
    playable:true,
    mobileSupport:'native', inputs:['touch','mouse'], orientation:'landscape',
    skillTags:['physics','timing','spatial'], sessionLength:'short' },

  { id:'bloons', name:'Loft Defense', cat:'Tower-Def', kind:'story', players:'1P', levels:10,
    tagline:'Hold the line. Spend wisely.',
    story:'A single winding path and a slow trickle of trouble that becomes a lot of trouble. Place towers. Watch the math. Hold what matters. The wave you barely survive is the one you remember.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'native', inputs:['tap','mouse'], orientation:'landscape',
    skillTags:['planning','resource-mgmt','routing'], sessionLength:'medium' },

  { id:'slither', name:'Coil', cat:'Arcade', kind:'story', players:'1P', levels:'∞',
    tagline:'Grow without touching.',
    story:'An empty arena and one rule: eat the orbs, don\'t touch anything else. Other coils drift around looking for a mistake. Yours, theirs — somebody is going to make one.',
    playable:true, badge:'new', updated:true,
    mobileSupport:'native', inputs:['touch','mouse','keyboard'], orientation:'any',
    skillTags:['reflex','spatial','movement'], sessionLength:'short', isOriginal:true },

  { id:'happywheels', name:'Faceplant', cat:'Physics', kind:'story', players:'1P', levels:1,
    tagline:'Ride the course. Keep your head off the dirt.',
    story:'One hand-drawn track between you and a green flag. The hills are kind. The landings, less so. Faster is funnier; funnier is faster. Pray the next one forgives you.',
    playable:true, badge:'new', isOriginal:true,
    mobileSupport:'desktop-first', inputs:['keyboard'], orientation:'landscape',
    skillTags:['physics','reflex','timing'], sessionLength:'short' },

  { id:'fps', name:'Raycaster FPS', cat:'Shooter', kind:'story', players:'1P', levels:1,
    tagline:'One corridor, four enemies, one gun.',
    story:'A corridor. A handful of drifters that want you gone. Aim, click, clear it. The old-school way still works.',
    playable:true,
    mobileSupport:'desktop-first', inputs:['keyboard','mouse'], orientation:'landscape',
    skillTags:['reflex','aim'], sessionLength:'short', isOriginal:true },

  { id:'grudgewood', name:'Grudgewood', cat:'Rage', kind:'story', players:'1P', levels:6,
    tagline:'The forest remembers.',
    story:'The forest is the villain. Roots want your ankles, branches want your face, and the ground is rarely the ground. Every nasty surprise has a tell. The only way out is through.',
    playable:true, badge:'new',
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['reflex','memory','timing','movement'], sessionLength:'medium',
    isOriginal:true, updated:true },

  { id:'arena', name:'Arena', cat:'Multiplayer', kind:'vs', players:'1-8', levels:1,
    tagline:'Last one standing eats free.',
    story:'A boxed arena. Bots to warm up on. Real players dropping in. Nobody hides for long.',
    playable:true, badge:'new',
    mobileSupport:'touch-ok', inputs:['keyboard','mouse'], orientation:'landscape',
    skillTags:['reflex','aim','movement'], sessionLength:'short', isOriginal:true },

  { id:'slipshot', name:'SLIPSHOT', cat:'FPS', kind:'story', players:'1P', levels:'∞',
    tagline:'Three minutes. Pure momentum.',
    story:'Slide into the jump, chain the landing into another slide, airdash between kills. The combo only climbs while you keep moving — and stopping is the worst thing that can happen. Bronze is a clean line. Silver is a pattern. Gold is a song.',
    playable:true, badge:'new',
    mobileSupport:'desktop-only', inputs:['keyboard','mouse'], orientation:'landscape',
    skillTags:['movement','reflex','aim'], sessionLength:'short', isOriginal:true, updated:true },


  { id:'bricklands', name:'Bricklands', cat:'Platformer', kind:'story', players:'1P', levels:3,
    tagline:'Three short worlds. One bouncy hero.',
    story:'Run, jump, stomp, collect. Three handcrafted runs build into a finale that asks for everything you have learned — even the parts you thought were the obvious bits.',
    playable:true, featured:true, badge:'new', isOriginal:true, updated:true,
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['reflex','timing','movement'], sessionLength:'short' },

  // HEAD-TO-HEAD
  { id:'connect4', name:'Connect 4', cat:'Classic', kind:'vs', players:'1-2', levels:3,
    tagline:'Four in a row. Old as time.',
    story:'Drop the checker. Watch the other side. The bot thinks ahead. The friend across the couch usually does not. Your call.',
    playable:true,  // headline classic — quiet break
    mobileSupport:'native', inputs:['tap','mouse','touch'], orientation:'any',
    skillTags:['planning','spatial'], sessionLength:'short' },

  { id:'eightball', name:'8-Ball Pool', cat:'Classic', kind:'vs', players:'1-2', levels:3,
    tagline:'Solids vs stripes. Finish on the 8.',
    story:'Rack. Break. Claim your side and sink them one at a time. Save the 8 for last. Lose the cue and lose the table.',
    playable:true,
    mobileSupport:'touch-ok', inputs:['mouse','touch','drag'], orientation:'landscape',
    skillTags:['physics','aim','planning'], sessionLength:'medium' },

  { id:'goalbound', name:'Goalbound', cat:'Sports', kind:'vs', players:'1-2', levels:3,
    tagline:'One pitch. One minute. All yours.',
    story:'Two rivals, one minute, and a pitch small enough that every touch counts. Whoever blinks first is out.',
    playable:true, badge:'new', isOriginal:true, updated:true,
    mobileSupport:'touch-ok', inputs:['keyboard','touch'], orientation:'landscape',
    skillTags:['timing','reflex','physics'], sessionLength:'short' },

  { id:'basket', name:'Hoop Shot', cat:'Sports', kind:'story', players:'1P', levels:'∞',
    tagline:'Ninety seconds. One sliding hoop.',
    story:'Drag back. Release. Watch it fall. The hoop slides; you don\'t. Streak the makes and the score climbs faster than you can throw.',
    playable:true, badge:'new',
    mobileSupport:'native', inputs:['touch','mouse','drag'], orientation:'landscape',
    skillTags:['aim-trajectory','timing','physics'], sessionLength:'short', isOriginal:true },
];

// Editorial collections — curated rails on the lobby and search palette.
// Each blurb is an opinion, not a product description. These rotate when
// the roster meaningfully changes, not on a schedule.
export const COLLECTIONS = [
  {
    id: 'new-updated',
    title: 'New & updated',
    blurb: 'Fresh ships and recent refreshes. Start here if you have not been by in a week.',
    ids: ['bricklands', 'slither', 'grudgewood', 'goalbound', 'slipshot'],
  },
  {
    id: 'originals',
    title: 'PG.Play originals',
    blurb: 'Built here, shipped here. The hand-made games this place exists for.',
    ids: ['bricklands', 'grudgewood', 'goalbound', 'slither', 'slipshot', 'arena', 'basket', 'aow', 'fps'],
  },
  {
    id: 'start-in-ten',
    title: 'Start in ten seconds',
    blurb: 'Zero tutorial. See it, get it, into a run before this sentence ends.',
    ids: ['g2048', 'connect4', 'cutrope', 'hook', 'happywheels'],
  },
  {
    id: 'twitch',
    title: 'Fast twitch',
    blurb: 'Movement, aim, timing. Sessions end in seconds, mastery takes hours.',
    ids: ['slipshot', 'fps', 'hook', 'arena', 'goalbound', 'vex'],
  },
  {
    id: 'brainy',
    title: 'Brainy',
    blurb: 'Plan over reflex. Good for a rainy afternoon.',
    ids: ['g2048', 'cutrope', 'bloons', 'connect4', 'aow'],
  },
  {
    id: 'mean-and-funny',
    title: 'Mean, but funny',
    blurb: 'Restart for the fifteenth time. Laugh. One more.',
    ids: ['grudgewood', 'happywheels', 'vex'],
  },
  {
    id: 'pass-the-laptop',
    title: 'Pass the laptop',
    blurb: 'Two people, one keyboard, no setup.',
    ids: ['goalbound', 'connect4', 'eightball', 'arena'],
  },
  {
    id: 'couch-coop',
    title: 'Same-team co-op',
    blurb: 'Two players on the same side. Clearing the level is the celebration.',
    ids: ['fbwg', 'badicecream'],
  },
  {
    id: 'phone-friendly',
    title: 'Works on your phone',
    blurb: 'Touch-native by design. Same game, smaller screen.',
    ids: ['g2048', 'cutrope', 'slither', 'connect4', 'basket', 'goalbound', 'papa'],
  },
];

// The four headline originals — these get the bento hero tiles on home.
// Phase 20: Frost Fight promoted to hero tier; Goalbound demoted to a
// classic-slot card so the user-requested top tier reads:
//   Frost Fight, Slipshot, Grudgewood, Coil, Goalbound, Connect 4.
export const EDITORS_PICKS = ['badicecream', 'slipshot', 'grudgewood', 'slither'];

// Filter taxonomy used by the homepage chip strip and sidebar.
export const FILTERS = [
  { id:'all',    label:'All',    match: () => true },
  { id:'solo',   label:'Solo',   match: (g) => g.kind === 'story' && !g.players.includes('co-op') },
  { id:'versus', label:'Versus', match: (g) => g.kind === 'vs' },
  { id:'coop',   label:'Co-op',  match: (g) => g.players.includes('co-op') },
];

// Genre groupings — fold the long-tail `cat` values into a handful of
// arcade-style buckets that fit a sidebar without scrolling. Each genre
// matches by membership in `cats`.
export const GENRES = [
  { id:'action',    label:'Action',     cats:['Action','FPS','Shooter','Rage','Multiplayer'] },
  { id:'puzzle',    label:'Puzzle',     cats:['Puzzle','Classic'] },
  { id:'arcade',    label:'Arcade',     cats:['Arcade'] },
  { id:'platformer',label:'Platformer', cats:['Platformer'] },
  { id:'sports',    label:'Sports',     cats:['Sports'] },
  { id:'strategy',  label:'Strategy',   cats:['Strategy','Tower-Def'] },
  { id:'casual',    label:'Casual',     cats:['Time-mgmt','Physics','Stealth','Co-op'] },
];

export function genreMatches(genreId, game) {
  const g = GENRES.find((x) => x.id === genreId);
  return g ? g.cats.includes(game.cat) : true;
}
