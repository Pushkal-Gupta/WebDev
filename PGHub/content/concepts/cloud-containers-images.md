---
slug: cloud-containers-images
module: cloud-containers
title: Container Images and Layers
subtitle: How a stack of read-only layers becomes a running container, why rebuilds reuse cached work, and how the kernel keeps one machine's processes apart.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 15
prereqs: []
relatedProblems: []
references:
  - title: "Docker — What is an image?"
    url: "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/"
    type: article
  - title: "Docker — Build cache"
    url: "https://docs.docker.com/build/cache/"
    type: article
  - title: "Docker — Dockerfile reference"
    url: "https://docs.docker.com/reference/dockerfile/"
    type: spec
  - title: "man7 — namespaces(7)"
    url: "https://man7.org/linux/man-pages/man7/namespaces.7.html"
    type: spec
  - title: "man7 — cgroups(7)"
    url: "https://man7.org/linux/man-pages/man7/cgroups.7.html"
    type: spec
status: published
---

## intro
A container image is a packaged, read-only blueprint of a filesystem plus the metadata needed to start a process from it; a container is one running instance of that blueprint. The image is built as a stack of layers, each layer a set of filesystem changes recorded when one build step ran. When you launch a container the runtime stacks those read-only layers into a single view and adds one thin writable layer on top for anything the process changes at runtime. This lesson walks that model end to end: how images differ from virtual machines, how layers and the union filesystem combine, how a Dockerfile turns instructions into cached layers, and how Linux namespaces and cgroups keep containers isolated.

## whyItMatters
Almost every modern deployment ships as a container, so understanding the image model is understanding how your code actually reaches production. Knowing that images are layered and cached tells you why reordering two lines in a Dockerfile can turn a ten-minute rebuild into a ten-second one, and why a careless `COPY . .` early on throws away the cache for everything after it. Knowing that a container is just a thin writable layer over shared read-only layers explains why fifty containers from the same image cost far less disk than fifty virtual machines, and why data written inside a container vanishes when the container is removed unless you mount a volume. And knowing that isolation comes from kernel namespaces and cgroups — not a separate guest operating system — explains both the speed advantage and the weaker security boundary compared to a VM. These are the facts behind slow builds, bloated images, lost data, and "it works on my machine" bugs.

## intuition
Start with the difference between a **virtual machine** and a **container**, because it drives everything else. A virtual machine emulates a whole computer: a hypervisor gives it virtual hardware, and on top of that runs a complete **guest operating system** with its own kernel, before your application even starts. That is heavy and slow to boot, but strongly isolated — each VM believes it owns a private machine. A container skips all of that. It shares the **host's kernel** and only packages the userspace files your program needs — libraries, a runtime, your code. There is no guest kernel to boot, so a container starts in milliseconds and weighs megabytes instead of gigabytes. The trade is a thinner isolation boundary: everyone shares one kernel.

Now the **image versus container** distinction. Think of an image as a class and a container as an object created from it. The image is a read-only template — a frozen filesystem plus a bit of config saying which command to run. You can start many containers from one image, and each gets its own **thin writable layer** stacked on top of the shared read-only image. Reads fall through to the image layers below; writes land in the container's private top layer. This is **copy-on-write**: modifying a file copies it up into the writable layer first, leaving the original image untouched. Delete the container and its writable layer disappears; the image is unchanged and ready to start the next one.

The image itself is not one blob — it is a stack of **layers**, each produced by one build step. A base layer might be a minimal Linux userspace; the next installs dependencies; the next adds your application code. A **union filesystem** merges these stacked layers into a single directory tree, with upper layers shadowing files of the same path below. Because each layer is content-addressed and immutable, layers are **shared** across images and cached across rebuilds — two images built from the same base literally reuse the same base layer on disk.

Finally, why a container feels isolated at all. The kernel provides **namespaces**, which give a process its own private view of a global resource: a PID namespace so it sees its own process tree starting at PID 1, a network namespace with its own interfaces, a mount namespace with its own filesystem view, plus UTS (hostname), IPC, and user namespaces. Alongside them, **cgroups** cap how much CPU, memory, and I/O the container may consume. Namespaces control what a container can *see*; cgroups control how much it can *use*.

## visualization
```
  DOCKERFILE                     IMAGE (read-only layers)          RUNNING CONTAINER
  ----------                     ------------------------          -----------------

  FROM debian:slim   ---------> [ L0  base OS userspace ]  <--+
  RUN apt-get deps   ---------> [ L1  system packages   ]     |  shared, read-only
  COPY package.json  ---------> [ L2  dependency manifest]     |  (many containers
  RUN install deps   ---------> [ L3  installed modules  ]     |   reuse these)
  COPY . .           ---------> [ L4  application code   ]  <--+
  CMD ["node","app"] ---------> (metadata: entrypoint/cmd)
                                                                +--------------------+
                                 union mount merges L0..L4 ---> |  L5 WRITABLE LAYER  |  <- per container,
                                 into one filesystem view       |  copy-on-write, temp |     lost on rm
                                                                +--------------------+
```

## bruteForce
The naive, heavyweight-VM way to ship an application is to give it a whole virtual machine: provision a full guest operating system, install a kernel, boot it, then layer your runtime and code on top. Each deployed copy is a multi-gigabyte disk image that takes tens of seconds to boot and reserves fixed CPU and memory whether or not it is busy. Running ten instances means ten complete guest OSes duplicated on disk and in RAM, with no sharing between them. Any change — even a one-line code fix — means rebuilding or re-imaging the whole guest and redistributing gigabytes. It is strongly isolated but wasteful, slow to start, and painful to update at scale.

## optimal
The layered-image approach removes almost all of that duplication. An image is built as an ordered stack of **immutable, content-addressed layers**, where each layer records only the filesystem changes made by one build step. A **union (overlay) filesystem** stacks these layers at runtime into a single merged view — lower layers provide the base, upper layers add or shadow files — so the container sees one coherent filesystem without any layer being physically copied. Because layers are identified by the hash of their contents, identical layers are **stored once and shared** across every image and every container that references them: fifty containers from one image share the same read-only layers on disk, and each adds only a tiny private **writable layer** for its runtime changes via copy-on-write.

This same immutability powers **build caching**. When you rebuild, the builder walks the Dockerfile step by step and, for each instruction, checks whether an identical layer already exists — same base, same command, same inputs. If nothing that feeds a step has changed, it reuses the cached layer instead of re-running the work; the first step whose inputs changed **invalidates the cache from that point up**, and only that step and the steps above it rebuild. This is why layer ordering matters so much: put the things that rarely change (base image, dependency install) low in the file and the things that change every commit (your source code) high, so a code edit only rebuilds the top layer and reuses the expensive dependency layers below.

Isolation is provided cheaply by the **host kernel** rather than a guest OS. Each container runs in its own set of **namespaces** — PID (its own process tree), network (its own interfaces and ports), mount (its own filesystem view), UTS (its own hostname), IPC, and user (its own UID mapping) — so it sees a private slice of the machine. **Cgroups** then bound the resources it may consume: CPU shares, a memory ceiling, and I/O limits, enforced by the kernel. The result starts in milliseconds, weighs megabytes, shares layers on disk, and rebuilds incrementally — everything the full-VM approach could not do.

## complexity
time: A rebuild is proportional to the number of layers *at or above* the first changed instruction, not the whole file — a well-ordered Dockerfile turns a code-only change into rebuilding a single top layer while every dependency layer below is a cache hit. Container startup is milliseconds because there is no guest kernel to boot; the runtime just sets up namespaces and cgroups and mounts the union filesystem.
space: On disk, distinct layers are stored once and shared, so `N` containers from one image cost roughly `image_size + N · (small writable delta)` rather than `N · image_size`. In memory, containers share the host kernel and page-cache of common read-only layers, so per-container overhead is dominated by the process itself, not a duplicated OS.
notes: The dominant lever is **layer ordering and cache reuse**. Stable, expensive steps low; volatile, cheap steps high. Bloated images and slow builds almost always trace back to invalidating the cache early (copying all source before installing dependencies) or baking build tooling into the final layer instead of using a multi-stage build.

## pitfalls
- **Copying source before installing dependencies.** A `COPY . .` placed above the dependency install means every source edit changes an early layer and invalidates the cached dependency layers above it, forcing a full reinstall on every build. Fix: copy only the dependency manifest (`package.json`, `requirements.txt`, `go.mod`) and install *first*, then `COPY . .` afterward so code changes only rebuild the top layer.
- **Assuming data in a container persists.** Everything written at runtime lands in the container's ephemeral writable layer, which is destroyed when the container is removed. Fix: mount a named volume or bind mount for anything that must outlive the container (databases, uploads, logs), and never treat the writable layer as durable storage.
- **Treating a container like a lightweight VM.** Containers share the host kernel, so they are isolated by namespaces and cgroups, not by a hardware boundary — a kernel exploit or a `--privileged` flag can cross the line a VM would hold. Fix: for hostile multi-tenant workloads use stronger sandboxing (a VM or a sandboxed runtime), run as a non-root user, and drop unneeded capabilities.
- **Fat final images from single-stage builds.** Installing compilers and build tools in the same stage that ships means all of that tooling ends up baked into the runtime image, bloating it and widening the attack surface. Fix: use a multi-stage build — compile in a builder stage, then `COPY --from=builder` only the produced artifact into a slim runtime base.
- **Expecting `latest` to be reproducible.** `FROM node:latest` resolves to different content over time, so a build that passed yesterday can break today and the cache silently invalidates when the tag moves. Fix: pin to a specific version or digest (`node:20.11-slim` or `node@sha256:...`) so builds are deterministic.

## interviewTips
- Draw the distinction crisply: a VM virtualizes hardware and boots a full guest OS with its own kernel (strong isolation, heavy, slow), while a container shares the host kernel and packages only userspace (millisecond start, megabytes, thinner boundary). Then say the isolation mechanism out loud — **namespaces** for what it sees, **cgroups** for what it can use.
- Explain image-versus-container as template-versus-instance: an image is a read-only stack of content-addressed layers; a container is that stack plus a private copy-on-write writable layer. This is why many containers from one image are cheap and why writes vanish on removal without a volume.
- Nail the caching story with an ordering example: put base image and dependency install low, source high, so a code change only rebuilds the top layer. If asked why a build is slow, the answer is almost always that an early `COPY` invalidates the cache for the expensive steps above it.

## keyTakeaways
- A container shares the **host kernel** and packages only userspace, so it starts in milliseconds and weighs megabytes, whereas a VM boots a full guest OS — the trade is speed and density against a thinner isolation boundary.
- An **image** is an immutable, content-addressed **stack of layers** merged by a union filesystem; a **container** adds one thin **copy-on-write writable layer** on top, so layers are shared on disk and runtime writes are ephemeral unless mounted to a volume.
- Build speed hinges on **layer ordering and cache reuse** — stable expensive steps low, volatile cheap steps high — and isolation comes from Linux **namespaces** (private view) plus **cgroups** (resource limits), not a separate operating system.

## code.dockerfile
```dockerfile
# syntax=docker/dockerfile:1
# Multi-stage build. Layer order is chosen so a code-only change
# rebuilds just the top layers and reuses the dependency cache below.

# ---- Stage 1: build (heavy tooling lives only here) ----
FROM node:20.11-slim AS builder
WORKDIR /app

# Copy ONLY the dependency manifests first. These change rarely, so
# the expensive install below stays a cache hit across code edits.
COPY package.json package-lock.json ./
RUN npm ci

# Now bring in the source. Editing app code invalidates from here up,
# but the installed-modules layer above is still reused.
COPY . .
RUN npm run build

# ---- Stage 2: runtime (slim, no compilers shipped) ----
FROM node:20.11-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user to shrink the blast radius of a compromise.
USER node

# Copy ONLY the built artifact and production deps from the builder,
# leaving all build tooling behind in the discarded builder stage.
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/app.js"]
```

## code.bash
```bash
# Build the image and tag it. Each Dockerfile instruction becomes a layer;
# unchanged early layers are pulled from cache on later builds.
docker build -t ${REGISTRY:-<registry>}/webapp:1.0 .

# Rebuild after a code-only edit: watch "CACHED" on the base + deps layers,
# only the COPY-source and build layers actually re-run.
docker build -t ${REGISTRY:-<registry>}/webapp:1.1 .

# Run a container: its own PID/net/mnt namespaces, memory + CPU capped by cgroups.
docker run --rm -d --name web \
  --memory=256m --cpus=0.5 \
  -p 8080:3000 \
  -v webdata:/app/data \
  ${REGISTRY:-<registry>}/webapp:1.1

# List local images (each is a stack of shared, content-addressed layers).
docker images

# Inspect the layer history of an image: one row per build instruction,
# with the size each layer added to the stack.
docker history ${REGISTRY:-<registry>}/webapp:1.1

# Show the running container and its resource limits.
docker stats --no-stream web
```

## code.yaml
```yaml
# docker-compose.yml — declare the app plus a database as isolated services.
# Each service is its own container (own namespaces); the named volume
# persists data beyond any single container's ephemeral writable layer.
services:
  web:
    image: ${REGISTRY:-<registry>}/webapp:1.1
    build: .
    ports:
      - "8080:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://app@db:5432/app
    depends_on:
      - db
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 256M

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_DB: app
    volumes:
      - dbdata:/var/lib/postgresql/data

volumes:
  webdata:
  dbdata:
```
