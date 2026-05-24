---
slug: secrets-management
module: system-design
title: Secrets Management
subtitle: Vault, KMS, sealed-secrets — rotation, least privilege, audit, dynamic credentials.
difficulty: Intermediate
position: 66
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "AWS Builders' Library — Securing the Software Supply Chain"
    url: "https://aws.amazon.com/builders-library"
    type: blog
  - title: "Martin Fowler — Secrets Storage Pattern"
    url: "https://martinfowler.com/articles/CD4ML.html"
    type: book
  - title: "hashicorp/vault"
    url: "https://github.com/hashicorp/vault"
    type: repo
status: published
---

## intro
A **secret** is any string whose disclosure compromises a system — DB passwords, API keys, signing keys, TLS private keys. Naive storage (env vars in .env files, k8s Secrets base64-encoded in git) is how breaches happen. Good practice: central encrypted store (Vault, AWS Secrets Manager, GCP Secret Manager), fine-grained access policy, **rotation**, audit log, and increasingly **dynamic credentials**.

## whyItMatters
Static secrets baked into images live forever. They get logged, screenshotted, committed, copied to laptops, leaked via Sentry. Compromise = silent persistent access. Rotated dynamic secrets caps blast radius to the rotation window (often <1h).

## intuition
**Three storage tiers**:
1. **KMS** (AWS KMS, GCP KMS, Azure Key Vault) — manages encryption keys. You never see the key; you call `Encrypt(plaintext)` / `Decrypt(ciphertext)`. Hardware-backed (HSM).
2. **Secrets store** (Vault, Secrets Manager) — stores arbitrary secrets, encrypts them with a KMS-managed key, gates access via policy, audits every read.
3. **Distribution** to workloads — injected via sidecar (Vault Agent), CSI driver (Secrets Store CSI), IAM-based (IRSA pulls Secrets Manager), or projected volume.

**Dynamic credentials** (Vault killer feature): instead of a static DB password, Vault calls `CREATE USER svc_billing_x WITH PASSWORD '...'` on first request, hands the workload a 1-hour credential, and `DROP USER` at TTL. Each pod gets its OWN credential — perfect audit + revocation.

**Sealed secrets** (Bitnami Sealed Secrets) — encrypt the secret with a cluster-side public key; ciphertext is safe to commit to git; the in-cluster controller decrypts to a real k8s Secret. Lets you do GitOps without leaking.

## visualization
```
Source of truth        Encryption boundary       Workload
+----------------+     +----------------+        +--------------+
| Vault / AWS SM | --> | KMS (HSM)      |        | pod: env or  |
| policy + audit |     | rotates DEK    |        | file mount   |
+--------+-------+     +----------------+        +------^-------+
         |                                              |
         | static or DYNAMIC creds (TTL=1h)             |
         +----------------------------------------------+

GitOps (Sealed Secrets):
  plain.yaml --> kubeseal --> sealed.yaml (safe in git)
                                  |
                                  v
                       controller (private key) --> Secret in cluster
```

Rotation cadence:
```
KMS root key    : never (KMS rotates DEK automatically)
TLS leaf cert   : 1h - 24h
DB password     : 1h - 7d (dynamic) OR 90d (static + scheduled)
API integration : 30 - 90d
Signing key     : yearly with overlap
```

## bruteForce
**.env files committed**: every dev's laptop = secret. Rotation = chase 50 laptops.

**Plain k8s Secrets** (base64 != encryption): anyone with `get secrets` reads them in clear. Etcd at rest unencrypted by default.

**One IAM key per service shared across pods**: can't tell which pod leaked it.

## optimal
**Architecture**:
- Vault (or AWS Secrets Manager) as source of truth, sealed by KMS root.
- IAM roles for service accounts (IRSA / Workload Identity) so pods authenticate WITHOUT a long-lived key.
- Vault Agent / CSI mounts secrets at `/run/secrets/db_password`; app reads the file.
- Dynamic DB credentials for sensitive services.
- Audit log shipped to SIEM with retention 1y+.

**Least privilege**:
- Each service has its own role / policy: `path "database/creds/billing-ro" { capabilities = ["read"] }`.
- No `path "*"` policies. Ever.

**Rotation**:
- KMS keys: automatic rotation enabled.
- Static secrets: scheduled rotator (Lambda) updates Vault + downstream.
- Dynamic: Vault handles end-to-end.

**Detection**:
- Trufflehog / gitleaks pre-commit + CI.
- GitHub Push Protection on for the org.
- CloudTrail / Vault audit alerts on anomalous read patterns.

## complexity
- **Read latency**: cache locally with TTL ~30s; never block hot path on Vault.
- **Vault HA**: Raft 3-5 nodes; 1 leader handles writes, followers read.
- **Cost**: AWS Secrets Manager $0.40/secret/mo + $0.05/10k reads. Cheap until you have 50k secrets.

## pitfalls
- **Logging secrets**: app logs full request body including `Authorization: Bearer ...`. Scrub.
- **Image layers**: `COPY .env` -> baked into image forever, visible via `docker history`.
- **Long TTL on cached secret**: rotation happens, your cache still serves old creds -> auth failures everywhere.
- **No break-glass procedure**: Vault is down; how do you ssh in? Document an offline-sealed root key path.
- **Treating sealed-secrets as a vault**: it's good for GitOps; it does NOT rotate, audit, or expire. Use only as a delivery mechanism.
- **Hardcoded encryption keys in code**: defeats the point. Pull from KMS at startup.

## interviewTips
- Differentiate **KMS** (key management) vs **Secrets Manager** (secret storage) — they layer.
- Lead with **dynamic credentials** as the modern best practice.
- Mention **IRSA / Workload Identity** so pods don't carry static AWS keys.
- For "design secrets system" — central store + KMS-sealed + per-service policy + audit + rotation + leak detection.

## code.python
```python
import boto3, json, time
_cache = {}
def get_secret(name, ttl=30):
    now = time.time()
    if name in _cache and _cache[name][1] > now:
        return _cache[name][0]
    sm = boto3.client('secretsmanager')
    raw = sm.get_secret_value(SecretId=name)['SecretString']
    val = json.loads(raw)
    _cache[name] = (val, now + ttl)
    return val
```

## code.javascript
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const sm = new SecretsManagerClient({});
const cache = new Map();
async function getSecret(name, ttl = 30) {
  const hit = cache.get(name);
  if (hit && hit.exp > Date.now()) return hit.val;
  const r = await sm.send(new GetSecretValueCommand({ SecretId: name }));
  const val = JSON.parse(r.SecretString);
  cache.set(name, { val, exp: Date.now() + ttl * 1000 });
  return val;
}
```

## code.java
```java
import software.amazon.awssdk.services.secretsmanager.*;
import software.amazon.awssdk.services.secretsmanager.model.*;
SecretsManagerClient sm = SecretsManagerClient.create();
String getSecret(String id) {
    GetSecretValueResponse r = sm.getSecretValue(b -> b.secretId(id));
    return r.secretString();
}
```

## code.cpp
```cpp
// AWS SDK for C++
// Aws::SecretsManager::SecretsManagerClient client;
// Aws::SecretsManager::Model::GetSecretValueRequest req;
// req.SetSecretId("db_password");
// auto out = client.GetSecretValue(req);
// std::string secret = out.GetResult().GetSecretString();
```
