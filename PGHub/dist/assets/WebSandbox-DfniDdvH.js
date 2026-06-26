import{r as a,j as e}from"./vendor-query-FJdQ8OJm.js";import{F as R}from"./vendor-monaco-BrjDLSos.js";import{P as T}from"./PlaygroundSwitcher-Ao9Ehz__.js";import{r as C,a as E}from"./monacoTheme-yMFPRmqj.js";import{Y as L,P,_ as z,w as H,i as $,J as M,$ as A,a0 as F}from"./vendor-icons-CE-12aBL.js";import"./vendor-react-firagBrd.js";const l={html:`<!doctype html>
<html>
  <head><title>PG Hub Sandbox</title></head>
  <body>
    <h1 id="hello">Hello, PG Hub!</h1>
    <button id="go">Click me</button>
  </body>
</html>
`,css:`body {
  font-family: system-ui, -apple-system, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  background: #0b1024;
  color: #f5f4ff;
}
h1 { font-weight: 700; }
button {
  background: #a78bfa;
  border: none;
  color: #0b1024;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
`,js:`document.getElementById('go').addEventListener('click', () => {
  const h = document.getElementById('hello');
  h.textContent = h.textContent === 'Hello, PG Hub!' ? 'PG Hub works!' : 'Hello, PG Hub!';
});
`},f="pgcode_websandbox_v1";function p(c,o,t){return/<!doctype/i.test(c)?c.replace(/<\/head>/i,`<style>${o}</style></head>`).replace(/<\/body>/i,`<script>${t}<\/script></body>`):`<!doctype html><html><head><meta charset="utf-8"><style>${o}</style></head><body>${c}<script>${t}<\/script></body></html>`}const j=[{id:"html",label:"HTML",icon:L,lang:"html"},{id:"css",label:"CSS",icon:P,lang:"css"},{id:"js",label:"JS",icon:z,lang:"javascript"}];function _({theme:c}){const o=a.useMemo(()=>{try{const s=JSON.parse(localStorage.getItem(f)||"null");if(s&&typeof s=="object")return{...l,...s}}catch{}return l},[]),[t,b]=a.useState(o),[i,y]=a.useState("html"),[r,g]=a.useState(!0),[w,x]=a.useState(()=>p(o.html,o.css,o.js)),[d,v]=a.useState(!1),m=a.useRef(null);a.useEffect(()=>{const s=setTimeout(()=>{localStorage.setItem(f,JSON.stringify(t))},250);return()=>clearTimeout(s)},[t]);const u=a.useCallback(()=>{x(p(t.html,t.css,t.js))},[t]);a.useEffect(()=>{if(r)return clearTimeout(m.current),m.current=setTimeout(u,400),()=>clearTimeout(m.current)},[r,u]);const S=()=>{b(l),x(p(l.html,l.css,l.js))},N=()=>{const s=new Blob([w],{type:"text/html"}),n=URL.createObjectURL(s);window.open(n,"_blank"),setTimeout(()=>URL.revokeObjectURL(n),3e4)},k=C(c),h=j.find(s=>s.id===i);return e.jsxs("div",{className:`web-sandbox ${d?"fullscreen":""}`,children:[e.jsxs("header",{className:"ws-sb-header",children:[e.jsxs("div",{className:"ws-sb-title-row",children:[e.jsx(T,{current:"web"}),e.jsx("h1",{className:"ws-sb-title",children:"Web Sandbox"}),e.jsx("p",{className:"ws-sb-sub",children:"HTML + CSS + JS, live preview. Auto-runs as you type. Nothing leaves your browser."})]}),e.jsxs("div",{className:"ws-sb-controls",children:[e.jsxs("label",{className:"ws-sb-auto",children:[e.jsx("input",{type:"checkbox",checked:r,onChange:s=>g(s.target.checked)}),e.jsx("span",{children:"Auto-run"})]}),!r&&e.jsxs("button",{className:"ws-sb-btn ws-sb-btn-primary",onClick:u,children:[e.jsx(H,{size:13})," Run"]}),e.jsxs("button",{className:"ws-sb-btn ws-sb-btn-ghost",onClick:S,title:"Reset to starter",children:[e.jsx($,{size:13})," Reset"]}),e.jsx("button",{className:"ws-sb-btn ws-sb-btn-ghost",onClick:N,title:"Open preview in new tab",children:e.jsx(M,{size:13})}),e.jsx("button",{className:"ws-sb-btn ws-sb-btn-ghost",onClick:()=>v(s=>!s),title:d?"Exit fullscreen":"Fullscreen preview",children:d?e.jsx(A,{size:13}):e.jsx(F,{size:13})})]})]}),e.jsxs("div",{className:"ws-sb-body",children:[e.jsxs("div",{className:"ws-sb-editor-pane",children:[e.jsx("div",{className:"ws-sb-tabs",children:j.map(s=>{const n=s.icon;return e.jsxs("button",{className:`ws-sb-tab ws-sb-tab-${s.id} ${i===s.id?"active":""}`,onClick:()=>y(s.id),children:[e.jsx(n,{size:12})," ",s.label]},s.id)})}),e.jsx(R,{height:"100%",language:(h==null?void 0:h.lang)||"html",beforeMount:s=>E(s),theme:k,value:t[i]??"",onChange:s=>b(n=>({...n,[i]:s??""})),options:{fontSize:13,minimap:{enabled:!1},scrollBeyondLastLine:!1,automaticLayout:!0,padding:{top:10},tabSize:2,fontFamily:'"Space Mono", monospace'}})]}),e.jsxs("div",{className:"ws-sb-preview-pane",children:[e.jsxs("div",{className:"ws-sb-preview-head",children:[e.jsx("span",{className:"ws-sb-preview-label",children:"Preview"}),e.jsx("span",{className:"ws-sb-preview-host",children:"about:srcdoc"})]}),e.jsx("iframe",{className:"ws-sb-iframe",sandbox:"allow-scripts allow-modals allow-forms",srcDoc:w,title:"Sandbox preview"})]})]})]})}export{_ as default};
