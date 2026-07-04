---
slug: api-auth-sessions-jwt
module: apis-backend
title: API Authentication — Sessions vs JWTs
subtitle: How a server tells who you are on every request — the login flow, the coat-check ticket of a server session, the signed passport of a JWT, and the storage and revocation tradeoffs between them.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 16
prereqs: [api-rest-design]
relatedProblems: []
references:
  - title: "MDN — Using HTTP cookies"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies"
    type: article
  - title: "MDN — Authorization header"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization"
    type: article
  - title: "JWT — Introduction to JSON Web Tokens"
    url: "https://jwt.io/introduction"
    type: article
  - title: "RFC 7519 — JSON Web Token (JWT)"
    url: "https://www.rfc-editor.org/rfc/rfc7519"
    type: spec
  - title: "RFC 6750 — Bearer Token Usage"
    url: "https://www.rfc-editor.org/rfc/rfc6750"
    type: spec
status: published
---

## intro
HTTP is stateless: each request arrives with no memory of the one before it, so a server that just verified your password has completely forgotten you by the time your next click lands. Authentication is how you bridge that gap — how the server proves, on every single request, that the caller is the same person who logged in a moment ago without asking for the password again. Two families of answers dominate the web. One keeps the memory on the server as a **session**, handing the client only an opaque ticket. The other pushes the memory into a signed **token** the client carries — a **JWT** — that the server can verify without remembering anything. This lesson walks the login flow and then compares the two end to end.

## whyItMatters
Get authentication wrong and nothing else about your API matters — a broken auth layer is a data breach waiting to happen, and it is the single most common source of serious production incidents. The choice between server sessions and stateless tokens shapes how your system scales, how you deploy across multiple servers, how quickly you can revoke a compromised login, and where an attacker might steal a credential. It is also the interview topic that separates people who have shipped real systems from those who have only read about them: "sessions or JWT, and why?" has no glib right answer, only tradeoffs you must be able to name. Storage decisions — an `httpOnly` cookie versus `localStorage` — directly determine whether you are exposed to CSRF, to XSS, or to both. Knowing this cold is table stakes for any backend role.

## intuition
Imagine walking into an exclusive club. At the door you show your ID once — that is **login**, proving who you are with something only you have. From that moment on, nobody wants to re-check your passport every time you walk to the bar; they need a cheap, fast way to recognise you. There are two classic schemes, and they map almost perfectly onto the two authentication models.

The first is the **coat-check ticket**. When you enter, the cloakroom takes your coat, writes your details in a ledger behind the counter, and hands you a small numbered stub — `42`. The stub means nothing on its own; it is just a random number. But whenever you present it, the attendant looks up `42` in the ledger and instantly knows everything about you. This is a **server-side session**: the server stores the real state (who you are, when you logged in, your permissions) in its own memory or database, and gives you only an opaque **session id**, usually inside a cookie. The power sits with the ledger. If the attendant crosses out row `42`, your stub is instantly worthless — **revocation is trivial**. The cost is that the server must keep and consult that ledger for every request, and if you have ten doors (ten servers), they all need to share one ledger.

The second scheme is the **signed passport**. Instead of a ledger, the club gives you a laminated card that states your name and access level, then stamps it with a **tamper-proof seal** only the club can produce. Now any attendant can read the card and check the seal without phoning a central office — the card carries its own proof. This is a **JWT**: a self-describing token holding your claims, signed with a secret only the server knows. Verification is a local math check, so **any** server can accept it with **no shared ledger** — this is what makes it scale so cleanly. The catch is the mirror image of the session's strength: once a valid, unexpired passport is out in the world, you cannot easily un-issue it. Tearing up one card in a ledger is easy; recalling a laminated card already in someone's wallet is hard. That single asymmetry — cheap revocation versus cheap scaling — is the heart of the whole debate.

## visualization
```
  LOGIN                                        SUBSEQUENT REQUESTS
  -----                                        -------------------
  client  --  POST /login {user,pass}  -->  server
  client  <--  Set-Cookie: sid=42       --  server   (session store: 42 -> {user})
  client  --  GET /me   Cookie: sid=42  -->  server   (look up 42 in store)

  -- OR (stateless) --
  client  <--  200 {token: eyJ...}      --  server   (nothing stored)
  client  --  GET /me  Authorization: Bearer eyJ...  -->  server (verify signature)

  A JWT is three base64url parts joined by dots -- readable, NOT encrypted:
     header . payload . signature
     eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiIxIiwiZXhwIjo5OTl9 . 3xR-sig-bytes
     {alg,typ}              {sub,exp,role,...claims}       HMAC/RSA over 1.2
```

## bruteForce
The most naive scheme is **HTTP Basic on every call**: the client stores the raw username and password and re-sends them, base64-encoded, in an `Authorization` header on every single request. It technically works, but the credential rides the wire constantly, any logging middleware or proxy can capture it, and the server must hash-verify the password on every hit — an expensive operation deliberately made slow. A second naive approach is **server sessions with no thought to scale**: storing session state in a single process's memory, which evaporates on restart and cannot be shared once you add a second server behind a load balancer, so users get randomly logged out depending on which box answers.

## optimal
Both real answers start the same way: the client sends credentials **once** to a `/login` endpoint over HTTPS, the server verifies the password against a slow salted hash (bcrypt, argon2), and then issues a **credential** the client replays cheaply thereafter. The two models differ in what that credential is.

**Server-side sessions.** The server generates a long random **session id**, stores the real state (`sid -> {userId, roles, createdAt}`) in a shared store — Redis, or a database table — and returns the id in a cookie marked `HttpOnly; Secure; SameSite`. Each later request carries the cookie automatically; the server looks the id up, and if the row exists and is not expired, the caller is authenticated. Revocation is a single delete. The cost is a store lookup per request and the operational need for that store to be shared across every server.

**Stateless JWTs.** The server builds a token whose **payload** holds the claims (`sub`, `role`, `exp`) and **signs** it with a secret. A JWT is three base64url segments — `header.payload.signature`. The signature is an **HMAC** (shared secret) or an **RSA/ECDSA** signature (private key signs, public key verifies) computed over `header.payload`. Verification recomputes that signature and checks the `exp` claim — pure local computation, no store. Crucially the payload is only **encoded, not encrypted**: anyone can read it, so it must never hold secrets. Because JWTs cannot be un-issued, they are kept **short-lived** (minutes) and paired with a long-lived **refresh token** stored server-side. When the access token expires the client presents the refresh token to `/refresh` to mint a new access token; **rotation** issues a fresh refresh token each time and invalidates the old, so a stolen refresh token is detectable and revocable. This gives you stateless verification on the hot path plus a controllable revocation point.

## complexity
time: Session auth costs one store lookup per request — `O(1)` against Redis but still a network round trip to the shared store, so hot paths add that latency every call. JWT verification is a single local signature check and expiry comparison, `O(1)` CPU with no I/O, which is why it wins on raw per-request throughput. The one-time login cost is identical and deliberately slow (password hashing) in both.
space: A session is `O(users)` server-side memory — every active login is a row the server must keep and every server must reach. A JWT is `O(1)` server state on the access path (the server stores nothing to verify it); the client holds the token, so state moves to the edge. Refresh tokens reintroduce some `O(active_sessions)` server storage, but far less churn than per-request session lookups.
notes: The real axis is not speed but revocation versus statelessness. Sessions trade per-request lookups for instant, trivial revocation; JWTs trade instant revocation for lookup-free horizontal scaling. Short JWT expiry plus a refresh-token store is the pragmatic middle: stateless on the hot path, revocable at the refresh boundary.

## pitfalls
- **Storing a JWT in `localStorage`.** Any XSS-injected script can read `localStorage` and exfiltrate the token, and the token *is* the credential. Fix: prefer an `HttpOnly; Secure; SameSite` cookie (JavaScript cannot read it) and pair it with a CSRF defense; if you must use headers, keep tokens short-lived and treat XSS prevention as non-negotiable.
- **Treating a JWT as encrypted or secret.** The payload is base64url — trivially decodable by anyone who holds the token. Fix: never put passwords, secrets, or sensitive PII in the claims; assume the payload is public and rely on the signature only for integrity, not confidentiality.
- **Trusting `alg` from the token header, or accepting `alg: none`.** An attacker can rewrite the header to `none` (no signature) or downgrade RS256 to HS256 and sign with the public key. Fix: pin the accepted algorithm server-side, reject `none` outright, and never let the token dictate how it is verified.
- **No expiry, or ignoring `exp`.** A token with no `exp` claim, or a verifier that never checks it, is a credential valid forever — a permanent liability if leaked. Fix: always set a short `exp`, always validate it on verify, and lean on refresh-token rotation rather than long-lived access tokens.
- **Assuming JWTs are easy to revoke.** Deleting a session row logs a user out instantly; a stateless JWT stays valid until it expires no matter what. Fix: keep access-token lifetimes short (minutes), maintain a server-side refresh-token store you *can* revoke, and add a token denylist only for the narrow cases (logout, compromise) that truly need it.

## interviewTips
- When asked "sessions or JWT?", refuse the false binary — name the axis. Sessions give trivial revocation at the cost of a shared per-request store; JWTs give stateless, lookup-free scaling at the cost of hard revocation. State the tradeoff, then pick based on whether the system needs instant logout or horizontal statelessness.
- Be precise that a JWT is **signed, not encrypted** — three base64url parts, payload readable by anyone, signature (HMAC or RSA) proving only integrity. Getting this wrong (calling it encrypted, or putting secrets in the payload) is the classic tell that someone has only skimmed the topic.
- Explain the access/refresh split and rotation: short-lived access token for the hot path, long-lived refresh token stored server-side that mints new access tokens and rotates itself each use so a stolen refresh token is detectable. This shows you understand how real systems reconcile stateless verification with revocation.

## keyTakeaways
- HTTP is stateless, so authentication replays a cheap credential on every request after a one-time password login: a **server session** keeps the state server-side and hands out an opaque id, while a **JWT** pushes signed claims to the client so any server can verify them with no shared store.
- A JWT is `header.payload.signature` in base64url — **signed, not encrypted** — so the payload is public and the signature (HMAC or RSA/ECDSA) proves only integrity; never store secrets in it, always set and check `exp`, and never trust the token's own `alg`.
- The core tradeoff is revocation versus statelessness: sessions revoke instantly but need a shared per-request store, JWTs scale without lookups but cannot be un-issued — which is why production JWT systems pair short-lived access tokens with a revocable, rotating refresh token.

## code.javascript
```javascript
// Node + Express: issue a JWT on login, then verify the Bearer token on
// protected routes. The signing secret ALWAYS comes from the environment —
// never hardcode it. In production use an asymmetric key (RS256) so verifiers
// only need the public key.
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET; // set in the environment, never in code
const ACCESS_TTL = '15m';

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // verifyPassword does a slow salted hash compare (bcrypt/argon2).
  const user = await verifyPassword(username, password);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  // Claims are PUBLIC and only signed — never put secrets here.
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL, algorithm: 'HS256' },
  );
  res.json({ token, tokenType: 'Bearer' });
});

// Middleware: pull the Bearer token, verify signature + expiry, attach claims.
function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing bearer token' });
  }
  try {
    // Pin the algorithm — never trust the token's own `alg` header.
    req.user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

app.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.user.sub, role: req.user.role });
});

app.listen(3000);
```

## code.python
```python
# FastAPI + PyJWT: mirror of the Node flow. Secret comes from os.environ,
# the payload is signed (not encrypted), and verification pins the algorithm
# and checks expiry automatically.
import os
import datetime as dt

import jwt  # PyJWT
from fastapi import FastAPI, Header, HTTPException

app = FastAPI()

JWT_SECRET = os.environ["JWT_SECRET"]  # required env var, never hardcoded
ALGORITHM = "HS256"
ACCESS_TTL = dt.timedelta(minutes=15)


def issue_token(user_id: str, role: str) -> str:
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "sub": user_id,          # public claim, readable by anyone
        "role": role,
        "iat": now,
        "exp": now + ACCESS_TTL,  # always set an expiry
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


@app.post("/login")
async def login(username: str, password: str):
    user = await verify_password(username, password)  # slow salted-hash compare
    if not user:
        raise HTTPException(status_code=401, detail="invalid credentials")
    token = issue_token(user["id"], user["role"])
    return {"token": token, "token_type": "Bearer"}


def require_auth(authorization: str = Header(default="")) -> dict:
    scheme, _, token = authorization.partition(" ")
    if scheme != "Bearer" or not token:
        raise HTTPException(status_code=401, detail="missing bearer token")
    try:
        # Pin the algorithm and let PyJWT enforce the `exp` claim.
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="invalid or expired token")


@app.get("/me")
async def me(authorization: str = Header(default="")):
    claims = require_auth(authorization)
    return {"id": claims["sub"], "role": claims["role"]}
```

## code.bash
```bash
# 1) Log in to obtain an access token. The server verifies the password once
#    and returns a signed JWT in the JSON body.
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ada","password":"correct-horse"}' \
  | python3 -c 'import sys, json; print(json.load(sys.stdin)["token"])')

echo "access token: $TOKEN"

# 2) Call a protected endpoint by replaying the token in the Authorization
#    header as a Bearer credential (RFC 6750). No password is sent again.
curl -s http://localhost:3000/me \
  -H "Authorization: Bearer $TOKEN"

# 3) Inspect the payload locally — it is base64url, NOT encrypted, so anyone
#    holding the token can read the claims. This is why secrets never go in it.
echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null; echo
```
