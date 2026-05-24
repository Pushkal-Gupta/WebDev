---
slug: kerberos-protocol
module: system-design
title: Kerberos Protocol
subtitle: A trusted third party hands out time-limited tickets so two parties on a hostile network can authenticate without ever exchanging a password.
difficulty: Advanced
position: 51
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Microservice Security"
    url: "https://martinfowler.com/articles/microservice-security.html"
    type: blog
  - title: "GeeksforGeeks — Kerberos"
    url: "https://www.geeksforgeeks.org/kerberos/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Kerberos is the SSO protocol that runs every Active Directory domain on Earth. It uses symmetric crypto and a trusted third party — the Key Distribution Center (KDC) — to let a user authenticate once and then hand short-lived, encrypted *tickets* to every service they need to call. No password crosses the wire, services never store user passwords, and replay attacks are blocked by timestamps and a tiny replay cache.

## whyItMatters
If you run a Windows shop, Hadoop cluster, or PostgreSQL with `gssapi` auth, you are running Kerberos whether you read the RFC or not. Senior interviews ask "design enterprise SSO" expecting you to compare Kerberos (intranet, symmetric, AD-backed) against SAML (web, XML, federated) against OIDC (web, JSON, modern). Misreading Kerberos as "old and irrelevant" loses the question.

## intuition
Three parties: the user (Client), the Authentication Server (AS), and a Service (e.g. a file share). The AS is split into two roles: the *AS* proper, which issues a Ticket-Granting Ticket (TGT) at login, and the *TGS* (Ticket-Granting Service), which trades the TGT for per-service tickets. Imagine an amusement park: at the gate you exchange your ID for a wristband (TGT). At each ride, you show the wristband to a turnstile (TGS), which gives you a one-ride coupon (service ticket). You hand the coupon to the ride operator (the service). Lose the wristband and you have to go back to the gate.

## visualization
```
1. AS-REQ:   C -> AS    {username, timestamp}                   (no password!)
2. AS-REP:   AS -> C    {TGT}_K_tgs,  {session_key_1}_K_user
              ^ TGT is encrypted with the TGS's key; client can't read it.
              ^ session_key is encrypted with a key derived from the user's password,
                so only the real user can decrypt it.
3. TGS-REQ:  C -> TGS   {TGT}_K_tgs, {authenticator: user+timestamp}_session_key_1,
                        "I want service S"
4. TGS-REP:  TGS -> C   {service_ticket}_K_service,
                        {session_key_2}_session_key_1
5. AP-REQ:   C -> S     {service_ticket}_K_service,
                        {authenticator}_session_key_2
6. AP-REP:   S -> C     {timestamp+1}_session_key_2          (mutual auth)
```

The TGT lasts ~10 hours; service tickets last ~5 minutes. The session_key inside each blob is fresh.

## bruteForce
"Just give every service the user's password and let it check." This is the world Kerberos replaced. Every service now stores or sees passwords, password rotation is a fleet-wide outage, and a single compromised service leaks credentials for every other service the user touches. There is no SSO and no centralized revocation.

## optimal
Run Kerberos with a hardened KDC pair (active + standby), strict clock sync (NTP within 5 minutes — Kerberos rejects requests outside the skew window), and AES-256 enctypes only (disable RC4 and DES). Use FAST (Flexible Authentication Secure Tunneling) for armored pre-authentication so the AS-REP cannot be offline-cracked. Pair with Constrained Delegation when one service needs to call another on the user's behalf. For non-AD shops, MIT Kerberos and Heimdal are the canonical implementations.

## complexity
time: 3 round trips at first login (AS, TGS, AP); subsequent service calls reuse the cached service ticket — zero KDC traffic for ~5 minutes.
space: O(active_users) on the KDC (replay cache + principal database); O(active_tickets) on each service (small, in-memory).
notes: Clock skew is the most common breakage. Kerberos rejects anything outside +/- 5 minutes by default — `w32tm` or `chrony` must be healthy on every host.

## pitfalls
- Clock drift on a service host — every Kerberos call starts failing with "clock skew too great." Look there first.
- RC4 enctypes still enabled — vulnerable to Kerberoasting (offline crack service ticket -> service account password). AES-256 only.
- Service principal name (SPN) duplicates — two accounts holding the same SPN breaks ticket lookup non-deterministically.
- Treating the TGT as a session token — it is the *ticket* to get tickets, not an API bearer.
- Allowing unconstrained delegation — a compromised service can impersonate any user to any other service in the realm.

## interviewTips
- Open with "trusted third party + symmetric crypto" — those five words frame the whole protocol.
- Sketch the AS / TGS / AP three-leg dance; do not start coding.
- Distinguish TGT (long-lived, gets tickets) from service ticket (short-lived, calls one service).
- Mention Kerberoasting and why AES-only matters in 2026.
- For "design SSO": Kerberos for intranet, SAML for federated B2B, OIDC for consumer / SPA.

## code.python
```python
# python-gssapi to call a Kerberized HTTP service
import gssapi, requests
from requests_gssapi import HTTPSPNEGOAuth

# Caller must already have a TGT (kinit user@REALM).
session = requests.Session()
session.auth = HTTPSPNEGOAuth(
    creds=gssapi.Credentials(usage="initiate"),
    target_name=gssapi.Name("HTTP/api.corp.example.com", gssapi.NameType.hostbased_service),
)
r = session.get("https://api.corp.example.com/data")
print(r.status_code, r.json())
```

## code.javascript
```javascript
// Node has no native Kerberos; the standard route is the `kerberos` npm module.
const kerberos = require("kerberos");

async function spnegoToken(spn) {
  const client = await kerberos.initializeClient(spn);
  await client.step("");           // first step: build the SPNEGO blob
  return "Negotiate " + client.response; // value for Authorization header
}

const fetch = require("node-fetch");
const token = await spnegoToken("HTTP@api.corp.example.com");
const res = await fetch("https://api.corp.example.com/data", {
  headers: { Authorization: token },
});
console.log(res.status);
```

## code.java
```java
// JAAS + Java GSS — the classic combo.
import org.ietf.jgss.*;
import javax.security.auth.login.LoginContext;

LoginContext lc = new LoginContext("KrbClient");   // jaas.conf entry uses Krb5LoginModule
lc.login();

GSSManager mgr = GSSManager.getInstance();
GSSName server = mgr.createName("HTTP@api.corp.example.com",
        GSSName.NT_HOSTBASED_SERVICE);
GSSContext ctx = mgr.createContext(server, new Oid("1.2.840.113554.1.2.2"),
        null, GSSContext.DEFAULT_LIFETIME);
ctx.requestMutualAuth(true);

byte[] token = ctx.initSecContext(new byte[0], 0, 0);
String authHeader = "Negotiate " + Base64.getEncoder().encodeToString(token);
// send authHeader with an HttpURLConnection / HttpClient call
```

## code.cpp
```cpp
// MIT Kerberos C API: build a service ticket request.
#include <krb5/krb5.h>

void request_service_ticket(const char* user_principal, const char* service_principal) {
    krb5_context ctx;  krb5_init_context(&ctx);
    krb5_ccache cc;    krb5_cc_default(ctx, &cc);     // uses cached TGT

    krb5_principal client, server;
    krb5_parse_name(ctx, user_principal, &client);
    krb5_parse_name(ctx, service_principal, &server);

    krb5_creds in = {0}, *out = nullptr;
    in.client = client;  in.server = server;
    krb5_get_credentials(ctx, 0, cc, &in, &out);      // TGS-REQ to KDC

    // `out` now holds the service ticket; hand to gss_init_sec_context for SPNEGO.
    krb5_free_creds(ctx, out);
    krb5_cc_close(ctx, cc);
    krb5_free_context(ctx);
}
```
