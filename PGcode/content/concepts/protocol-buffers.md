---
slug: protocol-buffers
module: system-design
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
A protobuf message is a flat stream of `<tag, wire-type, payload>` records. The tag is the field's numeric id you declared (`name = 1`), the wire-type is a 3-bit hint at how to read the payload (varint, fixed-32, fixed-64, length-delimited), and the payload is the value. Unknown tags are skipped, not rejected — that's the magic behind backward compatibility. New fields are simply unknown to old code.

## visualization
Encode `Person { id: 150, name: "Ada" }` where `id` is field 1 (varint) and `name` is field 2 (length-delimited). Bytes: `08 96 01 12 03 41 64 61`. `08` = tag 1, wire-type 0. `96 01` = varint for 150 (little-endian, 7 bits per byte, top bit signals "more"). `12` = tag 2, wire-type 2 (length-delimited). `03` = length 3. `41 64 61` = "Ada". Total: 8 bytes vs ~26 for `{"id":150,"name":"Ada"}`.

## bruteForce
Send JSON. Field names are duplicated in every payload, numbers blow up (`12345` is 5 bytes instead of 2), and parsing requires a tokenizer plus a reflective object builder. Schema is enforced only at the application layer — a typo in a field name silently produces `undefined` on the receiver. Acceptable for browser-facing APIs where humans inspect traffic; wasteful for internal RPC at scale.

## optimal
Define the schema once in `.proto`, run `protoc` to generate strongly typed accessors per language. At runtime, serialization is a memcpy-style loop over field tags. Use varints for small integers (most ids are < 128 and fit in one byte), fixed-width for already-large numbers (hashes, timestamps in nanos), and length-delimited for strings and nested messages. Reserve field numbers 1–15 for hot fields — they encode their tag in a single byte.

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
