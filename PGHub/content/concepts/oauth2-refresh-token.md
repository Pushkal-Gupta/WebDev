---
slug: oauth2-refresh-token
module: sd-auth-security
title: OAuth 2 Refresh Token Rotation
subtitle: One-time-use refresh tokens, replay detection, family revocation.
difficulty: Advanced
position: 68
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "AWS Builders' Library — Identity & Auth"
    url: "https://aws.amazon.com/builders-library"
    type: blog
  - title: "Microservices.io — Access Token Pattern"
    url: "https://microservices.io/patterns/security/access-token.html"
    type: book
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
OAuth 2 short-lived access tokens (15 min) need a way to silently mint new ones — that's the **refresh token**. Long-lived refresh tokens are juicy targets. **Rotation** = each refresh use returns a new refresh token AND invalidates the old; reusing the old triggers **family revocation** (assume theft, revoke everything in the chain). This is the OAuth 2.1 / OIDC current best practice — and what every SPA + mobile app should do.

## whyItMatters
A stolen access token expires in 15 minutes. A stolen non-rotating refresh token = months of access until the user changes their password (and many systems don't revoke on password change). Rotation reduces theft window to one refresh cycle AND detects ongoing replay.

## intuition
**Token family** = the chain of refresh tokens produced from one initial grant. Each refresh: server stores `(parent_id, child_id, used_at)`. The family has one ID; revoking the family kills every descendant access token.

**Happy path**:
- Login -> `(access_1, refresh_1, family=F)`.
- Client uses refresh_1 -> server marks refresh_1 USED, returns `(access_2, refresh_2, parent=refresh_1, family=F)`.
- Client now stores refresh_2; refresh_1 is single-use, gone.

**Theft detection**:
- Attacker also has refresh_1 (intercepted somehow).
- Attacker submits refresh_1 -> server sees `used_at IS NOT NULL` -> **REVOKE FAMILY F** (all descendants), invalidate access_2, force user re-login.
- This catches the theft within one rotation cycle even if attacker beats the real client to the token endpoint (a benign client failing-then-retrying isn't a problem because the legitimate client now holds refresh_2 -> server only sees re-use of the old one when there's actual conflict).

**Storage**:
- Browser SPA: refresh_token in an **HttpOnly Secure SameSite=Strict** cookie. Never in localStorage.
- Mobile: secure enclave (iOS Keychain / Android Keystore).
- Backend service: encrypted secret store.

**Revocation**: a `/oauth/revoke` endpoint takes a refresh token, marks the family revoked.

## visualization
```
Initial grant: family F, refresh r0 (parent=null)

Time -->
client      server
  | --r0--->|  used_at=now, mint r1 (parent=r0, family=F)
  | <--r1--|
  |        |
  | --r1--->|  used_at=now, mint r2 (parent=r1, family=F)
  | <--r2--|
  |        |
attacker --r1--> server: r1 already used!
                    => mark family F.revoked=true
                    => invalidate all tokens with family=F
                    => 401 forever; user must reauth

Schema:
refresh_tokens(id, family_id, parent_id, hash, used_at, expires_at)
families(id, user_id, client_id, revoked_at, created_at)
```

## bruteForce
**Long-lived static refresh token**: stolen once = lifetime access.

**Rotation WITHOUT replay detection**: rotates, but attacker just races client and wins half the time silently — no alarm.

**Rotation WITH replay detection but per-token revocation (no family)**: only invalidates the reused token; attacker holds the NEW one already, keeps going.

## optimal
**Spec compliance**: RFC 6749 + RFC 6819 (security considerations) + OAuth 2.1 draft (mandates rotation + sender-constrained for public clients).

**Rules**:
1. Refresh tokens are single-use.
2. Each refresh response includes `refresh_token` (new) + `access_token` (new).
3. Server hashes refresh tokens (SHA-256) before storing.
4. Server stores `(family_id, parent_id, used_at)`.
5. Reuse of a `used_at != null` token -> revoke entire family.
6. Refresh tokens have a sliding (or absolute) max lifetime — say 90d absolute, sliding extends with use.
7. Refresh requires client authentication (client_secret) for confidential clients, **PKCE** for public clients.
8. Audit log every refresh: timestamp, IP, UA, geo. Alarm on impossible-travel.

**Token binding (defense-in-depth)**: DPoP (RFC 9449) makes tokens sender-constrained via a per-request proof JWT signed by the client's private key. Even if refresh leaks, attacker can't use it without the key.

## complexity
- Per refresh: 1 hash + 1 lookup + 1 insert + 1 update. <2ms.
- Replay detection: 1 boolean check on used_at.
- Family revocation: 1 UPDATE families SET revoked_at = now() — descendants gated by JOIN.

## pitfalls
- **Forgetting to rotate on every refresh**: classic ID provider misconfig.
- **Storing refresh tokens in localStorage**: any XSS = total takeover. HttpOnly cookie.
- **Allowing CORS `*` on token endpoint**: enables third-party origin theft. Tight allowlist.
- **No absolute lifetime**: sliding-only refresh = forever access. Cap at 30-90 days.
- **Race-condition false positives**: legitimate client retries the same refresh in <100ms (network flake) -> looks like reuse. Mitigation: 5s grace window OR idempotency token on the request.
- **Bearer tokens in URLs**: `?access_token=` leaks via referer + logs.
- **Logging full tokens**: scrub. Log only `family_id` for correlation.

## interviewTips
- Say **"rotation + family revocation"** together — this is the textbook answer.
- Mention **DPoP / sender-constrained tokens** for senior+ interviews.
- Contrast **public client (SPA, mobile)** vs **confidential client (server)** — public requires PKCE.
- For mobile, mention **secure enclave / Keystore** storage.

## code.python
```python
import hashlib, secrets, time, uuid
def hash_tok(t): return hashlib.sha256(t.encode()).hexdigest()

def refresh(db, presented):
    h = hash_tok(presented)
    row = db.fetch_one("SELECT id, family_id, used_at, revoked FROM refresh_tokens WHERE hash=%s", (h,))
    if not row: return 401
    if row['revoked']: return 401
    if row['used_at']:
        db.execute("UPDATE families SET revoked_at=now() WHERE id=%s", (row['family_id'],))
        return 401
    new = secrets.token_urlsafe(48)
    db.execute("UPDATE refresh_tokens SET used_at=now() WHERE id=%s", (row['id'],))
    db.execute("""INSERT INTO refresh_tokens (id, family_id, parent_id, hash, expires_at)
                  VALUES (%s, %s, %s, %s, now() + interval '30 days')""",
               (str(uuid.uuid4()), row['family_id'], row['id'], hash_tok(new)))
    return {'access_token': mint_access(row['family_id']), 'refresh_token': new}
```

## code.javascript
```javascript
const crypto = require('crypto');
const hashTok = (t) => crypto.createHash('sha256').update(t).digest('hex');

async function refresh(db, presented) {
  const h = hashTok(presented);
  const row = await db.oneOrNone(`SELECT id, family_id, used_at, revoked FROM refresh_tokens WHERE hash=$1`, [h]);
  if (!row || row.revoked) return { status: 401 };
  if (row.used_at) {
    await db.none(`UPDATE families SET revoked_at=now() WHERE id=$1`, [row.family_id]);
    return { status: 401, reused: true };
  }
  const next = crypto.randomBytes(48).toString('base64url');
  await db.tx(async t => {
    await t.none(`UPDATE refresh_tokens SET used_at=now() WHERE id=$1`, [row.id]);
    await t.none(`INSERT INTO refresh_tokens (family_id, parent_id, hash, expires_at)
                  VALUES ($1, $2, $3, now() + interval '30 days')`,
                  [row.family_id, row.id, hashTok(next)]);
  });
  return { access_token: mintAccess(row.family_id), refresh_token: next };
}
```

## code.java
```java
String refresh(JdbcTemplate db, String presented) throws Exception {
    String h = sha256Hex(presented);
    Map<String, Object> row = db.queryForMap(
        "SELECT id, family_id, used_at, revoked FROM refresh_tokens WHERE hash=?", h);
    if (Boolean.TRUE.equals(row.get("revoked"))) return "401";
    if (row.get("used_at") != null) {
        db.update("UPDATE families SET revoked_at=now() WHERE id=?", row.get("family_id"));
        return "401-reused";
    }
    String next = randomBase64Url(48);
    db.update("UPDATE refresh_tokens SET used_at=now() WHERE id=?", row.get("id"));
    db.update("INSERT INTO refresh_tokens(family_id, parent_id, hash, expires_at) VALUES (?, ?, ?, now()+interval '30 days')",
        row.get("family_id"), row.get("id"), sha256Hex(next));
    return next;
}
```

## code.cpp
```cpp
// std::string refresh(Db& db, const std::string& presented) {
//   auto h = sha256_hex(presented);
//   auto row = db.fetchOne("SELECT id, family_id, used_at, revoked FROM refresh_tokens WHERE hash=$1", h);
//   if (!row || row.revoked) return "401";
//   if (row.used_at) { db.exec("UPDATE families SET revoked_at=now() WHERE id=$1", row.family_id); return "401-reused"; }
//   auto next = random_base64url(48);
//   db.exec("UPDATE refresh_tokens SET used_at=now() WHERE id=$1", row.id);
//   db.exec("INSERT INTO refresh_tokens(family_id, parent_id, hash, expires_at) VALUES ($1,$2,$3,now()+interval '30 days')",
//           row.family_id, row.id, sha256_hex(next));
//   return next;
// }
```
