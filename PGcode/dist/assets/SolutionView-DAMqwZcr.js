import{j as e,r as $,R as U}from"./vendor-query-FJdQ8OJm.js";import{L as G,s as Z}from"./index-BtnlUdyp.js";import{ax as ee,ay as te,az as se,f as re,aA as ae,aB as ie,b as T,aq as X}from"./vendor-icons-Cvpsd4xb.js";const Y=["var(--accent)","var(--medium)","var(--easy)","var(--hard)","var(--blue)","var(--violet)"];function P({data:s}){const{array:a=[],highlights:c=[],pointers:n={},hashset:r,hashmap:i,labels:t={}}=s,l=s.highlightColor||"accent",d=Object.entries(n),v=y=>{if(!c.includes(y))return{};const h={accent:{borderColor:"var(--accent)",background:"rgba(0, 255, 245, 0.1)",boxShadow:"0 0 12px rgba(0, 255, 245, 0.2)"},green:{borderColor:"var(--easy)",background:"rgba(34, 197, 94, 0.1)",boxShadow:"0 0 12px rgba(34, 197, 94, 0.2)"},red:{borderColor:"var(--hard)",background:"rgba(239, 68, 68, 0.1)",boxShadow:"0 0 12px rgba(239, 68, 68, 0.2)"},yellow:{borderColor:"var(--medium)",background:"rgba(240, 165, 0, 0.1)",boxShadow:"0 0 12px rgba(240, 165, 0, 0.2)"}};return h[l]||h.accent};return e.jsxs("div",{className:"arr-renderer",children:[e.jsx("div",{className:"arr-cells",children:a.map((y,h)=>e.jsxs("div",{className:"arr-cell-wrap",children:[t[String(h)]&&e.jsx("span",{className:"arr-label",children:t[String(h)]}),e.jsx("div",{className:`arr-cell ${c.includes(h)?"arr-cell-hl":""}`,style:v(h),children:e.jsx("span",{className:"arr-val",children:y})}),e.jsx("span",{className:"arr-idx",children:h}),e.jsx("div",{className:"arr-pointers",children:d.map(([p,f],o)=>f!==h?null:e.jsxs("div",{className:"arr-pointer",style:{color:Y[o%Y.length]},children:[e.jsx("span",{className:"arr-ptr-arrow",children:"↑"}),e.jsx("span",{className:"arr-ptr-name",children:p})]},p))})]},h))}),r!==void 0&&e.jsxs("div",{className:"arr-companion",children:[e.jsx("span",{className:"arr-comp-label",children:"Hash Set"}),e.jsx("div",{className:"arr-comp-items",children:r.length===0?e.jsx("span",{className:"arr-comp-empty",children:"empty"}):r.map((y,h)=>e.jsx("span",{className:"arr-comp-pill",children:y},h))})]}),i&&e.jsxs("div",{className:"arr-companion",children:[e.jsx("span",{className:"arr-comp-label",children:"Hash Map"}),e.jsx("div",{className:"arr-comp-map",children:Object.entries(i).map(([y,h],p)=>e.jsxs("div",{className:"arr-comp-entry",children:[e.jsx("span",{className:"arr-comp-key",children:y}),e.jsx("span",{className:"arr-comp-sep",children:"→"}),e.jsx("span",{className:"arr-comp-val",children:h})]},p))})]})]})}const A=24,W={unvisited:{fill:"var(--surface)",stroke:"var(--border)",text:"var(--text-dim)"},current:{fill:"rgba(0, 255, 245, 0.15)",stroke:"var(--accent)",text:"var(--accent)"},visited:{fill:"rgba(34, 197, 94, 0.12)",stroke:"var(--easy)",text:"var(--easy)"},processing:{fill:"rgba(240, 165, 0, 0.12)",stroke:"var(--medium)",text:"var(--medium)"}},D={default:"var(--border)",traversed:"var(--accent)",highlighted:"var(--medium)"};function ne({data:s}){const{nodes:a=[],edges:c=[],directed:n=!1}=s,r=$.useMemo(()=>{if(a.length===0)return"0 0 400 300";const t=a.map(f=>f.x),l=a.map(f=>f.y),d=60,v=Math.min(...t)-d,y=Math.min(...l)-d,h=Math.max(...t)+d,p=Math.max(...l)+d;return`${v} ${y} ${h-v} ${p-y}`},[a]),i=$.useMemo(()=>{const t={};return a.forEach(l=>{t[l.id]=l}),t},[a]);return e.jsxs("svg",{className:"graph-svg",viewBox:r,preserveAspectRatio:"xMidYMid meet",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"arrow-default",markerWidth:"8",markerHeight:"6",refX:"8",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L8,3 L0,6 Z",fill:"var(--border)"})}),e.jsx("marker",{id:"arrow-traversed",markerWidth:"8",markerHeight:"6",refX:"8",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L8,3 L0,6 Z",fill:"var(--accent)"})}),e.jsx("marker",{id:"arrow-highlighted",markerWidth:"8",markerHeight:"6",refX:"8",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L8,3 L0,6 Z",fill:"var(--medium)"})})]}),c.map((t,l)=>{const d=i[t.from],v=i[t.to];if(!d||!v)return null;const y=v.x-d.x,h=v.y-d.y,p=Math.sqrt(y*y+h*h)||1,f=y/p,o=h/p,m=d.x+f*A,b=d.y+o*A,j=v.x-f*(A+8),x=v.y-o*(A+8),g=D[t.state]||D.default,w=`arrow-${t.state||"default"}`;return e.jsxs("g",{children:[e.jsx("line",{x1:m,y1:b,x2:j,y2:x,stroke:g,strokeWidth:t.state==="traversed"?2.5:1.5,markerEnd:n?`url(#${w})`:void 0,className:"graph-edge"}),t.weight!==void 0&&e.jsx("text",{x:(m+j)/2+8,y:(b+x)/2-6,className:"graph-weight-label",fill:g,children:t.weight})]},l)}),a.map(t=>{const l=W[t.state]||W.unvisited;return e.jsxs("g",{className:"graph-node-group",children:[t.state==="current"&&e.jsx("circle",{cx:t.x,cy:t.y,r:A+6,className:"graph-node-glow"}),e.jsx("circle",{cx:t.x,cy:t.y,r:A,fill:l.fill,stroke:l.stroke,strokeWidth:t.state==="current"?2.5:1.5,className:"graph-node-circle"}),e.jsx("text",{x:t.x,y:t.y+1,textAnchor:"middle",dominantBaseline:"middle",fill:l.text,className:"graph-node-label",children:t.label||t.id})]},t.id)})]})}const L=22,ce=70,oe=140,I={unvisited:{fill:"var(--surface)",stroke:"var(--border)",text:"var(--text-dim)"},current:{fill:"rgba(0, 255, 245, 0.15)",stroke:"var(--accent)",text:"var(--accent)"},visited:{fill:"rgba(34, 197, 94, 0.12)",stroke:"var(--easy)",text:"var(--easy)"}};function le({data:s}){const{nodes:a=[],edges:c=[]}=s,n=$.useMemo(()=>{var f,o;if(a.length===0)return{positions:{},svgNodes:[],svgEdges:[]};const i={};a.forEach(m=>{i[m.id]=m});const t=new Set(c.map(m=>m.child)),l=((f=a.find(m=>!t.has(m.id)))==null?void 0:f.id)||((o=a[0])==null?void 0:o.id),d={};c.forEach(m=>{d[m.parent]||(d[m.parent]=[]),d[m.parent].push({id:m.child,side:m.side})});const v={};function y(m,b,j,x){v[m]={x:b,y:j};const g=d[m]||[];g.sort((w,u)=>w.side==="left"?-1:1),g.forEach(w=>{const u=w.side==="left"?-x:x;y(w.id,b+u,j+ce,x*.55)})}y(l,300,40,oe);const h=a.map(m=>{var b,j;return{...m,x:((b=v[m.id])==null?void 0:b.x)||0,y:((j=v[m.id])==null?void 0:j.y)||0}}),p=c.map(m=>{var b,j,x,g;return{...m,x1:((b=v[m.parent])==null?void 0:b.x)||0,y1:((j=v[m.parent])==null?void 0:j.y)||0,x2:((x=v[m.child])==null?void 0:x.x)||0,y2:((g=v[m.child])==null?void 0:g.y)||0}});return{positions:v,svgNodes:h,svgEdges:p}},[a,c]),r=$.useMemo(()=>{const i=n.svgNodes.map(p=>p.x),t=n.svgNodes.map(p=>p.y);if(i.length===0)return"0 0 600 400";const l=50,d=Math.min(...i)-l,v=Math.min(...t)-l,y=Math.max(...i)+l,h=Math.max(...t)+l;return`${d} ${v} ${y-d} ${h-v}`},[n.svgNodes]);return e.jsxs("svg",{className:"tree-svg",viewBox:r,preserveAspectRatio:"xMidYMid meet",children:[n.svgEdges.map((i,t)=>e.jsx("line",{x1:i.x1,y1:i.y1+L,x2:i.x2,y2:i.y2-L,stroke:"var(--border)",strokeWidth:1.5,className:"tree-edge"},t)),n.svgNodes.map(i=>{const t=I[i.state]||I.unvisited;return e.jsxs("g",{className:"tree-node-group",children:[i.state==="current"&&e.jsx("circle",{cx:i.x,cy:i.y,r:L+5,className:"graph-node-glow"}),e.jsx("circle",{cx:i.x,cy:i.y,r:L,fill:t.fill,stroke:t.stroke,strokeWidth:i.state==="current"?2.5:1.5,className:"tree-node-circle"}),e.jsx("text",{x:i.x,y:i.y+1,textAnchor:"middle",dominantBaseline:"middle",fill:t.text,className:"tree-node-label",children:i.value!==void 0?i.value:i.id})]},i.id)})]})}const B=["var(--accent)","var(--medium)","var(--easy)","var(--hard)"],F={default:{},current:{borderColor:"var(--accent)",background:"rgba(0, 255, 245, 0.1)",boxShadow:"0 0 12px rgba(0, 255, 245, 0.2)"},visited:{borderColor:"var(--easy)",background:"rgba(34, 197, 94, 0.08)"},highlighted:{borderColor:"var(--medium)",background:"rgba(240, 165, 0, 0.08)"}};function de({data:s}){const{nodes:a=[],pointers:c={}}=s,n=Object.entries(c);return e.jsx("div",{className:"ll-renderer",children:e.jsxs("div",{className:"ll-chain",children:[a.map((r,i)=>e.jsxs(U.Fragment,{children:[e.jsxs("div",{className:"ll-node-wrap",children:[e.jsx("div",{className:"ll-node",style:F[r.state]||F.default,children:e.jsx("span",{className:"ll-val",children:r.value})}),e.jsx("div",{className:"ll-pointers",children:n.map(([t,l],d)=>l!==i?null:e.jsxs("div",{className:"ll-pointer",style:{color:B[d%B.length]},children:[e.jsx("span",{className:"ll-ptr-arrow",children:"↑"}),e.jsx("span",{className:"ll-ptr-name",children:t})]},t))})]}),i<a.length-1&&e.jsx("div",{className:"ll-arrow",children:"→"})]},i)),e.jsx("div",{className:"ll-arrow",children:"→"}),e.jsx("div",{className:"ll-null",children:"null"})]})})}function he({data:s}){const{type:a="stack",items:c=[],operation:n}=s,r=a==="stack";return e.jsxs("div",{className:"sq-renderer",children:[n&&e.jsx("div",{className:"sq-operation",children:n}),r?e.jsxs("div",{className:"sq-stack",children:[e.jsx("div",{className:"sq-stack-label",children:"TOP"}),e.jsxs("div",{className:"sq-stack-items",children:[[...c].reverse().map((i,t)=>e.jsx("div",{className:`sq-item ${t===0?"sq-item-top":""}`,children:i},t)),c.length===0&&e.jsx("div",{className:"sq-empty",children:"empty"})]}),e.jsx("div",{className:"sq-stack-base"})]}):e.jsxs("div",{className:"sq-queue",children:[e.jsx("div",{className:"sq-queue-label sq-front",children:"FRONT"}),e.jsxs("div",{className:"sq-queue-items",children:[c.map((i,t)=>e.jsx("div",{className:`sq-item ${t===0?"sq-item-front":""} ${t===c.length-1?"sq-item-back":""}`,children:i},t)),c.length===0&&e.jsx("div",{className:"sq-empty",children:"empty"})]}),e.jsx("div",{className:"sq-queue-label sq-back",children:"BACK"})]})]})}const H={default:{},new:{background:"rgba(0, 255, 245, 0.08)",borderLeft:"3px solid var(--accent)"},modified:{background:"rgba(240, 165, 0, 0.08)",borderLeft:"3px solid var(--medium)"},deleted:{background:"rgba(239, 68, 68, 0.06)",borderLeft:"3px solid var(--hard)",opacity:.5}};function me({data:s}){const{entries:a=[]}=s;return e.jsx("div",{className:"hm-renderer",children:e.jsxs("div",{className:"hm-table",children:[e.jsxs("div",{className:"hm-header",children:[e.jsx("span",{className:"hm-col-key",children:"Key"}),e.jsx("span",{className:"hm-col-val",children:"Value"})]}),e.jsxs("div",{className:"hm-body",children:[a.map((c,n)=>e.jsxs("div",{className:"hm-row",style:H[c.state]||H.default,children:[e.jsx("span",{className:"hm-key",children:c.key}),e.jsx("span",{className:"hm-val",children:c.value})]},n)),a.length===0&&e.jsx("div",{className:"hm-empty",children:"empty"})]})]})})}const C=30,q=480,R=320,E={default:{fill:"var(--surface)",stroke:"var(--border)",text:"var(--text-dim)"},current:{fill:"rgba(0, 255, 245, 0.18)",stroke:"var(--accent)",text:"var(--accent)"},highlighted:{fill:"rgba(0, 255, 245, 0.18)",stroke:"var(--accent)",text:"var(--accent)"},visited:{fill:"rgba(34, 197, 94, 0.15)",stroke:"var(--easy)",text:"var(--easy)"},match:{fill:"rgba(34, 197, 94, 0.15)",stroke:"var(--easy)",text:"var(--easy)"},reject:{fill:"rgba(239, 68, 68, 0.15)",stroke:"var(--hard)",text:"var(--hard)"}};function ue({data:s}){const{points:a=[],lines:c=[],rectangles:n=[],bounds:r}=s,i=$.useMemo(()=>{const o=[...a.map(k=>k.x),...c.flatMap(k=>[k.x1,k.x2]),...n.flatMap(k=>[k.x1,k.x2])],m=[...a.map(k=>k.y),...c.flatMap(k=>[k.y1,k.y2]),...n.flatMap(k=>[k.y1,k.y2])];let b=(r==null?void 0:r.minX)??(o.length?Math.min(...o):-5),j=(r==null?void 0:r.maxX)??(o.length?Math.max(...o):5),x=(r==null?void 0:r.minY)??(m.length?Math.min(...m):-5),g=(r==null?void 0:r.maxY)??(m.length?Math.max(...m):5);const w=Math.max(j-b,1),u=Math.max(g-x,1);b-=w*.15,j+=w*.15,x-=u*.15,g+=u*.15;const S=(q-2*C)/(j-b),M=(R-2*C)/(g-x);return{toX:k=>C+(k-b)*S,toY:k=>R-C-(k-x)*M,minX:b,maxX:j,minY:x,maxY:g}},[a,c,n,r]),{toX:t,toY:l,minX:d,maxX:v,minY:y,maxY:h}=i,p=y<=0&&h>=0,f=d<=0&&v>=0;return e.jsxs("svg",{className:"geo-svg",viewBox:`0 0 ${q} ${R}`,preserveAspectRatio:"xMidYMid meet",children:[e.jsx("rect",{x:C-4,y:C-4,width:q-2*C+8,height:R-2*C+8,fill:"none",stroke:"var(--border)",strokeWidth:1,strokeDasharray:"3 3",opacity:.5}),p&&e.jsx("line",{x1:C-4,y1:l(0),x2:q-C+4,y2:l(0),stroke:"var(--text-dim)",strokeWidth:1,opacity:.7}),f&&e.jsx("line",{x1:t(0),y1:C-4,x2:t(0),y2:R-C+4,stroke:"var(--text-dim)",strokeWidth:1,opacity:.7}),n.map((o,m)=>{const b=E[o.state]||E.default,j=Math.min(t(o.x1),t(o.x2)),x=Math.min(l(o.y1),l(o.y2)),g=Math.abs(t(o.x2)-t(o.x1)),w=Math.abs(l(o.y2)-l(o.y1));return e.jsxs("g",{children:[e.jsx("rect",{x:j,y:x,width:g,height:w,fill:b.fill,stroke:b.stroke,strokeWidth:2,className:"geo-rect"}),o.label&&e.jsx("text",{x:j+g/2,y:x+w/2,textAnchor:"middle",dominantBaseline:"middle",fill:b.text,className:"geo-label",children:o.label})]},`r${m}`)}),c.map((o,m)=>{const b=E[o.state]||E.default;return e.jsx("line",{x1:t(o.x1),y1:l(o.y1),x2:t(o.x2),y2:l(o.y2),stroke:b.stroke,strokeWidth:o.state==="highlighted"||o.state==="current"?2.5:1.5,className:"geo-line"},`l${m}`)}),a.map((o,m)=>{const b=E[o.state]||E.default,j=o.state==="current"||o.state==="highlighted"?7:5;return e.jsxs("g",{children:[(o.state==="current"||o.state==="highlighted")&&e.jsx("circle",{cx:t(o.x),cy:l(o.y),r:j+4,className:"graph-node-glow"}),e.jsx("circle",{cx:t(o.x),cy:l(o.y),r:j,fill:b.stroke,stroke:b.stroke,strokeWidth:1.5,className:"geo-point"}),e.jsx("text",{x:t(o.x)+9,y:l(o.y)-8,fill:b.text,className:"geo-label",children:o.label!==void 0?o.label:`(${o.x},${o.y})`})]},`p${m}`)})]})}const z=20,J=64,_=70,V={default:{fill:"var(--surface)",stroke:"var(--border)",text:"var(--text-dim)"},current:{fill:"rgba(0, 255, 245, 0.15)",stroke:"var(--accent)",text:"var(--accent)"},root:{fill:"rgba(34, 197, 94, 0.12)",stroke:"var(--easy)",text:"var(--easy)"},merging:{fill:"rgba(240, 165, 0, 0.15)",stroke:"var(--medium)",text:"var(--medium)"}};function pe({data:s}){const{parent:a=[],labels:c=[],highlights:n=[],merging:r=[]}=s,i=$.useMemo(()=>{if(a.length===0)return{trees:[],totalW:600};const h={};a.forEach((x,g)=>{x!==g&&(h[x]||(h[x]=[]),h[x].push(g))});const p=a.map((x,g)=>x===g?g:null).filter(x=>x!==null),f={};let o=0;function m(x){const g=h[x]||[];return g.length===0?1:g.reduce((w,u)=>w+m(u),0)}function b(x,g,w){const u=h[x]||[];if(u.length===0)return f[x]={x:g,y:w},{x:g,w:1};const S=u.map(O=>m(O)),M=S.reduce((O,k)=>O+k,0);let N=g-(M-1)*_/2;return u.forEach((O,k)=>{const Q=N+(S[k]-1)*_/2;b(O,Q,w+J),N+=S[k]*_}),f[x]={x:g,y:w},{x:g,w:M}}const j=[];return p.forEach(x=>{const g=m(x),w=o+(g-1)*_/2+_/2;b(x,w,36),j.push({rootId:x,width:g*_}),o+=g*_+_}),{trees:j,positioned:f,totalW:Math.max(o,300)}},[a]),{positioned:t={},totalW:l}=i,d=h=>r.includes(h)?"merging":n.includes(h)?"current":a[h]===h?"root":"default",v=a.map((h,p)=>h!==p?{from:p,to:h}:null).filter(Boolean),y=36+J*3+20;return e.jsxs("div",{className:"dsu-renderer",children:[e.jsxs("div",{className:"dsu-array",children:[e.jsx("span",{className:"dsu-array-label",children:"parent[]"}),e.jsx("div",{className:"dsu-array-cells",children:a.map((h,p)=>{const f=d(p),o=V[f]||V.default;return e.jsxs("div",{className:"dsu-array-cell-wrap",children:[e.jsx("div",{className:"dsu-array-cell",style:{borderColor:o.stroke,background:o.fill,color:o.text},children:h}),e.jsx("span",{className:"dsu-array-idx",children:c[p]!==void 0?c[p]:p})]},p)})})]}),e.jsxs("svg",{className:"dsu-svg",viewBox:`0 0 ${l} ${y}`,preserveAspectRatio:"xMidYMid meet",children:[v.map((h,p)=>{const f=t[h.from],o=t[h.to];return!f||!o?null:e.jsx("line",{x1:f.x,y1:f.y-z,x2:o.x,y2:o.y+z,stroke:"var(--border)",strokeWidth:1.5,markerEnd:"url(#dsu-arrow)"},p)}),e.jsx("defs",{children:e.jsx("marker",{id:"dsu-arrow",viewBox:"0 0 10 10",refX:"8",refY:"5",markerWidth:"6",markerHeight:"6",orient:"auto-start-reverse",children:e.jsx("path",{d:"M 0 0 L 10 5 L 0 10 z",fill:"var(--text-dim)"})})}),a.map((h,p)=>{const f=t[p];if(!f)return null;const o=d(p),m=V[o]||V.default;return e.jsxs("g",{children:[o==="current"&&e.jsx("circle",{cx:f.x,cy:f.y,r:z+5,className:"graph-node-glow"}),e.jsx("circle",{cx:f.x,cy:f.y,r:z,fill:m.fill,stroke:m.stroke,strokeWidth:o==="current"?2.5:1.5}),e.jsx("text",{x:f.x,y:f.y+1,textAnchor:"middle",dominantBaseline:"middle",fill:m.text,className:"tree-node-label",children:c[p]!==void 0?c[p]:p})]},p)})]})]})}function xe(s){return s?s.type?s.type:s.parent?"disjoint-set":s.points||s.rectangles||s.lines?"geometry":s.array?"array":s.nodes&&s.edges&&s.directed!==void 0?"graph":s.nodes&&s.edges?"tree":s.nodes&&!s.edges?"linked-list":s.items?"stack":s.entries?"hashmap":"array":"unknown"}function ve(s){if(!s)return null;switch(xe(s)){case"array":return e.jsx(P,{data:s});case"graph":return e.jsx(ne,{data:s});case"tree":return e.jsx(le,{data:s});case"linked-list":return e.jsx(de,{data:s});case"stack":case"queue":return e.jsx(he,{data:s});case"hashmap":return e.jsx(me,{data:s});case"geometry":return e.jsx(ue,{data:s});case"disjoint-set":return e.jsx(pe,{data:s});default:return e.jsx(P,{data:s})}}function K({problemId:s}){var S,M;const{steps:a,questions:c,isLoading:n}=G(s),[r,i]=$.useState(0),[t,l]=$.useState(null),[d,v]=$.useState(null),[y,h]=$.useState(!1),[p,f]=$.useState(1500),o=$.useRef(null),m=$.useRef(null);$.useEffect(()=>()=>{m.current&&clearTimeout(m.current)},[]),$.useEffect(()=>{i(0),l(null),v(null),h(!1)},[s]),$.useEffect(()=>(y&&!t&&(o.current=setInterval(()=>{i(N=>N>=a.length-1?(h(!1),N):N+1)},p)),()=>clearInterval(o.current)),[y,p,a.length,t]),$.useEffect(()=>{if(a.length===0)return;const N=a[r];N&&c[N.id]?(l(c[N.id]),h(!1)):(l(null),v(null))},[r,a,c]);const b=()=>{r<a.length-1&&i(N=>N+1)},j=()=>{r>0&&i(N=>N-1)},x=()=>{h(!1),i(0)},g=()=>{h(!1),i(a.length-1)},w=N=>{t&&(N===t.correct_answer?(v({type:"success",text:t.explanation||"Correct!"}),m.current&&clearTimeout(m.current),m.current=setTimeout(()=>{l(null),v(null),m.current=null},2e3)):v({type:"error",text:t.hint||"Incorrect. Try again!"}))};if(n)return e.jsx("div",{className:"dryrun-placeholder",children:"Loading Visualizer..."});if(a.length===0)return e.jsx("div",{className:"dryrun-placeholder",children:"No visual dry run for this problem."});const u=a[r];return e.jsxs("div",{className:"dryrun-container",children:[e.jsx("div",{className:"dryrun-title",children:e.jsx("strong",{children:u.title})}),e.jsxs("div",{className:"dryrun-canvas",children:[((S=u.visual_state_data)==null?void 0:S.status)&&e.jsx("div",{className:"dryrun-status",children:u.visual_state_data.status}),e.jsx("div",{className:"dryrun-visual",children:ve(u.visual_state_data)})]}),t&&e.jsxs("div",{className:"dryrun-question",children:[e.jsx("h4",{children:"Knowledge Check"}),e.jsx("p",{className:"question-text",children:t.question_text}),((M=t.options)==null?void 0:M.length)>0&&e.jsx("div",{className:"question-options",children:t.options.map((N,O)=>e.jsx("button",{className:"question-opt-btn",onClick:()=>w(N),children:N},O))}),d&&e.jsx("div",{className:`question-feedback ${d.type}`,children:d.text})]}),e.jsxs("div",{className:"dryrun-controls",children:[e.jsx("button",{className:"ctrl-btn",onClick:x,disabled:r===0||!!t,title:"Jump to start",children:e.jsx(ee,{size:18})}),e.jsx("button",{className:"ctrl-btn",onClick:j,disabled:r===0||!!t,title:"Previous",children:e.jsx(te,{size:18})}),e.jsx("button",{className:"ctrl-btn ctrl-play",onClick:()=>h(!y),disabled:!!t,title:y?"Pause":"Play",children:y?e.jsx(se,{size:20}):e.jsx(re,{size:20})}),e.jsx("button",{className:"ctrl-btn",onClick:b,disabled:r===a.length-1||!!t,title:"Next",children:e.jsx(ae,{size:18})}),e.jsx("button",{className:"ctrl-btn",onClick:g,disabled:r===a.length-1||!!t,title:"Jump to end",children:e.jsx(ie,{size:18})}),e.jsxs("span",{className:"step-counter",children:[r+1," / ",a.length]}),e.jsxs("select",{className:"speed-select",value:p,onChange:N=>f(Number(N.target.value)),children:[e.jsx("option",{value:2500,children:"0.5x"}),e.jsx("option",{value:1500,children:"1x"}),e.jsx("option",{value:800,children:"2x"}),e.jsx("option",{value:400,children:"4x"})]})]})]})}function ge(){const s=[-1,0,3,5,9,12],a=9,c=[];let n=0,r=s.length-1;const i=new Set;for(c.push({array:s,highlights:{[n]:"low",[r]:"high"},eliminated:new Set(i),caption:`Sorted input: [${s.join(", ")}]. Search target = ${a}. Initialize lo=${n}, hi=${r}.`});n<=r;){const t=Math.floor((n+r)/2);if(c.push({array:s,highlights:{[n]:"low",[r]:"high",[t]:"mid"},eliminated:new Set(i),caption:`mid = (lo + hi) / 2 = (${n} + ${r}) / 2 = ${t}. arr[${t}] = ${s[t]}.`}),s[t]===a){c.push({array:s,highlights:{[t]:"match"},eliminated:new Set(i),caption:`Match! arr[${t}] equals ${a}. Return ${t}.`});break}if(s[t]<a){c.push({array:s,highlights:{[n]:"low",[r]:"high",[t]:"mid"},eliminated:new Set([...i,...Array.from({length:t-n+1},(l,d)=>n+d)]),caption:`${s[t]} < ${a} — target must be in the right half. Discard arr[${n}..${t}].`});for(let l=n;l<=t;l++)i.add(l);n=t+1,c.push({array:s,highlights:{[n]:"low",[r]:"high"},eliminated:new Set(i),caption:`Move lo to ${n}. Active window: arr[${n}..${r}].`})}else{c.push({array:s,highlights:{[n]:"low",[r]:"high",[t]:"mid"},eliminated:new Set([...i,...Array.from({length:r-t+1},(l,d)=>t+d)]),caption:`${s[t]} > ${a} — target must be in the left half. Discard arr[${t}..${r}].`});for(let l=t;l<=r;l++)i.add(l);r=t-1,c.push({array:s,highlights:{[n]:"low",[r]:"high"},eliminated:new Set(i),caption:`Move hi to ${r}. Active window: arr[${n}..${r}].`})}}return c.push({array:s,eliminated:new Set(i),caption:`Done. Binary search runs in O(log n) — for n=${s.length}, at most ${Math.ceil(Math.log2(s.length+1))} compares.`}),{renderer:"array",title:"Binary search step-by-step",frames:c}}function fe(){const s=[2,7,11,15],a=9,c={},n=[];n.push({array:s,caption:`Find indices of two numbers in [${s.join(", ")}] summing to ${a}. We'll scan once, remembering numbers in a hashmap.`});for(let r=0;r<s.length;r++){const i=a-s[r];if(n.push({array:s,highlights:{[r]:"mid"},caption:`i=${r}, nums[i]=${s[r]}. Look for complement (${a} − ${s[r]} = ${i}) in the hashmap. Seen so far: {${Object.entries(c).map(([t,l])=>`${t}:${l}`).join(", ")||"∅"}}.`}),i in c)return n.push({array:s,highlights:{[c[i]]:"match",[r]:"match"},caption:`Found! ${s[c[i]]} (index ${c[i]}) + ${s[r]} (index ${r}) = ${a}. Return [${c[i]}, ${r}].`}),{renderer:"array",title:"Two Sum — single-pass hashmap",frames:n};c[s[r]]=r,n.push({array:s,highlights:{[r]:"low"},caption:`Complement ${i} not yet seen. Record nums[${r}]=${s[r]} → ${r} in the hashmap and move on.`})}return{renderer:"array",title:"Two Sum — single-pass hashmap",frames:n}}function ye(){const s=[-2,1,-3,4,-1,2,1,-5,4],a=[];let c=s[0],n=s[0],r=0,i=0,t=0;a.push({array:s,highlights:{0:"mid"},caption:`Kadane's: walk left→right keeping (cur = best ending here, best = best so far). cur = best = a[0] = ${s[0]}.`});for(let d=1;d<s.length;d++){c+s[d]<s[d]?(c=s[d],t=d):c=c+s[d];const v=new Set;for(let h=0;h<t;h++)v.add(h);let y=!1;c>n&&(n=c,r=t,i=d,y=!0),a.push({array:s,highlights:{[d]:"mid",[t]:"low"},eliminated:v,caption:`i=${d}: cur = ${c} (subarray a[${t}..${d}]). best = ${n}.${y?" New maximum!":""}`})}const l=new Set;for(let d=0;d<s.length;d++)(d<r||d>i)&&l.add(d);return a.push({array:s,highlights:Object.fromEntries(Array.from({length:i-r+1},(d,v)=>[r+v,"match"])),eliminated:l,caption:`Maximum subarray is a[${r}..${i}] with sum ${n}.`}),{renderer:"array",title:"Kadane's algorithm",frames:a}}function be(){const s="({[]})",a=[],c={")":"(","]":"[","}":"{"},n=[];n.push({array:s.split("").map(r=>r.charCodeAt(0)),caption:`Validate "${s}". Push opens, pop on closes and verify match.`});for(let r=0;r<s.length;r++){const i=s[r];if(i in c){const t=a[a.length-1],l=t===c[i];if(n.push({array:s.split("").map(d=>d.charCodeAt(0)),highlights:{[r]:l?"match":"high"},caption:`i=${r}: '${i}' is a close. Top of stack is '${t||"empty"}'. ${l?"Matches — pop.":"Mismatch — invalid."}`}),l)a.pop();else return{renderer:"array",title:"Valid parentheses",frames:n}}else a.push(i),n.push({array:s.split("").map(t=>t.charCodeAt(0)),highlights:{[r]:"low"},caption:`i=${r}: '${i}' is an open. Push to stack. Stack: [${a.join("")}].`})}return n.push({array:s.split("").map(r=>r.charCodeAt(0)),caption:a.length===0?"End reached, stack empty → valid.":`Stack non-empty: [${a.join("")}] → invalid.`}),{renderer:"array",title:"Valid parentheses",frames:n}}function je(){const a=[1,1],c=[];c.push({array:[1,1,0,0,0,0,0,0],highlights:{0:"match",1:"match"},caption:"Climb to step 7. dp[0]=1, dp[1]=1 (one way to start, one way to be on step 1)."});for(let n=2;n<=7;n++)a[n]=a[n-1]+a[n-2],c.push({array:[...a,...Array(8-a.length).fill(0)],highlights:{[n]:"mid",[n-1]:"low",[n-2]:"low"},caption:`dp[${n}] = dp[${n-1}] + dp[${n-2}] = ${a[n-1]} + ${a[n-2]} = ${a[n]}.`});return c.push({array:a,highlights:{7:"match"},caption:`Answer = dp[7] = ${a[7]} distinct ways to climb 7 steps. O(n) time, O(1) extra space possible.`}),{renderer:"array",title:"Climbing stairs DP",frames:c}}function Ne(){const s=[1,2,3,4,5],a=[];a.push({array:s,caption:`Reverse the list [${s.join(" → ")}]. Maintain three pointers: prev (red), cur (highlighted), next (yellow).`});let c=-1,n=0;const r=[...s];for(;n<s.length;){const i=n+1;a.push({array:r,highlights:{...c>=0?{[c]:"high"}:{},[n]:"mid",...i<s.length?{[i]:"low"}:{}},caption:`prev = ${c>=0?r[c]:"null"}, cur = ${r[n]}, next = ${i<s.length?r[i]:"null"}. Rewire cur.next → prev.`}),c=n,n=i}return a.push({array:[...s].reverse(),highlights:Object.fromEntries(s.map((i,t)=>[t,"match"])),caption:`Done. New head = ${s[s.length-1]}. Reversed: [${[...s].reverse().join(" → ")}].`}),{renderer:"array",title:"Reverse linked list — 3-pointer rewire",frames:a}}const ke={"two-sum":{tags:["array","hash-map"],companies:["google","meta","amazon","microsoft","apple","bloomberg"],viz:fe(),solutions:{python:{code:`def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []`,complexity:{time:"O(n)",space:"O(n)"},approach:"Single pass — for each x, look up the complement (target - x) in a hashmap we build as we go. The first hit is the answer."},javascript:{code:`function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,complexity:{time:"O(n)",space:"O(n)"},approach:"Same hashmap idea using JS Map. Map preserves insertion order which is irrelevant here but is what you want for related problems."},java:{code:`class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,complexity:{time:"O(n)",space:"O(n)"},approach:"Java HashMap. Allocate result array only if found. Returning new int[0] for the impossible case (problem guarantees an answer exists)."},cpp:{code:`class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int need = target - nums[i];
            auto it = seen.find(need);
            if (it != seen.end()) return {it->second, i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,complexity:{time:"O(n)",space:"O(n)"},approach:"unordered_map for O(1) average lookup. Use auto+find to avoid double hashing (vs. count() + [])."}}},"max-subarray":{tags:["array","dynamic-programming"],companies:["amazon","microsoft","apple","meta","bloomberg"],viz:ye(),solutions:{python:{code:`def maxSubArray(nums: list[int]) -> int:
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)   # extend or restart
        best = max(best, cur)
    return best`,complexity:{time:"O(n)",space:"O(1)"},approach:"Kadane's algorithm. For each element, decide: start fresh here (x) or extend the running sum (cur + x). Track the best ever."},javascript:{code:`function maxSubArray(nums) {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}`,complexity:{time:"O(n)",space:"O(1)"},approach:"Iterative Kadane in JS. Equivalent to the Python version, just spelled out with Math.max."},java:{code:`class Solution {
    public int maxSubArray(int[] nums) {
        int cur = nums[0], best = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);
            best = Math.max(best, cur);
        }
        return best;
    }
}`,complexity:{time:"O(n)",space:"O(1)"},approach:"Same one-pass Kadane."},cpp:{code:`class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int cur = nums[0], best = nums[0];
        for (size_t i = 1; i < nums.size(); ++i) {
            cur = max(nums[i], cur + nums[i]);
            best = max(best, cur);
        }
        return best;
    }
};`,complexity:{time:"O(n)",space:"O(1)"},approach:"Same one-pass Kadane in C++."}}},"valid-parentheses":{tags:["stack","string"],companies:["amazon","microsoft","meta","google","bloomberg"],viz:be(),solutions:{python:{code:`def isValid(s: str) -> bool:
    stack = []
    pair = {')': '(', ']': '[', '}': '{'}
    for ch in s:
        if ch in pair:
            if not stack or stack.pop() != pair[ch]:
                return False
        else:
            stack.append(ch)
    return not stack`,complexity:{time:"O(n)",space:"O(n)"},approach:"Push opens, pop on each close and verify it matches. Valid iff stack empties to nothing."},javascript:{code:`function isValid(s) {
  const stack = [];
  const pair = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if (ch in pair) {
      if (stack.pop() !== pair[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,complexity:{time:"O(n)",space:"O(n)"},approach:"Same stack pattern. `stack.pop()` on empty returns undefined which compares !== to any opener — short-circuits cleanly."},java:{code:`class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        Map<Character, Character> pair = Map.of(')', '(', ']', '[', '}', '{');
        for (char ch : s.toCharArray()) {
            if (pair.containsKey(ch)) {
                if (stack.isEmpty() || stack.pop() != pair.get(ch)) return false;
            } else {
                stack.push(ch);
            }
        }
        return stack.isEmpty();
    }
}`,complexity:{time:"O(n)",space:"O(n)"},approach:"Use ArrayDeque (faster than legacy Stack class). Map.of for a tiny immutable lookup."},cpp:{code:`class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        unordered_map<char, char> pair = {{')', '('}, {']', '['}, {'}', '{'}};
        for (char ch : s) {
            if (pair.count(ch)) {
                if (st.empty() || st.top() != pair[ch]) return false;
                st.pop();
            } else {
                st.push(ch);
            }
        }
        return st.empty();
    }
};`,complexity:{time:"O(n)",space:"O(n)"},approach:"Standard std::stack of chars. count() avoids the find()+!=end() dance."}}},"climbing-stairs":{tags:["dynamic-programming","math"],companies:["amazon","apple","microsoft","google","bloomberg"],viz:je(),solutions:{python:{code:`def climbStairs(n: int) -> int:
    a, b = 1, 1     # ways(0), ways(1)
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,complexity:{time:"O(n)",space:"O(1)"},approach:"Fibonacci shifted by one. Only the last two values matter — keep them in two ints, no array needed."},javascript:{code:`function climbStairs(n) {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}`,complexity:{time:"O(n)",space:"O(1)"},approach:"Tuple-swap for the rolling pair. JS destructuring keeps it terse."},java:{code:`class Solution {
    public int climbStairs(int n) {
        int a = 1, b = 1;
        for (int i = 2; i <= n; i++) {
            int next = a + b;
            a = b; b = next;
        }
        return b;
    }
}`,complexity:{time:"O(n)",space:"O(1)"},approach:"Explicit `next` var since Java has no tuple-swap. Same O(1) space."},cpp:{code:`class Solution {
public:
    int climbStairs(int n) {
        int a = 1, b = 1;
        for (int i = 2; i <= n; ++i) {
            int next = a + b;
            a = b; b = next;
        }
        return b;
    }
};`,complexity:{time:"O(n)",space:"O(1)"},approach:"Same rolling-pair pattern. Could also use std::tie/swap."}}},"reverse-linked-list":{tags:["linked-list","recursion"],companies:["amazon","meta","microsoft","apple","google"],viz:Ne(),solutions:{python:{code:`def reverseList(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev`,complexity:{time:"O(n)",space:"O(1)"},approach:"Three-pointer iterative rewire. prev starts null; each iteration flips cur.next to prev then walks both forward."},javascript:{code:`function reverseList(head) {
  let prev = null, cur = head;
  while (cur) {
    const nxt = cur.next;
    cur.next = prev;
    prev = cur;
    cur = nxt;
  }
  return prev;
}`,complexity:{time:"O(n)",space:"O(1)"},approach:"Standard iterative reverse. Recursive version is one-liner but O(n) call-stack space."},java:{code:`class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, cur = head;
        while (cur != null) {
            ListNode nxt = cur.next;
            cur.next = prev;
            prev = cur;
            cur = nxt;
        }
        return prev;
    }
}`,complexity:{time:"O(n)",space:"O(1)"},approach:"Three-pointer iterative reverse in Java."},cpp:{code:`class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode *prev = nullptr, *cur = head;
        while (cur) {
            ListNode* nxt = cur->next;
            cur->next = prev;
            prev = cur;
            cur = nxt;
        }
        return prev;
    }
};`,complexity:{time:"O(n)",space:"O(1)"},approach:"Same iterative reverse in C++ with raw pointers."}}},"binary-search":{tags:["binary-search","array","divide-and-conquer"],companies:["google","meta","amazon","microsoft","apple","bloomberg"],constraints:`1 ≤ nums.length ≤ 10^4
-10^4 < nums[i], target < 10^4
All integers in nums are unique.
nums is sorted in ascending order.`,followUp:'Can you handle duplicates by returning the leftmost or rightmost occurrence? Look at "Find First and Last Position of Element in Sorted Array."',similar:["search-insert-position","find-first-last-position","search-rotated-sorted","find-minimum-rotated-sorted","find-peak-element","sqrt-x"],viz:ge(),solutions:{python:{code:`def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2   # avoid overflow on very large arrays
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,complexity:{time:"O(log n)",space:"O(1)"},approach:"Maintain a half-open window [lo, hi] that must contain the target if it exists. Each iteration halves the window by comparing the middle element. When lo crosses hi, the target was absent."},javascript:{code:`function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);   // bit-shift for floor division
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,complexity:{time:"O(log n)",space:"O(1)"},approach:"Same iterative window-halving as Python. The bit-shift `>> 1` is functionally equivalent to `Math.floor((hi-lo)/2)` and slightly faster."},java:{code:`class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;   // avoid (lo + hi) overflow
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
}`,complexity:{time:"O(log n)",space:"O(1)"},approach:"`lo + (hi - lo) / 2` is the standard Java idiom — `(lo + hi) / 2` overflows when both are near Integer.MAX_VALUE."},cpp:{code:`class Solution {
public:
    int search(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
};`,complexity:{time:"O(log n)",space:"O(1)"},approach:"STL `std::lower_bound` does this exact search in 1 line — but writing it yourself is the canonical interview answer."}}}};function Oe({problem:s,activeLang:a}){var b,j,x,g,w;const[c,n]=$.useState([]),[r,i]=$.useState(!0),[t,l]=$.useState(a||"python"),[d,v]=$.useState(null);$.useEffect(()=>{a&&l(a)},[a]);const y=async(u,S)=>{if(S)try{await navigator.clipboard.writeText(S),v(u),setTimeout(()=>v(M=>M===u?null:M),1500)}catch{}},h=s==null?void 0:s.id;if($.useEffect(()=>{h&&(async()=>{i(!0);try{const{data:u}=await Z.from("PGcode_solution_approaches").select("*").eq("problem_id",h).order("approach_number",{ascending:!0});n(u||[])}catch(u){console.error("Failed to load solution approaches:",u)}finally{i(!1)}})()},[h]),r)return e.jsx("div",{className:"sv-loading",children:"Loading solutions..."});const p={python:"Python",javascript:"JavaScript",java:"Java",cpp:"C++"},f=s.solutions&&Object.keys(s.solutions).length>0?s.solutions:((b=ke[s.id])==null?void 0:b.solutions)||null,o=f?Object.fromEntries(Object.entries(f).map(([u,S])=>[u,typeof S=="string"?{code:S}:S])):null;if(c.length===0&&o)return e.jsxs("div",{className:"sv-container",children:[e.jsxs("h2",{className:"sv-problem-title",children:[s.name," — reference solution"]}),e.jsxs("div",{className:"sv-approach",children:[e.jsxs("div",{className:"sv-subsection",children:[e.jsxs("div",{className:"sv-code-header",children:[e.jsx("div",{className:"sv-lang-tabs",children:["python","javascript","java","cpp"].map(u=>{var S;return e.jsx("button",{className:`sv-lang-tab ${t===u?"active":""}`,onClick:()=>l(u),disabled:!((S=o[u])!=null&&S.code),children:p[u]},u)})}),e.jsxs("button",{className:`sv-copy-btn ${d==="fb"?"copied":""}`,onClick:()=>{var u;return y("fb",(u=o[t])==null?void 0:u.code)},disabled:!((j=o[t])!=null&&j.code),children:[d==="fb"?e.jsx(T,{size:13}):e.jsx(X,{size:13}),e.jsx("span",{children:d==="fb"?"Copied":"Copy"})]})]}),(x=o[t])!=null&&x.code?e.jsx("pre",{className:"sv-code-block",children:e.jsx("code",{children:o[t].code})}):e.jsxs("div",{className:"sv-code-empty",children:["No ",p[t]," solution yet."]})]}),((g=o[t])==null?void 0:g.approach)&&e.jsxs("div",{className:"sv-subsection",children:[e.jsx("h4",{className:"sv-subtitle",children:"Approach"}),e.jsx("p",{className:"sv-text",children:o[t].approach})]}),((w=o[t])==null?void 0:w.complexity)&&e.jsxs("div",{className:"sv-complexity",children:[e.jsxs("span",{children:[e.jsx("strong",{children:"Time:"})," ",o[t].complexity.time]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Space:"})," ",o[t].complexity.space]})]})]})]});if(c.length===0)return e.jsxs("div",{className:"sv-container",children:[s.solution_video_url&&e.jsxs("div",{className:"sv-section",children:[e.jsx("h3",{className:"sv-section-title",children:"Video Explanation"}),e.jsx("div",{className:"sv-video-wrap",children:e.jsx("iframe",{src:`https://www.youtube.com/embed/${s.solution_video_url}`,title:"Video",allowFullScreen:!0})})]}),e.jsxs("div",{className:"sv-section",children:[e.jsx("h3",{className:"sv-section-title",children:"Visual Dry Run"}),e.jsx(K,{problemId:s.id})]})]});const m={python:"code_python",javascript:"code_javascript",java:"code_java",cpp:"code_cpp"};return e.jsxs("div",{className:"sv-container",children:[e.jsxs("h2",{className:"sv-problem-title",children:[s.name," - Explanation"]}),s.solution_video_url&&e.jsxs("div",{className:"sv-section",children:[e.jsx("h3",{className:"sv-section-title",children:"Video Explanation"}),e.jsx("div",{className:"sv-video-wrap",children:e.jsx("iframe",{src:`https://www.youtube.com/embed/${s.solution_video_url}`,title:"Video",allowFullScreen:!0})})]}),c.map((u,S)=>{let M=[];try{const O=typeof u.algorithm_steps=="string"?JSON.parse(u.algorithm_steps):u.algorithm_steps||[];M=Array.isArray(O)?O:(O==null?void 0:O.steps)||[]}catch{}const N=u[m[t]]||u.code_python||"";return e.jsxs("div",{className:"sv-approach",children:[e.jsxs("h3",{className:"sv-approach-title",children:[S+1,". ",u.approach_name]}),e.jsxs("div",{className:"sv-subsection",children:[e.jsx("h4",{className:"sv-subtitle",children:"Intuition"}),e.jsx("p",{className:"sv-text",children:u.intuition})]}),e.jsxs("div",{className:"sv-subsection",children:[e.jsx("h4",{className:"sv-subtitle",children:"Algorithm"}),e.jsx("ol",{className:"sv-algo-steps",children:M.map((O,k)=>e.jsx("li",{children:O},k))})]}),S===c.length-1&&e.jsxs("div",{className:"sv-subsection",children:[e.jsx("h4",{className:"sv-subtitle",children:"Visual Dry Run"}),e.jsx(K,{problemId:s.id})]}),e.jsxs("div",{className:"sv-subsection",children:[e.jsxs("div",{className:"sv-code-header",children:[e.jsx("div",{className:"sv-lang-tabs",children:["python","javascript","java","cpp"].map(O=>e.jsx("button",{className:`sv-lang-tab ${t===O?"active":""}`,onClick:()=>l(O),children:p[O]},O))}),e.jsxs("button",{className:`sv-copy-btn ${d===u.id?"copied":""}`,onClick:()=>y(u.id,N),disabled:!N,title:N?"Copy code":"No code to copy","aria-label":"Copy code",children:[d===u.id?e.jsx(T,{size:13}):e.jsx(X,{size:13}),e.jsx("span",{children:d===u.id?"Copied":"Copy"})]})]}),N?e.jsx("pre",{className:"sv-code-block",children:e.jsx("code",{children:N})}):e.jsxs("div",{className:"sv-code-empty",children:["No ",p[t]," reference yet for this approach."]})]}),e.jsxs("div",{className:"sv-complexity",children:[e.jsxs("span",{children:[e.jsx("strong",{children:"Time:"})," ",u.time_complexity]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Space:"})," ",u.space_complexity]})]})]},u.id)})]})}export{ke as R,Oe as S};
