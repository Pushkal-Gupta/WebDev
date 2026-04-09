// ─── Type mappings: Python canonical → JS/Java ───

const TYPE_MAP = {
  'int':              { jsdoc: 'number',     java: 'int' },
  'float':            { jsdoc: 'number',     java: 'double' },
  'str':              { jsdoc: 'string',     java: 'String' },
  'bool':             { jsdoc: 'boolean',    java: 'boolean' },
  'List[int]':        { jsdoc: 'number[]',   java: 'int[]' },
  'List[str]':        { jsdoc: 'string[]',   java: 'String[]' },
  'List[List[int]]':  { jsdoc: 'number[][]', java: 'int[][]' },
  'List[List[str]]':  { jsdoc: 'string[][]', java: 'String[][]' },
  'List[bool]':       { jsdoc: 'boolean[]',  java: 'boolean[]' },
};

const jt = (pyType) => TYPE_MAP[pyType]?.java || pyType;
const jd = (pyType) => TYPE_MAP[pyType]?.jsdoc || pyType;

// ─── Template generation (what user sees in editor) ───

export function generateTemplate(language, methodName, params, returnType) {
  if (!methodName || !params) return null;

  if (language === 'python') {
    const sig = params.map(p => `${p.name}: ${p.type}`).join(', ');
    return `class Solution:\n    def ${methodName}(self, ${sig}) -> ${returnType}:\n        `;
  }

  if (language === 'javascript') {
    const jsdoc = params.map(p => ` * @param {${jd(p.type)}} ${p.name}`).join('\n');
    const args = params.map(p => p.name).join(', ');
    return `/**\n${jsdoc}\n * @return {${jd(returnType)}}\n */\nvar ${methodName} = function(${args}) {\n    \n};`;
  }

  if (language === 'java') {
    const javaParams = params.map(p => `${jt(p.type)} ${p.name}`).join(', ');
    return `class Solution {\n    public ${jt(returnType)} ${methodName}(${javaParams}) {\n        \n    }\n}`;
  }

  return null;
}

// ─── Driver code (wraps user code for execution) ───

export function wrapWithDriver(userCode, language, methodName, params) {
  if (!methodName || !params) return userCode;

  const args = params.map(p => p.name).join(', ');

  if (language === 'python') {
    const parsing = params.map((p, i) => `${p.name} = json.loads(_lines[${i}])`).join('\n');
    return [
      'import sys, json',
      'from typing import List, Optional, Dict, Tuple, Set',
      '',
      userCode,
      '',
      '_lines = sys.stdin.read().strip().split("\\n")',
      parsing,
      '_sol = Solution()',
      `_result = _sol.${methodName}(${args})`,
      'if isinstance(_result, bool):',
      '    print(str(_result).lower())',
      'elif _result is None:',
      '    print("null")',
      'else:',
      '    print(json.dumps(_result))',
    ].join('\n');
  }

  if (language === 'javascript') {
    const parsing = params.map((p, i) => `const ${p.name} = JSON.parse(_lines[${i}]);`).join('\n');
    return [
      userCode,
      '',
      "const _lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');",
      parsing,
      `const _result = ${methodName}(${args});`,
      'console.log(JSON.stringify(_result));',
    ].join('\n');
  }

  if (language === 'java') {
    const javaParsing = params.map(p => {
      const line = `String _raw_${p.name} = br.readLine().trim();`;
      if (p.type === 'int') return `${line}\n        int ${p.name} = Integer.parseInt(_raw_${p.name});`;
      if (p.type === 'str') return `${line}\n        String ${p.name} = _raw_${p.name}.startsWith("\\"") ? _raw_${p.name}.substring(1, _raw_${p.name}.length()-1) : _raw_${p.name};`;
      if (p.type === 'bool') return `${line}\n        boolean ${p.name} = Boolean.parseBoolean(_raw_${p.name});`;
      if (p.type === 'List[int]') return [
        line,
        `        String _s_${p.name} = _raw_${p.name}.substring(1, _raw_${p.name}.length()-1);`,
        `        String[] _p_${p.name} = _s_${p.name}.isEmpty() ? new String[0] : _s_${p.name}.split(",");`,
        `        int[] ${p.name} = new int[_p_${p.name}.length];`,
        `        for(int i=0;i<_p_${p.name}.length;i++) ${p.name}[i]=Integer.parseInt(_p_${p.name}[i].trim());`,
      ].join('\n        ');
      if (p.type === 'List[str]') return [
        line,
        `        String _s_${p.name} = _raw_${p.name}.substring(1, _raw_${p.name}.length()-1);`,
        `        String[] ${p.name} = _s_${p.name}.isEmpty() ? new String[0] : _s_${p.name}.split(",");`,
        `        for(int i=0;i<${p.name}.length;i++) ${p.name}[i]=${p.name}[i].trim().replace("\\"","");`,
      ].join('\n        ');
      return `${line}\n        // TODO: parse ${p.type}`;
    }).join('\n        ');

    const javaReturn = jt(params[0]?.type === 'List[int]' ? 'List[int]' : 'int'); // placeholder
    const resultPrint = generateJavaResultPrint(methodName, args);

    return [
      'import java.util.*;',
      'import java.io.*;',
      '',
      userCode,
      '',
      'class Main {',
      '    public static void main(String[] _args) throws Exception {',
      '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
      `        ${javaParsing}`,
      '        Solution sol = new Solution();',
      `        ${resultPrint}`,
      '    }',
      '}',
    ].join('\n');
  }

  return userCode;
}

function generateJavaResultPrint(methodName, args) {
  // Generic: call method, convert to string
  return [
    `var _result = sol.${methodName}(${args});`,
    'if (_result instanceof int[]) {',
    '    StringBuilder sb = new StringBuilder("[");',
    '    for(int i=0;i<((int[])_result).length;i++){if(i>0)sb.append(",");sb.append(((int[])_result)[i]);}',
    '    sb.append("]"); System.out.println(sb);',
    '} else if (_result instanceof boolean[]) {',
    '    StringBuilder sb = new StringBuilder("[");',
    '    for(int i=0;i<((boolean[])_result).length;i++){if(i>0)sb.append(",");sb.append(((boolean[])_result)[i]);}',
    '    sb.append("]"); System.out.println(sb);',
    '} else { System.out.println(_result); }',
  ].join('\n        ');
}

// ─── Test case helpers ───

export function buildStdin(inputs) {
  return (inputs || []).join('\n');
}

export function compareOutput(actual, expected) {
  const a = (actual || '').trim();
  const e = (expected || '').trim();
  if (a === e) return true;
  try {
    return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(e));
  } catch {
    return a.toLowerCase() === e.toLowerCase();
  }
}
