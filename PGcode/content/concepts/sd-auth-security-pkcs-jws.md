---
slug: sd-auth-security-pkcs-jws
module: sd-auth-security
title: JWS — JSON Web Signature
subtitle: The signing half of JWT — header.payload.signature with RS256/HS256/EdDSA. How a server verifies a token wasn't tampered with.
difficulty: Intermediate
position: 33
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "IETF RFC 7515 — JSON Web Signature"
    url: "https://datatracker.ietf.org/doc/html/rfc7515"
    type: book
  - title: "Auth0 — JWT signing algorithms"
    url: "https://auth0.com/docs/secure/tokens/json-web-tokens"
    type: blog
  - title: "panva/jose — JOSE for Node.js"
    url: "https://github.com/panva/jose"
    type: repo
status: published
---

## intro
**JSON Web Signature (JWS)** is the cryptographic layer beneath JWT. A token is **`base64url(header).base64url(payload).base64url(signature)`** where the signature covers `header.payload`. The header names the algorithm (`alg`): symmetric (`HS256`), asymmetric (`RS256`, `ES256`, `EdDSA`). RFC 7515 defines the exact wire format. Understanding JWS = understanding how JWT verification actually works.

## whyItMatters
- Every OAuth2 / OIDC implementation rests on JWS. Misconfiguration = token forgery, account takeover.
- The infamous **`alg: none` attack** lets attackers craft valid-looking tokens if the verifier doesn't pin the algorithm.
- The **`alg: HS256` confusion attack** lets attackers use the public key as a shared HMAC secret to forge tokens.
- Knowing how signatures actually work tells you why "rotate keys" matters and how `kid` (key id) headers fit in.

## intuition
A signed token has three parts joined by dots:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature_bytes_base64url
└── header ──────────────────────┘ └── payload ────────────────┘ └── signature ──┘
```

Each is base64url-encoded. The signature covers exactly `header_b64 + "." + payload_b64`.

**HS256** (HMAC-SHA256, symmetric): `signature = HMAC-SHA256(shared_secret, header.payload)`. Both signer + verifier need the same secret.

**RS256** (RSA-SHA256, asymmetric): `signature = RSA-PSS-Sign(private_key, SHA256(header.payload))`. Signer needs private key; verifier needs public key.

**ES256** (ECDSA-P256): elliptic-curve asymmetric. Smaller signatures than RSA, same security.

**EdDSA** (Ed25519): modern, fast, deterministic asymmetric signatures. Recommended for new systems.

## visualization
```
JWS construction (RS256):

  header   = {"alg":"RS256","typ":"JWT","kid":"key-2024-01"}
  payload  = {"sub":"alice","exp":1700000000}

  header_b64  = base64url(json(header))  = "eyJhbGciOiJSUzI1NiIs..."
  payload_b64 = base64url(json(payload)) = "eyJzdWIiOiJhbGljZSIs..."

  signing_input = header_b64 + "." + payload_b64
  signature     = RSA-Sign(private_key, SHA256(signing_input))
  signature_b64 = base64url(signature)

  jwt = header_b64 + "." + payload_b64 + "." + signature_b64

Verification:
  1. Split on '.', base64url-decode each part.
  2. Inspect header.alg → must match expected algorithm (NEVER trust the token's alg).
  3. Look up public key by header.kid in trusted keyset.
  4. RSA-Verify(public_key, SHA256(header_b64 + "." + payload_b64), signature).
  5. If valid → check payload.exp, payload.aud, payload.iss claims.

Attack: alg confusion
  Attacker captures a token signed with RS256.
  Changes header to {"alg":"HS256"}.
  Re-signs with HMAC-SHA256 using the public-key bytes as the HMAC secret.
  Submits to server. Server picks alg from header → HS256 → uses "secret" = the public key → verify passes.
  Fix: pin alg server-side; reject any token whose alg doesn't match expected.
```

## bruteForce
**Don't validate signatures at all**: every token forgeable. Embarrassing but historically common bug.

**Hardcode `HS256` everywhere with a static secret**: works at small scale; key rotation impossible; secret leak = total compromise.

**Use `alg: none`**: don't.

A well-configured library with explicit algorithm pinning is the right answer.

## optimal
**Signing**:
- Pick `RS256` or `EdDSA` for inter-service tokens.
- Use `HS256` only when signer + verifier are the same trust boundary AND you can rotate the secret.
- Always include `kid` in header for key rotation support.

**Verifying**:
- **PIN the algorithm**. Library calls like `jwt.verify(token, key, { algorithms: ['RS256'] })`. NEVER let the token's header dictate alg.
- **Validate `exp`**: reject expired.
- **Validate `aud`**: reject tokens issued for other audiences.
- **Validate `iss`**: reject tokens from untrusted issuers.
- **Use a JWKS endpoint**: fetch public keys from `https://issuer/.well-known/jwks.json`; rotate without code changes.

**Key rotation flow**:
1. Generate new key pair, add to JWKS with new `kid`.
2. Wait propagation (cache TTL + grace period).
3. Signer switches to new private key, includes new `kid` in JWT headers.
4. Old key remains in JWKS until all in-flight tokens expire.
5. Remove old key from JWKS.

**Symmetric (HS256) keys**:
- Min 256 bits of entropy.
- Stored in secret manager (Vault, AWS Secrets Manager), never in code.
- Rotated quarterly minimum.

## complexity
- **Sign HS256**: ~10μs per token.
- **Sign RS256**: ~1ms per token (RSA is slow).
- **Sign EdDSA**: ~50μs per token.
- **Verify RS256**: ~50μs per token (verify is fast; sign is slow).
- **Token size**: HS256 typical 200B, RS256/EdDSA 300-400B.

## pitfalls
- **`alg: none` accepted by verifier.** Some legacy libraries treat "none" as valid → attacker omits signature entirely. Fix: explicitly pass an algorithm allow-list in verify call; reject if alg is "none" or not in list.
- **Algorithm confusion (RS256 → HS256).** Attacker swaps the header alg to HS256 and HMAC-signs with the RSA public key. Fix: pin the algorithm in the verifier; never read `alg` from the token to choose verifier.
- **No `kid` → bad rotation experience.** Without key id, verifier doesn't know which key to use during rotation. Fix: always emit `kid`; verifier looks it up in JWKS.
- **JWKS fetched on every request.** Performance disaster. Fix: cache JWKS with a TTL (1-24h) + a "refresh on unknown kid" fallback.
- **Long-lived JWTs.** A JWT can't be revoked before expiry; long lifetime = long attack window if leaked. Fix: short access tokens (5-15 min) + refresh tokens stored server-side.
- **Putting sensitive data in payload.** JWT is signed, not encrypted — anyone with the token reads the payload. Fix: keep payload to identity claims; for confidential data use JWE (JSON Web Encryption) or separate API call.

## interviewTips
- For "how does JWT verification work" → JWS signature over header.payload + algorithm pinning.
- Cite the **`alg: none`** and **algorithm confusion** attacks as the must-know failure modes.
- For senior interviews, discuss **JWKS rotation**, **EdDSA vs RSA performance**, **short-lived tokens + refresh**, **JWE for confidentiality**, **token binding** for proof-of-possession.

## code.python
```python
# PyJWT
import jwt
from cryptography.hazmat.primitives import serialization

private_pem = open('private.pem', 'rb').read()
public_pem = open('public.pem', 'rb').read()

token = jwt.encode({'sub': 'alice', 'exp': time.time() + 900}, private_pem, algorithm='RS256', headers={'kid': 'key-2024-01'})

# Verify — pin algorithm
try:
    payload = jwt.decode(token, public_pem, algorithms=['RS256'], audience='my-api', issuer='https://auth.example.com')
except jwt.ExpiredSignatureError:
    raise
except jwt.InvalidTokenError:
    raise
```

## code.javascript
```javascript
// jose
import { SignJWT, jwtVerify, createLocalJWKSet, createRemoteJWKSet } from 'jose';
import { readFileSync } from 'fs';

const privateKey = await importPKCS8(readFileSync('private.pem', 'utf8'), 'RS256');

const jwt = await new SignJWT({ sub: 'alice' })
  .setProtectedHeader({ alg: 'RS256', kid: 'key-2024-01' })
  .setIssuedAt()
  .setExpirationTime('15m')
  .sign(privateKey);

// Verify against JWKS
const JWKS = createRemoteJWKSet(new URL('https://auth.example.com/.well-known/jwks.json'));
const { payload } = await jwtVerify(jwt, JWKS, {
  algorithms: ['RS256'],
  audience: 'my-api',
  issuer: 'https://auth.example.com',
});
```

## code.java
```java
// Auth0 java-jwt
JWTVerifier verifier = JWT.require(Algorithm.RSA256(publicKey, null))
    .withIssuer("https://auth.example.com")
    .withAudience("my-api")
    .build();
DecodedJWT jwt = verifier.verify(token);
// throws JWTVerificationException if signature/iss/aud/exp fail
```

## code.cpp
```cpp
// libjwt
#include <jwt.h>
jwt_t* jwt = nullptr;
if (jwt_decode(&jwt, token.c_str(), public_key, public_key_len) != 0) {
    // invalid signature
}
if (jwt_get_alg(jwt) != JWT_ALG_RS256) {
    // algorithm confusion attack — reject
}
const char* sub = jwt_get_grant(jwt, "sub");
jwt_free(jwt);
```
