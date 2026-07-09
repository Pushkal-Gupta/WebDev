---
slug: crypto-symmetric
module: cryptography
title: Symmetric Encryption
subtitle: One shared secret key locks and unlocks a message — how block ciphers like AES turn a key into a reversible scramble, and why the mode you wrap them in decides whether it's secure.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 13
prereqs: [crypto-hashing]
relatedProblems: []
references:
  - title: "Dan Boneh — Cryptography I (Coursera)"
    url: "https://www.coursera.org/learn/crypto"
    type: course
  - title: "NIST FIPS 197 — Advanced Encryption Standard (AES)"
    url: "https://csrc.nist.gov/pubs/fips/197/final"
    type: article
  - title: "NIST SP 800-38A — Block Cipher Modes of Operation"
    url: "https://csrc.nist.gov/pubs/sp/800/38/a/final"
    type: article
  - title: "NIST SP 800-38D — GCM (Galois/Counter Mode)"
    url: "https://csrc.nist.gov/pubs/sp/800/38/d/final"
    type: article
status: published
---

## intro

**Symmetric encryption** uses a single secret key for both directions: the same key that scrambles a message (encryption) is the only key that can unscramble it (decryption). Anyone holding the key can read the plaintext; anyone without it sees ciphertext that should look like random noise. The workhorse is a **block cipher** such as **AES**, which transforms a fixed-size chunk of bits — 128 bits for AES — under the control of a key. Because real messages are longer than one block and rarely a neat multiple of the block size, a block cipher is never used alone: it is driven by a **mode of operation** that stitches blocks together safely. Symmetric ciphers are fast, hardware-accelerated, and protect essentially all bulk data in transit and at rest — but they leave one hard question open: how do two parties come to share that secret in the first place?

## whyItMatters

Nearly every byte you send over the internet is protected by symmetric encryption. When you load an HTTPS page, your browser and the server agree on a shared key and then use AES (or ChaCha20) to encrypt the actual traffic — the slow public-key handshake happens once, then the fast symmetric cipher carries the rest. Full-disk encryption, encrypted databases, VPN tunnels, messaging apps, backups, and password vaults all lean on the same primitive. Get it right and terabytes stay confidential at line speed; get it subtly wrong — the wrong mode, a reused nonce, encryption without authentication — and the data leaks or, worse, an attacker silently rewrites it. Understanding symmetric encryption is the difference between "I called the encrypt function" and "I actually protected the data."

## intuition

Picture AES as a **keyed pseudo-random permutation** on 128-bit blocks. A permutation is just a reversible shuffle: it maps every possible 128-bit input to a distinct 128-bit output and back again with no collisions. The key selects *which* shuffle you get out of an astronomically large family of them. Without the key, the output looks like random noise; with the key, the shuffle is perfectly reversible. AES achieves this through repeated **rounds**, each mixing the bits with two ingredients Shannon named: **confusion** (substitution boxes make each output bit a tangled function of the key) and **diffusion** (permutation and mixing spread a single input bit's influence across the whole block, so flipping one plaintext bit changes about half the ciphertext bits).

But AES only handles *one* 128-bit block. Real messages are longer, so you need a **mode of operation** to apply the cipher repeatedly. The naive mode, **ECB** (Electronic Codebook), encrypts each block independently with the same key. That is broken: identical plaintext blocks always produce identical ciphertext blocks, so the *structure* of the data leaks even though individual blocks are scrambled. The infamous "ECB penguin" — an encrypted image whose outline is still perfectly visible — is the canonical demonstration.

The fix is to make each block's encryption depend on more than just the key. **CBC** (Cipher Block Chaining) XORs each plaintext block with the *previous* ciphertext block before encrypting, and seeds the very first block with a random **IV** (initialization vector); now identical blocks encrypt differently. **CTR** (Counter) mode goes further and turns the block cipher into a **stream cipher**: it encrypts a running counter to produce a keystream and XORs that with the plaintext, so it never needs padding and can be parallelized. **GCM** (Galois/Counter Mode) builds on CTR and adds **authentication** — it produces a short tag that lets the receiver detect *any* tampering. This is **AEAD** (Authenticated Encryption with Associated Data): confidentiality and integrity in one operation.

There's a catch symmetric crypto cannot solve on its own: the **key distribution problem**. Both sides must already share the secret before they can talk, and if `N` people each want to talk privately in pairs, they need on the order of `N^2` distinct keys. That combinatorial blowup — and the chicken-and-egg of sharing a secret over an insecure channel — is exactly what public-key cryptography (see the RSA lesson) was invented to solve.

## visualization

```
SYMMETRIC ROUND TRIP  (one KEY does both directions)
  plaintext block ---> [ AES encrypt | KEY ] ---> ciphertext block
  ciphertext block --> [ AES decrypt | KEY ] ---> plaintext block   (recovered)

ECB  (BROKEN: same block -> same cipher, structure leaks)
  P1=AA  P2=BB  P1=AA        ->  C1=7f  C2=e2  C1=7f   <- repeat visible!
  encrypt each block alone with KEY, no chaining

CBC  (IV + chain each block to the one before)
  IV --xor--> P1 -> [E|KEY] -> C1 --xor--> P2 -> [E|KEY] -> C2 ...
  same P1=AA now yields DIFFERENT cipher because the IV/chain differs

CTR / GCM  (keystream from an encrypted counter; GCM adds a TAG)
  keystream = E(KEY, nonce||1), E(KEY, nonce||2), ...
  cipher = plaintext XOR keystream        GCM: verify TAG before trusting
```

## bruteForce

The blunt attack is to guess the key: try every possible key until the ciphertext decrypts to something sensible. AES-128 has a `2^128` keyspace — around `3.4 x 10^38` keys — so brute force is physically infeasible; even billions of machines running for the age of the universe cover a negligible fraction. This is why **DES** fell: its 56-bit key (`2^56`, about 72 quadrillion) was brute-forced in under a day by purpose-built hardware in the late 1990s, retiring it. But brute-forcing the key is rarely the real threat. Weak *usage* breaks strong ciphers: ECB leaks structure regardless of key strength, and reusing an IV or nonce under the same key can expose plaintext or destroy authentication. The cipher is almost never the weak link — the mode and the key handling are.

## optimal

Reach for **authenticated encryption**. The modern default is **AES-256** (or AES-128 — both are safe) in an **AEAD mode**: **AES-GCM**, or **ChaCha20-Poly1305** where hardware AES isn't available. AEAD gives you **confidentiality and integrity together** in one primitive, which matters because encryption *alone* does not stop an attacker from flipping bits or replaying and splicing ciphertext — only a verified authentication tag does. The receiver must **verify the tag before trusting a single byte** of the decrypted plaintext; if the tag check fails, discard everything and do not process the message.

Three rules make or break it. First, **never use ECB** — it leaks structure and offers no integrity. Second, **use a unique IV/nonce for every message under a given key, and never reuse one**. For CTR and GCM this is not a nicety but a hard requirement: reusing a nonce under the same key lets an attacker XOR two ciphertexts to cancel the keystream and recover plaintext relationships, and for GCM it also leaks the authentication subkey, letting the attacker forge messages — a catastrophic, unrecoverable failure. A random 96-bit nonce or a strict per-message counter both work; the rule is *uniqueness*. Third, **derive your keys with a KDF** (like HKDF from a shared secret, or a password hash like Argon2/scrypt from a passphrase) rather than using a raw password or an unstretched value directly.

That leaves the deepest problem: how do the two sides share the key at all? Symmetric crypto assumes the secret already exists on both ends, which does not scale to strangers on the open internet. The answer is to establish the symmetric key using **public-key cryptography** — a Diffie-Hellman key exchange or RSA key transport (see the RSA lesson) — and then switch to fast symmetric encryption for the bulk data. That hybrid is exactly what TLS does on every HTTPS connection.

## complexity

- **time:** AES encryption and decryption run in `O(n)` in the message length `n` — a fixed amount of work per 128-bit block. Modern CPUs have **AES-NI** hardware instructions that push throughput to gigabytes per second, so symmetric encryption is effectively free next to network or disk latency.
- **space:** `O(1)` extra state beyond the message — a key schedule (a few hundred bytes expanded from the key), one block of chaining/counter state, and, for AEAD, a short authentication tag (typically 16 bytes) plus the IV/nonce (typically 12–16 bytes) stored or transmitted alongside the ciphertext.
- **notes:** Security rests on the `2^128` (or `2^256`) keyspace making brute force infeasible, not on any secrecy of the algorithm — AES is fully public. The practical cost is dominated by getting the mode, nonce discipline, and key exchange right, not by the cipher's speed.

## pitfalls

- **Using ECB mode.** Identical plaintext blocks map to identical ciphertext, so patterns and structure leak (the ECB penguin), and ECB provides no integrity at all. Fix: use an AEAD mode (AES-GCM or ChaCha20-Poly1305); never select ECB for real data.
- **Reusing an IV or nonce under the same key.** For CTR/GCM this is catastrophic — two ciphertexts under the same keystream can be XORed to recover plaintext, and GCM additionally leaks its auth key, enabling forgeries. Fix: generate a fresh random 96-bit nonce (or use a strict monotonic counter) per message, and rotate keys before the nonce space is exhausted.
- **Encrypting without authenticating (padding-oracle / tampering).** Plain CBC or CTR with no MAC lets an attacker flip bits or exploit padding-oracle side channels to decrypt data. Fix: always use authenticated encryption (AEAD) and verify the tag before touching the plaintext.
- **Hardcoding keys in source or config.** A key checked into the repo or baked into the binary is a key everyone with the code owns. Fix: load keys from a secrets manager / KMS or environment injection, derive them with a KDF, and rotate them.
- **Using a hash function as a cipher.** A hash is one-way and non-invertible; you cannot decrypt it, and homemade "encrypt by hashing" schemes are trivially broken. Fix: use a real cipher for encryption and reserve hashes for their own jobs (integrity, KDF input, password storage).
- **Getting MAC/encrypt ordering wrong.** Rolling your own MAC-then-encrypt or encrypt-and-MAC composition invites subtle attacks (the secure generic order is encrypt-then-MAC). Fix: don't compose primitives by hand — use a vetted AEAD construction that bakes the correct order in.

## interviewTips

- Be able to state crisply that a block cipher like AES is a *keyed pseudo-random permutation on 128-bit blocks*, and that a *mode of operation* is what safely extends it to messages of any length — then explain why ECB is broken and CBC/CTR/GCM fix it.
- If asked "why not just encrypt?", explain that confidentiality without integrity is insufficient: name **AEAD** (AES-GCM, ChaCha20-Poly1305) and say the receiver must verify the tag *before* trusting the plaintext. Nonce-reuse being catastrophic for GCM is a strong detail to mention.
- Bring up the **key distribution / `O(N^2)` keys** problem as the natural bridge to public-key crypto: symmetric is fast but assumes a shared secret, so real systems use RSA/Diffie-Hellman to establish the key and symmetric ciphers to carry the bulk data (that's TLS).

## keyTakeaways

- Symmetric encryption uses one shared secret key for both encryption and decryption; AES is a keyed pseudo-random permutation on 128-bit blocks whose security comes from a `2^128`+ keyspace, not from hiding the algorithm.
- A block cipher is never used alone — the mode of operation is what makes it secure: ECB leaks structure and is broken, CBC/CTR randomize blocks via an IV/nonce, and AEAD modes (GCM, ChaCha20-Poly1305) add integrity so tampering is detected; unique nonces are mandatory and reuse is catastrophic.
- Symmetric crypto is fast but can't establish the shared key by itself, and pairwise keys grow as `O(N^2)`; public-key cryptography (RSA / Diffie-Hellman) solves key distribution, and real systems combine the two.

## code.python

```python
# Real AES-256-GCM round trip using the `cryptography` library.
#   pip install cryptography
# AESGCM is AEAD: it encrypts AND authenticates. Decryption raises if the
# ciphertext or tag was tampered with, so a valid return means "authentic".
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def demo():
    key = AESGCM.generate_key(bit_length=256)   # 32-byte shared secret
    aesgcm = AESGCM(key)

    plaintext = b"attack at dawn"
    aad = b"header-v1"                           # authenticated, not encrypted
    nonce = os.urandom(12)                       # UNIQUE per message, never reused

    # GCM appends the 16-byte auth tag to the ciphertext automatically.
    ciphertext = aesgcm.encrypt(nonce, plaintext, aad)

    # The SAME key + nonce + aad decrypts and verifies the tag in one step.
    recovered = aesgcm.decrypt(nonce, ciphertext, aad)

    print("plaintext :", plaintext)
    print("ciphertext:", ciphertext.hex())
    print("recovered :", recovered)
    assert recovered == plaintext

    # Any tampering -> decrypt raises InvalidTag (integrity works).
    from cryptography.exceptions import InvalidTag
    tampered = bytearray(ciphertext)
    tampered[0] ^= 0x01
    try:
        aesgcm.decrypt(nonce, bytes(tampered), aad)
        print("ERROR: tamper went undetected")
    except InvalidTag:
        print("tamper detected -> rejected")


if __name__ == "__main__":
    demo()
```

## code.javascript

```javascript
// Real AES-256-GCM round trip with Node's built-in crypto module.
// GCM is AEAD: encrypt produces a ciphertext + a separate 16-byte auth tag
// that the receiver must verify before trusting the plaintext.
const crypto = require("crypto");

function encrypt(key, plaintext, aad) {
  const nonce = crypto.randomBytes(12); // UNIQUE per message, never reused
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(aad);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16-byte integrity tag
  return { nonce, ct, tag };
}

function decrypt(key, aad, { nonce, ct, tag }) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag); // final() throws if the tag doesn't verify
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

function main() {
  const key = crypto.randomBytes(32); // 256-bit shared secret
  const aad = Buffer.from("header-v1");

  const box = encrypt(key, "attack at dawn", aad);
  console.log("ciphertext:", box.ct.toString("hex"));
  console.log("recovered :", decrypt(key, aad, box));

  // Flip a byte -> tag verification fails -> throws (tamper detected).
  const bad = { ...box, ct: Buffer.from(box.ct) };
  bad.ct[0] ^= 0x01;
  try {
    decrypt(key, aad, bad);
    console.log("ERROR: tamper went undetected");
  } catch {
    console.log("tamper detected -> rejected");
  }
}

main();
```

## code.java

```java
// Real AES-256-GCM round trip with the JDK's javax.crypto.
// Cipher "AES/GCM/NoPadding" is AEAD; doFinal on decrypt throws
// AEADBadTagException if the ciphertext or tag was tampered with.
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;

public class CryptoSymmetric {
    static final int TAG_BITS = 128; // 16-byte auth tag

    public static void main(String[] args) throws Exception {
        byte[] key = new byte[32];      // 256-bit shared secret
        byte[] nonce = new byte[12];    // UNIQUE per message, never reused
        SecureRandom rng = new SecureRandom();
        rng.nextBytes(key);
        rng.nextBytes(nonce);

        SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
        byte[] aad = "header-v1".getBytes(StandardCharsets.UTF_8);
        byte[] plaintext = "attack at dawn".getBytes(StandardCharsets.UTF_8);

        // Encrypt: ciphertext has the 16-byte tag appended by the provider.
        Cipher enc = Cipher.getInstance("AES/GCM/NoPadding");
        enc.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(TAG_BITS, nonce));
        enc.updateAAD(aad);
        byte[] ciphertext = enc.doFinal(plaintext);
        System.out.println("recovered : " + new String(decrypt(keySpec, nonce, aad, ciphertext)));

        // Tamper -> doFinal throws (integrity works).
        ciphertext[0] ^= 0x01;
        try {
            decrypt(keySpec, nonce, aad, ciphertext);
            System.out.println("ERROR: tamper went undetected");
        } catch (Exception e) {
            System.out.println("tamper detected -> rejected");
        }
    }

    static byte[] decrypt(SecretKeySpec key, byte[] nonce, byte[] aad, byte[] ct) throws Exception {
        Cipher dec = Cipher.getInstance("AES/GCM/NoPadding");
        dec.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, nonce));
        dec.updateAAD(aad);
        return dec.doFinal(ct); // verifies the tag, then returns plaintext
    }
}
```

## code.cpp

```cpp
// TEACHING STAND-IN ONLY — NOT real AES and NOT secure.
// This is a deterministic keystream XOR (like a toy CTR mode) to show the
// symmetry: the SAME key stream both encrypts and decrypts, because XOR is
// its own inverse. Real production code MUST use a vetted library
// (OpenSSL EVP_aes_256_gcm or libsodium crypto_aead_*) which gives real
// AES, a real nonce, and an authentication tag. Do not ship this.
#include <cstdint>
#include <string>
#include <vector>
#include <iostream>

// Deterministic keystream from key+counter (splitmix-style mixer). A REAL
// cipher replaces this with AES(key, nonce||counter). Toy only.
static uint8_t keystreamByte(uint64_t key, uint64_t counter) {
    uint64_t x = key ^ (counter * 0x9E3779B97F4A7C15ULL);
    x ^= x >> 30; x *= 0xBF58476D1CE4E5B9ULL;
    x ^= x >> 27; x *= 0x94D049BB133111EBULL;
    x ^= x >> 31;
    return static_cast<uint8_t>(x & 0xFF);
}

// Encrypt and decrypt are the SAME operation (XOR is its own inverse) —
// this is the essence of symmetric, keystream-based encryption.
static std::vector<uint8_t> xorCrypt(uint64_t key, const std::vector<uint8_t>& in) {
    std::vector<uint8_t> out(in.size());
    for (size_t i = 0; i < in.size(); ++i)
        out[i] = in[i] ^ keystreamByte(key, static_cast<uint64_t>(i));
    return out;
}

int main() {
    const uint64_t key = 0xC0FFEE123456789ULL; // shared secret (toy)
    std::string msg = "attack at dawn";
    std::vector<uint8_t> plaintext(msg.begin(), msg.end());

    std::vector<uint8_t> ciphertext = xorCrypt(key, plaintext);
    std::vector<uint8_t> recovered  = xorCrypt(key, ciphertext); // same key back

    std::cout << "ciphertext(hex): ";
    for (uint8_t b : ciphertext) std::cout << std::hex << (int)b << ' ';
    std::cout << "\nrecovered      : "
              << std::string(recovered.begin(), recovered.end()) << '\n';
    return 0;
}
```
