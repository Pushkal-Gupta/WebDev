---
slug: unix-pipes
module: cs-core
title: Unix Pipes
subtitle: The fork + pipe pattern — producer-consumer via filesystem-shaped IPC.
difficulty: Intermediate
position: 50
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Interlude: Process API"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-api.pdf"
    type: book
  - title: "Pipe System Call — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/pipe-system-call/"
    type: blog
  - title: "TheAlgorithms/Python — IPC examples"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
A pipe is a unidirectional, in-kernel byte buffer with two file descriptors: one read, one write. `pipe(fds)` returns the pair. Combined with `fork()`, it's the simplest possible IPC — one process writes, another reads, and the kernel handles buffering, blocking, and end-of-file. Every Unix shell pipeline (`grep foo | sort | uniq`) is just three forks, three pipes, three `dup2` calls, and three execs.

## whyItMatters
Pipes are the foundational pattern for producer-consumer coordination on a single machine. Understanding them unlocks the rest of Unix IPC (FIFOs, sockets, ptys), the shell's plumbing, and the mental model behind streams in Node.js, Python's `subprocess`, and Go's `io.Pipe`. Interviewers love asking "implement `cat a | grep b`" because it forces you to demonstrate `pipe`, `fork`, `dup2`, and `close` — the four-call ritual that reveals real systems experience.

## intuition
A pipe is a hallway with a one-way door at each end. The writer pushes notes through one door; they queue up inside; the reader pulls them out the other door. If the hallway fills up, the writer waits at the door until space opens. If the hallway empties, the reader waits for the next note. Close the writer's door for good and the reader, after draining, sees EOF. Close the reader's door and the next push triggers SIGPIPE — the kernel's way of saying "no one's listening."

## visualization
Trace `ls | wc -l`: shell calls `pipe([3,4])`. Forks child A: A closes fd 3 (the read end), `dup2(4,1)` redirects stdout to the write end, exec ls. Forks child B: B closes fd 4, `dup2(3,0)` redirects stdin to the read end, exec wc. Parent shell closes both 3 and 4 — critical, otherwise wc never sees EOF because the kernel's reference count on the write end stays at 1. ls writes filenames; the kernel buffers; wc reads and counts; ls exits, kernel decrements; wc reads EOF and prints.

## bruteForce
Use a temp file: process A writes to /tmp/buf, exits, process B reads /tmp/buf. Works for small data and synchronous flows but breaks for everything else — no streaming, full IO cost (two trips through page cache and disk), no automatic cleanup if A crashes mid-write, no flow control. It's the "I haven't heard of pipes" answer and immediately marks you as junior.

## optimal
`pipe()` + `fork()` + `dup2()` + `close()` in the canonical order. The kernel buffer (typically 64 KB on Linux) provides backpressure for free: the writer blocks when full, the reader blocks when empty. Closing unused ends in *every* process is the one ritual juniors forget — the kernel maintains reference counts, and EOF only fires when the last write-end fd is closed across all processes. For multi-stage pipelines, chain N pipes and N+1 forks.

## complexity
time: O(bytes) for transfer; near-zero per-byte overhead (kernel buffer, no disk)
space: kernel pipe buffer (64 KB Linux default, tunable via fcntl F_SETPIPE_SZ)
notes: Throughput on a modern machine can hit 10+ GB/s for in-kernel pipe writes when both ends are on the same NUMA node. `splice()` and `vmsplice()` move pages without copying, hitting 30+ GB/s for file-to-pipe transfers.

## pitfalls
- Forgetting to close the write end in *all* readers' parents — the reader hangs forever waiting for EOF that never comes.
- Reading after the writer crashes mid-message — you get a short read, not an error; check the return value of every `read`.
- Writing after the reader exits — SIGPIPE kills your process by default. Either ignore SIGPIPE and check `write` for EPIPE, or use `MSG_NOSIGNAL` on sockets.
- Buffer-size assumptions: PIPE_BUF (typically 4096) is the largest atomic write guarantee — beyond it, writes from concurrent producers can interleave.

## interviewTips
- Recite the four-call ritual: `pipe → fork → dup2 → close`. Then explain why each line exists.
- Mention SIGPIPE — it's the most common gotcha and interviewers love when you bring it up unprompted.
- For multi-stage pipelines, sketch the fd diagram with read/write ends labeled — visual clarity wins.
- If asked for bidirectional IPC, say "use two pipes or a socketpair" — pipes are one-way by design, and faking duplex with one pipe is a junior mistake.

## code.python
```python
import os

r, w = os.pipe()
pid = os.fork()
if pid == 0:
    os.close(r)
    os.write(w, b"hello from child\n")
    os.close(w)
    os._exit(0)
else:
    os.close(w)
    data = b""
    while chunk := os.read(r, 4096):
        data += chunk
    os.close(r)
    os.waitpid(pid, 0)
    print(data.decode(), end="")
```

## code.javascript
```javascript
const { spawn } = require('child_process');

const ls = spawn('ls', ['-la']);
const wc = spawn('wc', ['-l']);

ls.stdout.pipe(wc.stdin);
wc.stdout.on('data', (d) => process.stdout.write(`lines: ${d}`));
ls.on('close', () => wc.stdin.end());
```

## code.java
```java
import java.io.*;

public class PipeDemo {
    public static void main(String[] args) throws Exception {
        Process ls = new ProcessBuilder("ls", "-la").start();
        Process wc = new ProcessBuilder("wc", "-l").redirectErrorStream(true).start();
        try (InputStream in = ls.getInputStream(); OutputStream out = wc.getOutputStream()) {
            in.transferTo(out);
        }
        wc.getInputStream().transferTo(System.out);
        ls.waitFor(); wc.waitFor();
    }
}
```

## code.cpp
```cpp
#include <unistd.h>
#include <sys/wait.h>
#include <cstdio>

int main() {
    int fds[2];
    pipe(fds);
    pid_t pid = fork();
    if (pid == 0) {
        close(fds[0]);
        const char* msg = "hello from child\n";
        write(fds[1], msg, 18);
        close(fds[1]);
        _exit(0);
    }
    close(fds[1]);
    char buf[64];
    ssize_t n = read(fds[0], buf, sizeof(buf));
    buf[n] = '\0';
    printf("%s", buf);
    close(fds[0]);
    waitpid(pid, nullptr, 0);
}
```
