---
slug: sec-secrets-keys
module: web-security
title: Secrets & API Key Management
subtitle: Why hardcoded keys and committed .env files leak, what separates a publishable key from a secret one, and the rotate-migrate-revoke drill that contains a compromised credential before it drains your database.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "OWASP — Secrets Management Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"
    type: article
  - title: "OWASP — Key Management Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html"
    type: article
  - title: "MDN — Environment variables"
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework"
    type: article
  - title: "GitHub Docs — About secret scanning"
    url: "https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning"
    type: article
status: published
---

## intro
A secret is any credential that proves your application is who it says it is — a database password, an API key, a signing token, a cloud service-account key. The whole point of a secret is that it grants power to whoever holds it, which means the security question is not "is my code correct" but "who can read this string." Secrets leak in mundane ways: a key hardcoded in source and pushed to a public repo, a `.env` file committed because it was never gitignored, a token printed into a build log, a service key shipped in a client bundle a user can view. This lesson covers where secrets belong (out of code, in environment variables and secret managers), the critical difference between a publishable key and a secret key, why a leaked server-side key is catastrophic, and the exact drill — rotate, migrate, revoke — you run the moment one gets out.

## whyItMatters
A leaked secret is not a vulnerability an attacker has to exploit through a clever chain — it is a working credential they can use immediately. Public code hosts are scraped continuously by bots that harvest committed keys within minutes of a push; a cloud key pasted into a public repo can be spun up into a crypto-mining fleet before you finish your coffee, leaving you the bill. Worse than money is access: a leaked backend database key or service-role credential typically **bypasses your row-level security entirely** and reads or writes every user's data, because those keys are designed to act as the trusted server, not as a scoped user. Once a secret is in a git history, deleting the line does nothing — it lives in every clone and every fork forever, so the only real remedy is to invalidate the credential itself. Getting secrets management right is cheap and mechanical; getting it wrong turns one careless commit into a full data breach with no exploit required.

## intuition
The core idea is a separation between **code**, which you share, and **secrets**, which you must not. Code goes in git, gets reviewed, ships to every developer and often to the public. A secret must never take that journey, because git is designed to *remember and distribute* — exactly the wrong properties for a credential. So the mental model is: configuration that changes per environment and must stay private lives **outside the code**, injected at runtime through environment variables or a dedicated secret manager, and is read with something like `process.env.API_KEY`. The code references the *name* of the secret; the *value* is supplied by the deployment platform and never touches the repository.

The second key distinction is **publishable versus secret keys**, and conflating them is a common, expensive mistake. Many services issue two kinds. A *publishable* (or "anon", or "public") key is designed to sit in client-side code where anyone can read it — it identifies your project and is intentionally limited: it can only do what your access rules (like row-level security) explicitly allow that anonymous, untrusted context to do. A *secret* (or "service", or "service-role") key is the opposite: it is meant to live only on a server you control, and it typically has elevated power that *bypasses* those same access rules. Shipping a publishable key to the browser is fine and expected. Shipping a secret key to the browser is a catastrophe, because you have handed every visitor a credential that ignores your security rules and can read the whole database.

The last piece of intuition is that leaks are inevitable, so you plan for containment, not just prevention. A secret has no "undo" once exposed — you cannot un-see a string. What you *can* do is make the exposed string worthless by issuing a new one and turning the old one off. That is why rotation exists as a first-class operation: the value of a secret is only as good as your ability to replace it quickly. Design assuming any given key will eventually leak, and the response becomes a calm, rehearsed drill instead of an emergency.

## visualization
```
  WHERE A SECRET CAN LIVE            READABLE BY          VERDICT
  --------------------------------   ------------------   -----------------
  hardcoded in source, pushed        everyone w/ repo     LEAK (bots scrape)
  .env committed (not gitignored)    everyone w/ repo     LEAK (in history)
  shipped in client JS bundle        every site visitor   LEAK (view source)
  printed into a build/CI log        anyone w/ log access LEAK
  --------------------------------   ------------------   -----------------
  env var / secret manager (server)  the server process   SAFE

  KEY TYPES
  publishable / anon  -> browser OK   (limited by RLS, untrusted context)
  secret / service    -> SERVER ONLY  (bypasses RLS, full data access)

  ON LEAK, run in order:  ROTATE new key  ->  MIGRATE apps  ->  REVOKE old
                          (both valid)        (switch over)     (old = dead)
```

## bruteForce
The naive approach is to just paste the key where it is needed — a string literal in the config file, a constant at the top of the module — and get the feature working. It is the path of least resistance and it "works" in the sense that the app runs. It is also how the overwhelming majority of real breaches start. A hardcoded secret is copied everywhere the file goes: into every developer's clone, into the CI system, into the git history permanently, and, the moment the repo is public or is later open-sourced, into the hands of every scraper on the internet. A close cousin is deleting the leaked line and committing the "fix" — which changes nothing, because the secret is preserved in the commit history and in every existing clone and fork. Editing or force-pushing history is unreliable and cannot reach copies others already pulled. Treating the code as the place to *store* or *scrub* a secret misunderstands the problem: once a value has been distributed, the only trustworthy action is to make that value stop working.

## optimal
The correct model keeps secrets **out of code entirely** and plans for their inevitable exposure with a rehearsed containment drill.

**Store secrets outside the repository.** Read them from environment variables (`process.env.X`, `os.environ["X"]`) that the deployment platform injects at runtime, or from a dedicated secret manager (Vault, AWS/GCP Secrets Manager, your host's encrypted config). Locally, keep values in a `.env` file that is **gitignored before the first commit** — add `.env` to `.gitignore` on day one — and commit a `.env.example` with the *names* and dummy values so teammates know what to set. The repository holds the shape of the configuration; never the values.

**Respect the publishable/secret split.** Only ever ship publishable/anon keys to the browser, and lean on your access rules (row-level security, scoped permissions) to keep that untrusted context safe. Keep secret/service keys strictly server-side — in edge functions, backend routes, or workers — and never import them into client code, since anything bundled to the browser is readable by every visitor.

**Detect leaks automatically.** Turn on **secret scanning** (GitHub secret scanning / push protection, or tools like gitleaks or trufflehog in CI) so a committed key is caught — ideally *blocked at push time* — instead of discovered after a breach. Add a pre-commit hook as a second net.

**Rehearse the response: rotate, migrate, revoke.** The instant a secret is exposed, assume it is compromised and run the drill in order. **Rotate** — issue a brand-new key while the old one is still live, so both work briefly and nothing goes down. **Migrate** — update every service, function, and environment to use the new key and confirm traffic has moved over. **Revoke** — only now disable the old key; from this moment the leaked value is dead and any request using it fails. Doing it in that sequence gives you zero-downtime containment; revoking *first* would break production, and rotating *last* would leave the attacker a working key. Rotate on a schedule too, not only after incidents — regular rotation shrinks the window any single leaked key is useful. Finally, follow **least privilege**: scope each key to the narrowest permissions it needs so that even a leaked one is limited in blast radius.

## complexity
time: Reading a secret from an environment variable or a cached secret-manager lookup is `O(1)` at startup, effectively free on the request path. The rotate-migrate-revoke drill is operational time, not runtime — minutes of a rollout, run rarely.
space: `O(1)` — a handful of environment entries per process, or a small set of versioned secrets in a manager. A `.env.example` and a scanning config add a few lines to the repo, once.
notes: The economics are lopsided. Externalizing secrets and enabling scanning cost a one-time setup and near-zero runtime overhead; a single leaked service key costs the entire database and, often, the cloud bill. There is no performance reason to hardcode — the safe path is also the free path.

## pitfalls
- **Committing a `.env` file because it was never gitignored.** Once it lands in a commit, the secrets live in history and in every clone forever. Fix: add `.env` (and `*.env.local`) to `.gitignore` before the first commit, ship a value-free `.env.example`, and enable push protection so a slip is blocked at push time, not after.
- **Shipping a secret/service key to the browser.** A key that bypasses row-level security in client code hands every visitor full database access via view-source. Fix: send only publishable/anon keys to the client, keep service keys strictly server-side (edge functions, backend routes), and audit client bundles for any high-privilege key.
- **"Fixing" a leak by deleting the line and committing.** The secret remains in git history and in every existing clone and fork; the credential is still valid. Fix: treat the value as burned — rotate to a new key, migrate all consumers, then revoke the old one; scrubbing history is secondary and unreliable.
- **Revoking before migrating (or never rotating).** Killing the old key first takes production down; never rotating leaves an attacker a working credential indefinitely. Fix: always rotate -> migrate -> revoke in that order for zero-downtime containment, and rotate on a schedule to shrink each key's useful lifetime.
- **Over-privileged keys with no scoping.** A single all-powerful key turns any leak into total compromise. Fix: apply least privilege — scope keys to the minimum permissions and resources they need, separate read from write, and prefer short-lived tokens over long-lived static keys.

## interviewTips
- Open with the separation principle: code is shared and remembered (git), secrets must be neither — so secrets live in environment variables or a secret manager and are injected at runtime, with `.env` gitignored from commit one. State plainly that deleting a committed secret does *not* fix it because history retains it, so the real fix is invalidating the value.
- Nail the publishable-versus-secret distinction and *why* it matters: a publishable/anon key is safe in the browser because it is limited by row-level security, while a secret/service key bypasses those rules and must stay server-side — shipping the latter to the client is full database compromise. Interviewers listen for whether you understand the privilege difference, not just "keep keys secret."
- Walk the incident drill in the right order — rotate, migrate, revoke — and explain the ordering: rotate first so both keys work, migrate every consumer, revoke last so there is no downtime and no lingering valid key. Bonus points for adding secret scanning / push protection as prevention and least privilege plus scheduled rotation as blast-radius reduction.

## keyTakeaways
- Secrets are credentials, not code: keep them out of the repository entirely — in environment variables or a secret manager, with `.env` gitignored before the first commit — because git remembers and distributes, and a committed secret lives in history and every clone forever.
- A publishable/anon key is meant for the browser and is bounded by row-level security; a secret/service key bypasses those rules and must stay server-side. A leaked service key is catastrophic precisely because it grants full data access with no exploit required.
- Plan for leaks with containment: enable secret scanning to catch them, and on exposure run rotate -> migrate -> revoke in that order for zero-downtime invalidation, backed by least-privilege scoping and scheduled rotation to shrink every key's blast radius.

## code.javascript
```javascript
// VULNERABLE: the key is hardcoded in source. Once this file is committed,
// the secret is in git history, in every clone, and — if the repo is ever
// public — harvested by scrapers within minutes. Deleting the line later
// does NOT help; the value stays in history.
const SERVICE_KEY = 'sk_example_do_not_do_this_1234567890'; // leaked on commit

async function fetchAllUsers() {
  return db.connect(SERVICE_KEY).from('users').selectAll();
}

// FIX 1 — read the secret from an environment variable the platform injects
// at runtime. The repo holds the NAME; the value never touches source.
// Locally the value lives in a gitignored .env; commit a .env.example instead.
const serviceKey = process.env.SERVICE_KEY;
if (!serviceKey) throw new Error('SERVICE_KEY is not set');

async function fetchAllUsersSafe() {
  return db.connect(serviceKey).from('users').selectAll();
}

// FIX 2 — respect the publishable/secret split. Only the publishable (anon)
// key is safe to send to the browser; it is bounded by row-level security.
// The service key, which BYPASSES those rules, must stay server-side only.
// client bundle — OK: limited, RLS-scoped, untrusted context
export const PUBLISHABLE_KEY = import.meta.env.VITE_PUBLISHABLE_KEY;

// server only (edge function / backend) — NEVER import into client code
// const serviceKey = process.env.SERVICE_KEY; // full access, bypasses RLS

// FIX 3 — the leak drill: rotate -> migrate -> revoke. Keep both keys valid
// while consumers switch over, then disable the old one last (zero downtime).
async function rotateDrill(provider) {
  const newKey = await provider.issueKey();        // 1. ROTATE (old still live)
  await provider.updateAllConsumers(newKey);       // 2. MIGRATE every service
  await provider.confirmTrafficMovedTo(newKey);    //    verify switchover
  await provider.revokeKey(provider.oldKeyId);     // 3. REVOKE — old now dead
  return newKey;
}
```

## code.python
```python
# VULNERABLE: hardcoded secret. Committing this puts the key in git history
# permanently. A leaked service key bypasses row-level security and grants
# read/write to EVERY user's data — a full breach with no exploit needed.
import os

SERVICE_KEY = "sk_example_do_not_do_this_1234567890"  # leaked on commit


def fetch_all_users_unsafe(db):
    return db.connect(SERVICE_KEY).table("users").select_all()


# FIX 1 — read the secret from the environment at runtime. Keep the real
# value in a gitignored .env (add `.env` to .gitignore BEFORE the first
# commit) and check in a .env.example that lists names with dummy values.
def fetch_all_users_safe(db):
    service_key = os.environ.get("SERVICE_KEY")
    if not service_key:
        raise RuntimeError("SERVICE_KEY is not set")
    return db.connect(service_key).table("users").select_all()


# FIX 2 — the publishable/secret distinction. The publishable (anon) key is
# safe to expose to clients because access rules (RLS) constrain it. The
# service key must live ONLY on the server; it bypasses those rules.
PUBLISHABLE_KEY = os.environ.get("PUBLISHABLE_KEY")   # client-safe, RLS-bound
# SERVICE_KEY read above is server-only — never send it to a browser.


# FIX 3 — leak response drill, run in this exact order for zero downtime:
# rotate (issue new, old still valid) -> migrate (switch consumers) ->
# revoke (disable old). Revoking first would break prod; revoking last
# leaves no window where the leaked key still works.
def rotate_drill(provider):
    new_key = provider.issue_key()               # 1. ROTATE — old still live
    provider.update_all_consumers(new_key)       # 2. MIGRATE every service
    provider.confirm_traffic_moved_to(new_key)   #    verify switchover
    provider.revoke_key(provider.old_key_id)     # 3. REVOKE — leaked key dead
    return new_key
```
