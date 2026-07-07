---
slug: cloud-orchestration-k8s
module: cloud-containers
title: Orchestration and Desired State
subtitle: Declare how many copies of your app should run and let controllers keep reality matching that intent, restarting and rescheduling on their own.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 16
prereqs: [cloud-containers-images]
relatedProblems: []
references:
  - title: "Kubernetes — Overview"
    url: "https://kubernetes.io/docs/concepts/overview/"
    type: article
  - title: "Kubernetes — Pods"
    url: "https://kubernetes.io/docs/concepts/workloads/pods/"
    type: article
  - title: "Kubernetes — Deployments"
    url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"
    type: article
  - title: "Kubernetes — Service"
    url: "https://kubernetes.io/docs/concepts/services-networking/service/"
    type: article
  - title: "Kubernetes — Controllers"
    url: "https://kubernetes.io/docs/concepts/architecture/controller/"
    type: article
status: published

---

## intro
A single container on a single machine is easy to reason about: you start it, you watch it, you restart it when it falls over. Real systems are not that. They run dozens or hundreds of container copies spread across a fleet of machines, and every one of those copies can crash, get evicted when a node runs out of memory, or vanish when the hardware underneath it dies. Doing the placement, health-checking, scaling, and restarting by hand does not scale past a few containers. Orchestration is the layer that takes over that bookkeeping. This lesson covers the core Kubernetes objects — Pod, Deployment, Service — and the one idea that ties them together: you declare the state you want, and the system continuously works to make reality match.

## whyItMatters
The moment your app outgrows one box, the operational questions multiply faster than you can answer them by hand. Which machine has room for the next copy? One just crashed at 3am — who noticed, and who started a replacement? Traffic tripled this morning — how do you go from three copies to nine without editing config on nine servers? A container's IP changes every time it restarts — how does the rest of the system keep finding it? Orchestration answers all of these mechanically, the same way every time, without a human in the loop. That reliability is why Kubernetes underpins a huge share of production infrastructure, and why "how does self-healing work" and "what's the difference between a Pod and a Deployment" are staple interview questions. Understanding the reconciliation model is the difference between operating a cluster and fighting it.

## intuition
Think about a thermostat. You do not tell a thermostat "turn the heater on for eleven minutes." You tell it the temperature you *want* — 21 degrees — and then walk away. The thermostat runs a tiny loop forever: read the actual temperature, compare it to the target, and if there's a gap, act to close it. Too cold, turn the heater on. Warm enough, turn it off. Someone opens a window and the room cools? The next pass through the loop sees the new gap and switches the heater back on. You never issued that command. The loop did, because its whole job is to drive actual toward desired, continuously, no matter what disturbs the room.

Kubernetes is a thermostat for running software. You do not tell it "start a container on node 4." You hand it a desired state — "I want 3 replicas of this app running" — and a set of controllers each run that same read-compare-act loop forever. A controller observes the actual world (how many healthy pods exist right now), diffs it against the desired state (3), and if they differ, it takes an action to close the gap. Two pods running when you asked for three? Create one more. Four running because an old rollout left a straggler? Delete one. The controller is never "done" — it keeps watching, so the system is self-correcting by construction rather than by a script someone remembered to run.

This reframes what a command *is*. When you type a scale command, you are not imperatively spawning pods; you are editing the desired number in a stored record. The pods appear because a controller notices the record changed and reconciles toward it. The same mechanism that handles your deliberate scale-up handles an accidental crash: both are just a gap between desired and actual, and the loop treats them identically. That single idea — declare intent, let a control loop close the gap — is the whole mental model. Every object below is either a way to *express* desired state or a controller that *reconciles* toward it.

## visualization
```
DESIRED STATE (what you declared):   replicas = 3
                     |
         +-----------v------------------------------+
         |          RECONCILE LOOP (controller)     |
         |                                          |
         |   observe  ->  diff  ->  act  --+        |
         |      ^                          |        |
         |      +--------------------------+        |
         +------------------------------------------+

t0   desired=3   actual=3  [P1][P2][P3]   diff=0    -> steady, no action
t1   a pod dies            [P1][P2][ x]   actual=2
t2   desired=3   actual=2                 diff=+1   -> drift detected
t3   controller acts       [P1][P2][..]   creating  -> spin replacement
t4   desired=3   actual=3  [P1][P2][P4]   diff=0    -> healed, steady
```

## bruteForce
The by-hand way is a pile of shell scripts and human attention. You SSH into a chosen machine, `docker run` the container, and note which host got it. When you need more capacity you repeat that on more hosts, tracking placements in a spreadsheet or your head. To know if anything died you write a cron job that pings each container and pages you; when it pages, you wake up, SSH in, and restart the dead one by hand. When an IP changes you update a config file and reload the load balancer. Every one of these steps is manual, easy to get wrong at 3am, and impossible to keep consistent once you have a hundred containers across twenty machines. It does not scale, and it has no memory of what *should* be running.

## optimal
The orchestrated way replaces scripts-and-attention with declared intent plus continuous control loops. You describe the world you want in a manifest and submit it; controllers do the rest, forever.

The **Pod** is the smallest deployable unit — one (or a few tightly-coupled) containers that share a network identity and are scheduled together. Pods are deliberately disposable: they get a fresh IP on every restart and are never healed in place. You almost never create Pods directly.

Instead you create a **Deployment**, which records a desired *replica count* and a pod *template*. Its controller manages a **ReplicaSet** whose entire job is to keep exactly that many matching pods alive. This is the reconciliation loop in action: the ReplicaSet controller observes how many healthy pods carry its label, diffs against the desired count, and creates or deletes pods to close the gap. Change `replicas: 3` to `replicas: 9` and you have not started six containers — you have edited a number; the controller notices the new gap and schedules six more pods onto whatever nodes have room. That is **horizontal scaling**: one field, and placement is automatic.

The same loop delivers **self-healing** for free. A pod crashes or its node dies; the healthy count drops to 2 while desired stays 3. The very next pass sees the drift and schedules a replacement onto a live node. Nobody was paged, no script ran — a crash and a deliberate scale-up are the *same* event to the controller: a gap to close.

Because pods are ephemeral and their IPs churn, a **Service** sits in front of them. It provides one stable virtual IP and DNS name, and it continuously tracks the current set of healthy pods matching its label selector, load-balancing across whatever is alive right now. Clients talk to the Service name and never learn that pods came and went underneath. Declared intent, reconciled continuously, fronted by a stable name — that is the whole system.

## complexity
time: Reconciliation is event-driven and effectively continuous — controllers watch for changes and react within a control-loop interval (sub-second to a few seconds), so convergence time is roughly the time to schedule and start a replacement pod, not proportional to cluster size. Scaling from N to M replicas is O(|M - N|) pod creations or deletions, each dominated by image pull and container start time, not by orchestration overhead.
space: The desired state and the observed state of every object are stored in the cluster's key-value store (etcd), so memory grows with the number of objects, not with request traffic. Each running pod also consumes the CPU/memory it requests on its node.
notes: The knob that matters is the desired replica count and the resource requests, not any imperative command sequence. The control loop makes convergence self-correcting: transient failures cost one reschedule, and the steady-state cost is just watching for drift.

## pitfalls
- **Making imperative edits that the controller undoes.** You `kubectl edit` a pod or `delete` one directly to "fix" something, and the Deployment controller immediately recreates it to match desired state — you are fighting the loop. Fix: change desired state, not actual state. Edit the Deployment manifest (or use `kubectl scale` / `kubectl apply`) so the controller reconciles toward what you actually want.
- **No readiness or liveness probes.** Without a readiness probe, the Service routes traffic to a pod that is still booting and hasn't loaded config, so users hit errors; without a liveness probe, a hung-but-not-crashed pod is never restarted. Fix: define both — a readiness probe gates traffic until the app is truly serving, and a liveness probe lets the kubelet restart a wedged container.
- **No resource requests or limits.** With no `requests`, the scheduler can't reason about capacity and crams pods onto nodes that then thrash or OOM-kill each other; with no `limits`, one runaway pod starves its neighbors. Fix: set realistic CPU/memory `requests` (for scheduling) and `limits` (for isolation) on every container.
- **Treating pods as pets.** Naming, snapshotting, or SSHing into a specific pod to hand-tune it assumes it will persist — but any reschedule wipes that state, since pods are cattle, not pets. Fix: keep pods stateless and identical, push durable state to volumes or external stores, and make replacements interchangeable.
- **Selector/label mismatch.** A Service or Deployment whose label selector doesn't match its pod template's labels ends up managing zero pods — silently. Fix: keep `selector.matchLabels` and the pod template `labels` in sync, and verify with `kubectl get pods -l <label>` that the count is what you expect.

## interviewTips
- Lead with the reconciliation model, not the object list. Say "you declare desired state and controllers run a continuous observe-diff-act loop to make actual match" — then explain that scaling and self-healing are the *same* mechanism (a gap between desired and actual), which shows you understand *why* Kubernetes works, not just its nouns.
- Nail the Pod vs Deployment vs Service distinction crisply: Pod is the disposable unit of scheduling, Deployment declares the replica count and manages ReplicaSets to keep that many pods alive, Service gives ephemeral pods one stable IP/DNS via a label selector. Interviewers use this exact question as a filter.
- When asked "what happens when a pod dies," walk the loop: the healthy count drops below desired, the controller detects the drift on its next pass, and it schedules a replacement onto a healthy node — no human, no script, identical to a scale-up. Mention probes as how the system knows a pod is actually healthy.

## keyTakeaways
- You declare desired state (like `replicas: 3`) and controllers run a perpetual observe-diff-act loop — a thermostat for software — so the system self-corrects by construction instead of by scripts someone has to run.
- Pod, Deployment, and Service divide the work cleanly: the Pod is the disposable unit of scheduling, the Deployment declares how many should run and manages ReplicaSets to keep that count, and the Service fronts ephemeral pods with one stable IP and DNS name.
- Horizontal scaling and self-healing are the *same* reconciliation event — a gap between desired and actual — so changing a replica count and recovering from a crash both reduce to the controller closing that gap.

## code.yaml
```yaml
# Deployment: declares desired state (3 replicas) and a pod template.
# The controller keeps exactly this many healthy pods running.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 3                 # desired count — the number the loop drives toward
  selector:
    matchLabels:
      app: web                # must match the pod template labels below
  template:
    metadata:
      labels:
        app: web              # pods carry this label; Service + ReplicaSet select on it
    spec:
      containers:
        - name: web
          image: <registry>/app:1.0   # placeholder — pin a real tag, never :latest
          ports:
            - containerPort: 8080
          readinessProbe:             # gate traffic until the app is actually serving
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:              # restart the container if it wedges
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            requests:                 # used by the scheduler to place the pod
              cpu: "100m"
              memory: "128Mi"
            limits:                   # cap so one pod can't starve its neighbors
              cpu: "500m"
              memory: "256Mi"
```

## code.bash
```bash
# Apply the declared desired state; the controller reconciles toward it.
kubectl apply -f deployment.yaml

# Observe actual state: 3 pods should be Running and Ready (READY 1/1).
kubectl get pods -l app=web

# Horizontal scale: this only edits the desired replica count.
# The controller notices the gap and schedules the extra pods itself.
kubectl scale deployment/web --replicas=4

# Watch a rollout converge to the desired state before moving on.
kubectl rollout status deployment/web

# Self-healing demo: delete one pod (actual drops to 3 of desired 4)...
kubectl delete pod -l app=web --field-selector=status.phase=Running \
  --grace-period=0 | head -n 1

# ...then re-list. A replacement is already being created — no human acted.
kubectl get pods -l app=web
```

## code.service
```yaml
# Service: one stable virtual IP + DNS name in front of ephemeral pods.
# It continuously tracks healthy pods matching the selector and load-balances.
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web            # routes to every pod carrying this label, whatever its IP
  ports:
    - name: http
      protocol: TCP
      port: 80          # stable port clients dial
      targetPort: 8080  # container port pods actually listen on
  type: ClusterIP       # in-cluster virtual IP; reachable as http://web
```
