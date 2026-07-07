---
slug: cloud-networking-storage
module: cloud-containers
title: Networking, Volumes and Config
subtitle: How containers get their own IP, how a Service load-balances across replicas, why local disk vanishes on restart, and where config and secrets belong.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 15
prereqs: [cloud-orchestration-k8s]
relatedProblems: []
references:
  - title: "Kubernetes — Service"
    url: "https://kubernetes.io/docs/concepts/services-networking/service/"
    type: article
  - title: "Kubernetes — Ingress"
    url: "https://kubernetes.io/docs/concepts/services-networking/ingress/"
    type: article
  - title: "Kubernetes — Persistent Volumes"
    url: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/"
    type: article
  - title: "Kubernetes — ConfigMaps"
    url: "https://kubernetes.io/docs/concepts/configuration/configmap/"
    type: article
  - title: "Kubernetes — Secrets"
    url: "https://kubernetes.io/docs/concepts/configuration/secret/"
    type: article
status: published
---

## intro
A running container is not a lonely process on one machine — it sits inside a cluster where its address can change, its neighbours come and go, and its local disk is temporary by design. Three questions decide whether an app survives that environment: how does traffic reach it when its IP keeps moving, where does data live so a restart does not erase it, and how do configuration and credentials get in without being baked into the image. This lesson answers all three: container networking and Services, ephemeral versus persistent storage, and injecting config through ConfigMaps and Secrets.

## whyItMatters
Every one of these three areas is a place where a design that works on your laptop silently breaks in a cluster. Point a client at a single pod's IP and it will fail the moment that pod is rescheduled onto another node with a new address. Write uploaded files to the container's own filesystem and they vanish the next time the pod restarts, taking user data with them. Bake an API key into the image and it leaks the moment the image is pulled, pushed to a registry, or committed to git. Getting networking, storage, and config right is the difference between an app that tolerates the churn of orchestration and one that loses data, drops traffic, and leaks secrets under perfectly normal cluster operations like a rolling update or a node drain.

## intuition
Think of a busy clinic that runs in shifts. Each clerk who comes on duty gets a fresh, blank scratchpad. They can scribble on it all shift — notes, running totals, half-finished forms — but the moment their shift ends the scratchpad is shredded and the next clerk starts with a clean one. That scratchpad is a container's **writable layer**: fast, private, and completely thrown away when the container restarts or is rescheduled. Anything you cannot afford to lose must not live there.

Down the hall there is a wall of **lockers**. A locker keeps its contents no matter who is on shift; clerks check one out, use it, and hand it back, and the papers inside are exactly as they left them. That locker is a **PersistentVolume**: storage that outlives any single pod. A pod asks for one with a **PersistentVolumeClaim** — "I need a locker of this size" — and the cluster hands over a matching one and mounts it into the container at a path. Restart the pod, reschedule it to another node, and it re-attaches to the same locker with the data intact.

Now the front desk. Patients arriving do not ask for a specific clerk by name — they walk up to the **receptionist**, who sends each one to whichever clerk is free. The patient never needs to know that clerks changed, went home, or were replaced; the receptionist always has a stable desk and a current list of who is available. That receptionist is a **Service**: one stable name and virtual IP that load-balances requests across whatever pod replicas are currently healthy, so callers never chase a moving target. And the **Ingress** is the building's front door and signpost combined — it takes outside visitors and routes them by which department they asked for (host and path) to the right receptionist inside. Scratchpad, locker, receptionist, front door: four roles that keep the clinic running even as the individual clerks constantly change.

## visualization
```
              external HTTP traffic
                      |
                 [ INGRESS ]  routes by host/path:  shop.example.com/  -> web-svc
                      |                              shop.example.com/api -> api-svc
                      v
                 [ SERVICE ]  stable name + virtual IP, load-balances round-robin
                 /       |       \
                v        v        v
            [pod A]  [pod B]  [pod C]     each pod: own network namespace + own IP

   EPHEMERAL pod                    PERSISTENT pod
   +-----------------+              +-----------------+        +--------------+
   | container       |              | container       |--mount-| PersistentVol |
   |  writable layer | <- wiped     |  writable layer |        |  (survives)   |
   |  [ data...    ] |    on        |                 |        |  [ data...  ] |
   +-----------------+   restart    +-----------------+        +--------------+
        restart => empty                 restart => volume still has the data
```

## bruteForce
The tempting shortcut is to treat a container like a normal server: give clients its IP directly, save state onto its local disk, and hardcode config and credentials straight into the image so "everything is in one place." It appears to work in a demo. But the container's IP is ephemeral and changes on every reschedule, so hardwired addresses go stale; the writable layer is discarded on restart, so saved files disappear; and secrets compiled into an image travel wherever that image travels — into every registry, cache, and git history — where anyone with pull access can read them. Convenient today, three outages and a leak tomorrow.

## optimal
Solve each concern with the primitive built for it, and stop treating a pod like a pet server.

**Traffic.** Never address a pod by IP. Put a **Service** in front of the replica set: it owns a stable virtual IP and DNS name and load-balances across every healthy pod behind it, so callers inside the cluster reach `api-svc` and the Service picks a live pod round-robin. For traffic arriving from outside, an **Ingress** sits at the edge and routes by host and path — `shop.example.com/` to the web Service, `shop.example.com/api` to the API Service — giving you one entry point, TLS termination, and host/path rules without exposing every Service publicly. Pods can be added, killed, and rescheduled freely; the Service's endpoint list updates and the stable name never changes.

**State.** Assume the container filesystem is scratch space that will be wiped. Anything that must survive a restart goes on a **PersistentVolume**, requested through a **PersistentVolumeClaim** and mounted into the container at a path. The claim decouples the app ("I need 5Gi that persists") from the infrastructure ("here is a matching disk"), and the volume re-attaches across restarts and reschedules, so the data moves with the workload rather than dying with the pod. Set a sensible **reclaim policy** so deleting the claim does not silently delete the data underneath.

**Config.** Keep configuration and credentials out of the image entirely. Non-sensitive settings live in a **ConfigMap**; credentials live in a **Secret**. Both are injected at runtime — as environment variables via `valueFrom`, or mounted as files into the container — so the same image runs unchanged across dev, staging, and prod, with only the ConfigMap and Secret swapped per environment. Secrets stay in the cluster's secret store (and a real secret manager for production), never in the image and never in git.

## complexity
time: Service routing adds a constant-time hop — one virtual-IP lookup and a round-robin pick per connection, effectively O(1) regardless of replica count. Ingress adds a similar constant edge hop for host/path matching. Volume attach happens once at pod start (a one-off cost), not per request, so steady-state request latency is unaffected by persistence.
space: A PersistentVolume consumes real backing storage sized by the claim; ephemeral writable layers cost only transient node disk that is reclaimed on pod exit. ConfigMaps and Secrets are small key/value objects held in the cluster store and materialised into the pod at start.
notes: The scaling lever is decoupling: Services decouple callers from pod identity, PVCs decouple apps from specific disks, and ConfigMaps/Secrets decouple images from environments — each removes a hard binding so pods can be replaced freely without touching clients, data, or builds.

## pitfalls
- **Writing data to the container filesystem.** Files saved to the writable layer are gone on the next restart, reschedule, or crash — silent data loss that a demo never reveals. Fix: mount a PersistentVolumeClaim for anything that must survive, and treat the local filesystem as disposable scratch only.
- **Baking secrets into the image or committing them to git.** A key compiled into an image leaks through every registry, layer cache, and image pull; a key in git lives forever in history even after you delete the line. Fix: inject credentials from a Secret at runtime, keep them out of the image and repo, and rotate anything that ever touched git.
- **Ignoring the volume reclaim policy.** With the wrong policy, deleting a PVC (or letting the cluster garbage-collect it) can destroy the underlying disk and its data — or leak orphaned volumes you keep paying for. Fix: set `Retain` for data you cannot lose, understand `Delete` before using it, and back up stateful volumes independently.
- **Assuming a pod keeps the same IP.** Pod IPs are ephemeral and reassigned on every reschedule, so hardcoding a pod IP (or DNS caching it forever) breaks the moment the pod moves. Fix: always talk to a Service by its stable name and let it track the live endpoints; never address a pod directly.
- **Exposing pods instead of using a Service/Ingress.** Wiring clients straight to individual pods loses load-balancing and health-aware routing, so one dead pod takes traffic down. Fix: front replicas with a Service, and route external HTTP through an Ingress by host/path rather than publishing each pod.

## interviewTips
- Be crisp about the layering: a **pod** has its own IP but is disposable, a **Service** gives a stable virtual IP that load-balances across replicas, and an **Ingress** routes outside HTTP traffic to Services by host and path. Interviewers want to hear that you never address a pod directly.
- Draw the ephemeral-versus-persistent line explicitly: the container's writable layer is wiped on restart, so durable state needs a **PersistentVolume** bound through a **PersistentVolumeClaim** that re-attaches across reschedules. Name the reclaim policy as the "don't lose the data" detail.
- State the secrets rule as a hard invariant: config in a **ConfigMap**, credentials in a **Secret**, both injected as env vars or mounted files at runtime, never baked into the image. Mentioning that Secrets should back onto a real secret manager in production is the senior signal.

## keyTakeaways
- Pods are disposable and their IPs move — reach them through a Service (stable virtual IP, load-balanced across replicas) and route external HTTP through an Ingress by host and path, never by hardcoding a pod address.
- The container's writable layer is scratch space wiped on every restart; anything that must survive goes on a PersistentVolume claimed via a PVC, which re-attaches as the workload moves and is governed by a reclaim policy.
- Configuration belongs in a ConfigMap and credentials in a Secret, both injected at runtime as env vars or mounted files — so one image runs across every environment and no secret is ever baked into the image or committed to git.

## code.yaml
```yaml
# A PersistentVolumeClaim asks the cluster for durable storage, and a
# Deployment mounts it into the container at a path. Data written under
# /var/lib/app survives pod restarts and reschedules.
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data
spec:
  accessModes:
    - ReadWriteOnce          # one node mounts it read-write at a time
  resources:
    requests:
      storage: 5Gi
  # storageClassName: standard   # omit to use the cluster default class
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: registry.example.com/web:1.4.0
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: data
              mountPath: /var/lib/app   # durable data lives here, not on the writable layer
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: app-data
---
# A Service gives the three replicas one stable name + virtual IP and
# load-balances across whichever pods are healthy.
apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
---
# An Ingress routes external HTTP to Services by host and path.
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
spec:
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-svc
                port:
                  number: 80
```

## code.config
```yaml
# Non-sensitive settings go in a ConfigMap.
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  FEATURE_FLAGS: "search,recommendations"
  config.yaml: |
    cache:
      ttlSeconds: 300
---
# Credentials go in a Secret. Use stringData with PLACEHOLDERS — never a real
# secret, and never commit the populated version to git. stringData is written
# by you in plain text and stored base64-encoded by the API server.
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  API_KEY: "<your-api-key>"
  DB_PASSWORD: "<your-db-password>"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: registry.example.com/web:1.4.0
          env:
            # A single non-sensitive value pulled from the ConfigMap.
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: LOG_LEVEL
            # A credential pulled from the Secret — injected at runtime,
            # never baked into the image.
            - name: API_KEY
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: API_KEY
          volumeMounts:
            # Mount the ConfigMap's config.yaml as a file in the container.
            - name: config-vol
              mountPath: /etc/app
              readOnly: true
      volumes:
        - name: config-vol
          configMap:
            name: app-config
```

## code.bash
```bash
# Create a ConfigMap from literal key/value pairs (non-sensitive config).
kubectl create configmap app-config \
  --from-literal=LOG_LEVEL=info \
  --from-literal=FEATURE_FLAGS=search,recommendations

# Create a Secret from literals. --from-literal keeps the value off your
# shell history less than a file would; use placeholders, never a real key.
kubectl create secret generic app-secrets \
  --from-literal=API_KEY='<your-api-key>' \
  --from-literal=DB_PASSWORD='<your-db-password>'

# Apply the PVC + Deployment + Service + Ingress manifests.
kubectl apply -f manifests/

# Confirm the claim is Bound to a volume (STATUS should read Bound).
kubectl get pvc app-data

# Write some data into the mounted persistent volume from inside a pod.
POD=$(kubectl get pod -l app=web -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$POD" -- sh -c 'echo "order-42" >> /var/lib/app/orders.txt'

# Delete the pod so the Deployment reschedules a fresh one.
kubectl delete pod "$POD"

# On the NEW pod, the persistent data is still there (survives restart),
# while anything written to the container's own filesystem would be gone.
NEWPOD=$(kubectl get pod -l app=web -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$NEWPOD" -- cat /var/lib/app/orders.txt   # -> order-42
```
