---
slug: idempotency-key
module: sd-api
title: Idempotency Keys
subtitle: Client-supplied unique key per request — server returns the cached response on retry, never re-executes the action.
difficulty: Intermediate
position: 26
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Idempotent consumer pattern"
    url: "https://microservices.io/patterns/communication-style/idempotent-consumer.html"
    type: book
  - title: "Stripe Engineering — Designing robust APIs with idempotency"
    url: "https://stripe.com/blog/idempotency"
    type: blog
  - title: "donnemartin/system-design-primer — Idempotency"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A **mutating API call** (POST a payment, send an email, create an order) can be retried after a network blip. Without protection, the retry creates a second charge / second email / second order — duplicate side effects. **Idempotency keys** fix this: the client supplies a unique key per logical operation; the server keeps a `(key, response)` cache; on retry with the same key, the server returns the cached response WITHOUT re-executing.

## whyItMatters
This is the canonical safe-retry pattern. Every mature payment, messaging, and ordering system requires it:
- **Stripe** — `Idempotency-Key` HTTP header on every POST.
- **PayPal / Square / Adyen** — same header.
- **AWS APIs** — `ClientToken` parameter.
- **Pub/sub consumers** — process each message once even if delivered twice.

Without idempotency keys, every transient network error becomes a money-losing bug.

## intuition
1. Client generates a UUID (or hash of the request body + timestamp).
2. Client sends `POST /charges` with header `Idempotency-Key: <uuid>`.
3. Server looks up the key. If found → return the cached response (no side effect). If not → execute the operation atomically and cache the (key, response) pair before returning.
4. Network retry: client re-sends with the same key. Server returns the cached response.

The cache typically has a TTL (24 hours, 30 days) — long enough to span retry windows.

## visualization
```
First request:
  Client ──POST /charges Idempotency-Key:abc123 {"amount":100}──► Server
  Server: SELECT response FROM idem WHERE key='abc123' → not found
          BEGIN TX
            charge user's card (200 OK from Stripe)
            INSERT INTO idem (key, response, expires_at) VALUES ('abc123', json, now()+24h)
            INSERT INTO charges (...)
          COMMIT
  Server ──200 OK {"charge_id":"ch_xyz"}──► Client

Network blip on response → Client retries:
  Client ──POST /charges Idempotency-Key:abc123 {"amount":100}──► Server
  Server: SELECT response FROM idem WHERE key='abc123' → found
  Server ──200 OK {"charge_id":"ch_xyz"} (cached)──► Client
                                                  (no second charge!)
```

## bruteForce
**No protection**: clients retry naively → duplicate side effects.

**Dedupe by request hash** (no client key): can't tell "client retried same operation" from "client sent identical-looking-but-distinct operation." E.g., two separate $50 charges to the same user look identical without the key.

## optimal
**Schema** (Postgres):
```sql
CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID NOT NULL,           -- scope key to user to prevent cross-tenant collisions
  request_hash TEXT NOT NULL,      -- to detect "same key, different body" abuse
  response_status INT,
  response_body JSONB,
  status TEXT NOT NULL,            -- 'processing' | 'completed' | 'failed'
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_idem_expires ON idempotency_keys (expires_at);
```

**Server flow**:
```
def handle_request(key, user_id, body):
    request_hash = sha256(body)
    with db.transaction():
        existing = db.fetch_one("SELECT * FROM idempotency_keys WHERE key=? AND user_id=?",
                                key, user_id)
        if existing:
            if existing.request_hash != request_hash:
                return 422, 'Idempotency-Key reused with different request body'
            if existing.status == 'processing':
                return 409, 'Request still processing; retry shortly'
            return existing.response_status, existing.response_body
        # Mark in-flight
        db.execute("INSERT INTO idempotency_keys (key, user_id, request_hash, status, expires_at) "
                   "VALUES (?, ?, ?, 'processing', now() + INTERVAL '24 hours')",
                   key, user_id, request_hash)
    # Outside the lock: perform the operation
    status, response = perform_operation(body)
    db.execute("UPDATE idempotency_keys SET status='completed', "
               "response_status=?, response_body=? WHERE key=?",
               status, response, key)
    return status, response
```

**Cleanup**: scheduled job `DELETE FROM idempotency_keys WHERE expires_at < now()`.

## complexity
- **Per request overhead**: 1 extra SELECT + 1 INSERT/UPDATE on the idempotency table. Negligible if indexed.
- **Storage**: 1 row per unique operation, kept for TTL. Cleanup keeps it bounded.

## pitfalls
- **Locking on processing**: if you don't mark "processing" before the operation, two simultaneous retries can both execute the operation. Use a transactional INSERT with PRIMARY KEY conflict to atomically claim the key.
- **Reusing the same key for different bodies**: clients sometimes do this. Compare `request_hash` and reject with 422.
- **TTL too short**: if a network outage lasts longer than your TTL, retries become new operations. 24h is the Stripe default; some go to 7 days.
- **Key scope**: scope to (user_id, key) so two users can independently use the same key string without colliding.
- **Long-running operations**: if the operation takes 30s, retries during that window see `status='processing'` and get 409. Some implementations wait + return the response when done.

## interviewTips
- For "design a payment API" → idempotency keys go in the first sentence.
- Always mention **the request_hash check** — a subtle requirement.
- For senior interviews: discuss **distributed coordination** (Redis vs Postgres as the idempotency store), **TTL strategy**, and the **at-least-once + idempotency = effectively-exactly-once** mantra.

## code.python
```python
import hashlib, json, uuid
def handle(request, user_id, body, db):
    key = request.headers.get('Idempotency-Key')
    if not key: return 400, 'Idempotency-Key required'
    req_hash = hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
    try:
        with db.transaction():
            existing = db.fetch_one(
                "SELECT request_hash, status, response_status, response_body "
                "FROM idempotency_keys WHERE key=%s AND user_id=%s",
                (key, user_id),
            )
            if existing:
                if existing['request_hash'] != req_hash:
                    return 422, 'Key reused with different body'
                if existing['status'] == 'completed':
                    return existing['response_status'], existing['response_body']
                return 409, 'Still processing'
            db.execute(
                "INSERT INTO idempotency_keys (key, user_id, request_hash, status, expires_at) "
                "VALUES (%s, %s, %s, 'processing', now() + INTERVAL '24 hours')",
                (key, user_id, req_hash),
            )
    except db.IntegrityError:
        return 409, 'Concurrent request with same key'
    status, resp = perform(body)
    db.execute(
        "UPDATE idempotency_keys SET status='completed', response_status=%s, response_body=%s "
        "WHERE key=%s", (status, json.dumps(resp), key),
    )
    return status, resp
```

## code.javascript
```javascript
// Express middleware
async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return res.status(400).send('Idempotency-Key required');
  const reqHash = require('crypto').createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  const existing = await db.one('SELECT * FROM idempotency_keys WHERE key=$1 AND user_id=$2', [key, req.userId]);
  if (existing) {
    if (existing.request_hash !== reqHash) return res.status(422).send('Body differs');
    if (existing.status === 'completed') return res.status(existing.response_status).json(existing.response_body);
    return res.status(409).send('Processing');
  }
  await db.none('INSERT INTO idempotency_keys (key, user_id, request_hash, status, expires_at) '
                + 'VALUES ($1,$2,$3,$4,now() + interval \'24 hours\')',
                [key, req.userId, reqHash, 'processing']);
  next();
}
```

## code.java
```java
// Spring filter — pseudocode
@Component
class IdempotencyFilter implements Filter {
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        String key = ((HttpServletRequest)req).getHeader("Idempotency-Key");
        // ... same logic as above
    }
}
```

## code.cpp
```cpp
// Production C++ implementations live in the framework layer (Drogon, Crow, oatpp).
// Same DB-row dance: SELECT, INSERT-OR-CONFLICT, perform, UPDATE.
```
