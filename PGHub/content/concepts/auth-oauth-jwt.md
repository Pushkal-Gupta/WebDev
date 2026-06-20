---
slug: auth-oauth-jwt
module: sd-auth-security
title: Auth — OAuth, JWT, Sessions
subtitle: Three modern authentication flavors, when each fits, and the bugs that bite you in production.
difficulty: Intermediate
position: 11
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Architecture & enterprise patterns"
    url: "https://martinfowler.com/tags/application%20architecture.html"
    type: book
  - title: "High Scalability — All-time greatest hits"
    url: "http://highscalability.com/all-time-favorites/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
"How does the server know who you are?" has three common answers: **sessions** (server stores state, client carries a cookie ID), **JWTs** (signed token, all state inside, server stores nothing), **OAuth 2.0** (delegated authorization — let App X act on Service Y's behalf without sharing passwords). Picking the wrong one is the source of half of all auth bugs.

## whyItMatters
Auth is a daily decision in every real backend. Get it right and you sleep. Get it wrong and you get either OWASP-top-10 bugs or unscalable monoliths. Every senior interview asks at least one auth question — and the right answer always depends on whether you have many devices, federated identity, browser vs mobile, and whether revocation matters.

## intuition
- **Session**: web server gives you a random `sessionid=abc123` cookie. Server keeps a table `{abc123 → user_id, expires_at}`. Every request looks up the row. Logout / revoke = delete the row.
- **JWT**: server signs `{user_id, exp, ...}` with a secret. Client carries the token. Server verifies the signature on each request — no DB hit. Revocation is hard because the token is self-contained.
- **OAuth 2.0**: user clicks "Sign in with Google." Browser redirects to Google, user approves scope, Google redirects back with a code, your server exchanges the code for an access token + refresh token. Now your app can call Google APIs without ever seeing the password.

## visualization
```
SESSION                          JWT                              OAUTH 2.0
─────                            ───                              ────────
Login → store row in DB          Login → server signs token       User → "Sign in with Google"
Cookie: sessionid=abc            Header: Bearer eyJ...            ↓ redirect to Google
Each req: SELECT FROM sessions   Each req: verify signature       ↓ user approves
Logout: DELETE row               Logout: client drops token       ↓ Google → callback with code
                                 (Server can't really revoke      ↓ Server exchanges code for token
                                  unless you add a blocklist)     ↓ Server stores tokens, makes API calls
```

## bruteForce
HTTP basic auth — send `Authorization: Basic <base64(user:pass)>` on every request. Works for internal tools. Catastrophic for the public web: the password travels with every call, no proper logout, no expiry, MITM-vulnerable without TLS, no revocation.

## optimal
**Sessions** — best for: traditional web apps where the server has a DB and a session store. Use HttpOnly + Secure + SameSite=Lax cookies. Store sessions in Redis with TTL. Rotate session ID on privilege escalation (e.g., after login).

**JWT** — best for: stateless APIs, microservices that don't share a session store, mobile apps. Use short-lived access tokens (5–15min) + long-lived refresh tokens (revocable, stored server-side). NEVER use `alg: none`. Use RS256/ES256 in multi-service setups so consumers verify with a public key but only the auth service holds the signing key. Add a `jti` claim for blocklist-based revocation.

**OAuth 2.0** — best for: third-party login (Google/GitHub/etc.), letting your app act on user's behalf in another service. Use the **Authorization Code with PKCE** flow for any client where you can't fully protect a secret (SPAs, mobile). NEVER ship the client_secret in a browser bundle. Use the **state** parameter to defeat CSRF on the callback.

**Refresh tokens** — pair with short access tokens. Refresh tokens are bearer credentials too — store them HttpOnly cookie or platform secure storage. Rotate on every refresh. Detect reuse → kill the family.

## complexity
- **Per-request cost**: session = 1 store lookup (~1ms with Redis). JWT = 1 signature verify (~µs). OAuth = same as JWT once you have the token.
- **Scaling**: JWTs scale horizontally with zero shared state. Sessions need a shared cache.
- **Revocation latency**: session = instant. JWT = up to access-token TTL unless you maintain a blocklist.

## pitfalls
- **JWT in localStorage**: XSS-vulnerable. Use HttpOnly cookies + CSRF protection.
- **`alg: none` accepted**: many libs default to permissive. Pin the algorithm at verification time.
- **No expiry**: tokens that never expire are credentials forever. Always set `exp`.
- **Refresh token reuse**: detect a reused refresh token → revoke the entire family.
- **OAuth without `state`**: CSRF on the callback hands an attacker access.
- **Mixing user identity with API authorization**: OAuth is for *delegated access*, not for "is this user logged in." Use OpenID Connect (OIDC, built on OAuth) for identity.
- **Storing JWT signing key in env var without rotation plan**: leak it once, every issued token is forged-able. Rotate keys; use JWKS endpoint for public-key distribution.

## interviewTips
- For "design login" — propose sessions for a server-rendered app, JWT + refresh for a mobile/SPA API, and OIDC for federated identity.
- Mention **HttpOnly + Secure + SameSite** without prompting — cookie security is table-stakes.
- For senior interviews, walk through the **Authorization Code + PKCE** flow on a whiteboard.
- Distinguish **authentication** ("who are you") from **authorization** ("what can you do") — OAuth is the latter; people conflate the two.

## code.python
```python
# JWT issuance + verification with python-jose.
from jose import jwt
import os, time

SECRET = os.environ['JWT_SECRET']

def issue(user_id, ttl=900):
    return jwt.encode({ 'sub': user_id, 'exp': int(time.time()) + ttl }, SECRET, algorithm='HS256')

def verify(token):
    try:
        return jwt.decode(token, SECRET, algorithms=['HS256'])  # rejects 'none'
    except jwt.JWTError:
        return None
```

## code.javascript
```javascript
// Express middleware: JWT auth.
const jwt = require('jsonwebtoken');
function authJWT(req, res, next) {
  const header = req.header('Authorization') || '';
  const token = header.replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).end();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch { res.status(401).end(); }
}
```

## code.java
```java
import io.jsonwebtoken.*;
class Auth {
    static String issue(String userId, String secret) {
        return Jwts.builder().setSubject(userId)
            .setExpiration(new java.util.Date(System.currentTimeMillis() + 900_000))
            .signWith(SignatureAlgorithm.HS256, secret.getBytes())
            .compact();
    }
    static Claims verify(String token, String secret) {
        return Jwts.parser().setSigningKey(secret.getBytes()).parseClaimsJws(token).getBody();
    }
}
```

## code.cpp
```cpp
// Pseudo — typically you'd use jwt-cpp.
#include <string>
struct JWT {
    static std::string issue(const std::string& userId, const std::string& secret) {
        // build header.payload.signature, base64url-encode each
        return "header." + userId + ".sig";  // placeholder
    }
};
```
