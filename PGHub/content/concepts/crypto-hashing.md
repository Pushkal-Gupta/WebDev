---
slug: crypto-hashing
module: cryptography
title: Cryptographic Hash Functions
subtitle: A one-way fingerprint that maps any input to a fixed-length digest — the primitive behind integrity checks, commitments, and safe password storage.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "Dan Boneh — Cryptography I (Coursera)"
    url: "https://www.coursera.org/learn/crypto"
    type: course
  - title: "NIST FIPS 180-4 — Secure Hash Standard (SHA-2)"
    url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final"
    type: article
  - title: "RFC 9106 — Argon2 Memory-Hard Function for Password Hashing"
    url: "https://www.rfc-editor.org/rfc/rfc9106.html"
    type: article
  - title: "Ferguson, Schneier, Kohno — Cryptography Engineering"
    url: "https://www.schneier.com/books/cryptography-engineering/"
    type: book
status: published
---

## intro

A **cryptographic hash function** is a deterministic map that takes an input of *any* size — a single byte, a password, a multi-gigabyte file — and returns a **fixed-length digest**, typically 256 or 512 bits. Feed it the same input and you always get the same output; change the input by one bit and you get a wildly different, unpredictable-looking output. It is not encryption: there is no key and no decrypt step, because a hash deliberately throws information away. The value it provides is not secrecy but **integrity and identity** — a short, comparable fingerprint that stands in for a much larger message. Standard functions in this family include SHA-256 and SHA-512 (the SHA-2 family) and SHA-3.

## whyItMatters

Almost every system you touch leans on hashing somewhere. When you download a file and check its checksum, that is a hash confirming nothing was corrupted or tampered with. When a Git commit gets an ID, that ID is a hash of the commit's contents, which is how Git detects the tiniest change. TLS certificates, digital signatures, blockchains, and content-addressed storage all sign or reference a **digest** rather than the raw data, because a digest is small, fixed-size, and collision-resistant. And when a service stores your password, it should store a hash, not the password itself, so that a database breach does not immediately hand an attacker every account. Hashing turns "compare two huge things" and "prove data is unchanged" into cheap, fixed-cost operations. Get the choice of function or the password scheme wrong, and every one of those guarantees quietly evaporates.

## intuition

Picture a machine that mixes any input so thoroughly that the output looks like random noise, yet the same input always produces the same noise. That is the mental image of a cryptographic hash, and three security properties make it useful.

**One-way (preimage resistance):** given a digest, you cannot practically run the machine backwards to recover an input that produced it. The only known strategy is to guess inputs and hash them until one matches — brute force. For an n-bit output that is about 2^n work, which for n = 256 is astronomically large.

**Second-preimage resistance:** given a specific input, you cannot find a *different* input with the same digest. This is what protects a signed document — nobody can craft a second file that hashes identically and swap it in.

**Collision resistance:** you cannot find *any* two distinct inputs that hash to the same value. This is the strongest requirement and, subtly, the easiest to break, because of the **birthday bound**.

Here the pigeonhole principle bites. The input space is infinite, the output space is finite (2^n possible digests), so by pigeonhole **collisions must exist** — many inputs share each digest. Security does not claim collisions don't exist; it claims they are *infeasible to find*. And the birthday paradox tells us how hard: to find a collision you don't need 2^n tries, only about **2^(n/2)**, because you're looking for any pair to match, not a match to a fixed target — the same reason 23 people give a 50 percent chance of a shared birthday. That halving is why we want big outputs: 256-bit hashes give a 2^128 collision bound, still far out of reach.

Finally, the **avalanche effect** ties it together: flipping one input bit should flip about half the output bits, with no visible correlation between the change and the result. Without avalanche, similar inputs would give similar digests and an attacker could tune inputs toward a target. With it, the output is effectively unpredictable, which is exactly what makes the one-way and collision guarantees hold in practice.

## visualization

```
INPUT (any length)                DIGEST (fixed 32 bits, 8 hex)
  "hello"            --H-->        1a2f9c07
  "The quick..."     --H-->        d4e11b6a
  a 2 GB file        --H-->        77bc0f39      same size out, always

AVALANCHE  (flip ONE character -> about half the bits flip)
  "hello"   -> 1a2f9c07   ->  bits: 0001 1010 0010 1111 1001 1100 0000 0111
  "hallo"   -> 9e40d1b8   ->  bits: 1001 1110 0100 0000 1101 0001 1011 1000
                                          ~16 of 32 bits differ  (no pattern)

SALTED PASSWORD STORAGE (never store the raw password)
  salt = random per user  = "x7Qk"
  stored = slowKDF( salt + password, cost )
  "x7Qk" + "hunter2"  --Argon2-->  d31f...  ->  save {salt, digest, cost}
  verify:  slowKDF(salt + typed, cost) == stored ?   constant-time compare
```

## bruteForce

The naive approach is to store passwords in plaintext, or to "protect" them with a single pass of a fast hash like MD5 or SHA-1. Plaintext is indefensible: one database leak exposes every account instantly. Fast unsalted hashes are barely better. Because the hash is deterministic and unsalted, identical passwords produce identical digests, so **rainbow tables** — precomputed digest-to-password lookups — reverse common passwords in milliseconds, and identical entries in the dump are visible at a glance. Worse, MD5 and SHA-1 are engineered for speed, so a commodity GPU computes **billions** of guesses per second, making offline brute force of weak passwords trivial.

## optimal

Split the job by purpose, because "hash a file" and "hash a password" have opposite requirements.

**For integrity and fingerprints** — checksums, signatures, commit IDs, deduplication — use a fast, collision-resistant function from the **SHA-2 (SHA-256/512) or SHA-3** family. Here speed is a feature: you want to fingerprint gigabytes quickly, and the security rests on collision resistance, not on being slow. Never use MD5 or SHA-1 for anything security-relevant; both have practical collisions.

**For passwords**, invert the goal: you *want* the hash to be **slow and expensive**, so pick a purpose-built password KDF — **bcrypt, scrypt, or Argon2** (Argon2id is today's default). Four ideas work together:

- **Per-user random salt.** A unique random salt is prepended before hashing, so identical passwords produce different digests. This kills rainbow tables outright (a precomputed table would have to be rebuilt per salt) and hides duplicate passwords in the dump. The salt is not secret; store it alongside the hash.
- **A tunable work/cost factor.** The KDF runs many internal iterations; you set the count so a single verification takes tens of milliseconds. Legitimate logins barely notice, but an attacker testing billions of guesses now faces tens of milliseconds *each*, collapsing their throughput by orders of magnitude. As hardware improves, raise the cost.
- **Memory hardness (scrypt, Argon2).** These force each guess to use a large block of RAM. GPUs and ASICs get their speed from massive parallelism with little memory per core, so a memory-hard function starves them: they cannot fan out to thousands of parallel guesses without thousands of copies of that RAM. This is what neutralizes the GPU/ASIC advantage that sinks fast hashes.
- **Peppering and constant-time compare.** An optional secret **pepper**, kept outside the database (in code or an HSM), is mixed in so a database-only leak still lacks a needed input. And compare digests with a **constant-time** equality check so response timing can't leak how many leading bytes matched.

## complexity

- **time:** Hashing is **O(n)** in the length of the input — the function streams the message in fixed-size blocks, doing constant work per block. Verifying a fingerprint is then **O(1)**: you compare two fixed-length digests. Attacking security is exponential: about **2^n** work to invert or find a second preimage, but only **2^(n/2)** to find a collision (the birthday bound), which is why collision resistance drives the choice of output size.
- **space:** **O(1)** working state for the digest itself — a fixed number of internal registers regardless of input size — so you can hash a stream far larger than memory. Password KDFs deliberately break this: memory-hard functions like scrypt/Argon2 use a large, *tunable* amount of RAM per evaluation on purpose, to make parallel attacks costly.
- **notes:** Doubling the digest size roughly squares the attacker's collision work (2^(n/2) grows fast), which is why 256-bit outputs are the modern floor. For passwords the relevant "complexity" is the cost/memory parameter, not the algorithm's asymptotics — you tune it upward over time as hardware gets faster.

## pitfalls

- **Storing unsalted hashes.** Identical passwords collide to identical digests, exposing duplicates and enabling rainbow-table lookups. Fix: prepend a unique, cryptographically random per-user salt (16+ bytes) before hashing and store it next to the digest.
- **Using a fast hash for passwords.** A single SHA-256 pass lets a GPU test billions of guesses per second. Fix: use a slow, memory-hard KDF — Argon2id, scrypt, or bcrypt — with a cost factor tuned so one verification takes tens of milliseconds.
- **Using MD5 or SHA-1 for anything security-relevant.** Both have practical collisions and are broken for signatures and integrity guarantees. Fix: use SHA-256/SHA-512 or SHA-3 for fingerprints; treat MD5/SHA-1 as usable only for non-security checksums.
- **Non-constant-time digest comparison.** A byte-by-byte `==` that returns early leaks, via timing, how many leading bytes matched, enabling incremental forgery. Fix: compare with a constant-time function (`hmac.compare_digest`, `crypto.timingSafeEqual`, `MessageDigest.isEqual`).
- **Rolling your own hash.** A hand-built mixing function has no analyzed security margin and will have avalanche or collision weaknesses. Fix: use vetted standard implementations (SHA-2/SHA-3, Argon2) from a maintained library; never invent the primitive.
- **Treating a hash as reversible encryption.** A hash is one-way and keyless; you cannot "decrypt" a digest back to the input, and it provides no confidentiality on its own. Fix: use a proper cipher (AES-GCM) when you need to recover the data, and reserve hashing for integrity, identity, and password verification.

## interviewTips

- State the three properties precisely and rank them: preimage (2^n), second-preimage (2^n), and collision resistance (2^(n/2), the birthday bound). Being able to say *why* collisions are the cheapest attack — you need any pair, not a fixed target — signals real understanding.
- When asked "how would you store passwords," never say "hash with SHA-256." Say salted, slow, memory-hard KDF (Argon2id/scrypt/bcrypt) with a tuned cost factor and constant-time compare, and explain that speed is the enemy here, not a feature.
- Draw the encryption-vs-hashing line clearly: encryption is keyed and reversible for confidentiality; hashing is keyless and one-way for integrity and identity. Interviewers probe this because conflating them is a common, dangerous mistake.

## keyTakeaways

- A cryptographic hash is a deterministic, one-way map from arbitrary input to a fixed-length digest, valued for integrity and identity, not secrecy — it has no key and cannot be reversed.
- Its security rests on preimage, second-preimage, and collision resistance; collisions must exist by pigeonhole but are infeasible to find, and the birthday bound (2^(n/2)) is why we want large outputs and the avalanche effect.
- Match the function to the job: fast SHA-2/SHA-3 for fingerprints, but a slow, salted, memory-hard KDF (Argon2/scrypt/bcrypt) with a tuned cost and constant-time comparison for passwords.

## code.python

```python
"""Salted password hashing and verification.
Uses PBKDF2-HMAC-SHA256 from the stdlib so this runs with no dependencies.
In PRODUCTION prefer a memory-hard KDF: argon2-cffi (Argon2id) or bcrypt.
"""
import hashlib
import hmac
import os

ITERATIONS = 200_000          # the tunable work/cost factor
SALT_BYTES = 16


def hash_password(password: str) -> dict:
    salt = os.urandom(SALT_BYTES)                 # unique per-user random salt
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, ITERATIONS
    )
    return {"salt": salt.hex(), "iters": ITERATIONS, "digest": digest.hex()}


def verify_password(password: str, stored: dict) -> bool:
    salt = bytes.fromhex(stored["salt"])
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, stored["iters"]
    )
    expected = bytes.fromhex(stored["digest"])
    return hmac.compare_digest(candidate, expected)   # constant-time compare


if __name__ == "__main__":
    record = hash_password("hunter2")
    print("stored salt   =", record["salt"])
    print("stored digest =", record["digest"][:16], "...")
    print("correct pw    ->", verify_password("hunter2", record))   # True
    print("wrong pw      ->", verify_password("password", record))  # False
```

## code.javascript

```javascript
// Salted password hashing and verification in Node.js.
// Uses scrypt (memory-hard, built into node:crypto) with a random salt and a
// constant-time comparison. bcrypt / argon2 packages are also good choices.
const crypto = require("node:crypto");

const KEYLEN = 32;
const SALT_BYTES = 16;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES);            // per-user random salt
  const digest = crypto.scryptSync(password, salt, KEYLEN); // slow + memory-hard
  return { salt: salt.toString("hex"), digest: digest.toString("hex") };
}

function verifyPassword(password, stored) {
  const salt = Buffer.from(stored.salt, "hex");
  const candidate = crypto.scryptSync(password, salt, KEYLEN);
  const expected = Buffer.from(stored.digest, "hex");
  // constant-time compare; length guard avoids a throw on mismatched sizes
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

const record = hashPassword("hunter2");
console.log("stored salt   =", record.salt);
console.log("stored digest =", record.digest.slice(0, 16), "...");
console.log("correct pw    ->", verifyPassword("hunter2", record));  // true
console.log("wrong pw      ->", verifyPassword("password", record)); // false
```

## code.java

```java
// Salted password hashing and verification with PBKDF2-HMAC-SHA256.
// Ships in the JDK (no dependencies). In production prefer Argon2/bcrypt via a
// vetted library; the pattern (random salt + cost factor + constant-time cmp)
// is identical.
import java.security.SecureRandom;
import java.security.MessageDigest;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.util.HexFormat;

public class CryptoHashing {
    static final int ITERATIONS = 200_000;   // tunable work/cost factor
    static final int KEY_BITS = 256;
    static final int SALT_BYTES = 16;

    static byte[] pbkdf2(char[] password, byte[] salt) throws Exception {
        PBEKeySpec spec = new PBEKeySpec(password, salt, ITERATIONS, KEY_BITS);
        SecretKeyFactory f = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        return f.generateSecret(spec).getEncoded();
    }

    static String[] hashPassword(String password) throws Exception {
        byte[] salt = new byte[SALT_BYTES];
        new SecureRandom().nextBytes(salt);                 // per-user random salt
        byte[] digest = pbkdf2(password.toCharArray(), salt);
        HexFormat hex = HexFormat.of();
        return new String[] { hex.formatHex(salt), hex.formatHex(digest) };
    }

    static boolean verify(String password, String saltHex, String digestHex)
            throws Exception {
        HexFormat hex = HexFormat.of();
        byte[] salt = hex.parseHex(saltHex);
        byte[] candidate = pbkdf2(password.toCharArray(), salt);
        byte[] expected = hex.parseHex(digestHex);
        return MessageDigest.isEqual(candidate, expected);  // constant-time compare
    }

    public static void main(String[] args) throws Exception {
        String[] rec = hashPassword("hunter2");
        System.out.println("stored salt   = " + rec[0]);
        System.out.println("stored digest = " + rec[1].substring(0, 16) + " ...");
        System.out.println("correct pw    -> " + verify("hunter2", rec[0], rec[1]));
        System.out.println("wrong pw      -> " + verify("password", rec[0], rec[1]));
    }
}
```

## code.cpp

```cpp
// Self-contained teaching demo of the salted-hash-and-verify PATTERN.
// The mixing function below is an FNV-1a variant folded to 64 bits: it is a
// deterministic STAND-IN, NOT a cryptographic hash. Real code must use a vetted
// library (libsodium's crypto_pwhash = Argon2, or OpenSSL's PKCS5_PBKDF2) with
// a slow, memory-hard KDF and a CSPRNG-generated salt.
#include <cstdint>
#include <iostream>
#include <string>

// Teaching stand-in only — do not use for real password storage.
static uint64_t demo_hash(const std::string& data) {
    uint64_t h = 1469598103934665603ULL;          // FNV offset basis
    for (unsigned char c : data) {
        h ^= c;
        h *= 1099511628211ULL;                     // FNV prime
    }
    return h;
}

static std::string hash_password(const std::string& salt,
                                 const std::string& password) {
    uint64_t h = demo_hash(salt + password);       // salt PREPENDED to input
    char buf[17];
    std::snprintf(buf, sizeof(buf), "%016llx", (unsigned long long)h);
    return std::string(buf);
}

// Constant-time comparison: never early-exits on the first differing byte.
static bool constant_time_eq(const std::string& a, const std::string& b) {
    if (a.size() != b.size()) return false;
    unsigned char diff = 0;
    for (size_t i = 0; i < a.size(); ++i)
        diff |= (unsigned char)(a[i] ^ b[i]);
    return diff == 0;
}

int main() {
    const std::string salt = "x7Qk";              // a real salt is random per user
    const std::string stored = hash_password(salt, "hunter2");
    std::cout << "stored salt   = " << salt << "\n";
    std::cout << "stored digest = " << stored << "\n";
    std::cout << "correct pw    -> "
              << constant_time_eq(hash_password(salt, "hunter2"), stored) << "\n";
    std::cout << "wrong pw      -> "
              << constant_time_eq(hash_password(salt, "password"), stored) << "\n";
    return 0;
}
```
