---
slug: multipart-form-upload
module: system-design
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
The default for browser-based file uploads (avatar, document, CSV import). Done wrong = OOM on large files, slow uploads, allowed unsafe MIME types, no virus scan = security disaster.

## intuition
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
**Server-side rules**:
1. **Stream to disk/S3** — never `req.body.read()` whole file into memory.
2. **Cap size** at the framework layer (`limit: '10mb'`) BEFORE parsing.
3. **Cap parts count** to prevent zip-bomb-style abuse (1000 part headers).
4. **Validate MIME** by checking magic bytes (`file` cmd / libmagic), not the client-supplied Content-Type.
5. **Virus scan** with ClamAV / VirusTotal API on uploaded files.
6. **Random filename** when saving (don't trust client filename — directory traversal risk).
7. **Separate domain** for user-uploaded content (`usercontent.example.com`) to isolate XSS risk.

**Direct-to-S3 upload pattern** (avoids your server touching the file):
1. Client requests presigned URL from your API.
2. Client POSTs directly to S3.
3. S3 fires event → Lambda processes (thumbnail, scan).

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
