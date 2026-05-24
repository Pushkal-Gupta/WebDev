---
slug: csrf-protection
module: system-design
title: CSRF Protection
subtitle: Stop another site's JS from making authenticated requests on the user's behalf — via SameSite cookies + CSRF tokens + origin checks.
difficulty: Intermediate
position: 35
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "OWASP — CSRF Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"
    type: book
  - title: "MDN — Cookies + SameSite attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite"
    type: blog
  - title: "expressjs/csurf — historical CSRF middleware (still widely used)"
    url: "https://github.com/expressjs/csurf"
    type: repo
status: published
---

## intro
A user is logged into `bank.com`. They visit `evil.com`. `evil.com`'s JS does `fetch('https://bank.com/transfer', { method: 'POST', credentials: 'include', body: { to: 'attacker' } })`. The browser sends the user's `bank.com` cookies along — the bank sees an authenticated request and executes the transfer. That's **CSRF** (Cross-Site Request Forgery). Three modern defenses: **SameSite cookies** (cookie not sent on cross-site requests), **CSRF tokens** (server-issued nonce that JS-from-another-site can't read), and **origin checks** (reject if `Origin` header doesn't match).

## whyItMatters
CSRF used to be the #2 web vuln (OWASP Top 10). Modern browsers default cookies to `SameSite=Lax` since 2020 (Chrome 80), which kills naive CSRF — but not all of it. Defense-in-depth still required:
- Older browsers without SameSite default.
- Subdomains can still attack (`evil.bank.com`).
- Same-site cross-origin (e.g., subdomain takeover).
- API endpoints meant for first-party only.

Stripe, banks, all major SaaS use a token + SameSite combo.

## intuition
Three orthogonal defenses:

1. **SameSite cookies**: tell browser to omit the cookie on cross-site requests. Three modes:
   - `Strict`: cookie never sent cross-site. Strongest but breaks links from email/external sites.
   - `Lax` (modern default): cookie sent on top-level GET navigations from another site, but NOT on cross-site POST/AJAX. Sweet spot for most apps.
   - `None`: legacy behavior. Required if you intentionally embed your site in a 3rd-party iframe (with `Secure`).

2. **CSRF tokens** (synchronizer pattern): server issues a random token on page load, stores it in the session, embeds it in forms (`<input name="_csrf" value="abc123">`) or response headers. Subsequent POST must include the token. `evil.com`'s JS can't read your `bank.com` page (same-origin policy) → can't get the token → can't forge.

3. **Origin / Referer check**: server rejects requests where `Origin` (or `Referer`) doesn't match its own. Hard to forge from the browser.

## visualization
```
Attack flow (without protection):
  User logged into bank.com (session cookie set).
  User visits evil.com (in the same tab or another).
  evil.com runs:
    fetch('https://bank.com/transfer', {
      method: 'POST', credentials: 'include',
      body: JSON.stringify({ to: 'attacker', amount: 1000 }),
    });
  Browser sends bank.com session cookie automatically.
  bank.com sees an authenticated POST → transfers money. ❌

Defense with SameSite=Lax + CSRF token:
  evil.com tries the fetch:
    1. Browser: cross-site POST → SameSite=Lax means cookie NOT sent.
       Request arrives without session cookie → 401 Unauthorized. ✓
    OR even if cookie sent (older browser):
    2. Server checks for _csrf token in body — evil.com couldn't read it (CORS).
       Missing token → 403 Forbidden. ✓
```

## bruteForce
**Pre-2020 / no SameSite**: relied solely on CSRF tokens — works but fragile (developer must thread token through every form).

**Just rely on `Authorization: Bearer` headers** (no cookies): immune to CSRF (tokens not auto-sent). But forces client-side token storage → XSS risk.

**Check Referer only**: spoofable in some old browsers / privacy modes that strip Referer.

The modern stack: SameSite=Lax cookies + CSRF token for state-changing endpoints + Origin check as a third layer.

## optimal
**Cookie settings**:
```
Set-Cookie: session=abc;
            Path=/;
            HttpOnly;
            Secure;
            SameSite=Lax;
            Max-Age=86400
```

**Synchronizer token flow**:
1. On GET, server generates random token, stores in session, returns in response (as cookie OR in a hidden form field OR in a custom response header for SPAs).
2. SPA reads token (from cookie via JS — only works if cookie is NOT `HttpOnly`; the **double-submit** variant) or from response body.
3. SPA sends token in custom header `X-CSRF-Token: <token>` on every POST/PUT/DELETE.
4. Server validates token matches what's stored in the session. Mismatch → 403.

**Double-submit cookie** (works without server-side session storage):
1. Server sets a random cookie `csrf_token=abc` (not HttpOnly — JS can read).
2. JS reads cookie + sends it in `X-CSRF-Token: abc` header.
3. Server checks header matches cookie. Cross-origin JS can't read the cookie → can't construct the header.

**Origin check**:
```js
if (req.headers.origin !== 'https://app.example.com') {
  return res.status(403).send('Forbidden origin');
}
```

## complexity
- **SameSite cookies**: zero runtime overhead — browser does it.
- **CSRF token validation**: O(1) per request (HMAC compare or session lookup).
- **Origin check**: O(1) string compare.

## pitfalls
- **`SameSite=None` without `Secure`**: rejected by Chrome since 2020.
- **`SameSite=Lax` breaks 3rd-party iframes**: payment widgets, embeds need `SameSite=None; Secure`.
- **CSRF token in URL** (`?csrf=abc`): leaks via Referer header. Always send in body or header.
- **Per-request token rotation**: enhances security but breaks "open multiple tabs." Most apps stick with per-session tokens.
- **HEAD/OPTIONS/GET protection**: only POST/PUT/DELETE need CSRF tokens. Don't accidentally require tokens on safe methods or you'll break image/CSS loads.

## interviewTips
- For "how do you prevent CSRF" → SameSite=Lax + token + Origin check.
- Distinguish **CSRF** (server-side, prevents unwanted state changes) from **CORS** (browser-enforced, prevents cross-origin reads).
- For senior: explain double-submit-cookie pattern + why HTTP-only token cookies don't work for SPAs.

## code.python
```python
# Flask + Flask-WTF (synchronizer token)
from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect(app)
# Forms auto-inject {{ csrf_token() }}; AJAX:
# fetch('/api/transfer', {
#   method: 'POST',
#   headers: { 'X-CSRFToken': document.querySelector('meta[name=csrf-token]').content },
#   body: ...,
# })
```

## code.javascript
```javascript
// Express + cookie + double-submit
const cookieParser = require('cookie-parser');
app.use(cookieParser());

function csrfCheck(req, res, next) {
  if (['POST','PUT','DELETE'].includes(req.method)) {
    const cookie = req.cookies['csrf_token'];
    const header = req.headers['x-csrf-token'];
    if (!cookie || cookie !== header) return res.status(403).send('CSRF');
  }
  next();
}
```

## code.java
```java
// Spring Security — CSRF on by default
@Configuration
class SecConfig {
    @Bean
    public SecurityFilterChain chain(HttpSecurity http) throws Exception {
        http.csrf(c -> c.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()));
        return http.build();
    }
}
```

## code.cpp
```cpp
// Drogon: built-in CSRF middleware
// drogon::app().registerFilter<drogon::CsrfFilter>();
// Each route auto-protected; client sends X-CSRF-Token header.
```
