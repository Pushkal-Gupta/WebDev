---
slug: oauth2-flows
module: system-design
title: OAuth 2.0 Flows
subtitle: Authorization code, PKCE, client credentials, device flow — which to pick and why "implicit" is dead.
difficulty: Advanced
position: 2
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — OAuth 2.0 Bearer Token Usage"
    url: "https://martinfowler.com/articles/microservice-security.html"
    type: blog
  - title: "Microservices.io — OAuth Pattern"
    url: "https://microservices.io/patterns/security/access-token.html"
    type: blog
  - title: "donnemartin/system-design-primer — OAuth notes"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
OAuth 2.0 is not authentication; it is *delegated authorization* — a framework for one app (the client) to obtain a scoped access token to call another app (the resource server) on behalf of a user (the resource owner) without ever seeing the user's password. The framework defines several flows because different clients have different trust profiles: a server-rendered web app, a SPA in a browser, a CLI on a smart TV, and a backend cron job all need different bootstraps to the same `Authorization: Bearer <token>` header.

## whyItMatters
Pick the wrong flow and you either ship a credential-stealing bug or fail a security review. The "implicit" flow (tokens in the URL fragment) was deprecated by OAuth 2.1 because browsers leak fragments to history, referrers, and extensions. Resource-owner-password-credentials (ROPC) is forbidden for third-party apps because it requires the client to handle the user's password. Knowing which flow fits which client is now a baseline expectation in any senior interview that touches identity.

## intuition
Reduce every flow to two phases: *bootstrap* (how the client gets the user's consent and exchanges it for tokens) and *use* (the client attaches the access token to every API call). The flows differ only in phase one. Picture a hotel keycard: the access token is the keycard, the refresh token is the front-desk receipt that lets you mint a new keycard, and the authorization server is the front desk. PKCE adds a tamper-evident envelope around the keycard request so a thief who snatches the redirect cannot redeem it.

## visualization
Authorization-code + PKCE in one paragraph:

```
1. Client generates code_verifier (random 43-128 char string).
2. code_challenge = BASE64URL(SHA256(code_verifier)).
3. Browser -> /authorize?response_type=code&code_challenge=...&code_challenge_method=S256
4. User logs in, consents -> redirect: /callback?code=AUTHZ_CODE
5. Client POST /token  { code, code_verifier, client_id }
6. Server checks SHA256(code_verifier) == code_challenge -> issues access_token + refresh_token.
```

Without PKCE, an intercepted `AUTHZ_CODE` is enough. With PKCE, the attacker also needs the verifier — which never left the original client.

## bruteForce
"Just send the username and password to the API and store them in localStorage." This is ROPC (now discouraged) plus a credential leak. Any XSS or extension reads localStorage; the user must trust the client with the password (which defeats the entire reason OAuth exists); password rotation invalidates every device; and there is no scoping — the client gets full access, not just `read:profile`.

## optimal
Pick by client type:

- **Server-side web app** (can keep a secret): authorization code with a client secret. Tokens stay on the server; the browser holds an HTTP-only session cookie.
- **SPA / mobile app** (cannot keep a secret): authorization code + PKCE, no client secret. Use short-lived access tokens (5–15 min) and rotate refresh tokens.
- **Backend-to-backend / cron** (no user): client credentials. Two-legged — the client authenticates with its own credentials and receives a token scoped to itself.
- **TV / CLI** (no browser): device authorization — client shows a user code, user visits the URL on a phone to authorize, client polls the token endpoint.

For token transport: HTTP-only `Secure` `SameSite=Lax` cookies for browser apps; `Authorization: Bearer` header for native and server clients. Never put tokens in localStorage if you have any choice.

## complexity
time: One round trip per request once a token is cached; refresh adds one extra round trip every 5–60 minutes.
space: A few hundred bytes per active session on the auth server (token introspection cache) or zero if using stateless JWTs.
notes: Refresh tokens should be one-time-use and rotated; reuse of an old refresh token is the canonical signal of token theft and must revoke the entire family.

## pitfalls
- Storing tokens in `localStorage` — XSS = total account takeover.
- Skipping PKCE on a public client — anyone who can read the redirect URL can hijack the code.
- Using the `state` parameter for nothing — it exists to defeat CSRF on the redirect; verify it matches what you sent.
- Treating an ID token (OIDC) as an access token — ID tokens are for the client to identify the user, never for calling APIs.
- Long-lived access tokens — if you cannot revoke quickly, you cannot recover from a leak. Keep them short.

## interviewTips
- State the client type first ("this is a SPA, so authorization-code + PKCE") — it shows you know the picker.
- Mention rotation: refresh tokens are rotated on every use; access tokens are short (5–15 min); both are kept in HTTP-only cookies when the client is a browser.
- Know OIDC (OpenID Connect) sits *on top* of OAuth 2.0 and adds the `id_token` (a JWT identifying the user) — required if you want SSO.
- For "design login," sketch the authorization-code + PKCE diagram on the whiteboard; do not start coding.

## code.python
```python
# Authorization Code + PKCE (Authlib client)
from authlib.integrations.requests_client import OAuth2Session
import secrets, hashlib, base64

verifier = secrets.token_urlsafe(64)
challenge = base64.urlsafe_b64encode(
    hashlib.sha256(verifier.encode()).digest()
).rstrip(b"=").decode()

oauth = OAuth2Session("client-id", scope="read:profile", redirect_uri="https://app/cb")
url, state = oauth.create_authorization_url(
    "https://auth/authorize",
    code_challenge=challenge,
    code_challenge_method="S256",
)
# user visits url, returns to /cb?code=...&state=...
token = oauth.fetch_token(
    "https://auth/token",
    authorization_response=callback_url,
    code_verifier=verifier,
)
```

## code.javascript
```javascript
// PKCE in the browser
async function sha256Base64Url(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const verifier = crypto.getRandomValues(new Uint8Array(32))
  .reduce((s, b) => s + String.fromCharCode(b), "");
const challenge = await sha256Base64Url(verifier);
sessionStorage.setItem("pkce_verifier", verifier);

location.href = `https://auth/authorize?response_type=code&client_id=app`
  + `&redirect_uri=${encodeURIComponent("https://app/cb")}`
  + `&scope=read:profile&code_challenge=${challenge}&code_challenge_method=S256`
  + `&state=${crypto.randomUUID()}`;

// On /cb: POST /token with { code, code_verifier: sessionStorage.getItem("pkce_verifier") }
```

## code.java
```java
// Spring Authorization Client: configure pkce in application.yml
// then the framework drives the flow.
@Configuration
public class OAuthConfig {
    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(a -> a.anyRequest().authenticated())
            .oauth2Login(o -> o.loginPage("/login"))
            .build();
    }
}

// application.yml:
// spring.security.oauth2.client.registration.idp.client-id: app
// spring.security.oauth2.client.registration.idp.client-authentication-method: none
// spring.security.oauth2.client.registration.idp.authorization-grant-type: authorization_code
// spring.security.oauth2.client.registration.idp.scope: read:profile
```

## code.cpp
```cpp
// Sketch using libcurl + OpenSSL for the token POST after PKCE redirect.
#include <curl/curl.h>
#include <openssl/sha.h>

std::string sha256_b64url(const std::string& s) {
    unsigned char h[32];
    SHA256((unsigned char*)s.data(), s.size(), h);
    // base64url-encode h, strip '='
    return base64url(h, 32);
}

void exchange_code(const std::string& code, const std::string& verifier) {
    CURL* c = curl_easy_init();
    std::string body = "grant_type=authorization_code&code=" + code +
                       "&code_verifier=" + verifier +
                       "&client_id=app&redirect_uri=https://app/cb";
    curl_easy_setopt(c, CURLOPT_URL, "https://auth/token");
    curl_easy_setopt(c, CURLOPT_POSTFIELDS, body.c_str());
    curl_easy_perform(c);
    curl_easy_cleanup(c);
}
```
