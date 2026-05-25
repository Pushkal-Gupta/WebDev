---
slug: compression-gzip-brotli
module: cs-tools-encodings
title: Compression — gzip, brotli, zstd
subtitle: Picking the right encoder — ratio vs CPU vs latency, and why each ships in different places.
difficulty: Intermediate
position: 53
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Data Compression Algorithms — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/data-compression-and-its-types/"
    type: blog
  - title: "Algorithms, 4th Edition — Data Compression"
    url: "https://algs4.cs.princeton.edu/55compression/"
    type: book
  - title: "google/brotli"
    url: "https://github.com/google/brotli"
    type: repo
status: published
---

## intro
HTTP responses, log files, package manifests, and database backups all compress well because text and structured data have massive redundancy. Three modern compressors dominate: **gzip** (DEFLATE, ubiquitous since 1992), **brotli** (Google, ships in every browser, best ratio for text), and **zstd** (Facebook, fastest decompression and tunable across the entire ratio/speed curve). Picking among them is a per-workload trade-off — there is no single winner.

## whyItMatters
Bandwidth dominates page-load and API costs at scale. A 30% ratio improvement on HTML cuts CDN egress bills and improves Time-To-Interactive worldwide. The wrong choice (e.g., brotli-11 on dynamic API responses) burns server CPU and worsens latency. The right choice (brotli-4 for HTML, gzip for everything legacy clients touch, zstd for internal RPC and storage) is a senior infra decision interviewers probe for in CDN, performance, and platform roles.

## intuition
Compression replaces repeated patterns with short codes. Imagine a dictionary that maps frequent phrases to one-byte tokens. gzip uses a small sliding window (32 KB) and a fixed coding scheme — fast to set up, modest ratio. brotli adds a 16 MB window plus a 120 KB *static dictionary* of common web text (HTML tags, English words, JS keywords) baked into the spec — that's why it crushes HTML in particular. zstd uses a tunable window (up to multi-GB) and a learned entropy model — adjusting one knob trades CPU for ratio across an enormous range.

## visualization
Compress a 1 MB HTML page. gzip-6 (default): 200 KB output, 30 ms compress, 5 ms decompress. brotli-4: 170 KB, 50 ms compress, 6 ms decompress. brotli-11 (max): 150 KB, 5000 ms compress (!), 6 ms decompress — only worth it for static assets you compress once and serve a million times. zstd-3: 195 KB, 8 ms compress, 3 ms decompress — fastest of the three at comparable ratio. zstd-19: 165 KB, 800 ms compress, 4 ms decompress — closes the gap with brotli at far lower cost than brotli-11.

## bruteForce
Serve everything uncompressed. Every byte of HTML, JSON, JS, and CSS goes over the wire raw. Bandwidth costs 3-5× higher, mobile users on metered plans suffer, and Time-To-Interactive balloons. Acceptable only for already-compressed binary content (JPEG, MP4, encrypted blobs) where re-compression yields nothing and burns CPU. Even there, the `Content-Encoding: identity` header should be explicit.

## optimal
Compress at the right time with the right encoder. Static assets: precompress with brotli-11 *and* gzip-9 at build time, ship both, let the CDN serve based on `Accept-Encoding`. Dynamic responses: on-the-fly brotli-4 or gzip-6 (a small CPU cost for a 70-80% size reduction). Internal RPC: zstd at its default level — best decode speed when both ends are yours. Backups and logs: zstd at a high level, with the long-range mode for cross-file dedup. Storage engines (RocksDB, Parquet): zstd as the default block compressor.

## complexity
time: compress: gzip-6 ~ 30 MB/s, brotli-4 ~ 20 MB/s, brotli-11 ~ 0.2 MB/s, zstd-3 ~ 500 MB/s, zstd-19 ~ 2 MB/s
space: window memory: gzip 32 KB, brotli up to 16 MB, zstd up to ~ window-size GB
notes: Decompression is roughly symmetric in CPU cost across the three for typical levels. Brotli has the largest *absolute* spread between fastest (q=1) and slowest (q=11) settings — picking the right level matters more than picking the algorithm.

## pitfalls
- Compressing already-compressed content (JPEG, MP4, zip files) — wastes CPU and often *increases* size by a few bytes due to framing overhead.
- Using max-level brotli for dynamic responses — a 5-second per-response CPU spike is a denial-of-service against your own server.
- Forgetting the `Vary: Accept-Encoding` header on cached compressed responses — proxies serve gzip to brotli clients and vice versa, causing decode failures.
- Streaming compressors with no flush — a partial frame held in the encoder buffer never reaches the client until the connection closes, hurting interactive latency.

## interviewTips
- Match algorithm to lifecycle: precompress static, on-the-fly compress dynamic, zstd for internal traffic.
- Mention brotli's static dictionary — interviewers love that detail because most candidates do not know it exists.
- Always discuss the ratio-vs-CPU curve, never a single number. "Brotli is better" is wrong without a level.
- Bring up `Vary: Accept-Encoding` proactively when caching comes up — missing it is a classic outage source.

## code.python
```python
import gzip, brotli, zstandard as zstd

data = open('/etc/dictionaries-common/words', 'rb').read()[:200_000]

g = gzip.compress(data, compresslevel=6)
b = brotli.compress(data, quality=4)
z = zstd.ZstdCompressor(level=3).compress(data)

print(f"raw={len(data):,}  gzip={len(g):,}  brotli={len(b):,}  zstd={len(z):,}")
```

## code.javascript
```javascript
const { gzipSync, brotliCompressSync, constants } = require('zlib');
const fs = require('fs');

const data = fs.readFileSync('package-lock.json');
const g = gzipSync(data, { level: 6 });
const b = brotliCompressSync(data, {
  params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
});
console.log(`raw=${data.length} gzip=${g.length} brotli=${b.length}`);
```

## code.java
```java
import java.util.zip.GZIPOutputStream;
import java.io.*;

public class CompressDemo {
    public static void main(String[] args) throws Exception {
        byte[] data = new byte[200_000];
        new java.util.Random(1).nextBytes(data);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (GZIPOutputStream gz = new GZIPOutputStream(bos)) { gz.write(data); }
        System.out.println("raw=" + data.length + " gzip=" + bos.size());
    }
}
```

## code.cpp
```cpp
#include <zlib.h>
#include <vector>
#include <cstdio>
#include <cstring>

int main() {
    std::vector<unsigned char> src(200000, 'a');
    for (size_t i = 0; i < src.size(); ++i) src[i] = (unsigned char)((i * 31) % 26 + 'a');

    uLongf dstLen = compressBound(src.size());
    std::vector<unsigned char> dst(dstLen);
    compress2(dst.data(), &dstLen, src.data(), src.size(), 6);
    printf("raw=%zu gzip=%lu\n", src.size(), dstLen);
}
```
