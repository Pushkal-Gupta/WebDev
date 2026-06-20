---
slug: tls-handshake
module: cs-network-protocols
title: TLS 1.3 Handshake
subtitle: 1-RTT key exchange with forward secrecy; 0-RTT for resumed sessions and its replay trade-offs.
difficulty: Intermediate
position: 47
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Remzi Arpaci-Dusseau — OSTEP: Security"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "TLS Handshake — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/computer-networks/transport-layer-security-tls/"
    type: blog
  - title: "TheAlgorithms/Python — ciphers"
    url: "https://github.com/TheAlgorithms/Python/tree/master/ciphers"
    type: repo
status: published
---

## intro
**TLS 1.3** (RFC 8446, 2018) authenticates the server, optionally the client, and establishes symmetric session keys — in a **single round trip**. It replaces TLS 1.2's 2-RTT handshake by sending the client's key share *with* the first message. For repeated visits it supports **0-RTT** application data using a pre-shared key from the previous session, at the cost of weakened replay resistance.

## whyItMatters
Every HTTPS connection, every gRPC call, every modern API request begins with a TLS handshake. Cutting it from 2 RTT to 1 RTT (or 0 RTT) is a noticeable latency win — at 100 ms RTT, a saved round trip is ~10% of perceived page load time. Forward secrecy means a compromise of the server's long-term key tomorrow does not decrypt today's traffic. These two properties — speed and forward secrecy — are why TLS 1.3 deployment was a priority for Google, Cloudflare, and the IETF.

## intuition
**Three goals**: agree on symmetric keys, authenticate the server, prove key agreement happened (transcript hash). TLS 1.3 collapses them by:
1. Client guesses the cipher suite + sends an ephemeral Diffie-Hellman public key in ClientHello.
2. Server picks the suite + sends *its* DH public — both sides can now compute the shared secret and derive keys.
3. Everything after the server's key share is encrypted; certificate and signature ride inside.

The client only needs to wait one RTT to compute keys and start sending encrypted application data.

## visualization
```
TLS 1.2 (legacy):                      TLS 1.3 (modern):

Client            Server                Client                    Server
  │ ClientHello ──►│                      │ ClientHello + ───────►│
  │ ◄─ ServerHello │                      │   key_share +         │
  │ ◄─ Certificate │                      │   psk (if resuming)   │
  │ ◄─ ServerHelloDone                    │                       │
  │ ClientKeyExch │                      │   ◄── ServerHello + key_share
  │   ChangeCipher                        │       {EncryptedExt}  │   ← already encrypted
  │   Finished ────►                      │       {Certificate}   │
  │ ◄── ChangeCipher                      │       {CertVerify}    │
  │ ◄── Finished                          │       {Finished}      │
  │ ──── application data ──►             │ {Finished} ───────────►│
                                          │ ──── application data ──►

  Total: 2 RTT before data flows         Total: 1 RTT before data flows

0-RTT (resumption): client sends application data with the very first ClientHello,
encrypted under a key derived from the prior session's PSK. Server can read it
immediately. Caveat: this data has weaker replay resistance.
```

## bruteForce
Send everything in the clear. Done in 1998. The reason TLS exists.

A naïve "encrypt with the server's RSA key" approach (the original SSL design) is fast but has **no forward secrecy** — a future leak of the RSA private key decrypts every captured session. TLS 1.3 dropped static RSA entirely; only ephemeral DH suites remain.

## optimal
**1-RTT handshake** (the common case):

1. **ClientHello**: random nonce, supported cipher suites, supported groups, **key_share** with one or more DH public keys (X25519 or P-256 typical), supported signature algorithms, list of pre-shared key identities if resuming.
2. Server picks a cipher suite + a group, computes the shared secret, derives **handshake keys** via HKDF, then sends:
   - **ServerHello** (key_share, chosen suite) — plaintext.
   - Everything after — encrypted with the handshake key:
     - **EncryptedExtensions**: ALPN, SNI ack, etc.
     - **Certificate**: server's X.509 chain.
     - **CertificateVerify**: signature over the transcript hash with the server's private key, proving possession.
     - **Finished**: HMAC over the transcript, proving the server saw the same handshake.
3. **Client** verifies the certificate chain + signature + Finished, then sends its own **Finished**.
4. Both sides derive **application traffic secrets** from the handshake transcript and switch to them.

**Key schedule** (simplified):
```
HKDF-Extract(salt = 0, IKM = PSK)         → Early Secret
HKDF-Extract(salt = ES, IKM = DH shared)  → Handshake Secret
HKDF-Extract(salt = HS, IKM = 0)          → Master Secret
                                          ↓ derive per-direction traffic secrets
                                            client_handshake_traffic_secret
                                            server_handshake_traffic_secret
                                            client_application_traffic_secret
                                            server_application_traffic_secret
```

**0-RTT (early data)**:
- Available only on resumed sessions. Client sends application data encrypted with a key derived from the prior session's PSK in the same flight as ClientHello.
- **Trade-off**: 0-RTT data has *no replay protection* at the TLS layer — an attacker can resend it. Only idempotent operations (GETs, no side effects) should be permitted as 0-RTT. The application server enforces this.
- **Anti-replay (best-effort)**: server keeps a single-use-token cache and rejects duplicates; clients use unique-per-request nonces.

**Cipher suites** allowed in TLS 1.3 (only 5):
- TLS_AES_128_GCM_SHA256
- TLS_AES_256_GCM_SHA384
- TLS_CHACHA20_POLY1305_SHA256
- TLS_AES_128_CCM_SHA256
- TLS_AES_128_CCM_8_SHA256

All are AEAD; all provide forward secrecy via ephemeral DH; SHA-384/256 for HKDF.

## complexity
- **Latency**: 1 RTT (cold), 0 RTT (resumed).
- **CPU**: 1 ECDH (~25 μs on modern hardware), 1 signature verify (~100 μs for ECDSA, ~1 ms for RSA), 1 HKDF (~5 μs). Total handshake cost: typically < 2 ms on the server, dominated by signature verify on the client.
- **Bandwidth**: typical 1 RTT handshake = 2-3 KB (certificate chain dominates).
- **Server state**: minimal — no session ID lookups by default; resumption uses session **tickets** issued by the server.

## pitfalls
- **0-RTT with non-idempotent operations**: a POST that increments a counter, replayed by an attacker, doubles the counter. Applications must explicitly opt in per-route and refuse 0-RTT for unsafe verbs.
- **Forward secrecy gap on session tickets**: if the server's ticket-encryption key is stolen, all resumed sessions encrypted under it are decryptable. Rotate ticket keys frequently.
- **Confusing PSK with static RSA**: TLS 1.3 PSKs are derived from the prior ephemeral DH, not from a long-term key — so forward secrecy is preserved as long as ticket keys rotate.
- **Downgrade attacks**: a MITM strips TLS 1.3 from ClientHello to force TLS 1.2. The server's random in TLS 1.3 contains a sentinel ("DOWNGRD" magic) that signals to the client "I'm a 1.3 server pretending to be 1.2" — abort if seen.
- **Certificate validation skipped**: in app code, never disable cert verification "just for testing." It's the most common TLS vulnerability in CVE databases.
- **Compression** (CRIME attack): TLS 1.3 forbids compression entirely.

## interviewTips
- Trigger phrases: "explain HTTPS," "what does TLS do?", "0-RTT vs 1-RTT," "why is QUIC faster?"
- Always emphasize **three things TLS provides**: confidentiality (AEAD encryption), integrity (AEAD tag), authentication (certificate + signature).
- Distinguish **forward secrecy** (ephemeral DH per session) from server authentication (cert + private key). Be explicit that TLS 1.3 mandates ephemeral DH.
- For 0-RTT, lead with the replay caveat — interviewers grade your awareness of safety, not just the speed win.
- For senior loops, mention **QUIC** combines TCP+TLS into one handshake (0-RTT TCP+TLS = no round trip), **ECH (Encrypted Client Hello)** hides SNI, and **Kyber / post-quantum** key exchange is being phased into TLS 1.3 (`X25519Kyber768Draft00`).

## code.python
```python
# Demo: a TLS 1.3 client connecting to a TLS 1.3 server, with a 0-RTT-style
# session ticket resumption. Real handshake details are inside the ssl module.

import ssl, socket

def fetch(host, port=443, server_hostname=None):
    ctx = ssl.create_default_context()
    ctx.minimum_version = ssl.TLSVersion.TLSv1_3
    ctx.set_alpn_protocols(["h2", "http/1.1"])
    raw = socket.create_connection((host, port), timeout=5)
    with ctx.wrap_socket(raw, server_hostname=server_hostname or host) as s:
        print("negotiated:", s.version(), s.cipher())
        s.sendall(f"GET / HTTP/1.1\r\nHost: {host}\r\nConnection: close\r\n\r\n".encode())
        data = b""
        while chunk := s.recv(4096):
            data += chunk
        return data

# fetch("www.cloudflare.com")
```

## code.javascript
```javascript
// Node.js TLS 1.3 client; library handles ECDH, HKDF, AEAD under the hood.
const tls = require("node:tls");

function fetch(host, port = 443) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port, minVersion: "TLSv1.3", ALPNProtocols: ["h2", "http/1.1"] },
      () => {
        console.log("negotiated", socket.getProtocol(), socket.getCipher());
        socket.write(`GET / HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`);
      }
    );
    const chunks = [];
    socket.on("data", c => chunks.push(c));
    socket.on("end", () => resolve(Buffer.concat(chunks)));
    socket.on("error", reject);
  });
}
```

## code.java
```java
import javax.net.ssl.*;
import java.io.*;

class TlsClient {
    static void fetch(String host, int port) throws Exception {
        SSLContext ctx = SSLContext.getInstance("TLSv1.3");
        ctx.init(null, null, null);
        SSLSocketFactory factory = ctx.getSocketFactory();
        try (SSLSocket s = (SSLSocket) factory.createSocket(host, port)) {
            s.setEnabledProtocols(new String[]{"TLSv1.3"});
            SSLParameters p = s.getSSLParameters();
            p.setApplicationProtocols(new String[]{"h2", "http/1.1"});
            s.setSSLParameters(p);
            s.startHandshake();
            System.out.println("negotiated: " + s.getSession().getProtocol() + " " + s.getSession().getCipherSuite());
            OutputStream out = s.getOutputStream();
            out.write(("GET / HTTP/1.1\r\nHost: " + host + "\r\nConnection: close\r\n\r\n").getBytes());
            out.flush();
            InputStream in = s.getInputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) > 0) System.out.write(buf, 0, n);
        }
    }
}
```

## code.cpp
```cpp
// OpenSSL 3.x TLS 1.3 client (sketch; error handling abbreviated).
#include <openssl/ssl.h>
#include <openssl/err.h>
#include <netdb.h>
#include <sys/socket.h>
#include <unistd.h>
#include <cstdio>
#include <cstring>

int tls_fetch(const char* host, const char* port) {
    SSL_CTX* ctx = SSL_CTX_new(TLS_client_method());
    SSL_CTX_set_min_proto_version(ctx, TLS1_3_VERSION);
    SSL_CTX_set_default_verify_paths(ctx);

    addrinfo hints{}, *res;
    hints.ai_socktype = SOCK_STREAM;
    getaddrinfo(host, port, &hints, &res);
    int fd = socket(res->ai_family, SOCK_STREAM, 0);
    connect(fd, res->ai_addr, res->ai_addrlen);

    SSL* ssl = SSL_new(ctx);
    SSL_set_fd(ssl, fd);
    SSL_set_tlsext_host_name(ssl, host);
    if (SSL_connect(ssl) != 1) { ERR_print_errors_fp(stderr); return 1; }

    printf("negotiated: %s %s\n", SSL_get_version(ssl), SSL_get_cipher_name(ssl));
    char req[512];
    int n = snprintf(req, sizeof(req), "GET / HTTP/1.1\r\nHost: %s\r\nConnection: close\r\n\r\n", host);
    SSL_write(ssl, req, n);
    char buf[4096];
    while ((n = SSL_read(ssl, buf, sizeof(buf))) > 0) fwrite(buf, 1, n, stdout);

    SSL_shutdown(ssl); SSL_free(ssl); close(fd);
    SSL_CTX_free(ctx); freeaddrinfo(res);
    return 0;
}
```
