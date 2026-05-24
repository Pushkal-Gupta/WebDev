---
slug: multipart-upload
module: system-design
title: Multipart Upload
subtitle: How to ship a 5 GB file over a flaky mobile network without restarting from byte zero when the connection drops at 4.8 GB.
difficulty: Intermediate
position: 53
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "highscalability.com — Object Storage at Scale"
    url: "http://highscalability.com/"
    type: blog
  - title: "Microservices.io — Saga Pattern"
    url: "https://microservices.io/patterns/data/saga.html"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Multipart upload splits a large blob into independent parts, ships each part separately, and stitches them server-side. S3, GCS, Azure Blob, and every serious object store implement the same three-call dance: `Initiate -> UploadPart{ N } -> Complete`. The win is *resumability* (a dropped TCP connection only loses the in-flight part), *parallelism* (push 8 parts at once over the same link), and *content-addressable verification* (the server returns an ETag per part; mismatched parts are re-uploaded individually).

## whyItMatters
Any product that handles user video, large datasets, or backup archives must do this. Without it, a 4 GB upload that fails at 99% wastes 4 GB of user bandwidth and earns a 1-star app-store review. With it, you retry one 10 MB part. Multipart upload is also the only way to stream-upload a file whose total size is unknown at the time the first byte starts flowing (live-recorded video, log dumps).

## intuition
Three calls. The first (`CreateMultipartUpload`) hands you an `uploadId` — server-side state that says "I have a partial object pending under this key." For each chunk you call `UploadPart(uploadId, partNumber, bytes)` and keep the `ETag` the server returns. When all parts are uploaded you call `CompleteMultipartUpload(uploadId, [{partNumber, ETag}])` and the server concatenates them atomically. Parts can arrive out of order, in parallel, retried individually — only the final manifest defines the order.

## visualization
```
Client                                S3
  | -- POST ?uploads -------------->  |  CreateMultipartUpload
  | <- { UploadId: U123 } ----------  |
  |                                   |
  | -- PUT ?partNumber=1&uploadId=U   | --\
  | -- PUT ?partNumber=2&uploadId=U   |    >  parallel, any order
  | -- PUT ?partNumber=3&uploadId=U   | --/
  | <- { ETag: "a3..." } each --------|
  |                                   |
  | -- POST ?uploadId=U ------------> |  CompleteMultipartUpload
  |     { Parts: [{1,a3},{2,b8},{3,c1}]}
  | <- { Location, ETag(of object) } -|
```

If the client crashes mid-upload, calling `ListMultipartUploads` returns U123 and the client resumes by calling `ListParts` to see which numbers already landed.

## bruteForce
"Just `PUT /key` the whole file in one HTTP request." Works at 10 MB, struggles at 100 MB, fails at 5 GB. S3 caps single-PUT at 5 GB; many proxies cap at 100 MB. One TCP reset and you restart. No parallelism — you are stuck with the throughput of a single connection. No content verification per chunk, so a silent corruption forces a full re-upload.

## optimal
- Part size: 5 MB minimum (S3 rule), 8-16 MB sweet spot for mobile, 100 MB+ for fat datacenter links. Max 10,000 parts per upload.
- Parallelism: 4-8 concurrent uploads per file is the bandwidth-vs-memory sweet spot; more saturates the link with no gain.
- On part failure: exponential backoff with jitter, retry only that part, give up after ~5 attempts.
- Always send `Content-MD5` per part; S3 verifies and rejects corrupt parts.
- On abort or 24h timeout: call `AbortMultipartUpload` to release storage — orphaned parts still cost money.
- Use *presigned* per-part URLs so the browser can upload directly without your server proxying bytes.

## complexity
time: O(N/P) where N = total bytes, P = parts in flight. Bandwidth-bound at the link, not the protocol.
space: O(part_size * parallelism) on the client; O(N) on the server until Complete is called.
notes: Server-side concatenation is free for S3 (the storage layer just references the existing part blobs by ETag). The total object's ETag is `MD5(concat(MD5_of_each_part))-N`, which is why an S3 ETag with a `-` is the giveaway that it was multipart uploaded.

## pitfalls
- Forgetting `AbortMultipartUpload` on cancel — pending parts accumulate and cost real money. Set a lifecycle rule to auto-abort after 7 days.
- Part size below 5 MB (except the last part) — `Complete` returns `EntityTooSmall` and the whole upload is wasted.
- Reusing `partNumber` values — last write wins. Use 1..N strictly increasing.
- Sending parts serially — the whole point is parallelism. 1 part at a time = no win over single PUT.
- Hard-coding `uploadId` lifetimes — they survive for 7 days by default but a lifecycle policy can shorten this.
- Trusting `Content-Length` from the client without re-checking — a lying client can pad the manifest and steal storage.

## interviewTips
- Three calls: Initiate, UploadPart (xN), Complete. Plus Abort and ListParts for recovery.
- Pick part size based on network: 8 MB for mobile, 64 MB for backbone.
- Mention presigned URLs for browser direct-upload — your API server never sees the bytes.
- Know the ETag-with-dash giveaway and how the composite ETag is computed.
- For "design Dropbox upload": multipart + resumable + content-addressed dedupe (rolling hash chunks).

## code.python
```python
import boto3, math, os, concurrent.futures

s3 = boto3.client("s3")
PART = 8 * 1024 * 1024   # 8 MB

def upload(bucket, key, path):
    init = s3.create_multipart_upload(Bucket=bucket, Key=key)
    upload_id = init["UploadId"]
    size = os.path.getsize(path)
    parts = []
    try:
        with open(path, "rb") as f, \
             concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            futures = []
            for i in range(math.ceil(size / PART)):
                data = f.read(PART)
                futures.append(pool.submit(s3.upload_part,
                    Bucket=bucket, Key=key, PartNumber=i + 1,
                    UploadId=upload_id, Body=data))
            for i, fut in enumerate(futures):
                parts.append({"PartNumber": i + 1, "ETag": fut.result()["ETag"]})
        s3.complete_multipart_upload(Bucket=bucket, Key=key,
            UploadId=upload_id, MultipartUpload={"Parts": parts})
    except Exception:
        s3.abort_multipart_upload(Bucket=bucket, Key=key, UploadId=upload_id)
        raise
```

## code.javascript
```javascript
// AWS SDK v3 has Upload() that wraps all three calls.
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream, statSync } from "fs";

const s3 = new S3Client({ region: "us-east-1" });

async function upload(bucket, key, path) {
  const u = new Upload({
    client: s3,
    params: { Bucket: bucket, Key: key, Body: createReadStream(path) },
    queueSize: 8,
    partSize: 8 * 1024 * 1024,
    leavePartsOnError: false,  // calls AbortMultipartUpload on failure
  });
  u.on("httpUploadProgress", p => console.log(p.loaded, "/", p.total));
  return u.done();
}
```

## code.java
```java
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.core.sync.RequestBody;
import java.nio.file.*;
import java.util.*;

void upload(S3Client s3, String bucket, String key, Path file) throws Exception {
    long size = Files.size(file);
    long part = 8L * 1024 * 1024;
    String uploadId = s3.createMultipartUpload(
        CreateMultipartUploadRequest.builder().bucket(bucket).key(key).build()
    ).uploadId();
    List<CompletedPart> done = new ArrayList<>();
    try (var ch = Files.newByteChannel(file)) {
        for (int n = 1; (n - 1) * part < size; n++) {
            long len = Math.min(part, size - (n - 1L) * part);
            var buf = java.nio.ByteBuffer.allocate((int) len);
            ch.read(buf);  buf.flip();
            String etag = s3.uploadPart(UploadPartRequest.builder()
                .bucket(bucket).key(key).uploadId(uploadId).partNumber(n).build(),
                RequestBody.fromByteBuffer(buf)).eTag();
            done.add(CompletedPart.builder().partNumber(n).eTag(etag).build());
        }
    }
    s3.completeMultipartUpload(CompleteMultipartUploadRequest.builder()
        .bucket(bucket).key(key).uploadId(uploadId)
        .multipartUpload(CompletedMultipartUpload.builder().parts(done).build())
        .build());
}
```

## code.cpp
```cpp
// AWS SDK for C++
#include <aws/s3/S3Client.h>
#include <aws/s3/model/CreateMultipartUploadRequest.h>
#include <aws/s3/model/UploadPartRequest.h>
#include <aws/s3/model/CompleteMultipartUploadRequest.h>

void upload(Aws::S3::S3Client& s3, const Aws::String& bucket,
            const Aws::String& key, const std::string& path) {
    Aws::S3::Model::CreateMultipartUploadRequest init;
    init.SetBucket(bucket); init.SetKey(key);
    auto upload_id = s3.CreateMultipartUpload(init).GetResult().GetUploadId();

    std::vector<Aws::S3::Model::CompletedPart> parts;
    const size_t PART = 8 * 1024 * 1024;
    std::ifstream f(path, std::ios::binary);
    int n = 1;
    while (f) {
        std::vector<char> buf(PART);
        f.read(buf.data(), PART);
        auto bytes = f.gcount();
        if (bytes <= 0) break;
        auto body = Aws::MakeShared<Aws::StringStream>("");
        body->write(buf.data(), bytes);
        Aws::S3::Model::UploadPartRequest up;
        up.SetBucket(bucket); up.SetKey(key); up.SetUploadId(upload_id);
        up.SetPartNumber(n); up.SetBody(body);
        auto etag = s3.UploadPart(up).GetResult().GetETag();
        Aws::S3::Model::CompletedPart cp; cp.SetPartNumber(n++); cp.SetETag(etag);
        parts.push_back(cp);
    }
    Aws::S3::Model::CompleteMultipartUploadRequest done;
    done.SetBucket(bucket); done.SetKey(key); done.SetUploadId(upload_id);
    Aws::S3::Model::CompletedMultipartUpload mp;
    mp.SetParts(parts); done.SetMultipartUpload(mp);
    s3.CompleteMultipartUpload(done);
}
```
