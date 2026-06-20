---
slug: bitwise-gray-code
module: bitwise
title: Gray Code
subtitle: Enumerate 0..2^n-1 so that consecutive codes differ in exactly one bit.
difficulty: Intermediate
position: 51
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 5: Probabilistic Analysis"
    url: "https://walkccc.me/CLRS/Chap05/Problems/5-2/"
    type: book
  - title: "Gray Code — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/generate-n-bit-gray-codes/"
    type: blog
  - title: "TheAlgorithms/Python — gray_code_sequence.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/bit_manipulation/gray_code_sequence.py"
    type: repo
status: published
---

## intro
A Gray code is an ordering of the 2^n binary numbers of length n such that every two adjacent codes (and the first and last) differ in exactly one bit. The "reflected binary" Gray code has a stunning one-line construction: `g = i XOR (i >> 1)`. Once you see why that formula works, generating Gray codes becomes a non-event in interviews.

## whyItMatters
- Mechanical rotary encoders in industrial servomotors, Bosch automotive throttle position sensors, and CNC machine tools emit Gray-coded positions so that mid-rotation reads never produce transient garbage when multiple bits straddle a sector boundary.
- Karnaugh maps (the canonical logic-minimization tool taught in every CS-101 digital course) lay rows/columns in Gray-code order so adjacent cells differ in exactly one variable, exposing prime implicants visually.
- DRAM refresh controllers and analog-to-digital flash converters use Gray counters to avoid glitches on multi-bit transitions.
- Algorithm uses include circular Hamiltonian paths on the hypercube (used by SAT preprocessors), subset enumeration with delta updates (so you only add/remove one element per step in bitmask DP), and the optimal recursive structure of the Tower of Hanoi puzzle.
- The `i XOR (i >> 1)` one-line construction is one of the most elegant bit tricks in interview prep — knowing it cold signals fluency with bitwise reasoning.

## intuition
Plain binary counting flips many bits at once on a carry: going from 3 (011) to 4 (100) flips three bits simultaneously. In hardware, those three transitions never happen exactly together — there is a brief window where the bus shows 000, 001, 010, 110, or some other garbage before settling on 100. Sensors and counters that read mid-transition get wrong answers. Gray codes solve this by reordering the 2^n integers so that consecutive codes differ in exactly one bit, eliminating the multi-bit-transition window entirely. The reflected-binary construction explains why this is possible: take the n-bit Gray sequence, list it forward with a leading 0, then list it reversed with a leading 1. The forward and reversed halves preserve adjacent-single-bit-difference within themselves (by induction), and the boundary between them has the same n-1 low bits with the high bit flipping — also a single bit change. The first and last codes of the full sequence both have a leading 1 in only one of them, also a single bit change, making the sequence cyclic. The closed-form `g = i ^ (i >> 1)` is a clever encoding of this construction. Incrementing i by one always flips the trailing-zeros-and-one bits (the carry propagation). XORing with a right-shifted copy cancels every flip except the highest one of the burst. The net effect is exactly one bit flip per increment in the Gray-coded sequence. The deeper insight is that bijections between integers and arrangements often have surprisingly clean bit-arithmetic forms — keep an eye out for them.

## optimal
For i in 0..2^n - 1, emit `i ^ (i >> 1)`. This produces the canonical reflected Gray code in O(2^n) time and O(1) extra space beyond the output. Decoding (Gray back to binary) requires a running XOR from the most-significant bit down. Both directions are loop-free closed forms with no recursion, no mirror-and-copy, no precomputed table.

```python
def gray_code(n):
    # i ^ (i >> 1) maps integer i to its reflected-binary Gray code.
    return [i ^ (i >> 1) for i in range(1 << n)]

def gray_to_binary(g):
    # Decode by running-XOR from MSB downward; each bit of binary is XOR of all
    # higher Gray bits because the Gray bit pattern stored that prefix XOR.
    b = 0
    while g:
        b ^= g
        g >>= 1
    return b
```

The encode loop runs in O(2^n) total — one XOR and one shift per output element. The decode loop runs in O(log g) per number — its termination relies on the right-shift eventually zeroing out all high bits. This is asymptotically optimal because the output itself has 2^n entries, so any enumeration of the full Gray sequence must do at least Theta(2^n) work; both functions hit that lower bound with the smallest possible constant per element.

## visualization
```
n = 3 reflected Gray code construction:
n=1 :        0, 1
n=2 :   0[0,1] then 1[1,0] -> 00, 01, 11, 10
n=3 :   0[00,01,11,10] then 1[10,11,01,00]
       -> 000, 001, 011, 010, 110, 111, 101, 100
adjacent diffs (XOR):  001, 010, 001, 100, 001, 010, 001
each is a single set bit — exactly one flip per step.
```

## bruteForce
Generate all 2^n strings, then build a graph where two codes connect if they differ in exactly one bit, and do a Hamiltonian-path search. That is exponential in n and absurd for an O(2^n) output. Even the "construct recursively by mirroring" approach copies the previous list in O(2^n) per level — fine, but slower than the formula.

## complexity
- **Time:** O(2^n) to enumerate all codes
- **Space:** O(2^n) for the output list, O(1) auxiliary

## pitfalls
- Confusing "differ in one bit" with "differ by one in value" — 3 and 4 differ by one but flip three bits.
- Forgetting that the sequence is circular: the last and first codes must also differ in one bit.
- Mixing up the encode direction (`i XOR (i >> 1)`) and decode direction (prefix XOR of bits).
- Building the list by string concatenation in a tight loop instead of bit math — orders-of-magnitude slower.

## interviewTips
- If asked to "generate all subsets in an order where each subset differs from the next by one element," that is a Gray code in disguise.
- State the formula `i ^ (i >> 1)` and prove it changes exactly one bit per increment before coding.
- Mention the mirror construction as the "why" — it makes the formula feel earned, not magic.

## code.python
```python
def gray_code(n):
    return [i ^ (i >> 1) for i in range(1 << n)]

def gray_to_binary(g):
    b = 0
    while g:
        b ^= g
        g >>= 1
    return b
```

## code.javascript
```javascript
function grayCode(n) {
  const out = [];
  for (let i = 0; i < (1 << n); i++) out.push(i ^ (i >> 1));
  return out;
}

function grayToBinary(g) {
  let b = 0;
  while (g) { b ^= g; g >>>= 1; }
  return b;
}
```

## code.java
```java
public List<Integer> grayCode(int n) {
    List<Integer> out = new ArrayList<>(1 << n);
    for (int i = 0; i < (1 << n); i++) out.add(i ^ (i >> 1));
    return out;
}

public int grayToBinary(int g) {
    int b = 0;
    while (g != 0) { b ^= g; g >>>= 1; }
    return b;
}
```

## code.cpp
```cpp
vector<int> grayCode(int n) {
    vector<int> out(1 << n);
    for (int i = 0; i < (1 << n); i++) out[i] = i ^ (i >> 1);
    return out;
}

int grayToBinary(int g) {
    int b = 0;
    while (g) { b ^= g; g >>= 1; }
    return b;
}
```
