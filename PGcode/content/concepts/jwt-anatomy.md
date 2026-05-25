---
slug: jwt-anatomy
module: sd-auth-security
title: JWT Anatomy
subtitle: header.payload.signature, HS256 vs RS256, refresh tokens, and the JWT bombing attack.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — JWT in Microservices"
    url: "https://martinfowler.com/articles/microservice-security.html"
    type: blog
  - title: "Microservices.io — Access Token (JWT) Pattern"
    url: "https://microservices.io/patterns/security/access-token.html"
    type: blog
  - title: "donnemartin/system-design-primer — Authentication"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A JSON Web Token is three Base64URL strings joined by dots: `header.payload.signature`. The header names the algorithm (`{"alg":"HS256","typ":"JWT"}`), the payload is JSON claims (`{"sub":"42","exp":1700000000}`), and the signature is computed over `header + "." + payload` with either a shared secret (HMAC) or a private key (RSA / EdDSA). Any holder can read the payload — JWTs are *signed*, not encrypted. Their value is that the server can verify them without a database round trip.

## whyItMatters
JWTs underpin almost every modern stateless API: `Authorization: Bearer eyJhbGciOi...`. They scale because no session table is involved, and they federate because the issuer's public key can be cached anywhere. But the same statelessness is also their main weakness: you cannot revoke a leaked JWT until it expires. Interviewers ask "how do you log a user out?" specifically to see if you understand this trade-off — and if you reach for short expirations + refresh tokens + a server-side denylist, you pass.

## intuition
Think of a JWT as a tamper-evident receipt. The server stamps it once, hands it to the client, and any service in the same trust domain can re-verify the stamp without phoning the issuer. The receipt has an expiry printed on it (`exp`). Anything inside it (`sub`, `roles`, `tenant`) is visible to anyone who picks it up, so do not put secrets in the payload. The signature is the wax seal — change a single byte of the payload and verification fails.

## visualization
A decoded token:

```
HEADER
{"alg":"RS256","kid":"2025-01","typ":"JWT"}

PAYLOAD
{"sub":"user-42","iss":"https://auth.example.com",
 "aud":"api.example.com","exp":1700003600,"iat":1700000000,
 "scope":"read:profile write:posts"}

SIGNATURE
RSA-SHA256(header || "." || payload, private_key)
```

The `kid` (key id) lets the verifier pick the right public key from a JWKS endpoint when the issuer rotates keys.

## bruteForce
"Sessions in a database" — store a session row keyed by an opaque cookie. Easy to revoke (delete the row), but every API call hits the DB. Across a microservice mesh, the auth-DB becomes a single point of failure and a hot path. Caching helps but reintroduces the same staleness JWTs already give you, with worse failure modes.

## optimal
Use short-lived access JWTs (5–15 minutes) signed with **RS256** or **EdDSA** (asymmetric — the issuer holds the private key, every service verifies with the public key from JWKS) for any system where the verifier is not the issuer. Use **HS256** (symmetric, one shared secret) only when one service both issues and verifies. Pair the access token with a longer-lived, *opaque* refresh token stored server-side and rotated on every use. To log a user out: delete the refresh token row and rely on the short access TTL. For instant kill switches, maintain a small per-user `min_issued_at` value and reject any token whose `iat` is older.

## complexity
time: Verification is one HMAC or one public-key RSA verify (microseconds); no I/O once the JWKS is cached.
space: Tokens are 400–1500 bytes; the verifier needs only the issuer's public key (a few KB).
notes: HMAC-SHA256 verify is ~50× faster than RSA-2048; EdDSA is faster than both and uses smaller keys.

## pitfalls
- **`alg: none`** — older libraries accepted unsigned tokens if the header said `none`. Always enforce an allowed-algorithms list.
- **Algorithm confusion** — if you accept both HS256 and RS256 and naively pass the public key to `verify(token, key)`, an attacker can re-sign a token with HS256 using your *public* key as the HMAC secret. Pin the algorithm per-issuer.
- **JWT bombing** — a payload with a billion-laughs-style nested JSON, or a `kid` that points to a 50 MB JWKS, can OOM the verifier. Cap header / payload size before decoding.
- **Putting secrets in claims** — anyone with the token reads the payload.
- **No expiration** — `exp` is optional in the spec but mandatory in practice. Reject tokens without it.

## interviewTips
- When asked "stateless auth," lead with "short access JWT + opaque refresh token rotated on use" — the exact phrase signals you have done this before.
- Know RS256 vs HS256: asymmetric for distributed verification, symmetric for single-service.
- Mention JWKS (`/.well-known/jwks.json`) and `kid`-based key rotation.
- For revocation: short TTL + refresh-token rotation + optional `iat` floor per user.
- Drop "JWT bombing" or "alg-confusion" as the gotcha — interviewers light up.

## code.python
```python
import jwt, time
from jwt import PyJWKClient

# Issue (HS256)
token = jwt.encode(
    {"sub": "user-42", "exp": int(time.time()) + 900, "iat": int(time.time())},
    "shared-secret",
    algorithm="HS256",
)

# Verify (RS256 via JWKS) — pin algorithm to prevent confusion
jwks = PyJWKClient("https://auth.example.com/.well-known/jwks.json")
signing_key = jwks.get_signing_key_from_jwt(token).key
claims = jwt.decode(
    token,
    signing_key,
    algorithms=["RS256"],
    audience="api.example.com",
    issuer="https://auth.example.com",
)
```

## code.javascript
```javascript
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const jwks = jwksClient({ jwksUri: "https://auth.example.com/.well-known/jwks.json" });

function getKey(header, cb) {
  jwks.getSigningKey(header.kid, (err, key) => cb(err, key?.getPublicKey()));
}

jwt.verify(token, getKey, {
  algorithms: ["RS256"],         // pin — never accept "none" or arbitrary algs
  audience: "api.example.com",
  issuer: "https://auth.example.com",
}, (err, decoded) => {
  if (err) return reject(err);
  resolve(decoded);
});
```

## code.java
```java
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwk.JwkProviderBuilder;

var jwks = new JwkProviderBuilder("https://auth.example.com").cached(10, 24, HOURS).build();
var decoded = JWT.decode(token);
var pub = (RSAPublicKey) jwks.get(decoded.getKeyId()).getPublicKey();

var verifier = JWT.require(Algorithm.RSA256(pub, null))
    .withIssuer("https://auth.example.com")
    .withAudience("api.example.com")
    .acceptLeeway(5)
    .build();

var claims = verifier.verify(token);
```

## code.cpp
```cpp
// jwt-cpp: pin the algorithm explicitly to defeat alg-confusion.
#include <jwt-cpp/jwt.h>

auto verifier = jwt::verify()
    .allow_algorithm(jwt::algorithm::rs256(public_pem, "", "", ""))
    .with_issuer("https://auth.example.com")
    .with_audience("api.example.com")
    .leeway(5);

auto decoded = jwt::decode(token);
verifier.verify(decoded);  // throws on bad sig, expired, wrong issuer
auto sub = decoded.get_payload_claim("sub").as_string();
```
