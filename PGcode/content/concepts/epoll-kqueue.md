---
slug: epoll-kqueue
module: cs-os-concurrency
title: Epoll and Kqueue
subtitle: Edge-triggered event notification — the kernel primitive behind Nginx, Node.js, and Redis.
difficulty: Advanced
position: 51
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Event-based Concurrency"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-events.pdf"
    type: book
  - title: "epoll System Call — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/epoll-vs-select-and-poll/"
    type: blog
  - title: "nginx — event module source"
    url: "https://github.com/nginx/nginx"
    type: repo
status: published
---

## intro
`epoll` (Linux) and `kqueue` (BSD/macOS) are the modern kernel APIs for "tell me when any of these N file descriptors becomes ready." They replaced `select` and `poll`, which scaled as O(N) per call. With epoll, the kernel maintains a registered interest list; readiness events are pushed onto a ready queue; one call (`epoll_wait`) returns only the fds that actually have work — O(ready), not O(registered). This is the foundation of every modern event-loop server.

## whyItMatters
- **Dan Kegel's C10K problem essay** (1999) framed the question — "how do we serve 10,000 concurrent connections?" — and epoll (Linux 2.6, 2002) plus kqueue (FreeBSD 4.1, 2000) are the kernel APIs that solved it.
- **Nginx** (the original C10K solver), **HAProxy**, **Redis**, **Memcached**, **Node.js (libuv)**, **Envoy**, **Rust tokio**, **Go runtime netpoll** all build on epoll/kqueue.
- **io_uring** (Linux 5.1+, 2019, Jens Axboe) is the next-generation Linux successor — submission and completion queues in shared memory eliminate syscalls per operation; **Tigerbeetle, Postgres 17+, ScyllaDB** use it for sub-microsecond IO latency.
- **CS 162 / OSTEP Chapter 33 (event-based concurrency)** and **Pavel Krivitsky's "Scalable Event Multiplexing"** are the academic references; production interview questions at Google, Meta, AWS routinely probe edge-triggered vs level-triggered.

## intuition
The problem is "I have N concurrent TCP connections (or file descriptors, pipes, signals); how do I efficiently wait until at least one is ready to read or write?" The naive 1980s answer was `select(fd_set, ...)` and `poll(struct pollfd[], n, ...)` — pass the **entire set of interest fds on every call**. The kernel iterates all N each call to check readiness, then returns. At N = 10,000 with 9,990 idle, you waste 99.9% of every poll cycle scanning idle connections. The userspace loop then iterates again to find which few are ready — another O(N). Total cost per event: O(N). Throughput collapses as N grows.

epoll (Linux) and kqueue (BSD/macOS) invert the contract: **register interest once, get notified about changes only**. The kernel maintains an internal data structure (a red-black tree of registered fds plus a ready list) and pushes readiness events onto the ready list as they happen. `epoll_wait` returns **only the fds that actually have work** — O(ready), not O(registered). Adding a connection is `epoll_ctl(ADD)` (O(log N) rbtree insert); removing is `epoll_ctl(DEL)`. No more per-call O(N) tax.

The receptionist analogy: imagine watching 10,000 phone lines. **select/poll** is walking past every phone each second to check if any is ringing — O(N) sweep per cycle. **epoll** is a smart switchboard: each phone is registered once, and ringing phones light up a single panel. The receptionist glances at the panel, picks up only the lit phones, handles them, and goes back to waiting. Adding or removing lines does not require re-scanning every phone.

Two notification modes matter. **Level-triggered (LT)** is the default — epoll keeps firing the event as long as the fd is in the ready state (e.g., as long as there is unread data in the socket buffer). Simple and safe; you can read just a few bytes and trust epoll to wake you again. **Edge-triggered (ET, EPOLLET)** fires exactly when a state transition happens (not-readable -> readable) and is silent until the next transition. This forces the application to **drain to EAGAIN** (read until the kernel returns "would block"), which removes the kernel's burden of tracking re-notification. ET is faster (fewer syscalls, fewer wake-ups) but the drain-loop discipline is easy to get wrong — the most common bug is "I read once and exited; the connection silently stalled."

Pair epoll with **non-blocking sockets** (`O_NONBLOCK`). Blocking IO inside an event loop is poison: one slow `read` stalls the entire reactor and starves every other connection.

## visualization
Trace one connection's lifecycle under epoll edge-triggered mode: `epoll_create1` gives you an epfd. New socket sfd arrives via accept; `epoll_ctl(epfd, ADD, sfd, EPOLLIN | EPOLLET)`. Later, the client sends 8 KB. The kernel marks sfd as ready and adds it to epfd's ready list. `epoll_wait` returns one event for sfd. You read in a loop until `read` returns EAGAIN (the edge-triggered contract — drain everything, because you will not be notified again until *new* data arrives). Process the bytes, loop back to `epoll_wait`.

## bruteForce
`select(fd_set, ...)` and `poll(struct pollfd[], n, ...)` accept the full set of interest fds on every call. The kernel iterates all N each time to check readiness, then returns. At N=10K, that's 10K reads per syscall, and the userspace loop is another O(N) to find the ready ones. CPU time grows linearly with idle connections; on a busy server with 9,990 idle and 10 active sockets, you waste 99.9% of every poll cycle.

## optimal
The right approach is **`epoll_create1` once, `epoll_ctl(ADD)` per fd, `epoll_wait` in the event loop with edge-triggered mode for high throughput and a strict drain-to-EAGAIN discipline**. Pair with **non-blocking sockets** (`O_NONBLOCK`) so a single slow read cannot stall the entire reactor.

```c
#include <sys/epoll.h>
#include <sys/socket.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>

int main(void) {
    int srv = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK, 0);
    // ... bind() and listen() ...
    int epfd = epoll_create1(EPOLL_CLOEXEC);

    // Register the listening socket in edge-triggered mode.
    struct epoll_event ev = { .events = EPOLLIN | EPOLLET, .data.fd = srv };
    epoll_ctl(epfd, EPOLL_CTL_ADD, srv, &ev);

    struct epoll_event events[64];
    for (;;) {
        int n = epoll_wait(epfd, events, 64, -1);
        for (int i = 0; i < n; i++) {
            int fd = events[i].data.fd;
            if (fd == srv) {
                // Accept ALL pending connections (ET fires once per state change).
                for (;;) {
                    int c = accept4(srv, NULL, NULL, SOCK_NONBLOCK);
                    if (c < 0) {
                        if (errno == EAGAIN || errno == EWOULDBLOCK) break;
                        // handle error
                    }
                    struct epoll_event cev = { .events = EPOLLIN | EPOLLET, .data.fd = c };
                    epoll_ctl(epfd, EPOLL_CTL_ADD, c, &cev);
                }
            } else {
                // DRAIN to EAGAIN -- ET will not fire again until NEW data arrives.
                char buf[4096];
                for (;;) {
                    ssize_t r = read(fd, buf, sizeof(buf));
                    if (r < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) break;
                    if (r <= 0) { close(fd); break; }
                    process(buf, r);
                }
            }
        }
    }
}
```

Why this is right: **register-once-notify-on-change** flips the asymptotic from O(N) per syscall to O(ready). The kernel maintains a red-black tree of registered fds plus a ready list; `epoll_ctl` updates the tree (O(log N)); `epoll_wait` walks the ready list (O(ready)). Modern Linux uses an even more efficient internal structure, but the API guarantee remains O(ready). At 100K connections with 100 ready per cycle, that is 1000x less work than select/poll.

**Edge-triggered (EPOLLET) vs Level-triggered (default)**:
- **ET fires exactly on state transitions** (not-readable -> readable, not-writable -> writable). Application MUST drain to EAGAIN; the kernel will not re-notify until the next transition. **Fewer wake-ups, fewer syscalls, higher throughput** — what Nginx and HAProxy use.
- **LT keeps firing as long as the fd is ready** — safer for newcomers (you can read once and trust epoll to wake you again), but slightly more syscall traffic. Default mode; what Node.js's libuv uses in most code paths.

**Common ET pitfall** — read once, exit the handler, connection silently stalls. The kernel only re-notifies on **new** data; if a 64 KB request arrives in one TCP segment and you read 4 KB then return, the remaining 60 KB sit unread forever. Fix: always loop until `errno == EAGAIN`.

**Adjacent and successor APIs**:
- **kqueue (BSD/macOS)** — more general than epoll: timers, signals, file changes, vnodes, processes all via one API. Marc Lehmann's `libev` and `libevent` abstract over both.
- **io_uring (Linux 5.1+, Jens Axboe, 2019)** — the next-generation Linux successor. Submission and completion queues live in shared memory between kernel and userspace; one or zero syscalls per IO operation. **TigerBeetle, Postgres 17+, ScyllaDB** use it for sub-microsecond IO latency.
- **IOCP (Windows)** — completion-based model (vs epoll's readiness-based); the kernel does the IO itself and notifies on completion. Architecturally closer to io_uring than to epoll.

**Production options**: use `EPOLLET | EPOLLONESHOT` for thread-pool designs where only one worker handles a given fd at a time (after handling, re-arm with `EPOLL_CTL_MOD`). Set the events-array size on `epoll_wait` to handle bursts — 64 is fine for most servers, 1024 for very high-fanout.

## complexity
time: epoll_ctl O(log N) for the kernel rbtree insert; epoll_wait O(ready) — not O(registered)
space: kernel ~ 50-100 bytes per registered fd plus one event slot per ready fd
notes: io_uring (Linux 5.1+) goes further — submission and completion queues live in shared memory, eliminating syscalls per operation. For 100K+ connections, io_uring beats epoll on syscall overhead.

## pitfalls
- Using edge-triggered mode without an EAGAIN drain loop — you process the first chunk, exit the handler, and the connection silently stalls because the kernel will not fire again until *more* data arrives.
- Mixing blocking and non-blocking sockets in the same event loop — one blocking `read` stalls the entire reactor and starves every other connection.
- Forgetting to `EPOLL_CTL_DEL` before closing — actually fine on modern kernels (close auto-removes), but in older code this leaked event slots.
- Using `epoll_wait` with a tiny event-array size and getting starvation when 1000 fds are ready and you only ask for 8.

## interviewTips
- Define edge-triggered vs level-triggered up front. Then explain why edge-triggered exists (fewer wake-ups, fewer syscalls).
- Mention `EPOLLET | EPOLLONESHOT` for thread-pool designs — only one worker thread handles a given fd at a time.
- Compare to kqueue's filter model — kqueue is more general (timers, signals, file changes, vnodes all via one API), epoll is narrower but simpler.
- Bring up io_uring if the interviewer probes for "what's next" — it shows you track the field.

## code.python
```python
import selectors, socket

sel = selectors.DefaultSelector()
srv = socket.socket()
srv.bind(('127.0.0.1', 8080)); srv.listen(); srv.setblocking(False)
sel.register(srv, selectors.EVENT_READ, data=None)

while True:
    for key, _ in sel.select(timeout=None):
        if key.data is None:
            conn, _ = srv.accept(); conn.setblocking(False)
            sel.register(conn, selectors.EVENT_READ, data=b"")
        else:
            data = key.fileobj.recv(4096)
            if not data:
                sel.unregister(key.fileobj); key.fileobj.close()
            else:
                key.fileobj.sendall(data)
```

## code.javascript
```javascript
const net = require('net');

const server = net.createServer((sock) => {
  sock.on('data', (buf) => sock.write(buf));
  sock.on('end', () => sock.end());
});

server.listen(8080, () => console.log('libuv epoll-backed loop on 8080'));
```

## code.java
```java
import java.nio.*;
import java.nio.channels.*;
import java.net.InetSocketAddress;

public class EpollDemo {
    public static void main(String[] args) throws Exception {
        Selector sel = Selector.open();
        ServerSocketChannel srv = ServerSocketChannel.open();
        srv.bind(new InetSocketAddress(8080)); srv.configureBlocking(false);
        srv.register(sel, SelectionKey.OP_ACCEPT);
        while (true) {
            sel.select();
            for (SelectionKey k : sel.selectedKeys()) {
                if (k.isAcceptable()) {
                    SocketChannel c = srv.accept(); c.configureBlocking(false);
                    c.register(sel, SelectionKey.OP_READ);
                } else if (k.isReadable()) {
                    ByteBuffer buf = ByteBuffer.allocate(4096);
                    if (((SocketChannel)k.channel()).read(buf) <= 0) k.channel().close();
                }
            }
            sel.selectedKeys().clear();
        }
    }
}
```

## code.cpp
```cpp
#include <sys/epoll.h>
#include <sys/socket.h>
#include <fcntl.h>
#include <unistd.h>

int main() {
    int srv = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK, 0);
    int epfd = epoll_create1(0);
    epoll_event ev{EPOLLIN | EPOLLET, {.fd = srv}};
    epoll_ctl(epfd, EPOLL_CTL_ADD, srv, &ev);

    epoll_event events[64];
    while (true) {
        int n = epoll_wait(epfd, events, 64, -1);
        for (int i = 0; i < n; ++i) {
            int fd = events[i].data.fd;
            char buf[4096];
            while (read(fd, buf, sizeof(buf)) > 0) { }
        }
    }
}
```
