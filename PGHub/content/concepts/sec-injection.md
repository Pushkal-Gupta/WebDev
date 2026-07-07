---
slug: sec-injection
module: web-security
title: SQL & Command Injection
subtitle: How untrusted input slips past the data boundary and gets executed by an interpreter — SQL engines, OS shells, and beyond — and why parameterized queries, least privilege, and validation shut it down.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 15
prereqs: []
relatedProblems: []
references:
  - title: "OWASP — SQL Injection"
    url: "https://owasp.org/www-community/attacks/SQL_Injection"
    type: article
  - title: "OWASP — SQL Injection Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
    type: article
  - title: "OWASP — Command Injection"
    url: "https://owasp.org/www-community/attacks/Command_Injection"
    type: article
  - title: "PortSwigger — SQL injection"
    url: "https://portswigger.net/web-security/sql-injection"
    type: article
status: published
---

## intro
Injection happens when data a user supplied gets handed to an interpreter as part of a command. A login form, a search box, a report filter, a filename passed to a shell — any place where your code builds a query or a command string by gluing untrusted input into it can be steered by an attacker who writes input designed to break out of the data slot and become instructions. Because the interpreter — a SQL engine, an OS shell, an LDAP directory, an XPath processor — cannot tell which characters you intended as data and which the attacker injected as syntax, it runs all of them. This lesson focuses on the two most damaging and common variants, SQL injection and OS command injection, and the one fix that actually closes the hole: never build commands by string concatenation — keep code and data on separate channels.

## whyItMatters
Injection has topped or near-topped the OWASP list for over twenty years because the payoff for an attacker is total. A single concatenated SQL query can leak an entire user table — emails, password hashes, payment tokens — with one crafted input, or `DROP` a table, or return every row by turning a `WHERE` clause always-true. Command injection is worse still: it hands the attacker a shell on your server, which means arbitrary file reads, credential theft from environment variables, lateral movement into your internal network, and often full host takeover. Unlike bugs that need a chain of conditions, injection frequently works on the first try against an obvious endpoint, and automated scanners find these holes at scale. The root cause is mundane — one query assembled with `+` or an f-string instead of a bound parameter — which is exactly why it keeps shipping. Understanding the data/code boundary is not academic; it is the difference between a filter that returns three rows and a breach that returns your whole database.

## intuition
Every injection bug is the same mistake wearing different clothes: **untrusted data is concatenated into a string that an interpreter will parse as syntax.** Picture a SQL query as a sentence with a blank to fill in — `SELECT * FROM users WHERE name = '___'`. When you build that sentence by pasting the user's input into the blank, you are trusting the user to only write a *name*. But the interpreter reads the whole finished sentence character by character, and a quote character `'` in the input closes the string early. Everything the attacker types after that quote is no longer inside the value — it is now part of the query grammar. Input like `' OR '1'='1` turns `name = '' OR '1'='1'`, a condition that is always true, so the login check passes without a password. Input like `'; DROP TABLE users; --` ends the intended statement and starts a brand-new destructive one, commenting out the rest.

The exact same failure drives command injection. When you build a shell command by concatenating a filename — `ping -c 1 <host>` — the shell treats `;`, `|`, `&&`, `$()`, and backticks as control syntax. A host value of `8.8.8.8; cat /etc/passwd` runs your ping *and then* the attacker's command, because the shell parsed the semicolon as a separator, not as a literal character in a hostname.

The reason blacklisting the "bad characters" fails is that the set of dangerous syntax is large, context-dependent, and endlessly encodable — comments, unicode variants, nested quoting, alternate operators. The durable fix flips the model entirely. Instead of trying to sanitize data so it *looks* safe inside a command string, you stop building the command from a string at all. You send the interpreter the command **template** and the data **separately**, over different channels, so the data is never parsed as syntax. A bound parameter is not "escaped input"; it is data the engine was told, up front, is only ever a value. That structural separation is what makes it impossible for a quote in the input to change the shape of the query.

## visualization
```
  USER INPUT:   ' OR '1'='1        (intended: a username)
       |
       |  CONCATENATION  (data glued into the command string)
       v
  SELECT * FROM users WHERE name = '' OR '1'='1' ;
                                    ^^^^^^^^^^^^^^  input became SYNTAX
                                    condition always true -> AUTH BYPASS

  ------------------------------------------------------------------

  USER INPUT:   ' OR '1'='1        (same bytes)
       |
       |  PARAMETERIZED   template and data sent on SEPARATE channels
       v
  TEMPLATE:  SELECT * FROM users WHERE name = ?     (compiled once)
  DATA[?] :  "' OR '1'='1"                          (bound as a VALUE)
                                    ^^^^^^^^^^^^^^  stays literal text
                                    matches no user -> 0 rows, SAFE
```

## bruteForce
The instinctive first fix is to sanitize the input: escape quote characters, or strip out `'`, `;`, `--`, `|`, `$`, and backticks before building the query or command. It blocks the textbook payload in a demo, so it ships. It is also a losing game. Escaping is context-specific and fragile — the correct escaping inside a single-quoted SQL string differs from a double-quoted one, from a `LIKE` pattern, from an identifier, from a numeric context where no quotes are needed at all, and from each database's dialect. Attackers bypass character filters with encodings (URL, unicode, hex), with comment insertion (`/**/`), with second-order injection where the payload is stored cleanly and only assembled dangerously later, and with numeric contexts that need no metacharacter. Blacklists enumerate an infinite set of "bad" strings; you only need to miss one. You cannot reliably wash data clean enough to be safe when it is still being parsed as code.

## optimal
The correct model treats every interpreter boundary as a place where **code and data must travel on separate channels**, so nothing the user typed can ever be parsed as syntax.

**Parameterized (prepared) statements are the primary defense for SQL.** You write the query with placeholders (`?`, `%s`, or `:name`) and pass the values in a separate array. The driver sends the query text to the database to be compiled *once*, then ships the values as typed data that bind into the plan. The engine never re-parses the values as SQL, so a quote or a semicolon in the input is just a character in a string — it cannot close a literal or start a new statement. This works for `WHERE` values, `INSERT` values, and `LIMIT` — everywhere except *identifiers* (table/column names), which cannot be bound; for those, validate against an allow-list of known-good names. ORMs and query builders (SQLAlchemy, Prisma, Hibernate) parameterize by default; the danger returns only when you drop to a raw string query.

**For OS commands, the equivalent is to avoid the shell entirely.** Call the program directly with an argument array — `execFile('ping', ['-c', '1', host])`, `subprocess.run(['ping','-c','1', host], shell=False)` — so the OS passes each element as one literal argument and no shell ever interprets `;` or `$()`. Better still, prefer a native library over shelling out at all. If you truly must invoke a shell, that endpoint needs an allow-list of exact permitted values, not a filter.

**Layer defense in depth around the primary fix.** Apply **least privilege**: the application's database account should have only the rights it needs — no `DROP`, no `GRANT`, read-only where possible — so even a successful injection is capped. Add **input validation** as a complementary control (an integer field only accepts integers, a status only accepts a fixed enum) — validation reduces the attack surface but is *not* a substitute for parameterization. And distinguish this from XSS: injection is fixed by separating code from data at the *interpreter* on the way in; output encoding is a different control for a different boundary (the browser, on the way out). Use each where it belongs.

## complexity
time: A prepared statement adds a one-time parse/compile step, then reuses the cached plan across executions — often *faster* than re-parsing a fresh concatenated string every call. Binding values is `O(k)` in the number of parameters, effectively free. There is no runtime penalty for safety here; parameterization is the fast path.
space: `O(1)` extra — a handful of bound values and one cached plan per distinct query template. An argument array for a subprocess is a few pointers. Least-privilege accounts and allow-lists cost nothing at runtime.
notes: The asymmetry is stark. Parameterizing costs a marginally different API call and often improves performance via plan caching; skipping it costs the entire database or a shell on the host. There is no efficiency argument for concatenation — the safe path is also the fast, cacheable one.

## pitfalls
- **String-building the query "just this once."** An f-string or `+` concatenation into SQL is injection even in an admin-only or internal tool — internal users, second-order data, and future refactors all reach it. Fix: use placeholders and a values array for every query, no exceptions; if a linter flags raw SQL interpolation, treat it as a build break.
- **Trying to parameterize an identifier.** Placeholders bind *values*, not table or column names, so `ORDER BY ?` with a column name silently fails or gets misused with concatenation. Fix: validate dynamic identifiers against a hard-coded allow-list of permitted column names and map user input to those, never interpolate the raw string.
- **Building shell commands with `shell=True` / string concatenation.** Passing `f"ping {host}"` to a shell lets `;`, `|`, `$()`, and backticks execute attacker commands. Fix: call the binary directly with an argument array and `shell=False` / `execFile`, or prefer a native library over shelling out at all.
- **Treating input validation or escaping as the whole fix.** A length check or a quote-escaper feels like protection but is bypassable via encoding, numeric contexts, and dialect quirks. Fix: make parameterization the primary control and use validation and least-privilege DB accounts as additional layers, not replacements.
- **Over-privileged database account.** Running the app as a user that can `DROP`, `GRANT`, or read every schema turns a single leak into total loss. Fix: give the app account the minimum grants it needs, separate read/write roles, and never connect as the database superuser.

## interviewTips
- Lead with the one-sentence root cause — untrusted data concatenated into a string an interpreter parses as syntax — then show the two canonical payloads: `' OR '1'='1` for an auth-bypass and `'; DROP TABLE users; --` for a stacked destructive query. Concrete examples signal you have actually seen the bug.
- Be crisp that the fix is **parameterized queries**, and explain *why* they work structurally: the query is compiled once with placeholders and the values bind as typed data on a separate channel, so input can never become SQL. Contrast this with escaping/blacklisting and name why those fail (encoding, dialects, numeric contexts, second-order).
- Round out with defense-in-depth — least privilege on the DB account, allow-list validation for identifiers, `shell=False` argument arrays for OS commands — and explicitly separate injection (fix at the interpreter, on input) from XSS (fix with output encoding, at the browser). Showing you use the right control at the right boundary is what distinguishes a strong answer.

## keyTakeaways
- Injection is a data/code confusion at an interpreter boundary: untrusted input concatenated into a SQL query or shell command gets parsed as syntax and executed, yielding data theft, auth bypass, or a shell on the host.
- The structural fix is separation of channels — parameterized/prepared statements for SQL and argument-array execution (`shell=False`) for OS commands — so bound values are never re-parsed as code; escaping and blacklists are bypassable and are not the fix.
- Layer least privilege (a minimally-scoped DB account), allow-list validation for un-bindable identifiers, and input validation as defense in depth — and keep injection's fix (input-side, at the interpreter) distinct from XSS's fix (output-side, at the browser).

## code.python
```python
# VULNERABLE (SQL): the username is concatenated straight into the query
# string. Input "' OR '1'='1" turns the WHERE clause always-true and logs
# the attacker in as the first user with no password.
import sqlite3

def login_unsafe(conn: sqlite3.Connection, username: str, password: str):
    cur = conn.cursor()
    query = (
        "SELECT id FROM users "
        f"WHERE name = '{username}' AND password = '{password}'"
    )
    cur.execute(query)  # injection: input becomes SQL syntax
    return cur.fetchone()


# FIX (SQL): a parameterized query. The '?' placeholders are compiled as the
# query template; the values bind on a separate channel as typed data, so a
# quote in `username` is just a character and can never alter the query shape.
def login_safe(conn: sqlite3.Connection, username: str, password_hash: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM users WHERE name = ? AND password_hash = ?",
        (username, password_hash),  # bound as VALUES, never parsed as SQL
    )
    return cur.fetchone()


# FIX (identifiers can't be bound): allow-list a dynamic column name instead
# of interpolating raw input. Placeholders bind values, not identifiers.
SORTABLE = {"name", "created_at", "score"}

def list_users_safe(conn: sqlite3.Connection, sort_by: str):
    col = sort_by if sort_by in SORTABLE else "name"  # allow-list, not concat
    cur = conn.cursor()
    cur.execute(f"SELECT id, name FROM users ORDER BY {col} ASC")
    return cur.fetchall()


# VULNERABLE (command): building a shell string lets ';' and '$()' run
# attacker commands. host="8.8.8.8; cat /etc/passwd" leaks the file.
import subprocess

def ping_unsafe(host: str):
    return subprocess.run(f"ping -c 1 {host}", shell=True, capture_output=True)


# FIX (command): pass an argument array with shell=False so the OS treats
# each element as one literal argument — no shell parses the metacharacters.
def ping_safe(host: str):
    return subprocess.run(
        ["ping", "-c", "1", host], shell=False, capture_output=True
    )
```

## code.javascript
```javascript
// VULNERABLE (SQL): template-literal interpolation into the query. A value of
// "' OR '1'='1" makes the WHERE clause always true and bypasses the login.
async function loginUnsafe(db, username, passwordHash) {
  const rows = await db.query(
    `SELECT id FROM users
     WHERE name = '${username}' AND password_hash = '${passwordHash}'`
  ); // injection: the input is parsed as SQL
  return rows[0];
}

// FIX (SQL): parameterized query. The '$1'/'$2' placeholders form the compiled
// template; the values array is sent separately and binds as data, so nothing
// the user typed can change the query's structure.
async function loginSafe(db, username, passwordHash) {
  const rows = await db.query(
    'SELECT id FROM users WHERE name = $1 AND password_hash = $2',
    [username, passwordHash] // bound VALUES, never re-parsed as SQL
  );
  return rows[0];
}

// FIX (identifiers): validate a dynamic column against an allow-list — you
// cannot bind an identifier, so map user input to a known-safe name.
const SORTABLE = new Set(['name', 'created_at', 'score']);

async function listUsersSafe(db, sortBy) {
  const col = SORTABLE.has(sortBy) ? sortBy : 'name'; // allow-list, not concat
  return db.query(`SELECT id, name FROM users ORDER BY ${col} ASC`);
}

// VULNERABLE (command): exec() runs the string through a shell, so ';' and
// '$()' in `host` execute attacker commands on the server.
import { exec, execFile } from 'node:child_process';

function pingUnsafe(host) {
  exec(`ping -c 1 ${host}`, (err, stdout) => console.log(stdout)); // RCE risk
}

// FIX (command): execFile passes an argument array to the binary directly —
// no shell, so ';' and '$()' are inert literal characters in the hostname.
function pingSafe(host) {
  execFile('ping', ['-c', '1', host], (err, stdout) => console.log(stdout));
}
```
