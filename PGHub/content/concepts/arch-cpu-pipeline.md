---
slug: arch-cpu-pipeline
module: computer-architecture
title: The CPU Instruction Pipeline
subtitle: Why a processor executes instructions in overlapping stages — the classic 5-stage RISC pipeline (fetch, decode, execute, memory, write-back), how overlap multiplies throughput, and how hazards force stalls and bubbles.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "Patterson & Hennessy — Computer Organization and Design, Ch. 4: The Processor (Pipelining)"
    url: "https://www.elsevier.com/books/computer-organization-and-design-risc-v-edition/patterson/978-0-12-820331-6"
    type: book
  - title: "Agner Fog — The Microarchitecture of Intel, AMD and VIA CPUs"
    url: "https://www.agner.org/optimize/microarchitecture.pdf"
    type: article
  - title: "Bryant & O'Hallaron — Computer Systems: A Programmer's Perspective, Ch. 4: Processor Architecture"
    url: "http://csapp.cs.cmu.edu/"
    type: book
  - title: "Wikipedia — Classic RISC pipeline"
    url: "https://en.wikipedia.org/wiki/Classic_RISC_pipeline"
    type: article
status: published
---

## intro
A processor does not do one thing at a time. Executing a single machine instruction is really several smaller jobs stitched together: read the instruction from memory, work out what it means, do the arithmetic, touch data memory if needed, and record the result. Run them strictly one after another and the hardware doing each job sits idle most of the time. A **pipeline** fixes that waste by starting the next instruction before the current one has finished — the same trick an assembly line uses. This is the single most important idea in how modern CPUs go fast.

## whyItMatters
Pipelining is why a chip clocked at a few gigahertz can retire roughly one instruction every cycle instead of one every five. Almost every performance story in a modern machine — branch misprediction penalties, load-use latency, why tight dependent chains run slower than independent ones, why compilers reorder instructions — traces straight back to the pipeline and its hazards. If you profile code, tune a hot loop, reason about `-O2` output, or answer a systems interview question, the pipeline is the mental model that makes the numbers make sense. It also explains a deep architectural truth: overlap improves **throughput**, not the time to finish any one instruction, and that distinction governs how you think about latency versus bandwidth everywhere in computing.

## intuition
Picture doing laundry for five roommates. Each load goes through four machines in order: wash, dry, fold, put away. If you insist on finishing one person's laundry completely before starting the next — wash, dry, fold, put away, and only then touch load two — three of your four machines sit idle at every moment. The sensible thing is obvious: the instant the first load leaves the washer, start the second load washing while the first one dries. Now all four machines run at once, each on a different load. You did not make any single load finish faster — a load still passes through all four machines — but loads now *complete* far more often. That is pipelining, and throughput, in one picture.

A CPU splits instruction execution into stages the same way. The classic RISC pipeline uses five: **IF** (instruction fetch — read the instruction from memory), **ID** (instruction decode — figure out the operation and read the register operands), **EX** (execute — the ALU does the arithmetic or computes an address), **MEM** (memory — load or store data if the instruction needs it), and **WB** (write-back — write the result into a register). Between every pair of stages sits a small bank of **pipeline registers** that carries an instruction's partial work forward one stage per clock tick. On each rising clock edge, every instruction advances one stage and a brand-new instruction enters IF. In steady state, five instructions are in flight at once, each in a different stage, and one instruction finishes every cycle.

The catch is that instructions are not independent laundry loads — they talk to each other. If instruction two needs a value that instruction one has not written back yet, reading the register too early gives a stale answer. That is a **hazard**. When the hardware cannot safely let an instruction proceed, it inserts a **bubble** — a do-nothing cycle that delays the dependent instruction — which is exactly the empty gap you will see in the visualization below. Hazards are the price of overlap, and most of pipeline design is about paying that price as rarely as possible.

## visualization
```
 5-stage pipeline: rows = instructions, columns = clock cycles
 IF=fetch  ID=decode  EX=execute  MEM=memory  WB=write-back

           c1    c2    c3    c4    c5    c6    c7    c8    c9
 I1: add   IF    ID    EX    MEM   WB
 I2: sub         IF    ID    EX    MEM   WB
 I3: lw          .     IF    ID    EX    MEM   WB
 I4: and (dep)   .     .     IF    ID    **    EX    MEM   WB   <- stalls
 I5: or          .     .     .     IF    **    ID    EX    MEM  WB

 ** = bubble: I4 needs the value I3 loads, but lw's data is not
      ready until after I3's MEM stage, so I4 waits one cycle in ID.
 Steady state (top rows): one instruction completes every cycle.
```

## bruteForce
The simplest processor is **single-cycle** (or otherwise non-pipelined): each instruction runs start-to-finish before the next one is fetched. Correctness is trivial because nothing overlaps — there are no hazards to worry about. But it is slow in exactly the way the laundry example predicts. If the five stages take, say, 200 picoseconds each, a non-pipelined design must clock slowly enough to fit the whole 1000-picosecond path in one cycle, and it retires one instruction per 1000 ps. Every functional unit is busy only one-fifth of the time; the rest of the cycle it waits. You paid for a fetch unit, a decoder, an ALU, and a memory port, and four of them idle while the fifth works.

## optimal
Pipelining overlaps the stages so that, in the ideal case, throughput reaches **one instruction per cycle** (an ideal CPI of 1) even though each instruction still takes five cycles to traverse the pipe. Split the datapath into IF, ID, EX, MEM, WB, place **pipeline registers** between the stages to hold each instruction's in-flight state, and clock the pipe at the speed of the slowest single stage rather than the whole path. With five roughly equal stages you approach a fivefold throughput gain. Latency per instruction does not improve — it may even rise slightly from the register overhead — but the machine finishes work five times as often.

The overlap creates three families of **hazards**. **Structural hazards** occur when two instructions want the same hardware in the same cycle; the classic fix is to not share — for example, use separate instruction and data caches so IF and MEM never collide. **Data hazards** occur when an instruction needs a result an earlier instruction has not yet written back. Many of these are solved by **forwarding** (also called **bypassing**): route an ALU result straight from the EX/MEM pipeline register back to a later instruction's EX input, so the value is used a cycle or two before it is officially written to the register file. The one case forwarding cannot fully hide is the **load-use hazard** — a value coming from data memory is not available until after MEM, so an instruction that uses a freshly loaded value must **stall** one cycle, inserting a **bubble**. **Control hazards** arise at branches: the pipeline has already fetched the instructions after a branch before it knows whether the branch is taken. Modern CPUs lean on **branch prediction** to guess the direction and keep fetching speculatively; a correct guess costs nothing, a misprediction flushes the wrongly-fetched instructions and pays a penalty of several cycles. The whole discipline of pipeline design is squeezing effective CPI back toward 1 by forwarding aggressively, predicting branches well, and scheduling code so dependent instructions are spaced apart.

## complexity
time: Ideal throughput is roughly one instruction per cycle (CPI = 1) once the pipe is full, versus one instruction per (number-of-stages) cycles for a non-pipelined design. Per-instruction latency stays at N stage-times; pipelining buys throughput, not latency. Filling and draining the pipe costs N-1 cycles of startup, negligible over a long instruction stream.
space: An N-stage pipeline needs N-1 banks of **pipeline registers** between the stages to carry each instruction's partial state, plus forwarding multiplexers, hazard-detection logic, and (in real cores) branch-prediction tables. The area cost is modest next to the throughput win.
notes: Hazards raise effective CPI above the ideal 1. Each stall bubble and each branch misprediction adds cycles, so real CPI = 1 + stalls-per-instruction + mispredict-penalty-rate. Forwarding, separate caches, and branch prediction exist precisely to keep those added terms small.

## pitfalls
- **Confusing throughput with latency.** Pipelining does not make one instruction finish faster; a five-stage instruction still takes five cycles end to end. What improves is how often instructions *complete*. Fix: reason about latency (time for one) and throughput (rate of completion) separately — deepening a pipeline can raise throughput while leaving or worsening single-instruction latency.
- **Assuming forwarding removes every stall.** Forwarding hides most ALU-to-ALU data hazards, but a **load-use** dependency cannot be fully bypassed because the loaded value only exists after MEM. Fix: expect a one-cycle bubble after a load whose result feeds the very next instruction, and schedule an independent instruction into that slot when possible.
- **Ignoring branch cost.** A mispredicted branch flushes the speculatively fetched instructions and restarts fetch, costing several cycles — often the dominant stall in branchy code. Fix: write predictable branches, prefer branchless idioms in hot loops, and trust the compiler's layout of the likely path.
- **Thinking a deeper pipeline is always faster.** More stages mean a higher clock but a bigger misprediction penalty and more forwarding paths; past a point the added stall cost outweighs the clock gain. Fix: treat pipeline depth as a trade-off, not a free win — effective CPI, not stage count, is the real metric.
- **Reading the diagram as if instructions run to completion in order.** Overlap means several instructions occupy different stages in the same cycle; a stall on one instruction shifts everything behind it right. Fix: read the pipeline column by column (what is happening this cycle) as well as row by row (one instruction's journey).

## interviewTips
- Name the five stages in order — IF, ID, EX, MEM, WB — and state the load-bearing sentence: "pipelining overlaps stages to raise throughput toward one instruction per cycle, without reducing any single instruction's latency." That framing signals you understand the mechanism, not just the acronym.
- Be ready to classify the three hazard types (structural, data, control) and give one fix each: separate caches, forwarding plus load-use stalls, and branch prediction. If asked which data hazard forwarding cannot hide, answer "load-use" and explain why the value is not ready until after MEM.
- When asked why a tight dependent loop is slow, tie it to the pipeline: back-to-back dependent instructions cannot overlap freely, so stalls or forwarding latency dominate; spacing independent work between dependents lets the pipe stay full. Mentioning that compilers reorder instructions for exactly this reason shows depth.

## keyTakeaways
- A pipeline splits instruction execution into stages (classically five: IF, ID, EX, MEM, WB) and overlaps consecutive instructions so one finishes every cycle in steady state — improving throughput, not per-instruction latency.
- Overlap creates hazards: structural (shared hardware), data (needing a not-yet-written result), and control (branches). Forwarding, separate caches, and branch prediction exist to keep them from stalling the pipe.
- The load-use data hazard is the one forwarding cannot fully hide, forcing a one-cycle bubble; effective CPI = 1 + stalls + branch-mispredict penalties, and good code and good hardware push it back toward the ideal 1.

## code.c
```c
// A tight dependent chain: each add needs the previous result.
// Back-to-back dependency means the pipeline cannot overlap these
// freely -- forwarding hides most of it, but a load feeding the next
// instruction cannot be bypassed and costs a one-cycle stall.
long sum_dependent(const long *a, int n) {
    long acc = 0;
    for (int i = 0; i < n; i++) {
        long v = a[i];   // load: result ready only after the MEM stage
        acc = acc + v;   // load-use: this add needs v -> pipeline stalls 1 cycle
    }
    return acc;
    // Fix in hot code: unroll and keep several independent accumulators
    // so the CPU has other work to do while each load's value arrives.
}
```

## code.asm
```asm
# RISC-V: a load-use hazard. lw's result (t1) is not ready until after
# its MEM stage, but the next add needs t1 -> hardware inserts one bubble.
    lw    t1, 0(a0)     # load a[i] into t1  (value ready only after MEM)
    # <-- pipeline BUBBLE here: add must wait one cycle for t1 (stall)
    add   t2, t2, t1    # uses t1: cannot start EX until the loaded value arrives
    addi  a0, a0, 8     # independent work -- a scheduler could move this into the bubble

# A branch: the CPU speculatively fetches past bne before the outcome is
# known. A correct prediction is free; a misprediction flushes the wrongly
# fetched instructions and restarts fetch (a multi-cycle control-hazard penalty).
    bne   t0, zero, loop  # taken/not-taken guessed by the branch predictor
    add   t3, t3, t2      # fetched speculatively on the predicted path
```
