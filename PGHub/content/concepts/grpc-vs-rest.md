---
slug: grpc-vs-rest
module: sd-network
title: gRPC vs REST
subtitle: HTTP/2 multiplexing, bidirectional streaming, and contract-first IDL — when gRPC beats JSON-over-HTTP and when it doesn't.
difficulty: Advanced
position: 41
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "gRPC Docs — Core Concepts, Architecture, and Lifecycle"
    url: "https://grpc.io/docs/what-is-grpc/core-concepts/"
    type: blog
  - title: "Protocol Buffers — Programming Guides"
    url: "https://protobuf.dev/programming-guides/proto3/"
    type: blog
  - title: "grpc/grpc — reference implementations across 11 languages"
    url: "https://github.com/grpc/grpc"
    type: repo
status: published
---

## intro
gRPC is a contract-first RPC framework: you define services and methods in a `.proto` file, the compiler generates client and server stubs in every supported language, and calls travel over HTTP/2 with protobuf payloads. REST is the looser web-native style: resources addressed by URL, verbs mapped to HTTP methods, JSON bodies. They overlap, but gRPC wins on internal service-to-service traffic and REST wins on browser-facing or human-debugged APIs.

## whyItMatters
- **Google's internal Stubby** (gRPC's ancestor, predating the 2015 open-source release) carries every internal RPC in their fleet; the published Borg and Spanner papers show gRPC-scale traffic.
- **Netflix, Square, Lyft, Dropbox, and CockroachDB** standardized on gRPC for service-to-service traffic; Lyft authored Envoy partly to be a great gRPC proxy, and **Istio's data plane** assumes HTTP/2.
- **Kubernetes' `kubelet` ↔ `containerd` CRI**, **etcd's client/server protocol**, and **TensorFlow Serving** all expose gRPC because the IDL contract plus streaming primitives fit infrastructure control planes.
- **REST/JSON still wins on the public edge**: GitHub, Stripe, Twilio, and AWS expose REST (or REST-adjacent) APIs because `curl`, browser DevTools, and CDN caching all assume HTTP/1.1 + JSON; the gRPC-Web shim exists precisely because browsers cannot speak raw HTTP/2 trailers.

## intuition
REST and gRPC solve the same problem — "let one process call a method on another" — but optimize for different audiences. REST treats the network as a document store: every resource has a URL, you fetch/create/update/delete it with HTTP verbs, and the payload is human-readable JSON. This is great for humans, browsers, and any caching middlebox that already understands HTTP. The cost: hand-written clients per language, no schema enforcement, and one HTTP/1.1 TCP connection per concurrent request (or, with HTTP/2, multiplexing that JSON doesn't take full advantage of).

gRPC treats the network as a typed function call. You declare your service in a `.proto` file: methods, request types, response types, all strongly typed. `protoc` generates idiomatic client and server stubs in every supported language (C++, Java, Go, Python, Ruby, C#, Node, Swift, Dart, Rust via tonic), so the wire contract is single-source-of-truth and refactor-safe. On the wire, payloads are binary protobuf (3-10× smaller than equivalent JSON), and the transport is HTTP/2 — one connection multiplexes hundreds of concurrent streams without head-of-line blocking, and four streaming modes (unary, server-streaming, client-streaming, bidirectional) give you full duplex on a single TCP connection.

The mental contrast: REST is sending postcards (each request stands alone, addressed by URL, readable by anyone in transit). gRPC is opening a phone line (one channel, many concurrent calls, all typed, all binary). Choose by audience: human or browser → REST; service-to-service inside a data center → gRPC.

## visualization
On the wire: a REST call is `GET /users/42` plus a JSON response of `~120` bytes. The same gRPC call is a single HTTP/2 DATA frame carrying a protobuf-encoded `GetUserRequest{id:42}` (~3 bytes) and a response of `~40` bytes. Add 99 more concurrent calls: REST opens up to 6 parallel HTTP/1.1 connections per host and queues the rest; gRPC reuses one HTTP/2 connection with 100 multiplexed streams.

## bruteForce
Build a REST API with JSON and call it from every service. Works fine until you hit: (1) versioning chaos when field names drift, (2) HOL blocking on slow endpoints sharing a connection, (3) hand-written clients per language that fall out of sync with the server, (4) per-request connection setup overhead, (5) no native streaming — you fake it with long-polling or WebSockets.

## optimal
The right architecture for a modern service org is **hybrid**: gRPC inside the data center for service-to-service, REST (or GraphQL) at the public edge. This matches what Netflix, Lyft, and Square documented in their migration blog posts, and what every Istio-based mesh ships by default. The boundary is a translation layer — `grpc-gateway` (Go), Envoy's `grpc_json_transcoder`, or a thin BFF — that exposes a REST or GraphQL contract externally while speaking gRPC internally.

Within a gRPC service, three production disciplines matter:

```proto
// greeter.proto — contract-first, versioned by package
syntax = "proto3";
package example.v1;

service Greeter {
  rpc Hello(HelloReq) returns (HelloResp);
  rpc HelloStream(HelloReq) returns (stream HelloResp);   // server-stream
}
message HelloReq  { string name = 1; }                    // never reuse field 1
message HelloResp { string message = 1; int64 ts = 2; }
```

**Deadline propagation**: every RPC carries a deadline; gRPC propagates it across hops automatically. Without deadlines, one slow downstream cascades into thread-pool exhaustion across the fleet (the Google SRE book's "deadline propagation" chapter is the canonical reference). **Retry budgets** (gRPC's `retryPolicy`) cap the multiplicative blow-up — without a budget, a partial outage becomes a self-DDoS as every client retries.

**Schema evolution**: protobuf field numbers are permanent. Add fields with new numbers, never renumber, mark deleted fields `reserved`. Wire compatibility (old client + new server, new client + old server) holds as long as you obey this rule. JSON APIs need explicit `Accept-Version` headers or URL versioning to achieve the same guarantee.

**When REST still wins**: public APIs (debugging via `curl`, CDN caching via `Cache-Control` + `ETag`, browser fetch without a shim), webhook receivers (third-party servers send POSTs, not gRPC streams), and admin tooling where humans paste responses into bug reports. RFC 9110 (HTTP semantics) and RFC 8259 (JSON) form a stable, universally-understood contract. The gRPC-Web shim closes the browser gap but adds an Envoy proxy you have to operate, so for a public API consumed by random third parties, REST/JSON is the lower-friction choice.

## complexity
time: gRPC parsing is O(n) over the protobuf bytes; REST/JSON parsing is O(n) plus tokenization overhead — usually 2-5× slower in practice.
space: gRPC payloads run 3-10× smaller than equivalent JSON, depending on field-name length and number density.
notes: HTTP/2 multiplexing removes per-request connection setup; a single channel handles thousands of concurrent in-flight RPCs.

## pitfalls
- Exposing gRPC directly to browsers — they can't speak HTTP/2 trailers natively. Use gRPC-Web with an Envoy/grpc-gateway translation layer.
- Forgetting deadlines. gRPC requires propagating a deadline across hops; without it, a single slow downstream cascades into a thread-pool exhaustion across your fleet.
- Mixing breaking schema changes (renumbering fields, changing wire types) — old clients silently misparse. Add fields, never reuse ids; reserve deleted ones.
- Using server-streaming where polling is simpler — long-lived streams complicate load balancing because L7 LBs route once at stream start, not per message.
- Skipping retry-budget configuration: gRPC's transparent retries can amplify a partial outage into a self-DDoS.

## interviewTips
- Compare on five axes: payload size, transport (HTTP/1.1 vs HTTP/2), schema (loose JSON vs typed IDL), streaming (none vs four modes), tooling (curl vs grpcurl + code gen).
- Name the four streaming modes: unary, server-streaming, client-streaming, bidirectional. The fourth is the headliner — full-duplex on a single TCP connection.
- Volunteer when REST wins: public APIs, browser-first clients, CDN cacheability, easy debugging, no codegen pipeline.
- Mention production realities: deadline propagation, retry budgets, load-balancing at the request level (L7) not connection level (L4), and the gRPC-Web shim for browsers.

## code.python
```python
# greeter.proto:
# service Greeter { rpc Hello (HelloReq) returns (HelloResp); }
import grpc, greeter_pb2, greeter_pb2_grpc

class Greeter(greeter_pb2_grpc.GreeterServicer):
    def Hello(self, req, ctx):
        return greeter_pb2.HelloResp(message=f"hi {req.name}")

# client
with grpc.insecure_channel("localhost:50051") as ch:
    stub = greeter_pb2_grpc.GreeterStub(ch)
    resp = stub.Hello(greeter_pb2.HelloReq(name="Ada"), timeout=2.0)
    print(resp.message)
```

## code.javascript
```javascript
// Using @grpc/grpc-js + protoLoader (Node)
import grpc from "@grpc/grpc-js";
import loader from "@grpc/proto-loader";

const def = loader.loadSync("greeter.proto");
const pkg = grpc.loadPackageDefinition(def).example;

const client = new pkg.Greeter("localhost:50051", grpc.credentials.createInsecure());
const deadline = new Date(Date.now() + 2000);
client.Hello({ name: "Ada" }, { deadline }, (err, resp) => {
  if (err) throw err;
  console.log(resp.message);
});
```

## code.java
```java
// Generated stubs from greeter.proto
import io.grpc.*;
import java.util.concurrent.TimeUnit;

ManagedChannel ch = ManagedChannelBuilder.forAddress("localhost", 50051)
    .usePlaintext().build();
GreeterGrpc.GreeterBlockingStub stub = GreeterGrpc.newBlockingStub(ch)
    .withDeadlineAfter(2, TimeUnit.SECONDS);
HelloResp r = stub.hello(HelloReq.newBuilder().setName("Ada").build());
System.out.println(r.getMessage());
ch.shutdown();
```

## code.cpp
```cpp
// Generated by protoc with grpc_cpp_plugin
#include <grpcpp/grpcpp.h>
#include "greeter.grpc.pb.h"

auto ch = grpc::CreateChannel("localhost:50051", grpc::InsecureChannelCredentials());
auto stub = Greeter::NewStub(ch);

grpc::ClientContext ctx;
ctx.set_deadline(std::chrono::system_clock::now() + std::chrono::seconds(2));

HelloReq req; req.set_name("Ada");
HelloResp resp;
auto status = stub->Hello(&ctx, req, &resp);
// status.ok() -> resp.message()
```
