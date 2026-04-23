// kind: 'story' = solo or same-team co-op | 'vs' = head-to-head (vs bot or 2P local)
export const GAMES = [
  // STORY / CO-OP
  { id:'fbwg', name:'Fireboy & Watergirl', cat:'Co-op', kind:'story', players:'1-2 co-op', levels:32,
    tagline:'Two elementals. One forgotten temple.',
    story:'Fireboy burns hot. Watergirl runs cool. Together they brave the four temples — Forest, Light, Ice, Crystal — scavenging gems and outwitting pressure plates. Separated, they fail. Split a keyboard, split the gems, get out alive.',
    playable:true, featured:true, badge:'co-op' },

  { id:'bob', name:'Bob the Robber', cat:'Stealth', kind:'story', players:'1P', levels:20,
    tagline:'A burglar with a conscience.',
    story:'Bob grew up hearing whispers about crooked bankers and dirty politicians. Grown up, he took matters into his gloved hands. Slip past guards, crack safes, dodge the beam of every patrolling flashlight — and only steal from the ones who had it coming.' },

  { id:'badicecream', name:'Bad Ice Cream', cat:'Co-op', kind:'story', players:'1-2 co-op', levels:40,
    tagline:'Fruit. Ice. No mercy.',
    story:'You are an ice cream. The fruit has gone feral. Freeze tunnels through ice blocks, corner the marching strawberries, and never, ever stand next to a bomb. Works solo, works better as a two-cone tag-team.',
    badge:'co-op' },

  { id:'aow', name:'Age of War 2', cat:'Strategy', kind:'story', players:'1P', levels:5,
    tagline:'From spear to spaceship.',
    story:'Five ages of warfare — Caveman, Castle, Renaissance, Modern, Future — and one base you have to keep breathing. Spawn troops, upgrade turrets, evolve your civilization before the other side overruns your gate.' },

  { id:'vex', name:'Vex', cat:'Platformer', kind:'story', players:'1P', levels:10,
    tagline:'Act IX: the parkour nightmare.',
    story:'Buzzsaws spin. Spikes ambush. You have no name, no weapon, just a stickman\'s balance and a wall-jump. Each act is a trial — slide under, leap over, and never trust a block that moves on its own.',
    badge:'new' },

  { id:'papa', name:"Papa's Pizzeria", cat:'Time-mgmt', kind:'story', players:'1P', levels:30,
    tagline:'Papa Louie left you in charge.',
    story:'Monday: you were bussing tables. Tuesday: Papa handed you the apron and vanished. Take orders, build pies to exact topping specs, slide them into a screaming oven, slice with a steady hand. Thirty shifts. No burning.' },

  { id:'hook', name:'Stickman Hook', cat:'Platformer', kind:'story', players:'1P', levels:75,
    tagline:'Swing through the impossible.',
    story:'One button. Attach, detach, pendulum, fling. Seventy-five neon courses between you and the flag — miss the grab, you splat. Land it, and you loop back through levels you thought were too long for a human arm.' },

  { id:'g2048', name:'2048', cat:'Puzzle', kind:'story', players:'1P', levels:'∞',
    tagline:'Numbers, merged.',
    story:'The tile Threes fell in love with the tile Fives, but math is math — you can only merge equals. Slide the board. Fuse 2 into 4, 4 into 8, all the way to that elusive 2048 tile. Then keep going, because pride.' },

  { id:'cutrope', name:'Cut the Rope', cat:'Puzzle', kind:'story', players:'1P', levels:25,
    tagline:'Om Nom is hungry.',
    story:'A small green creature in a cardboard box, staring up at a piece of candy on a string. Your job: slice the rope at the right angle, pop the bubble at the right time, collect every star on the way down. Feed the monster.' },

  { id:'bloons', name:'Bloons TD', cat:'Tower-Def', kind:'story', players:'1P', levels:20,
    tagline:'Defend the track. Pop everything.',
    story:'Balloons float along a path. You place dart-throwing monkeys, boomerang monkeys, ice monkeys, eventually super monkeys. Twenty rounds of increasingly absurd balloon waves — camo, lead, ceramic, MOAB. None must reach the end.' },

  { id:'slither', name:'Slither.io', cat:'Arcade', kind:'story', players:'1P', levels:'∞',
    tagline:'Eat. Grow. Don’t head-butt.',
    story:'You start as a single worm. Orbs are food. Other snakes are competition and, if you cut them off, dinner. Outlast the field, stretch across the arena, and never — never — let your head touch another body.' },

  { id:'happywheels', name:'Happy Wheels', cat:'Physics', kind:'story', players:'1P', levels:15,
    tagline:'Gravity has opinions.',
    story:'A man in a wheelchair with a rocket strapped to the back. A kid on a scooter chasing his dad down a hill. Fifteen hand-crafted tracks of ramps, spikes, cannons and questionable decisions. Finish the course — bones optional.',
    badge:'hot' },

  // HEAD-TO-HEAD
  { id:'connect4', name:'Connect 4', cat:'Classic', kind:'vs', players:'1-2', levels:3,
    tagline:'Four in a row. Old as time.',
    story:'Drop checkers, yellow vs red, into a seven-by-six grid. First to align four — horizontal, vertical, diagonal — wins. The bot thinks three moves ahead; your friend across the couch thinks zero. Your call.',
    playable:true },

  { id:'eightball', name:'8-Ball Pool', cat:'Classic', kind:'vs', players:'1-2', levels:3,
    tagline:'Solids vs stripes. Finish on the 8.',
    story:'Rack them, break them, claim your suit, sink them one by one. Pocket the 8-ball last — not before. Play the bot for a quick match, or swap sticks with someone across the table.',
    playable:true, badge:'hot' },

  { id:'football', name:'Football Legends', cat:'Sports', kind:'vs', players:'1-2', levels:3,
    tagline:'2v2 street-ball chaos.',
    story:'A two-on-two pitch, oversized nets, trick kicks that defy physics. Pick your legend, shoot a curled bicycle from midfield, and yell at your teammate — whether that\'s the bot or the friend on the other keyboard.' },

  { id:'basket', name:'Basket Champs', cat:'Sports', kind:'vs', players:'1-2', levels:3,
    tagline:'Aim. Arc. Drain the three.',
    story:'Two characters, one hoop, twenty-one points. Each turn you drag to aim, release to shoot — angle and power, that\'s it. Miss and the ball drops to the floor; your opponent lines up next. The court is yours until it isn\'t.' },
];

export const STORY_GAMES = GAMES.filter(g => g.kind === 'story');
export const VS_GAMES    = GAMES.filter(g => g.kind === 'vs');

export const PALETTES = [
  { name:'Cyan',    accent:'#00fff5', a2:'#ffe14f' },
  { name:'Magenta', accent:'#ff4d8e', a2:'#ffe14f' },
  { name:'Lime',    accent:'#c8ff3a', a2:'#ff8a3a' },
  { name:'Violet',  accent:'#a78bfa', a2:'#f0abfc' },
  { name:'Amber',   accent:'#ffb547', a2:'#35f0c9' },
];

export const SHAPES = [
  { id:'rect',    name:'Sharp' },
  { id:'default', name:'Soft' },
  { id:'round',   name:'Pill' },
];

export const CRT_OPTS = [
  { id:'on',  name:'On' },
  { id:'off', name:'Off' },
];

export const hexToRgbStr = (hex) => {
  const h = hex.replace('#','');
  const n = h.length===3 ? h.split('').map(c => c+c).join('') : h;
  return `${parseInt(n.slice(0,2),16)}, ${parseInt(n.slice(2,4),16)}, ${parseInt(n.slice(4,6),16)}`;
};
