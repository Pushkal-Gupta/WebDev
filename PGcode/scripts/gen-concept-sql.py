#!/usr/bin/env python3
# Mirrors scripts/import-concepts.js parsing to emit idempotent SQL upserts
# for the 11 new concept files (node is unavailable in this environment).
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, 'content', 'concepts')

FILES = [
    'browser-rendering-pipeline.md', 'browser-event-loop.md', 'debounce-vs-throttle.md',
    'web-vitals-lcp-cls-inp.md', 'deadlock-coffman-conditions.md', 'mutex-semaphore-condvar.md',
    'build-graph-vite-vs-webpack.md', 'rsc-vs-ssr-vs-csr.md', 'react-fiber-reconciler.md',
    'cpu-scheduling-algorithms.md', 'virtual-memory-page-replacement.md',
]

def unquote(s):
    if s and len(s) >= 2 and ((s[0] == '"' and s[-1] == '"') or (s[0] == "'" and s[-1] == "'")):
        return s[1:-1]
    return s

def parse_frontmatter(raw):
    lines = raw.split('\n')
    out = {}
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1; continue
        m = re.match(r'^([a-zA-Z0-9_]+):\s*(.*)$', line)
        if not m:
            i += 1; continue
        key, val = m.group(1), m.group(2).strip()
        if val == '' and i + 1 < len(lines) and re.match(r'^\s+- ', lines[i + 1]):
            items = []
            i += 1
            while i < len(lines) and re.match(r'^\s+- ', lines[i]):
                item_line = re.sub(r'^\s+- ', '', lines[i]).strip()
                if ':' in item_line:
                    obj = {}
                    om = re.match(r'^([a-zA-Z0-9_]+):\s*(.*)$', item_line)
                    if om:
                        obj[om.group(1)] = unquote(om.group(2))
                    i += 1
                    while i < len(lines) and re.match(r'^\s{4}', lines[i]) and not re.match(r'^\s+- ', lines[i]):
                        sm = re.match(r'^([a-zA-Z0-9_]+):\s*(.*)$', lines[i].strip())
                        if sm:
                            obj[sm.group(1)] = unquote(sm.group(2))
                        i += 1
                    items.append(obj)
                else:
                    items.append(unquote(item_line))
                    i += 1
            out[key] = items
            continue
        if val.startswith('[') and val.endswith(']'):
            inner = val[1:-1].strip()
            out[key] = [unquote(s.strip()) for s in inner.split(',')] if inner else []
        elif val in ('true', 'false'):
            out[key] = val == 'true'
        elif re.match(r'^-?\d+(\.\d+)?$', val):
            out[key] = float(val) if '.' in val else int(val)
        else:
            out[key] = unquote(val)
        i += 1
    return out

def parse_file(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n([\s\S]+?)\n---\n([\s\S]*)$', raw)
    if not m:
        raise ValueError('No frontmatter in ' + path)
    meta = parse_frontmatter(m.group(1))
    body_raw = m.group(2)

    sections, code_sections = {}, {}
    body_sentinel = body_raw + '\n## __END__\n'
    for sm in re.finditer(r'^##\s+([\w.]+)\s*\n([\s\S]*?)(?=^##\s+)', body_sentinel, re.M):
        name, content = sm.group(1), sm.group(2)
        if name == '__END__':
            continue
        cleaned = content.strip()
        if name.startswith('code.'):
            lang = name[len('code.'):]
            cm = re.search(r'```[a-zA-Z]*\n([\s\S]*?)```', cleaned)
            code_sections[lang] = cm.group(1).rstrip() if cm else cleaned
        elif name == 'complexity':
            obj = {}
            for ln in cleaned.split('\n'):
                km = re.match(r'^([a-zA-Z]+):\s*(.*)$', ln)
                if km:
                    obj[km.group(1)] = km.group(2).strip()
            sections['complexity'] = obj
        elif cleaned.startswith('- '):
            sections[name] = [l[2:].strip() for l in cleaned.split('\n') if l.startswith('- ')]
        else:
            sections[name] = cleaned

    if meta.get('estimatedReadMinutes') is not None:
        sections['estimatedReadMinutes'] = meta['estimatedReadMinutes']

    for req in ('slug', 'module', 'title'):
        if not meta.get(req):
            raise ValueError('missing ' + req)

    return {
        'slug': meta['slug'],
        'module_slug': meta['module'],
        'title': meta['title'],
        'subtitle': meta.get('subtitle'),
        'difficulty': meta.get('difficulty'),
        'position': meta.get('position', 0),
        'body': sections,
        'code': code_sections,
        'metadata': {
            'references': meta.get('references', []),
            'prereqs': meta.get('prereqs', []),
            'relatedProblems': meta.get('relatedProblems', []),
        },
        'status': meta.get('status', 'draft'),
    }

def sq(s):
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def jq(obj):
    return sq(json.dumps(obj, ensure_ascii=True)) + '::jsonb'

stmts = []
errors = []
for f in FILES:
    try:
        c = parse_file(os.path.join(CONTENT, f))
    except Exception as e:
        errors.append((f, str(e)))
        continue
    stmts.append(
        'INSERT INTO "PGcode_concepts" (slug, module_slug, title, subtitle, difficulty, position, body, code, metadata, status)\n'
        'VALUES ({slug}, {mod}, {title}, {sub}, {diff}, {pos}, {body}, {code}, {meta}, {status})\n'
        'ON CONFLICT (slug) DO UPDATE SET\n'
        '  module_slug = EXCLUDED.module_slug, title = EXCLUDED.title, subtitle = EXCLUDED.subtitle,\n'
        '  difficulty = EXCLUDED.difficulty, position = EXCLUDED.position, body = EXCLUDED.body,\n'
        '  code = EXCLUDED.code, metadata = EXCLUDED.metadata, status = EXCLUDED.status,\n'
        '  updated_at = now();'.format(
            slug=sq(c['slug']), mod=sq(c['module_slug']), title=sq(c['title']), sub=sq(c['subtitle']),
            diff=sq(c['difficulty']), pos=int(c['position']), body=jq(c['body']), code=jq(c['code']),
            meta=jq(c['metadata']), status=sq(c['status'])))
    print('parsed %-40s body_keys=%d code_langs=%s' % (f, len(c['body']), ','.join(sorted(c['code'].keys()))))

if errors:
    for f, msg in errors:
        print('FAILED %s: %s' % (f, msg), file=sys.stderr)
    sys.exit(1)

out_path = os.path.join(ROOT, 'scripts', 'apply-concept-import.sql')
with open(out_path, 'w', encoding='utf-8') as fh:
    fh.write('\n\n'.join(stmts) + '\n')
print('wrote %s (%d statements)' % (out_path, len(stmts)))
