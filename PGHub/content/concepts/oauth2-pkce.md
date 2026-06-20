---
slug: oauth2-pkce
module: sd-auth-security
title: OAuth 2.0 with PKCE
subtitle: Authorization Code flow + PKCE — secure for public clients (SPAs, mobile apps) without storing a client secret.
difficulty: Advanced
position: 43
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "RFC 7636 — Proof Key for Code Exchange"
    url: "https://datatracker.ietf.org/doc/html/rfc7636"
    type: book
  - title: "OAuth 2.0 Simplified (Aaron Parecki)"
    url: "https://www.oauth.com/oauth2-servers/pkce/"
    type: blog
  - title: "panva/node-oidc-provider — production OAuth provider"
    url: "https://github.com/panva/node-oidc-provider"
    type: repo
status: published
---

## intro
**PKCE** (Proof Key for Code Exchange, pronounced "pixie") is an extension to the OAuth 2.0 Authorization Code flow that lets **public clients** (SPAs, mobile apps, CLIs — anything that can't keep a secret) prove ownership of an in-progress auth flow. The client generates a random `code_verifier`, sends its SHA-256 hash (`code_challenge`) with the auth request, then sends the verifier when exchanging the code for tokens. An attacker who steals the auth code can't redeem it without the verifier.

## whyItMatters
Pre-PKCE, public clients used the "Implicit flow" — tokens delivered directly in URL fragment. Big problems: tokens leaked via browser history, no refresh tokens, vulnerable to interception.

OAuth Working Group now mandates PKCE for ALL public clients (RFC 8252, RFC 6749 errata). Modern providers (Google, Auth0, Okta, Cognito, Supabase, Stripe Connect) all require it for SPAs and mobile.

## intuition
The attack PKCE prevents:
1. Mobile app initiates OAuth → user signs in → provider redirects with `?code=xyz`.
2. Malicious app on same device intercepts the redirect (custom URL scheme collision).
3. Without PKCE: malicious app uses the code to get tokens → ATO.

With PKCE:
1. App generates `code_verifier = random(43-128 chars)`.
2. App computes `code_challenge = BASE64URL(SHA256(code_verifier))`.
3. App opens browser: `/authorize?...&code_challenge=...&code_challenge_method=S256`.
4. Provider stores the challenge alongside the issued code.
5. App receives code → POST `/token?code=xyz&code_verifier=ORIGINAL_VERIFIER`.
6. Provider hashes the verifier and compares to stored challenge. Mismatch → reject.

Malicious app got the code but didn't see the verifier → can't redeem.

## visualization
```
Step 1: app generates
  code_verifier  = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"   (random 43+ chars)
  code_challenge = BASE64URL(SHA256(code_verifier))
                 = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

Step 2: app → browser → /authorize endpoint
  GET https://auth.example.com/authorize?
    response_type=code&
    client_id=spa-app&
    redirect_uri=https://app.example.com/cb&
    code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
    code_challenge_method=S256&
    scope=openid profile email&
    state=randomNonce

Step 3: user signs in, consents
  Provider redirects: https://app.example.com/cb?code=abc123&state=randomNonce
  (also stores: code abc123 → challenge E9Mel... + client_id + redirect_uri)

Step 4: app exchanges code
  POST https://auth.example.com/token
    grant_type=authorization_code
    code=abc123
    redirect_uri=https://app.example.com/cb
    client_id=spa-app
    code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

  Provider:
    1. Look up code abc123 → finds stored challenge E9Mel...
    2. Compute SHA256(code_verifier), BASE64URL → "E9Mel..."
    3. Compare to stored challenge. MATCH. ✓
    4. Issue access_token + refresh_token + id_token.

Step 5: app uses access_token in API calls
  GET https://api.example.com/me
    Authorization: Bearer eyJ...
```

## bruteForce
**Implicit flow (deprecated)**: provider returns access token directly in URL fragment. No refresh tokens. Token leaks via browser history + referer headers. **Don't use.**

**Authorization Code flow without PKCE (for public clients)**: vulnerable to code interception attacks. RFC explicitly forbids for public clients now.

**Storing a "client secret" in mobile app / SPA**: not secret. Anyone can decompile the app and read it. Use PKCE instead.

PKCE is the only correct flow for public clients.

## optimal
**Generate verifier** (per auth attempt — never reuse):
```js
const verifier = base64url(crypto.randomBytes(32));   // 43+ chars
const challenge = base64url(sha256(verifier));
sessionStorage.setItem('pkce_verifier', verifier);
```

**Auth URL** redirects user:
```
https://auth.example.com/authorize?
  response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &scope=openid+profile+email
  &state=NONCE_FOR_CSRF
  &code_challenge=<challenge>
  &code_challenge_method=S256
```

**On callback** (your `/cb` handler):
```js
const code = new URL(location.href).searchParams.get('code');
const stateReturned = new URL(location.href).searchParams.get('state');
// Validate state matches your stored nonce (CSRF check).
const verifier = sessionStorage.getItem('pkce_verifier');
const tokens = await fetch('https://auth.example.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: 'https://app.example.com/cb',
    client_id: 'YOUR_CLIENT_ID',
    code_verifier: verifier,
  }),
}).then(r => r.json());
// tokens.access_token, tokens.refresh_token, tokens.id_token
```

**Refresh tokens**: store securely (HttpOnly cookie if possible, never localStorage for SPAs unless you accept XSS risk). Rotate on use.

## complexity
- **Per auth flow**: 1 redirect + 1 token POST. ~2 seconds end-to-end (with user interaction).
- **Crypto**: SHA-256 + base64url encode. Negligible.
- **Refresh token rotation**: 1 token POST per refresh.

## pitfalls
- **`code_challenge_method=plain`**: weaker (no SHA). Use `S256`.
- **Reusing verifier across attempts**: defeats the purpose. Generate fresh every time.
- **Verifier < 43 chars**: rejected by RFC.
- **Skipping state nonce**: PKCE protects code, but state nonce protects against CSRF in the redirect. Both required.
- **Storing tokens in localStorage**: vulnerable to XSS. Use HttpOnly cookies + sameSite + Secure where possible.
- **Refresh token theft**: rotate refresh tokens on each use; revoke entire family on suspicious reuse.

## interviewTips
- For "secure OAuth for SPA / mobile" → PKCE + Authorization Code flow.
- Distinguish from **Client Credentials** (server-to-server, no user) and **Device Code** (TVs / CLIs).
- Mention **rotating refresh tokens** to mitigate stolen refresh.
- For senior interviews, discuss **token storage** (localStorage XSS risk vs HttpOnly cookie CSRF risk).

## code.python
```python
import secrets, hashlib, base64
def gen_pkce():
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b'=').decode()
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b'=').decode()
    return verifier, challenge

v, c = gen_pkce()
auth_url = f'https://auth.example.com/authorize?response_type=code&client_id=...&redirect_uri=...&code_challenge={c}&code_challenge_method=S256'
```

## code.javascript
```javascript
async function genPKCE() {
  const verifier = btoa(crypto.getRandomValues(new Uint8Array(32))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return { verifier, challenge };
}
const { verifier, challenge } = await genPKCE();
sessionStorage.setItem('pkce_v', verifier);
location.href = `https://auth.example.com/authorize?response_type=code&client_id=...&redirect_uri=...&code_challenge=${challenge}&code_challenge_method=S256&state=${crypto.randomUUID()}`;
```

## code.java
```java
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
public static String[] genPKCE() throws Exception {
    byte[] verifierBytes = new byte[32];
    new SecureRandom().nextBytes(verifierBytes);
    String verifier = Base64.getUrlEncoder().withoutPadding().encodeToString(verifierBytes);
    byte[] digest = MessageDigest.getInstance("SHA-256").digest(verifier.getBytes());
    String challenge = Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
    return new String[]{verifier, challenge};
}
```

## code.cpp
```cpp
// Use OpenSSL for SHA-256 + base64url
// std::string verifier = base64url(random_bytes(32));
// uint8_t digest[SHA256_DIGEST_LENGTH];
// SHA256((uint8_t*)verifier.c_str(), verifier.size(), digest);
// std::string challenge = base64url(std::string((char*)digest, 32));
```
