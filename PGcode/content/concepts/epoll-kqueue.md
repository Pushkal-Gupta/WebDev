---
slug: epoll-kqueue
module: cs-core
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
The C10K problem ("how do we serve 10,000 concurrent connections?") was solved by epoll and kqueue. Nginx, HAProxy, Node.js (libuv), Redis, Envoy, and io_uring all build on this primitive. Every high-throughput backend role asks about it because it's the dividing line between "I write business logic on top of frameworks" and "I understand why my framework works." Knowing edge-triggered vs level-triggered mode, and the EAGAIN drain loop, signals senior systems literacy.

## intuition
Picture a receptionist watching 10,000 phone lines. The naive approach (`select`) is to walk past every phone each second and check if any is ringing — O(N) every poll, terrible at 10K lines. Epoll is a smart phone switchboard: each phone is registered once, and ringing phones light up a single panel. The receptionist glances at the panel, picks up only the lit phones, handles them, and goes back to waiting. Add or remove lines without re-scanning.

## visualization
Trace one connection's lifecycle under epoll edge-triggered mode: `epoll_create1` gives you an epfd. New socket sfd arrives via accept; `epoll_ctl(epfd, ADD, sfd, EPOLLIN | EPOLLET)`. Later, the client sends 8 KB. The kernel marks sfd as ready and adds it to epfd's ready list. `epoll_wait` returns one event for sfd. You read in a loop until `read` returns EAGAIN (the edge-triggered contract — drain everything, because you will not be notified again until *new* data arrives). Process the bytes, loop back to `epoll_wait`.

## bruteForce
`select(fd_set, ...)` and `poll(struct pollfd[], n, ...)` accept the full set of interest fds on every call. The kernel iterates all N each time to check readiness, then returns. At N=10K, that's 10K reads per syscall, and the userspace loop is another O(N) to find the ready ones. CPU time grows linearly with idle connections; on a busy server with 9,990 idle and 10 active sockets, you waste 99.9% of every poll cycle.

## optimal
Register interest once, get notified about changes only. Edge-triggered mode (EPOLLET / EV_CLEAR) fires exactly when a state changes (not-readable → readable) and is silent until the next change — forcing the application to drain to EAGAIN, which removes the kernel's burden of tracking re-notification. Level-triggered (the default) keeps firing as long as the fd is ready; safer for newcomers but slightly more syscall traffic. Pair with non-blocking sockets (`O_NONBLOCK`) — blocking IO inside an event loop defeats the entire model.

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
