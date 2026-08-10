import sys, ast, json, io, re

KNOWN_PTR = {'i','j','k','idx','index','w','p','q','r','lo','hi','mid','left','right','l','cur','pos_i'}
KNOWN_ACC = {'ans','total','cnt','count','res','result','sum','pos','running','best','acc','score','out','val','v','carry','depth','streak','maxlen','ml','curr','cur_sum','s_sum'}

def literal(x):
    try:
        return ast.literal_eval(x)
    except Exception:
        return x.strip().strip('"')

def snap_val(v):
    if isinstance(v,(int,float,bool)) and not isinstance(v,bool):
        return ('num', v)
    if isinstance(v,bool):
        return ('bool', v)
    if isinstance(v,str):
        return ('str', v)
    if isinstance(v,list):
        if all(isinstance(e,(int,float)) and not isinstance(e,bool) for e in v):
            return ('lnum', list(v))
        if all(isinstance(e,str) for e in v):
            return ('lstr', list(v))
        if len(v)>0 and all(isinstance(e,list) for e in v) and all(
                all(isinstance(x,(int,float)) and not isinstance(x,bool) for x in row) for e in v for row in [e]):
            w = len(v[0])
            if w>0 and all(len(row)==w for row in v):
                return ('grid', [list(row) for row in v])
    return None

PREAMBLE = (
    "from typing import List, Optional, Dict, Tuple, Set, Any, Union\n"
    "from collections import Counter, defaultdict, deque, OrderedDict\n"
    "import math, heapq, bisect, functools, itertools, re, string\n"
    "from functools import lru_cache, cache, reduce\n"
    "inf = float('inf')\n"
)

def run(code, method_name, argvals):
    ns = {}
    exec(PREAMBLE + code, ns)
    if 'Solution' not in ns:
        raise RuntimeError('no Solution class')
    inst = ns['Solution']()
    method = getattr(inst, method_name)
    tcode = method.__code__
    snaps = []
    def tracer(frame, event, arg):
        if frame.f_code is tcode and event in ('line','return'):
            d = {}
            for kk,vv in list(frame.f_locals.items()):
                if kk == 'self':
                    continue
                sv = snap_val(vv)
                if sv is not None:
                    d[kk] = sv
            snaps.append(d)
        return tracer if frame.f_code is tcode else None
    old = sys.gettrace()
    sys.settrace(tracer)
    try:
        ret = method(*[literal_copy(a) for a in argvals])
    finally:
        sys.settrace(old)
    return snaps, ret

def literal_copy(a):
    return list(a) if isinstance(a, list) else a

def run_sub(code, method_name, argvals):
    # Like run() but follows sub-frames (comprehensions/genexprs/nested helpers) while inside
    # the method. Used ONLY as a fallback when the method-frame trace is too short (one-liner
    # solutions whose loop lives in a genexpr), so it never affects the primary array path.
    ns = {}
    exec(PREAMBLE + code, ns)
    if 'Solution' not in ns:
        raise RuntimeError('no Solution class')
    inst = ns['Solution']()
    method = getattr(inst, method_name)
    tcode = method.__code__
    snaps = []; state = {'inside': 0, 'stop': False}
    SNAP_CAP = 8000  # bound memory/time: heavy solutions can emit millions of sub-frame lines
    def cap(frame):
        if len(snaps) >= SNAP_CAP:
            state['stop'] = True
            sys.settrace(None)
            return
        d = {}
        for kk, vv in list(frame.f_locals.items()):
            if kk == 'self' or kk.startswith('.'):
                continue
            sv = snap_val(vv)
            if sv is not None:
                d[kk] = sv
        if d:
            snaps.append(d)
    def local_tracer(frame, event, arg):
        if state['stop']:
            return None
        if event == 'line':
            cap(frame)
        elif event == 'return':
            cap(frame)
            if frame.f_code is tcode:
                state['inside'] = max(0, state['inside']-1)
        return local_tracer
    def global_tracer(frame, event, arg):
        if frame.f_code is tcode:
            state['inside'] += 1; return local_tracer
        if state['inside'] > 0:
            return local_tracer
        return None
    old = sys.gettrace(); sys.settrace(global_tracer)
    try:
        ret = method(*[literal_copy(a) for a in argvals])
    finally:
        sys.settrace(old)
    return snaps, ret

def choose_primary(argvals, param_types):
    # index of first list/str param
    best = None
    for i,(v,t) in enumerate(zip(argvals, param_types)):
        if isinstance(v, list):
            return i
        if isinstance(v, str) and best is None:
            best = i
    return best

def tone_for(i):
    return ['accent','sky','mint','violet','pink'][i % 5]

def safe_result(ret):
    if isinstance(ret, bool):
        return ret
    if isinstance(ret, (int, float)):
        return ret
    if isinstance(ret, str):
        return ret[:40]
    try:
        return json.dumps(ret)[:40]
    except Exception:
        return 'result'

CELL_NAME_PAIRS = [('r','c'),('i','j'),('x','y'),('row','col'),('nr','nc'),('cr','cc'),('ci','cj'),('a','b')]

def find_cell(ints, rows, cols):
    # a (row,col) pair of int locals both in grid range. Named pairs only (avoid mislabeling).
    for rn, cn in CELL_NAME_PAIRS:
        if rn in ints and cn in ints and 0 <= ints[rn] < rows and 0 <= ints[cn] < cols:
            return (ints[rn], ints[cn])
    return None

def build_grid_traversal_frames(grid, snaps, ret, method_name):
    rows = len(grid); cols = len(grid[0]) if grid else 0
    if rows < 2 or cols < 2 or rows > 14 or cols > 16:
        return None
    if any(len(row) != cols for row in grid):
        return None
    seq = []
    for s in snaps:
        ints = {k: v for k, (kind, v) in s.items() if kind == 'num' and isinstance(v, int) and not isinstance(v, bool)}
        cell = find_cell(ints, rows, cols)
        if cell and (not seq or seq[-1] != cell):
            seq.append(cell)
    total = len(seq)
    if len(set(seq)) < 8:
        return None
    # Cumulative wavefront: each frame fills MORE of the grid (in real visit order), with the
    # newest batch highlighted. Smooth progressive fill regardless of DFS/scan order — never
    # a jumpy one-cell-at-a-time scatter.
    K = min(13, total)
    frames = [{'grid': [[0]*cols for _ in range(rows)],
               'caption': f"Trace {method_name}: {rows}x{cols} grid. Cells fill in as the algorithm visits them."}]
    prev_upto = 0
    for step in range(1, K + 1):
        upto = max(step, int(round(step/K * total)))
        upto = min(upto, total)
        visited = set(seq[:prev_upto])
        current = set(seq[prev_upto:upto])
        grid_state = [[(2 if (i, j) in current else (1 if (i, j) in visited else 0)) for j in range(cols)] for i in range(rows)]
        frames.append({'grid': grid_state, 'chip': {'label': 'visited', 'value': min(upto, len(set(seq[:upto]))), 'tone': 'sky'},
                       'caption': f"Explored {upto} of {total} cell-visits."})
        prev_upto = upto
    frames.append({'grid': [[1 if (i, j) in set(seq) else 0 for j in range(cols)] for i in range(rows)],
                   'chip': {'label': 'result', 'value': safe_result(ret), 'tone': 'mint'},
                   'caption': f"Result: {safe_result(ret)}."})
    return frames

def build_digit_frames(snaps, ret, digits, method_name, nquery):
    # digits = list of digit CHARS (the primary). Find the loop var that walks them (single-char
    # string values matching the digits, LSB-or-MSB order) and glide a pointer; show numeric
    # accumulators (total/ans/sign) as chips. Correct because the char var genuinely walks digits.
    n = len(digits)
    digitset = set(digits)
    char_key = None
    for s in snaps:
        for k, (kind, val) in s.items():
            if kind == 'str' and len(val) == 1 and val in digitset:
                # candidate; confirm it takes several digit values across the run
                seq = [ss[k][1] for ss in snaps if k in ss and ss[k][0] == 'str' and len(ss[k][1]) == 1]
                trans = [v for i, v in enumerate(seq) if i == 0 or v != seq[i-1]]
                if len(trans) >= max(3, n-2) and all(v in digitset for v in trans):
                    char_key = k; break
        if char_key:
            break
    if not char_key:
        return None
    # accumulators: changing numeric scalars
    scal = {}
    for s in snaps:
        for k, (kind, val) in s.items():
            if kind in ('num', 'bool') and not k.startswith('_'):
                scal.setdefault(k, []).append(val)
    accs = [k for k, vs in scal.items() if len(set(vs)) > 1]
    accs.sort(key=lambda k: (k not in KNOWN_ACC, k)); accs = accs[:2]
    # walk snaps: each char transition advances the digit pointer (in appearance order)
    rows = []; last = object(); syn = -1
    for s in snaps:
        if char_key in s and s[char_key][0] == 'str':
            cv = s[char_key][1]
            if cv != last:
                syn += 1; last = cv
            av = [(k, s[k][1]) for k in accs if k in s and s[k][0] in ('num', 'bool')]
            rows.append((min(syn, n-1), cv, tuple(av)))
    dd = []
    for r in rows:
        if not dd or dd[-1] != r:
            dd.append(r)
    if len(dd) < 4:
        return None
    if len(dd) > 14:
        step = len(dd)/14.0
        dd = [dd[int(i*step)] for i in range(14)]
    frames = [{'array': digits, 'caption': f"Trace {method_name} on the digits of {nquery}."}]
    for idx, cv, av in dd:
        f = {'array': digits, 'pointers': {str(idx): 'digit'},
             'highlights': {**{str(j): 'done' for j in range(idx)}, str(idx): 'current'}}
        if av:
            f['chip'] = [{'label': k, 'value': v, 'tone': tone_for(i)} for i, (k, v) in enumerate(av)]
        f['caption'] = (f"digit {cv}" + ("  " + "  ".join(f"{k}={v}" for k, v in av) if av else ""))
        frames.append(f)
    frames.append({'array': digits, 'highlights': {str(j): 'done' for j in range(n)},
                   'chip': {'label': 'result', 'value': safe_result(ret), 'tone': 'mint'},
                   'caption': f"Result: {safe_result(ret)}."})
    return frames

def build_formula_frames(snaps, ret, param_names, argvals, method_name):
    # Closed-form / few-step problems with no loop: reveal the computed intermediate values
    # one at a time (each a bar with its name+value), then the result. Honest formula unfold.
    param_set = set(param_names or [])
    latest = {}; order = []
    for s in snaps:
        for k, (kind, val) in s.items():
            if kind in ('num',) and not k.startswith('_') and k not in param_set:
                if k not in latest:
                    order.append(k)
                latest[k] = val
    interm = [k for k in order if isinstance(latest[k], (int, float)) and not isinstance(latest[k], bool)]
    interm = interm[:8]
    if len(interm) < 2:
        return None
    if any(abs(latest[k]) > 10**12 for k in interm):
        return None
    values = [str(latest[k]) for k in interm]  # strings -> uniform tiles (not height-skewed bars)
    inbits = []
    for i, a in enumerate(argvals):
        if isinstance(a, (int, float)) and not isinstance(a, bool):
            inbits.append(f"{(param_names[i] if i < len(param_names) else 'p'+str(i))} = {a}")
    frames = [{'array': values, 'caption': f"Compute {method_name}({', '.join(inbits)}). Each bar is an intermediate value building to the answer."}]
    for i, k in enumerate(interm):
        frames.append({'array': values,
                       'pointers': {str(i): k},
                       'highlights': {**{str(j): 'done' for j in range(i)}, str(i): 'current'},
                       'chip': {'label': k, 'value': latest[k], 'tone': tone_for(i)},
                       'caption': f"{k} = {latest[k]}"})
    frames.append({'array': values, 'highlights': {str(j): 'done' for j in range(len(values))},
                   'chip': {'label': 'result', 'value': safe_result(ret), 'tone': 'mint'},
                   'caption': f"Result: {safe_result(ret)}."})
    return frames

def pick_driver(snaps):
    # a loop counter: an int local with many distinct values that mostly increases.
    hist = {}
    for s in snaps:
        for k, (kind, val) in s.items():
            if kind == 'num' and isinstance(val, int) and not isinstance(val, bool) and not k.startswith('_'):
                hist.setdefault(k, []).append(val)
    best = None; bd = 0
    for k, vs in hist.items():
        distinct = len(set(vs))
        if distinct < 8:
            continue
        seq = [v for i, v in enumerate(vs) if i == 0 or v != vs[i-1]]
        if len(seq) < 8:
            continue
        # require a STRICTLY-INCREASING counter with near-uniform step: this is what makes a
        # clean "values tried" ramp. Rejects wrapping vars (hours 0..11,0..) and oscillating
        # nested-loop vars that would render as meaningless bars.
        diffs = [seq[i] - seq[i-1] for i in range(1, len(seq))]
        if not all(d > 0 for d in diffs):
            continue
        if max(diffs) > 3 * min(diffs):
            continue
        if distinct > bd:
            bd = distinct; best = k
    return best

def build_scalar_frames(snaps, ret, driver, method_name):
    scal = {}
    for s in snaps:
        for k, (kind, val) in s.items():
            if kind in ('num', 'bool') and not k.startswith('_'):
                scal.setdefault(k, set()).add(val)
    acc_keys = [k for k, vs in scal.items() if k != driver and len(vs) > 1]
    acc_keys.sort(key=lambda k: (k not in KNOWN_ACC, k)); acc_keys = acc_keys[:3]
    rows = []
    for s in snaps:
        if driver in s and s[driver][0] == 'num':
            dv = s[driver][1]
            av = [(k, s[k][1]) for k in acc_keys if k in s and s[k][0] in ('num', 'bool')]
            rows.append((dv, av))
    dd = []
    for r in rows:
        if not dd or dd[-1][0] != r[0]:
            dd.append(r)
    if len(dd) < 8:
        return None
    if len(dd) > 14:
        step = len(dd)/14.0
        dd = [dd[int(i*step)] for i in range(14)]
    values = [dv for dv, _ in dd]
    frames = [{'array': values, 'caption': f"Trace {method_name}: enumerate {driver}. Each bar is a value tried; watch the accumulator."}]
    for i, (dv, av) in enumerate(dd):
        f = {'array': values, 'pointers': {str(i): driver},
             'highlights': {**{str(j): 'done' for j in range(i)}, str(i): 'current'}}
        if av:
            f['chip'] = [{'label': k, 'value': v, 'tone': tone_for(j)} for j, (k, v) in enumerate(av)]
        f['caption'] = f"{driver} = {dv}" + (("  " + "  ".join(f"{k} = {v}" for k, v in av)) if av else "")
        frames.append(f)
    frames.append({'array': values, 'highlights': {str(j): 'done' for j in range(len(values))},
                   'chip': {'label': 'result', 'value': safe_result(ret), 'tone': 'mint'},
                   'caption': f"Result: {safe_result(ret)}."})
    return frames

def build_frames(snaps, ret, primary_name, primary0, other_params, method_name):
    n = len(primary0) if isinstance(primary0,(list,str)) else 0
    is_str = isinstance(primary0, str)
    prim_list0 = list(primary0) if isinstance(primary0,(list,str)) else []
    # track primary value over snaps (may mutate if it's a list local of same name)
    def prim_at(snap):
        if primary_name in snap:
            kind,val = snap[primary_name]
            if kind in ('lnum','lstr'):
                return list(val)
            if kind == 'str':
                return list(val)
        return None
    # value history per scalar key (in snapshot order)
    scalar_hist = {}
    for s in snaps:
        for k,(kind,val) in s.items():
            if kind in ('num','bool'):
                scalar_hist.setdefault(k, []).append(val)
    changing = {k for k,vs in scalar_hist.items() if len(set(vs))>1 and not k.startswith('_')}

    # (1) explicit integer index: values are ints, all within [0, n-1], and the set covers
    #     a contiguous run starting at 0 (a genuine loop index over the primary).
    def is_explicit_index(k):
        vs = scalar_hist.get(k, [])
        if not vs or not all(isinstance(x,int) for x in vs):
            return False
        uniq = sorted(set(vs))
        if uniq[0] != 0 or uniq[-1] >= n:
            return False
        return uniq == list(range(uniq[0], uniq[-1]+1))
    ptr_key = None; ptr_mode = None
    idx_cands = [k for k in changing if is_explicit_index(k)]
    if idx_cands:
        idx_cands.sort(key=lambda k:(k not in KNOWN_PTR, -len(set(scalar_hist[k]))))
        ptr_key = idx_cands[0]; ptr_mode = 'explicit'

    # (2) for-each element var: it walks the primary (its changing values are all members of
    #     the primary and it transitions ~once per element). A synthetic index then glides
    #     left->right across the array (single-pass), tolerant of duplicate elements.
    elem_key = None
    if ptr_mode is None and n >= 3:
        primset = set(prim_list0)
        for k in changing:
            vals = [s[k][1] for s in snaps if k in s]
            trans = [v for i,v in enumerate(vals) if i==0 or v!=vals[i-1]]
            if len(trans) >= max(2, n-2) and all(v in primset for v in trans):
                elem_key = k; ptr_key = k; ptr_mode = 'element'; break

    # accumulators: changing scalars excluding the chosen index/element var, up to 3
    acc_keys = [k for k in changing if k != ptr_key]
    acc_keys.sort(key=lambda k: (k not in KNOWN_ACC, -len(set(scalar_hist[k]))))
    acc_keys = acc_keys[:3]

    # build raw per-snap state, then dedup by signature
    raw = []
    cur_prim = list(prim_list0)
    for s in snaps:
        p = prim_at(s)
        if p is not None:
            cur_prim = p
        idx = None; elemval = None
        if ptr_mode == 'explicit' and ptr_key in s and s[ptr_key][0]=='num':
            iv = s[ptr_key][1]
            if isinstance(iv,int) and 0 <= iv < max(n,1):
                idx = iv
        elif ptr_mode == 'element' and ptr_key in s:
            elemval = s[ptr_key][1]   # synthetic index assigned after sampling
        accs = []
        for k in acc_keys:
            if k in s and s[k][0] in ('num','bool'):
                accs.append((k, s[k][1]))
        raw.append((list(cur_prim), idx, tuple(accs), elemval))
    # dedup consecutive identical
    dedup = []
    for st in raw:
        if not dedup or dedup[-1] != st:
            dedup.append(st)
    # drop pure-noise states (no index, no acc, primary unchanged from prior kept frame)
    cleaned = []
    for st in dedup:
        prim, idx, accs, elemval = st
        if idx is None and not accs and elemval is None:
            if cleaned and cleaned[-1][0] == prim:
                continue
        cleaned.append(st)
    body = cleaned
    if len(body) > 14:
        step = len(body)/14.0
        body = [body[int(i*step)] for i in range(14)]
    # element mode: glide a synthetic index left->right across the array over the elem frames
    if ptr_mode == 'element':
        elem_pos = [i for i,st in enumerate(body) if st[3] is not None]
        denom = max(1, len(elem_pos)-1)
        for rank,i in enumerate(elem_pos):
            gi = min(n-1, int(round(rank/denom*(n-1))))
            prim,_,accs,elemval = body[i]
            body[i] = (prim, gi, accs, elemval)
    frames = []
    # intro frame
    intro_extra = ''
    if other_params:
        intro_extra = ', ' + ', '.join(f'{nm} = {vv}' for nm,vv in other_params)
    frames.append({
        'array': prim_list0,
        'caption': f"Trace {method_name}: {primary_name} = {json.dumps(primary0) if not is_str else primary0}{intro_extra}."
    })
    ptr_label = ptr_key if ptr_mode == 'explicit' else 'i'
    for (prim, idx, accs, elemval) in body:
        if idx is None and not accs:
            continue
        f = {'array': prim}
        hl = {}
        if idx is not None:
            for d in range(idx):
                hl[str(d)] = 'done'
            hl[str(idx)] = 'current'
            f['pointers'] = {str(idx): ptr_label}
        if hl:
            f['highlights'] = hl
        if accs:
            f['chip'] = [{'label':k,'value':v,'tone':tone_for(i)} for i,(k,v) in enumerate(accs)]
        capbits = []
        if ptr_mode == 'element' and idx is not None and elemval is not None:
            capbits.append(f"{ptr_key} = {json.dumps(elemval)}")
        elif idx is not None:
            capbits.append(f"{ptr_label} = {idx}")
        capbits += [f"{k} = {v}" for k,v in accs]
        f['caption'] = ('  '.join(capbits) if capbits else 'scanning...')
        frames.append(f)
    # result frame
    rf = {'array': prim_list0 if not (frames and 'array' in frames[-1]) else frames[-1]['array']}
    rf['array'] = frames[-1]['array'] if frames else prim_list0
    rf['highlights'] = {str(d):'done' for d in range(len(rf['array']))}
    rf['chip'] = {'label':'result','value': safe_result(ret), 'tone':'mint'}
    rf['caption'] = f"Result: {safe_result(ret)}."
    frames.append(rf)
    return frames

def clamp_cell(x):
    if isinstance(x, float):
        if x == float('inf'): return 9999
        if x == float('-inf'): return -9999
        if x != x: return 0
        return round(x, 3)
    return x

def build_grid_frames(snaps, ret, method_name):
    grid_hist = {}
    for s in snaps:
        for k,(kind,val) in s.items():
            if kind == 'grid':
                grid_hist.setdefault(k, []).append(val)
    if not grid_hist:
        return None
    def distinct(hist):
        c=0; prev=None
        for g in hist:
            if g != prev: c += 1; prev = g
        return c
    best_k = max(grid_hist, key=lambda k: distinct(grid_hist[k]))
    scalar_hist = {}
    for s in snaps:
        for k,(kind,val) in s.items():
            if kind in ('num','bool') and not k.startswith('_'):
                scalar_hist.setdefault(k, []).append(val)
    changing = [k for k,vs in scalar_hist.items() if len(set(vs))>1]
    changing.sort(key=lambda k: (k not in KNOWN_ACC, -len(set(scalar_hist[k]))))
    acc_keys = changing[:3]
    cur = None; raw = []
    for s in snaps:
        if best_k in s and s[best_k][0]=='grid':
            cur = s[best_k][1]
        if cur is None:
            continue
        if len(cur)>14 or (cur and len(cur[0])>16):
            return None
        accs = [(k, s[k][1]) for k in acc_keys if k in s and s[k][0] in ('num','bool')]
        raw.append(([[clamp_cell(x) for x in row] for row in cur], tuple(accs)))
    dd = []
    for st in raw:
        if not dd or dd[-1] != st:
            dd.append(st)
    if len(dd) < 2:
        return None
    if len(dd) > 14:
        step = len(dd)/14.0
        dd = [dd[int(i*step)] for i in range(14)]
    g0 = dd[0][0]
    frames = [{'grid': g0, 'caption': f"Trace {method_name}: {best_k} is {len(g0)}x{len(g0[0])}; watch the cells fill."}]
    for (g, accs) in dd:
        f = {'grid': g}
        if accs:
            f['chip'] = [{'label':k,'value':v,'tone':tone_for(i)} for i,(k,v) in enumerate(accs)]
        f['caption'] = ('  '.join(f"{k} = {v}" for k,v in accs)) or 'updating cells...'
        frames.append(f)
    gl = dd[-1][0]
    frames.append({'grid': gl,
                   'chip': {'label':'result','value': safe_result(ret), 'tone':'mint'},
                   'caption': f"Result: {safe_result(ret)}."})
    changed = any(f['grid'] != frames[1]['grid'] for f in frames if 'grid' in f)
    return frames, changed

TREE_DEFS = (
    "class TreeNode:\n"
    "    def __init__(self, val=0, left=None, right=None):\n"
    "        self.val = val; self.left = left; self.right = right\n"
)

def parse_any(s):
    try:
        return json.loads(s)
    except Exception:
        pass
    try:
        return ast.literal_eval(s)
    except Exception:
        return s

def deser_tree(vals, TN):
    if not vals:
        return None, {}
    import collections
    root = TN(vals[0]); root._vid = 0
    vidmap = {0: root}; nid = 1
    q = collections.deque([root]); i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals):
            lv = vals[i]; i += 1
            if lv is not None:
                node.left = TN(lv); node.left._vid = nid; vidmap[nid] = node.left; nid += 1; q.append(node.left)
        if i < len(vals):
            rv = vals[i]; i += 1
            if rv is not None:
                node.right = TN(rv); node.right._vid = nid; vidmap[nid] = node.right; nid += 1; q.append(node.right)
    return root, vidmap

def run_tree(code, method_name, argvals, tree_pos, TN_holder):
    ns = {}
    exec(PREAMBLE + TREE_DEFS + code, ns)
    TN = ns['TreeNode']; TN_holder.append(TN)
    root, vidmap = deser_tree(argvals[tree_pos], TN)
    args = list(argvals); args[tree_pos] = root
    inst = ns['Solution'](); method = getattr(inst, method_name)
    tcode = method.__code__
    snaps = []; state = {'inside': 0}
    NAMES = ('node','cur','curr','root','p','t','n','r','x','nd')
    def cap(frame):
        loc = frame.f_locals; vid = None
        for nm in NAMES:
            v = loc.get(nm)
            if isinstance(v, TN):
                vid = getattr(v, '_vid', None)
                if vid is not None:
                    break
        if vid is None:
            for v in loc.values():
                if isinstance(v, TN):
                    vid = getattr(v, '_vid', None)
                    if vid is not None:
                        break
        scal = {}
        for k, v in loc.items():
            if isinstance(v, bool):
                scal[k] = v
            elif isinstance(v, (int, float)) and not isinstance(v, bool):
                scal[k] = v
        snaps.append((vid, scal))
    def local_tracer(frame, event, arg):
        if event == 'line':
            cap(frame)
        elif event == 'return':
            cap(frame)
            if frame.f_code is tcode:
                state['inside'] = max(0, state['inside']-1)
        return local_tracer
    def global_tracer(frame, event, arg):
        if frame.f_code is tcode:
            state['inside'] += 1; return local_tracer
        if state['inside'] > 0:
            return local_tracer
        return None
    old = sys.gettrace(); sys.settrace(global_tracer)
    try:
        ret = method(*args)
    finally:
        sys.settrace(old)
    return root, vidmap, snaps, ret

def tree_node_count(root):
    if root is None:
        return 0
    return 1 + tree_node_count(root.left) + tree_node_count(root.right)

def build_tree_frames(root, snaps, ret, method_name):
    n = tree_node_count(root)
    if n < 3 or n > 15:
        return None
    def struct(node, states):
        if node is None:
            return None
        d = {'value': node.val}
        st = states.get(getattr(node, '_vid', -1))
        if st:
            d['state'] = st
        l = struct(node.left, states); r = struct(node.right, states)
        if l is not None:
            d['left'] = l
        if r is not None:
            d['right'] = r
        return d
    # visit order = dedup-consecutive vid stream
    seq = []
    for vid, _ in snaps:
        if vid is not None and (not seq or seq[-1] != vid):
            seq.append(vid)
    if len(seq) < 3:
        return None
    # value lookup by vid
    valById = {}
    def collect(node):
        if node is None:
            return
        valById[getattr(node, '_vid', -1)] = node.val
        collect(node.left); collect(node.right)
    collect(root)
    body = seq
    if len(body) > 13:
        step = len(body)/13.0
        body = [body[int(i*step)] for i in range(13)]
    frames = [{'tree': struct(root, {}), 'traversal': [],
               'caption': f"Trace {method_name}: {n}-node tree. Highlight nodes as the algorithm visits them."}]
    visited = {}; order = []
    for vid in body:
        for k in list(visited):
            if visited[k] == 'current':
                visited[k] = 'visited'
        visited[vid] = 'current'
        if vid in valById and (not order or order[-1] != valById[vid]):
            order.append(valById[vid])
        frames.append({'tree': struct(root, visited), 'traversal': list(order),
                       'caption': f"Visit node {valById.get(vid, '?')}."})
    fin = {v: 'visited' for v in valById}
    frames.append({'tree': struct(root, fin), 'traversal': list(order),
                   'chip': {'label': 'result', 'value': safe_result(ret), 'tone': 'mint'},
                   'caption': "Traversal complete."})
    return frames

LIST_DEFS = (
    "class ListNode:\n"
    "    def __init__(self, val=0, next=None):\n"
    "        self.val = val; self.next = next\n"
)
PTR_NAMES = ('slow','fast','cur','curr','prev','pre','node','p','q','tail','dummy','ptr','l1','l2','a','b','head','r')

def deser_list(vals, LN):
    if not vals:
        return None, {}
    head = LN(vals[0]); head._vid = 0
    vidval = {0: vals[0]}; cur = head
    for i in range(1, len(vals)):
        cur.next = LN(vals[i]); cur.next._vid = i; vidval[i] = vals[i]; cur = cur.next
    return head, vidval

def _deser_plain(vals, LN):
    if not vals:
        return None
    head = LN(vals[0]); cur = head
    for i in range(1, len(vals)):
        cur.next = LN(vals[i]); cur = cur.next
    return head

def run_list(code, method_name, argvals, list_positions):
    ns = {}
    exec(PREAMBLE + LIST_DEFS + code, ns)
    LN = ns['ListNode']
    primary = list_positions[0]
    head, vidval = deser_list(argvals[primary], LN)
    args = list(argvals); args[primary] = head
    for pos in list_positions[1:]:
        if isinstance(argvals[pos], list):
            args[pos] = _deser_plain(argvals[pos], LN)  # built but untagged -> ignored in cap
    inst = ns['Solution'](); method = getattr(inst, method_name)
    tcode = method.__code__
    snaps = []; state = {'inside': 0}
    def cap(frame):
        loc = frame.f_locals; ptrs = {}
        for nm, v in loc.items():
            if nm == 'self' or nm.startswith('_'):
                continue
            if isinstance(v, LN):
                vid = getattr(v, '_vid', None)
                if vid is not None:
                    ptrs.setdefault(vid, [])
                    if nm not in ptrs[vid]:
                        ptrs[vid].append(nm)
        scal = {}
        for k, v in loc.items():
            if isinstance(v, bool):
                scal[k] = v
            elif isinstance(v, (int, float)) and not isinstance(v, bool):
                scal[k] = v
        snaps.append((ptrs, scal))
    def local_tracer(frame, event, arg):
        if event == 'line':
            cap(frame)
        elif event == 'return':
            cap(frame)
            if frame.f_code is tcode:
                state['inside'] = max(0, state['inside']-1)
        return local_tracer
    def global_tracer(frame, event, arg):
        if frame.f_code is tcode:
            state['inside'] += 1; return local_tracer
        if state['inside'] > 0:
            return local_tracer
        return None
    old = sys.gettrace(); sys.settrace(global_tracer)
    try:
        ret = method(*args)
    finally:
        sys.settrace(old)
    return vidval, snaps, ret

def build_list_frames(vidval, snaps, ret, method_name):
    n = len(vidval)
    if n < 3 or n > 16:
        return None
    values = [vidval[i] for i in range(n)]
    # keep snaps where at least one named pointer is present; dedup consecutive by pointer layout
    raw = []
    for ptrs, scal in snaps:
        named = {vid: names for vid, names in ptrs.items() if names}
        if not named:
            continue
        raw.append((named, scal))
    dd = []
    for st in raw:
        keylayout = tuple(sorted((vid, tuple(names)) for vid, names in st[0].items()))
        if not dd or dd[-1][0] != keylayout:
            dd.append((keylayout, st))
    body = [st for _, st in dd]
    if len(body) < 3:
        return None
    if len(body) > 13:
        step = len(body)/13.0
        body = [body[int(i*step)] for i in range(13)]
    # accumulator scalars that change
    allkeys = {}
    for _, scal in body:
        for k, v in scal.items():
            allkeys.setdefault(k, set()).add(v)
    acc_keys = [k for k, vs in allkeys.items() if len(vs) > 1 and not k.startswith('_')]
    acc_keys.sort(key=lambda k: (k not in KNOWN_ACC, k))
    acc_keys = acc_keys[:2]
    frames = [{'array': values, 'caption': f"Trace {method_name}: {n}-node list. Watch the pointers move."}]
    for named, scal in body:
        pointers = {}; hl = {}
        for vid, names in named.items():
            pointers[str(vid)] = names if len(names) > 1 else names[0]
            hl[str(vid)] = 'current'
        f = {'array': values, 'pointers': pointers, 'highlights': hl}
        accs = [(k, scal[k]) for k in acc_keys if k in scal]
        if accs:
            f['chip'] = [{'label': k, 'value': v, 'tone': tone_for(i)} for i, (k, v) in enumerate(accs)]
        cap = ', '.join(f"{'/'.join(names)}@{vid}" for vid, names in sorted(named.items()))
        f['caption'] = f"Pointers: {cap}." if cap else "advancing..."
        frames.append(f)
    rf = {'array': values, 'highlights': {str(i): 'done' for i in range(n)},
          'chip': {'label': 'result', 'value': safe_result(ret), 'tone': 'mint'},
          'caption': "Traversal / rewrite complete."}
    frames.append(rf)
    return frames

def detect_intervals(argvals, param_types):
    for i, (v, t) in enumerate(zip(argvals, param_types)):
        if not ('List[List' in (t or '') and isinstance(v, list) and 3 <= len(v) <= 12):
            continue
        # length-2 rows are [start,end]; length-3 rows (e.g. car-pooling [num,from,to]) use the
        # last two columns as the span.
        if all(isinstance(r, list) and len(r) == 2 and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in r) for r in v):
            spans = [[r[0], r[1]] for r in v]
        elif all(isinstance(r, list) and len(r) == 3 and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in r) for r in v):
            spans = [[r[1], r[2]] for r in v]
        else:
            continue
        if sum(1 for s, e in spans if s <= e) >= len(spans) * 0.7:
            mx = max(e for s, e in spans); mn = min(s for s, e in spans)
            if mx > mn and (mx >= len(v) or mn < 0 or (mx - mn) >= len(v)):
                return i, spans
    return None

def build_interval_frames(intervals, snaps, ret, method_name):
    n = len(intervals)
    mn = min(s for s, e in intervals); mx = max(e for s, e in intervals)
    span = mx - mn
    if span <= 0 or n < 3:
        return None
    COLS = min(22, max(10, span + 1))
    def col(x):
        return min(COLS - 1, max(0, int(round((x - mn) / span * (COLS - 1)))))
    order = sorted(range(n), key=lambda k: (intervals[k][0], intervals[k][1]))
    disp = [intervals[k] for k in order]
    # accumulator: a changing scalar (rooms in use, merged count, ans)
    scal = {}
    for s in snaps:
        for k, (kind, val) in s.items():
            if kind in ('num', 'bool') and not k.startswith('_'):
                scal.setdefault(k, []).append(val)
    acc = None
    for k, vs in scal.items():
        if len(set(vs)) > 1:
            acc = k; break
    def rowcells(iv, state):
        s, e = iv; cs, ce = col(s), col(e)
        return [state if cs <= j <= ce else 0 for j in range(COLS)]
    frames = [{'grid': [rowcells(iv, 1) for iv in disp],
               'caption': f"Trace {method_name}: {n} intervals on a timeline [{mn}..{mx}], sorted by start."}]
    accseq = scal.get(acc, [])
    for idx in range(n):
        grid = [rowcells(iv, (2 if r == idx else 1)) for r, iv in enumerate(disp)]
        f = {'grid': grid, 'caption': f"Process interval [{disp[idx][0]}, {disp[idx][1]}]."}
        if acc and accseq:
            f['chip'] = {'label': acc, 'value': accseq[min(idx, len(accseq) - 1)], 'tone': 'accent'}
        frames.append(f)
    frames.append({'grid': [rowcells(iv, 1) for iv in disp],
                   'chip': {'label': 'result', 'value': safe_result(ret), 'tone': 'mint'},
                   'caption': f"Result: {safe_result(ret)}."})
    return frames

def detect_graph(argvals, param_types, param_names):
    # (a) edge-list: rows are [a,b] pairs.
    edge_i = None; edges = None
    for i,(v,t) in enumerate(zip(argvals, param_types)):
        if isinstance(v, list) and len(v)>0 and all(isinstance(e,list) and len(e)==2
                and all(isinstance(x,int) for x in e) for e in v):
            edge_i = i; edges = [[e[0], e[1]] for e in v]; break
    if edges is not None:
        maxnode = max((max(e[0],e[1]) for e in edges), default=-1)
        n = maxnode + 1
        for i,(v,t) in enumerate(zip(argvals, param_types)):
            if i!=edge_i and isinstance(v,int) and not isinstance(v,bool) and v>maxnode and v<=64:
                n = v; break
        if 2 <= n <= 14 and len(edges) <= 22:
            return n, edges
    # (b) adjacency list: graph[i] = neighbours of node i (values all in [0, len(graph))).
    for i,(v,t) in enumerate(zip(argvals, param_types)):
        if isinstance(v, list) and 2 <= len(v) <= 14 and all(isinstance(row, list) for row in v) \
                and all(isinstance(x,int) and 0 <= x < len(v) for row in v for x in row):
            adj_edges = [[u, w] for u, nbrs in enumerate(v) for w in nbrs]
            if 1 <= len(adj_edges) <= 26:
                return len(v), adj_edges
    return None

def build_graph_frames(snaps, ret, n, edges, method_name):
    # node-visit order: prefer a growing list local of node ids (topo/traversal order),
    # else the return value if it's such a list, else an int local ranging over nodes.
    seq = None
    best_len = 0
    for key in set().union(*[s.keys() for s in snaps]) if snaps else []:
        hist = [s[key][1] for s in snaps if key in s and s[key][0]=='lnum']
        if not hist: continue
        final = hist[-1]
        if 2 <= len(final) <= n and all(isinstance(x,int) and 0<=x<n for x in final):
            grows = [h for h in hist if all(isinstance(x,int) and 0<=x<n for x in h)]
            if len(final) > best_len:
                best_len = len(final); seq = final
    if seq is None and isinstance(ret, list) and 2 <= len(ret) <= n and all(isinstance(x,int) and 0<=x<n for x in ret):
        seq = ret
    if seq is None:
        # int local ranging over nodes
        for key in set().union(*[s.keys() for s in snaps]) if snaps else []:
            vals = [s[key][1] for s in snaps if key in s and s[key][0]=='num']
            trans = [v for i,v in enumerate(vals) if (i==0 or v!=vals[i-1]) and isinstance(v,int) and 0<=v<n]
            if len(trans) >= max(3, n-2):
                seq = trans[:n]; break
    if not seq or len(seq) < 3:
        return None
    adj = {}
    for a,b in edges:
        adj.setdefault(a, set()).add(b)
        adj.setdefault(b, set()).add(a)
    node_objs = lambda state: [{'id': i, **({'state': state.get(i)} if state.get(i) else {})} for i in range(n)]
    frames = [{'nodes': node_objs({}), 'edges': edges,
               'caption': f"Trace {method_name}: {n} nodes, {len(edges)} edges. Watch nodes light up as they are processed."}]
    state = {}
    for pos, node in enumerate(seq):
        # arrive: node current, un-visited neighbors become frontier
        state = {k:('visited' if v in ('current','visited') else v) for k,v in state.items()}
        state[node] = 'current'
        for nb in adj.get(node, ()):
            if state.get(nb) not in ('visited','current'):
                state[nb] = 'frontier'
        frames.append({'nodes': node_objs(state), 'edges': edges,
                       'chip': {'label':'processing','value':node,'tone':'sky'},
                       'caption': f"Reach node {node} — highlight its neighbours."})
        # settle: node done
        state = dict(state); state[node] = 'visited'
        frames.append({'nodes': node_objs(state), 'edges': edges,
                       'chip': {'label':'done','value':pos+1,'tone':'mint'},
                       'caption': f"Node {node} processed  ({pos+1}/{len(seq)})."})
    fin = {i:'visited' for i in range(n)}
    frames.append({'nodes': node_objs(fin), 'edges': edges,
                   'chip': {'label':'result','value': safe_result(ret), 'tone':'mint'},
                   'caption': f"Result: {safe_result(ret)}."})
    return frames

def main():
    payload = json.load(sys.stdin)
    code = payload['code']
    method = payload['method_name']
    inputs = payload['inputs']
    param_types = payload.get('param_types', [])
    param_names = payload.get('param_names', [])
    # (tree path) Optional[TreeNode] input -> deserialize + animate the traversal (node states).
    tree_pos = next((i for i,t in enumerate(param_types) if 'TreeNode' in (t or '')), None)
    if tree_pos is not None:
        targs = [parse_any(x) for x in inputs]
        if tree_pos < len(targs) and isinstance(targs[tree_pos], list):
            try:
                t_root, _vm, t_snaps, t_ret = run_tree(code, method, targs, tree_pos, [])
                tf = build_tree_frames(t_root, t_snaps, t_ret, method)
            except Exception as e:
                tf = None
            if tf and len(tf) >= 5:
                print(json.dumps({'ok':True,'frames':tf,'renderer':'tree','nframes':len(tf),'motion':True})); return
        print(json.dumps({'ok':False,'error':'tree-trace-failed'})); return
    # (linked-list path) ListNode input -> value array with gliding slow/fast/cur pointers.
    list_positions = [i for i,t in enumerate(param_types) if 'ListNode' in (t or '')]
    if list_positions:
        largs = [parse_any(x) for x in inputs]
        if isinstance(largs[list_positions[0]], list):
            try:
                l_vidval, l_snaps, l_ret = run_list(code, method, largs, list_positions)
                lf = build_list_frames(l_vidval, l_snaps, l_ret, method)
            except Exception:
                lf = None
            if lf and len(lf) >= 5:
                print(json.dumps({'ok':True,'frames':lf,'renderer':'array','nframes':len(lf),'motion':True})); return
        print(json.dumps({'ok':False,'error':'list-trace-failed'})); return
    argvals = [literal(x) for x in inputs]
    snaps, ret = run(code, method, argvals)
    # (interval path) List[List] of [start,end] pairs -> render on a timeline grid + sweep.
    # Before the grid path (which would draw an ugly 2-column pairs grid).
    iv = detect_intervals(argvals, param_types)
    if iv:
        ivf = build_interval_frames(iv[1], snaps, ret, method)
        if ivf and len(ivf) >= 5:
            print(json.dumps({'ok':True,'frames':ivf,'renderer':'grid','nframes':len(ivf),'motion':True})); return
    # (grid path) if a 2D structure mutates over the run, animate the wavefront/DP-fill.
    gres = build_grid_frames(snaps, ret, method)
    if gres:
        gframes, gchanged = gres
        if len(gframes) >= 5 and gchanged:
            print(json.dumps({'ok':True,'frames':gframes,'renderer':'grid','nframes':len(gframes),'motion':True})); return
    # (grid-traversal path) grid input whose DFS/BFS visits cells (tracked by named (r,c)
    # coord locals via sub-frames) -> animate a 0/1/2 state-grid wavefront.
    grid_pos = next((i for i,t in enumerate(param_types) if 'List[List' in (t or '')), None)
    if grid_pos is not None:
        gridarg = argvals[grid_pos] if grid_pos < len(argvals) else None
        if isinstance(gridarg, list) and gridarg and isinstance(gridarg[0], list) and all(isinstance(x,(int,float)) and not isinstance(x,bool) for row in gridarg for x in row):
            try:
                tsnaps, tret = run_sub(code, method, argvals)
                gtf = build_grid_traversal_frames(gridarg, tsnaps, tret, method)
                if gtf and len(gtf) >= 5:
                    print(json.dumps({'ok':True,'frames':gtf,'renderer':'grid','nframes':len(gtf),'motion':True})); return
            except Exception:
                pass
    # (graph path) edge-list or adjacency-list inputs -> animate node processing order
    gr = detect_graph(argvals, param_types, param_names)
    if gr:
        n_g, edges_g = gr
        grframes = build_graph_frames(snaps, ret, n_g, edges_g, method)
        if not (grframes and len(grframes) >= 5):
            try:  # nested DFS/BFS: the visit order lives in sub-frames
                gsub, gret = run_sub(code, method, argvals)
                grframes = build_graph_frames(gsub, gret, n_g, edges_g, method)
            except Exception:
                pass
        if grframes and len(grframes) >= 5:
            print(json.dumps({'ok':True,'frames':grframes,'renderer':'graph','nframes':len(grframes),'motion':True})); return
    # (array path)
    pi = choose_primary(argvals, param_types)
    if pi is None:
        # (scalar-loop path) no array input, but a loop counter enumerates values -> render
        # the tried-values as bars with the accumulator gliding alongside.
        for src_snaps in (snaps, None):
            ss = src_snaps
            if ss is None:
                try:
                    ss, ret = run_sub(code, method, argvals)
                except Exception:
                    break
            drv = pick_driver(ss)
            if drv:
                sf = build_scalar_frames(ss, ret, drv, method)
                if sf and len(sf) >= 5:
                    print(json.dumps({'ok':True,'frames':sf,'renderer':'array','nframes':len(sf),'motion':True})); return
        # (digit path) int problem that processes the digits of n. Synthesize the digit array
        # as the primary and sub-frame-trace so the real per-digit loop var + accumulator show
        # (correct, unlike the old digit path: the element var genuinely walks these digits).
        if re.search(r'str\(\s*\w+\s*\)|% *10|// *10|digit', code):
            for ai, a in enumerate(argvals):
                if isinstance(a, int) and not isinstance(a, bool):
                    cand = list(str(abs(a)))
                    if len(cand) >= 4:
                        nm = (param_names[ai] if ai < len(param_names) else 'n') + ' digits'
                        try:
                            dsnaps, dret = run_sub(code, method, argvals)
                        except Exception:
                            break
                        df = build_digit_frames(dsnaps, dret, cand, method, a)
                        if df and len(df) >= 8:
                            print(json.dumps({'ok':True,'frames':df,'renderer':'array','nframes':len(df),'motion':True})); return
                    break
        # (formula path) no loop, but computed intermediates -> reveal the computation. Method
        # frame first, then sub-frames (some formulas call helpers). >=5 frames (short is honest).
        for src in (snaps, 'sub'):
            fs = snaps
            fret = ret
            if src == 'sub':
                try:
                    fs, fret = run_sub(code, method, argvals)
                except Exception:
                    break
            ff = build_formula_frames(fs, fret, param_names, argvals, method)
            if ff and len(ff) >= 5:
                print(json.dumps({'ok':True,'frames':ff,'renderer':'array','nframes':len(ff),'motion':True})); return
        print(json.dumps({'ok':False,'error':'no list/str param'})); return
    primary0 = argvals[pi]
    if not isinstance(primary0,(list,str)) or len(primary0)==0:
        print(json.dumps({'ok':False,'error':'primary empty/non-seq'})); return
    if isinstance(primary0, list) and any(isinstance(e,(list,dict,tuple)) for e in primary0):
        print(json.dumps({'ok':False,'error':'2D/nested primary (needs grid/graph renderer)'})); return
    others = [(param_names[i] if i<len(param_names) else f'p{i}', argvals[i]) for i in range(len(argvals)) if i!=pi and isinstance(argvals[i],(int,float,str)) and not isinstance(argvals[i],bool)]
    others = [(nm,vv) for nm,vv in others if not isinstance(vv,str) or len(vv)<=12]
    pname = param_names[pi] if pi<len(param_names) else 'arr'
    frames = build_frames(snaps, ret, pname, primary0, others, method)
    def gate_ok(fr):
        if len(fr) < 5:
            return False
        a0 = fr[0].get('array') if fr else None
        return any('pointers' in f for f in fr) or any(f.get('array') != a0 for f in fr if 'array' in f)
    # Fallback for one-liner / comprehension solutions whose loop lives in a genexpr the
    # method-frame trace can't see: retry following sub-frames. Only used when the primary
    # trace fell short, so it can never regress a good method-frame trace.
    if not gate_ok(frames):
        try:
            sub_snaps, sub_ret = run_sub(code, method, argvals)
            sub_frames = build_frames(sub_snaps, sub_ret, pname, primary0, others, method)
            if gate_ok(sub_frames):
                frames = sub_frames
        except Exception:
            pass
    if not gate_ok(frames):
        if len(frames) < 5:
            print(json.dumps({'ok':False,'error':f'too few frames ({len(frames)})'})); return
        print(json.dumps({'ok':False,'error':'weak-trace (no motion)'})); return
    has_ptr = any('pointers' in f for f in frames)
    print(json.dumps({'ok':True,'frames':frames,'renderer':'array','nframes':len(frames),'motion':True}))

if __name__ == '__main__':
    main()
