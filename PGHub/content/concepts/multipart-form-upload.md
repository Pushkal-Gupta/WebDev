---
slug: multipart-form-upload
module: sd-api
title: Multipart Form Upload
subtitle: HTTP multipart/form-data for file uploads — boundary separators, streaming parse, size limits, virus scanning.
difficulty: Intermediate
position: 53
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "RFC 7578 — multipart/form-data"
    url: "https://datatracker.ietf.org/doc/html/rfc7578"
    type: book
  - title: "MDN — Using FormData objects"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects"
    type: blog
  - title: "expressjs/multer — multipart parser for Node"
    url: "https://github.com/expressjs/multer"
    type: repo
status: published
---

## intro
A browser submits a form with files: `<input type="file">` + `<form enctype="multipart/form-data">`. The browser encodes the request body as a series of parts separated by a random **boundary** string. Each part has its own headers (`Content-Disposition`, `Content-Type`) plus body. Server parses streamingly, writes each file part to disk / object store without loading it all into memory.

## whyItMatters
- **RFC 7578** (and the older RFC 2388) standardize `multipart/form-data` as the only browser-native encoding for file uploads; every `<input type="file">` since HTML 2.0 uses it.
- **AWS S3, Google Cloud Storage, and Azure Blob** expose presigned-POST endpoints that accept multipart bodies — so a browser can upload directly to object storage without touching your server.
- **Express's `multer`, Spring's `MultipartFile`, Django's `request.FILES`, Rails's `ActionDispatch::Http::UploadedFile`** all wrap multipart parsing because rolling your own boundary-scanning parser is dangerous (CVE-2018-1271 in Spring, CVE-2017-15370 in Apache Commons FileUpload).
- **GitHub's release-asset uploads, Slack's file uploads, and Gmail's attachment flow** are all multipart at the wire level; the tus.io resumable-upload protocol layers chunking on top.

## intuition
HTTP bodies are a single byte stream. If a form has only text fields, `application/x-www-form-urlencoded` (the default) percent-encodes them into one `key=value&key=value` string. But files are binary — percent-encoding every byte balloons the payload and corrupts characters that would conflict with the URL syntax. `multipart/form-data` (RFC 7578) solves this by framing the body as a sequence of parts, each separated by a randomly chosen **boundary** string declared in the `Content-Type` header. Each part has its own headers (`Content-Disposition` naming the field, optionally a `filename` and `Content-Type` for files) followed by its raw body bytes.

The boundary is the entire framing trick. The client picks something statistically unlikely to appear in the payload (`----WebKitFormBoundary` plus a random suffix), declares it in the request header, and inserts `--<boundary>` between parts plus `--<boundary>--` as the terminator. The server's job is to scan the stream for those delimiters, split into parts, and dispatch each part — text fields go into a form-data map, file parts get piped to disk or object storage **without ever buffering the full content in memory**.

The mental model is a postal envelope packed with smaller envelopes, each labeled with its purpose ("title", "avatar.jpg"), separated by tape strips you can recognize. The server unpacks one inner envelope at a time, looks at the label, and decides where to file it. The streaming nature is what makes 1 GB uploads tractable on a 64 MB server — the parser never holds more than one boundary's worth of bytes in memory, and it pipes file payloads straight through to disk or S3.

Wire format:
```
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----abc123
Content-Length: 1234

------abc123
Content-Disposition: form-data; name="title"

My Photo
------abc123
Content-Disposition: form-data; name="file"; filename="cat.jpg"
Content-Type: image/jpeg

<binary bytes...>
------abc123--
```

Server reads stream, splits on boundary, for each part: if it has a `filename`, treat as file → pipe to disk/S3; else treat as text field.

## visualization
```
Browser <form enctype="multipart/form-data" method="POST">
   ↓
Stream: ----boundary
        Content-Disposition: form-data; name="title"\n
        \n
        My Photo\n
        ----boundary
        Content-Disposition: form-data; name="file"; filename="cat.jpg"
        Content-Type: image/jpeg\n
        \n
        <streaming binary>
        ----boundary--
   ↓
Server: parser reads chunks, splits on boundary,
        writes 'cat.jpg' part to S3 via streaming upload.
```

## bruteForce
**Read entire body into memory then parse**: works for small files. OOM on 1GB upload.

**Base64-encode and send as JSON**: 33% size overhead + JSON parse cost. Use only for tiny files.

Streaming multipart is the only path for large uploads.

## optimal
The production pattern is **streaming parse + strict limits + magic-byte MIME validation + isolated serving domain**, and for files >10 MB, **direct-to-S3 with presigned URLs**. Never load the full upload into memory; never trust client-supplied metadata. The OWASP Unrestricted File Upload cheat sheet and Brad Geesaman's "File Upload Security" talk codify the disciplines below.

**Server-side multipart rules (in order)**:

1. **Cap request size at the framework layer BEFORE parsing**. `multer({ limits: { fileSize: 10*1024*1024 } })` in Express, `spring.servlet.multipart.max-file-size` in Spring, `DATA_UPLOAD_MAX_MEMORY_SIZE` in Django. Without this, an attacker streams 100 GB and your parser dutifully buffers it.
2. **Cap parts count** (1000 max) to prevent header-flood DoS — analogous to zip-bomb attacks. Spring's `max-request-size` and `max-file-size` together close this.
3. **Stream every file part directly to disk or object storage** using `file.transferTo()` / `req.pipe(s3.upload())`. Never call `.read()` to materialize the bytes.
4. **Validate MIME by magic bytes** using `libmagic` (Python's `python-magic`, Node's `file-type`, Java's Apache Tika). Client-supplied `Content-Type` is attacker-controlled — a `.exe` masquerading as `image/png` will sail through naive checks.
5. **Random filename on save** (UUID + sanitized basename) to neutralize path-traversal payloads (`../../etc/passwd`) and filename collisions.
6. **Virus-scan asynchronously** with ClamAV (`clamd`) or a SaaS like VirusTotal; quarantine files until scan completes.
7. **Serve user uploads from an isolated origin** (`usercontent.example.com`, never the main app domain). An attacker uploading malicious SVG or HTML can execute JS — but only in the isolated origin, not in your authenticated session domain. GitHub uses `githubusercontent.com` for exactly this reason.

```python
# Flask, streaming straight to S3
from flask import request
import boto3, uuid
from werkzeug.utils import secure_filename
import magic

s3 = boto3.client('s3')
ALLOWED_MIMES = {'image/png', 'image/jpeg', 'application/pdf'}

@app.route('/upload', methods=['POST'])
def upload():
    f = request.files.get('file')
    if not f: return ('missing file', 400)
    head = f.stream.read(2048); f.stream.seek(0)            # sniff magic bytes
    real_mime = magic.from_buffer(head, mime=True)
    if real_mime not in ALLOWED_MIMES:
        return ('disallowed type', 415)
    key = f'{uuid.uuid4()}-{secure_filename(f.filename)[:80]}'
    s3.upload_fileobj(f.stream, 'uploads-bucket', key,
                      ExtraArgs={'ContentType': real_mime})
    enqueue_virus_scan(key)
    return {'key': key, 'serve_url': f'https://usercontent.example.com/{key}'}
```

**Direct-to-S3 upload pattern** (preferred for files > 10 MB, avoids your server touching the file at all): client requests a **presigned POST URL** from your API (signed with `AWS Signature v4`), client `POST`s the multipart body directly to S3, S3 fires an `s3:ObjectCreated` event into SNS/SQS/Lambda which runs the virus scan and thumbnailing. For files > 5 GB, use **S3 Multipart Upload** (chunks of 5 MB – 5 GB, resumable, parallel). For browser-resumable uploads with offline tolerance, use the **tus.io** protocol — its HTTP `PATCH` semantics let a flaky mobile connection retry the byte range that failed without restarting the whole upload.

## complexity
- **Server CPU**: O(file_size) — parser overhead is minimal.
- **Memory**: O(1) with streaming.
- **Bandwidth**: 2x file size (browser → server → S3) for direct uploads; 1x with presigned.

## pitfalls
- **Loading full file in memory**: 100 concurrent 1GB uploads = 100GB RAM = OOM.
- **Trusting client filename**: `../../../etc/passwd` traversal. Sanitize or randomize.
- **Trusting client MIME**: attacker uploads `.exe` as `image/png`. Verify magic bytes.
- **No size cap**: 100GB upload exhausts disk.
- **Serving uploads from main domain**: malicious HTML/SVG upload runs JS in your origin.

## interviewTips
- For "design file upload" — streaming multipart + size cap + magic-byte MIME + separate serving domain.
- For large files → direct-to-S3 with presigned URLs.
- For senior: discuss **chunked uploads** (S3 multipart for >5GB), **resumable uploads** (tus protocol).

## code.python
```python
# Flask + streaming
from flask import request
import boto3
s3 = boto3.client('s3')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']           # FileStorage object, streamed
    if file.content_length > 10_000_000:
        return 'too large', 413
    safe_name = f'{uuid.uuid4()}-{secure_filename(file.filename)}'
    s3.upload_fileobj(file.stream, 'mybucket', safe_name)
    return {'key': safe_name}
```

## code.javascript
```javascript
// Express + multer (streaming to disk)
const multer = require('multer');
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp/uploads',
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}-${path.basename(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ path: req.file.path });
});
```

## code.java
```java
// Spring MultipartFile
@PostMapping("/upload")
public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file.getSize() > 10_000_000) return ResponseEntity.status(413).body("too large");
    String safe = UUID.randomUUID() + "-" + file.getOriginalFilename();
    file.transferTo(new File("/uploads/" + safe));
    return ResponseEntity.ok(safe);
}
```

## code.cpp
```cpp
// cpp-httplib or Drogon multipart parser
// httplib::Server svr;
// svr.Post("/upload", [](const auto& req, auto& res) {
//   auto file = req.get_file_value("file");
//   write_to_disk("/uploads/" + uuid() + "-" + file.filename, file.content);
//   res.status = 200;
// });
```
