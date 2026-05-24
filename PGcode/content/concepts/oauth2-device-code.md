---
slug: oauth2-device-code
module: system-design
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
Two parties poll on different rails. The device asks the auth server, "got a user yet?" every few seconds. The user, on a phone, asks the auth server, "approve this code." When both rails meet — user approved, device polled — the auth server issues tokens to the device. The user code is short and human (typically 8 characters, base32, hyphenated) so it is typeable; the device code is long and opaque because only the device handles it.

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
Use the spec exactly. Server returns `device_code`, `user_code`, `verification_uri`, `verification_uri_complete` (a deep link with the code prefilled — render this as a QR), `expires_in` (typically 5-15 min), and `interval` (default 5s). The device polls `/token` with `grant_type=urn:ietf:params:oauth:grant-type:device_code`. Handle four token-endpoint responses: `authorization_pending` (keep polling), `slow_down` (poll less often), `access_denied` (user declined — stop), `expired_token` (start over). On success, store the refresh token in the device's secure enclave or keychain, never on disk in plaintext.

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
