#!/usr/bin/env node
// Atomic splice: bit-manipulation trio (single-number, power-of-two, complement-of-base-10-integer).
// `single-number` and `power-of-two` already have complete entries in problemContent.js,
// so this script only injects the missing third entry. Re-runnable.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function complementOfBase10IntegerViz(')
  || src.includes("'complement-of-base-10-integer':")
  || src.includes('"complement-of-base-10-integer":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function complementOfBase10IntegerViz() {
  const n = 5;
  const bits = n.toString(2).split('').map(Number); // [1,0,1]
  const L = bits.length;
  const mask = (1 << L) - 1;
  const ans = n ^ mask;
  const maskBits = mask.toString(2).padStart(L, '0').split('').map(Number);
  const ansBits = ans.toString(2).padStart(L, '0').split('').map(Number);
  const frames = [];

  frames.push({
    array: bits,
    chip: [
      { label: 'n', value: String(n) },
      { label: 'binary', value: n.toString(2), tone: 'violet' },
      { label: 'goal', value: 'flip every bit up to and including the MSB', tone: 'violet' },
    ],
    caption: 'For n = ' + n + ' the binary is ' + n.toString(2) + '. The complement here is NOT a 32-bit bitwise NOT — we only flip the bits up to the most-significant set bit of n. Bits above the MSB stay zero.',
  });

  frames.push({
    array: bits,
    chip: [
      { label: 'bit-length', value: String(L), tone: 'violet' },
      { label: 'why', value: 'we need a mask exactly L bits wide', tone: 'violet' },
    ],
    caption: 'Count the bit-length L of n (here L = ' + L + '). Everything beyond the MSB is implicitly zero — we must not flip those, otherwise the answer would explode into a giant negative number under two\\'s complement.',
  });

  let probe = 0;
  for (let i = L - 1; i >= 0; i--) {
    probe = bits.slice(0, L - 1 - i).concat(Array(i + 1).fill(1));
    frames.push({
      array: probe,
      chip: [
        { label: 'building mask', value: 'shift 1 left, then subtract 1', tone: 'pink' },
        { label: 'iter', value: String(L - i), tone: 'violet' },
      ],
      caption: 'Slide a 1 left by ' + (L - i) + ' position' + (L - i === 1 ? '' : 's') + ' then subtract 1 to fill the low bits with ones. Equivalent compact form: mask = (1 << L) - 1.',
    });
  }

  frames.push({
    array: maskBits,
    chip: [
      { label: 'mask', value: '(1 << ' + L + ') - 1 = ' + mask, tone: 'pink' },
      { label: 'binary', value: mask.toString(2), tone: 'violet' },
    ],
    caption: 'Mask = ' + mask + ' (binary ' + mask.toString(2) + ') — L ones, zeros above. This is the exact width of n, no more, no less. XOR-ing n with this mask flips every bit that belongs to n and leaves the implicit zeros above alone.',
  });

  frames.push({
    array: bits,
    chip: [
      { label: 'n', value: n.toString(2), tone: 'violet' },
    ],
    caption: 'Recall n = ' + n.toString(2) + '. We are about to XOR it bit-by-bit with the mask of equal width.',
  });

  for (let j = 0; j < L; j++) {
    const partial = ansBits.slice(0, j + 1).concat(bits.slice(j + 1));
    frames.push({
      array: partial,
      chip: [
        { label: 'bit ' + j, value: bits[j] + ' XOR ' + maskBits[j] + ' = ' + ansBits[j], tone: 'pink' },
      ],
      caption: 'Bit ' + j + ' (from the MSB): ' + bits[j] + ' XOR 1 flips it to ' + ansBits[j] + '. XOR with 1 is the canonical bit-flip; XOR with 0 would be a no-op which is why bits above the MSB must stay outside the mask.',
    });
  }

  frames.push({
    array: ansBits,
    chip: [
      { label: 'n', value: n.toString(2) },
      { label: 'XOR mask', value: mask.toString(2) },
      { label: 'result', value: ans.toString(2) + ' = ' + ans, tone: 'pink' },
    ],
    caption: 'Final: n ^ mask = ' + ans + ' (binary ' + ans.toString(2) + '). For n = 5 (101) the complement is 010 = 2. The two-line form is: L = n.bit_length(); return n ^ ((1 << L) - 1), with the edge case n == 0 returning 1.',
  });

  frames.push({
    array: [0, 0, 0],
    chip: [
      { label: 'edge', value: 'n = 0', tone: 'pink' },
      { label: 'bit-length', value: '0', tone: 'violet' },
      { label: 'answer', value: '1', tone: 'violet' },
    ],
    caption: 'Edge case: n = 0 has bit-length 0 so mask = (1 << 0) - 1 = 0 and 0 XOR 0 = 0 — wrong. Special-case it: the complement of 0 is conventionally 1 (the single-bit number with the opposite value).',
  });

  frames.push({
    array: ansBits,
    chip: [
      { label: 'time', value: 'O(log n)', tone: 'violet' },
      { label: 'space', value: 'O(1)', tone: 'violet' },
      { label: 'one-liner', value: 'n ^ ((1 << n.bit_length()) - 1)', tone: 'pink' },
    ],
    caption: 'Why O(log n): bit_length walks the binary representation once. Why this is cleaner than looping bit-by-bit: building the mask in one shift-and-subtract avoids any branch on each bit and works for n up to the language\\'s integer width.',
  });

  return { renderer: 'array', title: 'Complement of Base 10 Integer — XOR with same-width all-ones mask', frames };
}

`;

const ENTRY_BLOCK = `  'complement-of-base-10-integer': {
    tags: ['math', 'bit-manipulation'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: complementOfBase10IntegerViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def bitwiseComplement(self, n: int) -> int:
        if n == 0:
            return 1
        mask = (1 << n.bit_length()) - 1
        return n ^ mask\`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach: 'Build a mask of all 1s exactly as wide as n (via n.bit_length()), then XOR. XOR with 1 flips a bit; XOR with 0 leaves it alone — so the mask must stop at the MSB, otherwise the implicit leading zeros would flip to ones and the answer would be wrong. n == 0 is the one edge case: its bit-length is 0, so we return 1 directly.',
      },
      javascript: {
        code: \`function bitwiseComplement(n) {
  if (n === 0) return 1;
  let mask = 1;
  while (mask <= n) mask <<= 1;   // smallest power of two strictly greater than n
  return (mask - 1) ^ n;
}\`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach: 'JavaScript bitwise ops are 32-bit signed, so we build the mask iteratively rather than relying on a bit_length helper. Loop invariant: mask is always a single bit; after the loop, mask - 1 is the all-ones value of the same width as n.',
      },
      java: {
        code: \`class Solution {
    public int bitwiseComplement(int n) {
        if (n == 0) return 1;
        int mask = Integer.highestOneBit(n);
        // turn the MSB into a full mask of ones at that width
        mask = (mask << 1) - 1;
        return n ^ mask;
    }
}\`,
        complexity: { time: 'O(1)', space: 'O(1)' },
        approach: 'Integer.highestOneBit isolates the MSB in O(1). Shifting it left by 1 and subtracting 1 produces the all-ones mask of the same width as n. The XOR then flips exactly those bits.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int bitwiseComplement(int n) {
        if (n == 0) return 1;
        int width = 32 - __builtin_clz(n);   // bit-length of n
        unsigned mask = (1u << width) - 1u;
        return (int)(((unsigned)n) ^ mask);
    }
};\`,
        complexity: { time: 'O(1)', space: 'O(1)' },
        approach: '__builtin_clz counts leading zeros — 32 minus that gives the bit-length. Use unsigned for the shift so (1 << 31) - 1 is well-defined (signed overflow is UB in C++).',
      },
      c: {
        code: \`int bitwiseComplement(int n) {
    if (n == 0) return 1;
    unsigned mask = 1;
    while (mask <= (unsigned)n) mask <<= 1;
    return (int)(((unsigned)n) ^ (mask - 1));
}\`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach: 'Build the smallest power-of-two strictly greater than n by repeated left-shift, then mask - 1 is the all-ones value at that width. Cast to unsigned for safety — the shift would invoke UB once it reaches the sign bit otherwise.',
      },
      go: {
        code: \`package solution

import "math/bits"

func bitwiseComplement(n int) int {
    if n == 0 {
        return 1
    }
    width := bits.Len(uint(n))           // bit-length
    mask := (1 << width) - 1
    return n ^ mask
}\`,
        complexity: { time: 'O(1)', space: 'O(1)' },
        approach: 'math/bits.Len returns the bit-length directly. Go ints are wide enough that the shift can\\'t overflow for the problem\\'s constraints (n fits in 31 bits).',
      },
    },
  },
`;

const VIZ_ANCHOR = "export const RICH_CONTENT = {";
const vizIdx = src.indexOf(VIZ_ANCHOR);
if (vizIdx < 0) {
  console.error('Could not find RICH_CONTENT anchor.');
  process.exit(1);
}

const openBracePos = src.indexOf('{', vizIdx);
// String/template-literal aware brace matcher.
let depth = 0, closeIdx = -1;
let state = 'code'; // code | sq | dq | tpl | line-comment | block-comment
for (let p = openBracePos; p < src.length; p++) {
  const ch = src[p];
  const nx = src[p + 1];
  if (state === 'code') {
    if (ch === '/' && nx === '/') { state = 'line-comment'; p++; continue; }
    if (ch === '/' && nx === '*') { state = 'block-comment'; p++; continue; }
    if (ch === "'") { state = 'sq'; continue; }
    if (ch === '"') { state = 'dq'; continue; }
    if (ch === '`') { state = 'tpl'; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { closeIdx = p; break; }
    }
  } else if (state === 'line-comment') {
    if (ch === '\n') state = 'code';
  } else if (state === 'block-comment') {
    if (ch === '*' && nx === '/') { state = 'code'; p++; }
  } else if (state === 'sq') {
    if (ch === '\\') { p++; continue; }
    if (ch === "'") state = 'code';
  } else if (state === 'dq') {
    if (ch === '\\') { p++; continue; }
    if (ch === '"') state = 'code';
  } else if (state === 'tpl') {
    if (ch === '\\') { p++; continue; }
    if (ch === '`') state = 'code';
  }
}
if (closeIdx < 0) {
  console.error('Could not match RICH_CONTENT closing brace.');
  process.exit(1);
}

const before = src.slice(0, vizIdx);
const richBody = src.slice(openBracePos + 1, closeIdx);
const after = src.slice(closeIdx);

const out = before + VIZ_BLOCK + VIZ_ANCHOR + richBody + ENTRY_BLOCK + after;

fs.writeFileSync(FILE, out, 'utf8');
console.log('Spliced complementOfBase10IntegerViz + 1 entry into ' + path.basename(FILE));
console.log('  note: single-number and power-of-two already had complete entries — skipped.');
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
