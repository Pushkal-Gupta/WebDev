---
slug: grpc-vs-rest
module: system-design
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
A typical microservice graph fires thousands of RPCs per user request. Every saved millisecond and every kilobyte of payload compounds across the fan-out. gRPC's combination of HTTP/2 multiplexing (no head-of-line blocking per TCP connection), protobuf compression, and code-generated stubs (no hand-written client) is why most large engineering orgs use it inside the data center. Outside the data center — public APIs, third-party integrations, browser clients — REST/JSON's debuggability and CDN-friendliness usually win.

## intuition
Think of REST as sending postcards: each request is independent, addressed by URL, body in plain text. Think of gRPC as opening a phone line: an HTTP/2 channel multiplexes many concurrent streams, each carrying a typed method call. Once the line is open, individual calls are cheap, and you can stream in either direction — server-push, client-upload, or full duplex chat.

## visualization
On the wire: a REST call is `GET /users/42` plus a JSON response of `~120` bytes. The same gRPC call is a single HTTP/2 DATA frame carrying a protobuf-encoded `GetUserRequest{id:42}` (~3 bytes) and a response of `~40` bytes. Add 99 more concurrent calls: REST opens up to 6 parallel HTTP/1.1 connections per host and queues the rest; gRPC reuses one HTTP/2 connection with 100 multiplexed streams.

## bruteForce
Build a REST API with JSON and call it from every service. Works fine until you hit: (1) versioning chaos when field names drift, (2) HOL blocking on slow endpoints sharing a connection, (3) hand-written clients per language that fall out of sync with the server, (4) per-request connection setup overhead, (5) no native streaming — you fake it with long-polling or WebSockets.

## optimal
Use gRPC for internal RPC where: latency matters, types matter, polyglot services share contracts, or you need streaming. Use REST/JSON for: public APIs, browser clients, anything that benefits from HTTP caching middleboxes (CDNs, proxies), debugging via `curl`, or third-party developer experience. The hybrid model — gRPC inside, REST/GraphQL at the edge — is the most common production architecture.

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
