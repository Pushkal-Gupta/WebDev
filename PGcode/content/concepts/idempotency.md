---
slug: idempotency
module: system-design
title: Idempotency
subtitle: Design APIs so that retrying a request produces the same outcome as making it once.
difficulty: Intermediate
position: 8
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Stripe — Idempotency Keys"
    url: ""
status: published
---

## intro
An operation is **idempotent** if executing it once and executing it many times produce the same final state. In distributed systems, the network can — and will — duplicate requests: clients retry on timeout, queues use at-least-once delivery, load balancers re-dispatch. Idempotency is the application-level contract that turns those duplicates from "double-charge bug" into "no-op."

## whyItMatters
Without idempotency, every retry is a coin flip between losing data (giving up after one failure) and double-spending (retrying and processing twice). With it, the client safely retries on any ambiguous failure, the queue's at-least-once delivery is no longer a footgun, and you get exactly-once *effects* without exactly-once *delivery* (which is much harder).

## intuition
Picture sending a "transfer $100 from A to B" message. The network drops your acknowledgement. You don't know: did it happen? You retry. If the receiver is idempotent — it remembers "I already processed transfer #abc123" — the retry is a no-op. If it's not, you've now sent $200. Idempotency keys are the receipt the receiver checks before doing the work.

## visualization
```
Client   ──"transfer; key=abc"──►  Server
          (network drops ACK)
Client   ──"transfer; key=abc"──►  Server  (sees key=abc already done → returns cached response, $100 transferred once)
```

## bruteForce
"Just retry on failure" without idempotency keys. Works when operations are read-only or already naturally idempotent (e.g. `PUT /resource/123 = {x}`); causes data corruption for `POST /charge`, `POST /send-email`, `INSERT INTO orders`, etc.

## optimal
**Make HTTP verbs honest first**:
- `GET`, `HEAD`, `OPTIONS` are naturally idempotent — must have no side effects.
- `PUT` and `DELETE` are idempotent by spec — they describe a final state.
- `POST` is **not** idempotent by default — that's where most bugs live.

**Add idempotency keys** to mutating operations:
1. Client generates a unique key per logical operation (UUID v4, prefixed for debuggability).
2. Sends it as a header: `Idempotency-Key: <key>`.
3. Server records `{key → (status, response)}` in a fast store (Redis, DB) with a TTL (24h–7d).
4. On first request: do the work, save the response, return it.
5. On any retry with the same key: return the saved response without re-doing the work.

**Make underlying operations idempotent where possible**:
- Use `INSERT ... ON CONFLICT DO NOTHING` (Postgres) or `INSERT IGNORE` (MySQL) keyed on the idempotency key.
- For external side effects (sending email, charging card), wrap the side effect in a "did we already do this for key=X?" check before invocation.

**Handle the in-progress race**: two retries arriving before the first finishes. Either lock on the key (returns "in progress" 409) or use a unique-constraint insert that proves who's first.

## complexity
- **Per-request overhead**: 1 key lookup (~1ms).
- **Storage**: O(active keys × TTL). TTL of 24h on 1M keys/day ≈ 1M rows.
- **Failure modes**: storage hiccup → either fail closed (reject) or fail open (re-process, risk of duplicate).

## pitfalls
- **Keys reused across operations**: client must NOT reuse a key for a logically-different request. The server SHOULD detect this (e.g., compare request body hash) and reject with 422.
- **Storing response forever**: TTL is essential — otherwise the table grows unbounded.
- **Partial idempotency**: outer handler is idempotent but a downstream call (e.g., third-party charge) isn't. You're only as idempotent as the weakest link in the chain.
- **Confusing idempotency with retry safety**: a non-idempotent operation can still be retry-safe if you can detect duplicates after the fact (e.g., unique constraint on transaction_id).
- **Forgetting the "in progress" state**: two retries that overlap → race → both do the work.

## interviewTips
- Bring up idempotency the moment you mention retries, at-least-once queues, or async work.
- "Idempotency key + dedupe store + TTL" is the canonical answer for "how do you avoid double-charges?"
- Mention HTTP verb semantics — interviewers like that you know `PUT` is meant to be idempotent.
- For senior-level, discuss exactly-once *effects* (idempotency) vs exactly-once *delivery* (much harder; usually faked).

## code.python
```python
# Wrapper that adds idempotency via Redis.
import redis, json, uuid
r = redis.Redis()

def with_idempotency(key, ttl_seconds, do_work):
    cached = r.get(f"idem:{key}")
    if cached: return json.loads(cached)
    response = do_work()
    r.setex(f"idem:{key}", ttl_seconds, json.dumps(response))
    return response

def charge(card, amount, idem_key):
    return with_idempotency(idem_key, 86400, lambda: {
        "id": str(uuid.uuid4()), "amount": amount, "status": "charged"
    })
```

## code.javascript
```javascript
// Express middleware sketch.
const cache = new Map(); // → Redis in prod
function idempotent(req, res, next) {
  const key = req.header('Idempotency-Key');
  if (!key) return next();
  if (cache.has(key)) { res.json(cache.get(key)); return; }
  const send = res.json.bind(res);
  res.json = (body) => { cache.set(key, body); setTimeout(() => cache.delete(key), 86400_000); send(body); };
  next();
}
```

## code.java
```java
import java.util.concurrent.ConcurrentHashMap;
class Idempotency {
    private final ConcurrentHashMap<String, Object> store = new ConcurrentHashMap<>();
    @SuppressWarnings("unchecked")
    public <T> T run(String key, java.util.function.Supplier<T> work) {
        Object cached = store.get(key);
        if (cached != null) return (T) cached;
        T result = work.get();
        store.put(key, result);
        return result;
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <string>
#include <functional>
#include <any>
struct Idempotency {
    std::unordered_map<std::string, std::any> store;
    template<class F>
    auto run(const std::string& key, F work) -> decltype(work()) {
        auto it = store.find(key);
        if (it != store.end()) return std::any_cast<decltype(work())>(it->second);
        auto result = work();
        store[key] = result;
        return result;
    }
};
```
