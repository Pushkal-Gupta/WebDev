---
slug: csrf-vs-cors-deep
module: sd-auth-security
title: CSRF vs CORS Deep — Same-Origin, SameSite, Preflight, Double-Submit
subtitle: How browsers enforce same-origin, what each SameSite mode actually changes, when CORS preflight fires, and why double-submit cookies survive an XSS-free CSRF threat model.
difficulty: Advanced
position: 413
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "OWASP — CSRF Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"
    type: book
  - title: "MDN — SameSite cookie attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite"
    type: blog
  - title: "WHATWG Fetch Standard — CORS protocol and preflight"
    url: "https://fetch.spec.whatwg.org/"
    type: book
status: published
---

## intro
CSRF and CORS are easily confused because both involve cross-origin requests, but they answer opposite questions. **Same-Origin Policy** is the floor: it stops scripts on `evil.com` from reading responses they receive from `bank.com`. **CORS** is the controlled relaxation: it lets `bank.com` opt-in and say "yes, you may read this response." **CSRF** is the gap underneath both: even with SOP blocking reads, the browser still attaches cookies to the request, and a forged write succeeds whether or not the attacker can read the reply. SameSite cookies, CSRF tokens, double-submit, and Origin-header checks all close that gap.

## whyItMatters
SameSite=Lax has been the Chrome default since 2020 (Firefox followed in 2022), which kills the naive cookie-only CSRF on every modern browser. That has *not* eliminated the threat model: GET-based state changes still fire on top-level navigation under Lax, subdomain attacks (`evil.bank.com`) treat the cookie as same-site, and legacy browsers in the long tail still send cross-site cookies by default. Meanwhile CORS misconfigurations have replaced raw CSRF as the dominant browser-side bug class — `Access-Control-Allow-Origin: *` paired with `Allow-Credentials: true` is the headline, but reflected-origin echo, null-origin allowlists, and overly permissive preflight caches are all routine pen-test findings. Knowing the precise behaviour of each SameSite value, when a preflight does and does not fire, and how double-submit avoids server-side token storage is the floor for any backend interview that touches web security.

## intuition
Three policies stacked together govern every cross-origin browser request.

**Same-origin policy (SOP)** is enforced by the browser. Two URLs share an origin iff their scheme, host, and port match exactly. Scripts may freely read responses from their own origin. Cross-origin reads are *blocked at the script boundary* — the request still leaves the browser, cookies attached, and the response arrives — but the JavaScript engine refuses to expose the body, headers (except a CORS-safelisted subset), or status to the caller. The request still ran on the server; only the read was blocked. This is why **CSRF works even when SOP works**: the attacker does not need to read the reply, they need the server to *act*.

**CORS** is the server-side opt-in that lifts the SOP read-block. For "simple" requests (GET or POST with content-type `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`, and no custom headers beyond a small safelist), the browser sends the request directly with an `Origin: https://app.example.com` header; if the response includes `Access-Control-Allow-Origin: https://app.example.com` (and `Access-Control-Allow-Credentials: true` when cookies are involved), the browser exposes the response to the calling script. For any non-simple request — `Content-Type: application/json`, `Authorization` header, `PUT`/`DELETE`/`PATCH` methods, custom headers — the browser sends an `OPTIONS` **preflight** first, asking the server to declare which method and headers it permits. Only after the preflight responds with matching `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` does the real request fire.

**Cookie SameSite** is enforced by the browser at request-construction time. `SameSite=Strict` means the cookie is attached *only* when the request originates from the same registrable domain — no cookie on cross-site top-level navigation, no cookie on cross-site fetches, period. `SameSite=Lax` (the default since 2020) attaches the cookie on **top-level GET navigation** but not on cross-site `fetch`, `XHR`, `<img>` loads, or POST submissions. `SameSite=None` requires `Secure` and attaches the cookie on every cross-site request the user-agent permits — this is the mode third-party widgets and federated login require.

CSRF survives a same-origin-policy-correct browser because the cookie is attached before the script ever runs; the attacker on `evil.com` does not need to read the response, only to cause the request. The defences therefore close one of three doors: stop the cookie from being attached cross-site (SameSite), require a value only the same origin can read (CSRF token or double-submit), or reject the request server-side when the `Origin`/`Referer` header is wrong.

## visualization
```
SOP + CORS + SameSite — three policies on one fetch
─────────────────────────────────────────────────────────
                    evil.com JS                bank.com server
                         │                          │
   fetch('https://bank.com/transfer', { credentials: 'include' })
                         │                          │
   browser checks: cross-origin? yes ───────────► need preflight?
                                                    │
        non-simple (POST + JSON + auth header)?     │
                ─── yes ──► OPTIONS preflight ────► │
                                                    │ Allow-Origin: evil.com?
                                                    │ Allow-Credentials: true?
                                                    │       ─── no ─► 403/blocked
                         │                          │       ─── yes ─► continue
                         │                          │
   browser attaches cookie? check SameSite ─────────┤
                                                    │
        SameSite=Strict ─► drop cookie ─► server sees anon, refuses write
        SameSite=Lax    ─► drop cookie on fetch ─► same as above
        SameSite=None   ─► attach cookie ──┐
                                           │
                         │                 ▼          │
   ─── POST /transfer ─── Origin: evil.com ─────────► │ Origin allowlisted?
                                                       │       ─── no ─► 403
                                                       │       ─── yes ─► need CSRF token
                                                       │                   match cookie? ─► commit
```

## bruteForce
The textbook synchronizer token pattern works but costs a server-side store. The flow: on every authenticated session, generate a random token, store it server-side keyed by session id, and render it into every form as a hidden input or fetch it via an authenticated endpoint into a meta tag. On every state-changing request, compare the submitted token to the stored value. The store is the cost — per-session memory in Redis or a database row that has to survive load balancer affinity and cluster failovers. For high-RPS APIs the token lookup becomes a non-trivial fraction of request latency, and forgetting to invalidate tokens on logout or rotate them on privilege changes are routine bugs.

## optimal
A modern stack layers three independent defences and assumes any single one might fail.

**Layer 1: SameSite=Lax (or Strict) on the session cookie.** This is the first wall. Lax is the safe default for most apps; Strict breaks "click email link, land logged-in" but is correct for high-stakes flows (banking dashboards, admin panels). Use `__Host-` prefix (`__Host-session=...; Secure; Path=/; SameSite=Lax`) to enforce no `Domain` attribute and HTTPS-only, which blocks subdomain takeover attacks. SameSite=None requires explicit cross-site need and must always carry `Secure`.

**Layer 2: Double-submit cookie + custom header for state-changing requests.** Generate a random 32-byte token, set it as a cookie (`csrftoken=...; SameSite=Strict; Secure`), and require the client to echo it in a custom header (`X-CSRF-Token`) on every write. The server's check is one line: `request.header('X-CSRF-Token') == request.cookie('csrftoken')`. This is **stateless** — no server-side store — because the same value lives on both sides of the wire and a cross-site attacker cannot read either to inject the header. The custom header itself forces a preflight on any cross-origin request, which fails for a non-CORS-allowed origin, doubling the defence. For higher assurance, use a **signed** double-submit: store `HMAC(server_secret, session_id || timestamp)` as the cookie value; the server can validate without lookup and rotate by changing the secret.

**Layer 3: Origin / Sec-Fetch-Site enforcement at the server.** Modern browsers send `Sec-Fetch-Site: same-origin | same-site | cross-site | none` on every request; reject any state-changing request whose `Sec-Fetch-Site` is `cross-site`. The fallback for older clients is to enforce `Origin` (or `Referer`) header equality against an allowlist. Both are cheap (one hash compare in the middleware) and catch attacks that slip past the cookie layer.

For **CORS**, the production rule set is:

- Echo the allowed origin only after matching it against a closed allowlist; never reflect arbitrary `Origin` headers. Wildcards (`*`) are incompatible with `Allow-Credentials: true` by spec — browsers will reject the response.
- Set `Access-Control-Max-Age` to a sane window (5–10 minutes); too long means preflight changes propagate slowly to clients.
- Never include `Allow-Credentials: true` on endpoints that do not actually need cookies; it widens the attack surface for nothing.
- Treat the `null` origin (data URLs, sandboxed iframes) as untrusted; refuse `Origin: null`.

The combined model handles every modern threat: SameSite blocks the naive case, double-submit blocks the SameSite=None / subdomain case, Origin checks block the legacy-browser case, and CORS is configured tight enough that even a successful XSS on a related origin cannot pivot to cross-origin reads of authenticated data.

## complexity
SameSite check is constant-time at request-construction in the browser, zero cost on the server. Double-submit check is one byte-compare on the server, ~50 ns. Signed double-submit adds one HMAC-SHA-256 (~5 µs). Origin allowlist check is one hash-set lookup. CORS preflight adds one round trip but is cached for up to `Access-Control-Max-Age` seconds (Chrome caps at 2 hours, Firefox at 24 hours). Token cookie size: 32 bytes raw, ~44 base64url chars; signed variant adds 32 bytes for the HMAC. Total per-request overhead vs no protection: <100 µs, dominated by the HMAC if signed.

## pitfalls
- **Defaulting to `SameSite=None` "to be safe."** None disables the entire layer-1 defence; pick Lax unless the app is genuinely a third-party widget. Some frameworks defaulted to None years ago for compatibility — audit your cookie config.
- **Using a static CSRF token across sessions.** The token must rotate per session (or per request for high-assurance flows). A token that survives logout is reusable after a token leak via XSS or proxy logging.
- **Reflecting `Origin` into `Access-Control-Allow-Origin` without an allowlist.** This is the canonical CORS misconfiguration and turns the browser into the attacker's helper: any origin gets a green light. Always allowlist; never reflect untrusted input.
- **Treating SOP + CORS as a CSRF defence.** CORS preflight does not block the request from arriving server-side for simple methods (GET/POST form-encoded). If your server commits a write on a simple POST without CSRF token validation, the preflight never runs. Enforce CSRF on every state-changing endpoint, not just JSON ones.
- **Forgetting that subdomains are same-site under SameSite=Lax.** `evil.bank.com` (an attacker-controlled subdomain — say, a compromised marketing CMS) sends `bank.com` cookies on cross-subdomain top-level navigation. Use `__Host-` prefix, or scope cookies to the exact host with no Domain attribute, to mitigate.

## interviewTips
- Be precise about the difference: CSRF is about what the browser *sends* (cookies on a forged request); CORS is about what the script can *read* (response body from a cross-origin fetch). Mixing them up is the most common verbal slip.
- When asked for the modern defence, lead with SameSite, then double-submit, then Origin/Sec-Fetch-Site. Mentioning all three signals you know defence-in-depth; mentioning only tokens dates your knowledge to pre-2020.
- Have the preflight trigger list memorised: non-simple method, non-safelisted Content-Type, presence of custom headers (including `Authorization`), or `credentials: include` with no matching `Allow-Origin`. Interviewers love asking "does this fetch preflight?" and the answer is fully mechanical.

## code

### python
```python
import hmac, hashlib, secrets

CSRF_HEADER = "X-CSRF-Token"
CSRF_COOKIE = "csrftoken"

def issue_csrf_token() -> str:
    return secrets.token_urlsafe(32)

def signed_csrf_token(session_id: str, server_secret: bytes) -> str:
    mac = hmac.new(server_secret, session_id.encode("ascii"), hashlib.sha256).hexdigest()
    return mac

def check_csrf(request) -> bool:
    cookie = request.cookies.get(CSRF_COOKIE)
    header = request.headers.get(CSRF_HEADER)
    if not cookie or not header:
        return False
    return hmac.compare_digest(cookie, header)

def enforce_origin(request, allowlist: set[str]) -> bool:
    sec_fetch = request.headers.get("Sec-Fetch-Site")
    if sec_fetch == "cross-site":
        return False
    origin = request.headers.get("Origin") or request.headers.get("Referer", "")
    return any(origin.startswith(allowed) for allowed in allowlist)
```

### javascript
```javascript
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const CSRF_HEADER = 'x-csrf-token';
export const CSRF_COOKIE = 'csrftoken';

export function issueCsrfToken() {
  return randomBytes(32).toString('base64url');
}

export function signedCsrfToken(sessionId, serverSecret) {
  return createHmac('sha256', serverSecret).update(sessionId).digest('hex');
}

export function checkCsrf(req) {
  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.headers[CSRF_HEADER];
  if (!cookie || !header) return false;
  const a = Buffer.from(cookie), b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function enforceOrigin(req, allowlist) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin || req.headers.referer || '';
  return allowlist.some(allowed => origin.startsWith(allowed));
}

export function corsHeaders(req, allowlist) {
  const origin = req.headers.origin;
  if (!origin || !allowlist.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Vary': 'Origin',
  };
}
```

### java
```java
import jakarta.servlet.http.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Set;

public final class CsrfGuard {
    private static final String COOKIE = "csrftoken";
    private static final String HEADER = "X-CSRF-Token";
    private static final SecureRandom RNG = new SecureRandom();

    public static String issueToken() {
        byte[] raw = new byte[32];
        RNG.nextBytes(raw);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }

    public static boolean check(HttpServletRequest req) {
        String header = req.getHeader(HEADER);
        if (header == null) return false;
        for (Cookie c : req.getCookies() != null ? req.getCookies() : new Cookie[0]) {
            if (COOKIE.equals(c.getName())) {
                byte[] a = c.getValue().getBytes(), b = header.getBytes();
                return a.length == b.length && MessageDigest.isEqual(a, b);
            }
        }
        return false;
    }

    public static boolean enforceOrigin(HttpServletRequest req, Set<String> allow) {
        if ("cross-site".equals(req.getHeader("Sec-Fetch-Site"))) return false;
        String origin = req.getHeader("Origin");
        return origin != null && allow.contains(origin);
    }
}
```

### cpp
```cpp
#include <openssl/hmac.h>
#include <openssl/rand.h>
#include <string>
#include <unordered_set>

static const char kCookieName[] = "csrftoken";
static const char kHeaderName[] = "X-CSRF-Token";

std::string issue_csrf_token() {
    unsigned char raw[32];
    if (RAND_bytes(raw, 32) != 1) return {};
    static const char alpha[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    std::string out;
    out.reserve(43);
    for (size_t i = 0; i < 32; i += 3) {
        unsigned v = raw[i] << 16
                   | (i + 1 < 32 ? raw[i + 1] << 8 : 0)
                   | (i + 2 < 32 ? raw[i + 2] : 0);
        out.push_back(alpha[(v >> 18) & 0x3F]);
        out.push_back(alpha[(v >> 12) & 0x3F]);
        if (i + 1 < 32) out.push_back(alpha[(v >> 6) & 0x3F]);
        if (i + 2 < 32) out.push_back(alpha[v & 0x3F]);
    }
    return out;
}

bool constant_time_eq(const std::string& a, const std::string& b) {
    if (a.size() != b.size()) return false;
    unsigned diff = 0;
    for (size_t i = 0; i < a.size(); ++i) diff |= (unsigned char)a[i] ^ (unsigned char)b[i];
    return diff == 0;
}

bool check_csrf(const std::string& cookie_value, const std::string& header_value) {
    if (cookie_value.empty() || header_value.empty()) return false;
    return constant_time_eq(cookie_value, header_value);
}

bool enforce_origin(const std::string& sec_fetch_site,
                    const std::string& origin,
                    const std::unordered_set<std::string>& allowlist) {
    if (sec_fetch_site == "cross-site") return false;
    return allowlist.count(origin) > 0;
}
```
