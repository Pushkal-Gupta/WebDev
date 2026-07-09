---
slug: crypto-asymmetric-rsa
module: cryptography
title: Public-Key Cryptography and RSA
subtitle: Publish a lock the whole world can snap shut, keep the only key that opens it — how a public/private key pair dissolves the shared-secret problem, worked through tiny textbook RSA.
difficulty: Advanced
position: 3
estimatedReadMinutes: 15
prereqs: [crypto-symmetric]
relatedProblems: []
references:
  - title: "Dan Boneh — Cryptography I (Coursera)"
    url: "https://www.coursera.org/learn/crypto"
    type: course
  - title: "RFC 8017 — PKCS #1: RSA Cryptography Specifications v2.2"
    url: "https://www.rfc-editor.org/rfc/rfc8017.html"
    type: article
  - title: "Rivest, Shamir, Adleman — A Method for Obtaining Digital Signatures (1978)"
    url: "https://people.csail.mit.edu/rivest/Rsapaper.pdf"
    type: article
  - title: "Ferguson, Schneier, Kohno — Cryptography Engineering"
    url: "https://www.schneier.com/books/cryptography-engineering/"
    type: book
status: published
---

## intro

**Public-key cryptography** splits the single shared secret of symmetric encryption into two mathematically linked halves: a **public key** you hand out freely and a **private key** you never reveal. Anyone can encrypt a message to you using your public key, but only your matching private key can decrypt it — the public key locks, the private key unlocks, and knowing the public one gives no practical shortcut to the private one. **RSA**, named for Rivest, Shamir, and Adleman, was the first widely deployed scheme of this kind. Its security rests on a lopsided arithmetic fact: multiplying two large prime numbers is trivial, but recovering those primes from their product is, for big enough numbers, computationally hopeless.

## whyItMatters

Symmetric encryption is fast and strong, but it has a chicken-and-egg flaw: both sides must already share the same secret key before they can exchange a single private byte. How do two strangers agree on that key over a wire an eavesdropper is watching? Couriers, sealed envelopes, and pre-arranged code books do not scale to a planet of billions of connections opened every second between parties who have never met. Public-key cryptography dissolves this problem completely. You publish your public key in the open — on a website, in a directory, printed on a business card — and anyone, with zero prior contact, can send you a message only you can read. No pre-shared secret, no secure channel needed to bootstrap the first one. This single idea is what makes HTTPS, secure email, signed software updates, and the entire trust fabric of the modern internet possible.

## intuition

Start with the picture, not the algebra. Imagine you manufacture thousands of identical **open padlocks** and scatter them everywhere — mail them to friends, leave them in a public bin. Anyone who wants to send you something locks their box with one of your padlocks and ships it. Snapping a padlock shut needs no key; only *opening* it does, and you alone hold that key. An eavesdropper who intercepts the box, and even one who has a padlock of their own, still cannot open it. The padlock is your **public key**; the one key in your pocket is your **private key**.

RSA turns that padlock into arithmetic using a **one-way function with a trapdoor** — easy to compute forward, hard to reverse, *unless* you hold a secret shortcut. The one-way step is multiplying primes. Pick two primes and multiply them; recovering the primes by factoring the product is the hard direction, and the trapdoor is a secret exponent that undoes the encryption without factoring anything.

Walk the tiny textbook numbers. Choose primes **p = 3** and **q = 11**. Their product is the modulus **n = p·q = 33**. Compute **φ(n) = (p − 1)(q − 1) = 2 · 10 = 20**. Pick a public exponent **e = 7**, which shares no common factor with 20. Now find the private exponent **d** such that **e·d ≡ 1 (mod 20)**: here **d = 3**, because **7 · 3 = 21 = 20 + 1 ≡ 1 (mod 20)**. Your **public key is (n = 33, e = 7)** and your **private key is (n = 33, d = 3)**.

To encrypt a message **m = 4**, raise it to the public exponent modulo n: **c = 4⁷ mod 33 = 16384 mod 33 = 16**. To decrypt, raise the ciphertext to the private exponent: **16³ mod 33 = 4096 mod 33 = 4** — the original message returns. This is **modular exponentiation**: repeated multiply-and-reduce so numbers never blow up. Why does encrypting with e then decrypting with d land you back home? Because e and d are inverses mod φ(n), and Euler's theorem (a generalization of Fermat's little theorem) guarantees that raising m to e·d ≡ 1 collapses to m itself mod n. Crucially, **real RSA uses 2048- to 4096-bit numbers**, and the toy version above — "raw" or "textbook" RSA — is insecure: it is deterministic and structure-revealing, so production always wraps messages in randomized padding like **OAEP** before encrypting.

## visualization

```
KEY GENERATION
  p = 3, q = 11                 (two secret primes)
  n   = p * q      = 33         (public modulus)
  phi = (p-1)(q-1) = 20         (Euler totient, kept secret)
  e   = 7                       (public exponent, gcd(e, phi) = 1)
  d   = 3                       (private exponent, e*d = 21 = 1 mod 20)

  PUBLIC  KEY = (n=33, e=7)      <- publish to everyone
  PRIVATE KEY = (n=33, d=3)      <- never reveal

ENCRYPT   c = m^e mod n     ->  4^7  mod 33 = 16384 mod 33 = 16
DECRYPT   m = c^d mod n     ->  16^3 mod 33 =  4096 mod 33 =  4   (recovered!)
```

## bruteForce

The direct attack on RSA is to **factor the public modulus n back into its primes p and q**. Once an attacker has p and q, they recompute φ(n), then derive the private exponent d exactly as the owner did — game over. For the toy n = 33 this is instant: anyone spots 33 = 3 · 11 by inspection. That is precisely why key size matters. For a 2048-bit modulus (a 617-digit number) no known classical algorithm factors it in feasible time; the best general method, the number field sieve, would run for far longer than the age of the universe. RSA breaks not when the math is wrong but when keys are too small, primes are chosen with weak randomness (making them guessable or close together), or — a real-world disaster — two different keys accidentally share a prime, letting an attacker recover both with a single GCD.

## optimal

In practice you almost never encrypt real data with RSA directly. Public-key operations are slow and RSA can only encrypt messages smaller than the modulus, so the standard design is **hybrid encryption**: use RSA (2048-bit or larger) or an elliptic-curve exchange to transport a freshly generated *random symmetric key*, then encrypt the actual payload with a fast authenticated cipher like **AES-GCM**. You get the best of both worlds — the public-key half solves key distribution and bootstraps trust between strangers, while the symmetric half does the bulk work at gigabytes per second. This is exactly what happens in every TLS handshake.

Several rules are non-negotiable. **Always use OAEP padding** for RSA encryption; never raw textbook RSA, which is deterministic (the same message always encrypts to the same ciphertext, leaking equality), structurally revealing, and malleable (an attacker can tamper with ciphertexts in predictable ways). For key agreement prefer **authenticated, ephemeral Diffie–Hellman** (ECDH) so that each session uses a throwaway key — this gives **forward secrecy**, meaning a later compromise of the long-term private key cannot decrypt past recorded traffic. For signatures, RSA-PSS and Ed25519 are the modern choices.

The field is steadily moving toward **elliptic-curve cryptography**, which achieves equivalent security with dramatically smaller keys (a 256-bit ECC key rivals a 3072-bit RSA key), meaning faster operations and less bandwidth. Looming over all of it is the quantum question: **Shor's algorithm** would, on a sufficiently large quantum computer, factor integers and break elliptic curves efficiently, which is why post-quantum schemes are now being standardized. The takeaway is that RSA remains foundational and widely deployed, but new systems increasingly reach for ECC today and post-quantum algorithms for tomorrow.

## complexity

- **time:** Encryption and decryption are **modular exponentiation**, done by square-and-multiply in **O(log e)** modular multiplications (each multiply/reduce on k-bit numbers costs up to O(k²) with schoolbook arithmetic). Key generation is dominated by **prime generation** — repeatedly drawing random candidates and primality-testing them until two primes of the right size are found.
- **space:** Keys, ciphertext, and intermediate values are all O(k) bits for a k-bit modulus; modexp needs only a handful of k-bit scratch registers, so memory is negligible.
- **notes:** Security does not come from these costs but from the *asymmetry* between them and the attacker's work: multiplying primes is polynomial, while **factoring the product is believed to be super-polynomial** classically. That one-way gap is the entire foundation — if fast factoring is ever found (or a large quantum computer runs Shor's algorithm), RSA falls regardless of how efficient the honest operations are.

## pitfalls

- **Using raw / textbook RSA with no padding.** Deterministic, structure-revealing, and malleable — identical plaintexts produce identical ciphertexts, and attackers can manipulate ciphertexts predictably. *Fix:* always encrypt with **OAEP** padding and sign with **PSS**; never call a "plain" RSA primitive on real data.
- **Small or reused primes / a shared prime across keys.** Small moduli factor instantly; two keys that accidentally share a prime are both recoverable by a single GCD of their moduli. *Fix:* generate **fresh, independent primes** from a strong source for every key, each at least 1024 bits (so n is 2048+ bits).
- **Weak randomness in key or padding generation.** Predictable primes or predictable OAEP nonces collapse the whole scheme — an attacker who can reproduce your randomness reproduces your keys. *Fix:* use a **cryptographically secure RNG** (`secrets`, `/dev/urandom`, the OS CSPRNG), never a plain PRNG seeded by time or PID.
- **Encrypting bulk data directly with RSA.** RSA is slow and cannot encrypt anything larger than the modulus; misusing it this way tempts developers into insecure chaining. *Fix:* use **hybrid encryption** — RSA/ECDH to move a random AES key, then AES-GCM for the payload.
- **Not verifying padding correctly (Bleichenbacher-style oracles).** Leaking whether padding was valid via error messages or timing lets an attacker decrypt ciphertexts one query at a time. *Fix:* use constant-time, non-branching padding checks and a vetted library that already hardens against these oracles.
- **Tiny public exponents on unpadded messages.** A very small e (like 3) on small unpadded plaintexts can let an attacker take a plain integer root and recover the message, or combine several ciphertexts (Håstad's attack). *Fix:* use a standard exponent such as 65537 **and** proper OAEP padding.

## interviewTips

- Explain the core asymmetry in one breath: **multiplying two primes is easy, factoring their product is hard**, and RSA's public/private pair are exponents that are inverses mod φ(n). Being able to say *why* encrypting with e then d recovers m (Euler's theorem, e·d ≡ 1 mod φ(n)) signals real understanding, not memorized steps.
- When asked "why not just use RSA for everything," reach for **hybrid encryption** and speed: public-key ops are slow and size-limited, so RSA/ECDH moves a random symmetric key and AES-GCM does the bulk work. Mention forward secrecy via ephemeral keys as the senior-level detail.
- Flag **textbook RSA as insecure** unprompted — deterministic, malleable, needs OAEP — and note the trajectory toward ECC (smaller keys) and post-quantum concerns (Shor's algorithm). Naming these shows you track the field, not just the 1978 paper.

## keyTakeaways

- A public/private key pair lets anyone encrypt to you with the freely published public key while only your secret private key decrypts — eliminating the pre-shared-secret requirement that limits symmetric crypto.
- RSA's security is a one-way trapdoor: multiplying primes is easy, factoring the product is infeasible at 2048+ bits; encryption is m^e mod n and decryption is c^d mod n, where e and d are inverses mod φ(n).
- Never ship textbook RSA — use OAEP padding, prefer hybrid encryption (public-key to move a random AES key, then AES-GCM), and know that ECC and post-quantum schemes are the direction of travel.

## code.python

```python
# Educational textbook RSA with tiny numbers. NOT SECURE — production code must
# use a vetted library (e.g. `cryptography`) with OAEP padding and 2048+ bit keys.

def rsa_demo():
    p, q = 3, 11
    n = p * q                       # 33  -> public modulus
    phi = (p - 1) * (q - 1)         # 20  -> Euler totient (secret)
    e = 7                           # public exponent, gcd(e, phi) == 1
    d = 3                           # private exponent: e*d = 21 = 1 (mod 20)

    public, private = (n, e), (n, d)
    print("public key :", public)
    print("private key:", private)

    m = 4
    c = pow(m, e, n)                # encrypt: 4^7 mod 33 = 16
    recovered = pow(c, d, n)        # decrypt: 16^3 mod 33 = 4

    print(f"encrypt {m} -> {c}")    # 16
    print(f"decrypt {c} -> {recovered}")
    assert recovered == m
    print("round trip ok:", recovered == m)


if __name__ == "__main__":
    rsa_demo()
```

## code.javascript

```javascript
// Educational textbook RSA with tiny numbers. NOT SECURE — production code must
// use a vetted library (e.g. WebCrypto) with OAEP padding and 2048+ bit keys.

// BigInt modular exponentiation via square-and-multiply.
function modpow(base, exp, mod) {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

function rsaDemo() {
  const p = 3n, q = 11n;
  const n = p * q;                 // 33  -> public modulus
  const phi = (p - 1n) * (q - 1n); // 20  -> Euler totient (secret)
  const e = 7n;                    // public exponent
  const d = 3n;                    // private: e*d = 21 = 1 (mod 20)

  console.log("public key :", [n, e]);
  console.log("private key:", [n, d]);

  const m = 4n;
  const c = modpow(m, e, n);       // encrypt: 4^7 mod 33 = 16
  const recovered = modpow(c, d, n); // decrypt: 16^3 mod 33 = 4

  console.log(`encrypt ${m} -> ${c}`);
  console.log(`decrypt ${c} -> ${recovered}`);
  console.log("round trip ok:", recovered === m);
}

rsaDemo();
```

## code.java

```java
// Educational textbook RSA with tiny numbers. NOT SECURE — production code must
// use a vetted library (java.security / Cipher "RSA/ECB/OAEPWith...") with 2048+ bit keys.

import java.math.BigInteger;

public class RsaDemo {
    public static void main(String[] args) {
        BigInteger p = BigInteger.valueOf(3);
        BigInteger q = BigInteger.valueOf(11);
        BigInteger n = p.multiply(q);                         // 33
        BigInteger phi = p.subtract(BigInteger.ONE)
                          .multiply(q.subtract(BigInteger.ONE)); // 20
        BigInteger e = BigInteger.valueOf(7);                 // public exponent
        BigInteger d = BigInteger.valueOf(3);                 // e*d = 21 = 1 (mod 20)

        System.out.println("public key : (" + n + ", " + e + ")");
        System.out.println("private key: (" + n + ", " + d + ")");

        BigInteger m = BigInteger.valueOf(4);
        BigInteger c = m.modPow(e, n);          // encrypt: 4^7 mod 33 = 16
        BigInteger recovered = c.modPow(d, n);  // decrypt: 16^3 mod 33 = 4

        System.out.println("encrypt " + m + " -> " + c);
        System.out.println("decrypt " + c + " -> " + recovered);
        System.out.println("round trip ok: " + recovered.equals(m));
    }
}
```

## code.cpp

```cpp
// Educational textbook RSA with tiny numbers. NOT SECURE — production code must
// use a vetted library (OpenSSL / libsodium) with OAEP padding and 2048+ bit keys.

#include <iostream>

// Modular exponentiation via square-and-multiply. long long is safe here only
// because the numbers are tiny; real RSA needs big-integer arithmetic.
long long modpow(long long base, long long exp, long long mod) {
    long long result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) result = (result * base) % mod;
        base = (base * base) % mod;
        exp >>= 1;
    }
    return result;
}

int main() {
    long long p = 3, q = 11;
    long long n = p * q;                 // 33  -> public modulus
    long long phi = (p - 1) * (q - 1);   // 20  -> Euler totient (secret)
    long long e = 7;                     // public exponent
    long long d = 3;                     // private: e*d = 21 = 1 (mod 20)

    std::cout << "public key : (" << n << ", " << e << ")\n";
    std::cout << "private key: (" << n << ", " << d << ")\n";

    long long m = 4;
    long long c = modpow(m, e, n);          // encrypt: 4^7 mod 33 = 16
    long long recovered = modpow(c, d, n);  // decrypt: 16^3 mod 33 = 4

    std::cout << "encrypt " << m << " -> " << c << "\n";
    std::cout << "decrypt " << c << " -> " << recovered << "\n";
    std::cout << "round trip ok: " << (recovered == m) << "\n";
    return 0;
}
```
