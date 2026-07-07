---
slug: sec-csrf
module: web-security
title: Cross-Site Request Forgery (CSRF)
subtitle: How a page you never trusted can make your browser fire a fully authenticated request to a site you are logged into — and the token, SameSite, and header defenses that shut it down.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "OWASP — Cross Site Request Forgery (CSRF)"
    url: "https://owasp.org/www-community/attacks/csrf"
    type: article
  - title: "OWASP — CSRF Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"
    type: article
  - title: "MDN — Cross-site request forgery (CSRF)"
    url: "https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF"
    type: article
  - title: "MDN — SameSite cookies"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies#samesite_attribute"
    type: article
  - title: "PortSwigger — Cross-site request forgery (CSRF)"
    url: "https://portswigger.net/web-security/csrf"
    type: article
status: published
---

## intro
Cross-Site Request Forgery is an attack where a site you never trusted tricks your browser into sending a real, fully authenticated request to a site you *are* logged into. The attacker never sees your password or your session cookie — they do not need to. They only need your browser to make one HTTP request on their behalf, and the browser, by design, attaches your cookies to it automatically. If the target server treats "this request carried a valid session cookie" as proof that "the real user meant to do this," the forgery goes through: money moves, an email address changes, an admin is added. This lesson shows why that trust is misplaced and how to close the gap.

## whyItMatters
CSRF turns any state-changing endpoint that trusts a cookie alone into a remote-control button an attacker can press from a completely different origin. The victim just has to be logged in and visit a booby-trapped page — no click on a shady link required, since an auto-submitting form or a loaded image is enough. The consequences are the same as if the attacker had the victim's credentials for that one action: a bank transfer, a password reset, a changed shipping address, a granted permission. It has appeared in the OWASP Top Ten for years because the vulnerable pattern is so easy to write by accident — "the user is logged in, so this POST is legitimate" feels correct and is exactly wrong. Understanding CSRF is understanding the difference between *authentication* (who are you) and *intent* (did you actually mean to do this), and every real web app has to answer both.

## intuition
Start with the one browser behavior that makes CSRF possible: **cookies are attached automatically to every request bound for their origin, no matter who initiated that request.** When you log into `bank.com`, the server sets a session cookie. From that moment, *any* request your browser sends to `bank.com` — a link you click, an image that loads, a form that submits, a `fetch` from a script — carries that cookie along for the ride. The browser does not ask "did the user mean this?" or "which page started this?" It simply sees a request headed for `bank.com` and stamps the `bank.com` cookie onto it.

Now put an attacker in the picture. They cannot read your cookie (the same-origin policy stops their script on `evil.com` from touching `bank.com`'s cookies or reading `bank.com`'s responses). But they do not need to read anything. They just need to *cause* a request. So `evil.com` serves a page with a hidden form whose action points at `bank.com/transfer`, and a line of script that submits it the instant the page loads. Your browser dutifully sends that POST to `bank.com` — and attaches your session cookie, because that is what browsers do. To `bank.com`, the request looks perfectly authenticated. It came with a valid session. If the server checks nothing else, it processes the transfer.

This is the classic **confused deputy** problem. Your browser is a deputy that holds real authority (your logged-in session) and will act on instructions from whoever asks. The attacker cannot wield that authority directly, so they trick the deputy into wielding it for them. The authority is genuine; the *intent* behind exercising it is forged.

Both `GET` and `POST` matter here. A poorly designed app that changes state on `GET` (`/logout`, `/transfer?to=x&amount=100`) can be attacked with nothing more than an `<img src>` tag — the browser fetches the "image," sends the cookie, and the state changes. `POST` is only marginally harder: an auto-submitting hidden form does it. Neither method is safe by virtue of being "the POST one."

Keep CSRF distinct from **XSS**. XSS is the attacker running *their* script inside *your* trusted origin — a breach of the same-origin boundary from the inside. CSRF is the opposite: the attacker's code stays on their own origin and never reads a thing; they just borrow the ambient authority your browser carries. XSS defeats every CSRF token (the injected script can read the token from the page), which is why XSS is the more severe bug — but a site with no XSS can still be wide open to CSRF.

## visualization
```
   evil.com (attacker page)                 bank.com (target server)
   ------------------------                  ------------------------
   [1] victim, already logged
       into bank.com, visits
       the attacker's page
             |
   [2] hidden <form action=              (browser holds bank.com
       "bank.com/transfer">              session cookie from earlier
       auto-submits on load              login — attacker cannot read it)
             |
             |----- forged POST /transfer ----------->  [4] request arrives
             |      Cookie: session=... (auto-attached)      with valid cookie
             |      body: to=attacker&amount=5000
             |
             |                                          [5] server checks:
             |                                              token? SameSite?
             |      <----- 403 REJECTED --------------      MISSING  -> block
             |      <----- 200 transferred ----------      none set -> SUCCEED
```

## bruteForce
The tempting first defense is to check the `Referer` (or `Origin`) header — reject any state-changing request whose `Referer` is not your own site. It does raise the bar, and checking `Origin` on unsafe methods is a legitimate *secondary* layer. But leaning on `Referer` alone is weak: the header is routinely stripped by privacy settings, proxies, and `Referrer-Policy: no-referrer`, so strict checking breaks real users while lenient checking (allow when the header is absent) hands attackers a trivial bypass. It also does nothing for same-site sub-origins and is easy to get subtly wrong. Treat it as defense in depth, never the primary control.

## optimal
The durable fix is to demand proof of *intent* that an attacker on another origin cannot supply. Several mechanisms do this, and modern apps layer them.

**Synchronizer (anti-CSRF) token.** The server generates a random, unguessable token per session (or per request), embeds it in every form as a hidden field, and stores the expected value server-side. A legitimate submission echoes the token back; the server compares with a constant-time check and rejects any mismatch. The cross-site attacker cannot read the token — the same-origin policy blocks their script from reading your page's HTML — so they cannot forge a request that carries it. This is the gold standard and what frameworks like Django, Rails, and Flask-WTF ship by default.

**Double-submit cookie.** A stateless variant: the server sets the token in a cookie *and* the page sends it back in a form field or header. The server just checks the two match. It needs no server-side storage, but pair it with a signed/`__Host-` prefixed cookie so a sibling subdomain cannot overwrite it.

**SameSite cookies.** Mark the session cookie `SameSite=Lax` (or `Strict`). The browser then refuses to attach it to cross-site requests — `Strict` withholds it on every cross-site navigation, `Lax` allows it only on top-level GET navigations, which blocks the cross-site POST that CSRF relies on. `Lax` is the default in current browsers, which has quietly neutralized a huge swath of naive CSRF, but treat it as a strong baseline, not a complete substitute for tokens (older clients, GET-based state changes, and some cross-site flows still need the token).

**Custom request header + CORS for JSON APIs.** If an endpoint only accepts requests carrying a custom header like `X-Requested-With` or `X-CSRF-Token`, a cross-site attacker cannot add it: an HTML form cannot set custom headers, and a cross-origin `fetch` that tries triggers a CORS preflight the server can reject. So requiring a non-standard header on APIs is itself a CSRF control.

**Re-authentication / step-up.** For the most sensitive actions — changing a password, sending money, deleting an account — re-prompt for the password, a one-time code, or a fresh confirmation. Even if every other layer somehow failed, the attacker still does not have the second factor.

## complexity
time: Adding a synchronizer token is O(1) per request — generate one random value per session, stamp it into each form, and do one constant-time comparison on submit. SameSite is a single cookie attribute with zero runtime cost. The engineering effort is a one-time framework wiring, not a per-endpoint burden once the middleware is in place.
space: One token per session (a few dozen bytes) held server-side for the synchronizer pattern, or zero server state for the double-submit and SameSite approaches. Negligible either way.
notes: The cost of the defense is trivially small; the cost of *skipping* it is an account takeover or an unauthorized transaction on every cookie-authenticated state-changing endpoint you expose. This is one of the most lopsided risk-versus-effort trades in web security — there is no scenario where the token is the expensive part.

## pitfalls
- **Trusting the session cookie as proof of intent.** A valid cookie proves *who* the browser belongs to, not that *this specific action was intended*. Fix: require an unguessable per-session token on every state-changing request and verify it before acting.
- **Protecting POST but leaving state changes on GET.** A `GET /account/delete` or `/transfer?amount=...` is attackable with a bare `<img>` tag, no form needed. Fix: never mutate state on GET; reserve GET for safe, idempotent reads and put all mutations behind POST/PUT/DELETE with token checks.
- **Relying on the Referer/Origin header alone.** The header is stripped by proxies and privacy settings, so strict checks break users and lenient "allow if absent" checks are trivially bypassed. Fix: use Origin checking only as a secondary layer behind tokens or SameSite.
- **Comparing tokens with `==` instead of a constant-time compare.** A naive string comparison leaks timing information and can, in principle, be attacked byte by byte. Fix: use a constant-time comparison (`hmac.compare_digest`, `crypto.timingSafeEqual`) for every token check.
- **Assuming SameSite=Lax makes tokens unnecessary.** Lax still permits some cross-site GETs, does not cover every browser, and evaporates if any endpoint mutates on GET. Fix: keep the synchronizer token as the primary control and treat SameSite as defense in depth.

## interviewTips
- Lead with the mechanism, not the label: "the browser auto-attaches cookies to any request to an origin, so a page on another origin can cause an authenticated request without ever reading the cookie." That one sentence proves you understand *why* CSRF works, which is what the interviewer is probing for.
- Draw the sharp line to XSS: CSRF borrows ambient authority from the outside without reading anything, while XSS runs attacker code inside your origin and can read everything — so XSS defeats CSRF tokens, but a CSRF-safe site can still be XSS-vulnerable and vice versa. Confusing the two is the classic tell.
- Name the layered defense in priority order — synchronizer token (primary), SameSite cookies (baseline), custom header + CORS for JSON APIs, re-auth for sensitive actions — and mention constant-time token comparison. Listing the stack, not just "use a token," signals production experience.

## keyTakeaways
- CSRF works because browsers attach cookies to every request to an origin regardless of who initiated it, so a cross-site page can trigger a fully authenticated action without ever reading your session — a confused-deputy abuse of ambient authority.
- A valid session cookie proves identity, not intent; the fix is to demand proof an off-origin attacker cannot supply — an unguessable per-session token verified with a constant-time compare, backed by SameSite cookies and, for APIs, a required custom header.
- Never change state on GET, never trust the Referer header alone, and remember CSRF is the mirror image of XSS — the attacker's code stays on its own origin and reads nothing, which is exactly why tokens (unreadable across origins) stop it.

## code.javascript
```javascript
// VULNERABLE — a cookie-authenticated, state-changing endpoint with no
// CSRF defense. Any origin that gets the victim's browser to POST here
// wins, because the session cookie rides along automatically.
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.post('/transfer', (req, res) => {
  const session = lookupSession(req.cookies.session); // cookie == "proof"
  if (!session) return res.status(401).send('not logged in');
  // BUG: identity was checked, intent never was. A forged cross-site
  // POST reaches here with a valid cookie and moves the money.
  transfer(session.userId, req.body.to, req.body.amount);
  res.send('ok');
});

// FIXED — issue a per-session token, verify it on every mutation with a
// constant-time compare, AND scope the session cookie with SameSite.
import crypto from 'crypto';

app.use((req, res, next) => {
  const s = lookupSession(req.cookies.session);
  if (s && !s.csrfToken) {
    s.csrfToken = crypto.randomBytes(32).toString('hex'); // unguessable
  }
  req.session = s;
  next();
});

// Set the session cookie so the browser will not send it cross-site.
function setSessionCookie(res, id) {
  res.cookie('session', id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax', // browser withholds it on cross-site POSTs
  });
}

function verifyCsrf(req) {
  const expected = req.session?.csrfToken;
  const got = req.get('X-CSRF-Token') || req.body._csrf || '';
  if (!expected || got.length !== expected.length) return false;
  // constant-time compare — never a plain === on secrets
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

app.post('/transfer', (req, res) => {
  if (!req.session) return res.status(401).send('not logged in');
  if (!verifyCsrf(req)) return res.status(403).send('bad or missing CSRF token');
  transfer(req.session.userId, req.body.to, req.body.amount);
  res.send('ok');
});
```

## code.python
```python
# VULNERABLE — a Flask view that changes state on the strength of the
# session cookie alone. A forged cross-site POST arrives with a valid
# session and the transfer goes through.
import hmac
import secrets
from flask import Flask, request, session, abort

app = Flask(__name__)
app.secret_key = "REPLACE_WITH_A_REAL_SECRET_FROM_ENV"  # placeholder only


@app.post("/transfer")
def transfer_vulnerable():
    if "user_id" not in session:      # identity checked...
        abort(401)
    # BUG: intent never checked. Any origin that makes the browser POST
    # here succeeds, because the session cookie is attached automatically.
    do_transfer(session["user_id"], request.form["to"], request.form["amount"])
    return "ok"


# FIXED — mint a per-session token, embed it in the form, and verify it
# with a constant-time compare before acting. (Flask-WTF / Django's
# csrf middleware automate exactly this pattern in production.)
def issue_csrf_token():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_hex(32)  # unguessable
    return session["csrf_token"]


def valid_csrf(submitted: str) -> bool:
    expected = session.get("csrf_token", "")
    # hmac.compare_digest is constant-time — never use `==` on secrets.
    return bool(expected) and hmac.compare_digest(submitted, expected)


@app.post("/transfer")
def transfer_fixed():
    if "user_id" not in session:
        abort(401)
    token = request.form.get("_csrf") or request.headers.get("X-CSRF-Token", "")
    if not valid_csrf(token):
        abort(403)  # forged cross-site request has no valid token
    do_transfer(session["user_id"], request.form["to"], request.form["amount"])
    return "ok"


# Scope the session cookie so the browser will not send it cross-site,
# a strong baseline layered under the token above.
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE="Lax",
)
```
