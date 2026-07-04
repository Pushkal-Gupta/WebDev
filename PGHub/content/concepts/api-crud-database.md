---
slug: api-crud-database
module: apis-backend
title: CRUD and the Database Behind an API
subtitle: How Create, Read, Update, and Delete map to SQL and to HTTP methods, and what a backend handler actually does between receiving a request and writing a row.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 15
prereqs: [api-rest-design]
relatedProblems: []
references:
  - title: "MDN — HTTP request methods"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods"
    type: article
  - title: "PostgreSQL — INSERT"
    url: "https://www.postgresql.org/docs/current/sql-insert.html"
    type: spec
  - title: "PostgreSQL — UPDATE"
    url: "https://www.postgresql.org/docs/current/sql-update.html"
    type: spec
  - title: "Prisma — Data model and CRUD reference"
    url: "https://www.prisma.io/docs"
    type: article
  - title: "OWASP — SQL Injection Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
    type: article
status: published
---

## intro
Almost every API you will ever build is, underneath the routing and the JSON, a thin layer over a database that stores records and lets clients create, read, update, and delete them. Those four verbs are so universal they have their own name — **CRUD** — and they line up neatly with four SQL statements (`INSERT`, `SELECT`, `UPDATE`, `DELETE`) and four HTTP methods (`POST`, `GET`, `PUT`/`PATCH`, `DELETE`). This lesson traces one request all the way through a handler: how it arrives, gets validated, turns into a parameterized query, changes rows on disk, and returns a shaped response the client can trust.

## whyItMatters
CRUD is the shape of the work in most backend jobs, so getting the handler pipeline right is the difference between an API that is safe and one that leaks or corrupts data. The exact same request path is where the most common and most damaging bugs live: SQL injection from concatenating user input into a query string, silent data corruption from skipping validation, half-finished writes when a multi-step operation fails partway through, and pages that grind to a halt because one list endpoint fires a thousand tiny queries. Knowing which SQL statement and which HTTP method each operation maps to — and where validation, parameterization, and transactions belong in that flow — is exactly what interviewers probe when they ask you to "design an endpoint that saves a user," and it is what keeps a production service from becoming a headline.

## intuition
Picture a records office with a wall of filing cabinets, and imagine the API handler as the **clerk at the front desk**. A client walks up and hands the clerk a form — that form is the HTTP request. The clerk does not run straight to the cabinets. First they **read the form and check it makes sense**: is the name filled in, is the email actually an email, is the date a real date? If the form is garbage, the clerk hands it right back with a note explaining what is wrong — that is validation returning a `400 Bad Request` before anything touches storage.

Only once the form passes does the clerk **translate the request into a filing action**. The four things a clerk can ever do to a record are exactly the four things you can do to a row: file a brand-new card (**Create** / `INSERT`), pull a card and read it out (**Read** / `SELECT`), find an existing card and change some fields on it (**Update** / `UPDATE`), or take a card out and shred it (**Delete** / `DELETE`). There is no fifth thing. That is why CRUD keeps showing up everywhere — it is the complete set of operations on stored records.

Crucially, the clerk never lets the customer walk behind the desk and rummage through the cabinets themselves. The customer's words go into a **fixed form with labeled slots**, and the clerk carries out the filing. That separation — the customer supplies values, the clerk supplies the action — is exactly what a **parameterized query** is: the SQL structure is fixed by you, and the user's data is slotted in as parameters that can never be mistaken for commands. Skip that discipline and you have handed the customer a pen to rewrite the filing rules, which is SQL injection.

Finally, the clerk hands back a **receipt**: what was filed, its new ID, or the contents that were read — a shaped response, not the raw internal ledger. When an action has several steps that must all succeed together (debit one account, credit another), the clerk does them as a single sealed envelope that is either fully filed or fully discarded — a **transaction**. That is the whole job: validate the form, translate it to a filing action, carry it out safely, hand back a receipt.

## visualization
```
  CLIENT REQUEST                 HANDLER PIPELINE                 DATABASE
  --------------                 ----------------                 --------
  POST /users            [1] receive   { name, email }
   { "name": "Ada",       |
     "email": "a@x.io" }   v
                          [2] validate  name != ""  email ~ regex   ->  ok? no  => 400
                           |
                           v
                          [3] map->SQL  INSERT INTO users
                           |               (name,email) VALUES ($1,$2)
                           v
                          [4] persist   bind $1='Ada' $2='a@x.io'  ->  rows change
                           |
                           v
                          [5] respond   201 Created { id: 7, ... }

   users table BEFORE                users table AFTER
   id | name  | email               id | name  | email
   ---+-------+---------            ---+-------+---------
    5 | Lin   | lin@x.io             5 | Lin   | lin@x.io
    6 | Omar  | omar@x.io            6 | Omar  | omar@x.io
                                     7 | Ada   | a@x.io      <- new row
```

## bruteForce
The naive handler skips every safeguard. It takes the raw request body and builds SQL by string concatenation — `"INSERT INTO users (name) VALUES ('" + body.name + "')"` — with no validation of what `body.name` contains, so a value like `'); DROP TABLE users; --` executes as its own command and the whole table is gone. There is no length or type checking, so a missing field writes a `null` or a number where text belongs and quietly corrupts the row. And when the query throws, the handler returns the raw database error straight to the client, leaking table names, column names, and query structure that an attacker uses to map your schema. It works in a demo and is a breach in production.

## optimal
A trustworthy handler runs four disciplined stages in order. **First, validate.** Reject the request before it reaches the database if a required field is missing, a type is wrong, a string is too long, or an email fails its format check — respond `400 Bad Request` with a message about the field, never a stack trace. Validation is cheap and it is the only stage that can stop bad data at the door.

**Second, use a parameterized query.** The SQL text is a fixed template with placeholders (`$1`, `$2` in Postgres, `?` in many drivers), and the user's values are passed separately as a parameter array. The database driver sends structure and data over different channels, so a value can never be parsed as SQL — this single habit closes the entire injection class. Never build query strings by concatenation, and never trust an ORM's raw-query escape hatch with unescaped input either.

**Third, wrap multi-step writes in a transaction.** If an operation touches more than one row or table and they must agree — transfer money, create a user plus their default settings, decrement stock and record an order — run them inside `BEGIN ... COMMIT` so either all of it lands or none of it does. On any error, `ROLLBACK` leaves the database exactly as it was, with no half-finished state.

**Fourth, shape the response.** Return only the fields the client should see, with the right status code: `201 Created` and the new resource for a create, `200 OK` and the record for a read, `200`/`204` for an update or delete, `404` when the target row does not exist. Map database errors to clean client messages; log the details server-side.

An **ORM** (Prisma, SQLAlchemy, Hibernate) automates the object-to-row mapping and parameterizes queries for you, which removes boilerplate and a whole category of injection mistakes. The tradeoff is a layer of abstraction that can hide expensive queries — most notably the **N+1 problem**, where reading a list and then lazily loading each item's relation fires one query per row instead of a single join. ORMs are a productivity win; you still have to know the SQL they generate.

## complexity
time: A read on an **indexed** column (like a primary key `WHERE id = $1`) is roughly `O(log n)` — the database walks a B-tree instead of scanning the table. A read that filters on an **unindexed** column degrades to an `O(n)` full-table scan, which is the difference between milliseconds and seconds as the table grows. Single-row `INSERT`/`UPDATE`/`DELETE` are fast, but every write also updates each index on the table (write amplification), so more indexes speed reads while slowing writes.
space: Storage is `O(n)` in the number of rows plus `O(n)` again per index maintained. Indexes trade disk space and write cost for dramatically cheaper reads.
notes: The dominant real-world cost is usually not one query's Big-O but the **number of round trips** to the database. An N+1 pattern turns one logical read into `n + 1` network calls; folding it into a single `JOIN` or batched `IN (...)` query is the fix that matters far more than shaving a constant off any single statement.

## pitfalls
- **SQL injection from string concatenation.** Splicing user input into a query lets an attacker inject their own commands and read, alter, or destroy data. Fix: always use parameterized queries (`$1`/`?` placeholders with a values array); never concatenate, and treat an ORM's raw-SQL escape hatch as concatenation too.
- **Trusting input without validation.** Missing, wrong-typed, or oversized fields corrupt rows or crash the handler when they hit the database. Fix: validate every field's presence, type, length, and format at the top of the handler and return `400` with a clear message before any query runs.
- **The N+1 query problem.** Reading a list and then lazily loading each row's relation fires one query per row, so a page that shows 100 items runs 101 queries. Fix: eager-load with a single `JOIN`, an ORM `include`/`join` option, or a batched `WHERE id IN (...)` query.
- **No transaction on multi-step writes.** If a two-step write (debit then credit, insert then update) fails between steps, the database is left half-changed and inconsistent. Fix: wrap the steps in `BEGIN ... COMMIT` and `ROLLBACK` on any error so the operation is all-or-nothing.
- **Leaking raw database errors to the client.** Returning the driver's error exposes table and column names and query structure that attackers use to map your schema. Fix: catch database errors, log the detail server-side, and return a generic `400`/`500` message to the client.

## interviewTips
- When asked to design an endpoint, say the pipeline out loud in order — receive, validate, parameterized query, transaction if multi-step, shaped response — and name the CRUD-to-SQL-to-HTTP mapping (`POST`/`INSERT`, `GET`/`SELECT`, `PUT`-`PATCH`/`UPDATE`, `DELETE`/`DELETE`). It signals you know where each safeguard belongs.
- Bring up SQL injection unprompted and explain the fix precisely: parameterized queries send structure and data over separate channels so input can never be executed as SQL. "I'd sanitize the input" is a weaker answer than "I'd use bound parameters."
- Mention the N+1 problem when discussing list endpoints and ORMs — knowing that lazy relation loading turns one read into `n + 1` queries, and that a `JOIN` or eager `include` fixes it, is a strong signal you have debugged real database performance.

## keyTakeaways
- CRUD is the complete set of operations on stored records, and it maps cleanly across three layers: Create/Read/Update/Delete to `INSERT`/`SELECT`/`UPDATE`/`DELETE` to `POST`/`GET`/`PUT`-`PATCH`/`DELETE`.
- Every write handler should run the same disciplined pipeline — validate the input, use a parameterized query, wrap multi-step writes in a transaction, and return a shaped response with the right status code.
- Parameterized queries defeat SQL injection, transactions keep multi-step writes consistent, indexes make reads `O(log n)` at the cost of slower writes, and watching for the N+1 pattern keeps list endpoints fast.

## code.javascript
```javascript
// Node handler (Express + node-postgres). Each CRUD op validates the input,
// then runs a PARAMETERIZED query ($1, $2, ...) so user data is never
// parsed as SQL. Errors are logged server-side, not leaked to the client.
import express from 'express';
import { Pool } from 'pg';

const app = express();
app.use(express.json());
const pool = new Pool();

const isEmail = (s) => typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

// CREATE -> POST -> INSERT
app.post('/users', async (req, res) => {
  const { name, email } = req.body ?? {};
  if (typeof name !== 'string' || name.trim() === '' || !isEmail(email)) {
    return res.status(400).json({ error: 'name and a valid email are required' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email',
      [name.trim(), email],
    );
    return res.status(201).json(rows[0]); // shaped: only public fields
  } catch (err) {
    console.error('create user failed', err); // detail stays server-side
    return res.status(500).json({ error: 'could not create user' });
  }
});

// READ -> GET -> SELECT (indexed lookup on the primary key)
app.get('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  const { rows } = await pool.query(
    'SELECT id, name, email FROM users WHERE id = $1',
    [id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'not found' });
  return res.json(rows[0]);
});

// UPDATE -> PATCH -> UPDATE
app.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { email } = req.body ?? {};
  if (!Number.isInteger(id) || id <= 0 || !isEmail(email)) {
    return res.status(400).json({ error: 'valid id and email required' });
  }
  const { rows } = await pool.query(
    'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, name, email',
    [email, id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'not found' });
  return res.json(rows[0]);
});

// DELETE -> DELETE -> DELETE
app.delete('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: 'not found' });
  return res.status(204).end(); // no body
});

// Multi-step write wrapped in a transaction: all-or-nothing.
async function transfer(fromId, toId, cents) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [cents, fromId]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [cents, toId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK'); // leave the DB exactly as it was
    throw err;
  } finally {
    client.release();
  }
}

export { app, transfer };
```

## code.python
```python
# FastAPI handler with parameterized SQL via psycopg. Pydantic validates the
# body before any query runs; the %s placeholders keep user data out of the
# SQL grammar, closing the injection class. Multi-step writes use a transaction.
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
import psycopg
from psycopg.rows import dict_row

app = FastAPI()
POOL_DSN = "postgresql://localhost/app"


class UserIn(BaseModel):        # validation happens here, before the DB
    name: str
    email: EmailStr


class EmailPatch(BaseModel):
    email: EmailStr


def _connect():
    return psycopg.connect(POOL_DSN, row_factory=dict_row)


# CREATE -> POST -> INSERT
@app.post("/users", status_code=201)
def create_user(body: UserIn):
    if not body.name.strip():
        raise HTTPException(400, "name is required")
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO users (name, email) VALUES (%s, %s) "
            "RETURNING id, name, email",
            (body.name.strip(), body.email),   # values passed separately
        )
        return cur.fetchone()


# READ -> GET -> SELECT
@app.get("/users/{user_id}")
def get_user(user_id: int):
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, name, email FROM users WHERE id = %s", (user_id,)
        )
        row = cur.fetchone()
    if row is None:
        raise HTTPException(404, "not found")
    return row


# UPDATE -> PATCH -> UPDATE
@app.patch("/users/{user_id}")
def update_email(user_id: int, body: EmailPatch):
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE users SET email = %s WHERE id = %s "
            "RETURNING id, name, email",
            (body.email, user_id),
        )
        row = cur.fetchone()
    if row is None:
        raise HTTPException(404, "not found")
    return row


# DELETE -> DELETE -> DELETE
@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int):
    with _connect() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        if cur.rowcount == 0:
            raise HTTPException(404, "not found")


# Multi-step write: the `with conn` block commits on success, rolls back on error.
def transfer(from_id: int, to_id: int, cents: int) -> None:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE accounts SET balance = balance - %s WHERE id = %s",
                (cents, from_id),
            )
            cur.execute(
                "UPDATE accounts SET balance = balance + %s WHERE id = %s",
                (cents, to_id),
            )
        # leaving the `with conn` block commits; an exception triggers rollback
```

## code.sql
```sql
-- The four CRUD statements on a users table. Placeholders ($1, $2, ...) are
-- bound by the driver so the supplied values can never be parsed as SQL.

-- schema (an index on the primary key makes reads O(log n))
CREATE TABLE IF NOT EXISTS users (
  id    SERIAL PRIMARY KEY,
  name  TEXT        NOT NULL,
  email TEXT        NOT NULL UNIQUE
);

-- CREATE  (maps to POST):   insert a new row, return the generated id
INSERT INTO users (name, email)
VALUES ($1, $2)
RETURNING id, name, email;

-- READ    (maps to GET):    fetch one row by its indexed primary key
SELECT id, name, email
FROM users
WHERE id = $1;

-- UPDATE  (maps to PUT/PATCH):  change fields on an existing row
UPDATE users
SET email = $1
WHERE id = $2
RETURNING id, name, email;

-- DELETE  (maps to DELETE):  remove a row by id
DELETE FROM users
WHERE id = $1;

-- Multi-step write as one atomic transaction: both updates land or neither does.
BEGIN;
  UPDATE accounts SET balance = balance - $1 WHERE id = $2;
  UPDATE accounts SET balance = balance + $1 WHERE id = $3;
COMMIT;
```
