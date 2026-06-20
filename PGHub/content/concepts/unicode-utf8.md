---
slug: unicode-utf8
module: cs-tools-encodings
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
- **HTTP and JSON** (RFC 8259) mandate UTF-8 as the only valid encoding for JSON text exchanged between systems; getting decoding wrong corrupts every API payload.
- **Postgres**, **MySQL `utf8mb4`** (the original `utf8` only covered 3-byte sequences and silently truncated emoji), and **SQLite** default to UTF-8 storage; a wrong `client_encoding` setting writes mojibake into permanent rows.
- **Go source files**, **Rust string literals**, **Python 3 `str`**, and **Java's NIO Charset** all assume UTF-8 at the boundary; mis-decoded streams blow up with `UnicodeDecodeError` or worse, silent replacement characters.
- **The Linux kernel filesystem layer**, **Git's index format**, and **AWS S3 object keys** treat names as UTF-8 byte strings; a mismatched normalization on macOS (HFS+ used NFD) versus Linux (NFC) makes the same filename appear twice.

## intuition
A computer can only store bytes, but humans want to write Devanagari, Hangul, Mathematical Bold Italic, and pile-of-poo. Unicode resolves this by separating two questions: "which character is this?" (the abstract code point, a number from U+0000 to U+10FFFF) and "how do I write that number as bytes?" (the encoding). UTF-8 is one encoding; UTF-16 and UTF-32 are others. UTF-8 won because it is ASCII-compatible (any 7-bit ASCII file is already valid UTF-8), self-synchronizing (you can drop into the middle of a stream and find the next character boundary by scanning forward), and space-efficient for Latin scripts.

The trick is a clever bit pattern. A 1-byte sequence starts with `0` and carries 7 bits of code point. A multi-byte sequence has a leading byte that starts with `110`, `1110`, or `11110` (telling you the length is 2, 3, or 4 bytes) and every continuation byte starts with `10`. No continuation byte can ever be mistaken for a leading byte. If you wake up mid-stream, you scan forward until you see a byte whose top bits are not `10`, and you know that is the next code point's start. UTF-16 lacks this property — surrogate pairs (D800-DFFF) carry a similar idea, but mid-stream resync is fragile, which is why network protocols and file formats picked UTF-8.

## visualization
The euro sign U+20AC has code point 8364 = binary 00100000 10101100. UTF-8 splits it across three bytes: 1110xxxx 10xxxxxx 10xxxxxx, filling in the bits to get 0xE2 0x82 0xAC. An ASCII letter `A` (U+0041) stays a single byte 0x41 — backward compatibility with ASCII is why UTF-8 won the web.

## bruteForce
Treat strings as arrays of bytes and ignore encoding. Works for English-only systems for about three days, until a user pastes an em-dash, an accented name, or an emoji and your length check returns 4 for a single character, your slice cuts a character in half, and your database stores garbage. UTF-16 with surrogate pairs has the same trap one layer up.

## optimal
The right approach is **decode at the boundary, operate on text, encode at the boundary**, with explicit normalization for any user-facing comparison. RFC 3629 fixed UTF-8 at 1-4 bytes per code point and forbade overlong encodings; obey it strictly. Every byte stream entering your service — HTTP body, file read, DB driver, message queue payload — should be decoded into the language's native string type immediately, using a declared encoding (never "guess and hope"). Inside the program, work in code points (Python `str`, Rust `String`, Java `String` indexed by code point, not `char`), and for user-facing length, in grapheme clusters via libraries like ICU, `unicode-segmentation` (Rust), or `\X` regex.

Before comparing or hashing user input (usernames, search terms, file paths), normalize to NFC using `unicodedata.normalize("NFC", s)` (Python) or `str.normalize("NFC")` (JS). This collapses `é` (single code point U+00E9) and `e` + combining acute (U+0065 U+0301) into one canonical form. For security-sensitive identifiers, also apply NFKC (compatibility) plus case folding — this is what the IDNA2008 spec mandates for internationalized domain names.

```python
def safe_decode(raw: bytes, declared: str = "utf-8") -> str:
    return raw.decode(declared, errors="strict")

def canonical(name: str) -> str:
    import unicodedata
    return unicodedata.normalize("NFC", name).casefold()
```

At every output boundary, encode as UTF-8 with no BOM (RFC 8259 forbids BOM in JSON). Set `Content-Type: application/json; charset=utf-8` explicitly; do not let the platform pick. For validators, prefer the standard library over rolling your own — Python's `bytes.decode("utf-8", "strict")` rejects overlong encodings, surrogates (U+D800-U+DFFF), and code points above U+10FFFF in a single line, while hand-rolled validators have leaked security holes for decades (CVE-2008-2938 in Apache, the Nimda worm's `%c0%af` path traversal).

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
A correct UTF-8 validator does five things in one forward pass: (1) classify the leading byte to determine the sequence length (1, 2, 3, or 4 bytes), (2) verify each continuation byte has the bit pattern `10xxxxxx`, (3) reject **overlong encodings** (the same code point encoded with more bytes than necessary, e.g. encoding `/` as `0xC0 0xAF` instead of `0x2F` — historically used in security bypasses), (4) reject **surrogate code points** U+D800-U+DFFF (reserved for UTF-16 surrogate pairs, invalid in UTF-8 streams), and (5) reject code points above U+10FFFF (the Unicode upper bound).

```python
def validate_utf8(data: bytes) -> bool:
    i, n = 0, len(data)
    while i < n:
        b = data[i]
        if b < 0x80:                    # 1-byte sequence: 0xxxxxxx
            i += 1
        elif b < 0xC2:                  # 0x80-0xC1 = lone continuation or overlong
            return False
        elif b < 0xE0:                  # 2-byte: 110xxxxx 10xxxxxx
            if i + 1 >= n or (data[i+1] & 0xC0) != 0x80: return False
            i += 2
        elif b < 0xF0:                  # 3-byte: 1110xxxx 10xxxxxx 10xxxxxx
            if i + 2 >= n: return False
            c1, c2 = data[i+1], data[i+2]
            if (c1 & 0xC0) != 0x80 or (c2 & 0xC0) != 0x80: return False
            # Reject overlong (< U+0800) and surrogates (U+D800-U+DFFF).
            if b == 0xE0 and c1 < 0xA0: return False
            if b == 0xED and c1 >= 0xA0: return False
            i += 3
        elif b < 0xF5:                  # 4-byte: 11110xxx 10xxxxxx x3
            if i + 3 >= n: return False
            c1, c2, c3 = data[i+1], data[i+2], data[i+3]
            if (c1 & 0xC0) != 0x80 or (c2 & 0xC0) != 0x80 or (c3 & 0xC0) != 0x80:
                return False
            if b == 0xF0 and c1 < 0x90: return False       # overlong
            if b == 0xF4 and c1 >= 0x90: return False      # > U+10FFFF
            i += 4
        else:                           # 0xF5-0xFF: invalid leading byte
            return False
    return True
```

Why this is right: it follows **RFC 3629 Table 1** exactly — every byte sequence either matches the table or is rejected. Each byte is read once (O(n)), each continuation is checked for the `10xxxxxx` pattern, and the special-case checks for `0xE0 + < 0xA0` (overlong 3-byte) and `0xED + >= 0xA0` (surrogate range) close the security holes that hand-rolled validators historically missed.

**In production, prefer the standard library** over hand-rolled validators. Python's `bytes.decode("utf-8", "strict")` rejects overlong encodings, surrogates, and code points above U+10FFFF in one line; Java's `CharsetDecoder` with `CodingErrorAction.REPORT`, Rust's `str::from_utf8`, and Go's `utf8.Valid` all do the same. **Hand-rolled validators have leaked security holes for decades**: **CVE-2008-2938** (Apache Tomcat path traversal via overlong UTF-8), the **Nimda worm's `%c0%af` exploit** (encoding `/` as two bytes to bypass IIS path filters), and **CVE-2017-11103** (Heimdal Kerberos accepting invalid UTF-8 in principal names). Use the standard library; trust battle-tested code.

**Adjacent encoding decisions**:
- **For network protocols and JSON**: UTF-8 mandatory (RFC 8259); no BOM (RFC 8259 explicitly forbids).
- **For Windows-native code**: UTF-16 is the OS native; convert at the boundary.
- **For storage**: UTF-8 nearly universal; `varchar` in Postgres, `utf8mb4` in MySQL (the old `utf8` was 3-byte only and silently truncated emoji — CVE-worthy).
- **For URLs**: percent-encoded UTF-8 (RFC 3986); for IRIs, the IDNA2008 spec mandates Punycode for domain names plus NFC normalization for usernames.

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
