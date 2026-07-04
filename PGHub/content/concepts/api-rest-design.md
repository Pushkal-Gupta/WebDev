---
slug: api-rest-design
module: apis-backend
title: Designing a REST API
subtitle: Resources as nouns, HTTP verbs as actions, status codes as answers — the discipline that turns a pile of endpoints into an interface a stranger can predict without reading your docs.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 15
prereqs: [web-http-lifecycle]
relatedProblems: []
references:
  - title: "MDN — HTTP request methods"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods"
    type: article
  - title: "MDN — HTTP response status codes"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"
    type: article
  - title: "MDN — Idempotent request methods"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/Idempotent"
    type: article
  - title: "REST API Tutorial — REST architectural constraints"
    url: "https://restfulapi.net/rest-architectural-constraints/"
    type: article
  - title: "RFC 9110 — HTTP Semantics"
    url: "https://www.rfc-editor.org/rfc/rfc9110"
    type: spec
status: published
---

## intro
A REST API is a contract expressed almost entirely through the primitives HTTP already gives you: a URL names a thing, a method says what to do with it, and a status code reports how it went. Get those three choices right and a client can guess most of your interface before opening the documentation — `GET /users/42` reads a user, `DELETE /users/42` removes it, and a `404` means it was never there. This lesson covers how to model resources as URIs, how the verbs (GET, POST, PUT, PATCH, DELETE) differ in meaning, what the status-code classes signal, and why statelessness, safety, and idempotency are the properties that make an API safe to retry, cache, and scale.

## whyItMatters
The design decisions here outlive almost everything else you build on top of them. A URL scheme and a set of verb semantics become a public promise the moment a mobile app, a partner integration, or another team's service starts calling them — and unwinding a bad promise means coordinated deploys across every consumer at once. Good REST design also unlocks the free infrastructure of the web: safe `GET`s can be cached by browsers and CDNs, idempotent `PUT`s and `DELETE`s can be retried automatically by clients and proxies after a network blip without fear of double-charging or duplicate records, and stateless requests let you put ten interchangeable servers behind a load balancer without sticky sessions. Interviewers press on this because it reveals whether you understand HTTP as a semantic protocol with guarantees, or just as a dumb pipe you shove JSON through.

## intuition
Think of your API as a library, and every URL as the call number of a thing on a shelf. The nouns come first: a **collection** like `/books` is the shelf, and an **item** like `/books/9780131103627` is one specific volume on it. You never invent a verb inside the call number — there is no `/getBook` shelf and no `/deleteBook` shelf, because the shelf label describes *what lives there*, not what you plan to do. What you plan to do is a separate question, answered by the HTTP **method** you send to that address.

That separation is the whole trick. The address stays a stable noun; the verb carries the intent. Sending `GET` to `/books/123` means "hand me a copy, change nothing" — like reading a book at the table. Sending `DELETE` means "take this off the shelf." Sending `PUT` means "replace this volume entirely with the one I'm handing you," while `PATCH` means "just fix the typo on page 12." `POST /books` means "here is a new book, find it a place and give it a call number" — the server assigns the id, which is why you `POST` to the collection, not to an id that does not exist yet.

Three properties fall naturally out of this discipline, and they are the reason the design pays off. **Safe** methods (`GET`, `HEAD`) only read; sending one a hundred times leaves the shelf untouched, so browsers and caches can call them freely. **Idempotent** methods (`GET`, `PUT`, `DELETE`) land in the same final state no matter how many identical copies arrive — `DELETE /books/123` five times still just leaves book 123 gone, so a client that never heard your reply can safely retry. `POST` is the odd one out: it is neither safe nor idempotent, because "create a new book" run twice creates *two* books. And **stateless** means each request carries everything the server needs to act — the credentials, the target, the payload — so no request depends on a conversation the server was supposed to remember. That is what lets any server in the pool answer any request, and it is the constraint that makes REST scale.

## visualization
```
  RESOURCE MODEL                     one collection, addressable items
  --------------------------------------------------------------------
  /users            collection       GET (list)   POST (create -> 201)
  /users/{id}       item             GET  PUT  PATCH  DELETE

  REQUEST                     ->      SERVER                RESPONSE
  --------------------------------------------------------------------
  GET    /users/42            ->      read row 42       ->  200 OK   {user}
  POST   /users {name:"Ada"}  ->      insert new row    ->  201 Created + Location
  PUT    /users/42 {full}     ->      replace row 42    ->  200 OK   {user}
  PATCH  /users/42 {email}    ->      merge one field   ->  200 OK   {user}
  DELETE /users/42            ->      remove row 42     ->  204 No Content
  GET    /users/999           ->      row not found     ->  404 Not Found

  STATUS CLASSES:  2xx ok   3xx redirect   4xx your fault   5xx my fault
```

## bruteForce
The tempting first design tunnels remote procedure calls through HTTP: you name an endpoint after the function you wish you were calling, so you end up with `POST /getUser?id=42`, `POST /createUser`, `POST /updateUserEmail`, and `POST /deleteUser`. Everything is a `POST`, the verb lives inside the URL, and each new operation invents a fresh endpoint name. It works, but it throws away every guarantee HTTP was offering. A caching proxy cannot cache `POST /getUser` because `POST` is presumed to change state. A client cannot safely retry `POST /deleteUser` after a timeout, because for all it knows the delete already happened and a retry might now hit the wrong record. And a newcomer cannot predict a single endpoint — they must read your docs for every verb-noun combination you dreamed up, because nothing is systematic.

## optimal
Proper REST puts the nouns in the URL and the verbs in the method, then leans on the status line to report outcomes. **Model resources as collections and items.** `/users` is the collection; `/users/42` is one member; nested relationships read as paths like `/users/42/orders`. Use plural nouns, lowercase, hyphenated (`/blog-posts`), and never a verb — the method already supplies the action.

**Map each verb to its HTTP semantics.** `GET` reads and is safe and idempotent, so it must never mutate state and its responses can be cached. `POST` creates a subordinate resource under a collection; it is neither safe nor idempotent, so it returns `201 Created` with a `Location` header pointing at the new item. `PUT` replaces an item wholesale and is idempotent — sending the same full body twice leaves one identical record, so it doubles as an upsert. `PATCH` applies a partial modification (one or two fields) and returns the updated resource. `DELETE` removes the item and is idempotent — the second `DELETE` still leaves it gone, typically answered with `204 No Content`.

**Use status codes as a precise vocabulary.** `200 OK` for a successful read or update, `201 Created` for a fresh resource, `204 No Content` when there is nothing to return; `301`/`302` for redirects and `304 Not Modified` for a cache revalidation; `400` for a malformed request, `401` for missing credentials, `403` for forbidden, `404` for a missing resource, `409` for a conflict, `422` for a well-formed but semantically invalid body; and the `5xx` band (`500`, `502`, `503`) strictly for the server's own failures, never for a client's bad input.

**Keep every request stateless.** Each call carries its own authentication (a token in the `Authorization` header) and everything the server needs to act, so no request leans on server-held session memory. That is what lets a load balancer route any request to any node. As a light final touch, **HATEOAS** lets responses embed links to related actions (`{"id":42,"links":{"orders":"/users/42/orders"}}`) so a client can discover what it may do next by following URLs rather than hard-coding them.

## complexity
time: A well-designed request is O(1) in coordination cost — it carries everything the server needs, so handling it never requires reconstructing prior conversation state. Safe `GET`s can be answered from cache with zero backend work, and idempotent verbs let clients and proxies retry after failures without extra bookkeeping, so the effective request count under packet loss stays near the ideal rather than exploding into duplicate side effects.
space: Statelessness pushes per-client state out of the server, so a node holds O(1) memory per in-flight request instead of O(sessions). That is the property that lets you scale horizontally: with no sticky per-user state on any box, N interchangeable servers behind a load balancer serve the same traffic as one, and adding capacity is just adding boxes.
notes: The scaling lever is not the URL syntax — it is the guarantees. Safety enables caching, idempotency enables safe retries, and statelessness enables horizontal scale. A REST API that honors those three properties gets the web's infrastructure (CDNs, proxies, retry logic, load balancers) working for it for free; one that violates them fights that infrastructure at every hop.

## pitfalls
- **Putting verbs in the URL.** `POST /users/42/delete` or `GET /getUser?id=42` throws away the method's meaning and blocks caching and safe retries. Fix: the path names the resource (`/users/42`), the HTTP method names the action (`DELETE`, `GET`) — never both.
- **Mutating state inside a GET.** A `GET` that increments a counter, sends an email, or deletes a row breaks the safety guarantee that lets browsers, crawlers, and CDNs fetch it freely — a prefetch or a cache warm can trigger real side effects. Fix: any state change must ride a `POST`/`PUT`/`PATCH`/`DELETE`, never a `GET` or `HEAD`.
- **Confusing PUT with PATCH.** Sending a partial body to `PUT` wipes the fields you omitted, because `PUT` replaces the *entire* resource; sending a full body to `PATCH` is merely wasteful. Fix: `PUT` for a complete replacement (idempotent upsert), `PATCH` for a partial merge of just the fields you name.
- **Returning 200 for everything (or 5xx for client errors).** Answering a validation failure with `200 {"error":...}` forces every client to parse the body to learn it failed, and answering a bad request with `500` blames the server for the caller's mistake. Fix: let the status line carry the outcome — `4xx` when the client is wrong, `5xx` only when the server genuinely failed.
- **Making POST idempotent by accident, or assuming it is.** Retrying a `POST /orders` after a timeout can create a duplicate order, because `POST` is not idempotent. Fix: for retry-safe creation, either use `PUT` with a client-chosen id, or accept an `Idempotency-Key` header and dedupe server-side.

## interviewTips
- When asked to design an API, start by naming the resources as nouns and drawing the collection/item pair (`/things` and `/things/{id}`), then attach verbs — it signals you model data first and reach for RPC-style endpoints last.
- Be able to state, per verb, whether it is safe and whether it is idempotent, and why it matters: `GET` safe+idempotent (cacheable), `PUT`/`DELETE` idempotent (retry-safe), `POST` neither (needs an idempotency key to retry) — this is the single most probed detail.
- Tie statelessness to horizontal scaling out loud: because each request self-describes with its own auth and payload, any node can serve it, so you scale by adding interchangeable boxes behind a load balancer with no sticky sessions.

## keyTakeaways
- Split intent from address: the URL is a stable noun naming a resource (`/users/42`), and the HTTP method (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`) supplies the action — never bury a verb in the path.
- The three properties are the payoff, not the syntax: safe methods are cacheable, idempotent methods are retry-safe, and stateless requests scale horizontally — REST design exists to earn those guarantees from HTTP.
- Let the status line speak: `2xx` success, `3xx` redirect, `4xx` the client's fault, `5xx` the server's fault — a precise code (`201`, `204`, `404`, `409`, `422`) is part of the contract, not decoration.

## code.javascript
```javascript
// A minimal REST resource in Express: the path names the resource,
// the HTTP method names the action, and the status line reports outcome.
const express = require('express');
const app = express();
app.use(express.json());

let users = [{ id: 1, name: 'Ada', email: 'ada@ex.com' }];
let nextId = 2;

// GET (safe, idempotent): read the collection. Cacheable, no mutation.
app.get('/users', (req, res) => {
  res.status(200).json(users);
});

// GET one item, or 404 if the id does not exist.
app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'user not found' });
  return res.status(200).json(user);
});

// POST (neither safe nor idempotent): create under the collection.
// Returns 201 + a Location header pointing at the new item.
app.post('/users', (req, res) => {
  if (!req.body.name) return res.status(422).json({ error: 'name is required' });
  const user = { id: nextId++, name: req.body.name, email: req.body.email ?? null };
  users.push(user);
  res.status(201).location(`/users/${user.id}`).json(user);
});

// PUT (idempotent): replace the whole item. Same body twice => same state.
app.put('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = users.findIndex((u) => u.id === id);
  const replacement = { id, name: req.body.name, email: req.body.email ?? null };
  if (idx === -1) { users.push(replacement); return res.status(201).json(replacement); }
  users[idx] = replacement;
  return res.status(200).json(replacement);
});

// DELETE (idempotent): remove it; 204 with no body. Second call still 204.
app.delete('/users/:id', (req, res) => {
  users = users.filter((u) => u.id !== Number(req.params.id));
  res.status(204).end();
});

app.listen(3000, () => console.log('REST API on :3000'));
```

## code.python
```python
# The same resource in FastAPI: resources as paths, verbs as methods,
# explicit status codes. Pydantic validates the body (422 on bad input).
from fastapi import FastAPI, HTTPException, Response, status
from pydantic import BaseModel

app = FastAPI()


class UserIn(BaseModel):
    name: str
    email: str | None = None


users: dict[int, dict] = {1: {"id": 1, "name": "Ada", "email": "ada@ex.com"}}
_next = {"id": 2}


# GET (safe, idempotent): list the collection.
@app.get("/users")
def list_users():
    return list(users.values())


# GET one item, or 404.
@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = users.get(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")
    return user


# POST: create under the collection, return 201 + Location.
@app.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(body: UserIn, response: Response):
    uid = _next["id"]
    _next["id"] += 1
    user = {"id": uid, **body.model_dump()}
    users[uid] = user
    response.headers["Location"] = f"/users/{uid}"
    return user


# PUT (idempotent): replace the whole item (upsert on missing id).
@app.put("/users/{user_id}")
def replace_user(user_id: int, body: UserIn):
    users[user_id] = {"id": user_id, **body.model_dump()}
    return users[user_id]


# DELETE (idempotent): remove; 204 No Content. Second call still succeeds.
@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int):
    users.pop(user_id, None)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

## code.bash
```bash
# Drive the API with curl. -i prints the status line + headers so you can
# see the verb-to-code mapping directly. Each line is one request.

# GET the collection -> 200 OK with a JSON array.
curl -i http://localhost:3000/users

# POST a new user -> 201 Created, with a Location header for the new item.
curl -i -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Grace","email":"grace@ex.com"}'

# GET the item you just created -> 200 OK with that user.
curl -i http://localhost:3000/users/2

# PUT to replace it wholesale -> 200 OK. Idempotent: run twice, same state.
curl -i -X PUT http://localhost:3000/users/2 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Grace Hopper","email":"grace@navy.mil"}'

# DELETE the item -> 204 No Content (empty body). Run it again: still 204.
curl -i -X DELETE http://localhost:3000/users/2

# GET a missing item -> 404 Not Found (client asked for something absent).
curl -i http://localhost:3000/users/999
```
