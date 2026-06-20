---
slug: oauth2-device-code
module: sd-auth-security
title: OAuth 2.0 Device Code Flow
subtitle: How smart TVs, CLIs, and IoT devices that cannot render a browser still get a user-scoped access token.
difficulty: Intermediate
position: 50
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Microservice Security"
    url: "https://martinfowler.com/articles/microservice-security.html"
    type: blog
  - title: "Microservices.io — Access Token Pattern"
    url: "https://microservices.io/patterns/security/access-token.html"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
The device code flow (RFC 8628) is OAuth 2.0's answer to the question: "how does a device with no keyboard and no browser obtain a user-scoped access token?" The device prints a short human-typable code, the user opens that URL on a phone or laptop, signs in, and pastes the code; the device meanwhile polls the token endpoint until the user finishes. It is the canonical flow for smart TVs (Netflix, YouTube on Apple TV), command-line tools (`gh auth login`, `az login`), printers, and headless IoT gear.

## whyItMatters
Without this flow, any device class that lacks an interactive browser is forced to either ship the client secret (impossible for a public client) or ask the user to type their password into a TV remote (a phishing magnet). Device flow lets you keep the same backend authorization server you already use for web — only the bootstrap is different. Every modern identity provider (Auth0, Okta, Cognito, Google, Microsoft) implements it.

## intuition
The problem the device flow solves: how does a device with **no keyboard, no browser, and no secure storage for a client secret** obtain a user-scoped OAuth access token? The obvious answer — embed a username/password prompt on the TV and POST to `/token` with `grant_type=password` — is Resource Owner Password Credentials (ROPC), banned for years because the TV firmware sees the user's master password, the password ends up in TV logs and OEM telemetry, and password managers cannot autofill on a remote control. Two months in, leaked firmware dumps contain thousands of plaintext credentials.

RFC 8628 defines the device flow as a **two-rail handshake mediated by the auth server**. The device, on rail 1, calls `POST /device/code` and receives back two codes — a `device_code` (long, opaque, machine-only) and a `user_code` (short, human-typable, typically 8 characters of base32 in unambiguous alphabet) plus a `verification_uri` (and `verification_uri_complete` containing the user_code as a query parameter, perfect for QR code). The device displays the user_code and the URI to the user, then starts polling `POST /token` every `interval` seconds.

The user, on rail 2, opens the verification URI on their phone or laptop (a device that **does** have a browser, a password manager, and possibly biometrics), signs in to the auth server using whatever flow they already use (cookies, WebAuthn, SMS, TOTP), and approves the device by entering the user_code (or, with `verification_uri_complete` + QR, by just tapping "approve").

When both rails meet — user has approved, device has polled — the auth server's next response to the device's `/token` poll is a `200 OK` with the access token and refresh token. Before approval, the device receives `400 authorization_pending` (keep polling) or `400 slow_down` (poll less often, widen interval by 5s). On user denial: `400 access_denied`. On timeout: `400 expired_token` (start over).

The brilliance: the device never sees the user's credentials, the user uses a secure browser to authenticate, and the auth server is the only party that knows both rails are converging on the same grant. Every modern IdP — Auth0, Okta, AWS Cognito, Google, Microsoft, GitHub — implements the spec; `gh auth login`, `aws sso login`, `az login`, `kubectl oidc-login`, Netflix on Apple TV, and YouTube on Roku all use it daily.

## visualization
```
Device                          Auth Server                       User
  | -- POST /device/code ------> |
  | <- {device_code, user_code,  |
  |     verification_uri,        |
  |     interval=5, expires=600} |
  |                              |
  | display user_code            |
  |                              | <-- GET /activate ------ phone visits URI
  |                              | <-- POST user_code + login + consent
  |                              |
  | -- POST /token ------------> |  (every 5s)
  | <- 400 authorization_pending |
  | -- POST /token ------------> |
  | <- 200 {access_token,        |
  |        refresh_token}        |
```

The polling interval is server-controlled — the device must respect a `slow_down` response by widening its interval by 5 seconds.

## bruteForce
"Just embed a username/password prompt on the TV and POST to /token with `grant_type=password`." Banned for years. ROPC means the TV firmware sees the user's master password, the password ends up in TV logs and OEM telemetry, and password-manager autofill cannot help on a remote control. Two months in, leaked firmware dumps include thousands of plaintext credentials.

## optimal
The right implementation follows **RFC 8628 to the letter**, renders a QR code for the `verification_uri_complete`, respects `slow_down` responses, and stores the refresh token in OS-level secure storage (Keychain on macOS, Credential Manager on Windows, libsecret/KWallet on Linux, Secure Enclave on iOS, Keystore on Android). Auth0, Google, and Microsoft all publish reference snippets that match this pattern.

```python
import time, requests, qrcode

DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"

def device_login(client_id: str, auth_base: str, scope: str = "read:user") -> dict:
    # 1. Request device + user codes.
    start = requests.post(f"{auth_base}/device/code",
                          data={"client_id": client_id, "scope": scope},
                          timeout=10).json()
    print(f"Visit {start['verification_uri']} and enter: {start['user_code']}")
    if "verification_uri_complete" in start:
        # 2. Show a QR so the user can scan with their phone — fewer typos,
        #    higher conversion than typing an 8-char code on a TV remote.
        qrcode.make(start["verification_uri_complete"]).save("/tmp/dev_qr.png")
        print("Scan QR: /tmp/dev_qr.png")
    interval = start.get("interval", 5)
    deadline = time.time() + start.get("expires_in", 600)

    # 3. Poll /token until user approves (or denies, or timeout).
    while time.time() < deadline:
        time.sleep(interval)
        t = requests.post(f"{auth_base}/token", data={
            "grant_type": DEVICE_GRANT,
            "device_code": start["device_code"],
            "client_id": client_id,
        }, timeout=10).json()
        if "access_token" in t:
            store_in_secure_keychain(t["refresh_token"])         # NOT disk
            return t
        err = t.get("error")
        if err == "authorization_pending":
            continue
        if err == "slow_down":
            interval += 5                                         # widen per RFC 8628
            continue
        if err == "access_denied":
            raise RuntimeError("user declined authorization")
        if err == "expired_token":
            raise RuntimeError("code expired; restart flow")
        raise RuntimeError(f"unexpected error: {err}")
    raise RuntimeError("timed out waiting for user")
```

Why this is right: the implementation handles **all four polling response codes** specified by RFC 8628 (`authorization_pending`, `slow_down`, `access_denied`, `expired_token`), respects the server-mandated `interval` (and widens it on `slow_down` to avoid being rate-limited or banned), shows a QR for `verification_uri_complete` (the modern UX winner — TV-remote code entry is the #1 onboarding drop-off), and stores the refresh token in **OS-level secure storage** rather than disk. Plaintext refresh tokens on disk in `~/.config/myapp/credentials.json` is a recurring breach pattern; use `keyring` (Python), `keytar` (Node), `go-keyring` (Go), or the equivalent for your runtime.

**Production disciplines that matter**:

- **User-code alphabet**: pick an **unambiguous alphabet** (no 0/O, 1/I/L; the RFC recommends Crockford base32). 8 characters of base32 = 40 bits of entropy, which is sufficient because the window is only 600 seconds and codes are bound to a single device.
- **Invalidate `device_code` immediately after issuing tokens** — replay protection. Without this, an attacker who intercepts the device_code can claim the grant a second time.
- **Bind tokens to client_id** at issuance; the auth server verifies that the polling client_id matches the one that originally requested the codes. Prevents a malicious app from polling for another app's pending code.
- **Implement PKCE-like binding** if the spec doesn't already (RFC 8628 + RFC 9126 PAR cover this) — prevents authorization-code injection attacks adapted to device flow.
- **Audit logging**: log every approval with `user_id`, `device_code`, `client_id`, `IP`, `user_agent` of the approval browser. Detect anomalies (same user approving 50 device codes per hour from different IPs).

**Anti-patterns to avoid**:
- Polling faster than `interval` (you'll get `slow_down` and may be rate-limited or banned).
- Displaying `device_code` to the user instead of `user_code` (device_code is long and opaque; nobody can type it).
- Skipping `verification_uri_complete` + QR (typing on a TV remote is brutal — 60% drop-off in some published telemetry).
- Polling forever after `expired_token` (back off and prompt the user to restart, do not silently retry).
- Re-using the same client_id across products without per-app branding — the user sees "approve <generic app name>" and dismisses the grant.

The interview answer in one line: "Device flow is OAuth 2.0's RFC 8628 — separate rails for the device (polling) and user (browser-based approval), bridged by a short user_code; spec mandates four response codes and the device must respect `slow_down`."

## complexity
time: O(N) polls where N = `time_user_takes_to_approve / interval`. With a 5s interval and a 30s user, that is 6 round trips.
space: O(1) on the device — one device_code, one user_code. The auth server holds a pending-grant row per outstanding code, typically TTL'd in Redis.
notes: User codes must be drawn from an unambiguous alphabet (no 0/O, 1/I/L); 8 characters of base32 is ~40 bits of entropy, sufficient because the window is 600 seconds and bound to one device.

## pitfalls
- Polling faster than the server's `interval` — you will get `slow_down` and may be rate-limited or banned.
- Showing the `device_code` to the user instead of `user_code` — device_code is long and opaque; nobody can type it.
- Skipping the `verification_uri_complete` QR — typing an 8-char code on a TV remote is the #1 onboarding drop-off.
- Forgetting to invalidate the device_code once tokens are issued — replay lets another device steal the same grant.
- Polling forever after `expired_token` — back off and prompt the user to restart.

## interviewTips
- Name two real users: `gh auth login` and Netflix on Apple TV. Concrete > abstract.
- Distinguish device_code (machine-only, opaque) from user_code (human-typable, short).
- Mention QR code rendering of `verification_uri_complete` — it is the modern UX winner.
- Know the four polling responses and what each means.
- Refresh tokens still apply; the device flow is only about bootstrap.

## code.python
```python
import time, requests

def device_login(client_id, auth_base):
    r = requests.post(f"{auth_base}/device/code",
                      data={"client_id": client_id, "scope": "read:user"}).json()
    print(f"Visit {r['verification_uri']} and enter {r['user_code']}")
    interval = r.get("interval", 5)
    while True:
        time.sleep(interval)
        t = requests.post(f"{auth_base}/token", data={
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            "device_code": r["device_code"],
            "client_id": client_id,
        }).json()
        if "access_token" in t:
            return t
        if t.get("error") == "slow_down":
            interval += 5
        elif t.get("error") not in ("authorization_pending",):
            raise RuntimeError(t["error"])
```

## code.javascript
```javascript
async function deviceLogin(clientId, authBase) {
  const r = await fetch(`${authBase}/device/code`, {
    method: "POST",
    body: new URLSearchParams({ client_id: clientId, scope: "read:user" }),
  }).then(x => x.json());
  console.log(`Visit ${r.verification_uri} and enter ${r.user_code}`);
  let interval = (r.interval ?? 5) * 1000;
  while (true) {
    await new Promise(res => setTimeout(res, interval));
    const t = await fetch(`${authBase}/token`, {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: r.device_code,
        client_id: clientId,
      }),
    }).then(x => x.json());
    if (t.access_token) return t;
    if (t.error === "slow_down") interval += 5000;
    else if (t.error !== "authorization_pending") throw new Error(t.error);
  }
}
```

## code.java
```java
// Sketch using java.net.http.HttpClient
public Map<String,Object> deviceLogin(String clientId, String authBase) throws Exception {
    HttpClient c = HttpClient.newHttpClient();
    var start = c.send(HttpRequest.newBuilder(URI.create(authBase + "/device/code"))
        .header("Content-Type", "application/x-www-form-urlencoded")
        .POST(BodyPublishers.ofString("client_id=" + clientId + "&scope=read:user"))
        .build(), BodyHandlers.ofString());
    Map<String,Object> r = parseJson(start.body());
    System.out.printf("Visit %s and enter %s%n", r.get("verification_uri"), r.get("user_code"));
    long interval = ((Number) r.getOrDefault("interval", 5)).longValue() * 1000;
    while (true) {
        Thread.sleep(interval);
        var tok = c.send(HttpRequest.newBuilder(URI.create(authBase + "/token"))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(BodyPublishers.ofString(
              "grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code="
              + r.get("device_code") + "&client_id=" + clientId))
            .build(), BodyHandlers.ofString());
        Map<String,Object> t = parseJson(tok.body());
        if (t.containsKey("access_token")) return t;
        if ("slow_down".equals(t.get("error"))) interval += 5000;
        else if (!"authorization_pending".equals(t.get("error")))
            throw new RuntimeException((String) t.get("error"));
    }
}
```

## code.cpp
```cpp
// Sketch using libcurl; pseudo-JSON for brevity.
#include <curl/curl.h>
#include <chrono>
#include <thread>

DeviceTokens device_login(const std::string& client_id, const std::string& base) {
    auto start = http_post(base + "/device/code",
                           "client_id=" + client_id + "&scope=read:user");
    auto j = parse(start);
    std::cout << "Visit " << j["verification_uri"] << " enter " << j["user_code"] << "\n";
    int interval = j.value("interval", 5);
    while (true) {
        std::this_thread::sleep_for(std::chrono::seconds(interval));
        auto t = parse(http_post(base + "/token",
            "grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code="
            + j["device_code"].get<std::string>() + "&client_id=" + client_id));
        if (t.contains("access_token")) return t;
        if (t["error"] == "slow_down") interval += 5;
        else if (t["error"] != "authorization_pending") throw std::runtime_error(t["error"]);
    }
}
```
