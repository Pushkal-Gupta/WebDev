---
slug: graceful-degradation
module: system-design
title: Graceful Degradation
subtitle: When dependencies fail, return partial / cached / stub responses instead of an error — keep the core experience working.
difficulty: Intermediate
position: 50
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Release It! (Michael Nygard) — Stability patterns"
    url: "https://pragprog.com/titles/mnee2/release-it-second-edition/"
    type: book
  - title: "AWS Builders Library — Reliability"
    url: "https://aws.amazon.com/builders-library/"
    type: blog
  - title: "Netflix/Hystrix — fallback / fail-safe library"
    url: "https://github.com/Netflix/Hystrix"
    type: repo
status: published
---

## intro
A user opens Amazon. Personalized recommendations service is down. Two options:
1. **Fail hard**: return 500 → no page.
2. **Degrade gracefully**: return the page WITHOUT recommendations → user can still shop.

**Graceful degradation** = systematically designing every dependency as **optional** with a fallback. Critical path stays alive even when 80% of subsystems are broken.

## whyItMatters
Big-tech sites do this religiously:
- Amazon: outage of recommendations / reviews / "people also bought" → product page still shows + lets you buy.
- Google: when personalization is down, you still get generic search results.
- Netflix: row of "because you watched" missing? Other rows still load.

User trust: "the site usually works" beats "the site is down occasionally." Graceful degradation = the difference.

## intuition
Each upstream call has 3 outcomes:
1. **Success** — happy path.
2. **Failure that breaks the request** — re-raise, return 500.
3. **Failure that's acceptable** — return a fallback + log + continue.

Categorize EVERY dependency call: which bucket does it fall in?

- Authentication: required → fail hard.
- Personalization: optional → fail soft.
- Logging / analytics: optional → fail silent.
- Payment processor: required → fail hard with clear message.
- Recommendations: optional → fall back to popular items.

## visualization
```
Product page renders by composing N calls:

  ┌─────────────────────────┐
  │  /products/123           │
  └────────┬────────────────┘
           │
   ┌───────┴────────┬───────────┬──────────────┬─────────────┐
   ▼                ▼           ▼              ▼             ▼
 Product DB     Inventory   Reviews        Recs Engine    Analytics
  (REQUIRED)   (REQUIRED)  (OPTIONAL)     (OPTIONAL)     (FIRE-AND-FORGET)
   200 OK        503           500 / timeout    500 / timeout    fails silently
                                  │                 │
                                  ▼                 ▼
                          fallback: []        fallback: trending products
                          (hide reviews         (show "popular now")
                           section)

Response: full product page WITHOUT reviews + WITH "popular" recs.
User can still add to cart + checkout.
```

## bruteForce
**Fail-everything-on-any-error**: one slow dependency = whole site down. Worst-case latency = sum of all timeouts.

**Hard-coded 200s on errors**: silently broken; user sees stale / nonsense data. Worse than honest failure.

**Multiple fallback layers per dependency**: cache → upstream → static — clean degradation chain.

## optimal
**Per-dependency fallback strategy**:

| Dependency | Failure handling |
|---|---|
| Cached versions of upstream data | Try cache; on miss try upstream; on upstream-fail return stale cache with `X-Stale-While-Revalidate` |
| Hard-coded defaults | Recommendations → top-10 trending list; settings → default values |
| Skip the feature | Reviews section → empty/hidden if reviews service unreachable |
| Partial success response | API returns `{success: [...], failed: ['recs']}` so client knows |
| Async retry | Non-critical writes (analytics) → fire-and-forget; retry in background |

**Implementation pattern**:
```python
def get_product_page(pid):
    page = {'product': fetch_product(pid)}          # REQUIRED — fails hard
    page['inventory'] = fetch_inventory(pid)        # REQUIRED — fails hard
    try:
        page['reviews'] = fetch_reviews(pid, timeout=200ms)
    except (TimeoutError, ServiceError):
        page['reviews'] = []                        # OPTIONAL — hide section
        log.warning('reviews fallback', pid=pid)
    try:
        page['recommendations'] = fetch_recs(pid, timeout=200ms)
    except (TimeoutError, ServiceError):
        page['recommendations'] = trending_cache.get()  # OPTIONAL — popular fallback
        log.warning('recs fallback', pid=pid)
    return page
```

**Tight timeouts on optional calls**: cap at 100-300ms. If the dependency is slow, you don't want it to slow the whole page.

**Circuit breakers** in front of optional calls: when reviews service is failing >50%, the breaker opens and skips the call entirely for the next 30s — returns fallback immediately.

**Graceful degradation works WITH retry / circuit breaker** — different layers of the stability pattern stack.

## complexity
- **Latency budget**: sum of REQUIRED calls + max(OPTIONAL timeouts). Optional calls run in parallel.
- **Code complexity**: per-call try/except + fallback decision. Some boilerplate.
- **Observability**: log every fallback so SRE knows which dependencies are degrading.

## pitfalls
- **Silent fallback without metric**: 20% of pages render without reviews and you never notice. Always emit `fallback_used` metric.
- **Cascading optional → required**: "this fallback fetches from another service that's also down." Audit the fallback's own dependencies.
- **Stale data shown without flag**: user thinks they see fresh prices but they're 1h old. Show "Last updated: ..." or `Cache-Control: stale-while-revalidate`.
- **Too many fallbacks**: every dependency is "optional" → core flow degrades but customers can't actually buy anything. Audit which paths are CRITICAL.
- **Fallback path untested**: in real outage, fallback code path has its own bug. Chaos-test by killing dependencies in staging.

## interviewTips
- For "how would you design system X to handle dependency failures" → graceful degradation + circuit breaker + retry budget.
- Mention **per-call fail-soft vs fail-hard classification** as the design step.
- For senior interviews, discuss **multi-tier cache fallbacks** + **chaos engineering** + **degradation metrics**.

## code.python
```python
from concurrent.futures import ThreadPoolExecutor, TimeoutError

def fetch_page(pid):
    page = {}
    page['product'] = product_svc.get(pid)               # REQUIRED
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {
            'reviews': pool.submit(reviews_svc.get, pid),
            'recs':    pool.submit(recs_svc.get, pid),
            'price':   pool.submit(price_svc.get, pid),
        }
        for key, fut in futures.items():
            try:
                page[key] = fut.result(timeout=0.2)
            except (TimeoutError, ServiceError) as e:
                page[key] = FALLBACKS[key]
                metrics.incr('fallback_used', tags={'dep': key, 'reason': type(e).__name__})
    return page
```

## code.javascript
```javascript
async function fetchPage(pid) {
  const page = { product: await productSvc.get(pid) };  // REQUIRED
  const [reviews, recs] = await Promise.allSettled([
    Promise.race([reviewsSvc.get(pid), timeout(200)]),
    Promise.race([recsSvc.get(pid), timeout(200)]),
  ]);
  page.reviews = reviews.status === 'fulfilled' ? reviews.value : [];
  page.recs = recs.status === 'fulfilled' ? recs.value : trendingCache.get();
  if (reviews.status === 'rejected') metrics.inc('fallback', { dep: 'reviews' });
  return page;
}
```

## code.java
```java
// Spring + resilience4j fallback
@Service
class PageService {
    @CircuitBreaker(name = "reviews", fallbackMethod = "noReviews")
    public List<Review> getReviews(long pid) { return reviewsClient.fetch(pid); }
    public List<Review> noReviews(long pid, Throwable t) {
        metrics.counter("fallback.reviews").increment();
        return List.of();
    }
}
```

## code.cpp
```cpp
// resilience4j has no C++ port; build your own try/catch + fallback wrapper
template<class F, class FB>
auto with_fallback(F&& f, FB&& fb, std::chrono::milliseconds timeout) {
    try { return run_with_timeout(f, timeout); }
    catch (...) { metrics_inc("fallback_used"); return fb(); }
}
```
