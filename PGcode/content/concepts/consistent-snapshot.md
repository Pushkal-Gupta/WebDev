---
slug: consistent-snapshot
module: cs-core
title: Chandy-Lamport Consistent Snapshot
subtitle: Capture a coherent global state of a distributed system without pausing it, using marker messages along FIFO channels.
difficulty: Advanced
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Operating Systems: Three Easy Pieces"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Jepsen — Distributed-systems consistency analyses"
    url: "https://jepsen.io/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A consistent global snapshot is a record of every process's local state and every in-flight channel message that, together, could have actually existed at some moment of the distributed computation. Chandy and Lamport's 1985 algorithm produces one without halting any process, without a global clock, and without missing or double-counting messages — provided channels are reliable and FIFO. It is the conceptual backbone behind Flink's exactly-once checkpoints, Kafka Streams' state checkpointing, MillWheel, Spanner's snapshot reads, and every modern stream processor.

## whyItMatters
"What is the current state of the system?" has no obvious meaning in a distributed setting — there is no shared clock and processes communicate by asynchronous messages. Without a principled snapshot, you cannot do checkpointing for recovery, garbage-collect causally past state, detect stable properties like deadlock or termination, or report consistent metrics like "how much money is in the system right now." Chandy-Lamport gives a snapshot that, while it may not equal any wall-clock instant, is *equivalent* to one — and that is exactly what recovery and detection algorithms need.

## intuition
Pick one process to initiate. It records its own state, then sends a special `MARKER` message along every outgoing channel before it sends any further application message. When any other process p receives a `MARKER` along channel c for the first time, it records its state, marks the state of c as empty, then sends `MARKER` along all its outgoing channels. For every other incoming channel c', p starts recording the messages that arrive on c' until a marker arrives there; those recorded messages become the channel state for c'. When markers have flowed along every channel, the union of process states plus channel states is the consistent snapshot. FIFO channels are the crucial assumption: the marker acts as a clean delimiter between "before snapshot" and "after snapshot" messages on each channel.

## visualization
Three processes A, B, C with FIFO channels in both directions between every pair. A initiates: records `S_A`, sends `MARKER` to B and to C. B is the first to receive a marker (from A). B records `S_B`, declares channel A->B empty, and sends markers to A and to C. Now suppose application message `m` was sent by C to B before C had received any marker. If `m` arrived at B after the marker from A but before the marker from C, then `m` is recorded as part of channel state C->B. When C receives a marker (say from A), it records `S_C`, marks A->C as empty, and sends markers onward. Once every channel has carried exactly one marker, the snapshot {S_A, S_B, S_C, channel states} is complete and consistent.

## bruteForce
Stop the world. Tell every process to halt, drain all in-flight messages, ask each to report its state, then resume. This is correct but unacceptable in any production system — it freezes throughput, requires global coordination, and assumes you can even detect "all messages drained," which itself is the problem you started with. The whole point of Chandy-Lamport is that you never have to pause anyone.

## optimal
The marker protocol above runs concurrently with the application. Each process has O(channels) local bookkeeping. The snapshot is *causally consistent*: if event e_2 is recorded in the snapshot and e_1 happens-before e_2 (in Lamport's sense), then e_1 is also in the snapshot. The snapshot is *not* necessarily equal to any real instantaneous global state — but it is reachable from some initial global state by replaying recorded messages, which is all you need for recovery, deadlock detection, or stable-property evaluation. Multiple initiators may run the algorithm concurrently; tag each snapshot with a unique id so markers and recordings do not collide.

## complexity
time: O(E) marker messages where E is the number of directed channels. Each channel carries exactly one marker per snapshot. Latency from initiation to completion is bounded by the diameter of the channel graph times the slowest channel delivery time.
space: O(V + E) — one state record per process plus the recorded messages buffered per incoming channel until that channel's marker arrives.
notes: Memory pressure spikes if one channel's marker is slow — the receiving process keeps buffering messages on every other in-channel until done. In practice, implementations cap the buffer or fall back to "stop the affected operator and snapshot synchronously" (Flink's aligned checkpoint mode does both).

## pitfalls
- Channels must be FIFO and reliable. Apply Chandy-Lamport directly over UDP or over a load-balanced pool of TCP connections and the marker stops being a clean delimiter.
- The snapshot is not "the current state." Reporting it as such to product stakeholders is a common confusion — say "a state the system could have been in" instead.
- Recording channel state means buffering, not snapshotting the wire. Forgetting to switch on recording before the next message arrives loses messages.
- Multiple concurrent initiators need snapshot IDs on markers and recordings. Without IDs, two snapshots interleave and both are corrupted.
- Process failures during snapshot collection require either restarting the snapshot or merging partial results — neither is in the original paper. Production systems (Flink) layer a barrier alignment + acknowledgement protocol on top.

## interviewTips
- Name the FIFO assumption first — it is the single most important precondition and the most common follow-up question.
- Draw three processes and channels on the whiteboard. Walk through one marker propagation. Interviewers grade the explanation more than the code.
- Connect it to a real system: "Flink checkpoints are Chandy-Lamport with barriers along the dataflow DAG." This signals applied knowledge.
- Be ready to contrast with Lamport timestamps and vector clocks — those order events; snapshots capture state. Different tools, same paper trail.

## code.python
```python
class Process:
    def __init__(self, pid, out_channels):
        self.pid = pid
        self.state = None
        self.out_channels = out_channels
        self.recorded_state = None
        self.recording = {}
        self.marker_seen = set()

    def initiate_snapshot(self):
        self.recorded_state = self.state
        for c in self.out_channels:
            for other in self.out_channels:
                self.recording[other] = []
            c.send(("MARKER", self.pid))
        self.marker_seen = set(self.out_channels)

    def on_message(self, channel, msg):
        if msg == ("MARKER", "snap-id"):
            if not self.recorded_state:
                self.recorded_state = self.state
                self.recording = {c: [] for c in self.in_channels if c != channel}
                for c in self.out_channels:
                    c.send(("MARKER", "snap-id"))
            else:
                channel_state = self.recording.pop(channel, [])
                save(channel, channel_state)
        else:
            if channel in self.recording:
                self.recording[channel].append(msg)
            self.apply(msg)
```

## code.javascript
```javascript
class Process {
  constructor(id, outChannels, inChannels) {
    this.id = id;
    this.state = null;
    this.outChannels = outChannels;
    this.inChannels = inChannels;
    this.recorded = null;
    this.recording = new Map();
  }

  initiate(snapId) {
    this.recorded = structuredClone(this.state);
    for (const c of this.inChannels) this.recording.set(c, []);
    for (const c of this.outChannels) c.send({ type: "MARKER", snapId });
  }

  onMessage(channel, msg) {
    if (msg.type === "MARKER") {
      if (this.recorded === null) this.initiate(msg.snapId);
      else this.saveChannelState(channel, this.recording.get(channel) ?? []);
      this.recording.delete(channel);
    } else {
      if (this.recording.has(channel)) this.recording.get(channel).push(msg);
      this.apply(msg);
    }
  }
}
```

## code.java
```java
class SnapshotProcess {
    int id;
    Object state;
    List<Channel> in, out;
    Object recordedState;
    Map<Channel, List<Object>> recording = new HashMap<>();

    void initiate(String snapId) {
        recordedState = deepCopy(state);
        for (Channel c : in) recording.put(c, new ArrayList<>());
        for (Channel c : out) c.send(new Marker(snapId));
    }

    void onMessage(Channel channel, Object msg) {
        if (msg instanceof Marker m) {
            if (recordedState == null) initiate(m.snapId);
            else saveChannelState(channel, recording.getOrDefault(channel, List.of()));
            recording.remove(channel);
        } else {
            if (recording.containsKey(channel)) recording.get(channel).add(msg);
            apply(msg);
        }
    }
}
```

## code.cpp
```cpp
struct Marker { std::string snap_id; };

class SnapshotProcess {
    int id;
    std::any state;
    std::vector<Channel*> in, out;
    std::optional<std::any> recorded_state;
    std::unordered_map<Channel*, std::vector<std::any>> recording;

public:
    void initiate(const std::string& snap_id) {
        recorded_state = state;
        for (auto* c : in) recording[c] = {};
        for (auto* c : out) c->send(Marker{snap_id});
    }

    void on_message(Channel* channel, std::any msg) {
        if (auto* m = std::any_cast<Marker>(&msg)) {
            if (!recorded_state) initiate(m->snap_id);
            else save_channel_state(channel, recording[channel]);
            recording.erase(channel);
        } else {
            if (recording.count(channel)) recording[channel].push_back(msg);
            apply(msg);
        }
    }
};
```
