---
slug: saml-vs-oidc
module: sd-auth-security
title: SAML vs OpenID Connect
subtitle: Enterprise XML federation vs modern JSON federation — when to ship which, and why most B2B SaaS still ships both.
difficulty: Intermediate
position: 52
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
SAML 2.0 (2005) and OpenID Connect (2014) are both *federation* protocols — they let an Identity Provider (IdP) assert "this is Alice, here are her attributes" to a Service Provider (SP) the user wants to log into. SAML uses XML over browser POST redirects and was designed for enterprise web apps; OIDC sits on top of OAuth 2.0, uses JSON Web Tokens (JWT), and was designed for SPAs, mobile apps, and modern APIs. They solve the same problem with different ergonomics.

## whyItMatters
If you sell B2B SaaS, every enterprise procurement checklist asks for SAML — even in 2026. If you build consumer-facing or API-first products, OIDC is the only choice anyone seriously considers. A senior engineer is expected to compare the two without flinching, pick the right one per audience, and not be surprised when a Fortune-500 customer demands SAML for the same product where prosumers use Google OIDC. SAML 2.0 (OASIS 2005) underlies every enterprise SSO platform — Okta, Microsoft Entra ID (formerly Azure AD), PingFederate, OneLogin, ADFS. OIDC (OpenID Foundation, 2014) layers identity on top of OAuth 2.0 (RFC 6749) and powers Google Sign-In, Apple Sign-In, GitHub OAuth, every login-with-X button on the modern web, and the entire mobile / SPA / API ecosystem. WorkOS, Auth0, Stytch, and Clerk all exist to abstract the difference between the two for SaaS vendors.

## intuition
Both flows are the same shape: the browser bounces from the Service Provider (SP) to the Identity Provider (IdP), the user signs in, the IdP signs an assertion about who the user is, the browser carries the assertion back to the SP, the SP validates the signature and creates a local session. What differs is the wire format and the trust-bootstrap.

**Wire format**: SAML uses XML assertions signed with XML-DSig — verbose, fiddly canonicalization, easy to misvalidate. OIDC uses JSON Web Tokens (JWT) signed with JWS (JOSE family) — short, base64url-encoded, straightforward to validate. **Discovery**: SAML exchanges a metadata XML blob between SP and IdP that lists endpoints, signing certs, and supported bindings. OIDC publishes a JSON document at `/.well-known/openid-configuration` plus a JWKS endpoint, both fetched dynamically by clients. **Trust model**: SAML pre-shares metadata in a one-time enterprise onboarding (often manually). OIDC has a registration step (`client_id` + `client_secret`) plus dynamic JWKS rotation that clients re-fetch on key rollover.

Everything else — single sign-on, single logout, attribute mapping, group claims — is conceptually identical. The protocols differ in ergonomics and lineage (SAML evolved from enterprise federation, OIDC from social login) but solve the same problem. The choice almost always comes down to what the IdP at the other end speaks: enterprise IT shops speak SAML, consumer / API integrations speak OIDC.

## visualization
```
SAML (SP-initiated, HTTP-POST binding):
  User -> SP /login -> 302 to IdP w/ SAMLRequest (deflated, base64)
  IdP authenticates user
  IdP -> Browser: HTML form auto-POSTing SAMLResponse (signed XML) to SP /acs
  SP validates signature + audience + NotOnOrAfter -> sets session cookie

OIDC (authorization code + PKCE):
  User -> SP /login -> 302 to IdP /authorize w/ code_challenge
  IdP authenticates user
  IdP -> Browser: 302 to SP /callback?code=...
  SP -> IdP /token { code, code_verifier } -> { id_token (JWT), access_token }
  SP validates id_token signature + iss + aud + exp -> sets session cookie
```

Same six steps, different payloads.

## bruteForce
"Just roll our own — a signed cookie with the username." You instantly own every problem the protocols solved over 20 years: key rotation, replay defense, audience binding, logout propagation, group/role mapping, MFA assertion strength, session timeout coordination. Two months in you reinvent SAML badly.

## optimal
OIDC for new builds, single-page apps, mobile, B2C, and any time you control both ends. SAML when the buyer's IdP is Okta or Microsoft Entra ID or PingFederate and the procurement form says "SAML 2.0 required." Most B2B SaaS ships both: OIDC for the default Google or Microsoft login, SAML behind a per-tenant config screen for enterprise plans. Never hand-roll either — use a battle-tested library (Auth0, WorkOS, Keycloak, Ory Hydra, Spring Security, Passport.js for OIDC; pysaml2, OneLogin's `python3-saml`, or the same managed services for SAML).

```python
# OIDC: validate an ID token against the IdP's JWKS
import jwt, requests

OIDC_ISSUER = 'https://accounts.google.com'
DISCOVERY = requests.get(f'{OIDC_ISSUER}/.well-known/openid-configuration').json()
JWKS = requests.get(DISCOVERY['jwks_uri']).json()

def verify_id_token(id_token, audience):
    header = jwt.get_unverified_header(id_token)
    key = next(k for k in JWKS['keys'] if k['kid'] == header['kid'])
    return jwt.decode(
        id_token,
        jwt.algorithms.RSAAlgorithm.from_jwk(key),
        algorithms=['RS256'],
        audience=audience,
        issuer=OIDC_ISSUER,
        leeway=300,        # 5-minute clock skew tolerance
    )
```

The critical parameters are `audience` (must match the `client_id` you registered with the IdP) and `issuer` (must match the IdP's expected issuer URL) — without these checks an attacker can replay a token issued for a different application. Cache the JWKS for the duration the IdP advises (`Cache-Control` on the JWKS response) and re-fetch on `kid` mismatch to handle silent key rotation. For SAML, the equivalent dance is signature validation against the IdP's metadata cert plus audience-restriction and not-on-or-after checks on the assertion. Match clock skew (5 minutes by convention) across all parties; the single most common cause of "SSO broken in prod" is an NTP drift between the IdP and SP that pushes the assertion outside the validity window. For B2B SaaS rolling out per-tenant SSO, a thin wrapper like WorkOS or Stytch is almost always cheaper than building SAML and OIDC support in-house.

## complexity
time: One redirect chain per login (3-4 HTTP hops); session cookie thereafter — zero IdP traffic until refresh / re-auth.
space: O(active_sessions) at the SP; O(registered_relying_parties) at the IdP.
notes: SAML assertions are ~3-10 KB of XML; ID tokens are ~1-2 KB of JWT. Neither matters per-request because both establish a session cookie after one round trip.

## pitfalls
- Not validating `audience` / `aud` — without it, an assertion intended for SP-A can be replayed against SP-B.
- Ignoring `NotOnOrAfter` / `exp` — replayed assertions stay valid forever.
- Trusting `email` from the IdP as a stable user id — emails change. Use `sub` (OIDC) or `NameID` with format `persistent` (SAML).
- XML signature wrapping attacks in SAML — only trust signed elements; reject if the signature covers unexpected nodes.
- Treating the OIDC `id_token` as an API bearer — it identifies the user to the SP; the `access_token` is what calls APIs.
- Skipping single logout because "it is hard" — leaves orphaned sessions across federated apps.

## interviewTips
- One-line summary: "SAML is XML for enterprises; OIDC is JSON on top of OAuth for everything else."
- Know the four critical claims to validate: `iss`, `aud`, `exp`, and the signature.
- Mention key rotation: OIDC publishes JWKS; SAML hands you a static metadata XML and you re-import on rotation.
- B2B SaaS reality: ship OIDC first, add SAML when the first enterprise deal asks for it.
- For "design SSO across 50 internal apps": Kerberos intranet, SAML/OIDC for cloud apps, all behind one IdP.

## code.python
```python
# OIDC verify with python-jose
from jose import jwt
import requests

def verify_id_token(id_token, issuer, audience):
    jwks = requests.get(f"{issuer}/.well-known/jwks.json").json()
    header = jwt.get_unverified_header(id_token)
    key = next(k for k in jwks["keys"] if k["kid"] == header["kid"])
    return jwt.decode(id_token, key, algorithms=[header["alg"]],
                      audience=audience, issuer=issuer)

# SAML verify with python3-saml
from onelogin.saml2.auth import OneLogin_Saml2_Auth
auth = OneLogin_Saml2_Auth(request_data, custom_base_path="./saml/")
auth.process_response()
errors = auth.get_errors()
assert not errors, errors
attributes = auth.get_attributes()
```

## code.javascript
```javascript
// OIDC with openid-client
import { Issuer, generators } from "openid-client";

const issuer = await Issuer.discover("https://idp.example.com");
const client = new issuer.Client({ client_id: "spa", redirect_uris: ["https://sp/cb"] });

const verifier = generators.codeVerifier();
const challenge = generators.codeChallenge(verifier);
res.redirect(client.authorizationUrl({
  scope: "openid email profile",
  code_challenge: challenge, code_challenge_method: "S256",
}));

// On /cb:
const params = client.callbackParams(req);
const tokenSet = await client.callback("https://sp/cb", params, { code_verifier: verifier });
const claims = tokenSet.claims();   // signature + iss + aud + exp already validated
```

## code.java
```java
// Spring Security: OIDC and SAML in one config.
@Configuration
class FederationConfig {
    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(a -> a.anyRequest().authenticated())
            .oauth2Login(o -> o.loginPage("/oidc"))     // OIDC at /oauth2/authorization/{registration}
            .saml2Login(s -> s.loginPage("/saml"))       // SAML at /saml2/authenticate/{registration}
            .build();
    }
}
// application.yml registers IdPs per tenant for both stacks.
```

## code.cpp
```cpp
// Most C++ shops verify JWTs (OIDC id_token) with libjwt or jwt-cpp.
#include <jwt-cpp/jwt.h>

bool verify_id_token(const std::string& token,
                     const std::string& issuer,
                     const std::string& audience,
                     const std::string& jwks_pem_for_kid) {
    try {
        auto decoded = jwt::decode(token);
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::rs256{jwks_pem_for_kid})
            .with_issuer(issuer)
            .with_audience(audience);
        verifier.verify(decoded);
        return true;
    } catch (const std::exception& e) {
        return false;
    }
}
```
