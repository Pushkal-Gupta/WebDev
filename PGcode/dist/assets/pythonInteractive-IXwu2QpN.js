import{_ as g}from"./index-D044ZBuD.js";import"./vendor-query-FJdQ8OJm.js";import"./vendor-react-firagBrd.js";import"./vendor-supabase-ClVc2H6D.js";import"./vendor-icons-D2xH09tr.js";const m="0.29.4",d=`https://cdn.jsdelivr.net/pyodide/v${m}/full/`;let c=null;function h(){return c||(c=(async()=>await(await g(()=>import(`${d}pyodide.mjs`),[],import.meta.url)).loadPyodide({indexURL:d}))().catch(_=>{throw c=null,_}),c)}async function E(_,{onStdout:i,onStdin:n,onError:a,onDone:p}={}){const e=await h(),o=t=>{try{i==null||i(String(t))}catch{}},l=t=>{try{a==null||a(String(t))}catch{}},u=async t=>{t&&o(String(t));const s=await Promise.resolve(n==null?void 0:n());return s==null?"":String(s)};e.setStdout({write:t=>{try{const s=new TextDecoder().decode(t);o(s)}catch{}return t.length},isatty:!1}),e.setStderr({write:t=>{try{const s=new TextDecoder().decode(t);l(s)}catch{}return t.length},isatty:!1}),e.globals.set("__pg_input",u),e.globals.set("__pg_user_code",_);const y=`
import builtins, sys, traceback
from pyodide.ffi import run_sync

def __pg_blocking_input(prompt=""):
    # Pyodide's batched stdout only flushes on newline. Force a flush so any
    # pending print(..., end="") (the classic "Enter input : " case) reaches
    # the UI before we block on the user.
    try:
        sys.stdout.flush()
    except Exception:
        pass
    return run_sync(__pg_input(prompt))

builtins.input = __pg_blocking_input

__pg_exit_code = 0
try:
    exec(compile(__pg_user_code, "<playground>", "exec"),
         {"__name__": "__main__", "input": __pg_blocking_input})
except SystemExit as __pg_e:
    __pg_exit_code = int(getattr(__pg_e, "code", 0) or 0)
except BaseException:
    sys.stderr.write(traceback.format_exc())
    __pg_exit_code = 1
finally:
    try:
        sys.stdout.flush()
    except Exception:
        pass
`;let r=0;try{await e.runPythonAsync(y);const t=e.globals.get("__pg_exit_code");r=typeof t=="number"?t:0}catch(t){l(t!=null&&t.message?`${t.message}
`:`${String(t)}
`),r=1}finally{try{e.globals.delete("__pg_input")}catch{}try{e.globals.delete("__pg_user_code")}catch{}try{e.globals.delete("__pg_exit_code")}catch{}}return p==null||p(r),r}export{h as loadPyodideOnce,E as runInteractive};
