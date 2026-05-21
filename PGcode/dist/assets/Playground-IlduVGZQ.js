import{r as a,j as e}from"./vendor-query-BRJAL8XB.js";import{F as V}from"./vendor-monaco-C7MgEFNj.js";import{P as X,r as Y}from"./codeRunner-DG_swUEb.js";import{s as N}from"./index-CHqPEOqx.js";import{S as Z}from"./Select-BJ3-fQ4M.js";import{P as ee}from"./PlaygroundSwitcher-5CEcTELe.js";import{c as se,a as te}from"./vendor-react-CVsKg3BP.js";import{C as ae,J as I,a5 as ne,R as oe,e as le,b as re,aa as ie}from"./vendor-icons-7AH6yvdn.js";import"./vendor-supabase-ClVc2H6D.js";const R={python:`# Free-form Python playground. Cmd/Ctrl+Enter to run.
print("Hello, PGcode!")
`,javascript:`// Free-form JS playground. Cmd/Ctrl+Enter to run.
console.log("Hello, PGcode!");
`,typescript:'// TypeScript playground. (Compiles to JS, then runs on Node.)\nconst greet = (name: string) => `Hello, ${name}!`;\nconsole.log(greet("PGcode"));\n',java:`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, PGcode!");
    }
}
`,cpp:`#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello, PGcode!" << endl;
    return 0;
}
`,c:`#include <stdio.h>

int main() {
    printf("Hello, PGcode!\\n");
    return 0;
}
`,go:`package main

import "fmt"

func main() {
    fmt.Println("Hello, PGcode!")
}
`,rust:`fn main() {
    println!("Hello, PGcode!");
}
`,csharp:`using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, PGcode!");
    }
}
`,ruby:`puts "Hello, PGcode!"
`,kotlin:`fun main() {
    println("Hello, PGcode!")
}
`,swift:`print("Hello, PGcode!")
`,php:`<?php
echo "Hello, PGcode!\\n";
`,bash:`echo "Hello, PGcode!"
`},C=r=>`pgcode_playground_${r}`,K="pgcode_playground_stdin";function ce(){const r="abcdefghijklmnopqrstuvwxyz0123456789";let d="";for(let i=0;i<8;i++)d+=r[Math.floor(Math.random()*r.length)];return d}function xe({theme:r,preferredLang:d,session:i}){var M;const{slug:h}=se(),k=te(),f=a.useMemo(()=>X,[]),E=s=>f.some(t=>t.value===s),P=E(d)?d:"python",[o,G]=a.useState(P),[l,y]=a.useState(()=>localStorage.getItem(C(P))||R[P]||""),[c,L]=a.useState(()=>localStorage.getItem(K)||""),[p,H]=a.useState(!1),[n,u]=a.useState(null),[J,$]=a.useState(!1),[S,z]=a.useState(!1),[x,g]=a.useState(null),[j,T]=a.useState(!1),[m,b]=a.useState(null),U=a.useRef(null);a.useEffect(()=>{if(!h){b(null),g(null);return}T(!0),g(null),b(null);let s=!1;return(async()=>{const{data:t,error:w}=await N.from("PGcode_playground_snippets").select("*").eq("slug",h).maybeSingle();s||(w?b(`Couldn't load that snippet: ${w.message}`):t?(E(t.language)&&G(t.language),y(t.source_code||""),L(t.stdin||""),g(`${window.location.origin}${window.location.pathname}#/playground/share/${t.slug}`),N.rpc("increment_snippet_views",{snippet_slug:t.slug}).then(({error:v})=>{v&&N.from("PGcode_playground_snippets").update({view_count:(t.view_count||0)+1}).eq("slug",t.slug).then(()=>{})})):b(`No snippet found at /playground/share/${h}.`),T(!1))})(),()=>{s=!0}},[h]);const q=a.useCallback(async()=>{var s;if(!S){z(!0);try{const t=ce(),w={slug:t,user_id:((s=i==null?void 0:i.user)==null?void 0:s.id)||null,language:o,source_code:l,stdin:c},{error:v}=await N.from("PGcode_playground_snippets").insert(w);if(v)throw v;const F=`${window.location.origin}${window.location.pathname}#/playground/share/${t}`;g(F);try{await navigator.clipboard.writeText(F)}catch{}k(`/playground/share/${t}`)}catch(t){g(null),u({status:"runtime_error",output:`Share failed: ${(t==null?void 0:t.message)||t}`,elapsed:0})}finally{z(!1)}}},[l,o,c,i,S,k]),A=a.useCallback(s=>{if(s===o)return;localStorage.setItem(C(o),l);const t=localStorage.getItem(C(s));G(s),y(t??R[s]??""),u(null)},[o,l]);a.useEffect(()=>{const s=setTimeout(()=>localStorage.setItem(C(o),l),250);return()=>clearTimeout(s)},[l,o]),a.useEffect(()=>{const s=setTimeout(()=>localStorage.setItem(K,c),250);return()=>clearTimeout(s)},[c]);const _=a.useCallback(async()=>{if(p)return;H(!0),u(null);const s=performance.now();try{const t=await Y(l,o,c);u({...t,elapsed:Math.round(performance.now()-s)})}catch(t){u({status:"runtime_error",output:(t==null?void 0:t.message)||"Execution failed",elapsed:Math.round(performance.now()-s)})}finally{H(!1)}},[l,o,c,p]);a.useEffect(()=>{const s=t=>{(t.metaKey||t.ctrlKey)&&t.key==="Enter"&&(t.preventDefault(),_())};return window.addEventListener("keydown",s),()=>window.removeEventListener("keydown",s)},[_]);const O=()=>{y(R[o]??""),u(null)},W=async()=>{if(n!=null&&n.output)try{await navigator.clipboard.writeText(n.output),$(!0),setTimeout(()=>$(!1),1200)}catch{}},D=((M=f.find(s=>s.value===o))==null?void 0:M.monaco)||"python",Q=r==="light"||r==="solarized"?"light":"vs-dark",B=s=>{switch(s){case"success":return"Success";case"compile_error":return"Compile Error";case"runtime_error":return"Runtime Error";case"time_limit":return"Time Limit Exceeded";default:return s||"Idle"}};return e.jsxs("div",{className:"pg-playground",children:[e.jsxs("div",{className:"pg-pg-header",children:[e.jsxs("div",{className:"pg-pg-title-row",children:[e.jsx(ee,{current:"code"}),e.jsx("h1",{className:"pg-pg-title",children:"Compiler"}),e.jsxs("p",{className:"pg-pg-sub",children:["Free-form code execution across ",f.length," languages. Use the pills above to jump to Web (HTML/CSS/JS) or SQL (in-browser SQLite)."]})]}),e.jsxs("div",{className:"pg-pg-controls",children:[e.jsx(Z,{value:o,onChange:A,options:f,icon:e.jsx(ae,{size:12}),size:"sm"}),e.jsxs("button",{className:"pg-pg-btn pg-pg-btn-ghost",onClick:q,disabled:S,title:"Save a shareable link",children:[S?e.jsx(I,{size:14,className:"pg-pg-spin"}):e.jsx(ne,{size:14}),x?"Link copied":"Share"]}),e.jsxs("button",{className:"pg-pg-btn pg-pg-btn-ghost",onClick:O,title:"Reset starter template",children:[e.jsx(oe,{size:14})," Reset"]}),e.jsxs("button",{className:"pg-pg-btn pg-pg-btn-primary",onClick:_,disabled:p,title:"Run (Cmd/Ctrl+Enter)",children:[p?e.jsx(I,{size:14,className:"pg-pg-spin"}):e.jsx(le,{size:14}),p?"Running":"Run"]})]})]}),(x||j||m)&&e.jsxs("div",{className:`pg-pg-share-row${m?" pg-pg-share-row-error":""}`,children:[j&&e.jsx("span",{className:"pg-pg-share-loading",children:"Loading shared snippet…"}),!j&&m&&e.jsx("span",{className:"pg-pg-share-error",children:m}),!j&&!m&&x&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"pg-pg-share-label",children:"Shareable link:"}),e.jsx("code",{className:"pg-pg-share-url",children:x})]})]}),e.jsxs("div",{className:"pg-pg-body",children:[e.jsx("div",{className:"pg-pg-editor",children:e.jsx(V,{height:"100%",language:D,theme:Q,value:l,onChange:s=>y(s??""),onMount:s=>{U.current=s},options:{fontSize:14,minimap:{enabled:!1},scrollBeyondLastLine:!1,automaticLayout:!0,padding:{top:12},tabSize:4,renderWhitespace:"selection",fontFamily:'"Space Mono", monospace'}})}),e.jsxs("div",{className:"pg-pg-side",children:[e.jsxs("div",{className:"pg-pg-panel",children:[e.jsxs("div",{className:"pg-pg-panel-head",children:[e.jsx("span",{className:"pg-pg-panel-label",children:"Stdin"}),e.jsx("span",{className:"pg-pg-panel-hint",children:"(optional)"})]}),e.jsx("textarea",{className:"pg-pg-stdin",value:c,onChange:s=>L(s.target.value),placeholder:"Lines fed to the program's standard input...",spellCheck:!1})]}),e.jsxs("div",{className:"pg-pg-panel pg-pg-panel-output",children:[e.jsxs("div",{className:"pg-pg-panel-head",children:[e.jsx("span",{className:"pg-pg-panel-label",children:"Output"}),e.jsxs("div",{className:"pg-pg-panel-meta",children:[n&&e.jsx("span",{className:`pg-pg-status pg-pg-status-${n.status||"idle"}`,children:B(n.status)}),(n==null?void 0:n.elapsed)!=null&&e.jsxs("span",{className:"pg-pg-elapsed",children:[n.elapsed," ms"]}),(n==null?void 0:n.output)&&e.jsx("button",{className:"pg-pg-copy",onClick:W,title:"Copy output",children:J?e.jsx(re,{size:12}):e.jsx(ie,{size:12})})]})]}),e.jsx("pre",{className:"pg-pg-output",children:p?"Running...":(n==null?void 0:n.output)??"Run your code to see output."})]})]})]})]})}export{xe as default};
