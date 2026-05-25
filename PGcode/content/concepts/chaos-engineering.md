---
slug: chaos-engineering
module: sd-reliability
title: Chaos Engineering
subtitle: Deliberately inject failure in production to discover weaknesses before customers do.
difficulty: Advanced
position: 3
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Principles of Chaos Engineering"
    url: "https://principlesofchaos.org/"
    type: blog
  - title: "High Scalability — Netflix on Chaos Monkey and resilience"
    url: "http://highscalability.com/blog/2012/7/30/the-netflix-chaos-monkey-tells-us-how-to-be-prepared-for-out.html"
    type: blog
  - title: "Netflix/chaosmonkey"
    url: "https://github.com/Netflix/chaosmonkey"
    type: repo
status: published
---

## intro
Chaos engineering is the discipline of running controlled experiments on a production-like system to surface weaknesses that hide under normal load. The classic example is Netflix's Chaos Monkey, which randomly terminates EC2 instances during business hours so every team is forced to build services that survive instance death. The practice has matured into a four-step scientific method: define steady state, hypothesize, inject, learn.

## whyItMatters
- **Netflix's Chaos Monkey** (open-sourced 2012) randomly terminates EC2 instances during business hours; **Chaos Kong** takes out an entire AWS region. The whole Simian Army (Latency Monkey, Conformity Monkey, Janitor Monkey) institutionalized the practice.
- **Amazon's GameDay exercises** (documented by Jesse Robbins) ran controlled regional failures every quarter; **AWS Fault Injection Simulator** productized the idea for any customer.
- **Google's DiRT (Disaster Recovery Testing)** programs and **Microsoft's Azure Chaos Studio** prove the practice scaled across hyperscalers; **Gremlin**, **LitmusChaos** (CNCF), and **Chaos Mesh** are the open-source stack the rest of the industry runs.
- **The 2017 S3 outage** (caused by a typo in a debugging command) and the **2021 Fastly CDN outage** are textbook examples of the failure modes chaos engineering surfaces — single-points-of-failure that nobody noticed until production found them.

## intuition
Distributed systems fail in modes that unit tests, integration tests, and even load tests cannot reach: a partial network partition where 30% of packets drop in one direction, a disk that suddenly responds in 5 seconds instead of 5 milliseconds, a downstream dependency that returns 200 OK with corrupt JSON, a clock that jumps backward 4 minutes after an NTP sync. These failures are emergent properties of the system topology, not of any single service's code, so the only place they manifest is in production.

The traditional response — wait for real failures, write post-mortems, build runbooks — is reactive. You only patch failure modes you have already paid for in customer trust, and every new dependency or topology change resets the meter. Chaos engineering inverts this: deliberately inject the failures you suspect (or, eventually, the ones you cannot enumerate), watch the system absorb them, and patch the weak links before customers discover them.

The vaccine analogy is precise. A vaccine gives the immune system a controlled exposure to a pathogen so it learns the response before the real infection. A chaos experiment gives an engineering org a controlled exposure to a failure mode so the system, runbooks, and on-call team learn the response before the real outage. The discipline is scientific: define steady-state (the metric that says "things are normal"), hypothesize the system holds that steady-state under a specific perturbation, inject the perturbation in a blast-radius-bounded way, observe, learn, fix, re-run. Game days are the booster shots — scheduled, observed exercises with stakeholder buy-in. The mature form runs continuously in production, like Netflix's, not as an annual stunt.

## visualization
Steady state: checkout success rate over the last 5 minutes ≥ 99.5%. Hypothesis: killing one of three `payments` pods will not move that metric. Action: at 14:00 UTC, terminate `payments-7c4-x9` in the canary AZ. Observation: success rate dips to 98.2% for 22 seconds, then recovers — too long. Root cause: client retry budget tight, no warm connection pool to surviving pods. Fix: pre-warm pools, expand retry budget; re-run experiment next sprint to verify.

## bruteForce
Wait for real failures and write retrospectives. Build runbooks based on what hurt last time. This is reactive — you only patch failure modes you have already paid for in customer trust. Every novel topology change resets the meter, and you are perpetually one new dependency away from the next P0.

## optimal
The right approach follows the **Principles of Chaos Engineering** (principlesofchaos.org, authored by Casey Rosenthal and the Netflix team): (1) define **steady-state behavior** as a measurable business metric (checkout success rate, p99 latency, orders-per-second), not infrastructure metrics like CPU; (2) **hypothesize** the system holds that steady-state under a specific perturbation; (3) **inject realistic, real-world events** (pod kill, latency injection, dependency timeout, region loss, clock skew, DNS failure); (4) **automate continuously** in production, with **bounded blast radius** and an emergency kill switch.

The blast-radius progression is non-negotiable: dev → staging → 1% of production → 10% → 100%. At each stage, the kill switch must work in under 60 seconds, the steady-state metric must be live in a dashboard, and stakeholders (on-call, product, customer support) must be notified before the experiment fires.

```
Experiment lifecycle (Chaos Monkey / LitmusChaos / Gremlin all follow this shape):

1. Gate     ──► is on-call awake? in business hours? steady-state OK?
2. Select   ──► pick a victim (random pod / latency target / dependency)
3. Snapshot ──► record pre-experiment metric values
4. Inject   ──► apply the fault (kill pod, inject 500ms latency, drop DNS)
5. Observe  ──► poll steady-state metric for N minutes
6. Decide   ──► auto-rollback if metric breaches; halt + page on-call
7. Record   ──► structured log of hypothesis, outcome, fix-ticket
```

**Tooling**: **Chaos Monkey** (Netflix, simple instance kill), **Gremlin** (commercial, broad failure catalog), **LitmusChaos** and **Chaos Mesh** (CNCF, Kubernetes-native CRDs for declarative experiments), **AWS Fault Injection Simulator** (region/AZ-level faults), **Toxiproxy** (Shopify, TCP-level latency and corruption injection), **Pumba** (Docker container chaos), **PowerfulSeal** (k8s-native pod and node killer).

Two production disciplines matter most. **Steady-state must be a business metric**: "CPU > 80%" is not steady-state, "checkout success rate > 99.5%" is. The whole point is to learn whether the failure has user impact, not whether infrastructure twitched. **The learning loop must close**: weakness found → ticket opened → fix shipped → experiment re-run to verify. Skipping the re-run means you find the same weakness next quarter. Netflix's culture explicitly rewards finding and fixing weaknesses, not running flashy experiments.

## complexity
time: experiment scheduling is O(1); analysis bounded by observability tooling
space: experiment registry + run history (kilobytes per run)
notes: The asymptotic cost is irrelevant; the real cost is engineering rigor — defining steady state, automating rollback, and resisting the urge to skip the post-experiment learning step.

## pitfalls
- Running experiments without a clearly-defined steady-state metric — you cannot tell if the system "held."
- No blast-radius cap or kill switch — a misconfigured experiment can become the incident.
- Treating it as a single annual "game day" stunt rather than continuous practice.
- Lack of stakeholder alignment — surprise terminations during a launch erode trust.
- Skipping the learning loop: weakness found, ticket opened, nothing fixed, experiment re-run next quarter still fails.

## interviewTips
- Reference Netflix's Simian Army (Chaos Monkey, Latency Monkey, Chaos Kong) for credibility.
- Be ready to articulate steady state for a sample service — e.g., "p99 checkout latency under 400 ms AND success rate above 99.5%."
- Differentiate chaos engineering from load testing and disaster recovery — the goal is learning about emergent behavior, not capacity or recovery time.
- Mention the blast-radius progression: dev → staging → 1% prod → 100% prod.

## code.python
```python
import random, time, datetime, requests

class ChaosMonkey:
    def __init__(self, k8s, namespace, deployment, schedule_hours=(10, 16)):
        self.k8s = k8s
        self.namespace = namespace
        self.deployment = deployment
        self.start_h, self.end_h = schedule_hours

    def in_window(self):
        h = datetime.datetime.utcnow().hour
        return self.start_h <= h < self.end_h

    def steady_state_ok(self):
        r = requests.get("http://slo-api/checkout/success_rate?window=5m")
        return r.json()["value"] >= 0.995

    def run_once(self):
        if not self.in_window():
            return "outside window"
        if not self.steady_state_ok():
            return "abort: steady state already breached"
        pods = self.k8s.list_pods(self.namespace, self.deployment)
        victim = random.choice(pods)
        self.k8s.delete_pod(self.namespace, victim.name)
        time.sleep(60)
        return "recovered" if self.steady_state_ok() else "FAILED: investigate"
```

## code.javascript
```javascript
class ChaosMonkey {
  constructor(k8s, ns, deploy, startH = 10, endH = 16) {
    this.k8s = k8s; this.ns = ns; this.deploy = deploy;
    this.startH = startH; this.endH = endH;
  }

  inWindow() {
    const h = new Date().getUTCHours();
    return h >= this.startH && h < this.endH;
  }

  async steadyState() {
    const r = await fetch('http://slo-api/checkout/success_rate?window=5m');
    return (await r.json()).value >= 0.995;
  }

  async runOnce() {
    if (!this.inWindow()) return 'outside window';
    if (!(await this.steadyState())) return 'abort: steady state breached';
    const pods = await this.k8s.listPods(this.ns, this.deploy);
    const victim = pods[Math.floor(Math.random() * pods.length)];
    await this.k8s.deletePod(this.ns, victim.name);
    await new Promise(r => setTimeout(r, 60_000));
    return (await this.steadyState()) ? 'recovered' : 'FAILED: investigate';
  }
}
```

## code.java
```java
public class ChaosMonkey {
    private final KubeClient k8s;
    private final String ns, deploy;
    private final int startH, endH;

    public ChaosMonkey(KubeClient k, String ns, String d, int s, int e) {
        this.k8s = k; this.ns = ns; this.deploy = d; this.startH = s; this.endH = e;
    }

    private boolean inWindow() {
        int h = OffsetDateTime.now(ZoneOffset.UTC).getHour();
        return h >= startH && h < endH;
    }

    private boolean steadyStateOk() {
        return Slo.successRate("checkout", Duration.ofMinutes(5)) >= 0.995;
    }

    public String runOnce() throws Exception {
        if (!inWindow()) return "outside window";
        if (!steadyStateOk()) return "abort: steady state breached";
        List<Pod> pods = k8s.listPods(ns, deploy);
        Pod victim = pods.get(ThreadLocalRandom.current().nextInt(pods.size()));
        k8s.deletePod(ns, victim.name);
        Thread.sleep(60_000);
        return steadyStateOk() ? "recovered" : "FAILED: investigate";
    }
}
```

## code.cpp
```cpp
struct ChaosMonkey {
    KubeClient& k8s;
    std::string ns, deploy;
    int start_h, end_h;

    bool in_window() const {
        auto t = std::time(nullptr); auto tm = *std::gmtime(&t);
        return tm.tm_hour >= start_h && tm.tm_hour < end_h;
    }

    bool steady_state_ok() const {
        return slo_success_rate("checkout", 300) >= 0.995;
    }

    std::string run_once() {
        if (!in_window()) return "outside window";
        if (!steady_state_ok()) return "abort: steady state breached";
        auto pods = k8s.list_pods(ns, deploy);
        const auto& victim = pods[std::rand() % pods.size()];
        k8s.delete_pod(ns, victim.name);
        std::this_thread::sleep_for(std::chrono::seconds(60));
        return steady_state_ok() ? "recovered" : "FAILED: investigate";
    }
};
```
