---
slug: chaos-engineering
module: system-design
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
Distributed systems fail in ways unit tests cannot catch: partial network partitions, slow disks, AZ brownouts, retry storms, dependency cascade. Reading post-mortems is cheap education; rehearsing failure on a Wednesday morning when your on-call team is fresh is dramatically cheaper than discovering it during Black Friday. Chaos engineering shifts incident discovery from "Saturday 2 AM" to "Tuesday 11 AM."

## intuition
Vaccines work by giving the body a controlled exposure to a pathogen so the immune system learns. Chaos engineering vaccinates production. A game day is the booster shot — a scheduled, observed exercise where engineers watch the system absorb a known failure and patch every weak link the experiment exposes.

## visualization
Steady state: checkout success rate over the last 5 minutes ≥ 99.5%. Hypothesis: killing one of three `payments` pods will not move that metric. Action: at 14:00 UTC, terminate `payments-7c4-x9` in the canary AZ. Observation: success rate dips to 98.2% for 22 seconds, then recovers — too long. Root cause: client retry budget tight, no warm connection pool to surviving pods. Fix: pre-warm pools, expand retry budget; re-run experiment next sprint to verify.

## bruteForce
Wait for real failures and write retrospectives. Build runbooks based on what hurt last time. This is reactive — you only patch failure modes you have already paid for in customer trust. Every novel topology change resets the meter, and you are perpetually one new dependency away from the next P0.

## optimal
Adopt the four principles: (1) define steady-state behavior with a meaningful business metric, not just CPU; (2) hypothesize the system holds steady under a specific perturbation; (3) inject realistic failures (pod kill, latency injection, dependency timeout, region loss, clock skew); (4) automate so the experiment runs continuously, not as a one-time stunt. Start in staging, graduate to a blast-radius-limited slice of production (one AZ, 1% of users), then expand. Tooling: Chaos Monkey, Gremlin, LitmusChaos, AWS Fault Injection Service, Toxiproxy for network-level chaos.

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
