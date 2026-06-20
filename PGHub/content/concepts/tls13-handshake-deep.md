---
slug: tls13-handshake-deep
module: cs-network-protocols
title: TLS 1.3 Handshake Deep — KeyShare, PSK, 0-RTT Replay
subtitle: Single-RTT handshake mechanics — KeyShare and supported_groups, PSK resumption, encrypted extensions, alerts inside the encrypted channel, and why 0-RTT is replay-vulnerable.
difficulty: Advanced
position: 73
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "RFC 8446 — The Transport Layer Security (TLS) Protocol Version 1.3"
    url: "https://datatracker.ietf.org/doc/html/rfc8446"
    type: spec
  - title: "Cloudflare — An overview of TLS 1.3 and Q&A"
    url: "https://blog.cloudflare.com/tls-1-3-overview-and-q-and-a/"
    type: blog
  - title: "Wikipedia — Transport Layer Security"
    url: "https://en.wikipedia.org/wiki/Transport_Layer_Security"
    type: blog
status: published
---

## intro
TLS 1.3 completes the handshake in one round trip by sending the client's `key_share` in the very first message, encrypting everything after the server's response, and reducing the cipher-suite menu to five AEAD options. Session resumption uses a PSK derived from the prior session's resumption secret; with `early_data` the client can ship application bytes alongside the resumed handshake, achieving 0-RTT — at the cost of replay vulnerability that limits which requests qualify.

## whyItMatters
The TLS 1.3 wire format is what every HTTPS connection looks like today, and it is the same handshake QUIC carries inside its `CRYPTO` frames. Knowing the exact role of `KeyShare`, `supported_groups`, `pre_shared_key`, and `early_data` is what separates "I read about TLS" from "I can debug a handshake failure with `tcpdump` and `tshark` open." Forward secrecy guarantees, the 0-RTT replay surface, and the contents of `EncryptedExtensions` are the substrate of every secure system review. Field rotation, post-quantum hybrid groups (`X25519MLKEM768`), and PSK ticket revocation all build directly on these mechanics.

## intuition
The TLS 1.3 handshake is structured around three secrets derived in order: `early_secret`, `handshake_secret`, `master_secret`. Each is fed into HKDF with a label and the running transcript hash to derive concrete traffic keys. The handshake works because both sides arrive at the same secrets by combining the same inputs — a PSK (if any), the ECDHE shared key (if any), and the transcript of every handshake message in order.

ClientHello carries the cipher_suites (TLS 1.3 has five: `TLS_AES_128_GCM_SHA256`, `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`, `TLS_AES_128_CCM_SHA256`, `TLS_AES_128_CCM_8_SHA256`), the `supported_groups` extension listing curves the client is willing to do ECDHE on (e.g., `x25519`, `secp256r1`), the `key_share` extension carrying one or more ephemeral public keys for those groups, and the `signature_algorithms` extension. The client *guesses* which group the server will pick and sends a public key for it; if the guess is wrong, the server replies with a `HelloRetryRequest` naming the group it wants and the client retries — turning the handshake into 2 RTT for that case.

ServerHello picks one cipher suite and one `key_share`. From that moment both sides have everything they need to compute the ECDHE shared key and derive `handshake_secret`. The very next message — `EncryptedExtensions` — is already encrypted under the handshake traffic keys. Everything sensitive (server certificate, certificate verify, possibly client auth, finally `Finished`) rides inside this encrypted channel. TLS 1.2 sent certificates in cleartext; TLS 1.3 does not, because identity exposure is a privacy leak.

`Finished` is a MAC over the transcript hash so far. It proves both sides agree on every byte exchanged — any tampered field changes the hash, breaks the MAC, and aborts. Once both `Finished` messages exchange, the handshake is complete and application traffic uses `application_traffic_secret_N` (key update can rotate this mid-connection).

Session resumption replaces certificate verification with a PSK derived from `resumption_master_secret`. The server issues a `NewSessionTicket` after the handshake; the client stores it. On the next connection, ClientHello carries `pre_shared_key` (the ticket plus a binder MAC) and `psk_key_exchange_modes`. The server validates the binder, derives the new keys, and skips the certificate flight. 0-RTT goes further — the client encrypts early application data under `client_early_traffic_secret` (derived from the PSK alone) and sends it alongside the ClientHello. The server can decrypt and process before the handshake completes.

The replay problem is unavoidable. 0-RTT data is encrypted under a key derived purely from the PSK and a transcript that an attacker could replay verbatim. The server has no way to distinguish a fresh 0-RTT packet from a captured one. RFC 8446 §8 mandates server-side mitigations: keep a strike list of seen `ClientHello.random` values within the ticket's validity window, or restrict 0-RTT to idempotent application semantics — usually the latter, since strike lists across server farms are expensive.

## visualization
```
  TLS 1.3 (1-RTT, new session)
  ─────────────────────────────────────────────────────────
  Client                                              Server
    │── ClientHello                                       │
    │   ├ key_share: [x25519 pubkey]                     │
    │   ├ supported_groups: [x25519, secp256r1]          │
    │   ├ cipher_suites: [AES_128_GCM, …]                │
    │   └ signature_algorithms                       ───▶│
    │                                                     │
    │◀── ServerHello (key_share: x25519 pubkey)           │
    │   {EncryptedExtensions}                             │
    │   {Certificate} {CertificateVerify} {Finished} ─────│
    │                                                     │
    │── {Finished}                                    ───▶│
    │── {Application Data} ◀──── decryptable here  ───▶ {Application Data}

  TLS 1.3 (0-RTT, resumed session)
  ─────────────────────────────────────────────────────────
  Client                                              Server
    │── ClientHello                                       │
    │   ├ pre_shared_key: [ticket, binder]                │
    │   ├ early_data extension                           │
    │   └ key_share: [x25519]                            │
    │── {Early Application Data}                     ───▶│
    │                                              decrypted under PSK
    │◀── ServerHello, {EE}, {Finished}                    │
    │── {EndOfEarlyData} {Finished} {App Data}       ───▶│
```

## bruteForce
The brute-force predecessor is TLS 1.2: ClientHello → ServerHello + Certificate (cleartext) → ServerKeyExchange + ServerHelloDone → ClientKeyExchange + Finished → Finished. Two round trips before any application data flows, certificate sent in cleartext, dozens of cipher suites including weak and broken ones (CBC, RC4, RSA key exchange without forward secrecy). Every TLS 1.2 connection that does not negotiate ECDHE gives you a permanent forward-secrecy hole — compromise the server's RSA key and every past session decrypts. Session resumption exists via session IDs or session tickets, but still requires 1 RTT for the resumed Finished exchange.

## optimal
TLS 1.3's optimization is structural: assume ECDHE, ship the key share immediately, encrypt everything after ServerHello, drop every cipher mode that is not AEAD. The cipher_suites list goes from ~30 down to 5. The handshake messages collapse — there is no separate `ServerKeyExchange` because the key share is in ServerHello, no separate `ClientKeyExchange` because the client's share is in ClientHello, no `ChangeCipherSpec` (deprecated, present only as a middlebox-compatibility ghost). The result is one round trip for new sessions and zero for resumed ones.

Key derivation uses HKDF with one input concatenation at each stage: `early_secret = HKDF-Extract(0, PSK)`, `handshake_secret = HKDF-Extract(early_secret, ECDHE)`, `master_secret = HKDF-Extract(handshake_secret, 0)`. The transcript hash is appended to derive each concrete traffic key via `HKDF-Expand-Label`. Because every key depends on the full transcript, any middlebox tampering changes a hash and breaks the `Finished` MAC immediately — there is no way for an attacker to selectively forge a single field.

PSK resumption ties two sessions together via the `resumption_master_secret`. The `NewSessionTicket` carries an opaque ticket (which the server can either keep as a key reference or encrypt server-side state into) and a `ticket_lifetime`. On resumption, the client offers the PSK identity in `pre_shared_key`, plus a binder MAC over the partial ClientHello that proves possession of the secret. The server validates the binder, picks one of the offered PSKs, and the handshake skips the certificate and signature steps entirely.

0-RTT is the resumption shortcut. With `early_data` enabled, the client derives `client_early_traffic_secret` from the PSK alone (no ECDHE, no fresh randomness from the server) and encrypts application data under it. The server can process the data before its own Finished, so the first request lands in zero round trips. The replay surface is the price: an attacker who captured 0-RTT packets can resend them and the server cannot tell. Mitigations are application-layer (idempotency only) or stateful server-side (strike list of seen `ClientHello.random` within the ticket's anti-replay window).

## complexity
ECDHE on `x25519` is one scalar-mult per side (~few hundred microseconds on modern CPUs). HKDF derivations are a few SHA-256/SHA-384 operations — single-digit microseconds. AEAD per-record cost is O(L) in payload bytes. End-to-end handshake latency is 1×RTT plus a few ms of CPU. PSK resumption skips the ECDHE (or includes it for forward secrecy via `psk_dhe_ke` mode) and removes the certificate-chain validation (typically 50–200 µs depending on chain length). 0-RTT saves the additional RTT entirely. Memory per connection is dominated by the AEAD context and the transcript hash state — under 1KB.

## pitfalls
- Sending non-idempotent application data over 0-RTT — captured packets are replayable. Restrict 0-RTT to safe HTTP methods, or use server-side anti-replay strike lists.
- Guessing the wrong group in `key_share` — triggers `HelloRetryRequest` and a second round trip. Clients should put their best-guess group's public key in the first ClientHello and include the curve in `supported_groups`.
- Forgetting that `EncryptedExtensions` carries `server_name` confirmation and any extension that should not be cleartext — putting an extension on the wrong message leaks it on the wire.
- Treating the `ChangeCipherSpec` byte as meaningful in TLS 1.3 — it is a compatibility relic that middleboxes expect; do not try to derive state from it.
- Reusing `pre_shared_key` tickets indefinitely — RFC 8446 mandates a max `ticket_lifetime` of 7 days, and 0-RTT anti-replay windows are typically much shorter (~10 sec). Long-lived tickets widen the replay surface.
- Misreading the alert protocol — TLS 1.3 alerts are encrypted inside the application traffic stream. Cleartext alerts are only valid before the keys are derived (during early ClientHello processing).

## interviewTips
- Draw the 1-RTT and 0-RTT message sequences with exactly which messages are encrypted and under which secret.
- Be ready to explain why TLS 1.3 dropped RSA key exchange and non-AEAD ciphers — forward secrecy and removing modes vulnerable to padding-oracle attacks.
- Know the 0-RTT replay story end to end: PSK reuse, `early_secret` derivation, mitigations at the server (strike list) and at the application (idempotency).

## code
### python
```python
class Tls13Handshake:
    def __init__(self, role, transcript_hash):
        self.role = role
        self.transcript = transcript_hash  # rolling SHA-256/384
        self.early_secret = None
        self.handshake_secret = None
        self.master_secret = None

    def client_hello(self, psk=None):
        ch = ClientHello(
            cipher_suites=[TLS_AES_128_GCM_SHA256, TLS_CHACHA20_POLY1305_SHA256],
            supported_groups=[X25519, SECP256R1],
            key_share=[KeyShareEntry(X25519, x25519_keygen().public)],
            signature_algorithms=[ECDSA_SECP256R1_SHA256, RSA_PSS_RSAE_SHA256],
            pre_shared_key=PreSharedKey([psk.identity], [psk.binder()]) if psk else None,
        )
        self.transcript.update(ch.serialize())
        return ch

    def derive_handshake_keys(self, psk_bytes, ecdhe_shared):
        self.early_secret = hkdf_extract(b"\x00" * 32, psk_bytes or b"\x00" * 32)
        derived = hkdf_expand_label(self.early_secret, b"derived",
                                    sha256(b"").digest(), 32)
        self.handshake_secret = hkdf_extract(derived, ecdhe_shared)
        th = self.transcript.digest()
        c_hs = hkdf_expand_label(self.handshake_secret, b"c hs traffic", th, 32)
        s_hs = hkdf_expand_label(self.handshake_secret, b"s hs traffic", th, 32)
        return c_hs, s_hs

    def derive_early_traffic(self, psk_bytes):
        self.early_secret = hkdf_extract(b"\x00" * 32, psk_bytes)
        th = self.transcript.digest()
        return hkdf_expand_label(self.early_secret, b"c e traffic", th, 32)
```

### javascript
```javascript
class Tls13Handshake {
  constructor(role, transcriptHash) {
    this.role = role;
    this.transcript = transcriptHash;
    this.earlySecret = null;
    this.handshakeSecret = null;
  }

  clientHello(psk = null) {
    const ch = {
      cipherSuites: [0x1301, 0x1303],
      supportedGroups: [0x001d, 0x0017],
      keyShare: [{ group: 0x001d, pubkey: x25519Keygen().pub }],
      signatureAlgorithms: [0x0403, 0x0804],
      preSharedKey: psk ? { ids: [psk.identity], binders: [psk.binder()] } : null,
    };
    this.transcript.update(serialize(ch));
    return ch;
  }

  deriveHandshakeKeys(pskBytes, ecdheShared) {
    const zero = new Uint8Array(32);
    this.earlySecret = hkdfExtract(zero, pskBytes || zero);
    const derived = hkdfExpandLabel(this.earlySecret, 'derived', sha256(''), 32);
    this.handshakeSecret = hkdfExtract(derived, ecdheShared);
    const th = this.transcript.digest();
    return {
      cHs: hkdfExpandLabel(this.handshakeSecret, 'c hs traffic', th, 32),
      sHs: hkdfExpandLabel(this.handshakeSecret, 's hs traffic', th, 32),
    };
  }

  deriveEarlyTraffic(pskBytes) {
    this.earlySecret = hkdfExtract(new Uint8Array(32), pskBytes);
    return hkdfExpandLabel(this.earlySecret, 'c e traffic',
                           this.transcript.digest(), 32);
  }
}
```

### java
```java
class Tls13Handshake {
    enum Role { CLIENT, SERVER }
    final Role role;
    final MessageDigest transcript;
    byte[] earlySecret, handshakeSecret;

    Tls13Handshake(Role role) throws Exception {
        this.role = role;
        this.transcript = MessageDigest.getInstance("SHA-256");
    }

    ClientHello buildClientHello(PreSharedKey psk) {
        ClientHello ch = new ClientHello(
            List.of(TLS_AES_128_GCM_SHA256, TLS_CHACHA20_POLY1305_SHA256),
            List.of(X25519, SECP256R1),
            List.of(new KeyShareEntry(X25519, X25519.keygen().pub())),
            List.of(ECDSA_SECP256R1_SHA256, RSA_PSS_RSAE_SHA256),
            psk
        );
        transcript.update(ch.serialize());
        return ch;
    }

    HandshakeKeys deriveHandshakeKeys(byte[] pskBytes, byte[] ecdheShared) {
        byte[] zero = new byte[32];
        earlySecret = Hkdf.extract(zero, pskBytes != null ? pskBytes : zero);
        byte[] derived = Hkdf.expandLabel(earlySecret, "derived",
                                          MessageDigest.getInstance("SHA-256")
                                              .digest(new byte[0]), 32);
        handshakeSecret = Hkdf.extract(derived, ecdheShared);
        byte[] th = transcript.digest();
        return new HandshakeKeys(
            Hkdf.expandLabel(handshakeSecret, "c hs traffic", th, 32),
            Hkdf.expandLabel(handshakeSecret, "s hs traffic", th, 32));
    }
}
```

### cpp
```cpp
struct Tls13Handshake {
    enum class Role { Client, Server };
    Role role;
    Sha256 transcript;
    std::array<uint8_t,32> early_secret{}, handshake_secret{};

    ClientHello build_client_hello(const PreSharedKey* psk) {
        ClientHello ch{
            .cipher_suites    = {0x1301, 0x1303},
            .supported_groups = {0x001d, 0x0017},
            .key_share        = { KeyShareEntry{0x001d, x25519::keygen().pub} },
            .sig_algs         = {0x0403, 0x0804},
            .psk              = psk ? std::optional{*psk} : std::nullopt,
        };
        transcript.update(ch.serialize());
        return ch;
    }

    HandshakeKeys derive_handshake_keys(std::span<const uint8_t> psk_bytes,
                                        std::span<const uint8_t> ecdhe_shared) {
        std::array<uint8_t,32> zero{};
        early_secret = hkdf_extract(zero,
            psk_bytes.empty() ? std::span<const uint8_t>(zero) : psk_bytes);
        auto derived = hkdf_expand_label(early_secret, "derived",
                                         Sha256::of(""), 32);
        handshake_secret = hkdf_extract(derived, ecdhe_shared);
        auto th = transcript.digest();
        return {
            hkdf_expand_label(handshake_secret, "c hs traffic", th, 32),
            hkdf_expand_label(handshake_secret, "s hs traffic", th, 32)
        };
    }
};
```
