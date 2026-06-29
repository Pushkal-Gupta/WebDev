# Self-hosting Judge0 — a developer's guide

PGcode runs **untrusted** code execution through **Judge0**: grading a live user's submission in
the Workspace, where the code could be anything and needs a sandbox. See
[`TEST_CASE_METHODOLOGY.md`](./TEST_CASE_METHODOLOGY.md).

> **Evolution note (2026-06-29).** The *offline* drives — generating/verifying test cases and
> mutation testing — no longer use Judge0. Because **we author every canonical and mutant
> ourselves**, the code isn't untrusted, so the sandbox adds only overhead. Those drives now run on
> the **host toolchain** via `scripts/local-grade.mjs` (python3 / node / javac / clang++) with a
> compile-once cache — far faster (C++ ~3.7 s → ~18 ms per case) and rate-limit-free. Set
> `LOCAL_EXEC=0` to route a drive back through Judge0. This guide remains the reference for the
> **sandboxed path** (untrusted user submissions) and for anyone who wants the drives sandboxed too.
> On Apple silicon, isolate needs cgroup v1 (`systemd.unified_cgroup_hierarchy=0` on the VM) and the
> amd64 image runs under emulation — the friction that motivated the local-exec default.

## Why self-host (instead of the public CE)

The public `ce.judge0.com` endpoint is **rate-limited**. That's fine for a handful of
interactive submissions, but the offline drives make *thousands* of calls:
- Growing one problem to an adequate suite = hundreds of submissions (each generated input is run through the oracle, then re-verified).
- Mutation testing one problem = (number of mutants) × (number of cases) submissions.
- Across ~4,500 problems that's millions of calls — utterly infeasible under a rate limit.

A **dedicated hosted key costs money per submission**. Self-hosting via Docker is **free and
unlimited** (you only pay in local CPU/RAM), so that's what we run. There is no behavioural
difference — same API, same language IDs, same grading — just no quota.

## Architecture

Judge0 is four containers wired by Docker Compose:

```
        ┌────────────┐   enqueue    ┌──────────┐   pulls jobs   ┌────────────┐
 HTTP → │  server    │ ───────────► │  redis   │ ◄───────────── │  workers   │  (sandboxed
 :2358  │ (Rails API)│              │  (queue) │                │ run code)  │   isa runners)
        └─────┬──────┘              └──────────┘                └─────┬──────┘
              │  read/write submissions + results                     │
              └──────────────────────► ┌──────────┐ ◄────────────────┘
                                       │ postgres │
                                       └──────────┘
```

A submission to `POST /submissions` is persisted, queued in Redis, picked up by a worker that
compiles+runs the code in an isolated sandbox with CPU/wall/memory limits, and the verdict is
written back. With `?wait=true` the server blocks and returns the result inline (what our
scripts use).

## Setup

You need a running **Docker daemon**. Two ways to get one on macOS:

### Option A — Docker Desktop (GUI)
Install Docker Desktop, launch it, and clear the first-run dialog (accept terms / skip sign-in)
until the menu-bar whale is steady. The daemon won't start until that dialog is cleared.

### Option B — colima (headless, no GUI) — what this repo uses
```bash
brew install colima docker            # use the NATIVE-arch brew (Apple Silicon: /opt/homebrew/bin/brew)
colima start --cpu 4 --memory 6 --disk 30
docker context use colima
```
Gotchas we hit (save yourself the time):
- **Apple Silicon + Intel brew.** If `which brew` is `/usr/local/bin/brew`, that's the Rosetta/Intel
  brew; colima installed by it fails with `limactl is running under rosetta`. Install colima with the
  native ARM brew at `/opt/homebrew/bin/brew` instead.
- **Xcode license.** `brew install` building colima/lima needs the Xcode license accepted once:
  `sudo xcodebuild -license accept` (verify with `clang --version`).
- **VM image download resets.** colima downloads an Ubuntu cloud image (~hundreds of MB) on first
  `start`; a flaky network shows `connection reset by peer`. Just re-run `colima start` — it resumes.
- The Judge0 images are `linux/amd64`; on arm64 they run under emulation (a `platform mismatch`
  warning is expected and harmless — submissions still work).

## Configure

The full config is `judge0.conf` (from the [Judge0 release](https://github.com/judge0/judge0/releases)).
A **redacted template lives in this repo at [`infra/judge0.conf.example`](../infra/judge0.conf.example)** —
copy it next to `infra/docker-compose.yml`, rename to `judge0.conf`, and fill the three placeholders:

```ini
# Require an auth token on the API (our scripts send it as the X-Auth-Token header)
AUTHN_HEADER=X-Auth-Token
AUTHN_TOKEN=<a long random token>

# Local-only credentials for the queue + DB
REDIS_PASSWORD=<a strong password>
POSTGRES_PASSWORD=<a strong password>
```

> The real `judge0.conf` (with live secrets) is **gitignored** under `.judge0/` — never commit it.
> The placeholders in `infra/judge0.conf.example` are safe to commit.

## Bring it up + smoke-test

```bash
cd infra              # (or .judge0/judge0-v1.13.1 where this repo extracted it)
docker compose up -d  # first boot pulls images + runs DB migrations + seeds languages (~1-2 min)
docker compose ps     # all four services "Up"; watch `docker compose logs -f server` until "Puma ... Listening"

# Verify a real run (the /submissions endpoint is what matters):
curl -s -X POST "http://localhost:2358/submissions?base64_encoded=false&wait=true" \
  -H "X-Auth-Token: <your token>" -H "content-type: application/json" \
  -d '{"language_id":71,"source_code":"print(6*7)","stdin":""}'
# -> {"status":{"description":"Accepted"},"stdout":"42\n", ...}
```

(Note: `GET /languages` can return `not found` on some builds even when the server is healthy —
don't use it as a liveness check; use a `POST /submissions` instead.)

## Wire the offline drives to it

`bulk-grow-test-cases.js`, `backfill-solutions.mjs`, and `mutation-test.mjs` all read two env vars
(falling back to the public CE if unset), so put them in `.env` (gitignored):

```
JUDGE0_URL=http://localhost:2358
JUDGE0_AUTH_TOKEN=<your token>
```

The watchdogs (`grow-watchdog.sh`, `backfill-watchdog.sh`) reload the script + `.env` each pass, so
the switch is automatic on the next pass; a log line `Judge0: http://localhost:2358` confirms it.
You can also override per-invocation: `--judge0 http://localhost:2358 --auth <token>`.

## Throughput tuning

Grading is parallelised across workers. On a machine with spare cores, scale them up:
```bash
docker compose up -d --scale workers=4
```
`COUNT` and `RAILS_MAX_THREADS` in `judge0.conf` tune worker concurrency and server threads.

## Security

The token + DB passwords here are for **localhost only**. Judge0 executes arbitrary user code in a
sandbox — never bind port `2358` to a public interface without rotating every secret, adding TLS,
and reviewing the sandbox limits. For local dev this is a closed loop on your machine.

## Manage

```bash
docker compose logs -f          # live execution logs
docker compose ps               # health
docker compose down             # stop (named volumes persist the DB)
docker compose down -v          # stop + wipe DB volumes (fresh start)
colima stop                     # stop the whole VM (Option B)
```

## Fallback

Unset `JUDGE0_URL`/`JUDGE0_AUTH_TOKEN` (or stop the container) and every drive transparently falls
back to the public `ce.judge0.com` — slower, but nothing breaks.
