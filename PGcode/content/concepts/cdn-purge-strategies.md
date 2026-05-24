---
slug: cdn-purge-strategies
module: system-design
title: CDN Purge Strategies
subtitle: TTL expiry, soft-purge, URL invalidation, and tag-based purge — picking the right blast radius for each change.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "AWS Builders' Library — Caching at the edge"
    url: "https://aws.amazon.com/builders-library/"
    type: blog
  - title: "Martin Fowler — bliki on cache invalidation"
    url: "https://martinfowler.com/"
    type: blog
  - title: "donnemartin/system-design-primer — CDN section"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A CDN holds copies of your content in hundreds of edge POPs. Whenever the origin changes, you need a story for how those copies get updated. The four standard answers are TTL expiry (wait it out), soft-purge (mark stale, serve while revalidating), URL invalidation (purge specific paths), and tag-based purge (purge everything sharing a logical tag). The right pick depends on how fast the change must propagate and how big a thundering herd you can absorb on the origin.

## whyItMatters
Most production CDN problems are purge problems. Either staleness lingers because nobody invalidated, or every product update purges 100k pages and the origin melts. Knowing the four strategies — and the soft-purge plus stale-while-revalidate combo that everyone eventually settles on — is the difference between a CDN that helps and a CDN that hurts. Senior interviews probe this directly when discussing news sites, e-commerce, or any high-traffic CMS.

## intuition
Think of the edge as a per-POP copy of your origin. TTL expiry is the lazy strategy: every cached object has a max-age, and after that the edge re-fetches. Soft-purge marks the object stale but keeps serving it while a background fetch refreshes it (the user never waits). URL invalidation tells every POP "drop this exact path now." Tag-based purge attaches metadata tags like `product:42` or `category:shoes` to cached objects and purges by tag — one call evicts every page referencing product 42.

## visualization
A product price update propagating four different ways:

```
TTL expiry (max-age=300):
  T+0    update origin
  T+0    edge still serves old price for up to 5 min
  T+300  edge revalidates, picks up new price

SOFT-PURGE (stale-while-revalidate):
  T+0    update origin + send soft-purge
  T+0    edge marks stale; next request serves stale + async refetch
  T+0+ε  subsequent requests get fresh value

URL INVALIDATION:
  T+0    purge /product/42
  T+0    next request is a MISS at edge, origin sees a spike
  T+ε    origin response repopulates edge

TAG-BASED PURGE:
  T+0    purge tag "product:42" (Fastly Surrogate-Key, Cloudflare Cache-Tag)
  T+0    edge evicts every URL tagged with product:42
         /product/42, /category/shoes, /search?q=42 etc.
         single API call, fan-out at the edge
```

## bruteForce
"Purge everything" — issue a wildcard invalidation on every deploy. Works for small sites, catastrophic at scale: every POP misses every cached object, origin sees a 100x traffic spike, and the warm-up takes minutes. Some CDNs (CloudFront historically) charge per-invalidation, turning a brute-force purge into a billing event too.

## optimal
Layer the strategies:
- **Long TTL with short SWR** (`Cache-Control: public, max-age=86400, stale-while-revalidate=60`) for everything by default. The edge serves cached content for a day, but the moment you hit `max-age`, the next user gets the stale copy instantly while a background fetch refreshes — no thundering herd because the SWR window is single-flighted.
- **Soft-purge over hard-purge** for any deliberate invalidation. Marks the object stale, lets stale-while-revalidate kick in, eliminates the brief origin spike.
- **Tag-based purge** for content that lives on many URLs. Tag every product page with `product:<id>`, every category page with `category:<slug>`. A single purge call updates every place a product appears.
- **URL invalidation** reserved for one-off bug fixes or sensitive content that must vanish immediately (legal takedown, leaked secret).
- Pair every purge with a small jittered delay across POPs so the origin sees a smoothed refill curve, not a spike.

## complexity
time: TTL purge propagates in O(max-age) wall-clock time. Soft-purge / hard-purge propagate in O(global gossip), typically under 150 ms for major CDNs. Tag-based purge is O(tagged-objects) at the edge — bounded by the index structure.
space: Cache stores object body plus headers plus tags (small overhead, typically <1 percent).
notes: Origin shield (an intermediate cache between edges and origin) absorbs the thundering herd if the edge cannot. Always enable it for high-traffic sites.

## pitfalls
- Hard-purging on every deploy with no SWR — origin gets DDoSed by your own users.
- Forgetting that `Vary` headers (cookies, accept-encoding, language) multiply the cache key — one URL can mean dozens of cached variants, all of which must be purged.
- Setting `max-age=0, no-cache` "to be safe" — the CDN becomes a pass-through, you pay for bandwidth twice and gain nothing.
- Tag-based purge with too-broad tags (`tag: site`) effectively becomes wildcard purge.
- Browsers ignore your CDN purge — set a `s-maxage` for the CDN distinct from `max-age` for browsers to control them independently.

## interviewTips
- Lead with "TTL is the default, soft-purge is the workhorse, tag-based purge is the scalpel, URL purge is the hammer."
- Mention `stale-while-revalidate` and `stale-if-error` — modern browsers and most CDNs support them; many candidates don't know.
- For "design a news site with breaking-news updates," the answer is short TTL + tag-based soft-purge keyed on `article:<id>` or `topic:<slug>`.
- Acknowledge the eventual-consistency window: even the fastest global purge takes ~100–500 ms to propagate; design clients to tolerate it.
- Bring up origin shield as the "second cache" that protects the origin when the edge cache misses en masse.

## code.python
```python
import requests

FASTLY = "https://api.fastly.com"
SERVICE = "abc123"

def soft_purge_tag(token, tag):
    r = requests.post(
        f"{FASTLY}/service/{SERVICE}/purge",
        headers={"Fastly-Key": token, "Fastly-Soft-Purge": "1", "Surrogate-Key": tag},
        timeout=5,
    )
    r.raise_for_status()
    return r.json()

def hard_purge_url(token, url):
    r = requests.request("PURGE", url, headers={"Fastly-Key": token}, timeout=5)
    r.raise_for_status()
```

## code.javascript
```javascript
export async function softPurgeTag(token, service, tag) {
  const res = await fetch(`https://api.fastly.com/service/${service}/purge`, {
    method: "POST",
    headers: {
      "Fastly-Key": token,
      "Fastly-Soft-Purge": "1",
      "Surrogate-Key": tag,
    },
  });
  if (!res.ok) throw new Error(`purge failed: ${res.status}`);
  return res.json();
}

// Worker setting cache-control + tag on the response
export default {
  async fetch(req, env) {
    const r = await fetch(req);
    const headers = new Headers(r.headers);
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=60");
    headers.set("Surrogate-Key", `product:${env.PRODUCT_ID}`);
    return new Response(r.body, { status: r.status, headers });
  },
};
```

## code.java
```java
HttpClient client = HttpClient.newHttpClient();

HttpResponse<String> softPurgeTag(String token, String service, String tag) throws Exception {
    HttpRequest req = HttpRequest.newBuilder()
        .uri(URI.create("https://api.fastly.com/service/" + service + "/purge"))
        .header("Fastly-Key", token)
        .header("Fastly-Soft-Purge", "1")
        .header("Surrogate-Key", tag)
        .POST(HttpRequest.BodyPublishers.noBody())
        .build();
    return client.send(req, HttpResponse.BodyHandlers.ofString());
}
```

## code.cpp
```cpp
#include <curl/curl.h>
#include <string>

void soft_purge_tag(const std::string& token, const std::string& service, const std::string& tag) {
    CURL* c = curl_easy_init();
    std::string url = "https://api.fastly.com/service/" + service + "/purge";
    curl_easy_setopt(c, CURLOPT_URL, url.c_str());
    curl_easy_setopt(c, CURLOPT_POST, 1L);

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, ("Fastly-Key: " + token).c_str());
    headers = curl_slist_append(headers, "Fastly-Soft-Purge: 1");
    headers = curl_slist_append(headers, ("Surrogate-Key: " + tag).c_str());
    curl_easy_setopt(c, CURLOPT_HTTPHEADER, headers);

    curl_easy_perform(c);
    curl_slist_free_all(headers);
    curl_easy_cleanup(c);
}
```
