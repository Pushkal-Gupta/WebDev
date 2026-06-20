---
slug: sql-injection
module: sd-auth-security
title: SQL Injection Prevention
subtitle: Always use parameterized queries — concatenating user input into SQL is the #1 oldest, still-exploited web vuln.
difficulty: Intermediate
position: 38
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "OWASP — SQL Injection Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
    type: book
  - title: "Portswigger Web Security Academy — SQLi labs"
    url: "https://portswigger.net/web-security/sql-injection"
    type: blog
  - title: "sqlmap — automated SQLi detection / exploitation"
    url: "https://github.com/sqlmapproject/sqlmap"
    type: repo
status: published
---

## intro
The classic mistake: `db.query("SELECT * FROM users WHERE name = '" + user + "'")`. If `user = "'; DROP TABLE users--"`, the resulting SQL is `SELECT * FROM users WHERE name = ''; DROP TABLE users--'`. Two statements; second drops the table. The fix is **parameterized queries** (a.k.a. prepared statements): `db.query("SELECT * FROM users WHERE name = ?", [user])`. The driver sends the SQL + parameters separately; the DB plans the query with placeholders, then substitutes values — never re-parsing the user input as SQL.

## whyItMatters
SQL injection has been #1-#3 OWASP since 2003. Still actively exploited:
- 2024 Snowflake customer breaches via SQLi-adjacent vulns.
- 2017 Equifax — 147M records — Apache Struts deserialization chained with SQLi-like patterns.
- $4M average breach cost (IBM 2023).

Trivial to prevent with parameterized queries. Crippling when present.

## intuition
**Concatenation is wrong**:
```
SELECT * FROM x WHERE col = '${input}'
```
- Input `' OR 1=1 --` → returns ALL rows.
- Input `'; DROP TABLE x; --` → drops the table.
- Input `' UNION SELECT password FROM users --` → leaks data.

**Parameterized is right**:
```
db.query('SELECT * FROM x WHERE col = $1', [input])
```
The DB driver sends `'SELECT * FROM x WHERE col = $1'` + the value separately. The `$1` placeholder is treated as a value, never as SQL syntax — quotes, semicolons, `OR 1=1` are just literal text.

## visualization
```
Vulnerable code:
  sql = "SELECT * FROM users WHERE id = " + input
  db.execute(sql)
  ↓ input = "1 OR 1=1"
  → SELECT * FROM users WHERE id = 1 OR 1=1
  → returns EVERY user

Parameterized:
  db.execute("SELECT * FROM users WHERE id = $1", [input])
  ↓ input = "1 OR 1=1"
  → DB executes the prepared statement with value "1 OR 1=1" cast to integer
  → 22P02 invalid integer (or returns nothing) — safe
```

## bruteForce
**Manual escaping** (`input.replace("'", "''")`):
- Forgets backslash, null byte, unicode quote.
- Doesn't help for non-string contexts (numeric, identifier).
- Brittle. Always wrong eventually.

**Stored procedures**:
- Help IF you use parameter binding inside. Don't if the procedure itself concatenates strings.

**ORM blind trust**:
- `User.findById(input)` is safe. But `User.findBySql("WHERE name = '" + input + "'")` ISN'T.
- Every ORM has an escape-hatch for raw SQL. Audit those.

## optimal
**Always use the driver's parameter binding**. Per language:
- **Python** (psycopg2): `cur.execute("SELECT * FROM users WHERE id = %s", (id,))`
- **Node** (pg): `client.query('SELECT * FROM users WHERE id = $1', [id])`
- **Java** (JDBC): `pstmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?"); pstmt.setInt(1, id);`
- **PHP** (PDO): `$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?"); $stmt->execute([$id]);`
- **Go** (database/sql): `db.Query("SELECT * FROM users WHERE id = $1", id)`

**Identifier injection** (table names, column names): parameters DON'T work — you can't bind a table name. You MUST whitelist:
```python
ALLOWED_SORT = {'name', 'created_at', 'id'}
if sort not in ALLOWED_SORT: sort = 'id'
sql = f"SELECT * FROM users ORDER BY {sort}"
```

**ORM safe by default**: SQLAlchemy `select(User).where(User.name == name)` is safe; ORM-built `.text("...")` raw is not.

**Defense in depth**:
- Least-privilege DB user (read-only for query endpoints).
- Web Application Firewall (Cloudflare, AWS WAF) — blocks obvious SQLi patterns.
- Logging + alerting on syntax errors (high SQLi attempts).

## complexity
- **Parameterized query overhead**: zero (sometimes faster — DB can cache the plan).
- **Whitelist check on identifiers**: O(1).

## pitfalls
- **String concatenation in ANY raw-SQL escape hatch**: ORM `.exec()`, `.findBySql()`, dashboard query builders. Audit every place.
- **Dynamic table/column names via parameters**: doesn't work. Whitelist + concatenate.
- **`LIKE` injection**: `WHERE name LIKE '%' || input || '%'` — input `%` matches everything. Escape `%` and `_` in user input before LIKE.
- **Second-order SQLi**: store user input, later use it in unsafe concatenation elsewhere. Parameterize at every read.
- **DB error messages leaked to client**: reveals schema. Catch + return generic 500.

## interviewTips
- For "how do you prevent SQL injection" → parameterized queries, every time.
- Distinguish **parameter binding** (values) from **identifier whitelisting** (table/column names).
- For senior: discuss **DB user privilege scoping**, **WAF**, **automated detection with sqlmap in CI**.

## code.python
```python
import psycopg2
conn = psycopg2.connect(...)
cur = conn.cursor()
# Safe:
cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
# Safe with named placeholders:
cur.execute("SELECT * FROM users WHERE id = %(id)s AND name = %(name)s",
            {'id': user_id, 'name': user_name})
```

## code.javascript
```javascript
// pg
const { rows } = await client.query(
  'SELECT * FROM users WHERE id = $1 AND email = $2',
  [userId, email],
);

// Knex query builder (also safe)
const users = await knex('users').where({ id: userId, email: email });
```

## code.java
```java
// JDBC prepared statement
try (PreparedStatement ps = conn.prepareStatement(
    "SELECT * FROM users WHERE id = ? AND email = ?")) {
    ps.setLong(1, userId);
    ps.setString(2, email);
    try (ResultSet rs = ps.executeQuery()) { /* ... */ }
}
```

## code.cpp
```cpp
// libpqxx — prepared statement
#include <pqxx/pqxx>
pqxx::work tx(conn);
tx.exec_params("SELECT * FROM users WHERE id = $1", userId);
tx.commit();
```
