const KEYWORDS = {
  python: new Set([
    'False','None','True','and','as','assert','async','await','break','class','continue',
    'def','del','elif','else','except','finally','for','from','global','if','import','in',
    'is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield',
    'self','cls','print','range','len','enumerate','zip','map','filter','sorted','reversed',
    'list','dict','set','tuple','str','int','float','bool',
  ]),
  javascript: new Set([
    'await','async','break','case','catch','class','const','continue','debugger','default',
    'delete','do','else','enum','export','extends','false','finally','for','function','if',
    'import','in','instanceof','let','new','null','of','return','super','switch','this','throw',
    'true','try','typeof','undefined','var','void','while','with','yield','static','from','as',
    'console','document','window','Map','Set','Array','Object','String','Number','Boolean',
    'Promise','Math','JSON','BigInt',
  ]),
  java: new Set([
    'abstract','assert','boolean','break','byte','case','catch','char','class','const','continue',
    'default','do','double','else','enum','extends','final','finally','float','for','goto','if',
    'implements','import','instanceof','int','interface','long','native','new','null','package',
    'private','protected','public','return','short','static','strictfp','super','switch',
    'synchronized','this','throw','throws','transient','try','void','volatile','while','true',
    'false','var','record','sealed','permits','yield','String','Integer','Boolean','List','Map',
    'Set','ArrayList','HashMap','HashSet','PriorityQueue','Arrays','Collections',
  ]),
  cpp: new Set([
    'alignas','alignof','and','asm','auto','bool','break','case','catch','char','class','compl',
    'const','constexpr','const_cast','continue','decltype','default','delete','do','double',
    'dynamic_cast','else','enum','explicit','export','extern','false','float','for','friend',
    'goto','if','inline','int','long','mutable','namespace','new','noexcept','not','nullptr',
    'operator','or','private','protected','public','register','reinterpret_cast','return',
    'short','signed','sizeof','static','static_assert','static_cast','struct','switch','template',
    'this','thread_local','throw','true','try','typedef','typeid','typename','union','unsigned',
    'using','virtual','void','volatile','wchar_t','while','xor','std','vector','string','map',
    'unordered_map','set','unordered_set','priority_queue','pair','size_t','cout','cin','endl',
  ]),
};

function tokenize(source, lang) {
  const kws = KEYWORDS[lang] || new Set();
  const out = [];
  let i = 0;
  const n = source.length;
  const push = (cls, text) => out.push({ cls, text });

  while (i < n) {
    const ch = source[i];

    if (lang === 'python' && ch === '#') {
      let j = i;
      while (j < n && source[j] !== '\n') j++;
      push('com', source.slice(i, j));
      i = j;
      continue;
    }
    if ((lang === 'javascript' || lang === 'java' || lang === 'cpp') &&
        ch === '/' && source[i + 1] === '/') {
      let j = i;
      while (j < n && source[j] !== '\n') j++;
      push('com', source.slice(i, j));
      i = j;
      continue;
    }
    if ((lang === 'javascript' || lang === 'java' || lang === 'cpp') &&
        ch === '/' && source[i + 1] === '*') {
      let j = i + 2;
      while (j < n - 1 && !(source[j] === '*' && source[j + 1] === '/')) j++;
      j = Math.min(n, j + 2);
      push('com', source.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '"' || ch === "'" || (lang === 'javascript' && ch === '`')) {
      const quote = ch;
      let j = i + 1;
      while (j < n) {
        if (source[j] === '\\') { j += 2; continue; }
        if (source[j] === quote) { j++; break; }
        if (quote !== '`' && source[j] === '\n') break;
        j++;
      }
      push('str', source.slice(i, j));
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9a-fA-FxXoObBeE_.+-]/.test(source[j])) j++;
      push('num', source.slice(i, j));
      i = j;
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(source[j])) j++;
      const word = source.slice(i, j);
      let cls = 'id';
      if (kws.has(word)) cls = 'kw';
      else if (source[j] === '(') cls = 'fn';
      else if (/^[A-Z]/.test(word)) cls = 'type';
      push(cls, word);
      i = j;
      continue;
    }

    if ('+-*/%=<>!&|^~?:'.includes(ch)) {
      let j = i;
      while (j < n && '+-*/%=<>!&|^~?:'.includes(source[j])) j++;
      push('op', source.slice(i, j));
      i = j;
      continue;
    }

    push('punct', ch);
    i++;
  }

  return out;
}

export function highlight(source, lang) {
  if (typeof source !== 'string' || !source) return [];
  if (!KEYWORDS[lang]) return [{ cls: 'pl', text: source }];
  return tokenize(source, lang);
}
