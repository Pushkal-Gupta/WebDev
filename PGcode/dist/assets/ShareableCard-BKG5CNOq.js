import{r as z,j as e,u as W}from"./vendor-query-FJdQ8OJm.js";import{g as K,a as Q,s as U}from"./index-Bt7FpEi2.js";import{p as V}from"./topicLabel-Yh7gDW_9.js";import{c as Y,L as Z}from"./vendor-react-C_QCAbBo.js";import{F as J,h as ee,b2 as q,b as F,b3 as R,a8 as A,z as te}from"./vendor-icons-3GFiIFBA.js";import"./vendor-supabase-ClVc2H6D.js";const B=A,O=A;function se(s){return W({queryKey:["profileByUsername",s||"none"],queryFn:async()=>{if(!s)return null;const{data:a,error:d}=await U.from("PGcode_profiles").select("*").eq("username",s.toLowerCase()).maybeSingle();if(d)throw d;return a},enabled:!!s,staleTime:60*1e3})}function ne(s){return W({queryKey:["cardSolves",s||"anon"],queryFn:async()=>{if(!s)return{byDifficulty:{Easy:0,Medium:0,Hard:0},topicCounts:{},total:0};const{data:a,error:d}=await U.from("PGcode_user_progress").select("problem_id, is_completed").eq("user_id",s).eq("is_completed",!0);if(d)throw d;const p=(a||[]).map(c=>c.problem_id);if(!p.length)return{byDifficulty:{Easy:0,Medium:0,Hard:0},topicCounts:{},total:0};const{data:f,error:i}=await U.from("PGcode_problems").select("id, topic_id, difficulty").in("id",p);if(i)throw i;const t={Easy:0,Medium:0,Hard:0},$={};return(f||[]).forEach(c=>{t[c.difficulty]!==void 0&&t[c.difficulty]++;const r=c.topic_id||"misc";$[r]=($[r]||0)+1}),{byDifficulty:t,topicCounts:$,total:(f||[]).length}},enabled:!!s,staleTime:60*1e3})}function ie(s){return W({queryKey:["cardStreak",s||"anon"],queryFn:async()=>{if(!s)return null;const{data:a,error:d}=await U.rpc("pgcode_user_streak",{uid:s});return d?null:a||null},enabled:!!s,staleTime:60*1e3})}function g(s,a){return typeof window>"u"?a:getComputedStyle(document.documentElement).getPropertyValue(s).trim()||a}function ae({displayName:s,handle:a,solved:d,totalProblems:p,streak:f,byDifficulty:i,topTopics:t,dateStr:$}){const u=g("--bg","#0b0b10"),v=g("--surface","#16161d"),y=g("--accent","#7c5cff"),b=g("--text-main","#f4f4f6"),o=g("--text-dim","#a0a0aa"),j=g("--border","#26262e"),L=g("--easy","#22c55e"),M=g("--medium","#eab308"),G=g("--hard","#ef4444"),N=i.Easy||0,h=i.Medium||0,k=i.Hard||0,w=Math.max(1,N,h,k),m=280,l=60,T=Math.max(6,N/w*m),D=Math.max(6,h/w*m),H=Math.max(6,k/w*m),_=t.slice(0,5).map((C,I)=>{const E=60+I%3*230,n=470+Math.floor(I/3)*56,x=(C.label||"").slice(0,18);return`
      <g transform="translate(${E},${n})">
        <rect width="210" height="44" rx="12" fill="${v}" stroke="${j}" />
        <text x="16" y="28" font-family="Inter,system-ui,sans-serif" font-size="15" fill="${b}" font-weight="600">${S(x)}</text>
        <text x="194" y="28" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}" text-anchor="end">${C.count}</text>
      </g>`}).join("");return`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${u}" />
      <stop offset="1" stop-color="${v}" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${y}" />
      <stop offset="1" stop-color="${y}" stop-opacity="0.6" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="${v}" stroke="${j}" />

  <!-- Avatar circle -->
  <circle cx="120" cy="130" r="42" fill="${y}" opacity="0.18" />
  <circle cx="120" cy="130" r="42" fill="none" stroke="${y}" stroke-width="2" />
  <text x="120" y="142" font-family="Inter,system-ui,sans-serif" font-size="34" font-weight="700" fill="${y}" text-anchor="middle">${S(X(s))}</text>

  <text x="190" y="118" font-family="Inter,system-ui,sans-serif" font-size="32" font-weight="700" fill="${b}">${S(s)}</text>
  <text x="190" y="152" font-family="Inter,system-ui,sans-serif" font-size="18" fill="${o}">${S(a)}</text>

  <!-- Big solved number -->
  <text x="60" y="260" font-family="Inter,system-ui,sans-serif" font-size="96" font-weight="800" fill="url(#accentGrad)">${d}</text>
  <text x="60" y="300" font-family="Inter,system-ui,sans-serif" font-size="18" fill="${o}">of ${p.toLocaleString()} problems solved</text>

  <!-- Streak chip -->
  <g transform="translate(720,90)">
    <rect width="380" height="100" rx="20" fill="${u}" stroke="${j}" />
    <circle cx="50" cy="50" r="26" fill="${y}" opacity="0.18" />
    <path d="M50 32 C 58 42, 64 50, 56 60 C 64 56, 70 62, 64 70 C 54 76, 42 70, 42 60 C 42 50, 50 48, 50 32 Z" fill="${y}" transform="translate(0,0)" />
    <text x="96" y="46" font-family="Inter,system-ui,sans-serif" font-size="38" font-weight="800" fill="${b}">${f}</text>
    <text x="96" y="74" font-family="Inter,system-ui,sans-serif" font-size="16" fill="${o}">day streak</text>
  </g>

  <!-- Difficulty bars -->
  <g transform="translate(0,340)">
    <text x="${l}" y="0" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${o}" font-weight="600" letter-spacing="2">DIFFICULTY</text>

    <text x="${l}" y="28" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${b}">Easy</text>
    <text x="${l+m}" y="28" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}" text-anchor="end">${N}</text>
    <rect x="${l}" y="34" width="${m}" height="8" rx="4" fill="${u}" />
    <rect x="${l}" y="34" width="${T}" height="8" rx="4" fill="${L}" />

    <text x="${l}" y="66" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${b}">Medium</text>
    <text x="${l+m}" y="66" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}" text-anchor="end">${h}</text>
    <rect x="${l}" y="72" width="${m}" height="8" rx="4" fill="${u}" />
    <rect x="${l}" y="72" width="${D}" height="8" rx="4" fill="${M}" />

    <text x="${l}" y="104" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${b}">Hard</text>
    <text x="${l+m}" y="104" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}" text-anchor="end">${k}</text>
    <rect x="${l}" y="110" width="${m}" height="8" rx="4" fill="${u}" />
    <rect x="${l}" y="110" width="${H}" height="8" rx="4" fill="${G}" />
  </g>

  <!-- Top topics label -->
  <text x="60" y="450" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${o}" font-weight="600" letter-spacing="2">TOP TOPICS</text>
  ${_}

  <!-- Footer / branding -->
  <text x="60" y="570" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}">${S($)}</text>
  <text x="1140" y="570" font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="700" fill="${y}" text-anchor="end">PGcode</text>
  <text x="1140" y="592" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${o}" text-anchor="end">pushkalgupta.com/PGcode</text>
</svg>`}function S(s){return String(s||"").replace(/[<>&'"]/g,a=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"})[a])}function X(s){const a=String(s||"?").trim();return a?a.charAt(0).toUpperCase():"?"}async function re(s,a){const d=new Blob([s],{type:"image/svg+xml;charset=utf-8"}),p=URL.createObjectURL(d);try{const f=new Image;f.crossOrigin="anonymous",await new Promise((r,u)=>{f.onload=r,f.onerror=u,f.src=p});const i=document.createElement("canvas");i.width=1200,i.height=630,i.getContext("2d").drawImage(f,0,0,1200,630);const $=i.toDataURL("image/png"),c=document.createElement("a");c.href=$,c.download=a,document.body.appendChild(c),c.click(),c.remove()}finally{URL.revokeObjectURL(p)}}function ue({embedded:s=!1,presetUsername:a=null,presetUserId:d=null,presetDisplayName:p=null}){const f=Y(),i=a||f.username,{data:t,isLoading:$}=se(i),c=d||(t==null?void 0:t.user_id)||null,{data:r}=ne(c),{data:u}=ie(c),{data:v=[]}=K(),{data:y=[]}=Q(),b=z.useMemo(()=>{const n={};return v.forEach(x=>{n[x.id]=V(x.name)}),n},[v]),o=z.useMemo(()=>{const n=(r==null?void 0:r.topicCounts)||{};return Object.entries(n).map(([x,P])=>({topicId:x,label:b[x]||"Other",count:P})).sort((x,P)=>P.count-x.count).slice(0,5)},[r,b]),j=p||(t==null?void 0:t.display_name)||(i?`@${i}`:"PGcoder"),L=t!=null&&t.username?`@${t.username}`:i?`@${i}`:"@anonymous",M=(r==null?void 0:r.total)??0,G=y.length||3788,N=(u==null?void 0:u.current)??0,h=(r==null?void 0:r.byDifficulty)||{Easy:0,Medium:0,Hard:0},k=new Date().toLocaleDateString(void 0,{month:"long",day:"numeric",year:"numeric"}),[w,m]=z.useState(!1),l=z.useRef(null),T=async()=>{const n=ae({displayName:j,handle:L,solved:M,totalProblems:G,streak:N,byDifficulty:h,topTopics:o,dateStr:k});await re(n,`pgcode-${(t==null?void 0:t.username)||i||"card"}.png`)},D=z.useMemo(()=>typeof window>"u"?"":`${window.location.href.split("#")[0]}#/u/${(t==null?void 0:t.username)||i||""}/card`,[t,i]),H=z.useMemo(()=>{if(typeof window>"u")return"";const n=(t==null?void 0:t.username)||i||"";return`${window.location.origin}/PGcode/dist/index.html#/u/${n}/card`},[t,i]),_=async()=>{try{await navigator.clipboard.writeText(D),m(!0),setTimeout(()=>m(!1),1600)}catch{}},C=()=>{const n=`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(H)}`;window.open(n,"_blank","noopener,noreferrer")},I=()=>{const n=`https://twitter.com/intent/tweet?text=Check%20out%20my%20PGcode%20stats!&url=${encodeURIComponent(H)}`;window.open(n,"_blank","noopener,noreferrer")};if($&&!s)return e.jsx("div",{className:"sc-shell",children:e.jsx("div",{className:"sc-loading",children:"Building your card…"})});const E=e.jsxs("div",{className:"sc-card",ref:l,style:{"--easy-h":"142","--med-h":"45","--hard-h":"0"},children:[e.jsx("div",{className:"sc-card-bg","aria-hidden":"true"}),e.jsxs("div",{className:"sc-card-head",children:[e.jsx("div",{className:"sc-avatar",children:X(j)}),e.jsxs("div",{children:[e.jsx("div",{className:"sc-name",children:j}),e.jsx("div",{className:"sc-handle",children:L})]}),e.jsxs("div",{className:"sc-streak-chip",children:[e.jsx(J,{size:22}),e.jsxs("div",{children:[e.jsx("div",{className:"sc-streak-num",children:N}),e.jsx("div",{className:"sc-streak-label",children:"day streak"})]})]})]}),e.jsxs("div",{className:"sc-big",children:[e.jsx("div",{className:"sc-big-num",children:M}),e.jsxs("div",{className:"sc-big-sub",children:["of ",G.toLocaleString()," problems solved"]})]}),e.jsxs("div",{className:"sc-diff",children:[e.jsx("div",{className:"sc-eyebrow",children:"Difficulty"}),[{k:"Easy",cls:"easy",v:h.Easy||0},{k:"Medium",cls:"medium",v:h.Medium||0},{k:"Hard",cls:"hard",v:h.Hard||0}].map(n=>{const x=Math.max(1,h.Easy||0,h.Medium||0,h.Hard||0),P=Math.max(4,Math.round(n.v/x*100));return e.jsxs("div",{className:"sc-diff-row",children:[e.jsx("span",{className:"sc-diff-label",children:n.k}),e.jsx("div",{className:"sc-diff-track",children:e.jsx("div",{className:`sc-diff-fill sc-diff-${n.cls}`,style:{width:`${P}%`}})}),e.jsx("span",{className:"sc-diff-num",children:n.v})]},n.k)})]}),e.jsxs("div",{className:"sc-topics",children:[e.jsx("div",{className:"sc-eyebrow",children:"Top Topics"}),e.jsxs("div",{className:"sc-chip-grid",children:[o.length===0&&e.jsx("div",{className:"sc-chip sc-chip-empty",children:"Start solving to unlock topic stats"}),o.map(n=>e.jsxs("div",{className:"sc-chip",children:[e.jsx("span",{className:"sc-chip-label",children:n.label}),e.jsx("span",{className:"sc-chip-count",children:n.count})]},n.topicId))]})]}),e.jsxs("div",{className:"sc-foot",children:[e.jsx("span",{className:"sc-date",children:k}),e.jsxs("div",{className:"sc-brand",children:[e.jsx(ee,{size:14}),e.jsx("span",{children:"PGcode"})]})]})]});return s?e.jsxs("div",{className:"sc-embed",children:[e.jsx("div",{className:"sc-preview-wrap",children:E}),e.jsxs("div",{className:"sc-actions",children:[e.jsxs("button",{type:"button",className:"sc-btn sc-btn-primary",onClick:T,children:[e.jsx(q,{size:14})," Download PNG"]}),e.jsxs("button",{type:"button",className:"sc-btn",onClick:_,children:[w?e.jsx(F,{size:14}):e.jsx(R,{size:14})," ",w?"Copied":"Copy share link"]}),e.jsxs("button",{type:"button",className:"sc-btn",onClick:C,children:[e.jsx(B,{size:14})," Share on LinkedIn"]}),e.jsxs("button",{type:"button",className:"sc-btn",onClick:I,children:[e.jsx(O,{size:14})," Share on X"]})]})]}):e.jsxs("div",{className:"sc-shell",children:[e.jsxs("div",{className:"sc-toolbar",children:[e.jsxs(Z,{to:t!=null&&t.username?`/u/${t.username}`:"/",className:"sc-back",children:[e.jsx(te,{size:14})," Back to profile"]}),e.jsxs("div",{className:"sc-toolbar-actions",children:[e.jsxs("button",{type:"button",className:"sc-btn",onClick:_,children:[w?e.jsx(F,{size:14}):e.jsx(R,{size:14})," ",w?"Copied":"Copy link"]}),e.jsxs("button",{type:"button",className:"sc-btn",onClick:C,children:[e.jsx(B,{size:14})," Share on LinkedIn"]}),e.jsxs("button",{type:"button",className:"sc-btn",onClick:I,children:[e.jsx(O,{size:14})," Share on X"]}),e.jsxs("button",{type:"button",className:"sc-btn sc-btn-primary",onClick:T,children:[e.jsx(q,{size:14})," Download PNG"]})]})]}),e.jsx("div",{className:"sc-preview-wrap",children:E}),e.jsx("p",{className:"sc-hint",children:"1200 by 630, the size LinkedIn and Twitter use for link previews. The downloaded PNG renders in your active theme."})]})}export{ue as default};
