---
slug: jwt-vs-paseto-deep
module: sd-auth-security
title: JWT vs PASETO Deep — alg:none, Key Confusion, kid Injection, Versioned Tokens
subtitle: The three classic JWT footguns (algorithm:none, HS256/RS256 confusion, kid header injection) and how PASETO's versioned-protocol design removes the attack surface entirely.
difficulty: Advanced
position: 412
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "RFC 7519 — JSON Web Token (JWT)"
    url: "https://datatracker.ietf.org/doc/html/rfc7519"
    type: book
  - title: "RFC 8725 — JSON Web Token Best Current Practices"
    url: "https://datatracker.ietf.org/doc/html/rfc8725"
    type: book
  - title: "paseto-standard/paseto-spec — Platform-Agnostic Security Tokens"
    url: "https://github.com/paseto-standard/paseto-spec"
    type: repo
status: published
---

## intro
JWT's three pieces — header, payload, signature — meet at a parser that trusts the header to declare which algorithm verifies the signature. That trust is the source of every JWT CVE you have heard of: `alg:none` skips verification, swapping `RS256` to `HS256` turns the public key into the secret, and forging the `kid` header redirects key lookup to an attacker-controlled file or SQL row. PASETO removes the entire surface by versioning the protocol instead of negotiating the algorithm. A `v4.public` token can only be verified one way; there is no header field to confuse the parser, no algorithm to downgrade, no key-id directory to inject into.

## whyItMatters
JWTs underpin almost every modern API: `Authorization: Bearer eyJ...`. The CVE history is long and unflattering: CVE-2015-9235 (alg:none in node-jsonwebtoken), CVE-2016-10555 (HS256/RS256 key confusion in jwt-go), CVE-2018-0114 (kid injection in cisco-jose), CVE-2022-21449 (Java ECDSA accepting `r=0,s=0` signatures across the OpenJDK JWT ecosystem) — every few years a new library makes the same family of mistakes. Bigtech (Auth0, Okta, Cognito) ship hardened libraries that close these holes, but the moment you write your own verifier or pick an old library off npm, the attack surface returns. PASETO was published in 2018 specifically to make those mistakes structurally impossible, and it has become the default recommendation for new greenfield services that do not need JWT compatibility with the broader ecosystem.

## intuition
The mental model: **JWT trusts the header; PASETO trusts the version**. When a JWT verifier receives `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc`, it base64-decodes the header to learn `{"alg":"HS256"}`, then picks the HMAC-SHA-256 verifier and the corresponding key. If the header says `none`, a naive verifier picks the "no-op" verifier and accepts every token unconditionally. If the header says `HS256` but the server's configured secret is the *public RSA key* (because the server expected `RS256`), the attacker can mint tokens signed with the public key — which they can read from the JWKS endpoint — and the server will accept them. The `kid` header was added so verifiers could look up the right key from a directory, but any field placed before signature verification is *unauthenticated input*: kid `"../../../etc/passwd"` or kid `"' UNION SELECT public_key FROM ..."` are real exploit shapes.

PASETO's design move is to publish a small set of **versioned protocols** — `v3` and `v4` are current — each pinning one purpose (`local` = authenticated encryption with a shared symmetric key, `public` = digital signature with a private/public keypair) and one algorithm tuple. `v4.local` is XChaCha20-Poly1305 + BLAKE2b. `v4.public` is Ed25519. There is no algorithm negotiation. The token is `v4.public.{base64url(payload || signature)}.{optional footer}`; the parser reads the leading version+purpose, dispatches to exactly one verifier, and cannot be tricked into a different one. The `kid` and any other key-routing metadata go in the **footer** — which is *included in the signature*, so any tampering breaks verification. There is no path where a parser does anything with an attacker-controlled field before checking the signature.

The other class of mistake PASETO closes is mixing key types. JWT lets you use the same RSA keypair for signing and encryption; PASETO splits sign-keys and encrypt-keys into entirely different opaque blobs (PASERK formats: `k4.public`, `k4.secret`, `k4.local`), and library APIs refuse to load a sign-key into a verifier slot or an encrypt-key into a signer slot. Type confusion at the API boundary is a compile-time error, not a runtime CVE.

## visualization
```
JWT (HS256) — header is parser input BEFORE signature check
─────────────────────────────────────────────────────────
  header  = base64url({"alg":"HS256","typ":"JWT","kid":"k1"})
  payload = base64url({"sub":"42","exp":1700000000})
  sig     = base64url(HMAC_SHA256(secret_for_kid("k1"),
                                  header + "." + payload))
  token   = header + "." + payload + "." + sig
                              │
              ┌───────────────┘
              ▼  attacker flips alg -> "none", drops sig -> server accepts
              ▼  attacker flips alg HS256<->RS256 -> public key used as MAC secret
              ▼  attacker rewrites kid -> directory traversal / SQLi in key lookup

PASETO v4.public — version+purpose is fixed, no algorithm field
─────────────────────────────────────────────────────────
  header  = "v4.public."   (constant, NOT parser input)
  body    = base64url(payload || Ed25519_sign(sk, "v4.public." || payload || footer || implicit))
  footer  = base64url({"kid":"k1"})    (signed; tamper -> verify fails)
  token   = "v4.public." + body + "." + footer

  verify(token, pk):
    require token.startswith("v4.public.")     # version fixed
    payload, sig = split(decode(body))
    Ed25519_verify(pk, "v4.public." || payload || footer || implicit, sig)
```

## bruteForce
The naive defence is library audits and threat modelling: "use a hardened JWT library, never accept `alg:none`, pin the algorithm allowlist, validate `kid` against a regex, rotate keys, set short expirations." This works until somebody on the team writes the verifier themselves, copies a Stack Overflow snippet, or pulls a JWT library off npm with `tar` in the dependency tree from 2017. The fundamental problem is that JWT's spec *requires* the verifier to read the unauthenticated header before deciding how to verify; library hardening cannot remove the trust boundary, it can only paper over it. Every shop with JWT in production has at least one pen-test ticket asking why a verifier accepted a token with a flipped `alg`.

## optimal
The principled answer is: **pick the right token format for the deployment surface, and pin the verification path so the parser has no choice to make.**

For JWT (where you must use it — federation with third parties, OIDC compliance, existing client base), the production playbook is:

1. **Pin the algorithm allowlist on the verifier side**, never read it from the token header. `jwt.verify(token, key, { algorithms: ['RS256'] })` and refuse anything else. Many libraries make this the default in current versions; old code does not.
2. **Use separate keys for signing and key wrapping**, never the same RSA key for both. Side-step HS256/RS256 confusion by *never configuring an HMAC secret* on a service that expects asymmetric tokens.
3. **Resolve `kid` against a hard-coded, signed JWKS** fetched from a fixed URL at startup, cache by exact kid value, and refuse tokens whose kid is not present in the cache. Never let `kid` flow into a file path, SQL query, or HTTP fetch URL.
4. **Validate every claim**: `iss`, `aud`, `exp`, `nbf`, `iat` are all required checks; missing any of them is the same bug as a missing signature check.
5. **Bind to context where possible**: DPoP (RFC 9449) binds the JWT to a client-held key; mTLS-bound tokens per RFC 8705 bind to a client cert. Both kill the "stolen bearer" replay scenario.

For PASETO (greenfield internal services, no federation requirement), the playbook is much shorter:

1. Pick a version that pairs with your environment: **v4** (NaCl primitives — Ed25519, XChaCha20-Poly1305, BLAKE2b) for new builds, **v3** (NIST primitives — ECDSA-P384, AES-256-CTR + HMAC-SHA-384) when FIPS compliance is required.
2. Pick a purpose per use case: **public** for cross-service tokens where the resource server only needs a public key; **local** for internal session cookies where you can share a symmetric key.
3. Store keys in a KMS or HSM; PASERK gives you a serialisation format for sealed key envelopes, including `k4.seal` (asymmetric wrap of a symmetric key).
4. Validate the standard claims (`exp`, `iat`, `iss`, `aud`, `sub`) the same way you would for JWT.

The crossover question is **migration**. Most shops that go PASETO keep JWT at the OIDC boundary (where the IdP and clients require it) and use PASETO for internal service-to-service tokens. The translation layer is a small middleware that validates the JWT once at the gateway, mints a PASETO with the trust-boundary claims, and forwards. The blast radius of a JWT verifier bug is contained to the gateway; internal services never parse JWT.

## complexity
JWT verify cost: one HMAC-SHA-256 (~5 µs for HS256, 200-byte token) or one RSA-2048 signature verify (~80 µs for RS256) or one ECDSA-P256 verify (~30 µs for ES256). Token size: 200–1500 bytes depending on claims and signature algorithm. PASETO v4.public verify cost: one Ed25519 signature verify (~50 µs) plus BLAKE2b over the header+payload (~1 µs). Token size: typically 150–600 bytes, slightly smaller than equivalent JWT due to omitting the redundant header JSON. Both formats are constant-time per token; throughput is bounded by signature verification, not parsing.

## pitfalls
- **Accepting `alg:none` in any code path.** RFC 8725 §3.1 requires verifiers to refuse `none` unconditionally. Some library APIs treat `none` as a configuration choice; if a verifier object can be constructed with `alg=none`, an attacker who can influence the verifier configuration (via env var, config file, or admin endpoint) escalates immediately.
- **HS256/RS256 algorithm confusion via shared key material.** If your service holds both an HMAC secret and an RSA public key, and the verifier picks the algorithm from the token header, an attacker can sign tokens with HS256 using the RSA public key (which is already public) and the verifier will accept. Mitigation: never configure HMAC secrets on services that expect asymmetric tokens; pin `algorithms: ['RS256']` on every verify call.
- **Using `kid` as a key lookup index without validation.** The `kid` header is unauthenticated input until the signature is checked, but you have to look up the key *to check the signature*. Resolve `kid` only against an exact-match cache populated from a trusted JWKS URL; never substitute it into file paths, SQL, or shell commands.
- **Forgetting to validate `exp`, `nbf`, `iss`, `aud`.** A library that verifies the signature but ignores claims happily accepts a 5-year-old token issued by anyone for any audience. Every verifier must enforce a complete claim policy.
- **Conflating PASETO `local` (encrypted) with PASETO `public` (signed).** `v4.local` payloads are confidential — only key holders can read them. `v4.public` payloads are *readable by anyone*, only the signature is authenticated. Putting a password reset token in `v4.public` and assuming it is confidential is a privacy bug.

## interviewTips
- Lead the comparison with the threat model, not the syntax. "JWT lets the token tell the parser how to verify it; PASETO pins the verifier per version. The first is flexible and historically exploitable; the second is rigid and structurally safe."
- When asked "why is `alg:none` allowed at all," explain that it dates to JWT's design as a generic JOSE wrapper where unsigned tokens had a use case (passing claims between trusted internal components). The deprecation is in RFC 8725 — be ready to cite it.
- Know the migration story. Most shops do not rip JWT out; they keep it at the federation boundary and switch internal traffic to PASETO. Describing this pattern signals real-world experience over textbook knowledge.

## code

### python
```python
import hashlib, hmac, json, base64, time

def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")

def b64u_dec(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)

def jwt_verify_hs256(token: str, secret: bytes, *, leeway: int = 0) -> dict:
    header_b64, payload_b64, sig_b64 = token.split(".")
    header = json.loads(b64u_dec(header_b64))
    if header.get("alg") != "HS256":
        raise ValueError("algorithm not allowed")
    expected = hmac.new(secret, f"{header_b64}.{payload_b64}".encode("ascii"), hashlib.sha256).digest()
    if not hmac.compare_digest(expected, b64u_dec(sig_b64)):
        raise ValueError("signature invalid")
    claims = json.loads(b64u_dec(payload_b64))
    now = int(time.time())
    if "exp" in claims and now > claims["exp"] + leeway:
        raise ValueError("token expired")
    if "nbf" in claims and now < claims["nbf"] - leeway:
        raise ValueError("token not yet valid")
    return claims
```

### javascript
```javascript
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const b64u_dec = (s) => Buffer.from(s, 'base64url');

export function jwtVerifyHs256(token, secret, { leeway = 0, allowed = ['HS256'] } = {}) {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('malformed token');
  const header = JSON.parse(b64u_dec(h));
  if (!allowed.includes(header.alg)) throw new Error('algorithm not allowed');
  const expected = createHmac('sha256', secret).update(`${h}.${p}`).digest();
  const got = b64u_dec(s);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
    throw new Error('signature invalid');
  }
  const claims = JSON.parse(b64u_dec(p));
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && now > claims.exp + leeway) throw new Error('expired');
  if (claims.nbf && now < claims.nbf - leeway) throw new Error('not yet valid');
  return claims;
}
```

### java
```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Set;

public final class Jwt {
    private static final Base64.Decoder B64 = Base64.getUrlDecoder();
    private static final Set<String> ALLOWED = Set.of("HS256");

    public static String verifyHs256(String token, byte[] secret) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length != 3) throw new IllegalArgumentException("malformed");
        String header = new String(B64.decode(parts[0]), StandardCharsets.UTF_8);
        if (!header.contains("\"HS256\"") || !ALLOWED.contains("HS256"))
            throw new SecurityException("algorithm not allowed");

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        byte[] expected = mac.doFinal((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
        byte[] got = B64.decode(parts[2]);
        if (!java.security.MessageDigest.isEqual(expected, got))
            throw new SecurityException("signature invalid");

        return new String(B64.decode(parts[1]), StandardCharsets.UTF_8);
    }
}
```

### cpp
```cpp
#include <openssl/hmac.h>
#include <string>
#include <stdexcept>

static std::string b64url_dec(const std::string& s) {
    std::string padded = s;
    while (padded.size() % 4) padded.push_back('=');
    for (auto& c : padded) { if (c == '-') c = '+'; else if (c == '_') c = '/'; }
    BIO* b64 = BIO_new(BIO_f_base64());
    BIO* mem = BIO_new_mem_buf(padded.data(), (int)padded.size());
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
    BIO_push(b64, mem);
    std::string out(padded.size(), '\0');
    int n = BIO_read(b64, out.data(), (int)out.size());
    BIO_free_all(b64);
    out.resize(n > 0 ? n : 0);
    return out;
}

std::string jwt_verify_hs256(const std::string& token, const std::string& secret) {
    size_t p1 = token.find('.'), p2 = token.find('.', p1 + 1);
    if (p1 == std::string::npos || p2 == std::string::npos) throw std::runtime_error("malformed");
    std::string signing_input = token.substr(0, p2);
    std::string header_json = b64url_dec(token.substr(0, p1));
    if (header_json.find("\"HS256\"") == std::string::npos)
        throw std::runtime_error("algorithm not allowed");

    unsigned char mac[32];
    unsigned mac_len = 0;
    HMAC(EVP_sha256(), secret.data(), (int)secret.size(),
         (const unsigned char*)signing_input.data(), signing_input.size(),
         mac, &mac_len);

    std::string got = b64url_dec(token.substr(p2 + 1));
    if (got.size() != mac_len) throw std::runtime_error("signature invalid");
    unsigned diff = 0;
    for (unsigned i = 0; i < mac_len; ++i) diff |= mac[i] ^ (unsigned char)got[i];
    if (diff != 0) throw std::runtime_error("signature invalid");

    return b64url_dec(token.substr(p1 + 1, p2 - p1 - 1));
}
```
