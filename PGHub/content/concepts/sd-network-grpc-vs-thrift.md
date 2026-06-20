---
slug: sd-network-grpc-vs-thrift
module: sd-network
title: gRPC vs Apache Thrift
subtitle: Two contenders for typed cross-language RPC — gRPC's HTTP/2 + Protobuf vs Thrift's binary protocol family. The choice that defines a polyglot stack.
difficulty: Intermediate
position: 70
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Data encoding chapter"
    url: "https://dataintensive.net/"
    type: book
  - title: "gRPC docs — overview & quickstart"
    url: "https://grpc.io/docs/"
    type: blog
  - title: "apache/thrift — reference implementation"
    url: "https://github.com/apache/thrift"
    type: repo
status: published
---

## intro
**gRPC** (Google, 2015) and **Apache Thrift** (Facebook, 2007) both solve the same problem: define a service in an IDL, generate client + server stubs in multiple languages, exchange data over a binary protocol. gRPC won mindshare post-2018 thanks to HTTP/2 streaming + Protobuf evolution + Google's distribution. Thrift remains entrenched in older shops (Twitter, Pinterest, Uber's early stack).

## whyItMatters
- **Polyglot service stack**: when services are written in Python, Java, Go, Rust, the alternative is hand-coded REST clients in every language. RPC frameworks generate them.
- **Performance**: binary protocols are 5-10x smaller + faster to parse than JSON. Critical at high QPS.
- **Schema enforcement**: typed IDL catches breaking changes at build time, not runtime.
- **Streaming**: gRPC supports bidirectional streaming natively; Thrift's streaming requires extensions.

## intuition
**gRPC**:
- **IDL**: `.proto` file (Protocol Buffers).
- **Wire format**: Protobuf binary.
- **Transport**: HTTP/2 (multiplexed streams, header compression).
- **Streaming**: 4 modes — unary, server-streaming, client-streaming, bidirectional.
- **Lang support**: 11+ first-party, dozens via community.

**Thrift**:
- **IDL**: `.thrift` file.
- **Wire format**: TBinary, TCompact, TJSON (configurable).
- **Transport**: TSocket, THttpClient, others.
- **Streaming**: not native; via extensions.
- **Lang support**: ~25 first-party (broader than gRPC originally).

**Cross-cutting concerns**:
- Both support backward/forward compatibility via field numbers + optional fields.
- Both generate client + server stubs.
- gRPC has richer ecosystem (interceptors, deadlines, retries, balancers built-in).

## visualization
```
gRPC flow (HTTP/2 multiplexed):

  Client ─────── HTTP/2 connection ─────── Server
    │                                         │
    ├─ stream 1 ─ request frame ────────────→ │
    │            ←─── response frame ──────── │
    │                                         │
    ├─ stream 3 ─ request frame ────────────→ │
    │            ←─── response frame ──────── │
    │                                         │
    └─ stream 5 ─ bidirectional stream ←──→  │
                                              │
  Single TCP connection, multiple parallel streams,
  HPACK header compression, multiplexed without head-of-line blocking.

Thrift flow (typically one TCP socket per call):

  Client ─── TCP ───→ Server
  send TBinary frame
  receive response
  close (or keep-alive)

  No multiplexing in classic mode; one-call-per-connection or pooled.
  TNonblockingServer + TFramedTransport adds some concurrency.
```

## bruteForce
**Hand-rolled JSON over HTTP/1**: works at small scale; verbose, slow, brittle when schemas evolve.

**XML-RPC / SOAP**: legacy; verbose envelope; poor performance.

**Hand-coded binary protocol**: avoids deps but invents your own (poorly).

A typed RPC framework is the standard answer for polyglot stacks.

## optimal
**Pick gRPC if**:
- New project; want default streaming support.
- HTTP/2 features matter (server push, header compression).
- Heavy ecosystem investment (Kubernetes, Istio service mesh, Envoy all gRPC-aware).
- Need browser support via gRPC-Web.

**Pick Thrift if**:
- Existing infra is Thrift (don't migrate just because gRPC is newer).
- Need a transport other than HTTP (raw TCP, named pipes).
- Need TJSON output for web clients without gRPC-Web.

**Both flavors**:
- Define IDL → generate stubs in each language → version your IDL via git.
- Use field numbers (not names) for forward/backward compat.
- Always mark new fields as optional with sensible defaults.

**Protobuf schema evolution rules**:
- Never reuse field numbers for different types.
- Never change `repeated` ↔ `singular`.
- Adding fields is safe.
- Renaming fields is safe (wire format uses numbers, not names).
- Removing a required field breaks old clients — reserve the number.

**gRPC-Web**: lets browsers call gRPC services via Envoy proxy that translates gRPC ↔ HTTP/1.1.

**REST + Protobuf**: a middle ground — use Protobuf as the body format, HTTP/1.1 as transport. Loses streaming, gains REST tooling.

## complexity
- **Latency**: gRPC + Protobuf ~0.5ms encode + 0.5ms decode per call; ~10x faster than JSON.
- **Bandwidth**: Protobuf typically 30-50% the size of equivalent JSON.
- **Throughput**: HTTP/2 multiplexing → 5-10x more RPS per TCP connection vs HTTP/1.1.
- **Build complexity**: IDL compilation step; stubs must be regenerated on schema changes.

## pitfalls
- **Reusing a field number for a different type.** Old clients deserialize using the old type → silent corruption. Fix: use the `reserved` keyword in the .proto to mark abandoned numbers and field names.
- **Required fields in Protobuf.** Proto3 dropped `required` because it makes forward-compat hard. Fix: model "required" via validation logic in the service layer; default-or-throw at parse time.
- **gRPC deadlines not propagated.** A deep call chain without deadline propagation can leave servers waiting indefinitely after the original caller gave up. Fix: configure all interceptors to propagate the `grpc-deadline` from incoming context to outgoing calls.
- **TCP keepalive disabled.** Default HTTP/2 settings can let an idle connection get killed by a NAT box → 30s+ stalls on the next call. Fix: configure gRPC keepalive (`KEEPALIVE_TIME_MS`, `KEEPALIVE_TIMEOUT_MS`).
- **Streaming without flow control.** Pumping unbounded streams over gRPC can OOM the server. Fix: cap message size; use backpressure via `BlockingStream` patterns; chunk large payloads.
- **Thrift binary protocol mixed with framed/non-framed.** Mismatch hangs. Fix: lock client + server to the SAME protocol + transport combo (`TBinaryProtocol` + `TFramedTransport` is the common choice).

## interviewTips
- For "design a typed RPC layer for our polyglot stack" → gRPC for new projects, Thrift only if existing.
- Cite **Protobuf field-number compat** as the schema-evolution mechanism.
- For senior interviews, discuss **HTTP/2 multiplexing + HPACK**, **streaming modes**, **gRPC-Web for browser**, **service mesh integration** (Envoy, Istio), **alternative IDLs** (Cap'n Proto, FlatBuffers for zero-copy).

## code.python
```python
# gRPC: define service in .proto, generate stubs, then:
import grpc
from helloworld_pb2 import HelloRequest
from helloworld_pb2_grpc import GreeterStub

channel = grpc.insecure_channel('localhost:50051')
stub = GreeterStub(channel)
response = stub.SayHello(HelloRequest(name='Alice'), timeout=5.0)
print(response.message)
```

## code.javascript
```javascript
// gRPC-Node
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync('helloworld.proto');
const proto = grpc.loadPackageDefinition(packageDef).helloworld;

const client = new proto.Greeter('localhost:50051', grpc.credentials.createInsecure());
client.sayHello({ name: 'Alice' }, { deadline: new Date(Date.now() + 5000) }, (err, resp) => {
  if (err) throw err;
  console.log(resp.message);
});
```

## code.java
```java
// gRPC-Java
ManagedChannel channel = ManagedChannelBuilder.forAddress("localhost", 50051).usePlaintext().build();
GreeterGrpc.GreeterBlockingStub stub = GreeterGrpc.newBlockingStub(channel)
    .withDeadlineAfter(5, TimeUnit.SECONDS);
HelloReply reply = stub.sayHello(HelloRequest.newBuilder().setName("Alice").build());
System.out.println(reply.getMessage());
channel.shutdown();
```

## code.cpp
```cpp
// gRPC-C++
auto channel = grpc::CreateChannel("localhost:50051", grpc::InsecureChannelCredentials());
auto stub = helloworld::Greeter::NewStub(channel);
helloworld::HelloRequest req; req.set_name("Alice");
helloworld::HelloReply reply;
grpc::ClientContext ctx;
ctx.set_deadline(std::chrono::system_clock::now() + std::chrono::seconds(5));
auto status = stub->SayHello(&ctx, req, &reply);
if (status.ok()) std::cout << reply.message() << std::endl;
```
