---
slug: sec-xss
module: web-security
title: Cross-Site Scripting (XSS)
subtitle: How untrusted input becomes executable script in someone else's browser — reflected, stored, and DOM-based — and the output encoding, CSP, and sanitizer stack that keeps it inert.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "OWASP — Cross Site Scripting (XSS)"
    url: "https://owasp.org/www-community/attacks/xss/"
    type: article
  - title: "OWASP — Cross Site Scripting Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"
    type: article
  - title: "MDN — Content Security Policy (CSP)"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP"
    type: article
  - title: "PortSwigger — Cross-site scripting"
    url: "https://portswigger.net/web-security/cross-site-scripting"
    type: article
status: published
---

## intro
Cross-Site Scripting is what happens when data a user typed gets treated as code the browser runs. A comment, a search term, a profile name — any string that flows from an attacker, through your server or your JavaScript, and back into a page without being neutralized can carry a `<script>` tag or an event handler that executes in the victim's session. Because that script runs on your origin, it inherits the victim's cookies, tokens, and permissions. This lesson covers the three shapes XSS takes — reflected, stored, and DOM-based — why the naive "filter bad words" defense fails, and the layered fix that actually works: context-aware output encoding, a Content Security Policy, and trusted sanitizers.

## whyItMatters
XSS has sat near the top of the OWASP list for two decades because it is easy to introduce and devastating to exploit. A single unescaped interpolation — one template that drops `name` straight into HTML — hands an attacker JavaScript execution inside your application's security context. From there they can steal session cookies, read the DOM (including CSRF tokens and any data on screen), make authenticated requests as the victim, deface the page, keylog a login form, or pivot to worm-like self-propagation across a social platform. It does not require the victim to install anything or make a mistake; visiting a crafted link or viewing a poisoned comment is enough. Every input surface you own is a potential injection point, so understanding output encoding is not optional security trivia — it is table stakes for shipping any page that renders user-controlled data.

## intuition
The core of XSS is a confusion between **data** and **code**. The browser's HTML parser reads a response and decides, character by character, what is text to display and what is markup to act on. A `<` is not a literal less-than sign to the parser — it is "a tag starts here." So the instant an attacker's string containing `<script>` lands in the HTML *without being escaped*, the parser opens a real script element and runs it. The attacker never needed access to your server's code; they only needed their input to cross the line from "content shown on the page" to "instructions the browser executes." That line is the **trust boundary**, and XSS is the failure to enforce it on the way out.

The three variants differ only in *where* the untrusted input travels before it reaches that boundary. **Reflected XSS** bounces input straight off the server in the immediate response: a search page that echoes `You searched for: <term>` will run whatever markup `term` contains. The payload lives in a URL or form the victim is tricked into submitting, so the attack is per-request and per-victim. **Stored XSS** is worse: the input is saved — a comment, a bio, a support ticket — and served to *everyone* who later views it. One injection poisons every visitor, with no per-victim social engineering. **DOM-based XSS** never touches the server response at all; it happens entirely in the browser when client-side JavaScript reads an attacker-controlled *source* (like `location.hash` or `document.referrer`) and writes it into a dangerous *sink* (like `innerHTML`, `document.write`, or `eval`). The server sends a perfectly clean page, and the script assembles the vulnerability at runtime.

In all three, the mechanism is identical: untrusted input reaches a place where the browser interprets it, and nothing along the way converted its special characters into harmless text. Fix the boundary — encode on output for the exact context — and the payload becomes inert regardless of which path it took to get there.

## visualization
```
  ATTACKER INPUT:  <img src=x onerror=steal(cookie)>
        |
        +--> REFLECTED: server echoes it into this response ---+
        |                                                      |
        +--> STORED: saved in DB, served to every viewer ------+
        |                                                      |
        +--> DOM: client JS writes it into innerHTML ----------+
                                                               v
                                                     BROWSER HTML PARSER
                                                               |
                                     +-------------------------+-------------------------+
                                     |                                                   |
                              NO ENCODING                                          ENCODED ON OUTPUT
                              < stays "<"                                          < becomes "&lt;"
                                     |                                                   |
                                     v                                                   v
                            EXECUTABLE NODE                                        INERT TEXT NODE
                            onerror fires  ->  XSS                            shows literal characters, safe
```

## bruteForce
The tempting first defense is a blacklist: scan incoming input for dangerous substrings — `<script`, `javascript:`, `onerror`, `alert(` — and reject or strip them. It feels reasonable and blocks the textbook payload, so it ships. It is also fundamentally broken. HTML, URLs, and JavaScript have enormous encoding flexibility, so the same attack has thousands of spellings a filter never anticipates: mixed case (`<ScRiPt>`), whitespace and newlines inside the tag, HTML entities (`&#x3C;script&#x3E;`), null bytes, `<svg onload=...>` instead of `<script>`, `<img>`/`<iframe>`/`<body>` vectors, or event handlers you never listed. Blacklists enumerate badness — an infinite set — and attackers only need one omission. You cannot filter your way to safety on the input side.

## optimal
The correct model is: treat all input as untrusted **data**, and neutralize it at the moment it crosses into a browser-interpreted context by **encoding for that specific context**. Encoding is a whitelist of safe output, not a blacklist of bad input, so it fails closed.

**Context-aware output encoding** is the foundation. The same string needs different escaping depending on *where* it lands. In **HTML body/text** context, escape `& < > " '` to entities (`&amp; &lt; &gt; &quot; &#39;`) so no tag can open. In an **HTML attribute** context, quote the value and entity-encode it so the payload cannot break out of the quotes. In a **JavaScript** context (inside a `<script>` or an inline handler), you need JS-string escaping — and honestly, you should avoid ever interpolating untrusted data into script; pass it as JSON via a data attribute instead. In a **URL** context, `encodeURIComponent` the value and reject `javascript:`/`data:` schemes. Putting the right value in the wrong encoder is itself a bug.

**Framework auto-escaping** does this for you and should be your default. React escapes any string rendered as a child (`{userInput}` is always text); Jinja2, Django, and most modern template engines auto-escape by convention. The vulnerabilities appear when you deliberately opt out — `dangerouslySetInnerHTML`, `v-html`, `|safe`, `mark_safe`, `innerHTML`. If you must render user-supplied *rich* HTML (a WYSIWYG comment), run it through a **trusted sanitizer** like **DOMPurify** that parses the markup and strips scripts, event handlers, and dangerous attributes while keeping allowed tags — never a hand-rolled regex.

**Content Security Policy** is the second layer: a response header (`Content-Security-Policy: script-src 'self'`) that tells the browser to refuse inline scripts and only load JS from approved origins. Even if a payload slips through encoding, a strict CSP stops it from executing — defense in depth, not a primary fix. Finally, set **`HttpOnly`** on session cookies so that even a successful XSS cannot read them from JavaScript, and add **`Secure`** and `SameSite` to shrink the blast radius.

## complexity
time: Encoding a string is a single linear pass over its characters — `O(n)` in the length of the output, with a tiny constant. In practice it is free: frameworks do it inline as they render, so the runtime cost is effectively zero on the request path.
space: `O(n)` for the escaped copy of the string; entity expansion at most multiplies length by a small constant. A CSP adds a few hundred bytes to response headers, once.
notes: The asymmetry is the whole point. Correct encoding costs microseconds and a handful of bytes; a single missed interpolation costs full account takeover for every user who loads the page. There is no performance argument for skipping it — the expensive path is the one where you don't encode.

## pitfalls
- **Blacklisting input instead of encoding output.** Stripping `<script>` on the way in misses `<svg onload>`, entity-encoded payloads, and case tricks — an infinite set of bypasses. Fix: stop filtering input for XSS; encode every untrusted value for its exact output context, which fails closed.
- **Encoding for the wrong context.** HTML-escaping a value that lands inside a `<script>` block or a `href="javascript:..."` attribute does nothing — the escaped characters are still valid there. Fix: choose the encoder by destination — HTML body, attribute, JS, and URL each need their own; never interpolate untrusted data into script at all.
- **Trusting a hand-written sanitizer.** Regex "HTML cleaners" are trivially bypassed and lull you into a false sense of safety. Fix: use a maintained, parser-based sanitizer like DOMPurify for rich HTML, and keep it updated as new bypasses are disclosed.
- **DOM sinks that skip the server entirely.** `element.innerHTML = location.hash` is XSS even though the server response is clean, so server-side escaping never runs. Fix: assign untrusted data with `textContent`/`setAttribute`, avoid `innerHTML`/`document.write`/`eval`, and enable Trusted Types to police the sinks.
- **Treating CSP as the only defense.** A CSP is a backstop; a loose policy (`unsafe-inline`, wildcard `script-src`) provides almost no protection and encourages skipping encoding. Fix: keep output encoding as the primary control and layer a strict, nonce- or hash-based CSP behind it.

## interviewTips
- State the data-versus-code framing first, then name the three variants by *where the input travels* — reflected bounces off the immediate response, stored is saved and served to everyone, DOM-based happens entirely client-side via a source-to-sink flow — and give a one-line example of each.
- Be explicit that the fix is context-aware **output** encoding, not input filtering, and explain *why* a blacklist fails: it enumerates an infinite set of bad inputs while encoding whitelists safe output. Mention framework auto-escaping and the escape hatches (`dangerouslySetInnerHTML`, `|safe`) that reintroduce the bug.
- Position CSP and `HttpOnly` cookies as defense-in-depth layers, not the primary control — a strong answer distinguishes "stops the script from being created" (encoding) from "stops it from running or from stealing the cookie if it does" (CSP, HttpOnly).

## keyTakeaways
- XSS is a data/code confusion at the browser's parse boundary: untrusted input that isn't neutralized on output becomes an executable node running in the victim's session on your origin.
- Reflected, stored, and DOM-based differ only in the path the input takes — immediate response, persistent storage, or client-side source-to-sink — but all are fixed by encoding at the boundary.
- Defend on output, not input: context-aware encoding (leaning on framework auto-escaping) is the primary control, DOMPurify sanitizes rich HTML, and CSP plus HttpOnly cookies are the backstops.

## code.javascript
```javascript
// VULNERABLE: assigning untrusted input to innerHTML lets the browser's
// parser turn the string into real markup. An <img onerror=...> or a
// <script> in `comment` executes immediately in the victim's session.
function renderCommentUnsafe(comment) {
  const box = document.querySelector('#comment');
  box.innerHTML = comment; // XSS: markup is parsed, handlers fire
}

// VULNERABLE (DOM-based): a client-side source flows into a sink with no
// server involvement at all. The page HTML is clean; JS builds the hole.
function showFromHashUnsafe() {
  const msg = decodeURIComponent(location.hash.slice(1));
  document.write(msg); // XSS: attacker controls location.hash
}

// FIX 1 — textContent treats the value as data, never markup. The literal
// characters '<img ...>' are shown; nothing is parsed or executed.
function renderCommentSafe(comment) {
  const box = document.querySelector('#comment');
  box.textContent = comment; // inert: rendered as visible text
}

// FIX 2 — when you truly need rich HTML (bold, links), sanitize with a
// trusted, parser-based library. Never a hand-rolled regex.
import DOMPurify from 'dompurify';

function renderRichCommentSafe(commentHtml) {
  const box = document.querySelector('#comment');
  const clean = DOMPurify.sanitize(commentHtml, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
  box.innerHTML = clean; // scripts and on* handlers already stripped
}

// FIX 3 — manual HTML escaping for the HTML-body context, if you must
// build strings by hand. Whitelist-style: convert the five specials.
function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;') // & first, or later entities double-escape
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

## code.python
```python
# VULNERABLE: string-concatenating untrusted input into an HTML response.
# Whatever `name` contains is served verbatim and parsed by the browser.
from flask import Flask, request, Response

app = Flask(__name__)

@app.route("/greet-unsafe")
def greet_unsafe():
    name = request.args.get("name", "")
    # XSS: name="<script>steal()</script>" runs in the victim's browser
    return Response(f"<h1>Hello, {name}!</h1>", mimetype="text/html")


# FIX 1 — Jinja2 autoescaping. render_template / render_template_string
# with .html templates auto-escapes every {{ variable }} to inert text.
from flask import render_template_string

SAFE_TMPL = "<h1>Hello, {{ name }}!</h1>"  # {{ }} is auto-escaped

@app.route("/greet-safe")
def greet_safe():
    name = request.args.get("name", "")
    # '<script>' is rendered as '&lt;script&gt;' — shown, never executed.
    return render_template_string(SAFE_TMPL, name=name)


# FIX 2 — explicit escaping when building markup by hand, using the same
# battle-tested escaper Jinja2 uses under the hood.
from markupsafe import escape

@app.route("/greet-escaped")
def greet_escaped():
    name = request.args.get("name", "")
    return Response(f"<h1>Hello, {escape(name)}!</h1>", mimetype="text/html")


# FIX 3 — for user-supplied RICH HTML, sanitize with a trusted library
# (bleach/nh3) instead of trusting the input or disabling autoescape.
import nh3  # ammonia bindings; a maintained, parser-based sanitizer

def clean_rich_html(user_html: str) -> str:
    return nh3.clean(
        user_html,
        tags={"b", "i", "em", "strong", "a"},
        attributes={"a": {"href"}},
    )
```
