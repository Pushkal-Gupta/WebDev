---
slug: presigned-url
module: sd-caching-cdn
title: Presigned URLs
subtitle: A time-limited, signature-bound URL that lets a browser PUT or GET an object in S3 directly, without ever proxying bytes through your API server.
difficulty: Intermediate
position: 54
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "highscalability.com — Object Storage Patterns"
    url: "http://highscalability.com/"
    type: blog
  - title: "Microservices.io — Access Token Pattern"
    url: "https://microservices.io/patterns/security/access-token.html"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A presigned URL is a normal `https://bucket.s3.amazonaws.com/key?...` URL with extra query parameters: an expiration time, the HTTP method allowed, and an HMAC signature computed by your backend using its private S3 credentials. The browser uses this URL directly — no AWS SDK, no token, no IAM role. When the signature expires (or the method does not match), S3 returns 403. It is the standard way to let a browser upload a profile picture or download a private report without ever giving the browser permanent credentials.

## whyItMatters
Without presigned URLs you have two bad choices: ship long-lived AWS credentials to the browser (instant total compromise of the bucket) or proxy every upload byte through your own server (your API now needs the bandwidth, memory, and CPU of a CDN). Presigned URLs offload all the bandwidth to S3 (or GCS, Azure Blob, R2 — the model is identical across clouds) while keeping access strictly controlled by short expiries and tight policy bindings. Every major SaaS — Notion, Linear, Figma, Slack, GitHub, Loom — uses them for user uploads and for serving private documents. AWS S3's signature version 4 (`AWS4-HMAC-SHA256`) is the canonical implementation; GCP's V4 signing and Cloudflare R2 follow the same construction. The AWS SDK calls them `getSignedUrl`; the official spec is in AWS's *Signing AWS API Requests* documentation.

## intuition
Your backend has the secret access key. It computes `HMAC-SHA256(secret, canonical_request)` where `canonical_request` is a deterministic string encoding the HTTP method, the resource path, query parameters, expiry, content type, and content length. The HMAC becomes `X-Amz-Signature=...` on the URL. S3 receives the request, reconstructs the canonical string from the HTTP headers and query parameters, recomputes the HMAC with its copy of the secret, and constant-time-compares. Match means allowed; mismatch or past-expiry means 403. The browser never sees the secret, only the signed URL — and the URL only works for the exact request that was signed.

The deeper insight is that the signature commits to every binding you choose. If you sign for `Content-Type: image/png`, the client cannot reuse the URL to upload a PDF — the canonical string mismatch makes the HMAC fail. If you sign for a 5-minute expiry, the URL stops working at minute six. If you bind `Content-Length`, the client cannot stream an unbounded body. The signing process is essentially a one-shot capability token: precisely scoped, time-limited, and unforgeable without the secret.

For browser uploads, two flavors exist. `PUT` with a presigned URL is simplest and works for known-key uploads (you decide the key server-side). `POST` with a *policy document* is more flexible for unknown filenames — the policy lets you constrain key prefix (`uploads/${user_id}/`), max size (`content-length-range`), and allowed content types in one envelope, and the browser includes the matching fields in a multipart form.

## visualization
```
Browser                Backend                  S3
   | -- POST /upload-url -->|
   |                        | s3.generate_presigned_url(
   |                        |   "put_object",
   |                        |   Bucket, Key, Expires=300,
   |                        |   ContentType="image/jpeg")
   | <- { url } ------------|
   |
   | -- PUT url, body ----------------------> |  S3 recomputes HMAC,
   |                                          |  checks expiry + method.
   | <- 200 ETag ---------------------------- |
   |
   | -- POST /confirm { key } -> |
                                 | DB row: media(user_id, s3_key, status="uploaded")
```

For downloads the shape is identical with `get_object` and the browser does a GET.

## bruteForce
"Pipe the bytes through my Express server: `app.put('/upload', (req, res) => req.pipe(s3.upload()))`." Now your server pays the bandwidth bill, holds the bytes in memory or on a temp disk, and becomes the bottleneck. A 100 MB upload uses 100 MB of server memory and prevents that node from handling any other request for its duration.

## optimal
Sign the URL on the backend at request time. Use signature version 4 with SHA-256. Keep expirations short (5–15 minutes for uploads, 1–24 hours for downloads of private documents — never sign for days). Bind everything you can: exact `Content-Type`, exact `Content-Length` (or `content-length-range` for browser POSTs), and `Content-MD5` for tamper-detection on uploads. Pair with bucket policies that deny anything that is not a presigned request and deny anything from outside your CIDR allowlist for sensitive buckets.

```python
import boto3

s3 = boto3.client('s3', region_name='us-east-1')
upload_url = s3.generate_presigned_url(
    'put_object',
    Params={
        'Bucket': 'private-uploads',
        'Key': f'users/{user_id}/{uuid4()}.png',
        'ContentType': 'image/png',
        'ServerSideEncryption': 'AES256',
    },
    ExpiresIn=300,            # 5 minutes
    HttpMethod='PUT',
)
```

The critical parameters are `ExpiresIn=300` and the explicit `ContentType` binding: a leaked URL becomes useless in five minutes, and even within that window cannot be repurposed for a different MIME type. For multipart uploads, presign each `UploadPart` URL individually so the browser can parallelize 50 MiB chunks without your backend ever touching the bytes; the final `CompleteMultipartUpload` call stitches the parts on S3's side. For browser-based POST upload, generate a *policy document* that constrains key prefix, content type, and size range, then sign the policy with your secret — the official AWS docs include the canonical example. Always layer with bucket-level encryption (`SSE-S3` or `SSE-KMS`), an explicit `Bucket-Owner-Full-Control` ACL on uploaded objects, and CloudTrail / S3 access logs for audit.

## complexity
time: O(1) signature compute on the backend (< 1 ms); zero backend bandwidth during the actual transfer.
space: Zero on the backend per upload; the URL itself is ~500 bytes.
notes: SigV4 (the current S3 signing scheme) signs the canonical request, the timestamp, and the credential scope. The signature is deterministic — same inputs produce the same URL — so do not cache them in a way that survives the expiration.

## pitfalls
- Long expiration "for convenience" — a leaked 24-hour URL is a 24-hour data leak. Keep upload URLs short.
- Trusting the client to call `/confirm` — implement an S3 event notification (Lambda or SNS) so DB state matches reality even when the client crashes.
- Not constraining `Content-Type` — a user uploads `evil.svg` as `image/jpeg`; you serve it back inline and the SVG runs JS in your origin.
- Not constraining `Content-Length` — a malicious client uploads 50 GB to your private bucket. Use a POST policy with `["content-length-range", 0, 10485760]`.
- Forgetting CORS on the bucket — browser PUT preflight will fail mysteriously. Allow the exact origin and the methods you presigned.
- Reusing the same key across users — race conditions overwrite each other's uploads. Namespace by `user_id/uuid/filename`.

## interviewTips
- Open with "offload bandwidth to S3, keep auth at the backend" — one sentence frames it.
- Distinguish presigned PUT (simple, one file) from presigned POST policy (constrains size, type, prefix).
- Mention S3 event notifications as the source of truth for "did the upload finish?"
- For "design Instagram upload": presigned URL + multipart for video + Lambda thumbnail + CloudFront for read.
- Know SigV4 is the current scheme; SigV2 is deprecated and removed in many regions.

## code.python
```python
import boto3

s3 = boto3.client("s3")

def presign_upload(bucket, key, content_type):
    return s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=300,
        HttpMethod="PUT",
    )

def presign_download(bucket, key):
    return s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=3600,
    )

# Browser POST policy with size cap
def presign_post(bucket, key_prefix):
    return s3.generate_presigned_post(
        Bucket=bucket,
        Key=key_prefix + "/${filename}",
        Conditions=[
            ["starts-with", "$key", key_prefix + "/"],
            ["content-length-range", 0, 10 * 1024 * 1024],
            {"acl": "private"},
        ],
        ExpiresIn=300,
    )
```

## code.javascript
```javascript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });

export async function presignUpload(bucket, key, contentType) {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3, cmd, { expiresIn: 300 });
}

// Browser side
async function uploadFile(file) {
  const { url } = await fetch("/upload-url", {
    method: "POST",
    body: JSON.stringify({ name: file.name, type: file.type }),
  }).then(r => r.json());
  await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
}
```

## code.java
```java
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import java.time.Duration;

String presignUpload(S3Presigner presigner, String bucket, String key, String contentType) {
    PutObjectRequest put = PutObjectRequest.builder()
        .bucket(bucket).key(key).contentType(contentType).build();
    PutObjectPresignRequest req = PutObjectPresignRequest.builder()
        .signatureDuration(Duration.ofMinutes(5))
        .putObjectRequest(put)
        .build();
    return presigner.presignPutObject(req).url().toString();
}
```

## code.cpp
```cpp
#include <aws/s3/S3Client.h>
#include <aws/s3/model/PutObjectRequest.h>
#include <aws/core/http/HttpTypes.h>

Aws::String presign_upload(Aws::S3::S3Client& s3, const Aws::String& bucket,
                           const Aws::String& key, const Aws::String& content_type) {
    Aws::Http::HeaderValueCollection headers;
    headers.emplace("content-type", content_type);
    return s3.GeneratePresignedUrlWithSSES3(
        bucket, key, Aws::Http::HttpMethod::HTTP_PUT, headers, 300 /* seconds */);
}
```
