---
slug: unix-pipes
module: cs-tools-encodings
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
- **Every Unix shell** since Ken Thompson's 1973 V3 (the pipe was invented by Douglas McIlroy and added by Thompson in 1973) uses pipes for `|` — `grep foo file | sort | uniq -c | sort -nr` is just four forks and three pipes.
- **POSIX systems mandate the `pipe(2)` syscall** in IEEE 1003.1; **Linux's `splice(2)` and `vmsplice(2)`** (2.6.17+) move pages between pipes and files without copying, hitting 30+ GB/s for bulk transfers.
- **Node.js's `child_process.spawn().stdout.pipe()`**, **Python's `subprocess.PIPE`**, **Go's `io.Pipe`**, and **Rust's `std::process::Stdio::piped()`** are all language wrappers around the Unix pipe primitive.
- **OSTEP Chapter 5 (Process API)**, **APUE (Stevens, Rago)**, and **The Linux Programming Interface (Kerrisk)** are the canonical references; interview questions like "implement `cat a | grep b`" probe the `pipe`/`fork`/`dup2`/`close` ritual that reveals real systems experience.

## intuition
A pipe is the simplest possible IPC primitive on Unix: a **unidirectional, in-kernel byte buffer with two file descriptors** — one for reading, one for writing. The `pipe(fds)` syscall returns the pair `[fds[0] = read end, fds[1] = write end]`. Combined with `fork()`, you get the foundation for producer-consumer coordination, the shell's `|` operator, and every classical Unix tool's composability story.

The mental model: a pipe is a **hallway with a one-way door at each end**. The writer pushes notes through one door; they queue up inside the hallway (the kernel buffer); the reader pulls them out the other door. If the hallway fills up (typically 64 KB on Linux), the writer **blocks** at the door until space opens — instant flow control. If the hallway empties, the reader blocks for the next note. Close the writer's door for good and the reader, after draining, **sees EOF**. Close the reader's door and the next push triggers **SIGPIPE** — the kernel's way of saying "no one's listening."

The four-call ritual that ties pipes to forked children is what every shell command uses. To wire `ls | wc -l`: (1) the shell calls `pipe([3, 4])`. (2) `fork()` -> child A, which closes fd 3 (the read end), `dup2(4, 1)` redirects stdout to the write end, then `exec("ls")`. (3) `fork()` -> child B, which closes fd 4, `dup2(3, 0)` redirects stdin to the read end, then `exec("wc -l")`. (4) The **parent shell closes both 3 and 4** — this is critical, otherwise wc never sees EOF because the kernel maintains a reference count on the write end, and the count must reach zero across **all processes** for EOF to fire. ls writes filenames; the kernel buffers; wc reads and counts; ls exits and the kernel decrements; wc finally reads EOF and prints.

This `pipe/fork/dup2/close` ritual is the four-call signature of real systems experience. Higher-level abstractions (Node.js's `.pipe()`, Python's `subprocess.PIPE`, Go's `io.Pipe`) wrap it; under the hood, they are still doing exactly these four operations per stage.

The kernel buffer provides **backpressure for free** — the writer blocks when full, the reader blocks when empty, no explicit flow-control code needed. Throughput on a modern machine can hit 10+ GB/s for in-kernel pipe writes when both ends are on the same NUMA node. `splice(2)` and `vmsplice(2)` move pages between pipes and files **without copying**, hitting 30+ GB/s for bulk file-to-pipe transfers — the kernel primitive behind `cat` on Linux 2.6.17+.

## visualization
Trace `ls | wc -l`: shell calls `pipe([3,4])`. Forks child A: A closes fd 3 (the read end), `dup2(4,1)` redirects stdout to the write end, exec ls. Forks child B: B closes fd 4, `dup2(3,0)` redirects stdin to the read end, exec wc. Parent shell closes both 3 and 4 — critical, otherwise wc never sees EOF because the kernel's reference count on the write end stays at 1. ls writes filenames; the kernel buffers; wc reads and counts; ls exits, kernel decrements; wc reads EOF and prints.

## bruteForce
Use a temp file: process A writes to /tmp/buf, exits, process B reads /tmp/buf. Works for small data and synchronous flows but breaks for everything else — no streaming, full IO cost (two trips through page cache and disk), no automatic cleanup if A crashes mid-write, no flow control. It's the "I haven't heard of pipes" answer and immediately marks you as junior.

## optimal
The right pattern is the **`pipe()` + `fork()` + `dup2()` + `close()` four-call ritual in the canonical order**, with disciplined fd hygiene (close every unused end in every process) and `O_CLOEXEC` on long-lived pipes. For multi-stage pipelines, chain N pipes and N+1 forks.

```c
#include <unistd.h>
#include <sys/wait.h>
#include <signal.h>
#include <stdio.h>

int main(void) {
    int fds[2];
    if (pipe(fds) < 0) { perror("pipe"); return 1; }

    pid_t child = fork();
    if (child < 0) { perror("fork"); return 1; }

    if (child == 0) {
        // CHILD: writer side. Close the read end we don't use.
        close(fds[0]);
        const char* msg = "hello from child\n";
        write(fds[1], msg, 18);
        close(fds[1]);                          // signal EOF to parent
        _exit(0);
    }

    // PARENT: reader side. Close the write end we don't use --
    // this is the discipline juniors forget. EOF only fires when
    // the kernel's ref count on the write end reaches zero across
    // ALL processes; if the parent keeps fds[1] open, the read blocks forever.
    close(fds[1]);

    char buf[256];
    ssize_t n;
    while ((n = read(fds[0], buf, sizeof(buf))) > 0) {
        write(STDOUT_FILENO, buf, n);
    }
    close(fds[0]);
    waitpid(child, NULL, 0);
    return 0;
}
```

For a shell pipeline like `ls | wc -l`, you fork twice with one pipe between the children:

```c
int fds[2]; pipe(fds);
if (fork() == 0) {                              // child 1: ls
    close(fds[0]); dup2(fds[1], STDOUT_FILENO); close(fds[1]);
    execlp("ls", "ls", NULL);
}
if (fork() == 0) {                              // child 2: wc -l
    close(fds[1]); dup2(fds[0], STDIN_FILENO);  close(fds[0]);
    execlp("wc", "wc", "-l", NULL);
}
close(fds[0]); close(fds[1]);                   // parent: close BOTH ends
wait(NULL); wait(NULL);
```

Why this is right: the **kernel buffer provides backpressure for free** — `write` blocks when the buffer is full, `read` blocks when empty — so producer and consumer self-coordinate without any explicit signaling code. The **dup2 redirect** rewires stdin/stdout of the child to the pipe end so the exec'd program (which knows nothing about pipes) writes/reads transparently. The **double-close in the parent** is the most commonly missed step: the kernel's pipe reference count must reach zero for EOF to fire on the read side, and if the parent leaves either end open, the pipeline hangs forever.

**Common pitfalls** and their fixes:
- **Forgetting to close write end in all readers' parents** -> reader hangs forever waiting for EOF. Fix: close fds you do not use, in every process.
- **Reading after the writer crashes mid-message** -> short read, not an error. Fix: check the return value of every `read` and handle 0 (EOF) and short reads.
- **Writing after the reader exits** -> **SIGPIPE** kills your process by default. Fix: either `signal(SIGPIPE, SIG_IGN)` and check `write` for `EPIPE`, or on sockets use `MSG_NOSIGNAL` / `SO_NOSIGPIPE`.
- **Buffer-size assumptions**: `PIPE_BUF` (typically 4096 bytes on Linux, POSIX-mandated >= 512) is the largest **atomic write** guarantee — beyond it, concurrent producer writes can interleave. For single-producer single-consumer (the common case), this rarely bites; for many-producers-one-consumer designs, use a Unix-domain socket with `SOCK_SEQPACKET` instead.

**Performance and adjacent primitives**:
- **`splice(2)` and `vmsplice(2)`** (Linux 2.6.17+) move pages between fds without copying user-kernel-user; `cat large_file | grep foo` uses splice internally on modern Linux. **30+ GB/s** for bulk transfers.
- **`fcntl(fd, F_SETPIPE_SZ, size)`** tunes the pipe buffer up to `/proc/sys/fs/pipe-max-size` (1 MB default); helps high-throughput streaming.
- **Named pipes (FIFOs, `mkfifo`)**: pipe with a filesystem name, surviving exec; used by `mkfifo`, `tee`, named-pipe IPC in some database tools.
- **Socketpair (`socketpair(2)`)**: bidirectional pipe; use when you need duplex IPC instead of two unidirectional pipes.

**The interview answer in one line**: "Recite `pipe -> fork -> dup2 -> close` and explain that closing unused ends in every process is the EOF-arrival precondition; SIGPIPE is the most common gotcha."

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
