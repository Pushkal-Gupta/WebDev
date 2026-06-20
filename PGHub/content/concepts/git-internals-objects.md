---
slug: git-internals-objects
module: cs-tools-encodings
title: Git Internals — Objects
subtitle: Blobs, trees, commits, and tags — the four content-addressed building blocks of every Git repository.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Pro Git Book — Git Internals: Git Objects"
    url: "https://git-scm.com/book/en/v2/Git-Internals-Git-Objects"
    type: blog
  - title: "Git Objects Explained — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/git/git-objects/"
    type: blog
  - title: "git/git — sha1-file.c (object storage)"
    url: "https://github.com/git/git/blob/master/object-file.c"
    type: repo
status: published
---

## intro
Git is, at its core, a content-addressed key-value store. Every snapshot of every file you have ever committed is stored as one of four object types — blob, tree, commit, or tag — each addressed by the SHA-1 hash of its own contents. Understanding these four objects demystifies almost every Git command.

## whyItMatters
- **Recovering from a botched force-push at a real company**: when collaborators have already pulled the old commits, you can rebuild the missing graph by walking object files in `.git/objects/` and reconstructing refs — only possible if you understand the four-object model.
- **Git tooling at GitHub, GitLab, Atlassian**: GitHub's web UI doesn't run `git` commands; it reads the object database directly. Every "View tree at commit", "Compare branches", and "Blame line" page is an object-graph traversal.
- **CI / CD optimisation (Buildkite, CircleCI, Drone)**: caching by tree hash (not commit hash) lets pipelines skip rebuilds when only commit metadata changed — knowing trees are content-addressed and commits are wrapper objects enables this.
- **Custom storage backends (LFS, Annex, Partial Clone)**: Git LFS replaces large blobs with pointer-blobs that reference external storage; understanding the blob/tree split is required to build, debug, or migrate this.
- **Security audits / supply-chain attacks (xz-utils 2024 backdoor, SolarWinds)**: forensic investigators reconstruct who-changed-what-when by walking the commit DAG and inspecting trees; tampered commits are detectable because every parent hash depends on every byte of every descendant — Merkle integrity.
- **Interview signal**: Cited by GitHub, GitLab, Mozilla, and AWS developer-productivity teams as a baseline test of source-control literacy. "Draw the four-object diagram" is a real whiteboard question.

Most everyday Git confusion ("why did `reset --hard` lose my work?", "what does HEAD actually point at?", "where did force-pushed commits go?") evaporates the moment you can see Git as a graph of immutable content-addressed objects rather than a sequence of diffs.

## intuition
Git is, at its core, a content-addressed key-value store. Every snapshot of every file you have ever committed is stored as one of four object types — blob, tree, commit, or tag — each addressed by the SHA-1 hash of its own contents. The hash *is* the address: there is no separate ID, no auto-increment counter, no UUID. Two files with identical contents share one object; two commits with identical metadata share one object. The Merkle-DAG structure means any change anywhere ripples up through every ancestor hash, making history tamper-evident.

The four object types form a strict hierarchy. **Blobs** hold raw file contents — just bytes, no filename, no permissions, no path. `README.md` and `LICENSE.md` with the same contents would be one blob, not two. **Trees** hold directory listings: a sequence of `(mode, name, hash)` entries, where `hash` points to a blob (for files) or another tree (for sub-directories). A tree is essentially `ls -l` output stored as an object. **Commits** hold a tree hash (snapshot of the whole repo at this point), a list of parent commit hashes (zero for root commits, one for normal commits, two or more for merge commits), an author, a committer, a timestamp, and a message. **Tags** (the annotated variety) wrap a commit hash with metadata, a message, and an optional GPG signature; lightweight tags are just ref files pointing at a commit and create no object.

References (`refs/heads/main`, `refs/tags/v1.0`, `HEAD`) are not objects — they're plain text files in `.git/refs/` containing a single hash. `HEAD` is a slightly special ref: it usually contains `ref: refs/heads/main` (an indirection) but during a detached-HEAD state contains a commit hash directly. Branches are cheap because they're just files; you can create 10,000 branches without touching the object database.

The model dissolves most everyday Git confusion. "Why did `git reset --hard HEAD~1` lose my commit?" — because `reset` moved the branch ref to a different commit, but the original commit object still exists in `.git/objects/` and is reachable via `git reflog` (which records every ref movement). "Where do force-pushed commits go?" — same place; they're unreachable from any ref but still in the object database for 90 days until `git gc` prunes them. "Why is `git status` so fast?" — because it diffs the working tree against the cached index (also a Merkle tree of hashes), not against the previous commit's full file contents.

The deduplication property is what makes Git practical. The Linux kernel's repo has ~10 million commits and ~80,000 files; naive per-revision-per-file storage would be petabytes. But unchanged files across commits share their blob (one copy, many references), and unchanged subtrees share their tree object. The pack file format adds delta compression on top — similar objects are stored as deltas against each other, recovered on read. The result: the Linux kernel's full history fits in ~5GB.

Git's choice of SHA-1 was historically motivated by collision resistance plus speed (1996 hardware). The 2017 SHAttered attack demonstrated practical SHA-1 collisions for crafted PDFs, and Git is migrating to SHA-256 for new repos (`git init --object-format=sha256`). The transition is non-trivial because hashes are baked into every object; tooling for sha1↔sha256 translation is part of the migration spec.

## optimal
Implement the object database directly: hash content with the canonical `"<type> <length>\0<content>"` envelope, store zlib-compressed under `.git/objects/<aa>/<rest-of-hash>`, and reference children by hash. Trees and commits referencing children form a Merkle DAG that's tamper-evident and naturally deduplicates identical content.

```python
import hashlib, zlib, os, struct

def write_object(content: bytes, obj_type: str = "blob") -> str:
    """Mirror of git hash-object -w. Stores under .git/objects/aa/bbbbb..."""
    header = f"{obj_type} {len(content)}\0".encode()  # canonical envelope
    store = header + content
    sha = hashlib.sha1(store).hexdigest()             # content-addressed
    dir_path = f".git/objects/{sha[:2]}"
    os.makedirs(dir_path, exist_ok=True)
    obj_path = f"{dir_path}/{sha[2:]}"
    if not os.path.exists(obj_path):                  # idempotent — same content = same path
        with open(obj_path, "wb") as f:
            f.write(zlib.compress(store))
    return sha

def write_tree(entries: list[tuple[str, str, str]]) -> str:
    """entries = [(mode, name, hash), ...]; mode is "100644" for file, "40000" for tree."""
    body = b""
    for mode, name, hex_hash in sorted(entries, key=lambda e: e[1]):  # sorted by name
        body += f"{mode} {name}".encode() + b"\0" + bytes.fromhex(hex_hash)
    return write_object(body, "tree")

def write_commit(tree_sha: str, parents: list[str], author: str, message: str) -> str:
    """Compose a commit object. Parents enable the DAG; one parent = normal, two = merge."""
    lines = [f"tree {tree_sha}"]
    for p in parents:
        lines.append(f"parent {p}")
    lines.append(f"author {author}")
    lines.append(f"committer {author}")
    lines.append("")                                  # blank line separates header from message
    lines.append(message)
    return write_object("\n".join(lines).encode(), "commit")

def update_ref(ref_path: str, sha: str) -> None:
    """Refs are just files. `main` = .git/refs/heads/main, contents = the commit hash."""
    with open(f".git/{ref_path}", "w") as f:
        f.write(sha + "\n")
```

Why optimal: content-addressing makes deduplication automatic — identical bytes always map to the same path, so two files with the same content are stored once regardless of how many commits or branches reference them. The Merkle DAG structure makes integrity verification O(1) per object (recompute the hash, compare against the path) and O(repo) for the full history (walk the graph, verify every parent hash). Time complexity is O(1) average to read or write an object by hash (a filesystem lookup), and `git gc` consolidates loose objects into pack files with delta compression for efficient storage and transfer.

Implementation discipline that distinguishes "understands the model" from "uses the commands": (1) never edit `.git/objects/` files directly — they're zlib-compressed and the path encodes the hash, so any change invalidates the address; use `git cat-file -p <hash>` and `git hash-object -w <file>` to inspect and create; (2) understand that a commit *contains a tree snapshot*, not diffs — diffs are computed on demand by comparing a commit's tree against its parent's tree; this is why `git show` can be slow on first run after a `git gc` (pack-file delta resolution) but fast afterwards; (3) annotated tags vs lightweight tags are a real distinction — annotated tags are tag *objects* (with author, message, optional GPG signature) and consume an object; lightweight tags are just ref files and consume no object; CI systems often want annotated tags for traceability; (4) for forensic recovery after force-push or `reset --hard`, use `git fsck --lost-found` to list dangling objects, then `git cat-file -p <commit-hash>` to inspect — the objects survive in `.git/objects/` for 90 days by default (`gc.reflogExpireUnreachable`); (5) `git cat-file --batch-check --batch-all-objects` enumerates every object in the repo — invaluable for auditing and for understanding storage costs.

## visualization
Commit C1 -> tree T1 -> {blob B_readme, tree T_src -> {blob B_main}}. Edit `main.py` and commit: new blob B_main', new tree T_src', new tree T1', new commit C2 whose parent is C1. The unchanged `README` blob is reused — Git stores snapshots, but identical content is shared automatically by hash.

## bruteForce
A naive VCS records diffs between revisions. Reconstructing version N requires walking N-1 patches — slow, error-prone, and hard to verify. Storing every full snapshot is simple but seems wasteful. Git's insight: snapshot everything, but deduplicate by content hash, then pack similar objects together. The "brute force" approach (per-file diff chains) is what Git deliberately rejected.

## optimal
Use a content-addressed object database. Compute SHA-1 of `"<type> <length>\0<content>"`, zlib-compress the payload, and write to `.git/objects/<aa>/<rest-of-hash>`. Trees and commits reference children by hash, forming a Merkle DAG. Periodically run `git gc` to repack loose objects into pack files with delta compression for efficient storage and transfer.

## complexity
time: O(1) average to read or write an object by hash (filesystem lookup); O(repo) for `git gc` repack.
space: O(unique-content) — identical files across commits and branches are stored once.
notes: SHA-1 collisions are infeasible in practice; Git is migrating to SHA-256 for future-proofing.

## pitfalls
- Editing files inside `.git/objects/` directly — they are zlib-compressed; use `git cat-file -p <hash>` to inspect.
- Assuming a commit "contains" diffs. It contains a full tree snapshot; diffs are computed on demand against the parent.
- Confusing annotated tags (real tag objects) with lightweight tags (just a ref file pointing at a commit).
- Force-pushing and then wondering where the old commits went — they remain in the object database until `gc` prunes them.

## interviewTips
- Be ready to draw the four-object diagram on a whiteboard.
- Mention Merkle-tree integrity: any change to any file ripples up through every parent hash, making history tamper-evident.
- Compare against Subversion (per-file revision numbers) and Mercurial (revlog with delta chains) to show you understand design trade-offs.

## code.python
```python
import hashlib, zlib, os

def hash_object(content: bytes, obj_type: str = "blob", write: bool = True) -> str:
    header = f"{obj_type} {len(content)}\0".encode()
    store = header + content
    sha = hashlib.sha1(store).hexdigest()
    if write:
        path = os.path.join(".git/objects", sha[:2], sha[2:])
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(zlib.compress(store))
    return sha
```

## code.javascript
```javascript
import { createHash } from "crypto";
import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export function hashObject(content, type = "blob", write = true) {
  const header = Buffer.from(`${type} ${content.length}\0`);
  const store = Buffer.concat([header, content]);
  const sha = createHash("sha1").update(store).digest("hex");
  if (write) {
    const path = join(".git/objects", sha.slice(0, 2), sha.slice(2));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, deflateSync(store));
  }
  return sha;
}
```

## code.java
```java
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.zip.Deflater;

public class GitObject {
    public static String hashObject(byte[] content, String type, boolean write) throws Exception {
        byte[] header = (type + " " + content.length + "\0").getBytes();
        byte[] store = new byte[header.length + content.length];
        System.arraycopy(header, 0, store, 0, header.length);
        System.arraycopy(content, 0, store, header.length, content.length);
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        byte[] hash = md.digest(store);
        StringBuilder sha = new StringBuilder();
        for (byte b : hash) sha.append(String.format("%02x", b));
        if (write) {
            String s = sha.toString();
            Path p = Paths.get(".git/objects", s.substring(0, 2), s.substring(2));
            Files.createDirectories(p.getParent());
            Deflater d = new Deflater();
            d.setInput(store); d.finish();
            byte[] buf = new byte[store.length + 64];
            int n = d.deflate(buf);
            Files.write(p, java.util.Arrays.copyOf(buf, n));
        }
        return sha.toString();
    }
}
```

## code.cpp
```cpp
#include <openssl/sha.h>
#include <zlib.h>
#include <string>
#include <filesystem>
#include <fstream>

std::string hashObject(const std::string& content, const std::string& type = "blob", bool write = true) {
    std::string store = type + " " + std::to_string(content.size()) + '\0' + content;
    unsigned char hash[SHA_DIGEST_LENGTH];
    SHA1(reinterpret_cast<const unsigned char*>(store.data()), store.size(), hash);
    char hex[41];
    for (int i = 0; i < SHA_DIGEST_LENGTH; ++i) sprintf(hex + 2 * i, "%02x", hash[i]);
    std::string sha(hex, 40);
    if (write) {
        auto dir = std::filesystem::path(".git/objects") / sha.substr(0, 2);
        std::filesystem::create_directories(dir);
        uLongf clen = compressBound(store.size());
        std::string out(clen, '\0');
        compress(reinterpret_cast<Bytef*>(out.data()), &clen,
                 reinterpret_cast<const Bytef*>(store.data()), store.size());
        std::ofstream(dir / sha.substr(2), std::ios::binary).write(out.data(), clen);
    }
    return sha;
}
```
