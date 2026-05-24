---
slug: git-internals-objects
module: cs-core
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
Most Git confusion ("why did `reset` change my files?", "what does HEAD really point at?") evaporates once you can see Git as a graph of immutable objects. Knowing the model also lets you diagnose corruption, write recovery scripts, and build tooling — and it is a frequent question in infra and developer-productivity interviews.

## intuition
Picture a giant dictionary on disk where the key is a SHA-1 hash and the value is some zlib-compressed bytes. A blob holds raw file contents. A tree holds a directory listing — names plus the hashes of the blobs or sub-trees they point at. A commit holds a tree hash, parent hash(es), author, and message. A tag wraps a commit hash with a signature. References like `main` are just text files containing a commit hash.

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
