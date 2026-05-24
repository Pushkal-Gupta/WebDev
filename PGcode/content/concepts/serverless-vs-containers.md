---
slug: serverless-vs-containers
module: system-design
title: Serverless vs Containers
subtitle: Lambda / Cloud Run vs Kubernetes — cold starts, statefulness, cost crossover.
difficulty: Intermediate
position: 64
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "AWS Builders' Library — Serverless"
    url: "https://aws.amazon.com/builders-library"
    type: blog
  - title: "Microservices.io — Serverless Deployment"
    url: "https://microservices.io/patterns/deployment/serverless-deployment.html"
    type: book
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
**Serverless** (Lambda, Cloud Run, Azure Functions) — you ship code, the platform runs it on demand, scales to zero, bills per ms. **Containers on orchestrators** (Kubernetes, ECS, Nomad) — you ship images, the cluster runs them continuously, bills per node-hour. Choice hinges on **traffic shape**, **cold-start tolerance**, **statefulness**, and **operational appetite**.

## whyItMatters
Wrong choice burns money or wakes engineers. Serverless for a 24/7 1000-RPS API will outspend a 3-pod deployment by 5-10x. Kubernetes for a once-a-day cron job means paying for idle nodes + maintaining a control plane. The crossover point is real and measurable.

## intuition
**Serverless wins when**:
- Spiky/sporadic traffic — scales 0 to 1000 to 0.
- Event-driven (S3 upload -> resize, queue message -> process).
- You don't want to think about VMs, OS patching, autoscalers.
- Stateless request/response handlers.

**Containers/k8s win when**:
- Sustained traffic (>30% utilization on a small fleet beats serverless on cost).
- Long-running connections (WebSockets, gRPC streaming).
- Heavy startup (loading ML models, warm caches) — cold starts kill UX.
- Custom runtimes, GPUs, sidecars (Envoy, OpenTelemetry collector).
- Stateful workloads (databases, Kafka brokers).

**Cold starts**: serverless containers spin from scratch on first request after idle. ~100-500ms typical (worse for Java/.NET, better with SnapStart/provisioned concurrency). Tolerable for back-office, painful for user-facing checkout.

**Stateful**: lambdas can use `/tmp` (512MB default, ephemeral). For persistent state -> external (RDS, DynamoDB, S3). k8s offers StatefulSets + PersistentVolumeClaims for genuine state.

## visualization
```
TRAFFIC SHAPE         | SERVERLESS                | CONTAINERS (k8s)
----------------------+---------------------------+------------------------
spiky (0..1k..0/day)  | natural fit, $0 idle      | over-provisioned waste
steady 24/7 high RPS  | bill per invocation $$$$  | reserved nodes, cheaper
batch nightly cron    | EventBridge + Lambda      | k8s Job / CronJob
long-lived websocket  | not natively (use API GW) | pod + service, native
GPU inference         | limited offerings         | full GPU node pool
ML model 5GB at start | cold start nightmare      | warm pod, instant
```

Cold start lifecycle:
```
request -> idle? -> spin runtime -> load deps -> handler init -> invoke
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ~100-500ms
```

## bruteForce
**All serverless**: video transcoding pipeline ($0.20/m of compute on Lambda becomes $20/m of an 8-hour batch; an EC2 spot fleet would be $0.40).

**All k8s**: a marketing form submitted 30 times a day still costs you 3 always-on pods + autoscaler + control plane.

## optimal
**Hybrid is standard**:
- User-facing APIs in containers (predictable load, low p99, WebSockets).
- Async fanout / glue / cron in Lambda (S3 trigger, scheduled tasks, webhooks).
- Heavy data jobs on managed compute (EMR, Dataflow, Batch) — neither.

**Cost crossover**: rough rule of thumb — if a workload's sustained CPU utilization on the smallest container is >25-30%, containers beat serverless. Below that, serverless is cheaper.

**Mitigating cold starts**:
- Provisioned concurrency (Lambda) — keep N warm at a flat hourly cost.
- Smaller deployment package, lazy imports, no global SDK init for one-off invokes.
- Cloud Run min instances = N (always at least N warm).
- Switch runtime: Go/Node cold-start in tens of ms; JVM/Python in hundreds.

## complexity
- **Serverless ops complexity**: ~zero. IAM + log retention + alarms.
- **k8s ops complexity**: high. Cluster upgrades, CNI, RBAC, autoscalers, secrets, ingress, observability stack.
- **Per-request cost**: serverless O(1) per invoke + ms; containers O(node-hour / RPS).

## pitfalls
- **Lambda inside a VPC** historically added cold-start penalty (Hyperplane ENI fixed this — verify your region).
- **DB connections from Lambda**: spawn N connections per concurrent execution -> Postgres saturates. Use RDS Proxy / DataAPI / Drizzle pool with limit=1.
- **Lambda max 15min**: long jobs need Step Functions or Fargate.
- **k8s without HPA + cluster-autoscaler**: 3am traffic spike = oncall page.
- **Distroless image too small**: missing curl/wget breaks health checks; missing certs breaks TLS.
- **State on local disk in either**: Lambda /tmp is ephemeral; pods are ephemeral too unless StatefulSet + PVC.

## interviewTips
- Lead with **traffic shape** + **state requirement** before recommending.
- Mention **cold start mitigations** (provisioned concurrency, min instances) — shows depth.
- Discuss the **cost crossover** at sustained utilization.
- Senior interviews: hybrid -> serverless for glue, containers for hot path.

## code.python
```python
def choose_compute(workload):
    if workload.get('websocket') or workload.get('grpc_stream'): return 'containers'
    if workload.get('gpu') or workload.get('startup_seconds', 0) > 3: return 'containers'
    if workload.get('p99_ms_budget', 1000) < 100: return 'containers'
    if workload.get('rps_avg', 0) * workload.get('cpu_per_req_ms', 100) / 1000 > 0.25:
        return 'containers'
    return 'serverless'
```

## code.javascript
```javascript
function chooseCompute(w) {
  if (w.websocket || w.grpcStream) return 'containers';
  if (w.gpu || (w.startupSeconds ?? 0) > 3) return 'containers';
  if ((w.p99MsBudget ?? 1000) < 100) return 'containers';
  const utilization = (w.rpsAvg ?? 0) * (w.cpuPerReqMs ?? 100) / 1000;
  return utilization > 0.25 ? 'containers' : 'serverless';
}
```

## code.java
```java
static String chooseCompute(Map<String, Object> w) {
    if (Boolean.TRUE.equals(w.get("websocket"))) return "containers";
    if (Boolean.TRUE.equals(w.get("gpu"))) return "containers";
    int p99 = ((Number) w.getOrDefault("p99MsBudget", 1000)).intValue();
    if (p99 < 100) return "containers";
    double util = ((Number) w.getOrDefault("rpsAvg", 0)).doubleValue()
                * ((Number) w.getOrDefault("cpuPerReqMs", 100)).doubleValue() / 1000.0;
    return util > 0.25 ? "containers" : "serverless";
}
```

## code.cpp
```cpp
// std::string chooseCompute(const Workload& w) {
//     if (w.websocket || w.grpcStream) return "containers";
//     if (w.gpu || w.startupSeconds > 3) return "containers";
//     if (w.p99MsBudget < 100) return "containers";
//     double util = w.rpsAvg * w.cpuPerReqMs / 1000.0;
//     return util > 0.25 ? "containers" : "serverless";
// }
```
