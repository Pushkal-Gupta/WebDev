---
slug: cloud-cicd-deploy
module: cloud-containers
title: CI/CD and Deployment Strategies
subtitle: How a commit becomes a running service without downtime — build once, ship an immutable image, roll it out gradually, and roll back the instant it misbehaves.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 16
prereqs: [cloud-orchestration-k8s]
relatedProblems: []
references:
  - title: "Docker — Build and push your first image"
    url: "https://docs.docker.com/get-started/introduction/build-and-push-first-image/"
    type: article
  - title: "Kubernetes — Updating a Deployment"
    url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#updating-a-deployment"
    type: article
  - title: "Kubernetes — Performing a rolling update"
    url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/"
    type: article
  - title: "The Twelve-Factor App — Build, release, run"
    url: "https://12factor.net/build-release-run"
    type: article
  - title: "The Twelve-Factor App — Config"
    url: "https://12factor.net/config"
    type: article
status: published
---

## intro
Between a developer typing `git push` and users hitting the new feature sits an assembly line: continuous integration compiles the code and runs the tests, a build step packages everything into a container image, that image is pushed to a registry under an immutable tag, and finally a deployment step tells the cluster to run it. This lesson walks the whole build-ship-run pipeline end to end, then focuses on the part that actually touches production: the deployment strategy. Recreate, rolling, blue-green, and canary each trade downtime, risk, and cost differently, and every one of them needs a way to undo a bad release fast.

## whyItMatters
Shipping is the riskiest thing an engineering team does routinely, because it is the one moment where working software can become broken software in front of real users. The strategy you pick decides how much blast radius a bad release has: whether every user sees the breakage at once or only one percent of them, whether recovery is a thirty-second traffic flip or a frantic thirty-minute rebuild, whether the site goes dark during the swap or never drops a request. Getting this right is the difference between deploying ten times a day with confidence and deploying once a quarter at 2 a.m. with the whole team on a call. It is also a staple interview topic precisely because a good answer reveals whether you understand availability, rollback, and health checking as one connected system rather than isolated buzzwords.

## intuition
Think about changing the tires on a car. The **recreate** strategy is the honest, brutal approach: pull the car into the garage, take all four wheels off, and only then start bolting new ones on. Simple and clean, but the car goes nowhere while you work — that gap is downtime.

**Rolling update** is changing the tires while the car keeps driving slowly. You swap one wheel at a time: jack up a corner, replace that tire, set it down, move to the next. At every moment at least three wheels are carrying the car, so it never stops. In deployment terms you replace instances a few at a time — take one old instance out of rotation, start a new one, wait until it is healthy, then move on. Capacity dips slightly during the swap but service never drops. The catch is that for a while old and new versions run side by side, so both must be compatible with the same database and the same clients.

**Blue-green** is a theater with two identical stages. The audience — your live traffic — is watching the blue stage. Backstage you fully build out the green stage with the new set, rehearse it, light it, and get it perfect while nobody is looking. When it is ready you swing the spotlight from blue to green in one motion; the whole audience is now watching the new version at once. If green fumbles its lines, you swing the spotlight straight back to blue, which is still standing exactly as it was. The switch is atomic and rollback is instant, but you pay to keep two full stages standing.

**Canary** is a chef testing a new dish. Instead of putting it on every plate, the kitchen serves it to a few adventurous diners first and watches their faces. If they smile — error rates stay flat, latency holds — the kitchen sends it to more tables, then eventually the whole restaurant. If the first tasters push the plate away, only a handful of meals were affected and the dish quietly goes back to the old recipe. You route a small slice of live traffic to the new version, watch the metrics, and either ramp up or roll back based on what real users experience.

The thread through all four is the **health check**: before any new instance takes traffic, the platform pokes it and asks "are you actually ready?" A rollout that does not wait for that answer is just a faster way to break production.

## visualization
```
  git commit  (source)
      |
      v
  CI: install deps -> run unit + integration tests
      |            (red tests stop the line here)
      v
  BUILD: docker build -> image  app:git-<sha>
      |
      v
  PUSH: registry.example.com/app@sha256:9f3c...   (immutable digest)
      |
      v
  DEPLOY: cluster pulls the digest, starts pods, health-checks them

  rollout (rolling, replace a few at a time):
    before   [old][old][old][old][old][old]
    step 2   [new][new][old][old][old][old]   <- 2 healthy new, 4 serving
    step 4   [new][new][new][new][old][old]
    done     [new][new][new][new][new][new]
    on fail  -> rollback -> [old][old][old][old][old][old]
```

## bruteForce
The naive deploy is the big-bang manual push: SSH into the box, `git pull` or copy the new build over the old one, restart the process, and hope. Everything changes at once, so from the moment you stop the old version until the new one boots and warms up, the site is down — a maintenance window users feel directly. There is no gradual exposure, so a bug hits one hundred percent of traffic instantly. Worst of all, there is no clean undo: rolling back means scrambling to remember what the previous state was, re-pulling an older commit, and rebuilding under pressure while the pager screams. It works for a hobby project and collapses the moment uptime matters.

## optimal
The production pipeline removes risk at every stage by automating the boring parts and making releases progressive and reversible. **Continuous integration** runs on every commit: install dependencies, lint, and run the test suite, so broken code never reaches the build step — a red test stops the line. **Build once.** The CI job produces a single container image and that exact artifact is promoted unchanged through staging and production; you never rebuild per environment, because a rebuild is a different artifact and defeats the purpose of testing. This is the twelve-factor build/release/run separation — build turns code into an immutable image, release binds that image to environment config, and run just executes it — and it is why environment-specific behavior belongs in **config injected at run time**, not baked into the image.

**Immutable images beat mutable tags.** Pushing `app:latest` and redeploying is non-reproducible: two deploys of "latest" a day apart can run different code, and rollback is meaningless because the tag has already moved. Instead tag by commit SHA (`app:git-9f3c1a`) and, better, pin by **content digest** (`app@sha256:...`) which is a cryptographic fingerprint of the exact bytes. A digest can never point at anything else, so what you tested is provably what you run, and rollback is just re-pinning the old digest.

Then comes the **rollout strategy**. **Rolling** replaces instances a few at a time, gated by health checks, for zero-downtime updates with no extra fleet cost. **Blue-green** stands up a complete new fleet, verifies it, then flips a load balancer atomically — instant cutover and instant rollback at the price of running two fleets briefly. **Canary** sends a small traffic percentage to the new version, watches real error and latency metrics, and ramps up only if they hold, catching failures with minimal blast radius. All three depend on **health checks** (readiness and liveness probes) to gate progression: a new instance takes traffic only after it reports ready, and a stalled rollout halts instead of marching a broken version to full exposure. And every strategy keeps the previous known-good revision one command away, so **rollback** — re-pointing to the prior image or `kubectl rollout undo` — is the fast path back when metrics go red.

## complexity
time: The metric that matters is **MTTR** — mean time to recovery. Big-bang deploys have a recovery time measured in the minutes-to-rebuild; blue-green collapses it to a single traffic flip (seconds); rolling and canary sit in between because they revert a few instances or a traffic weight at a time. Rollout duration itself scales with fleet size and how many instances you cycle per step.
space: Steady state is one fleet. Rolling needs slight headroom (`maxSurge`) for the extra instances spun up mid-swap. **Blue-green roughly doubles resource use** for the window both fleets are live. Canary adds one small extra group plus the traffic-routing machinery. You trade running capacity for lower risk and faster recovery.
notes: The real axes are **blast radius** (what fraction of users a bad release hits) and **MTTR** (how fast you undo it). Recreate maximizes both; canary minimizes blast radius; blue-green minimizes MTTR. Pick per how costly an outage is versus how much spare capacity you can afford.

## pitfalls
- **Deploying a mutable tag like `:latest`.** The tag moves, so redeploys are non-reproducible and rollback has nothing stable to return to. Fix: tag by commit SHA and pin by content digest (`app@sha256:...`); treat every build as an immutable artifact you promote unchanged across environments.
- **No health-check gating on the rollout.** Without a readiness probe the platform sends traffic to a container that has not finished starting — or marches a crash-looping new version all the way to one hundred percent because nothing told it to stop. Fix: define readiness and liveness probes and let the rollout progress only as new instances report healthy; a stalled rollout should halt, not complete.
- **No rollback plan.** Teams celebrate the deploy and forget the undo, then improvise recovery under pressure. Fix: keep the previous revision/image retained and rehearse the one-liner (`kubectl rollout undo` or re-pin the prior digest); rollback should be a routine, tested button, not a heroic scramble.
- **Config drift between build and prod.** Baking environment-specific values into the image, or changing config out-of-band on the server, means what you tested is not what runs. Fix: build one artifact and inject all environment differences as config at run time (twelve-factor), so the same image behaves correctly everywhere.
- **Database migrations incompatible with two running versions.** During rolling and canary, old and new code hit the same database at once; a migration that drops a column the old version still reads breaks live requests. Fix: make schema changes backward-compatible and multi-step — add first, deploy code that writes both, backfill, then remove the old column in a later release (expand/contract).

## interviewTips
- Frame the answer around **blast radius and MTTR**, not vocabulary. Say which strategy you would pick and why: canary when you want to catch failures on a tiny slice of users, blue-green when you need an instant atomic cutover and can afford a second fleet, rolling when you want zero-downtime updates without extra cost.
- Stress that a good deploy is **reversible and gated**. Mention immutable images pinned by digest (so rollback is deterministic) and health-check-gated progression (so a broken release stalls instead of rolling out fully) — these show you think about the failure case, not just the happy path.
- Bring up the **two-version compatibility problem** unprompted. During rolling or canary, old and new run together, so API and especially database changes must be backward-compatible (expand/contract migrations). Naming this signals real production experience.

## keyTakeaways
- Build once and promote the same immutable image across environments; pin by content digest, never a mutable tag like `:latest`, so what you tested is provably what runs and rollback is deterministic.
- Choose the rollout strategy by blast radius and MTTR: recreate (simple, has downtime), rolling (zero-downtime, cheap), blue-green (atomic flip, instant rollback, double cost), canary (tiny-slice exposure, metric-gated ramp).
- Health checks gate progression and rollback is the safety net — a rollout advances only as new instances report ready, halts when they do not, and every strategy keeps the previous known-good revision one command away.

## code.yaml
```yaml
# GitHub Actions: build once, push an immutable image, then deploy it.
name: build-ship-run

on:
  push:
    branches: [main]

env:
  REGISTRY: registry.example.com
  IMAGE: registry.example.com/app

jobs:
  ci-build-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Install deps and run tests
        run: |
          npm ci
          npm test        # a red test fails the job and stops the line

      - name: Log in to the registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_TOKEN }}   # placeholder secret

      # Tag by commit SHA so the artifact is immutable and reproducible.
      - name: Build and push image
        id: push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ env.IMAGE }}:git-${{ github.sha }}

      # Deploy the exact digest we just pushed (never :latest).
      - name: Roll out to the cluster
        env:
          KUBECONFIG_DATA: ${{ secrets.KUBECONFIG_DATA }}   # placeholder secret
        run: |
          echo "$KUBECONFIG_DATA" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig
          kubectl set image deployment/app \
            app=${{ env.IMAGE }}:git-${{ github.sha }}
          kubectl rollout status deployment/app --timeout=120s
```

## code.deployment
```yaml
# A Deployment that updates via a health-check-gated rolling update.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2          # up to 2 extra pods spun up during the swap
      maxUnavailable: 1    # at most 1 pod missing at any moment
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      containers:
        - name: app
          # Immutable digest pin: this can never drift to other code.
          image: registry.example.com/app@sha256:9f3c1a2b4d5e6f7a8b9c0d1e2f3a4b5c
          ports:
            - containerPort: 8080
          # Traffic is withheld until this probe passes, gating the rollout.
          readinessProbe:
            httpGet:
              path: /healthz/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 3
          # A hung pod is restarted rather than left serving errors.
          livenessProbe:
            httpGet:
              path: /healthz/live
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
```

## code.bash
```bash
#!/usr/bin/env bash
set -euo pipefail

REGISTRY="registry.example.com"
IMAGE="$REGISTRY/app"
SHA="$(git rev-parse --short HEAD)"   # immutable, reproducible tag

# 1. Build the image once and tag it by commit SHA (never :latest).
docker build -t "$IMAGE:git-$SHA" .

# 2. Push the artifact to the registry; note the printed digest.
docker push "$IMAGE:git-$SHA"

# 3. Roll it out. The cluster replaces pods a few at a time, gated by
#    readiness probes, so no request is dropped during the swap.
kubectl set image deployment/app "app=$IMAGE:git-$SHA"

# 4. Watch the rollout; this blocks until all new pods report ready
#    or the rollout stalls (non-zero exit -> the CI job fails).
if ! kubectl rollout status deployment/app --timeout=120s; then
  echo "rollout stalled or unhealthy -> rolling back"
  # 5. Rollback: revert to the previous known-good revision instantly.
  kubectl rollout undo deployment/app
  kubectl rollout status deployment/app --timeout=120s
  exit 1
fi

echo "deployed $IMAGE:git-$SHA"
```
