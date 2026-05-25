---
slug: protocol-buffers
module: sd-network
title: Protocol Buffers
subtitle: Schema-defined binary serialization — varints, tag-length-value framing, and forward/backward compatible evolution.
difficulty: Advanced
position: 40
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Protocol Buffers — Encoding Guide"
    url: "https://protobuf.dev/programming-guides/encoding/"
    type: blog
  - title: "gRPC Docs — Core Concepts"
    url: "https://grpc.io/docs/what-is-grpc/core-concepts/"
    type: blog
  - title: "protocolbuffers/protobuf — reference implementation"
    url: "https://github.com/protocolbuffers/protobuf"
    type: repo
status: published
---

## intro
Protocol Buffers (protobuf) is Google's language-neutral, schema-driven binary serialization format. You declare messages in a `.proto` file, the compiler emits typed stubs in your language, and at runtime those stubs encode payloads that are typically three-to-ten times smaller than equivalent JSON and several times faster to parse. It's the wire format under gRPC, BigTable, and most Google-scale internal RPC.

## whyItMatters
Most service-to-service latency is spent in serialization, not in business logic. JSON is human-readable but redundant: every field name is sent on every message, numbers are stringified, and the parser must allocate transient tokens. Protobuf trades human readability for a compact binary form where field identity is a small integer tag, integers use variable-length encoding, and parsing is a single forward pass. The schema doubles as a contract — adding a field can never break an old client if you follow the rules.

## intuition
JSON sends every field name as a string on every message. For a payload with `{"customer_id": 42, "amount_cents": 1999, "currency": "USD"}`, you ship the strings `customer_id`, `amount_cents`, `currency` plus their values, plus braces, quotes, colons, and commas — 65 bytes for 8 bytes of actual data. Multiply by billions of RPCs in a microservice fleet and the wire-format tax dominates real CPU and bandwidth budgets.

Protobuf's solution: the schema is shared offline (the `.proto` file lives in version control), and on the wire each field is identified by a tiny integer **tag** (the `= 1` in `int32 customer_id = 1`). A protobuf message is a flat stream of records, each consisting of `<tag, wire-type, payload>`. The tag is the declared field number, the wire-type is a 3-bit hint at how to read the payload (varint, fixed-32, fixed-64, length-delimited, or group), and the payload is the encoded value. There are no field names on the wire; the receiver looks the tag up in the shared schema.

Two encoding tricks make protobuf compact. **Varints** encode integers using 7 data bits per byte plus a 1-bit continuation flag, so small numbers (the common case — most ids are < 128) take one byte while large numbers take up to 10 bytes. Tag + wire-type are themselves encoded as a varint with the wire-type in the low 3 bits; field numbers 1-15 produce single-byte tags, which is why hot fields should reserve those ids. **Length-delimited** encoding prefixes strings and nested messages with their length as a varint, so decoders can skip unknown fields without parsing them.

The "skip unknown fields" rule is the secret of **schema evolution**. When you add a new field with a new number, old clients receive the message, see a tag they do not recognize, read the length, and skip the payload — no crash, no data loss. When you remove a field, the old number gets `reserved` so no future field can accidentally reuse it. As long as you never renumber or change wire types, old binaries and new binaries can speak to each other forever. JSON has no equivalent — schema evolution is purely a social contract enforced at the application layer.

The "language-neutral" part means `protoc` generates idiomatic stubs in C++, Java, Python, Go, Rust (via prost), Ruby, C#, Swift, Dart, Kotlin, JavaScript — so one `.proto` file produces refactor-safe APIs in every supported language without duplicating type definitions.

## visualization
Encode `Person { id: 150, name: "Ada" }` where `id` is field 1 (varint) and `name` is field 2 (length-delimited). Bytes: `08 96 01 12 03 41 64 61`. `08` = tag 1, wire-type 0. `96 01` = varint for 150 (little-endian, 7 bits per byte, top bit signals "more"). `12` = tag 2, wire-type 2 (length-delimited). `03` = length 3. `41 64 61` = "Ada". Total: 8 bytes vs ~26 for `{"id":150,"name":"Ada"}`.

## bruteForce
Send JSON. Field names are duplicated in every payload, numbers blow up (`12345` is 5 bytes instead of 2), and parsing requires a tokenizer plus a reflective object builder. Schema is enforced only at the application layer — a typo in a field name silently produces `undefined` on the receiver. Acceptable for browser-facing APIs where humans inspect traffic; wasteful for internal RPC at scale.

## optimal
The optimal approach is **schema-first definition in `.proto`, code-generated stubs via `protoc`, and strict adherence to schema-evolution rules**. The Google protobuf documentation, the protobuf encoding guide, and the gRPC reference implementations are the canonical sources; Buf (buf.build) provides linting, breaking-change detection, and a modern build toolchain.

```proto
syntax = "proto3";
package payments.v1;

// Versioning by package: never break v1; introduce v2 alongside.
message Payment {
  // Field numbers 1-15 cost one byte for tag; reserve them for hot fields.
  int64  id            = 1;
  string customer_id   = 2;
  sint64 amount_cents  = 3;     // sint64 -> zigzag encoding for signed values
  string currency      = 4;     // 3-char ISO 4217
  google.protobuf.Timestamp created_at = 5;

  // Deprecated field: never delete, mark reserved so no future field
  // accidentally reuses the wire-incompatible id.
  reserved 6;
  reserved "old_field_name";

  // New optional fields use field numbers >= 16 (2-byte tags).
  optional string idempotency_key = 16;
}

service PaymentsService {
  rpc CreatePayment(CreatePaymentRequest) returns (Payment);
  rpc StreamPayments(StreamRequest) returns (stream Payment);   // server-stream
}
```

Why this is right: the schema is **single-source-of-truth**, version-controlled, and code-generated into every consumer language, so renames refactor cleanly and the type system catches mismatches at compile time. The wire format is **3-10x smaller than JSON** (Google's published benchmarks; same ratio in the Confluent Avro-vs-JSON-vs-Protobuf studies) and **2-5x faster to parse** because the decoder is a single forward pass over `<tag, wire-type, payload>` records with no tokenizer. Combined with HTTP/2 multiplexing (gRPC) this is why service-to-service traffic inside large microservice fleets consistently chose protobuf since 2016.

**Encoding choices that matter**:
- **`int32` vs `sint32`**: plain `int32` encodes negative values as 10-byte varints (sign-extended); `sint32` uses zigzag encoding so small negatives stay small. Always pick `sint*` for fields that can be negative.
- **`fixed32` / `fixed64`**: 4- and 8-byte fixed-width encodings; use for hashes, large timestamps, and any value where the average bit-length already exceeds the varint break-even point (~3 bytes).
- **`packed = true`** for `repeated` numeric fields (default in proto3): packs all values into one length-delimited block, saving one tag byte per element.

**Schema-evolution rules (non-negotiable)**:
1. **Never renumber an existing field** — the wire tag is its identity. Renaming the field is fine; renumbering breaks every old client.
2. **Never reuse a deleted field number** — mark it `reserved 7;` so the next developer cannot accidentally collide.
3. **Never change a field's wire type** — `int32` and `int64` are wire-compatible (both varint), but `int32` and `sint32` are not (different encodings of negatives), and `string` and `bytes` are length-delimited but semantically different on receive.
4. **Adding fields is always safe** (old clients skip unknown tags), removing fields requires `reserved`, and changing the package or message name is a breaking change.

**Production tooling**:
- **Buf CLI** (`buf lint`, `buf breaking`) enforces these rules in CI, preventing wire-breaking changes from ever merging.
- **`protoc-gen-validate`** generates runtime validation from `.proto` annotations (range, length, regex, custom rules).
- **`protoc-gen-grpc`** plugin generates gRPC stubs alongside message types; **gRPC-Web** plus Envoy's `grpc_json_transcoder` exposes the same `.proto` services to browsers and to JSON-only clients.

**Alternatives to know**: **FlatBuffers** (Google) — zero-copy, no parse step, faster but larger payloads; used in games. **Cap'n Proto** (Kenton Varda, ex-Google) — zero-copy plus RPC, conceptually similar; used by Cloudflare. **Apache Avro** — schema embedded with the data (good for Kafka, where consumers may run different schema versions). Pick protobuf for general service-to-service RPC; FlatBuffers or Cap'n Proto for latency-critical paths; Avro for streaming with schema-evolution-per-message.

## complexity
time: O(n) where n is payload size in bytes; both encode and decode are single passes.
space: O(n) for the output buffer; parsing reuses caller-owned buffers in zero-copy mode.
notes: Wire size for varints is `ceil(bits_needed / 7)`. Field tag occupies `ceil((field_number_bits + 3) / 7)` bytes — that's why ids 1–15 are precious.

## pitfalls
- Renumbering an existing field is a wire-incompatible change — old clients will misread payloads. Use `reserved 7;` instead of deleting.
- Changing a field's type between varint families (int32 ↔ sint32) silently corrupts negative values: signed ints need zigzag encoding (`sint32`), plain `int32` encodes negatives as 10-byte varints.
- Forgetting `repeated` fields are packed by default in proto3 — switching the option later changes the wire layout.
- Treating `optional` as a presence check in proto3 without the `optional` keyword — proto3 defaults to "no presence," so a zero is indistinguishable from "unset."

## interviewTips
- Lead with the wire format: tag + wire-type + payload. Interviewers love the varint walkthrough on field 150.
- Contrast with JSON on three axes: size (3–10×), speed (2–5×), schema enforcement (compile-time vs runtime).
- Mention schema evolution rules — add new fields with new ids, never reuse old ids, mark deleted ones `reserved`. This is the question that separates "read a blog post" from "shipped it."
- Be ready to discuss when *not* to use it: browser-facing APIs, debugging-heavy pipelines, anything a human inspects with `curl`.

## code.python
```python
# person.proto:
# syntax = "proto3";
# message Person { int32 id = 1; string name = 2; repeated string emails = 3; }
import person_pb2

p = person_pb2.Person(id=150, name="Ada", emails=["ada@x.io"])
wire = p.SerializeToString()
print(len(wire), wire.hex())

q = person_pb2.Person()
q.ParseFromString(wire)
assert q.id == 150 and q.name == "Ada"
```

## code.javascript
```javascript
// Using protobufjs (pure JS, no codegen):
import protobuf from "protobufjs";

const root = await protobuf.load("person.proto");
const Person = root.lookupType("Person");

const buf = Person.encode(Person.create({ id: 150, name: "Ada", emails: ["ada@x.io"] })).finish();
console.log(buf.length, Buffer.from(buf).toString("hex"));

const decoded = Person.decode(buf);
console.assert(decoded.id === 150 && decoded.name === "Ada");
```

## code.java
```java
// Generated by protoc from person.proto
import com.example.PersonOuterClass.Person;

Person p = Person.newBuilder()
    .setId(150)
    .setName("Ada")
    .addEmails("ada@x.io")
    .build();

byte[] wire = p.toByteArray();
Person q = Person.parseFrom(wire);
assert q.getId() == 150 && q.getName().equals("Ada");
```

## code.cpp
```cpp
// Generated by protoc from person.proto
#include "person.pb.h"
#include <string>

Person p;
p.set_id(150);
p.set_name("Ada");
p.add_emails("ada@x.io");

std::string wire;
p.SerializeToString(&wire);

Person q;
q.ParseFromString(wire);
// q.id() == 150, q.name() == "Ada"
```
