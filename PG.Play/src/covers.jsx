// Game cover art — each game gets its own SVG scene.
// Drawn at 400×500 viewBox, scaled by the card.
// Defs are inlined per-SVG via <SharedDefs/> so every cover
// is fully self-contained (no cross-SVG id references).

const SharedDefs = () => (
  <defs>
    <pattern id="grain-pattern" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.4" fill="#fff" />
    </pattern>
    <linearGradient id="fbwg-grad" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stopColor="#ff4d6d"/><stop offset="1" stopColor="#1b82f5"/>
    </linearGradient>
  </defs>
);
const Grain = () => (
  <rect width="400" height="500" fill="url(#grain-pattern)" opacity="0.06" />
);

// 1. Fireboy & Watergirl
const Cover_FBWG = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <rect width="400" height="500" fill="#1a0e1e"/>
    <rect width="400" height="260" fill="url(#fbwg-grad)" opacity="0.18"/>
    <rect x="0"   y="380" width="180" height="20" fill="#2b1420"/>
    <rect x="220" y="380" width="180" height="20" fill="#2b1420"/>
    <rect x="0"   y="470" width="400" height="30" fill="#140810"/>
    <rect x="260" y="470" width="80" height="30" fill="#1b82f5" opacity="0.55"/>
    <rect x="60"  y="470" width="80" height="30" fill="#ff4d6d" opacity="0.55"/>
    <g transform="translate(100,340)">
      <path d="M20,40 Q0,20 10,0 Q20,14 28,6 Q36,18 40,0 Q50,20 30,40 Z" fill="#ff4d6d" stroke="#fff2" strokeWidth="1"/>
      <circle cx="18" cy="22" r="2" fill="#fff"/><circle cx="30" cy="22" r="2" fill="#fff"/>
    </g>
    <g transform="translate(270,340)">
      <path d="M20,40 Q0,20 10,0 Q20,14 28,6 Q36,18 40,0 Q50,20 30,40 Z" fill="#35d6f5" stroke="#fff3" strokeWidth="1"/>
      <circle cx="18" cy="22" r="2" fill="#0a1020"/><circle cx="30" cy="22" r="2" fill="#0a1020"/>
    </g>
    <g opacity="0.9">
      <polygon points="190,200 180,215 200,215" fill="#ffe14f"/>
      <polygon points="110,180 103,190 117,190" fill="#35f0c9"/>
      <polygon points="300,190 290,205 310,205" fill="#ff4d6d"/>
    </g>
    <Grain/>
  </svg>
);

// 2. Bob the Robber
const Cover_Bob = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <rect width="400" height="500" fill="#0a1020"/>
    <rect x="30" y="60" width="340" height="440" fill="#1a2540" stroke="#2a3860"/>
    {[0,1,2,3,4].map(r => [0,1,2,3].map(c => {
      const lit = (r+c)%3===1;
      return <rect key={`${r}-${c}`} x={60+c*78} y={90+r*70} width="55" height="40"
        fill={lit?'#ffe14f':'#0f1830'} stroke="#2a3860" opacity={lit?0.9:1}/>;
    }))}
    <circle cx="340" cy="70" r="24" fill="#f3efe8" opacity="0.85"/>
    <circle cx="332" cy="66" r="22" fill="#0a1020"/>
    <g transform="translate(160,300)">
      <rect x="8" y="60" width="44" height="80" rx="4" fill="#0a0d0e"/>
      <circle cx="30" cy="52" r="22" fill="#0a0d0e"/>
      <rect x="10" y="44" width="40" height="8" fill="#1a1a1a"/>
      <circle cx="22" cy="48" r="2" fill="#fff"/><circle cx="38" cy="48" r="2" fill="#fff"/>
      <path d="M52,90 Q80,80 84,110 Q86,130 60,130 Z" fill="#2a1f1a" stroke="#4d3a2a"/>
      <text x="66" y="115" fontSize="10" fill="#ffe14f" fontFamily="serif" fontWeight="700">$</text>
    </g>
    <Grain/>
  </svg>
);

// 3. Connect 4
const Cover_Connect4 = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <defs>
      <linearGradient id="c4-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1b3a8f"/><stop offset="1" stopColor="#0a1a4a"/>
      </linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#c4-bg)"/>
    <rect x="50" y="90" width="300" height="320" rx="16" fill="#2448c0" stroke="#4a75e0" strokeWidth="2"/>
    {Array.from({length:6},(_,r)=>
      Array.from({length:7},(_,c)=>{
        const cx=50+30+c*35, cy=90+30+r*35;
        const p = ['.......','.......','...r...','..ryr..','.yryry.','ryryryr'];
        const ch = p[r][c];
        const fill = ch==='r'?'#ff4d6d':ch==='y'?'#ffe14f':'#0a1a4a';
        return (
          <g key={`${r}-${c}`}>
            <circle cx={cx} cy={cy} r="14" fill={fill} stroke={ch==='.'?'#142a72':'#0005'} strokeWidth="1"/>
            {ch!=='.' && <circle cx={cx} cy={cy} r="14" fill="none" stroke="#fff2" strokeWidth="1"/>}
          </g>
        );
      })
    )}
    <circle cx="155" cy="60" r="16" fill="#ff4d6d" stroke="#fff3"/>
    <Grain/>
  </svg>
);

// 4. 8-Ball Pool
const Cover_EightBall = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <rect width="400" height="500" fill="#0e2820"/>
    <rect x="30" y="50" width="340" height="400" rx="20" fill="#0f4433" stroke="#5a3a20" strokeWidth="10"/>
    <rect x="40" y="60" width="320" height="380" rx="14" fill="#12503c"/>
    {[[50,70],[350,70],[50,430],[350,430],[200,60],[200,440]].map(([x,y],i)=>
      <circle key={i} cx={x} cy={y} r="14" fill="#000"/>
    )}
    <g transform="translate(175,160)">
      {[
        [0,0,'#ffe14f','1'],[30,0,'#1b82f5','2'],[-30,0,'#ff4d6d','3'],
        [15,25,'#0a0d0e','8'],[-15,25,'#9b4ff0','4'],[45,25,'#ff8a3a','5'],[-45,25,'#35d6f5','6'],
      ].map(([x,y,c,n],i)=>(
        <g key={i} transform={`translate(${x},${y})`}>
          <circle r="14" fill={c} stroke="#fff5" strokeWidth="1"/>
          <circle r="6" fill="#fff" opacity="0.85"/>
          <text textAnchor="middle" y="3" fontSize="8" fontFamily="sans-serif" fontWeight="700" fill="#0a0d0e">{n}</text>
          <circle cx="-5" cy="-5" r="3" fill="#fff6"/>
        </g>
      ))}
    </g>
    <circle cx="110" cy="340" r="15" fill="#fff" stroke="#0003"/>
    <line x1="60" y1="380" x2="120" y2="340" stroke="#b9830b" strokeWidth="5" strokeLinecap="round"/>
    <line x1="60" y1="380" x2="120" y2="340" stroke="#ffe6c0" strokeWidth="1"/>
    <Grain/>
  </svg>
);

// 5. Football
const Cover_Football = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <defs>
      <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#2d6a2a"/><stop offset="1" stopColor="#1a4a1a"/>
      </linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#grass)"/>
    {Array.from({length:8},(_,i)=>
      <rect key={i} x="0" y={i*62} width="400" height="31" fill="#000" opacity="0.06"/>
    )}
    <g transform="translate(100,40)">
      <rect width="200" height="110" fill="none" stroke="#fff" strokeWidth="3"/>
      <path d="M0,0 L-12,-24 L212,-24 L200,0 M200,110 L212,134 M0,110 L-12,134" fill="none" stroke="#fff" strokeWidth="2"/>
      {Array.from({length:10},(_,i)=>
        <line key={i} x1={i*22} y1="0" x2={i*22} y2="110" stroke="#fff5" strokeWidth="1"/>
      )}
      {Array.from({length:6},(_,i)=>
        <line key={`h${i}`} x1="0" y1={i*22} x2="200" y2={i*22} stroke="#fff5" strokeWidth="1"/>
      )}
    </g>
    <g transform="translate(140,310)">
      <circle cx="25" cy="10" r="14" fill="#ff4d6d"/>
      <path d="M12,24 L38,24 L42,70 L28,74 L22,74 L8,70 Z" fill="#ff4d6d"/>
      <path d="M8,70 L0,100 M42,70 L56,100" stroke="#ff4d6d" strokeWidth="10" strokeLinecap="round"/>
    </g>
    <g transform="translate(240,360)">
      <circle r="22" fill="#fff"/>
      <polygon points="0,-12 10,-5 7,7 -7,7 -10,-5" fill="#0a0d0e"/>
      <path d="M-12,-6 L-22,-2 M12,-6 L22,-2 M7,14 L14,22 M-7,14 L-14,22 M0,-22 L0,-12" stroke="#0a0d0e" strokeWidth="2" fill="none"/>
    </g>
    <Grain/>
  </svg>
);

// 6. Basket Champs
const Cover_Basket = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <defs>
      <linearGradient id="bc-bg" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ff8a3a"/><stop offset="1" stopColor="#c84d1a"/>
      </linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#bc-bg)"/>
    <g transform="translate(280,120)">
      <rect x="-10" y="-60" width="20" height="60" fill="#1a1a1a"/>
      <rect x="-60" y="0" width="120" height="70" fill="#fff" stroke="#1a1a1a" strokeWidth="3"/>
      <rect x="-30" y="10" width="60" height="40" fill="none" stroke="#ff4d6d" strokeWidth="3"/>
      <ellipse cx="0" cy="85" rx="40" ry="8" fill="none" stroke="#ff4d6d" strokeWidth="5"/>
      <path d="M-38,88 L-30,130 L0,138 L30,130 L38,88" fill="none" stroke="#fff" strokeWidth="2"/>
      <path d="M-30,92 L30,92 M-20,110 L20,110 M-10,128 L10,128" stroke="#fff" strokeWidth="1"/>
    </g>
    <g transform="translate(140,340)">
      <circle r="40" fill="#ff8a3a" stroke="#2a1a0a" strokeWidth="3"/>
      <path d="M-40,0 L40,0 M0,-40 L0,40" stroke="#2a1a0a" strokeWidth="2" fill="none"/>
      <path d="M-28,-28 Q0,-10 28,-28 M-28,28 Q0,10 28,28" stroke="#2a1a0a" strokeWidth="2" fill="none"/>
      <circle r="40" fill="url(#grain-pattern)" opacity="0.2"/>
    </g>
    <g fill="#fff" opacity="0.6">
      <circle cx="170" cy="300" r="3"/><circle cx="200" cy="260" r="3"/>
      <circle cx="230" cy="220" r="3"/><circle cx="260" cy="185" r="3"/>
    </g>
    <Grain/>
  </svg>
);

// 7. Bad Ice Cream
const Cover_BadIceCream = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <rect width="400" height="500" fill="#bfe6f5"/>
    {[...Array(40)].map((_,i)=>{
      const x = (i%8)*50, y = Math.floor(i/8)*62+60;
      const has = [3,5,11,14,17,22,27,29,31,34,36,39].includes(i);
      if (!has) return null;
      return <g key={i}>
        <rect x={x} y={y} width="48" height="60" fill="#e8f7ff" stroke="#7ac0e0" strokeWidth="2" rx="2"/>
        <line x1={x+8} y1={y+6} x2={x+18} y2={y+14} stroke="#b0dcf0" strokeWidth="2"/>
      </g>;
    })}
    <g fill="#ff4d6d">
      <circle cx="110" cy="180" r="10"/><circle cx="280" cy="240" r="10"/>
      <circle cx="180" cy="310" r="10"/>
    </g>
    <g transform="translate(140,360)">
      <polygon points="30,40 90,40 60,100" fill="#d4a460" stroke="#8b5a2b" strokeWidth="2"/>
      <path d="M40,60 L80,60 M45,75 L75,75" stroke="#8b5a2b" strokeWidth="1"/>
      <circle cx="60" cy="30" r="36" fill="#ff8ec6" stroke="#2a1a1a" strokeWidth="2"/>
      <circle cx="48" cy="22" r="4" fill="#fff"/>
      <circle cx="72" cy="22" r="4" fill="#fff"/>
      <circle cx="48" cy="22" r="2" fill="#0a0d0e"/>
      <circle cx="72" cy="22" r="2" fill="#0a0d0e"/>
      <path d="M40,12 L54,18 M66,18 L80,12" stroke="#0a0d0e" strokeWidth="3" strokeLinecap="round"/>
      <path d="M48,42 Q60,34 72,42" fill="none" stroke="#0a0d0e" strokeWidth="2"/>
    </g>
    <Grain/>
  </svg>
);

// 8. Age of War 2
const Cover_AoW = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <defs>
      <linearGradient id="aow-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff8a3a"/><stop offset="0.55" stopColor="#6b2a0a"/><stop offset="1" stopColor="#1a0a06"/>
      </linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#aow-bg)"/>
    <circle cx="200" cy="150" r="60" fill="#ffe14f" opacity="0.3"/>
    <circle cx="200" cy="150" r="38" fill="#ffe14f" opacity="0.6"/>
    <path d="M0,380 L400,380 L400,500 L0,500 Z" fill="#0a0604"/>
    <path d="M0,380 L400,380" stroke="#c84d1a" strokeWidth="2"/>
    <g transform="translate(20,290)">
      <path d="M0,90 L20,20 L60,20 L80,90 Z" fill="#4a3a2a" stroke="#2a1a0a" strokeWidth="2"/>
      <rect x="30" y="50" width="20" height="40" fill="#0a0604"/>
    </g>
    <g transform="translate(300,270)">
      <rect x="0" y="30" width="80" height="80" fill="#5a5a6a" stroke="#2a2a3a" strokeWidth="2"/>
      <rect x="5" y="15" width="10" height="15" fill="#5a5a6a"/>
      <rect x="25" y="15" width="10" height="15" fill="#5a5a6a"/>
      <rect x="45" y="15" width="10" height="15" fill="#5a5a6a"/>
      <rect x="65" y="15" width="10" height="15" fill="#5a5a6a"/>
      <rect x="30" y="60" width="20" height="30" fill="#0a0604"/>
    </g>
    <g fill="#0a0604">
      <g transform="translate(110,340)">
        <circle cx="8" cy="0" r="7"/><rect x="4" y="7" width="8" height="18"/>
        <line x1="6" y1="14" x2="-6" y2="10" stroke="#0a0604" strokeWidth="5" strokeLinecap="round"/>
        <line x1="-8" y1="4" x2="-16" y2="-10" stroke="#6b3a1a" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="-16" cy="-12" r="6" fill="#6b3a1a"/>
      </g>
      <g transform="translate(240,340)">
        <circle cx="8" cy="0" r="7" fill="#c0c0c0"/>
        <rect x="4" y="7" width="8" height="18" fill="#6a6a7a"/>
        <line x1="14" y1="-6" x2="26" y2="-22" stroke="#c0c0c0" strokeWidth="3"/>
        <polygon points="26,-22 30,-30 34,-22" fill="#c0c0c0"/>
      </g>
    </g>
    <text x="200" y="450" textAnchor="middle" fontFamily="monospace" fontSize="12" fill="#ffe14f" letterSpacing="2">— ERA II —</text>
    <Grain/>
  </svg>
);

// 9. Vex
const Cover_Vex = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <rect width="400" height="500" fill="#f3efe8"/>
    {Array.from({length:20},(_,i)=><line key={`v${i}`} x1={i*22} y1="0" x2={i*22} y2="500" stroke="#c8bfb0" strokeWidth="0.5"/>)}
    {Array.from({length:25},(_,i)=><line key={`h${i}`} x1="0" y1={i*22} x2="400" y2={i*22} stroke="#c8bfb0" strokeWidth="0.5"/>)}
    <rect x="0" y="340" width="150" height="20" fill="#0a0d0e"/>
    <rect x="200" y="260" width="120" height="18" fill="#0a0d0e"/>
    <rect x="60" y="200" width="120" height="18" fill="#0a0d0e"/>
    <g transform="translate(350,330) rotate(20)">
      <circle r="22" fill="#ff4d6d"/>
      {Array.from({length:10},(_,i)=>{
        const a = (i*36)*Math.PI/180;
        const x = Math.cos(a)*30, y = Math.sin(a)*30;
        return <polygon key={i} points={`${x-3},${y} ${x+3},${y} ${x*1.4/1.2},${y*1.4/1.2}`} fill="#ff4d6d"/>;
      })}
      <circle r="8" fill="#0a0d0e"/>
    </g>
    <g stroke="#0a0d0e" strokeWidth="3" strokeLinecap="round" fill="none">
      <circle cx="150" cy="160" r="10" fill="#0a0d0e"/>
      <line x1="150" y1="170" x2="150" y2="200"/>
      <line x1="150" y1="200" x2="135" y2="225"/>
      <line x1="150" y1="200" x2="170" y2="230"/>
      <line x1="150" y1="180" x2="130" y2="170"/>
      <line x1="150" y1="180" x2="175" y2="165"/>
    </g>
    <g stroke="#35f0c9" strokeWidth="2" opacity="0.7">
      <line x1="100" y1="160" x2="130" y2="170"/>
      <line x1="90" y1="180" x2="125" y2="190"/>
      <line x1="80" y1="200" x2="120" y2="210"/>
    </g>
    <Grain/>
  </svg>
);

// 10. Papa's Pizzeria
const Cover_Papa = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <defs>
      <radialGradient id="papa-bg">
        <stop offset="0" stopColor="#ff8a3a"/><stop offset="1" stopColor="#8b2f1a"/>
      </radialGradient>
    </defs>
    <rect width="400" height="500" fill="url(#papa-bg)"/>
    {Array.from({length:8},(_,c)=>Array.from({length:4},(_,r)=>{
      const odd=(c+r)%2;
      return <rect key={`${c}${r}`} x={c*50} y={380+r*30} width="50" height="30" fill={odd?'#f3efe8':'#8b2f1a'}/>;
    }))}
    <g transform="translate(200,260)">
      <circle r="120" fill="#2a1a0a"/>
      <circle r="108" fill="#ffdb8b"/>
      <circle r="100" fill="#c6412a"/>
      <circle r="94" fill="#f3efe8" opacity="0.35"/>
      {[[-50,-30],[20,-50],[60,20],[-30,50],[40,-10],[-70,10],[10,60]].map(([x,y],i)=>
        <g key={i}>
          <circle cx={x} cy={y} r="14" fill="#a32220"/>
          <circle cx={x-2} cy={y-2} r="11" fill="#c93636"/>
        </g>
      )}
      <line x1="0" y1="0" x2="100" y2="0" stroke="#2a1a0a" strokeWidth="2"/>
      <line x1="0" y1="0" x2="50" y2="87" stroke="#2a1a0a" strokeWidth="2"/>
    </g>
    <Grain/>
  </svg>
);

// 11. Stickman Hook
const Cover_Hook = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <defs>
      <linearGradient id="hook-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff8ec6"/><stop offset="1" stopColor="#9b4ff0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#hook-bg)"/>
    <g fill="#fff">
      <circle cx="80" cy="100" r="12"/><circle cx="80" cy="100" r="6" fill="#9b4ff0"/>
      <circle cx="220" cy="70" r="12"/><circle cx="220" cy="70" r="6" fill="#9b4ff0"/>
      <circle cx="340" cy="140" r="12"/><circle cx="340" cy="140" r="6" fill="#9b4ff0"/>
    </g>
    <line x1="220" y1="70" x2="180" y2="280" stroke="#ffe14f" strokeWidth="2"/>
    <g stroke="#0a0d0e" strokeWidth="4" strokeLinecap="round" fill="none">
      <circle cx="180" cy="280" r="12" fill="#0a0d0e"/>
      <line x1="180" y1="292" x2="180" y2="330"/>
      <line x1="180" y1="330" x2="165" y2="360"/>
      <line x1="180" y1="330" x2="200" y2="370"/>
      <line x1="180" y1="300" x2="220" y2="78" stroke="#ffe14f"/>
      <line x1="180" y1="300" x2="155" y2="320" stroke="#0a0d0e"/>
    </g>
    <g transform="translate(330,400)">
      <line x1="0" y1="0" x2="0" y2="-80" stroke="#f3efe8" strokeWidth="3"/>
      <polygon points="0,-80 30,-70 0,-60" fill="#35f0c9"/>
    </g>
    <Grain/>
  </svg>
);

// 12. 2048
const Cover_2048 = () => {
  const vals = [
    [0,2,4,8],
    [4,16,32,8],
    [8,64,128,4],
    [2,256,2048,16],
  ];
  const colors = {
    0:'#1a1a1a',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',
    32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',2048:'#edc22e'
  };
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <SharedDefs/>
      <rect width="400" height="500" fill="#bbada0"/>
      <g transform="translate(40,80)">
        {vals.map((row,r)=>row.map((v,c)=>{
          const x = c*80, y = r*80;
          const bg = colors[v] || '#cdc1b4';
          const fc = v===0?'transparent':v<=4?'#776e65':'#f9f6f2';
          return (
            <g key={`${r}${c}`} transform={`translate(${x},${y})`}>
              <rect width="72" height="72" rx="4" fill={v===0?'rgba(238,228,218,0.35)':bg}/>
              {v!==0 && <text x="36" y="48" textAnchor="middle" fontFamily="sans-serif" fontWeight="800"
                fontSize={v<100?32:v<1000?24:18} fill={fc}>{v}</text>}
            </g>
          );
        }))}
      </g>
      <Grain/>
    </svg>
  );
};

// 13. Cut the Rope
const Cover_CutRope = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <defs>
      <linearGradient id="rope-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a1a3a"/><stop offset="1" stopColor="#0a0612"/>
      </linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#rope-bg)"/>
    <g fill="#ffe14f">
      {[[90,180],[280,220],[200,120]].map(([x,y],i)=>{
        const pts = Array.from({length:10},(_,j)=>{
          const a = (j*36-90)*Math.PI/180;
          const r = j%2===0?14:6;
          return `${x+Math.cos(a)*r},${y+Math.sin(a)*r}`;
        }).join(' ');
        return <polygon key={i} points={pts}/>;
      })}
    </g>
    <line x1="100" y1="80" x2="190" y2="330" stroke="#b9830b" strokeWidth="3"/>
    <line x1="300" y1="80" x2="210" y2="330" stroke="#b9830b" strokeWidth="3"/>
    <circle cx="100" cy="80" r="10" fill="#7a5a2a"/>
    <circle cx="300" cy="80" r="10" fill="#7a5a2a"/>
    <g transform="translate(200,340)">
      <rect x="-30" y="-30" width="60" height="60" rx="14" fill="#ff4d6d"/>
      <rect x="-30" y="-30" width="60" height="60" rx="14" fill="url(#grain-pattern)" opacity="0.3"/>
      <path d="M-30,0 L-50,-15 L-45,0 L-50,15 Z" fill="#ff4d6d"/>
      <path d="M30,0 L50,-15 L45,0 L50,15 Z" fill="#ff4d6d"/>
    </g>
    <g transform="translate(200,440)">
      <ellipse cx="0" cy="0" rx="40" ry="34" fill="#6fbf2a"/>
      <circle cx="-12" cy="-10" r="9" fill="#fff"/>
      <circle cx="12" cy="-10" r="9" fill="#fff"/>
      <circle cx="-10" cy="-8" r="4" fill="#0a0d0e"/>
      <circle cx="14" cy="-8" r="4" fill="#0a0d0e"/>
      <path d="M-14,10 Q0,24 14,10 L14,14 L-14,14 Z" fill="#0a0d0e"/>
      <rect x="-10" y="12" width="4" height="6" fill="#fff"/>
      <rect x="-2" y="12" width="4" height="6" fill="#fff"/>
      <rect x="6" y="12" width="4" height="6" fill="#fff"/>
    </g>
    <Grain/>
  </svg>
);

// 14. Bloons TD
const Cover_Bloons = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <rect width="400" height="500" fill="#5aa84a"/>
    <path d="M-10,100 Q100,100 100,200 T200,300 T360,400" fill="none" stroke="#d4b479" strokeWidth="30" strokeLinecap="round"/>
    <path d="M-10,100 Q100,100 100,200 T200,300 T360,400" fill="none" stroke="#8b6b3a" strokeWidth="2" strokeDasharray="4 4"/>
    {[['#ff4d6d',80,100],['#1b82f5',120,160],['#ffe14f',140,220],['#35f0c9',180,270],['#9b4ff0',240,340]].map(([c,x,y],i)=>(
      <g key={i} transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="0" rx="18" ry="22" fill={c}/>
        <ellipse cx="-6" cy="-8" rx="4" ry="6" fill="#fff" opacity="0.5"/>
        <line x1="0" y1="22" x2="0" y2="40" stroke="#0a0d0e" strokeWidth="1"/>
        <polygon points="-4,22 4,22 0,28" fill={c}/>
      </g>
    ))}
    <g transform="translate(300,220)">
      <circle r="28" fill="#7a3a1a" stroke="#3a1a08" strokeWidth="2"/>
      <circle r="20" fill="#c68a5a"/>
      <circle cx="-8" cy="-4" r="3" fill="#0a0d0e"/>
      <circle cx="8" cy="-4" r="3" fill="#0a0d0e"/>
      <circle cx="-10" cy="6" r="5" fill="#c68a5a"/>
      <circle cx="10" cy="6" r="5" fill="#c68a5a"/>
      <line x1="0" y1="0" x2="60" y2="0" stroke="#0a0d0e" strokeWidth="2"/>
      <polygon points="60,-4 70,0 60,4" fill="#c0c0c0"/>
    </g>
    <Grain/>
  </svg>
);

// 15. Slither.io
const Cover_Slither = () => {
  const body = [];
  for (let i = 0; i < 28; i++) {
    const t = i / 27;
    const x = 40 + 320*t;
    const y = 260 + Math.sin(t*Math.PI*2)*80;
    const r = 22 - i*0.4;
    const hue = 160 + i*4;
    body.push({x,y,r,hue});
  }
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <SharedDefs/>
      <rect width="400" height="500" fill="#0a0d0e"/>
      {Array.from({length:100},(_,i)=>{
        const x = (i%10)*40 + 20, y = Math.floor(i/10)*50 + 30;
        return <circle key={i} cx={x} cy={y} r="1" fill="#1c2630"/>;
      })}
      {[[120,100],[330,120],[80,420],[340,380],[220,160]].map(([x,y],i)=>
        <g key={i}>
          <circle cx={x} cy={y} r="8" fill={`hsl(${i*60},80%,60%)`} opacity="0.4"/>
          <circle cx={x} cy={y} r="4" fill={`hsl(${i*60},80%,60%)`}/>
        </g>
      )}
      {body.map((s,i)=>(
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={`hsl(${s.hue},70%,55%)`}
          stroke={`hsl(${s.hue},70%,70%)`} strokeWidth="1"/>
      ))}
      {(() => { const h = body[body.length-1]; return (<g>
        <circle cx={h.x+6} cy={h.y-4} r="4" fill="#fff"/>
        <circle cx={h.x+6} cy={h.y-4} r="2" fill="#0a0d0e"/>
        <circle cx={h.x+6} cy={h.y+6} r="4" fill="#fff"/>
        <circle cx={h.x+6} cy={h.y+6} r="2" fill="#0a0d0e"/>
      </g>);})()}
      <Grain/>
    </svg>
  );
};

// 16. Happy Wheels
const Cover_HappyWheels = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
    <SharedDefs/>
    <defs>
      <linearGradient id="hw-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#35c7f5"/><stop offset="1" stopColor="#1b82f5"/>
      </linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#hw-bg)"/>
    <g fill="#fff" opacity="0.7">
      <ellipse cx="80" cy="100" rx="30" ry="12"/>
      <ellipse cx="320" cy="140" rx="40" ry="14"/>
    </g>
    <path d="M0,380 L160,380 L200,300 L220,300 L260,380 L400,380 L400,500 L0,500 Z" fill="#3a5a2a"/>
    <path d="M0,380 L160,380 L200,300 L220,300 L260,380 L400,380" stroke="#1f3b14" strokeWidth="3" fill="none"/>
    <g fill="#c91e1e">
      <circle cx="290" cy="360" r="5"/><circle cx="300" cy="370" r="7"/>
      <circle cx="310" cy="355" r="4"/><circle cx="320" cy="365" r="6"/>
    </g>
    <g transform="translate(200,250) rotate(-10)">
      <rect x="-8" y="-20" width="16" height="24" fill="#ff4d6d"/>
      <circle cx="0" cy="-28" r="10" fill="#ffd1a6"/>
      <circle cx="0" cy="14" r="22" fill="none" stroke="#0a0d0e" strokeWidth="4"/>
      <circle cx="0" cy="14" r="5" fill="#0a0d0e"/>
      <line x1="-18" y1="14" x2="18" y2="14" stroke="#0a0d0e" strokeWidth="2"/>
      <line x1="0" y1="-4" x2="0" y2="32" stroke="#0a0d0e" strokeWidth="2"/>
      <line x1="-4" y1="-14" x2="-22" y2="-30" stroke="#ffd1a6" strokeWidth="5" strokeLinecap="round"/>
    </g>
    <Grain/>
  </svg>
);

export const GAME_COVERS = {
  fbwg: Cover_FBWG, bob: Cover_Bob, connect4: Cover_Connect4, eightball: Cover_EightBall,
  football: Cover_Football, basket: Cover_Basket, badicecream: Cover_BadIceCream, aow: Cover_AoW,
  vex: Cover_Vex, papa: Cover_Papa, hook: Cover_Hook, g2048: Cover_2048,
  cutrope: Cover_CutRope, bloons: Cover_Bloons, slither: Cover_Slither, happywheels: Cover_HappyWheels,
};
