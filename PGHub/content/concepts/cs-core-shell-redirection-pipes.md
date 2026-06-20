---
slug: cs-core-shell-redirection-pipes
module: cs-tools-encodings
title: Shell Redirection & Pipes
subtitle: Stdin / stdout / stderr, file redirection, pipes, here-docs, process substitution — the Unix philosophy in one chapter.
difficulty: Beginner
position: 38
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Operating Systems: Three Easy Pieces — Files and I/O"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "The Linux Documentation Project — Bash Guide"
    url: "https://tldp.org/LDP/Bash-Beginners-Guide/html/"
    type: blog
  - title: "torvalds/linux — pipe implementation"
    url: "https://github.com/torvalds/linux/tree/master/fs/pipe.c"
    type: repo
status: published
---

## intro
A Unix process inherits three file descriptors: **stdin (0)**, **stdout (1)**, **stderr (2)**. The shell lets you redirect each via `<`, `>`, `2>`, `&>`, and connect processes via `|`. The "small composable tools" philosophy of Unix lives entirely in these operators. Mastering them turns the shell into a powerful streaming-data system.

## whyItMatters
- Every shell pipeline you write rests on these. Misunderstanding causes silent failures (stderr lost), unintended overwrites, or broken pipelines.
- Powers the "compose 5 standard tools" pattern that solves an enormous class of one-off data problems without writing code.
- Underlies Docker, CI/CD scripts, log aggregation, scientific computing pipelines.

## intuition
**Redirection** wires a file descriptor to a file:
- `cmd > out.txt` — stdout → out.txt (truncate).
- `cmd >> out.txt` — stdout → out.txt (append).
- `cmd 2> err.txt` — stderr → err.txt.
- `cmd > out.txt 2>&1` — both stdout AND stderr → out.txt.
- `cmd &> out.txt` — bash shorthand for the above.
- `cmd < in.txt` — in.txt → stdin.

**Pipes** wire one process's stdout to the next's stdin:
- `cmd1 | cmd2` — cmd1's stdout becomes cmd2's stdin.
- Stderr is NOT piped by default; use `cmd1 |& cmd2` (bash) or `cmd1 2>&1 | cmd2`.

**Here-doc**:
- `cmd <<EOF` ... `EOF` — embed a multi-line string as stdin without a file.
- `cmd <<-EOF` — strips leading tabs (useful for indented heredocs).

**Process substitution** (bash):
- `cmd <(other_cmd)` — `other_cmd`'s output appears as a temporary file (fed via /dev/fd/N).

## visualization
```
ls -l /tmp > out.txt 2> err.txt

  fd 0 (stdin)  → terminal (unchanged)
  fd 1 (stdout) → out.txt  (truncated, then written)
  fd 2 (stderr) → err.txt

ls /nope > out.txt 2>&1

  fd 1 → out.txt
  fd 2 → (dup of fd 1) → out.txt
  Both interleave into out.txt.

cat file | grep ERROR | wc -l

  cat's stdout (file contents) → grep's stdin
  grep's stdout (matching lines) → wc's stdin
  wc's stdout → terminal (count of matching lines)
  All three processes run concurrently; data flows through pipes (kernel buffers).

Here-doc:
  sort <<EOF
  banana
  apple
  cherry
  EOF

  → sort sees "banana\napple\ncherry\n" on stdin → outputs sorted.

Process substitution:
  diff <(curl https://a.com) <(curl https://b.com)

  Both curls run concurrently; their stdout becomes /dev/fd/63 and /dev/fd/64;
  diff reads both as if they were files.
```

## bruteForce
**Write everything to temp files, then process**: works but slow + clutters disk. Pipes are the right tool.

**Use full Python / Node script for every text task**: overkill for "filter logs, count matches" — shell does this in 1 line.

**Forget stderr**: scripts silently lose error messages → debugging hell.

## optimal
**Compose 3-5 stdlib tools** instead of writing custom code:
- `cat`, `grep`, `awk`, `sed`, `cut`, `tr`, `sort`, `uniq`, `head`, `tail`, `wc`, `xargs`, `find`, `tee`.

**Standard idioms**:
- Count log errors: `grep ERROR app.log | wc -l`
- Top 10 most-frequent IPs: `awk '{print $1}' access.log | sort | uniq -c | sort -rn | head`
- Save AND view output: `cmd | tee out.txt`
- Run on each file: `find . -name '*.py' | xargs wc -l`
- Last 100 lines, follow: `tail -n 100 -f log.txt`
- Drop stderr: `cmd 2>/dev/null`
- Drop both: `cmd > /dev/null 2>&1` (POSIX) or `cmd &> /dev/null` (bash)

**Process substitution patterns**:
- Compare command outputs: `diff <(cmd1) <(cmd2)`
- Pipe to multiple: `tee >(cmd1) >(cmd2) > /dev/null`

**`set -euo pipefail`** at the top of shell scripts:
- `-e`: exit on first error.
- `-u`: error on undefined variable.
- `-o pipefail`: pipeline status = rightmost non-zero (otherwise only last command's status).

Without `pipefail`, `grep ERROR file | wc -l` returns 0 even if file doesn't exist — grep's error is masked by wc's success.

## complexity
- **Pipe latency**: kernel buffer (~64KB on Linux); reader can consume before writer finishes — no whole-output buffering.
- **Throughput**: limited by slowest stage of the pipeline.
- **Memory**: O(1) per process — no full materialization.

## pitfalls
- **`>` overwrites instead of appending.** Running `cmd > file` twice loses the first run's output. Fix: use `>>` to append, or check `set -o noclobber` to refuse overwriting existing files.
- **Pipe failures masked.** `grep nope file | wc -l` returns 0 with exit status 0 even when `grep` failed because the file doesn't exist. Fix: `set -o pipefail` to propagate the first non-zero status.
- **Stderr not piped.** `cmd | grep ERROR` won't see errors that go to stderr. Fix: `cmd 2>&1 | grep ERROR` or `cmd |& grep ERROR` (bash).
- **Argument-list-too-long.** `cmd $(find . -name '*.log')` may overflow ARG_MAX. Fix: use `find ... | xargs cmd` which batches arguments.
- **`echo` for arbitrary data.** `echo -e` is non-POSIX; `\n` not interpreted on plain `echo`. Fix: use `printf` for any non-trivial output.
- **Reading a file you're also writing.** `sort file > file` truncates file before sort reads it → empty file. Fix: write to temp + mv, or use `sort -o file file`.

## interviewTips
- For "process this log file" → grep/awk/sort pipeline before reaching for Python.
- Cite **`set -euo pipefail`** as table-stakes for any production shell script.
- For senior interviews, discuss **named pipes (FIFOs)**, **process substitution**, **flow control under slow consumers**, **why pipes are O(1) memory**.

## code.python
```python
# Python subprocess equivalent of shell pipeline
import subprocess
# grep ERROR file.log | wc -l
p1 = subprocess.Popen(['grep', 'ERROR', 'file.log'], stdout=subprocess.PIPE)
p2 = subprocess.Popen(['wc', '-l'], stdin=p1.stdout, stdout=subprocess.PIPE)
p1.stdout.close()   # let p1 receive SIGPIPE if p2 exits
result, _ = p2.communicate()
print(int(result))
```

## code.javascript
```javascript
// Node.js: pipe streams
const { spawn } = require('child_process');
const grep = spawn('grep', ['ERROR', 'file.log']);
const wc = spawn('wc', ['-l']);
grep.stdout.pipe(wc.stdin);
wc.stdout.on('data', d => console.log(`error lines: ${d}`));
```

## code.java
```java
// Java ProcessBuilder pipeline (Java 9+)
List<ProcessBuilder> pipeline = List.of(
    new ProcessBuilder("grep", "ERROR", "file.log"),
    new ProcessBuilder("wc", "-l").redirectOutput(ProcessBuilder.Redirect.INHERIT)
);
List<Process> processes = ProcessBuilder.startPipeline(pipeline);
for (Process p : processes) p.waitFor();
```

## code.cpp
```cpp
// Raw pipe() syscall — old-school
#include <unistd.h>
int fd[2];
pipe(fd);
if (fork() == 0) {
    close(fd[0]);
    dup2(fd[1], STDOUT_FILENO);
    execlp("grep", "grep", "ERROR", "file.log", nullptr);
}
close(fd[1]);
dup2(fd[0], STDIN_FILENO);
execlp("wc", "wc", "-l", nullptr);
```
