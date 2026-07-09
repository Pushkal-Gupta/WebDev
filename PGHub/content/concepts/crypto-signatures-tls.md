---
slug: crypto-signatures-tls
module: cryptography
title: Digital Signatures and TLS
subtitle: Sign with the private key, verify with the public key — the trust machinery behind certificates, the chain of trust, and the TLS handshake.
difficulty: Advanced
position: 4
estimatedReadMinutes: 15
prereqs: [crypto-asymmetric-rsa]
relatedProblems: []
references:
  - title: "Dan Boneh — Cryptography I (Coursera)"
    url: "https://www.coursera.org/learn/crypto"
    type: course
  - title: "RFC 8446 — The Transport Layer Security (TLS) Protocol Version 1.3"
    url: "https://www.rfc-editor.org/rfc/rfc8446.html"
    type: article
  - title: "RFC 5280 — Internet X.509 Public Key Infrastructure Certificate"
    url: "https://www.rfc-editor.org/rfc/rfc5280.html"
    type: article
  - title: "Ferguson, Schneier, Kohno — Cryptography Engineering"
    url: "https://www.schneier.com/books/cryptography-engineering/"
    type: book
status: published
---

## intro

A **digital signature** runs public-key cryptography in the opposite direction from encryption: the holder of a **private key** produces a signature over a message, and *anyone* with the matching **public key** can verify it. Encryption hides a message from everyone but the private-key holder; a signature proves a message came from the private-key holder to everyone else. A valid signature gives you three guarantees at once — **authenticity** (the message really came from the key's owner), **integrity** (not one bit was altered in transit), and **non-repudiation** (the signer cannot later deny having signed it, because only they hold the private key). These primitives, wrapped in certificates and chained to trusted roots, are what let your browser open an encrypted connection to a server it has never met.

## whyItMatters

Encryption alone is not enough. If you agree on a secret key with "the server" but an attacker sat in the middle and impersonated it, you have a perfectly encrypted channel straight to the attacker. The missing piece is **authentication of the public key** — knowing that the key you received genuinely belongs to `bank.com` and not to a machine on the coffee-shop Wi-Fi. Signatures and certificates solve exactly this. A **Certificate Authority** signs a statement binding a domain name to a public key; your device already trusts a small set of **root** authorities, so it can verify that binding without ever having talked to the CA. This is what defeats the **man-in-the-middle** attack and turns raw key exchange into a channel you can actually trust with a password or a credit-card number.

## intuition

Start with the mechanical difference between **signing** and **encrypting**, because they are mirror images and confusing them is a classic mistake. To *encrypt* to someone, you transform the message with *their public* key so that only *their private* key can undo it. To *sign*, you go the other way: you first **hash** the message down to a fixed-size digest, then transform that digest with *your own private* key. Verification recomputes the hash from the received message and checks it against the value recovered (or confirmed) using *your public* key. Match means the message is authentic and untouched; mismatch means forged or tampered. You hash first because signing the whole message directly is slow and, with textbook schemes, insecure — the digest is a compact, collision-resistant stand-in for the document.

Now the real problem: **why would you trust a public key you just received over the wire?** Anyone can generate a key pair and claim to be `bank.com`. This is where **certificates** enter. Think of a Certificate Authority as a **notary**: it checks that whoever controls a key really controls the domain, then issues a signed document — the certificate — that says "this public key belongs to `bank.com`," stamped with the CA's own signature. A certificate is just a signed statement binding an identity to a key.

But that only moves the question up a level: why trust the CA? The answer is the **chain of trust**. The server's **leaf** certificate is signed by an **intermediate** CA, whose certificate is in turn signed by a **root** CA. The root's certificate is pre-installed in your operating system or browser **trust store** — a curated list of a few hundred authorities everyone has agreed to trust. Verification walks the chain from leaf up to a root that is already trusted, checking each signature along the way.

With that trust in place, the **TLS handshake** ties it all together: **ClientHello** offers cipher suites and a client random; **ServerHello** picks a suite and sends a server random, the **certificate** chain, and (in TLS 1.3) the server's key share; the client **verifies the chain** up to a trusted root and confirms the certificate's name matches the domain; an **ephemeral key exchange** (ECDHE) mixes both sides' contributions into a shared **symmetric session key**; and from **Finished** onward both sides switch to fast **authenticated encryption** (AES-GCM) for the rest of the conversation.

## visualization

```
TLS 1.3 handshake (time flows downward)

  CLIENT                                   SERVER
    |  ---- ClientHello ------------------->  |   ciphers, client random, key share
    |  <--- ServerHello -------------------   |   chosen suite, server random, key share
    |  <--- Certificate (leaf+chain) ------   |   server's cert + intermediates
    |  [verify chain -> trusted root]         |   local: check sig chain, name, expiry
    |  ==== derive shared session key ====    |   ECDHE: mix both key shares
    |  <--- Finished ----------------------   |   handshake authenticated
    |  ---- Finished --------------------->   |
    |  <=== encrypted application data ===>   |   AES-GCM symmetric channel

SIGN / VERIFY relation:
  sign(m)   : digest = H(m);  sig = transform(digest, PRIVATE key)
  verify(m) : recompute H(m); check against transform(sig, PUBLIC key)
  match  -> authentic + untouched      mismatch -> forged or tampered
```

## bruteForce

The naive approach is to accept whatever public key the other end presents and start encrypting. This "trust on first sight, no verification" model is exactly what a **man-in-the-middle** exploits: the attacker terminates your connection, presents *their* key, opens a second connection to the real server, and reads or rewrites everything in between — both sides see a green padlock. Variants of the same mistake show up constantly in real code: disabling certificate validation to "make it work," skipping the **hostname** check so a valid certificate for `evil.com` is accepted for `bank.com`, ignoring **expiry** and **revocation**, or trusting any certificate the server sends. Each shortcut compiles, connects, and demos perfectly — and silently removes the one guarantee TLS exists to provide.

## optimal

Use **TLS 1.3** with **AEAD** cipher suites (AES-GCM or ChaCha20-Poly1305) and **ECDHE** ephemeral key exchange, and validate the certificate chain completely. Concretely:

**Validate the full chain, not just the leaf.** Walk from the server's leaf certificate up through the intermediates to a **root in your trust store**, checking every signature. Then check the leaf's **hostname** against its Subject Alternative Name, confirm it is within its **validity window** (not expired, not yet valid), and check **revocation** via OCSP stapling or a CRL. A signature that verifies but belongs to the wrong name, or a revoked certificate, must be rejected. Where the threat model warrants it, add **certificate pinning** or rely on **Certificate Transparency** logs to catch mis-issued certificates.

**Sign with modern schemes.** Prefer **Ed25519**, **ECDSA**, or **RSA-PSS** over textbook ("raw") RSA signatures, which are malleable and have well-known padding attacks. Always hash-then-sign with a collision-resistant hash.

**Insist on forward secrecy.** This is why the key exchange is **ephemeral**. With ECDHE, both sides generate fresh Diffie-Hellman key shares *per session* and derive the session key from them; the long-term certificate key only *authenticates* the exchange, it does not *encrypt* it. So if the server's private key is stolen next year, the attacker still cannot decrypt today's recorded traffic — the ephemeral secrets that protected it were thrown away when the session ended. Static-RSA key exchange, where the client encrypts the session key to the server's long-term key, has no such property: one stolen key unlocks every past recorded session.

**Understand the hybrid design.** TLS uses **asymmetric** cryptography only to *authenticate the server and agree on a key*, then switches to **symmetric** AEAD for the bulk of the session because it is orders of magnitude faster. Public-key work is expensive; you do a little of it up front to bootstrap trust, then ride cheap symmetric encryption for everything after. Never disable verification in a production client "just for now" — that single line is how MITM gets back in.

## complexity

- **time:** The handshake is a small, fixed cost: **1-RTT** in TLS 1.3 (one round trip before application data; **0-RTT** on resumption), plus a handful of public-key operations — a signature verification per certificate in the chain and one ECDHE key agreement. Bulk data transfer afterward is symmetric AEAD, effectively **O(n)** in the number of bytes with hardware-accelerated AES.
- **space:** Constant per connection — a few kilobytes for the certificate chain plus small per-session key material and AEAD state; nothing grows with message count.
- **notes:** Chain verification is **O(chain length)** signature checks (typically 2–3: leaf, intermediate, root). The expensive part is the asymmetric bootstrap; amortized over a long session it is negligible, which is exactly why the hybrid design pays off.

## pitfalls

- **Disabling or relaxing certificate validation.** Setting `verify=False`, `rejectUnauthorized: false`, or a trust-all trust manager turns TLS into unauthenticated encryption and re-opens MITM. Fix: never disable verification in production; if a self-signed cert is needed for dev, pin *that specific* certificate rather than trusting everything.
- **Skipping the hostname check.** A certificate can be perfectly valid yet issued for a different domain. Fix: always verify the leaf's SAN matches the host you intended to reach (`check_hostname=True`, and do not override the default hostname verifier).
- **Ignoring expiry and revocation.** An expired or revoked certificate is no longer trustworthy even if its signature verifies. Fix: enforce the validity window and check revocation via OCSP stapling or CRLs; reject on failure rather than warning.
- **No forward secrecy (static key exchange).** Encrypting the session key to a long-term RSA key means one future key compromise decrypts all recorded past traffic. Fix: use ephemeral ECDHE suites so per-session secrets are discarded after use.
- **Trusting user-added or rogue roots.** A malicious or misconfigured root certificate in the trust store makes every forged chain "valid." Fix: keep the trust store curated, be wary of corporate/root installs, and consider pinning for high-value endpoints.
- **Confusing sign with encrypt.** Signing with the *public* key or verifying with the *private* key is a direction error that produces code that "works" in tests but provides no security. Fix: remember sign/decrypt use the **private** key, verify/encrypt use the **public** key.

## interviewTips

- Be able to state the direction crisply: "Encryption uses the recipient's *public* key; a signature uses the signer's *private* key, and you hash the message first." If you can explain *why* signing and encrypting are mirror images, you have shown you understand asymmetric crypto rather than memorizing it.
- Walk the chain of trust out loud — leaf signed by intermediate signed by root, root pre-trusted in the OS/browser store — and connect it to defeating MITM. Interviewers listen for whether you know the trust anchor is the pre-installed root, not the server.
- Explain **forward secrecy** with the concrete failure it prevents: "ECDHE means a stolen long-term key can't decrypt recorded past sessions, because the per-session secrets were ephemeral and discarded." This is the senior-level detail that separates a rote answer from real understanding.

## keyTakeaways

- A digital signature is public-key crypto run backward: sign the hash of a message with the private key, verify with the public key. It delivers authenticity, integrity, and non-repudiation in one operation.
- Certificates and the chain of trust solve the "is this really the server's key?" problem: a CA signs a domain-to-key binding, and verification walks leaf → intermediate → root until it reaches a root already trusted by the device — this is what stops the man-in-the-middle.
- TLS is hybrid: asymmetric crypto authenticates the server and agrees on a key via ephemeral ECDHE (giving forward secrecy), then the session switches to fast symmetric AEAD (AES-GCM) for all application data.

## code.python

```python
"""Connect to an HTTPS server and let Python's ssl module validate the full
certificate chain against the system trust store, with hostname checking ON.
Turning verification off (CERT_NONE / check_hostname=False) is the classic
MITM footgun — the default context below does it correctly.
"""
import socket
import ssl


def fetch_cert(host: str, port: int = 443) -> dict:
    # create_default_context() enables CERT_REQUIRED + hostname checking.
    ctx = ssl.create_default_context()
    ctx.check_hostname = True
    ctx.verify_mode = ssl.CERT_REQUIRED

    with socket.create_connection((host, port), timeout=5) as raw:
        # server_hostname drives both SNI and the hostname (SAN) check.
        with ctx.wrap_socket(raw, server_hostname=host) as tls:
            cert = tls.getpeercert()          # only returned once VERIFIED
            print("TLS version :", tls.version())
            print("cipher      :", tls.cipher()[0])
            print("subject     :", dict(x[0] for x in cert["subject"]))
            print("issuer      :", dict(x[0] for x in cert["issuer"]))
            print("expires     :", cert["notAfter"])
            return cert


if __name__ == "__main__":
    # A valid chain verifies silently; a bad one raises ssl.SSLCertVerificationError.
    fetch_cert("www.rfc-editor.org")
```

## code.javascript

```javascript
// Node.js: crypto.sign / crypto.verify demonstrating the sign-with-private,
// verify-with-public direction using Ed25519 (a modern signature scheme).
// The verifier only holds the PUBLIC key — it can check but never forge.
const crypto = require("crypto");

function main() {
  // Alice generates a key pair; only she keeps privateKey.
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const message = Buffer.from("transfer $100 to Bob");

  // SIGN with the PRIVATE key (Ed25519 hashes internally, pass null algo).
  const signature = crypto.sign(null, message, privateKey);

  // VERIFY with the PUBLIC key — anyone can do this, no secret needed.
  const ok = crypto.verify(null, message, publicKey, signature);
  console.log("valid signature   :", ok); // true

  // Tamper with one byte -> verification fails (integrity guarantee).
  const forged = Buffer.from("transfer $900 to Bob");
  const tampered = crypto.verify(null, forged, publicKey, signature);
  console.log("tampered accepted :", tampered); // false
}

main();
```

## code.java

```java
// Sign-then-verify with Ed25519 via the JCA Signature API. The private key
// signs; the public key verifies. Mixing the two up (verifying with the
// private key) is a direction error that silently provides no security.
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;

public class SignatureDemo {
    public static void main(String[] args) throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("Ed25519");
        KeyPair kp = gen.generateKeyPair();

        byte[] message = "transfer $100 to Bob".getBytes("UTF-8");

        // SIGN with the PRIVATE key.
        Signature signer = Signature.getInstance("Ed25519");
        signer.initSign(kp.getPrivate());
        signer.update(message);
        byte[] sig = signer.sign();

        // VERIFY with the PUBLIC key.
        Signature verifier = Signature.getInstance("Ed25519");
        verifier.initVerify(kp.getPublic());
        verifier.update(message);
        System.out.println("valid signature   : " + verifier.verify(sig)); // true

        // Tampered message fails verification.
        Signature check = Signature.getInstance("Ed25519");
        check.initVerify(kp.getPublic());
        check.update("transfer $900 to Bob".getBytes("UTF-8"));
        System.out.println("tampered accepted : " + check.verify(sig));     // false
    }
}
```

## code.cpp

```cpp
// EDUCATIONAL TOY ONLY — real signatures use Ed25519/ECDSA/RSA-PSS via a
// vetted library (OpenSSL/libsodium). This shows the *direction* of the math
// with tiny RSA numbers so it fits on screen; the moduli are far too small to
// be secure, and there is no real hash. Do NOT use this for anything real.
#include <iostream>
using namespace std;

// Toy RSA key: n = p*q = 3*11 = 33, e = 7 (public), d = 3 (private).
// (e*d) mod phi(33)=20  ->  7*3 = 21 ≡ 1 (mod 20), so this key pair is valid.
long long modpow(long long base, long long exp, long long mod) {
    long long r = 1 % mod;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) r = (r * base) % mod;
        base = (base * base) % mod;
        exp >>= 1;
    }
    return r;
}

int main() {
    const long long n = 33, e = 7, d = 3;

    long long digest = 4; // pretend this is H(message), reduced mod n

    // SIGN with the PRIVATE exponent d.
    long long sig = modpow(digest, d, n);

    // VERIFY with the PUBLIC exponent e: recovered should equal the digest.
    long long recovered = modpow(sig, e, n);

    cout << "digest    : " << digest << "\n";
    cout << "signature : " << sig << "\n";
    cout << "recovered : " << recovered << "\n";
    cout << "valid     : " << (recovered == digest ? "yes" : "no") << "\n";
    return 0;
}
```
