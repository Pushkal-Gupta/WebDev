---
slug: sigv4-aws-signing
module: system-design
title: AWS Signature V4
subtitle: How every AWS request is signed — canonical request, string-to-sign, derived signing key.
difficulty: Advanced
position: 67
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "AWS Builders' Library — Identity"
    url: "https://aws.amazon.com/builders-library"
    type: blog
  - title: "Designing Data-Intensive Applications — Kleppmann"
    url: "https://dataintensive.net"
    type: book
  - title: "aws/aws-cli"
    url: "https://github.com/aws/aws-cli"
    type: repo
status: published
---

## intro
**SigV4** is the request-signing scheme AWS uses on (almost) every API. Instead of sending the secret key over the wire, the client uses it to derive a per-request signing key, hashes a canonicalized version of the request, and sends only the resulting signature. The server replays the same derivation and compares. Replay-safe (timestamp + nonce window), tamper-evident (any byte change breaks the hash), key-rotation-friendly.

## whyItMatters
Bearer tokens leak from logs, proxies, breadcrumbs. SigV4 transmits only a per-request signature — the long-lived secret never goes on the wire. The same scheme protects S3 presigned URLs (sharable short-lived links) and underpins IAM roles, IRSA, and Cognito-backed API Gateway.

## intuition
Five-step derivation:

1. **Canonical Request**: deterministic stringification of method + URI + sorted query + sorted headers + body hash.
2. **String-to-Sign**: `AWS4-HMAC-SHA256\n<timestamp>\n<scope>\nSHA256(canonicalRequest)`.
3. **Signing Key**: chain of HMACs derives a key scoped to date + region + service:
   `kDate = HMAC(\"AWS4\"+secret, date)`
   `kRegion = HMAC(kDate, region)`
   `kService = HMAC(kRegion, service)`
   `kSigning = HMAC(kService, \"aws4_request\")`
4. **Signature**: `hex(HMAC(kSigning, stringToSign))`.
5. **Authorization header**: `AWS4-HMAC-SHA256 Credential=<AKID>/<scope>, SignedHeaders=<list>, Signature=<sig>`.

**Replay protection**: requests must be within ~5 min (default) of the `X-Amz-Date` header. Outside that window, server rejects.

**Scope key** (`20260524/us-east-1/s3/aws4_request`) ties the signing key to a single day, region, service — limits blast radius if a derived key ever leaked.

**Presigned URLs** put all signing material into query params (`X-Amz-Algorithm`, `X-Amz-Credential`, `X-Amz-Date`, `X-Amz-Expires`, `X-Amz-SignedHeaders`, `X-Amz-Signature`) — a self-contained short-lived capability URL.

## visualization
```
Inputs                            Derivation                       Output
+------------+                  +------------------+               +-----------+
| AKID       |                  | kDate = HMAC(    |               |           |
| Secret     | ---------------> | "AWS4"+secret,   |               | Signing   |
| Date       |                  |  date)           |               | Key       |
| Region     |                  | kRegion=HMAC(... |               |           |
| Service    |                  | kService=HMAC(...|               +-----+-----+
+------------+                  | kSigning=HMAC(...|                     |
                                +------------------+                     v
+------------+                                                 +------------------+
| Method     |                  +------------------+           | hex(HMAC(        |
| URI        |  --canonical-->  | CanonicalRequest |           |  kSigning,       |
| Query      |                  | SHA256 ->        | --STS-->  |  stringToSign))  |
| Headers    |                  | StringToSign     |           +------------------+
| Body hash  |                  +------------------+                     |
+------------+                                                           v
                                                          Authorization: AWS4-HMAC-SHA256
                                                          Credential=AKID/date/region/svc/aws4_request,
                                                          SignedHeaders=host;x-amz-date,
                                                          Signature=<sig>
```

## bruteForce
**Bearer token of the secret**: shipping the raw access key as `Authorization: <secret>`. Any intermediate proxy / log captures it forever.

**Static per-day signatures**: no canonical request hash means anyone who sees one signature can replay forever on different URIs.

**No timestamp window**: replays days later still validate.

## optimal
**Use the official SDK**. The algorithm is fiddly enough that hand-rolling is a footgun; every SDK has been hardened over years. Only implement SigV4 yourself for:
- Embedded / IoT devices not covered by SDKs.
- Custom proxies / sidecars that need to re-sign.
- Generating presigned URLs in unusual languages.

**Hardening**:
- Use **temporary credentials** (STS AssumeRole) — short-lived AKID/SECRET/SESSION_TOKEN.
- Add `X-Amz-Security-Token` header when using session creds.
- Set `X-Amz-Date` to actual UTC time (not local); clock skew is the #1 failure mode.

**Presigned URL hygiene**:
- Use minimum expiry (`X-Amz-Expires=300` = 5 min).
- Bind to caller's IP via condition if possible.
- Never include them in HTML history / logs.

## complexity
- Signing: 5 HMAC operations per request — microseconds.
- Server-side verification: same 5 HMACs + canonical request hash. Negligible.
- Replay window check is O(1).

## pitfalls
- **Clock skew**: host clock drifts >5 min -> `SignatureDoesNotMatch`. Run NTP.
- **Trailing slashes / case** in canonical URI: any byte mismatch breaks the hash.
- **Forgetting to hash empty body**: empty payload hash is `SHA256("")` (a specific 64-hex constant). Many libraries handle this; rolled-your-own often doesn't.
- **Signing `Authorization` header** (you don't — that's the OUTPUT).
- **Wrong `SignedHeaders` list**: must be lowercase, semicolon-separated, sorted.
- **Re-signing on retry without bumping the date**: still works within the 5-min window; outside it, signature invalid.

## interviewTips
- For "how does AWS auth work" — name the derivation chain (kDate -> kRegion -> kService -> kSigning).
- Mention **scope keys** as the reason a leaked daily key is bounded.
- Discuss **presigned URLs** as a SigV4 application (file uploads, sharable links).
- Senior: contrast SigV4 vs OAuth bearer tokens vs mTLS — different threat models, different ergonomics.

## code.python
```python
import hmac, hashlib, datetime, urllib.parse
def _sign(key, msg): return hmac.new(key, msg.encode(), hashlib.sha256).digest()
def signing_key(secret, date, region, service):
    k = _sign(('AWS4' + secret).encode(), date)
    k = _sign(k, region)
    k = _sign(k, service)
    return _sign(k, 'aws4_request')

def sigv4(method, host, path, query, headers, body, akid, secret, region, service):
    now = datetime.datetime.utcnow()
    amz_date = now.strftime('%Y%m%dT%H%M%SZ')
    date = now.strftime('%Y%m%d')
    headers = {**headers, 'host': host, 'x-amz-date': amz_date}
    signed = ';'.join(sorted(h.lower() for h in headers))
    canonical_headers = ''.join(f'{h}:{headers[h].strip()}\n' for h in sorted(headers, key=str.lower))
    payload_hash = hashlib.sha256(body).hexdigest()
    canonical = '\n'.join([method, path, urllib.parse.urlencode(sorted(query.items())),
                           canonical_headers, signed, payload_hash])
    scope = f'{date}/{region}/{service}/aws4_request'
    sts = '\n'.join(['AWS4-HMAC-SHA256', amz_date, scope, hashlib.sha256(canonical.encode()).hexdigest()])
    sig = hmac.new(signing_key(secret, date, region, service), sts.encode(), hashlib.sha256).hexdigest()
    return f'AWS4-HMAC-SHA256 Credential={akid}/{scope}, SignedHeaders={signed}, Signature={sig}'
```

## code.javascript
```javascript
const crypto = require('crypto');
const hmac = (key, msg) => crypto.createHmac('sha256', key).update(msg).digest();
function signingKey(secret, date, region, service) {
  const kDate = hmac('AWS4' + secret, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}
```

## code.java
```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
static byte[] hmac(byte[] key, String msg) throws Exception {
    Mac m = Mac.getInstance("HmacSHA256");
    m.init(new SecretKeySpec(key, "HmacSHA256"));
    return m.doFinal(msg.getBytes("UTF-8"));
}
static byte[] signingKey(String secret, String date, String region, String service) throws Exception {
    byte[] k = hmac(("AWS4" + secret).getBytes("UTF-8"), date);
    k = hmac(k, region);
    k = hmac(k, service);
    return hmac(k, "aws4_request");
}
```

## code.cpp
```cpp
// OpenSSL HMAC_SHA256 chain
// auto kDate    = hmac_sha256("AWS4"+secret, date);
// auto kRegion  = hmac_sha256(kDate, region);
// auto kService = hmac_sha256(kRegion, service);
// auto kSigning = hmac_sha256(kService, "aws4_request");
// auto sig      = hex(hmac_sha256(kSigning, stringToSign));
```
