---
slug: oauth2-pkce-deep
module: sd-auth-security
title: OAuth 2.0 PKCE Deep — Verifier, Challenge, S256, Attack Model
subtitle: Internals of Proof Key for Code Exchange — verifier entropy, S256 derivation, replay binding on the token endpoint, and the auth-code interception attack that PKCE makes useless.
difficulty: Advanced
position: 410
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "RFC 7636 — Proof Key for Code Exchange by OAuth Public Clients"
    url: "https://datatracker.ietf.org/doc/html/rfc7636"
    type: book
  - title: "RFC 8252 — OAuth 2.0 for Native Apps"
    url: "https://datatracker.ietf.org/doc/html/rfc8252"
    type: book
  - title: "OAuth 2.0 Security Best Current Practice (draft-ietf-oauth-security-topics)"
    url: "https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics"
    type: blog
status: published
---

## intro
PKCE — pronounced "pixy" — turns a single use-once code into a use-once code **bound to a secret the server has never seen**. The client picks a random `code_verifier` (43–128 unreserved characters), derives `code_challenge = BASE64URL(SHA256(verifier))`, and ships the challenge with the authorization request. When the auth code comes back and the client exchanges it for a token, it includes the original verifier. The token endpoint recomputes the SHA-256, checks equality, and only then issues tokens. Anyone who steals the code mid-flight has nothing to redeem it with.

## whyItMatters
The "Authorization Code Interception" attack lives in the moment between the authorization server redirecting back to the client and the client redeeming the code. On native and mobile platforms that window crosses an OS-level URL handler — custom schemes (`myapp://callback`), Android Intent filters, iOS Universal Links — and any other process that has registered for the same scheme can race the legitimate handler and steal the code. Loopback redirects on desktop CLIs face the same risk if a local attacker is listening on the right port. PKCE neutralises every variant of this attack in one move: the code alone is no longer enough. RFC 9700 ("OAuth 2.0 Security BCP") now requires PKCE for every authorization-code grant, public or confidential — that is, even server-side apps with a `client_secret`. PKCE has stopped being "the SPA-and-mobile workaround" and become a universal defence against code injection and code substitution.

## intuition
Think of the code as a claim ticket and the verifier as the matching half of a torn receipt. The client tears the receipt before walking up to the counter: it keeps one half (`verifier`), shows the other half's photograph (`challenge`) to the front desk, and walks away with a claim number (`code`). When it returns to redeem the claim number, it must show the kept half so the counter can compare it against the photograph already on file. A pickpocket who lifted the claim number alone has no torn paper to present.

The cryptographic substrate matters: SHA-256 is one-way, so the challenge reveals nothing about the verifier. The challenge can travel through any number of intermediaries — browser history, system logs, idP redirect chains, a hostile shoulder-surfer with a packet sniffer — without compromising the verifier sitting in the client's memory. The verifier never appears on the authorization endpoint; it only appears on the token endpoint, which is a direct back-channel POST from the client to the auth server (no browser hop). That is the asymmetry PKCE exploits: the front channel (browser-mediated authorization) is leaky, the back channel (HTTPS POST from the client) is private. PKCE pushes the only secret onto the private side.

The other detail that earns PKCE its place in production is **binding**. The auth server must record `(code, challenge, method)` at /authorize time. At /token time it must look up the row by code, recompute `BASE64URL(SHA256(verifier))` (or compare directly if `plain`), and reject if the values do not match exactly, the code does not exist, the code is already consumed, the code is expired (RFC 7636 says ≤10 minutes; production picks ≤60 seconds), or the `redirect_uri` does not match the one bound at /authorize. Skipping any of those checks turns PKCE into security theatre. The `plain` method is allowed only for legacy clients that cannot compute SHA-256; production must use `S256`.

## visualization
```
PKCE end-to-end (S256, native client on a custom scheme)
─────────────────────────────────────────────────────────
Client (no secret)                            Authorization Server
  ├ verifier = rand_unreserved(64)
  ├ challenge = base64url(sha256(verifier))
  │
  ├─ GET /authorize?response_type=code
  │       &client_id=app&redirect_uri=myapp://cb
  │       &code_challenge={challenge}
  │       &code_challenge_method=S256        ──►   store row:
  │                                                (auth_session, challenge, S256, redirect_uri)
  │                                          ◄──   302 myapp://cb?code=XYZ
  │   [attacker on same device intercepts ──── code=XYZ ─── replay attempt]
  │                                                   │
  │                                                   ▼
  │                                          POST /token  (attacker, no verifier)
  │                                          ◄──   400 invalid_grant
  │
  ├─ POST /token
  │       grant_type=authorization_code
  │       code=XYZ
  │       code_verifier={verifier}
  │       redirect_uri=myapp://cb            ──►   sha256(verifier) == stored challenge?
  │                                                 redirect_uri match? code unused?
  │                                          ◄──   200 { access_token, refresh_token, id_token }
```

## bruteForce
Without PKCE, public clients either used the dead-on-arrival **Implicit flow** (token in URL fragment — leaked via Referer, browser history, server logs, screen-share recordings, and any extension with `tabs` permission) or shipped a "client secret" baked into the binary. Reverse-engineering the secret out of an APK or a minified bundle is a half-hour exercise; once extracted, the attacker can mint tokens at will. Some apps tried to obfuscate the secret with proguard or string-shuffling; this delays nothing. The standing OAuth Working Group guidance is unambiguous: a secret embedded in a public-distribution artefact is not a secret.

## optimal
The S256 PKCE flow is the optimum on every dimension that matters for public and confidential clients alike. The verifier is generated client-side with a cryptographically secure RNG; RFC 7636 §4.1 specifies 32 octets of entropy minimum (which yields a 43-character base64url string) and 96 octets maximum (128 characters). Production libraries pick 32–64 octets — enough that brute-forcing the verifier from an intercepted challenge would require 2^256 SHA-256 evaluations, which is the security parameter the rest of the system already assumes.

The challenge derivation is `BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))` with no padding. Both endpoints must implement this byte-for-byte; mismatches almost always come from accidentally URL-encoding the verifier before hashing, or feeding UTF-8 instead of ASCII, or leaving the `=` padding on the base64. The verifier alphabet (`[A-Z][a-z][0-9]-._~`) is the "unreserved" set from RFC 3986 §2.3 so the value never needs escaping in any URL position.

Server-side, the authorization endpoint must store the challenge atomically with the code grant, never log either field, and bind the row to the exact `redirect_uri` and `client_id` presented. The token endpoint must enforce single-use code consumption — once a code is redeemed (or even attempted, in strict mode) it must be invalidated for all future requests so a replay cannot succeed. The OAuth BCP recommends marking any token previously issued from a replayed code as revoked; an attacker who races the legitimate client and wins gets one shot before everything they touched is locked out.

Mobile and desktop clients should pair PKCE with **system browser delegation** (RFC 8252): Chrome Custom Tabs on Android, ASWebAuthenticationSession on iOS, the default browser on desktop. Embedded webviews leak credentials to the host app and defeat the threat model PKCE was built to address. Loopback redirects (`http://127.0.0.1:randomport/`) are still the recommended pattern for CLIs; PKCE plus a randomly chosen port plus a single-use server is enough to ship a secure CLI auth flow.

Confidential clients now layer PKCE on top of their `client_secret` per RFC 9700 — defence in depth. The verifier prevents code injection attacks where a malicious app convinces a victim's browser to authenticate against the attacker's authorization session; without the verifier the stolen code is still useless. Token endpoints should also implement DPoP or mTLS-bound tokens for the next ring of defence, but PKCE is the floor.

## complexity
Storage per in-flight grant: O(1) — one row with code, challenge, method, redirect_uri, client_id, expiry, and an issued/consumed flag. Compute on /token: one SHA-256 over the verifier (≤128 bytes) plus a constant-time equality check against the stored 43-byte challenge. Both are nanoseconds on commodity hardware. Network cost: zero additional round trips versus a vanilla code flow — the challenge piggybacks on the existing /authorize redirect and the verifier piggybacks on the existing /token POST. Verifier entropy must be ≥256 bits; challenge is `ceil(256 / 6) = 43` base64url characters. Expiry window: ≤60 seconds in production; longer windows give attackers more time to race the redemption.

## pitfalls
- **Using `plain` method in production.** `plain` exists only for legacy clients with no SHA-256 implementation. If your auth server accepts `code_challenge_method=plain` from modern clients, an attacker who intercepts the challenge has just intercepted the verifier. Always send and require `S256`.
- **Not binding the code to challenge + redirect_uri + client_id at /authorize.** Some hand-rolled servers store the challenge in a global cache keyed by code only; an attacker who learns one client's code can present a different `redirect_uri` or `client_id` and bypass the binding. The row must enforce a tuple match, not just a code match.
- **Reusing the verifier across grants.** The verifier must be freshly generated for every authorization request. A leaked verifier from one session must not unlock a different session — which it would if the client caches a single value.
- **Logging the verifier or challenge.** Application servers that log full POST bodies leak verifiers to disk. Auth servers that log full /authorize URLs leak challenges. Neither is fatal alone, but together with a code interception they unwind PKCE entirely.
- **Allowing codes to be redeemed twice.** A replay of a successful redemption should hit `invalid_grant` and revoke the previously issued tokens. Some servers silently re-issue tokens to the second redeemer if the verifier matches; that is exactly the path RFC 9700 §4.1.1 says to close.

## interviewTips
- When asked "why is the Implicit flow deprecated?" lead with the URL-fragment exposure surface (browser history, Referer, logs), then introduce PKCE as the modern replacement that keeps the redirect flow but removes the need for a client secret.
- Be ready to draw the four moving pieces — verifier, challenge, method, code — and label which travels on the front channel (challenge, code) versus the back channel (verifier). This is the single picture that wins the interview.
- Volunteer the threat model upfront: "PKCE defends against authorization-code interception, including malicious apps on the same device and loopback-port races. It does not defend against a compromised authorization server, a phished user, or a token leaked after issuance — those need DPoP, mTLS-bound tokens, or short refresh-token lifetimes."

## code

### python
```python
import base64, hashlib, secrets

UNRESERVED = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"


def generate_verifier(byte_len: int = 32) -> str:
    if not 32 <= byte_len <= 96:
        raise ValueError("verifier must encode to 43..128 chars (RFC 7636 §4.1)")
    raw = secrets.token_bytes(byte_len)
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def derive_challenge_s256(verifier: str) -> str:
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def verify_pkce(stored_challenge: str, stored_method: str, presented_verifier: str) -> bool:
    if stored_method == "S256":
        expected = derive_challenge_s256(presented_verifier)
    elif stored_method == "plain":
        expected = presented_verifier
    else:
        return False
    return secrets.compare_digest(expected, stored_challenge)
```

### javascript
```javascript
function base64urlNoPad(bytes) {
  let s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateVerifier(byteLen = 32) {
  if (byteLen < 32 || byteLen > 96) throw new Error('verifier length out of range');
  const buf = crypto.getRandomValues(new Uint8Array(byteLen));
  return base64urlNoPad(buf);
}

export async function deriveChallengeS256(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlNoPad(new Uint8Array(digest));
}

export async function verifyPkce(storedChallenge, storedMethod, presentedVerifier) {
  const expected = storedMethod === 'S256'
    ? await deriveChallengeS256(presentedVerifier)
    : storedMethod === 'plain' ? presentedVerifier : null;
  if (expected === null || expected.length !== storedChallenge.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ storedChallenge.charCodeAt(i);
  return diff === 0;
}
```

### java
```java
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

public final class Pkce {
    private static final SecureRandom RNG = new SecureRandom();
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();

    public static String generateVerifier(int byteLen) {
        if (byteLen < 32 || byteLen > 96) throw new IllegalArgumentException("32..96 bytes");
        byte[] raw = new byte[byteLen];
        RNG.nextBytes(raw);
        return B64.encodeToString(raw);
    }

    public static String deriveChallengeS256(String verifier) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(verifier.getBytes("US-ASCII"));
        return B64.encodeToString(digest);
    }

    public static boolean verify(String storedChallenge, String method, String verifier) throws Exception {
        String expected = "S256".equals(method) ? deriveChallengeS256(verifier)
                        : "plain".equals(method) ? verifier : null;
        return expected != null && MessageDigest.isEqual(expected.getBytes(), storedChallenge.getBytes());
    }
}
```

### cpp
```cpp
#include <openssl/rand.h>
#include <openssl/sha.h>
#include <string>
#include <stdexcept>

static const char kB64UrlAlphabet[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

static std::string base64url_no_pad(const unsigned char* data, size_t len) {
    std::string out;
    out.reserve((len * 4 + 2) / 3);
    for (size_t i = 0; i < len; i += 3) {
        unsigned v = data[i] << 16
                   | (i + 1 < len ? data[i + 1] << 8 : 0)
                   | (i + 2 < len ? data[i + 2] : 0);
        out.push_back(kB64UrlAlphabet[(v >> 18) & 0x3F]);
        out.push_back(kB64UrlAlphabet[(v >> 12) & 0x3F]);
        if (i + 1 < len) out.push_back(kB64UrlAlphabet[(v >> 6) & 0x3F]);
        if (i + 2 < len) out.push_back(kB64UrlAlphabet[v & 0x3F]);
    }
    return out;
}

std::string generate_verifier(size_t byte_len = 32) {
    if (byte_len < 32 || byte_len > 96) throw std::invalid_argument("32..96 bytes");
    std::string raw(byte_len, '\0');
    if (RAND_bytes(reinterpret_cast<unsigned char*>(&raw[0]), (int)byte_len) != 1)
        throw std::runtime_error("RAND_bytes failed");
    return base64url_no_pad(reinterpret_cast<unsigned char*>(&raw[0]), byte_len);
}

std::string derive_challenge_s256(const std::string& verifier) {
    unsigned char digest[SHA256_DIGEST_LENGTH];
    SHA256(reinterpret_cast<const unsigned char*>(verifier.data()), verifier.size(), digest);
    return base64url_no_pad(digest, SHA256_DIGEST_LENGTH);
}
```
