import sys, ast, json

PREAMBLE = (
    "from typing import List, Optional, Dict, Tuple, Set, Any, Union\n"
    "from collections import Counter, defaultdict, deque, OrderedDict\n"
    "import math, heapq, bisect, functools, itertools, re, string\n"
    "from functools import lru_cache, cache, reduce\n"
    "inf = float('inf')\n"
)

STRUCTURAL = ('TreeNode', 'ListNode', 'Node')

def parse_input(s):
    try:
        return ast.literal_eval(s)
    except Exception:
        pass
    try:
        return json.loads(s)
    except Exception:
        return s.strip().strip('"')

def parse_expected(s):
    if not isinstance(s, str):
        return s
    for fn in (json.loads, ast.literal_eval):
        try:
            return fn(s)
        except Exception:
            continue
    return s.strip()

def deep_eq(a, b):
    ba, bb = isinstance(a, bool), isinstance(b, bool)
    if ba or bb:
        return bool(a) == bool(b) if (ba and bb) else (a == b)
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if isinstance(a, float) or isinstance(b, float):
            fa, fb = float(a), float(b)
            if fa != fa or fb != fb:  # NaN
                return fa != fa and fb != fb
            if fa in (float('inf'), float('-inf')) or fb in (float('inf'), float('-inf')):
                return fa == fb
            return abs(fa - fb) <= 1e-5 * max(1.0, abs(fa), abs(fb))
        return a == b
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        if len(a) != len(b):
            return False
        return all(deep_eq(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        if set(a) != set(b):
            return False
        return all(deep_eq(a[k], b[k]) for k in a)
    return a == b

def run_case(code, method_name, param_types, inputs, expected, return_type=''):
    if any(any(t in (pt or '') for t in STRUCTURAL) for pt in param_types):
        return ('skip', 'structural-input')
    if any(t in (return_type or '') for t in STRUCTURAL):
        return ('skip', 'structural-output')
    args = [parse_input(x) for x in inputs]
    rt = (return_type or '').strip()
    # string answers: compare as raw strings (don't let json coerce "0" -> 0)
    if rt in ('str', 'string'):
        exp = expected if isinstance(expected, str) else str(expected)
    else:
        exp = parse_expected(expected)
    ns = {}
    try:
        exec(PREAMBLE + code, ns)
    except Exception as e:
        return ('error', f'compile: {type(e).__name__}: {e}'[:120])
    if 'Solution' not in ns:
        return ('error', 'no Solution class')
    try:
        inst = ns['Solution']()
        method = getattr(inst, method_name)
    except Exception as e:
        return ('error', f'no method {method_name}')
    call_args = [list(a) if isinstance(a, list) else a for a in args]
    try:
        result = method(*call_args)
    except Exception as e:
        return ('error', f'run: {type(e).__name__}: {e}'[:120])
    # in-place convention: a List-returning method that returns None but mutated the first
    # list arg. Only when the answer type is a list — an int/str method legitimately returning
    # None must stay None (else we corrupt it into the input array).
    if result is None and rt.startswith('List'):
        for a in call_args:
            if isinstance(a, list):
                result = a
                break
    if rt in ('str', 'string'):
        if str(result) == str(exp):
            return ('pass', None)
        return ('fail', f'got {json.dumps(str(result))[:60]} want {json.dumps(str(exp))[:60]}')
    if deep_eq(result, exp):
        return ('pass', None)
    # order-insensitive fallback for list answers (many problems accept any order)
    try:
        if isinstance(result, list) and isinstance(exp, list) and \
           sorted(map(repr, result)) == sorted(map(repr, exp)):
            return ('pass_unordered', None)
    except Exception:
        pass
    return ('fail', f'got {json.dumps(result)[:60]} want {json.dumps(exp)[:60]}')

def main():
    p = json.load(sys.stdin)
    code = p['code']; method = p['method_name']; ptypes = p.get('param_types', [])
    rtype = p.get('return_type', '')
    cases = p['cases']
    res = {'pass': 0, 'pass_unordered': 0, 'fail': 0, 'error': 0, 'skip': 0, 'fails': []}
    for i, c in enumerate(cases):
        try:
            status, detail = run_case(code, method, ptypes, c['inputs'], c['expected'], rtype)
        except Exception as e:
            status, detail = 'error', f'harness: {type(e).__name__}'
        res[status] = res.get(status, 0) + 1
        if status in ('fail', 'error') and len(res['fails']) < 5:
            res['fails'].append({'i': i, 'status': status, 'detail': detail})
        if status == 'skip':
            break  # structural: whole problem is skip
    print(json.dumps(res))

if __name__ == '__main__':
    main()
