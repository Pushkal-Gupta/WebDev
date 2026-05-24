---
slug: unicode-utf8
module: cs-core
title: Unicode and UTF-8
subtitle: Code points, variable-length encoding, BOMs, and normalization — the layer beneath every "string".
difficulty: Intermediate
position: 3
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Operating Systems: Three Easy Pieces (encoding context, ch. on persistence)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Unicode and UTF-8 — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/utf-8-validation/"
    type: blog
  - title: "TheAlgorithms/Python — utf_8_encoding"
    url: "https://github.com/TheAlgorithms/Python/tree/master/strings"
    type: repo
status: published
---

## intro
Unicode assigns every character on Earth — Latin, CJK, emoji, ancient scripts — a unique integer called a code point (U+0000 to U+10FFFF). UTF-8 is the dominant encoding that maps those code points to byte sequences. Mastering this stack is the difference between strings that "just work" and a career of mojibake bug reports.

## whyItMatters
Almost every modern bug labeled "weird character" is a Unicode bug: a Latin-1 byte stream interpreted as UTF-8, a BOM smuggled into a JSON file, a length check that counted bytes instead of code points, or a comparison that failed because two visually identical strings used different normalization forms. Web APIs, databases, file systems, and source code all live on top of this.

## intuition
Think of Unicode as the dictionary (numbers for characters) and UTF-8 as one of several ways to write those numbers down as bytes. ASCII code points (0-127) stay one byte. Code points up to U+07FF take two bytes. Up to U+FFFF take three. Up to U+10FFFF take four. The leading bits of each byte encode "I am the start of a 3-byte sequence" or "I am a continuation byte," making the stream self-synchronizing.

## visualization
The euro sign U+20AC has code point 8364 = binary 00100000 10101100. UTF-8 splits it across three bytes: 1110xxxx 10xxxxxx 10xxxxxx, filling in the bits to get 0xE2 0x82 0xAC. An ASCII letter `A` (U+0041) stays a single byte 0x41 — backward compatibility with ASCII is why UTF-8 won the web.

## bruteForce
Treat strings as arrays of bytes and ignore encoding. Works for English-only systems for about three days, until a user pastes an em-dash, an accented name, or an emoji and your length check returns 4 for a single character, your slice cuts a character in half, and your database stores garbage. UTF-16 with surrogate pairs has the same trap one layer up.

## optimal
Always know the encoding of every byte stream entering your system. Decode at the boundary (HTTP body, file read, DB driver) into the language's native string type (Python `str`, Java `String`, JS `string`). Operate on code points or grapheme clusters, never raw bytes. Apply NFC normalization (composed form) before comparing or hashing user input. Encode as UTF-8 at every output boundary, with no BOM unless explicitly required.

## complexity
time: O(n) to encode or decode n bytes/code points; O(n) for normalization.
space: O(n) for output buffer.
notes: A code point can be 1 to 4 UTF-8 bytes; a "user-perceived character" (grapheme cluster) can be many code points (e.g. flag emoji = 2 regional-indicator code points).

## pitfalls
- Counting `len(s)` for "characters" — in Python that counts code points (not graphemes); in JS it counts UTF-16 code units (so `"\u{1F600}".length === 2`).
- Comparing strings without normalization: `"é"` (NFC) and `"e" + combining-acute` (NFD) look identical but compare unequal.
- Slicing UTF-8 bytes — you can land inside a multi-byte sequence and create invalid UTF-8.
- Reading a file with a UTF-8 BOM (0xEF 0xBB 0xBF) and parsing JSON without stripping it — most JSON parsers reject the BOM.
- Trusting that "UTF-8" in a `Content-Type` header is honest; servers lie.

## interviewTips
- Be ready to validate a byte sequence is well-formed UTF-8 (a classic Leetcode-style problem).
- Mention that emoji and many non-BMP characters require surrogate-aware handling in UTF-16-based languages like Java and JavaScript.
- Bring up NFC normalization for user identifiers — security-sensitive systems normalize to prevent homograph attacks.

## visualization
A 3-byte encoding is laid out as 1110xxxx 10xxxxxx 10xxxxxx; the leading `1110` tells the decoder "two more continuation bytes follow," and each `10` continuation byte contributes 6 bits. Concatenate the `x` bits in order to recover the original code point.

## bruteForce
A toy UTF-8 validator that just checks every byte is less than 0x80 only accepts ASCII. A slightly smarter one accepts any byte but misses overlong encodings (e.g. encoding `/` as two bytes to slip past a path filter) — a classic security bug.

## optimal
Validate the leading byte to determine sequence length, then verify each continuation byte starts with `10`, and finally reject overlong encodings and surrogate code points (U+D800-U+DFFF, reserved for UTF-16). Standard libraries already do this correctly — prefer `str.encode("utf-8")` over rolling your own.

## code.python
```python
def validate_utf8(data: list[int]) -> bool:
    remaining = 0
    for byte in data:
        byte &= 0xFF
        if remaining == 0:
            if byte >> 7 == 0: continue
            elif byte >> 5 == 0b110: remaining = 1
            elif byte >> 4 == 0b1110: remaining = 2
            elif byte >> 3 == 0b11110: remaining = 3
            else: return False
        else:
            if byte >> 6 != 0b10: return False
            remaining -= 1
    return remaining == 0
```

## code.javascript
```javascript
export function validateUtf8(data) {
  let remaining = 0;
  for (const b of data) {
    const byte = b & 0xff;
    if (remaining === 0) {
      if (byte >> 7 === 0) continue;
      else if (byte >> 5 === 0b110) remaining = 1;
      else if (byte >> 4 === 0b1110) remaining = 2;
      else if (byte >> 3 === 0b11110) remaining = 3;
      else return false;
    } else {
      if (byte >> 6 !== 0b10) return false;
      remaining--;
    }
  }
  return remaining === 0;
}
```

## code.java
```java
public class Utf8Validator {
    public boolean validateUtf8(int[] data) {
        int remaining = 0;
        for (int b : data) {
            int byteVal = b & 0xFF;
            if (remaining == 0) {
                if ((byteVal >> 7) == 0) continue;
                else if ((byteVal >> 5) == 0b110) remaining = 1;
                else if ((byteVal >> 4) == 0b1110) remaining = 2;
                else if ((byteVal >> 3) == 0b11110) remaining = 3;
                else return false;
            } else {
                if ((byteVal >> 6) != 0b10) return false;
                remaining--;
            }
        }
        return remaining == 0;
    }
}
```

## code.cpp
```cpp
#include <vector>

bool validateUtf8(const std::vector<int>& data) {
    int remaining = 0;
    for (int b : data) {
        int byte = b & 0xFF;
        if (remaining == 0) {
            if ((byte >> 7) == 0) continue;
            else if ((byte >> 5) == 0b110) remaining = 1;
            else if ((byte >> 4) == 0b1110) remaining = 2;
            else if ((byte >> 3) == 0b11110) remaining = 3;
            else return false;
        } else {
            if ((byte >> 6) != 0b10) return false;
            remaining--;
        }
    }
    return remaining == 0;
}
```
