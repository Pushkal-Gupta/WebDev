---
slug: secrets-rotation
module: sd-auth-security
title: Secrets Rotation
subtitle: Automated periodic key/credential rotation — short-lived tokens beat long-lived secrets. Vault / KMS / cloud IAM patterns.
difficulty: Intermediate
position: 58
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "HashiCorp Vault docs — secret rotation"
    url: "https://developer.hashicorp.com/vault/docs"
    type: book
  - title: "AWS — IAM credential lifecycle"
    url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html"
    type: blog
  - title: "hashicorp/vault"
    url: "https://github.com/hashicorp/vault"
    type: repo
status: published
---

## intro
A static long-lived secret (a DB password set 3 years ago) is a perpetual leak risk. **Secrets rotation** replaces each secret periodically — daily / weekly / on-personnel-change — so a leaked secret has bounded blast radius. Modern systems prefer **short-lived dynamic credentials** (issued on demand, expire in minutes to hours) over long-lived rotation cycles.

## whyItMatters
- **Compliance** (SOC 2, PCI, HIPAA) mandates periodic rotation.
- **Personnel turnover**: employee leaves → their credentials should immediately stop working.
- **Repo leaks**: a key committed to GitHub yesterday should be useless tomorrow.
- **Breach containment**: even if attacker exfiltrates secrets, they expire fast.

Static secret rotation = the floor. Dynamic short-lived credentials = the ceiling.

## intuition
**Static rotation** (manual or scheduled):
1. Generate new secret.
2. Deploy new secret to app config.
3. Update upstream (DB / API).
4. Revoke old secret after soak period.

Problem: race conditions during the swap. Old app instance reads new DB password (mismatch) OR new app reads with old password.

**Dynamic credentials** (Vault, AWS STS):
1. App authenticates to secret store via stable identity (k8s service account, IAM role).
2. Secret store issues a short-lived credential (1h-24h TTL).
3. App uses it; renews before expiry.
4. Compromised credential expires automatically.

No race; secrets never live in config files.

## visualization
```
Static rotation (manual):
  Week N:    app uses password v1 (in env var)
  Week N+1:  rotate: generate v2, deploy app, update DB, revoke v1
             (race window during the swap — both passwords must work briefly)

Dynamic (Vault example):
  App startup → Vault: "I am pod xyz, give me DB creds"
  Vault: creates user_xyz_2024_01_15_14_30 with random password, TTL=1h
        returns to app
  App connects to DB as user_xyz_..., uses for 1h
  Before TTL expiry, app renews lease → new TTL
  If app crashes: Vault revokes lease after grace period
  After 1h: user_xyz_... dropped automatically
```

## bruteForce
**Long-lived secret in env var**: dies with the next breach.

**Manual quarterly rotation**: fragile, often skipped, leaves long blast-radius window.

**Hardcoded in code**: GitHub secret-scanning auto-detects, but damage may be done before alert.

## optimal
**Vault dynamic secrets** (most flexible):
- Database engine: Vault creates DB user on demand, returns to app, drops user after TTL.
- AWS engine: Vault returns STS credentials (1h TTL).
- PKI engine: short-lived TLS certs.
- Transit engine: encryption-as-a-service (key never leaves Vault).

**AWS IAM roles** (no Vault needed in AWS-native shops):
- EC2 instance profile / EKS service account → STS issues temporary credentials.
- App never sees the underlying key.
- Auto-rotates on every metadata-service hit.

**GitHub OIDC** for CI:
- GitHub Actions exchanges OIDC token for cloud credentials.
- No long-lived `AWS_SECRET_ACCESS_KEY` in repo secrets.

**Sealed Secrets / SOPS** (encrypted at rest in git):
- Secrets stored encrypted in git repo, decrypted at deploy time.
- Rotation = update encrypted value + redeploy.

## complexity
- **Setup**: high — Vault cluster + auth methods + policies.
- **Operational**: ongoing — monitor lease expiration, plan grace periods.
- **App overhead**: token renewal heartbeat (~every 30 min for 1h TTL).

## pitfalls
- **Forgetting to renew lease**: app holds credential past TTL → DB rejects connection → outage. Use Vault Agent sidecar to handle renewal.
- **Hard cutoff with no overlap window**: brief outage during rotation. Always overlap.
- **Service account with too-broad permissions**: rotation doesn't help — the access pattern is the leak. Tighten scope first.
- **Storing the rotation secret unencrypted in CI**: chicken-and-egg. Use cloud-provider-native auth (GitHub OIDC, GCP Workload Identity).
- **Rotation breaks long-running batch jobs**: jobs running for hours may straddle a rotation. Plan timing or use dynamic creds with generous TTL.

## interviewTips
- For "how do you manage production secrets" → Vault dynamic creds OR cloud IAM roles, never static long-lived.
- Mention **OIDC for CI/CD** as the modern way to avoid stored CI secrets.
- For senior interviews, discuss **lease renewal**, **graceful credential rotation** under load, **break-glass procedures**.

## code.python
```python
# Vault Python SDK
import hvac
client = hvac.Client(url='https://vault:8200', token=os.environ['VAULT_TOKEN'])
# Get dynamic DB credentials
creds = client.secrets.database.generate_credentials(name='my-app-role')
db_user = creds['data']['username']
db_pass = creds['data']['password']
lease_id = creds['lease_id']

# Renew before expiry (every 30 min for 1h lease)
import threading, time
def renew_loop():
    while True:
        time.sleep(30 * 60)
        client.sys.renew_lease(lease_id=lease_id)
threading.Thread(target=renew_loop, daemon=True).start()
```

## code.javascript
```javascript
// node-vault — dynamic AWS credentials
const vault = require('node-vault')({ endpoint: 'https://vault:8200', token: process.env.VAULT_TOKEN });
const { data, lease_id } = await vault.read('aws/creds/s3-uploader');
const aws = new AWS.S3({ accessKeyId: data.access_key, secretAccessKey: data.secret_key });
setInterval(() => vault.renew({ lease_id }), 30 * 60 * 1000);
```

## code.java
```java
// Spring Cloud Vault
@Component
class DbCredentials {
    @Value("${spring.datasource.username}")  // resolved at startup from Vault
    private String username;
    @Value("${spring.datasource.password}")
    private String password;
    // Spring Cloud Vault handles renewal automatically.
}
```

## code.cpp
```cpp
// libvault C++ client (community-maintained) or use the HTTP REST API directly via libcurl
// CURL* curl; curl_easy_setopt(curl, CURLOPT_URL, "https://vault:8200/v1/database/creds/my-role");
// curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers_with_X_Vault_Token);
```
