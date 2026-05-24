---
slug: api-pagination
module: system-design
title: API Pagination Strategies
subtitle: Offset / cursor / keyset / page-token — each has different trade-offs in correctness under writes, deep-pagination cost, and resumability.
difficulty: Intermediate
position: 55
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Use the Index, Luke! — pagination chapter"
    url: "https://use-the-index-luke.com/no-offset"
    type: book
  - title: "Stripe API — cursor pagination"
    url: "https://stripe.com/docs/api/pagination"
    type: blog
  - title: "graphql/graphql-relay-js — Relay-spec cursor pagination"
    url: "https://github.com/graphql/graphql-relay-js"
    type: repo
status: published
---

## intro
A list endpoint returns 100 items at a time. The client wants page 2, page 3, .... Four common strategies:
- **Offset pagination**: `?page=2&size=50` → SQL `OFFSET 50 LIMIT 50`. Simple but degrades quadratically and skips/dupes under concurrent inserts.
- **Cursor pagination**: server returns `next_cursor`; client passes it back. Stable + fast even at deep pages.
- **Keyset pagination**: `WHERE created_at > $last_seen` — same idea as cursor, simpler when sort key is monotone.
- **Page-token pagination** (Google APIs / Relay): opaque base64 cursors; client treats them as black boxes.

## whyItMatters
Every list endpoint hits this. Choose wrong:
- Offset for big lists → page 100 takes seconds; page 1000 times out.
- New items appearing → users see same row twice OR miss rows entirely.
- Mobile clients can't resume after dropped connection.

Stripe, GitHub, Twitter, every modern API uses cursor / page-token. Offset is for prototypes only.

## intuition
**Offset's problem**:
- `OFFSET 100000 LIMIT 50` → DB reads 100050 rows, throws first 100000 away. O(offset). Page 1000 is 1000× slower than page 1.
- Between page 1 (fetched at T0) and page 2 (fetched at T1), 5 new items insert at the top → page 2's first row is page 1's last row (duplicate) OR rows skipped.

**Cursor / keyset**:
- Pass last-seen key (e.g. `created_at + id`). Server: `WHERE (created_at, id) > ($cursor_t, $cursor_id) ORDER BY ...`.
- O(log n) — index seek to start. Constant work per page regardless of position.
- New items above don't shift pagination — you keep walking from your cursor.

**Opaque page tokens** wrap the keyset in base64 / encryption — client can't reverse-engineer the schema. Pattern used by Google + GraphQL Relay.

## visualization
```
Offset (broken under inserts):
  GET /items?offset=0&limit=3   →  [A, B, C]
  [insert X at top]
  GET /items?offset=3&limit=3   →  [C, D, E]  ← C is duplicated! D shifted from offset 2.

Cursor:
  GET /items?cursor=&limit=3              →  [A, B, C] + next_cursor=encode(C)
  [insert X at top]
  GET /items?cursor=encode(C)&limit=3     →  [D, E, F]  ← clean.

Keyset SQL:
  -- naive offset (slow at scale)
  SELECT * FROM items ORDER BY id LIMIT 50 OFFSET 100000;   -- reads 100050 rows

  -- keyset (fast at any depth)
  SELECT * FROM items WHERE id > 100000 ORDER BY id LIMIT 50;   -- index seek + 50 rows
```

## bruteForce
**Return all rows in one call**: works for <1000 items, dies past 10k.

**Offset everywhere**: simple to implement; broken under inserts; slow at depth.

**Page numbers stored client-side** (`page=N`): same as offset.

For any list that might grow past 1000 rows, use cursors.

## optimal
**Cursor design**:
- Cursor = base64(JSON of sort columns) — e.g., `base64({"created_at": 1729..., "id": 42})`.
- Server validates + decodes; if invalid, treat as start.
- Include sort direction in cursor or as separate param.

**Stable sort** required: cursor needs unique tie-breaker. `ORDER BY created_at DESC, id DESC` — `id` resolves ties.

**Query** (Postgres):
```sql
SELECT * FROM items
WHERE (created_at, id) < ($cursor_created_at, $cursor_id)   -- row tuple comparison
ORDER BY created_at DESC, id DESC
LIMIT $limit
```

**Response shape** (Stripe-style):
```json
{
  "data": [...],
  "has_more": true,
  "next_cursor": "eyJjcmVhdGVkX2F0IjogMTcyOTAwMDAwMCwgImlkIjogNDJ9"
}
```

**Bidirectional** (prev + next): include `prev_cursor` too. Required for "Page back" UI.

**Total count** (optional + expensive): `SELECT count(*)` separately — expensive on big tables. Often returned only on first page OR omitted entirely.

## complexity
- **Offset**: O(offset + limit). Page 1000 = 1000× page 1.
- **Cursor / keyset**: O(log n + limit). Constant per page.
- **Total count**: O(n) — usually omit or cache.

## pitfalls
- **Sort without tie-breaker**: rows with same `created_at` get duplicated/skipped. Always include unique key.
- **Cursor leaks data**: don't put sensitive info in plain JSON. Encrypt OR HMAC-sign so client can't tamper.
- **Changing sort order mid-pagination**: cursor becomes meaningless. Pin sort to a query param the cursor encodes.
- **Index missing on sort columns**: keyset still slow. Always `CREATE INDEX (created_at, id)`.
- **Returning offset/total alongside cursor**: client treats them inconsistently. Pick one model.
- **Deleting/inserting around cursor**: page boundaries may shift. Users may see a row twice (rarely a problem unless idempotency matters).

## interviewTips
- For "design list endpoint" → cursor / keyset.
- Cite **OFFSET's O(offset) scan cost** as the primary reason.
- For senior interviews, discuss **bidirectional cursors**, **opaque tokens** (vs leaking schema), **GraphQL Relay spec** (`PageInfo { hasNextPage, endCursor }`).

## code.python
```python
# Postgres + cursor (Flask)
import json, base64
from flask import request, jsonify

def list_items():
    cursor = request.args.get('cursor')
    limit = min(int(request.args.get('limit', 50)), 100)

    if cursor:
        decoded = json.loads(base64.urlsafe_b64decode(cursor))
        rows = db.fetch("""
            SELECT id, created_at, name FROM items
            WHERE (created_at, id) < (%s, %s)
            ORDER BY created_at DESC, id DESC
            LIMIT %s
        """, (decoded['t'], decoded['id'], limit + 1))
    else:
        rows = db.fetch("""
            SELECT id, created_at, name FROM items
            ORDER BY created_at DESC, id DESC
            LIMIT %s
        """, (limit + 1,))

    has_more = len(rows) > limit
    if has_more: rows = rows[:limit]
    next_cursor = None
    if has_more:
        last = rows[-1]
        next_cursor = base64.urlsafe_b64encode(
            json.dumps({'t': last['created_at'].isoformat(), 'id': last['id']}).encode()
        ).decode()
    return jsonify({'data': rows, 'has_more': has_more, 'next_cursor': next_cursor})
```

## code.javascript
```javascript
// Express + pg cursor pagination
app.get('/items', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50'), 100);
  let rows;
  if (req.query.cursor) {
    const c = JSON.parse(Buffer.from(req.query.cursor, 'base64url').toString());
    rows = await db.query(`
      SELECT * FROM items
      WHERE (created_at, id) < ($1, $2)
      ORDER BY created_at DESC, id DESC LIMIT $3
    `, [c.t, c.id, limit + 1]);
  } else {
    rows = await db.query(`SELECT * FROM items ORDER BY created_at DESC, id DESC LIMIT $1`, [limit + 1]);
  }
  const hasMore = rows.length > limit;
  const data = rows.slice(0, limit);
  const nextCursor = hasMore
    ? Buffer.from(JSON.stringify({ t: data.at(-1).created_at, id: data.at(-1).id })).toString('base64url')
    : null;
  res.json({ data, has_more: hasMore, next_cursor: nextCursor });
});
```

## code.java
```java
// Spring + JPA — Slice (cursor-style)
public interface ItemRepo extends JpaRepository<Item, Long> {
    @Query("SELECT i FROM Item i WHERE i.createdAt < :cursorT OR (i.createdAt = :cursorT AND i.id < :cursorId) ORDER BY i.createdAt DESC, i.id DESC")
    Slice<Item> findPage(@Param("cursorT") Instant t, @Param("cursorId") Long id, Pageable pageable);
}
```

## code.cpp
```cpp
// libpqxx — row-tuple comparison for keyset pagination
// pqxx::work tx(conn);
// auto rows = tx.exec_params(
//   "SELECT * FROM items WHERE (created_at, id) < ($1, $2) "
//   "ORDER BY created_at DESC, id DESC LIMIT $3",
//   cursor_t, cursor_id, limit + 1);
```
