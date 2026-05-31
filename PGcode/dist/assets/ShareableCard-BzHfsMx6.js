import{r as C,j as e,u as _}from"./vendor-query-FJdQ8OJm.js";import{g as R,a as O,s as H}from"./index-8KBmGt8D.js";import{p as A}from"./topicLabel-Yh7gDW_9.js";import{c as K,L as X}from"./vendor-react-C_QCAbBo.js";import{F as Q,h as V,b0 as D,b as U,b1 as W,y as Y}from"./vendor-icons-9a-CEBz8.js";import"./vendor-supabase-ClVc2H6D.js";function Z(s){return _({queryKey:["profileByUsername",s||"none"],queryFn:async()=>{if(!s)return null;const{data:a,error:d}=await H.from("PGcode_profiles").select("*").eq("username",s.toLowerCase()).maybeSingle();if(d)throw d;return a},enabled:!!s,staleTime:60*1e3})}function J(s){return _({queryKey:["cardSolves",s||"anon"],queryFn:async()=>{if(!s)return{byDifficulty:{Easy:0,Medium:0,Hard:0},topicCounts:{},total:0};const{data:a,error:d}=await H.from("PGcode_user_progress").select("problem_id, is_completed").eq("user_id",s).eq("is_completed",!0);if(d)throw d;const p=(a||[]).map(r=>r.problem_id);if(!p.length)return{byDifficulty:{Easy:0,Medium:0,Hard:0},topicCounts:{},total:0};const{data:f,error:n}=await H.from("PGcode_problems").select("id, topic_id, difficulty").in("id",p);if(n)throw n;const t={Easy:0,Medium:0,Hard:0},$={};return(f||[]).forEach(r=>{t[r.difficulty]!==void 0&&t[r.difficulty]++;const c=r.topic_id||"misc";$[c]=($[c]||0)+1}),{byDifficulty:t,topicCounts:$,total:(f||[]).length}},enabled:!!s,staleTime:60*1e3})}function ee(s){return _({queryKey:["cardStreak",s||"anon"],queryFn:async()=>{if(!s)return null;const{data:a,error:d}=await H.rpc("pgcode_user_streak",{uid:s});return d?null:a||null},enabled:!!s,staleTime:60*1e3})}function b(s,a){return typeof window>"u"?a:getComputedStyle(document.documentElement).getPropertyValue(s).trim()||a}function se({displayName:s,handle:a,solved:d,totalProblems:p,streak:f,byDifficulty:n,topTopics:t,dateStr:$}){const x=b("--bg","#0b0b10"),N=b("--surface","#16161d"),y=b("--accent","#7c5cff"),g=b("--text-main","#f4f4f6"),o=b("--text-dim","#a0a0aa"),w=b("--border","#26262e"),P=b("--easy","#22c55e"),M=b("--medium","#eab308"),T=b("--hard","#ef4444"),k=n.Easy||0,h=n.Medium||0,z=n.Hard||0,v=Math.max(1,k,h,z),m=280,l=60,G=Math.max(6,k/v*m),E=Math.max(6,h/v*m),L=Math.max(6,z/v*m),S=t.slice(0,5).map((i,u)=>{const j=60+u%3*230,F=470+Math.floor(u/3)*56,B=(i.label||"").slice(0,18);return`
      <g transform="translate(${j},${F})">
        <rect width="210" height="44" rx="12" fill="${N}" stroke="${w}" />
        <text x="16" y="28" font-family="Inter,system-ui,sans-serif" font-size="15" fill="${g}" font-weight="600">${I(B)}</text>
        <text x="194" y="28" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}" text-anchor="end">${i.count}</text>
      </g>`}).join("");return`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${x}" />
      <stop offset="1" stop-color="${N}" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${y}" />
      <stop offset="1" stop-color="${y}" stop-opacity="0.6" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="${N}" stroke="${w}" />

  <!-- Avatar circle -->
  <circle cx="120" cy="130" r="42" fill="${y}" opacity="0.18" />
  <circle cx="120" cy="130" r="42" fill="none" stroke="${y}" stroke-width="2" />
  <text x="120" y="142" font-family="Inter,system-ui,sans-serif" font-size="34" font-weight="700" fill="${y}" text-anchor="middle">${I(q(s))}</text>

  <text x="190" y="118" font-family="Inter,system-ui,sans-serif" font-size="32" font-weight="700" fill="${g}">${I(s)}</text>
  <text x="190" y="152" font-family="Inter,system-ui,sans-serif" font-size="18" fill="${o}">${I(a)}</text>

  <!-- Big solved number -->
  <text x="60" y="260" font-family="Inter,system-ui,sans-serif" font-size="96" font-weight="800" fill="url(#accentGrad)">${d}</text>
  <text x="60" y="300" font-family="Inter,system-ui,sans-serif" font-size="18" fill="${o}">of ${p.toLocaleString()} problems solved</text>

  <!-- Streak chip -->
  <g transform="translate(720,90)">
    <rect width="380" height="100" rx="20" fill="${x}" stroke="${w}" />
    <circle cx="50" cy="50" r="26" fill="${y}" opacity="0.18" />
    <path d="M50 32 C 58 42, 64 50, 56 60 C 64 56, 70 62, 64 70 C 54 76, 42 70, 42 60 C 42 50, 50 48, 50 32 Z" fill="${y}" transform="translate(0,0)" />
    <text x="96" y="46" font-family="Inter,system-ui,sans-serif" font-size="38" font-weight="800" fill="${g}">${f}</text>
    <text x="96" y="74" font-family="Inter,system-ui,sans-serif" font-size="16" fill="${o}">day streak</text>
  </g>

  <!-- Difficulty bars -->
  <g transform="translate(0,340)">
    <text x="${l}" y="0" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${o}" font-weight="600" letter-spacing="2">DIFFICULTY</text>

    <text x="${l}" y="28" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${g}">Easy</text>
    <text x="${l+m}" y="28" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}" text-anchor="end">${k}</text>
    <rect x="${l}" y="34" width="${m}" height="8" rx="4" fill="${x}" />
    <rect x="${l}" y="34" width="${G}" height="8" rx="4" fill="${P}" />

    <text x="${l}" y="66" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${g}">Medium</text>
    <text x="${l+m}" y="66" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}" text-anchor="end">${h}</text>
    <rect x="${l}" y="72" width="${m}" height="8" rx="4" fill="${x}" />
    <rect x="${l}" y="72" width="${E}" height="8" rx="4" fill="${M}" />

    <text x="${l}" y="104" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${g}">Hard</text>
    <text x="${l+m}" y="104" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}" text-anchor="end">${z}</text>
    <rect x="${l}" y="110" width="${m}" height="8" rx="4" fill="${x}" />
    <rect x="${l}" y="110" width="${L}" height="8" rx="4" fill="${T}" />
  </g>

  <!-- Top topics label -->
  <text x="60" y="450" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${o}" font-weight="600" letter-spacing="2">TOP TOPICS</text>
  ${S}

  <!-- Footer / branding -->
  <text x="60" y="570" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${o}">${I($)}</text>
  <text x="1140" y="570" font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="700" fill="${y}" text-anchor="end">PGcode</text>
  <text x="1140" y="592" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${o}" text-anchor="end">pushkalgupta.com/PGcode</text>
</svg>`}function I(s){return String(s||"").replace(/[<>&'"]/g,a=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"})[a])}function q(s){const a=String(s||"?").trim();return a?a.charAt(0).toUpperCase():"?"}async function te(s,a){const d=new Blob([s],{type:"image/svg+xml;charset=utf-8"}),p=URL.createObjectURL(d);try{const f=new Image;f.crossOrigin="anonymous",await new Promise((c,x)=>{f.onload=c,f.onerror=x,f.src=p});const n=document.createElement("canvas");n.width=1200,n.height=630,n.getContext("2d").drawImage(f,0,0,1200,630);const $=n.toDataURL("image/png"),r=document.createElement("a");r.href=$,r.download=a,document.body.appendChild(r),r.click(),r.remove()}finally{URL.revokeObjectURL(p)}}function le({embedded:s=!1,presetUsername:a=null,presetUserId:d=null,presetDisplayName:p=null}){const f=K(),n=a||f.username,{data:t,isLoading:$}=Z(n),r=d||(t==null?void 0:t.user_id)||null,{data:c}=J(r),{data:x}=ee(r),{data:N=[]}=R(),{data:y=[]}=O(),g=C.useMemo(()=>{const i={};return N.forEach(u=>{i[u.id]=A(u.name)}),i},[N]),o=C.useMemo(()=>{const i=(c==null?void 0:c.topicCounts)||{};return Object.entries(i).map(([u,j])=>({topicId:u,label:g[u]||"Other",count:j})).sort((u,j)=>j.count-u.count).slice(0,5)},[c,g]),w=p||(t==null?void 0:t.display_name)||(n?`@${n}`:"PGcoder"),P=t!=null&&t.username?`@${t.username}`:n?`@${n}`:"@anonymous",M=(c==null?void 0:c.total)??0,T=y.length||3788,k=(x==null?void 0:x.current)??0,h=(c==null?void 0:c.byDifficulty)||{Easy:0,Medium:0,Hard:0},z=new Date().toLocaleDateString(void 0,{month:"long",day:"numeric",year:"numeric"}),[v,m]=C.useState(!1),l=C.useRef(null),G=async()=>{const i=se({displayName:w,handle:P,solved:M,totalProblems:T,streak:k,byDifficulty:h,topTopics:o,dateStr:z});await te(i,`pgcode-${(t==null?void 0:t.username)||n||"card"}.png`)},E=C.useMemo(()=>typeof window>"u"?"":`${window.location.href.split("#")[0]}#/u/${(t==null?void 0:t.username)||n||""}/card`,[t,n]),L=async()=>{try{await navigator.clipboard.writeText(E),m(!0),setTimeout(()=>m(!1),1600)}catch{}};if($&&!s)return e.jsx("div",{className:"sc-shell",children:e.jsx("div",{className:"sc-loading",children:"Building your card…"})});const S=e.jsxs("div",{className:"sc-card",ref:l,style:{"--easy-h":"142","--med-h":"45","--hard-h":"0"},children:[e.jsx("div",{className:"sc-card-bg","aria-hidden":"true"}),e.jsxs("div",{className:"sc-card-head",children:[e.jsx("div",{className:"sc-avatar",children:q(w)}),e.jsxs("div",{children:[e.jsx("div",{className:"sc-name",children:w}),e.jsx("div",{className:"sc-handle",children:P})]}),e.jsxs("div",{className:"sc-streak-chip",children:[e.jsx(Q,{size:22}),e.jsxs("div",{children:[e.jsx("div",{className:"sc-streak-num",children:k}),e.jsx("div",{className:"sc-streak-label",children:"day streak"})]})]})]}),e.jsxs("div",{className:"sc-big",children:[e.jsx("div",{className:"sc-big-num",children:M}),e.jsxs("div",{className:"sc-big-sub",children:["of ",T.toLocaleString()," problems solved"]})]}),e.jsxs("div",{className:"sc-diff",children:[e.jsx("div",{className:"sc-eyebrow",children:"Difficulty"}),[{k:"Easy",cls:"easy",v:h.Easy||0},{k:"Medium",cls:"medium",v:h.Medium||0},{k:"Hard",cls:"hard",v:h.Hard||0}].map(i=>{const u=Math.max(1,h.Easy||0,h.Medium||0,h.Hard||0),j=Math.max(4,Math.round(i.v/u*100));return e.jsxs("div",{className:"sc-diff-row",children:[e.jsx("span",{className:"sc-diff-label",children:i.k}),e.jsx("div",{className:"sc-diff-track",children:e.jsx("div",{className:`sc-diff-fill sc-diff-${i.cls}`,style:{width:`${j}%`}})}),e.jsx("span",{className:"sc-diff-num",children:i.v})]},i.k)})]}),e.jsxs("div",{className:"sc-topics",children:[e.jsx("div",{className:"sc-eyebrow",children:"Top Topics"}),e.jsxs("div",{className:"sc-chip-grid",children:[o.length===0&&e.jsx("div",{className:"sc-chip sc-chip-empty",children:"Start solving to unlock topic stats"}),o.map(i=>e.jsxs("div",{className:"sc-chip",children:[e.jsx("span",{className:"sc-chip-label",children:i.label}),e.jsx("span",{className:"sc-chip-count",children:i.count})]},i.topicId))]})]}),e.jsxs("div",{className:"sc-foot",children:[e.jsx("span",{className:"sc-date",children:z}),e.jsxs("div",{className:"sc-brand",children:[e.jsx(V,{size:14}),e.jsx("span",{children:"PGcode"})]})]})]});return s?e.jsxs("div",{className:"sc-embed",children:[e.jsx("div",{className:"sc-preview-wrap",children:S}),e.jsxs("div",{className:"sc-actions",children:[e.jsxs("button",{type:"button",className:"sc-btn sc-btn-primary",onClick:G,children:[e.jsx(D,{size:14})," Download PNG"]}),e.jsxs("button",{type:"button",className:"sc-btn",onClick:L,children:[v?e.jsx(U,{size:14}):e.jsx(W,{size:14})," ",v?"Copied":"Copy share link"]})]})]}):e.jsxs("div",{className:"sc-shell",children:[e.jsxs("div",{className:"sc-toolbar",children:[e.jsxs(X,{to:t!=null&&t.username?`/u/${t.username}`:"/",className:"sc-back",children:[e.jsx(Y,{size:14})," Back to profile"]}),e.jsxs("div",{className:"sc-toolbar-actions",children:[e.jsxs("button",{type:"button",className:"sc-btn",onClick:L,children:[v?e.jsx(U,{size:14}):e.jsx(W,{size:14})," ",v?"Copied":"Copy link"]}),e.jsxs("button",{type:"button",className:"sc-btn sc-btn-primary",onClick:G,children:[e.jsx(D,{size:14})," Download PNG"]})]})]}),e.jsx("div",{className:"sc-preview-wrap",children:S}),e.jsx("p",{className:"sc-hint",children:"1200 by 630, the size LinkedIn and Twitter use for link previews. The downloaded PNG renders in your active theme."})]})}export{le as default};
