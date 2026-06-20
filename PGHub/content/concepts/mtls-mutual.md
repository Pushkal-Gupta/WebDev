---
slug: mtls-mutual
module: sd-network
title: Mutual TLS (mTLS)
subtitle: Service-to-service auth with both sides presenting certificates — and how to rotate them.
difficulty: Advanced
position: 65
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "AWS Builders' Library — Identity & Service-to-Service Auth"
    url: "https://aws.amazon.com/builders-library"
    type: blog
  - title: "Microservices.io — Access Token"
    url: "https://microservices.io/patterns/security/access-token.html"
    type: book
  - title: "hashicorp/vault"
    url: "https://github.com/hashicorp/vault"
    type: repo
status: published
---

## intro
Standard TLS proves the SERVER's identity. **Mutual TLS** (mTLS) proves BOTH sides — the client also presents a certificate signed by a CA the server trusts. It's the workhorse of zero-trust service meshes (Istio, Linkerd, Consul), API gateways for B2B partners, and IoT fleets. Identity is the cert; rotation is the operational problem.

## whyItMatters
Bearer tokens (JWT, API keys) leak — they're strings. Certificates have a **private key that never leaves the host**; the client proves possession via a TLS handshake signature. Replay-resistant, MITM-resistant, and the identity is cryptographic, not a header you can copy.

## intuition
**Handshake (simplified mTLS)**:
1. Client connects. Server sends its cert + asks for client cert (`CertificateRequest`).
2. Client sends its cert chain + signs the handshake transcript with its private key.
3. Server verifies cert chain to its trusted CA, verifies signature, extracts SAN/CN as identity.
4. Both derive session keys; encrypted channel begins.

**Trust** = the CA bundle. Server config: `client_ca = /etc/pki/ca-bundle.pem`. Only certs signed by this CA are accepted.

**Identity extraction**: the server reads `subject.CN` or `subjectAltName.URI` (`spiffe://prod/svc/billing`) and uses it as the principal for authorization.

**Service mesh pattern**: sidecar proxy (Envoy) on every pod terminates mTLS. App code stays plain HTTP on localhost. SPIFFE/SPIRE issues short-lived SVIDs (1 hour) and rotates automatically.

## visualization
```
Client (billing-svc)                Server (orders-svc)
    |                                       |
    |---- ClientHello ----------------------|
    |<--- ServerHello + ServerCert + ------|
    |     CertificateRequest                |
    |---- ClientCert + CertVerify --------->|
    |     (signed transcript proves         |
    |      possession of private key)       |
    |     <-- both verify chains -->        |
    |<==== encrypted session ===============|
              ^
              SAN: spiffe://prod/billing
              Authorized as billing-svc
```

Rotation timeline (SPIFFE/SPIRE default):
```
T-0    : agent issues cert valid for 1h
T-30m  : agent issues NEW cert (overlap window)
T-60m  : old cert expires; new cert in use; zero downtime
```

## bruteForce
**Long-lived (1-year) client certs distributed manually**: a compromised host stays trusted for a year; rotation = mass outage when someone fat-fingers it.

**No CRL / OCSP**: revocation is impossible; compromised cert keeps working until expiry.

**Reusing one client cert across all services**: indistinguishable identities; can't authz per service.

## optimal
**Short-lived + automated rotation**:
- Issue 1h-24h client certs from an internal CA (Vault PKI, SPIRE, cert-manager + cfssl).
- Workload identity baked in: `spiffe://trust-domain/ns/prod/sa/billing`.
- Sidecar handles the handshake; app sees a plain header `x-forwarded-client-cert`.

**Authorization** layer on top:
- Service A is allowed to call Service B's POST /orders.
- Policy in OPA / Istio AuthorizationPolicy keyed on the SPIFFE ID.

**CA hierarchy**:
- Offline root CA (signs intermediates yearly).
- Online intermediate CA (signs leaf certs hourly).
- Compromise of intermediate = revoke + reissue from root; leaves rotate within 1h.

**Verification stack**:
- Cert chain validates to trusted CA bundle.
- Cert not expired, not revoked (CRL/OCSP optional with short-lived certs).
- SAN/CN matches expected workload identity.
- Optional: SPIFFE federation across trust domains.

## complexity
- **Per connection**: 1 RTT extra over TLS (one extra message in handshake). Negligible.
- **CPU**: signature verify per handshake. Session resumption + connection pooling amortize.
- **Storage**: 1 cert + 1 key per workload; rotated continuously.

## pitfalls
- **Trusting a public CA bundle for client auth**: anyone with a publicly signed cert is now "trusted". Use a SEPARATE private CA for client trust.
- **Hostname verification on the server side**: clients verify server hostname; servers verify CLIENT identity via SAN (not via hostname). Different code path.
- **Cert key on disk world-readable**: file mode 0600 + dedicated user.
- **Rotation grace window too short**: old cert expires before clients pick up the new one -> mass 5xx.
- **No clock sync (NTP)**: cert "not yet valid" errors at 03:00 when a host's clock drifts.
- **Hardcoding CA in image**: rotating CA = rebuild every image. Mount as Secret/projected volume.

## interviewTips
- Differentiate **server TLS** vs **mutual TLS** clearly — many candidates conflate them.
- Mention **SPIFFE/SPIRE** for cluster-grade workload identity.
- Discuss the **rotation cadence + grace overlap** problem — separates ops-aware candidates.
- For zero-trust, mention **identity-in-cert + policy-on-identity** decomposition.

## code.python
```python
import ssl, socket
ctx = ssl.create_default_context(cafile='/etc/pki/internal-ca.pem')
ctx.verify_mode = ssl.CERT_REQUIRED
ctx.load_cert_chain(certfile='/etc/pki/client.crt', keyfile='/etc/pki/client.key')
with socket.create_connection(('orders.internal', 443)) as raw:
    with ctx.wrap_socket(raw, server_hostname='orders.internal') as s:
        s.sendall(b'GET /health HTTP/1.1\r\nHost: orders.internal\r\n\r\n')
```

## code.javascript
```javascript
const tls = require('tls');
const fs = require('fs');
const sock = tls.connect({
  host: 'orders.internal',
  port: 443,
  ca: fs.readFileSync('/etc/pki/internal-ca.pem'),
  cert: fs.readFileSync('/etc/pki/client.crt'),
  key: fs.readFileSync('/etc/pki/client.key'),
  rejectUnauthorized: true,
}, () => sock.write('GET /health HTTP/1.1\r\nHost: orders.internal\r\n\r\n'));
```

## code.java
```java
SSLContext ctx = SSLContext.getInstance("TLSv1.3");
KeyStore ks = KeyStore.getInstance("PKCS12");
ks.load(new FileInputStream("/etc/pki/client.p12"), "pw".toCharArray());
KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
kmf.init(ks, "pw".toCharArray());
TrustManagerFactory tmf = TrustManagerFactory.getInstance("SunX509");
KeyStore ts = KeyStore.getInstance("JKS");
ts.load(new FileInputStream("/etc/pki/internal-ca.jks"), "pw".toCharArray());
tmf.init(ts);
ctx.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);
```

## code.cpp
```cpp
// OpenSSL outline
// SSL_CTX_load_verify_locations(ctx, "internal-ca.pem", NULL);
// SSL_CTX_use_certificate_file(ctx, "client.crt", SSL_FILETYPE_PEM);
// SSL_CTX_use_PrivateKey_file(ctx, "client.key", SSL_FILETYPE_PEM);
// SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER, NULL);
```
