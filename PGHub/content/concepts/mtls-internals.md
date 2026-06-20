---
slug: mtls-internals
module: sd-network
title: mTLS Internals — Client Cert, Chain Verification, SAN, Sidecar Termination
subtitle: How mutual TLS actually works on the wire — CertificateRequest, client Certificate + CertificateVerify, chain building, SAN/SPIFFE matching, and the Envoy/Istio sidecar termination model.
difficulty: Advanced
position: 411
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "RFC 8446 — TLS 1.3 (client authentication §4.3.2, §4.4.2)"
    url: "https://datatracker.ietf.org/doc/html/rfc8446"
    type: book
  - title: "RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication"
    url: "https://datatracker.ietf.org/doc/html/rfc8705"
    type: book
  - title: "Istio Security — Identity, mTLS, and Envoy sidecar PEPs"
    url: "https://istio.io/latest/docs/concepts/security/"
    type: blog
status: published
---

## intro
Mutual TLS is regular TLS plus one extra leg: the server sends a `CertificateRequest` during the handshake, the client replies with a `Certificate` chain and a `CertificateVerify` signature proving possession of the private key, and the server walks the chain to a configured trust anchor before agreeing to derive the session keys. The identity asserted by the client is *the validated certificate*: its Subject Alternative Names, its `SPIFFE://` URI, its serial number, or the SHA-256 thumbprint pinned by a policy. Everything that follows — request authorization, audit logging, token binding — keys off that identity.

## whyItMatters
Bearer tokens travel in headers; anyone who can read the header can replay the request. mTLS binds the identity to a private key that never leaves the host, so the on-wire credential changes every handshake (the `CertificateVerify` signature is over a fresh transcript hash) and cannot be replayed. That property is why every modern service mesh — Istio, Linkerd, Consul, AWS App Mesh — defaults to mTLS for east-west traffic, why open-banking (FAPI, PSD2) standardised on mTLS for client authentication via RFC 8705, why IoT fleets ship per-device certificates, and why Kubernetes' SPIFFE workload identity story is built on top of X.509-SVIDs. If your interviewer asks "how do services in your mesh authenticate each other," the answer is mTLS — and they want the certificate chain, the rotation story, and the sidecar termination model.

## intuition
Strip TLS 1.3 down to two parties exchanging two pieces of evidence: a certificate (a public key plus claims about who owns it, signed by an issuer) and a signature over the handshake transcript (proof of possession of the private key matching that public key). In server-only TLS the server presents both; the client presents nothing, and identity flows one way. mTLS adds the second leg: after the server's `Certificate` and `CertificateVerify`, the server includes a `CertificateRequest` extension in its `EncryptedExtensions`, and the client must respond — inside the same encrypted channel — with its own `Certificate` and `CertificateVerify`. The transcript hash that the client signs covers every prior message, so the signature is fresh for every connection and cannot be lifted from a packet capture.

The hard part is not the wire protocol; the hard part is **identity resolution**. The chain the client presents typically ends in an intermediate CA, which itself is signed by a root the server has in its trust store. The server's certificate-verification path walks: leaf → intermediate → root, validating signatures, name constraints, key usage (`Digital Signature` for leaf, `Certificate Sign` for intermediate), basic constraints (intermediates must have `CA:TRUE`), and the not-before/not-after validity windows of every cert in the chain. A revoked intermediate kills every leaf it signed; this is why CRL or OCSP checks must run as part of the verify pass. CRLite, OCSP-stapling, and short-lived certs (1-hour SPIFFE SVIDs) are the three modern answers to "how do I make revocation actually work."

After the chain validates, the server has to decide *which client* this is. The Subject Common Name has been deprecated for identity matching since RFC 6125; production matches against **Subject Alternative Name** entries — DNS names for traditional services, URIs for SPIFFE (`spiffe://example.org/ns/prod/sa/payments`), or rfc822Names for client-cert email auth. RFC 8705 §3 also defines a thumbprint-binding mode where the access token carries the SHA-256 of the client cert as a `cnf` claim; the resource server checks that the cert presented during mTLS matches the thumbprint inside the token, binding the bearer to the holder.

The operational reality on Kubernetes is that the application process does not handle TLS at all. An Envoy sidecar terminates inbound TLS, validates the client cert, attaches the resolved identity as `x-forwarded-client-cert` (XFCC) headers, and forwards plaintext HTTP to the local app over the loopback interface. Outbound, the sidecar originates the TLS connection with the workload's own cert (rotated automatically every hour by `istiod`). The application thinks it is making `http://service` calls; the mesh wraps every byte in a mTLS tunnel.

## visualization
```
mTLS handshake (TLS 1.3, client auth requested)
─────────────────────────────────────────────────────────
Client                                                Server (Envoy sidecar)
  │── ClientHello (key_share, supported_groups)         │
  │                                                     │
  │   ◄──── ServerHello (key_share, cipher_suite)       │
  │   ◄──── {EncryptedExtensions}                       │
  │   ◄──── {CertificateRequest (CA hints, sig algs)}   │
  │   ◄──── {Certificate: server-leaf -> intermediate}  │
  │   ◄──── {CertificateVerify (sig over transcript)}   │
  │   ◄──── {Finished}                                  │
  │                                                     │
  │── {Certificate: client-leaf -> intermediate} ────►  │  chain build:
  │── {CertificateVerify (sig over transcript)} ─────►  │   leaf -> intermed -> root in trust store?
  │── {Finished} ─────────────────────────────────────► │   key usage / EKU / SAN / SPIFFE URI match policy?
  │                                                     │   OCSP / CRL fresh? revoked?
  │   ◄──── application data (encrypted)                │
  │                                                     │   ▼ (Envoy -> app over loopback)
  │                                                     │   GET /balance HTTP/1.1
  │                                                     │   x-forwarded-client-cert: By=spiffe://prod/api;
  │                                                     │     Hash=...; URI=spiffe://prod/payments
```

## bruteForce
The naive "we have certs in production" setup ships a single long-lived CA, hands every service a 1-year leaf, and configures every server to trust any cert signed by that CA — no SAN check, no SPIFFE URI, no revocation. The first problem is blast radius: a stolen private key from any service lets the attacker impersonate any other service for up to a year. The second is identity confusion: with only "signed by our CA" enforced, the payments service cannot tell the orders service apart from the marketing service. The third is rotation: rolling the CA means restarting every service in the fleet, which nobody schedules until after the breach. This was every pre-2020 hand-rolled internal PKI.

## optimal
The production-grade mTLS stack splits into four layers. **PKI**: an offline root CA, an online intermediate CA per environment, and a workload CA inside the mesh control plane (`istiod`, SPIRE server, AWS Private CA). Roots are kept offline in HSMs; intermediates sign for ≤90 days; leaf SVIDs live for ≤1 hour. Short leaf lifetimes are the modern alternative to CRL/OCSP — a stolen key expires before the attacker can use it broadly, and revocation collapses to "do not renew."

**Identity encoding**: SPIFFE URIs in the SAN field (`spiffe://trust-domain/ns/<namespace>/sa/<service-account>`) give every workload a portable, mesh-agnostic identity that maps cleanly to Kubernetes service accounts. The certificate's URI SAN is canonical; policy engines match on it directly.

**Handshake placement**: termination at the Envoy/Linkerd sidecar, not in the application. The sidecar is provisioned with the workload's private key via a tmpfs-mounted Secret Discovery Service (SDS) socket — the key never touches the filesystem. The sidecar handles cert rotation, OCSP stapling (if used), cipher suite negotiation, and ALPN. Applications speak plain HTTP to loopback; the mesh enforces mTLS everywhere else. STRICT mode in Istio refuses any plaintext at the sidecar; PERMISSIVE accepts both during migrations and is removed once the cutover finishes.

**Authorization layer**: the validated SPIFFE URI from the client cert is attached as the principal in the request context. An `AuthorizationPolicy` (Istio) or `ServerAuthorization` (Linkerd) resource gates which principals can call which endpoints. The interesting power-move from RFC 8705 is **certificate-bound tokens**: when the auth server issues an access token, it embeds the SHA-256 thumbprint of the client cert in the `cnf` claim. The resource server checks that the cert presented on the current mTLS connection matches the embedded thumbprint — a stolen token cannot be replayed from a different host because the attacker does not have the matching private key.

For external (north-south) traffic, mTLS at the ingress gateway authenticates B2B partners and FAPI/PSD2 banking clients; CA hints in the `CertificateRequest` extension tell the client which root to chain to, which is critical when a single gateway serves multiple trust domains. The handshake is exactly the same; only the trust roots and identity encoding change.

## complexity
Handshake compute: one ECDHE (X25519 ~50 µs on modern x86) plus two signature verifications (server's `CertificateVerify` and client's `CertificateVerify`, each ~30 µs for ECDSA-P256 or ~1 ms for RSA-2048). Chain verification is one ECDSA verify per intermediate (chains rarely exceed 3 deep). Memory per active TLS session: ~3 KB of key material, ~1 KB of cert payload. Connection setup latency: 1 RTT for a fresh handshake on TLS 1.3, 0 RTT for resumed sessions (subject to the 0-RTT replay caveat). Cert rotation amortises to one CSR per hour per workload — bounded by the API server in Kubernetes deployments. Identity check cost per request after handshake: zero — the principal is computed once at handshake and reused for every request on the connection.

## pitfalls
- **Trusting CN over SAN for identity.** RFC 6125 and CA/Browser Forum baseline requirements both forbid CN-based matching. A library that still falls back to `Subject.CN` when SAN is empty will accept any leaf whose CN matches; production must reject if no SAN entry matches.
- **Forgetting to validate the full chain on the server side.** Some hand-rolled Go and Java configs set `InsecureSkipVerify: true` for client certs during prototyping and never turn it back on. Without chain verification, mTLS becomes "client presents a cert" — any self-signed cert is accepted.
- **No revocation story.** Long-lived leaf certs without CRL, OCSP, or short-lived rotation means a compromised key is valid until expiry. Pick one: short SVIDs (1 hour), OCSP-stapling with a hard-fail policy, or a CRL distribution point. "Soft-fail OCSP" is roughly equivalent to no revocation.
- **TLS terminating before the sidecar.** Cloud load balancers that terminate TLS at the edge and forward plaintext to the sidecar break the mTLS guarantee — the actual client cert never reaches Envoy, and the principal is lost. Use TCP passthrough (NLB, GKE Ingress with passthrough) or terminate inside the mesh.
- **Forgetting the `client_certificate_request` extension on TLS 1.3 servers.** A server configured for "TLS with client auth optional" that never sends `CertificateRequest` will silently fall through to anonymous TLS. Audit by capturing the handshake with `tshark -O tls` and confirming the `CertificateRequest` byte is on the wire.

## interviewTips
- Be specific about *where* the handshake happens. "TLS at the edge" and "mTLS at the sidecar" are different layers; production meshes do both, and explaining the boundary (X-Forwarded-Client-Cert hand-off, principal propagation) wins points.
- Volunteer the rotation model upfront. Long-lived certs are the disqualifying answer. Short-lived SVIDs via SDS or SPIRE are the modern answer; mention that the private key never leaves the workload's tmpfs.
- Tie mTLS into zero-trust. The phrasing the interviewer wants is "every hop is authenticated and authorized, no implicit trust based on network location." mTLS provides the authentication leg; AuthorizationPolicy provides the authorization leg; observability is the audit leg.

## code

### python
```python
import ssl, socket

def make_client_ctx(client_cert: str, client_key: str, ca_bundle: str) -> ssl.SSLContext:
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_3
    ctx.verify_mode = ssl.CERT_REQUIRED
    ctx.check_hostname = True
    ctx.load_verify_locations(cafile=ca_bundle)
    ctx.load_cert_chain(certfile=client_cert, keyfile=client_key)
    return ctx


def make_server_ctx(server_cert: str, server_key: str, client_ca_bundle: str) -> ssl.SSLContext:
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_3
    ctx.verify_mode = ssl.CERT_REQUIRED
    ctx.load_cert_chain(certfile=server_cert, keyfile=server_key)
    ctx.load_verify_locations(cafile=client_ca_bundle)
    return ctx


def extract_spiffe_uri(peer_cert: dict) -> str | None:
    for entry in peer_cert.get("subjectAltName", ()):
        kind, value = entry
        if kind == "URI" and value.startswith("spiffe://"):
            return value
    return None
```

### javascript
```javascript
import tls from 'node:tls';
import fs from 'node:fs';

export function makeClientOptions({ certPath, keyPath, caPath, host }) {
  return {
    host,
    port: 443,
    minVersion: 'TLSv1.3',
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    ca: fs.readFileSync(caPath),
    rejectUnauthorized: true,
    checkServerIdentity: tls.checkServerIdentity,
  };
}

export function makeServerOptions({ certPath, keyPath, clientCaPath }) {
  return {
    minVersion: 'TLSv1.3',
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    ca: fs.readFileSync(clientCaPath),
    requestCert: true,
    rejectUnauthorized: true,
  };
}

export function extractSpiffeUri(socket) {
  const cert = socket.getPeerCertificate(true);
  const sans = (cert.subjectaltname || '').split(',').map(s => s.trim());
  const uri = sans.find(s => s.startsWith('URI:spiffe://'));
  return uri ? uri.slice(4) : null;
}
```

### java
```java
import javax.net.ssl.*;
import java.io.FileInputStream;
import java.security.KeyStore;

public final class Mtls {
    public static SSLContext build(String keystorePath, char[] keystorePass,
                                   String truststorePath, char[] truststorePass) throws Exception {
        KeyStore ks = KeyStore.getInstance("PKCS12");
        try (var in = new FileInputStream(keystorePath)) { ks.load(in, keystorePass); }
        KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
        kmf.init(ks, keystorePass);

        KeyStore ts = KeyStore.getInstance("PKCS12");
        try (var in = new FileInputStream(truststorePath)) { ts.load(in, truststorePass); }
        TrustManagerFactory tmf = TrustManagerFactory.getInstance("PKIX");
        tmf.init(ts);

        SSLContext ctx = SSLContext.getInstance("TLSv1.3");
        ctx.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);
        return ctx;
    }

    public static SSLServerSocket serverSocket(SSLContext ctx, int port) throws Exception {
        SSLServerSocket s = (SSLServerSocket) ctx.getServerSocketFactory().createServerSocket(port);
        s.setNeedClientAuth(true);
        s.setEnabledProtocols(new String[]{"TLSv1.3"});
        return s;
    }
}
```

### cpp
```cpp
#include <openssl/ssl.h>
#include <openssl/x509v3.h>
#include <stdexcept>

SSL_CTX* make_server_ctx(const char* cert, const char* key, const char* client_ca) {
    SSL_CTX* ctx = SSL_CTX_new(TLS_server_method());
    SSL_CTX_set_min_proto_version(ctx, TLS1_3_VERSION);
    if (SSL_CTX_use_certificate_chain_file(ctx, cert) != 1) throw std::runtime_error("cert");
    if (SSL_CTX_use_PrivateKey_file(ctx, key, SSL_FILETYPE_PEM) != 1) throw std::runtime_error("key");
    if (SSL_CTX_load_verify_locations(ctx, client_ca, nullptr) != 1) throw std::runtime_error("ca");
    SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER | SSL_VERIFY_FAIL_IF_NO_PEER_CERT, nullptr);
    return ctx;
}

std::string extract_spiffe_uri(SSL* ssl) {
    X509* peer = SSL_get_peer_certificate(ssl);
    if (!peer) return {};
    std::string result;
    auto* sans = (GENERAL_NAMES*) X509_get_ext_d2i(peer, NID_subject_alt_name, nullptr, nullptr);
    if (sans) {
        for (int i = 0; i < sk_GENERAL_NAME_num(sans); ++i) {
            GENERAL_NAME* gn = sk_GENERAL_NAME_value(sans, i);
            if (gn->type == GEN_URI) {
                const char* uri = (const char*) ASN1_STRING_get0_data(gn->d.uniformResourceIdentifier);
                if (uri && std::string(uri).rfind("spiffe://", 0) == 0) { result = uri; break; }
            }
        }
        GENERAL_NAMES_free(sans);
    }
    X509_free(peer);
    return result;
}
```
