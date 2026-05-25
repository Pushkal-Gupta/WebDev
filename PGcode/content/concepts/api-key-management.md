---
slug: api-key-management
module: sd-auth-security
title: API Key Management
subtitle: Issue, rotate, scope, revoke — store hashed only, never log, treat like passwords.
difficulty: Intermediate
position: 51
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "OWASP — API Security Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html"
    type: book
  - title: "Stripe — API keys best practices"
    url: "https://stripe.com/docs/keys"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
API keys identify a calling client + carry permissions. Done wrong (plaintext storage, no rotation, no scopes) they're a perpetual breach waiting. Done right: **hash on storage**, **scope per use case**, **rotate periodically**, **revoke instantly**, **never log**. The pattern Stripe / GitHub / AWS use.

## whyItMatters
API keys leak constantly:
- Committed to GitHub by accident (3700 keys leaked daily — GitHub's stats).
- Logged in plaintext access logs.
- Stored in error reports + Sentry.
- Exposed via misconfigured S3 buckets.

A leaked key with no rotation policy = months/years of unauthorized access. Good management makes leaks survivable.

## intuition
**Key shape**:
- `prefix_environment_random` (Stripe: `sk_live_abc...`, `pk_test_xyz...`).
- Prefix identifies key TYPE (secret vs publishable).
- Environment (live/test) prevents prod-to-test confusion.
- Random part is 32+ bytes from CSPRNG.

**Storage** (server side):
- Display the FULL key ONCE at creation (modal: "Copy this now, you'll never see it again").
- Persist only the hash: `hash = bcrypt(key)` or `sha256(key)` (faster, OK because keys are random — no brute force).
- On API call: compute hash(provided_key), look up in DB.

**Scope** per key:
- `read:users` allows read endpoints; `write:orders` allows POST orders.
- Principle of least privilege — limit blast radius if leaked.

**Lifecycle**: created → active → rotated (new key, both work for grace period) → revoked → archived. Always have a rotation path.

## visualization
```
Issue:
  POST /api/keys     Authorization: <admin>
  → server generates: prefix_env_<32 bytes base64>
                      key_id (UUID), hash = sha256(key)
  → store {key_id, hash, scope, created_at, last_used_at}
  → return {key_id, full_key} to caller (FULL KEY SHOWN ONCE)

Use:
  GET /api/orders   Authorization: Bearer sk_live_abcd...
  → server: hash = sha256(provided)
  → SELECT scope, revoked_at FROM keys WHERE hash = $1
  → if revoked → 401
  → check scope contains 'read:orders' → if not → 403
  → update last_used_at, last_used_ip → proceed

Rotate:
  POST /api/keys/rotate {key_id: ...}
  → generate new key + hash
  → mark old key {expires_at = now + 7d} (grace period)
  → return new key, instruct caller to migrate
  → after 7d, hard-delete old hash

Revoke:
  DELETE /api/keys/{key_id}
  → set revoked_at = now()
  → instant — next request 401s
```

## bruteForce
**Plaintext-stored keys**: any DB breach = total compromise of every key.

**Reversible encryption** (key encrypted with master key in env): same problem if attacker gets the env.

**One key for everything**: leak = total access. Use scoped keys.

**No rotation, no expiry**: developer leaves company, their key still works. Rotate quarterly OR on personnel change.

## optimal
**Schema**:
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,                   -- human label "production backup script"
  prefix TEXT NOT NULL,                 -- "sk_live_abc..." first 8 chars for display
  hash TEXT NOT NULL UNIQUE,            -- sha256 of the full key
  scope TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  last_used_ip INET,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_keys_hash ON api_keys (hash);
CREATE INDEX idx_keys_user ON api_keys (user_id) WHERE revoked_at IS NULL;
```

**Auth middleware**:
```python
def authenticate(req):
    key = req.headers.get('Authorization', '').replace('Bearer ', '')
    if not key.startswith(('sk_', 'pk_')): return None
    h = hashlib.sha256(key.encode()).hexdigest()
    row = db.fetch_one("""
        SELECT user_id, scope FROM api_keys
        WHERE hash = %s
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > now())
    """, (h,))
    if not row: return None
    # async update last_used (don't block request)
    queue.put(('update_last_used', h, req.remote_addr))
    return AuthContext(user_id=row['user_id'], scope=row['scope'])
```

**Leak detection**:
- GitHub secret scanning: register your prefix; GitHub alerts on commits.
- Trufflehog in CI: scan repos for `prefix_*` patterns.
- Alert on first use from a new IP / country.

**Auto-revocation** on leak detection: receive webhook from GitHub → mark key revoked → email owner.

## complexity
- **Per request**: 1 hash + 1 indexed DB lookup. <1ms.
- **Storage**: 1 row per key. Cheap.
- **Rotation**: 1 INSERT + 1 UPDATE.

## pitfalls
- **Logging the full key**: access logs, error reports, breadcrumbs. SCRUB before write.
- **Sending key in URL** (`?api_key=...`): leaks via referer + browser history. Always Authorization header.
- **bcrypt for random keys**: overkill (no brute-force risk on 256-bit random). SHA-256 is fine + faster.
- **Forgetting to scope** read-only keys for analytics access → leaked key = full write access.
- **Long-lived keys with no expiry**: never expire = forever-leak. Set 1-year max + remind owners.
- **`revoked_at = NULL` as "active"**: don't filter every query manually. Use a partial index.

## interviewTips
- For "design API key system" — hash storage + scopes + rotation + revoke + leak detection.
- Mention **prefix-based key identification** (Stripe pattern: `sk_live_...`).
- For senior interviews, discuss **GitHub secret scanning integration**, **auto-rotation**, **scope reduction over time**.

## code.python
```python
import secrets, hashlib
def generate_api_key(env='live', kind='sk'):
    raw = secrets.token_urlsafe(32)
    return f'{kind}_{env}_{raw}'

def store_key(db, user_id, key, scope, name):
    h = hashlib.sha256(key.encode()).hexdigest()
    prefix = key[:12]  # for display
    db.execute("""
        INSERT INTO api_keys (user_id, name, prefix, hash, scope)
        VALUES (%s, %s, %s, %s, %s)
    """, (user_id, name, prefix, h, scope))

def verify_key(db, key):
    h = hashlib.sha256(key.encode()).hexdigest()
    return db.fetch_one("""
        SELECT user_id, scope FROM api_keys
        WHERE hash = %s AND revoked_at IS NULL
    """, (h,))
```

## code.javascript
```javascript
const crypto = require('crypto');
function generateKey(env = 'live') {
  return `sk_${env}_${crypto.randomBytes(32).toString('base64url')}`;
}
function hashKey(key) { return crypto.createHash('sha256').update(key).digest('hex'); }

async function verify(client, key) {
  const h = hashKey(key);
  return client.oneOrNone(`
    SELECT user_id, scope FROM api_keys
    WHERE hash = $1 AND revoked_at IS NULL
  `, [h]);
}
```

## code.java
```java
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
public static String generateKey(String env) {
    byte[] raw = new byte[32];
    new SecureRandom().nextBytes(raw);
    return "sk_" + env + "_" + Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
}
public static String hashKey(String key) throws Exception {
    return java.util.HexFormat.of().formatHex(
        MessageDigest.getInstance("SHA-256").digest(key.getBytes()));
}
```

## code.cpp
```cpp
// OpenSSL — generate + hash
// std::string key = "sk_live_" + base64url(random_bytes(32));
// uint8_t digest[SHA256_DIGEST_LENGTH];
// SHA256((uint8_t*)key.c_str(), key.size(), digest);
// std::string hash = to_hex(digest, 32);
```
