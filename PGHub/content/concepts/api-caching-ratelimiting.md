---
slug: api-caching-ratelimiting
module: apis-backend
title: API Caching & Rate Limiting
subtitle: Two levers every serious API pulls — HTTP caching that skips repeat work with ETags and 304s, and token-bucket rate limiting that returns 429 before a flood takes the origin down.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 16
prereqs: [api-rest-design]
relatedProblems: []
references:
  - title: "MDN — HTTP caching"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching"
    type: article
  - title: "MDN — ETag header"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag"
    type: article
  - title: "MDN — 429 Too Many Requests"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429"
    type: article
  - title: "RFC 9111 — HTTP Caching"
    url: "https://www.rfc-editor.org/rfc/rfc9111"
    type: spec
  - title: "RFC 6585 — Additional HTTP Status Codes (429)"
    url: "https://www.rfc-editor.org/rfc/rfc6585"
    type: spec
status: published

---

## intro
An API that recomputes the same answer for every identical request, and answers every request no matter how fast they arrive, will be both slow and fragile. Two mechanisms fix that without touching business logic. **Caching** lets a response be reused — by the browser, a CDN edge, or a shared proxy — so a repeat read never re-runs the query or crosses the network. **Rate limiting** caps how fast any one caller may spend your capacity, so a buggy client or an abusive one cannot starve everyone else. This lesson covers the HTTP caching model — `Cache-Control`, `ETag`, conditional revalidation, the `304 Not Modified` reply — and the token-bucket algorithm behind `429 Too Many Requests` with `Retry-After`.

## whyItMatters
These two levers decide whether an API stays fast and stays up under real traffic. Caching attacks latency and cost at the same time: a cache hit returns in microseconds, never touches your database, and never leaves the edge — which is why a well-cached endpoint can absorb orders of magnitude more traffic on the same hardware. Rate limiting attacks the opposite failure: without it, a single client in a retry loop, a scraper, or a credential-stuffing attack can saturate your origin and take the whole service down for every honest user. Interviewers probe both because they separate people who can call an API from people who can operate one — you are expected to name the exact headers, explain fresh-versus-revalidate, and describe a limiter that is fair, cheap, and honest about when the caller may return.

## intuition
Think of caching as a **shelf right by your front door**. The first time you need flour you drive all the way to the warehouse, wait in line, and carry it home — the full errand. But you put a bag on the shelf by the door, and next time you just grab it. No drive, no line, no waiting. `Cache-Control: max-age=3600` is a sticky note on the bag that says "good for an hour" — inside that hour you take it off the shelf with zero questions asked. That is a **fresh** hit: no network trip at all.

But flour goes stale, and so does data. Once the hour passes you do not want to drive all the way back and haul home a fresh bag if the one you have is still fine — you want a cheap way to *ask*. So the warehouse stamped your bag with a **fingerprint**: a short code, the `ETag`, that changes only when the contents change. Now you phone ahead — "I have the bag stamped `"v7"`, still current?" That call carries `If-None-Match: "v7"`. If nothing changed the warehouse says "**304**, yep, use what you have" — no truck, no cargo, just a one-line yes. Only if the stamp no longer matches do they ship a fresh bag with a new fingerprint. Revalidation is the cheap phone call that saves the expensive delivery.

Rate limiting is a different picture: a **bucket of tokens**. Your bucket holds, say, ten tokens, and it refills slowly — one token every few seconds, up to the brim. Every request you make **spends one token**. Make requests at a gentle pace and the bucket refills as fast as you drain it, so you never run dry. But hammer it — twenty requests in a second — and the bucket empties. With no token left to spend, the next request is turned away: **429 Too Many Requests**, come back in `Retry-After` seconds, which is exactly how long until the next token drips in. The bucket's depth is your allowed burst; the refill rate is your sustained ceiling. It is fair because each caller gets their own bucket, and it is gentle because a short spike is absorbed rather than punished.

## visualization
```
REQUEST 1  (cold)                         REQUEST 2  (revalidate)
  client --> [cache] MISS --> origin        client --> [cache] --> origin
                                              If-None-Match: "v7"
  origin: 200 OK                             origin: 304 Not Modified
  ETag: "v7"  Cache-Control: max-age=60      (no body -- reuse cached copy)
  <----- body cached at edge -----          <----- 1 line, no payload -----

TOKEN BUCKET  (capacity 5, +1 token / 2s)
  t=0  [* * * * *]  req -> spend -> [* * * *  ] ALLOW  200
  t=0  [* * * *  ]  req -> spend -> [* * *    ] ALLOW  200
  t=0  [* * *    ]  x3 fast burst -> [        ] EMPTY
  t=0  [        ]  req -> no token  -> 429  Retry-After: 2
  t=2  [*        ]  refill drips one back -> ALLOW again
```

## bruteForce
The naive API caches nothing and limits nothing. Every read — even the same profile fetched a thousand times a second — runs the full query, serializes the same JSON, and ships the same bytes back over the network, so identical requests each pay the origin's full cost and the database melts under load that a single cached copy could have served for free. And because every caller may fire as fast as they like, one client stuck in a tight retry loop, one scraper, or one attacker can consume all the throughput and connections, leaving honest users with timeouts. It works in a demo and collapses the first time real traffic — or one bad actor — arrives.

## optimal
Layer caching, then protect the origin with a limiter.

**Caching.** Mark responses with `Cache-Control`. `max-age=N` makes a response **fresh** for N seconds — reused with zero network trips. Add `public` so shared caches (a CDN edge, a reverse proxy) may store it, or `private` to keep it in the browser only for per-user data. When the fresh window expires the cache does not blindly re-download: it **revalidates**. The origin attached a validator — an `ETag` (a content fingerprint) and/or `Last-Modified` — and the cache echoes it back with a **conditional request**: `If-None-Match: "v7"` or `If-Modified-Since: <date>`. If nothing changed the origin replies **`304 Not Modified`** with headers but *no body*, and the cache serves its stored copy — a full payload saved. Push this to a **CDN** so hits terminate at an edge near the user, and pair long `max-age` with content-hashed URLs so you can cache immutably yet still ship changes by changing the URL. Invalidate deliberately: purge the edge or bump the version key on writes.

**Rate limiting.** Give each key — API token, user id, or IP — its own **token bucket**: a capacity `B` and a refill rate `r` tokens per second. Each request tries to remove one token; if one is available the request is **allowed** and the token is spent, otherwise it is **rejected** with `429 Too Many Requests` and a `Retry-After` header telling the caller how many seconds until a token returns. The bucket refills continuously up to `B`, so it absorbs a burst of up to `B` requests yet enforces a sustained ceiling of `r`. Token bucket beats a naive **fixed window** (which allows a double-rate spike straddling the window boundary) because refill is smooth. Store bucket state in a fast shared store like Redis so the limit holds across every server. Add small random **jitter** to `Retry-After` so rejected clients do not all retry in lockstep and create a synchronized second wave.

## complexity
time: A fresh cache hit is `O(1)` and costs zero origin round trips — a key lookup and a copy. A revalidation is one cheap round trip that returns `304` with no body, versus a full miss that pays the entire query-plus-transfer cost. A token-bucket check is `O(1)`: compute how many tokens refilled since the last timestamp, compare against one, decrement.
space: The response cache is `O(distinct cacheable URLs)`, bounded by an eviction policy (LRU) and disk budget. Limiter state is `O(active keys)` — each key stores just a token count and a last-refill timestamp, a handful of bytes, so millions of keys fit comfortably in Redis.
notes: The metric that matters for caching is round trips avoided, not bytes; a fresh hit removes the trip entirely and a `304` removes the payload. For limiting, the two tunables — bucket depth `B` (burst) and refill rate `r` (sustained) — are chosen independently, which is exactly why token bucket is more expressive than a single window count.

## pitfalls
- **Confusing `no-cache` with `no-store`.** `no-cache` does *not* mean "never cache" — it means "store it, but always revalidate before reuse," so you still get cheap `304`s. `no-store` is the one that forbids storing the response at all. Fix: use `no-store` only for genuinely sensitive, per-request data; reach for `no-cache` (or a short `max-age`) when you want revalidation, not a total ban.
- **Caching per-user data on a shared cache.** Marking a response with someone's name, cart, or auth-scoped data as `public` lets a CDN serve user A's data to user B. Fix: use `Cache-Control: private` for anything user-specific, and add `Vary: Authorization`/`Vary: Cookie` so caches key on the identity, never blend users.
- **Never invalidating.** Setting a long `max-age` and then updating the underlying data means stale content lingers until the TTL expires, with no way to force a refresh. Fix: use content-hashed or versioned URLs for immutable assets, and actively purge or bump a version key on writes so the next read misses and repopulates.
- **No jitter or `Retry-After` on limits.** Returning a bare `429` with no `Retry-After` leaves clients guessing, and every rejected client retrying at the exact same instant produces a synchronized thundering herd. Fix: always send `Retry-After`, and add a little random jitter so retries spread out instead of arriving in one wave.
- **Fixed-window burst at the boundary.** A naive "100 requests per minute" counter lets a client send 100 at 00:59 and another 100 at 01:00 — 200 requests in two seconds, double the intended rate. Fix: use a token bucket or a sliding window so the smooth refill or rolling count closes the boundary gap.

## interviewTips
- Name the exact headers and states: `Cache-Control: max-age` for *fresh* (zero trips), `ETag` + `If-None-Match` returning `304 Not Modified` for *revalidate* (a trip with no body), and be ready to distinguish `no-cache` (revalidate) from `no-store` (never store).
- Reach for **token bucket** when asked to design a limiter, and justify it: capacity gives you a controlled burst, refill rate gives you the sustained ceiling, `429 Too Many Requests` plus `Retry-After` is the honest response, and shared state (Redis) makes it hold across a fleet.
- Call out the correctness traps unprompted — `private` vs `public` and `Vary` so shared caches never mix users, and jitter on `Retry-After` so rejected clients do not retry in lockstep — that signals you have actually run these systems, not just read about them.

## keyTakeaways
- HTTP caching has two modes: a *fresh* response (`Cache-Control: max-age`) is reused with no network trip, and a *stale* one is revalidated with a conditional request (`If-None-Match`/`If-Modified-Since`) that returns a cheap `304 Not Modified` and no body.
- Token-bucket rate limiting caps callers with a depth `B` (allowed burst) and refill rate `r` (sustained ceiling); an empty bucket returns `429 Too Many Requests` with `Retry-After`, and each key gets its own bucket for fairness.
- The classic traps are `no-cache` vs `no-store`, caching per-user data `public` on a shared CDN, never invalidating, and rate limits with no `Retry-After` or jitter — knowing them is what separates using an API from operating one.

## code.javascript
```javascript
// Express: strong caching with ETag + conditional 304, plus a token-bucket
// rate limiter that returns 429 + Retry-After. No external deps.
const express = require('express');
const crypto = require('crypto');
const app = express();

// --- Token bucket, one per key (API token / user id / IP) -------------------
const CAPACITY = 5;           // burst allowed
const REFILL_PER_SEC = 1;     // sustained ceiling
const buckets = new Map();

function takeToken(key) {
  const now = Date.now() / 1000;
  let b = buckets.get(key);
  if (!b) b = { tokens: CAPACITY, last: now };
  // Refill continuously since the last touch, capped at CAPACITY.
  b.tokens = Math.min(CAPACITY, b.tokens + (now - b.last) * REFILL_PER_SEC);
  b.last = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    buckets.set(key, b);
    return { ok: true };
  }
  buckets.set(key, b);
  const waitSec = Math.ceil((1 - b.tokens) / REFILL_PER_SEC);
  return { ok: false, retryAfter: waitSec };
}

function rateLimit(req, res, next) {
  const key = req.header('x-api-key') || req.ip;
  const verdict = takeToken(key);
  if (verdict.ok) return next();
  res.set('Retry-After', String(verdict.retryAfter));
  return res.status(429).json({ error: 'Too Many Requests' });
}

// --- Caching: emit an ETag, honor If-None-Match with a 304 ------------------
app.get('/api/profile/:id', rateLimit, (req, res) => {
  const body = JSON.stringify({ id: req.params.id, name: 'Ada', plan: 'pro' });
  const etag = '"' + crypto.createHash('sha1').update(body).digest('hex').slice(0, 16) + '"';

  res.set('Cache-Control', 'private, max-age=60');
  res.set('ETag', etag);

  if (req.header('If-None-Match') === etag) {
    return res.status(304).end(); // unchanged: no body, reuse the cached copy
  }
  res.type('application/json').send(body);
});

app.listen(3000);
```

## code.python
```python
# FastAPI: ETag + conditional 304, and a token-bucket limiter returning
# 429 with Retry-After. Bucket state is per-key and refills over time.
import time
import hashlib
import json
from fastapi import FastAPI, Request, Response

app = FastAPI()

CAPACITY = 5          # burst allowed
REFILL_PER_SEC = 1.0  # sustained ceiling
_buckets: dict[str, dict[str, float]] = {}


def take_token(key: str):
    now = time.time()
    b = _buckets.get(key, {"tokens": float(CAPACITY), "last": now})
    # Refill continuously since the last request, capped at CAPACITY.
    b["tokens"] = min(CAPACITY, b["tokens"] + (now - b["last"]) * REFILL_PER_SEC)
    b["last"] = now
    if b["tokens"] >= 1:
        b["tokens"] -= 1
        _buckets[key] = b
        return True, 0
    _buckets[key] = b
    wait = int((1 - b["tokens"]) / REFILL_PER_SEC) + 1
    return False, wait


@app.get("/api/profile/{user_id}")
def profile(user_id: str, request: Request):
    key = request.headers.get("x-api-key") or (request.client.host if request.client else "anon")
    ok, retry_after = take_token(key)
    if not ok:
        return Response(status_code=429, headers={"Retry-After": str(retry_after)})

    body = json.dumps({"id": user_id, "name": "Ada", "plan": "pro"})
    etag = '"' + hashlib.sha1(body.encode()).hexdigest()[:16] + '"'
    headers = {"Cache-Control": "private, max-age=60", "ETag": etag}

    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)  # unchanged, no body
    return Response(content=body, media_type="application/json", headers=headers)
```

## code.bash
```bash
# First request: full 200 with an ETag and a max-age directive.
curl -i https://api.example.com/api/profile/42
# HTTP/1.1 200 OK
# Cache-Control: private, max-age=60
# ETag: "a1b2c3d4e5f60718"
# Content-Type: application/json
# {"id":"42","name":"Ada","plan":"pro"}

# Second request: send the stored validator. Unchanged -> 304, no body.
curl -i https://api.example.com/api/profile/42 \
  -H 'If-None-Match: "a1b2c3d4e5f60718"'
# HTTP/1.1 304 Not Modified
# ETag: "a1b2c3d4e5f60718"
# (empty body -- the client reuses its cached copy)

# Hammer the endpoint past the bucket capacity -> 429 with Retry-After.
for i in $(seq 1 8); do
  curl -s -o /dev/null -w "%{http_code} " https://api.example.com/api/profile/42
done
# 200 200 200 200 200 429 429 429

# Inspect the throttled response: Retry-After tells you when to come back.
curl -i https://api.example.com/api/profile/42
# HTTP/1.1 429 Too Many Requests
# Retry-After: 2
```
