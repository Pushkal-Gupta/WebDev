---
slug: graphql-vs-rest
module: sd-api
title: GraphQL vs REST
subtitle: REST is N typed endpoints; GraphQL is one schema-typed query language. Pick per workload, not per fashion.
difficulty: Intermediate
position: 27
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Web API patterns"
    url: "https://martinfowler.com/articles/web-API-patterns.html"
    type: book
  - title: "Apollo / GraphQL specification & best practices"
    url: "https://graphql.org/learn/"
    type: blog
  - title: "donnemartin/system-design-primer — REST + GraphQL"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
**REST** exposes resources as endpoints (`GET /users/7`, `POST /orders`) that return fixed JSON shapes. **GraphQL** exposes a single endpoint (`POST /graphql`) accepting a typed query language that lets the client pick exactly the fields it wants and traverse relationships in one request. Both are HTTP-over-JSON; the difference is who decides the response shape — server (REST) or client (GraphQL).

## whyItMatters
The choice affects:
- **Over-fetching** — REST endpoints return everything in the resource, even fields the client doesn't need. GraphQL returns exactly the requested fields.
- **Under-fetching** — REST often needs multiple round-trips to assemble a screen (`/user`, then `/user/posts`, then `/user/posts/comments`). GraphQL does it in one.
- **Versioning** — REST APIs are versioned (`/v1/users`, `/v2/users`). GraphQL evolves schema-additively without versions; deprecate fields gradually.
- **Caching** — REST uses HTTP cache headers per endpoint (CDN-friendly). GraphQL POSTs are uncacheable by default; need Apollo's persisted-queries + GET conversion.
- **Tooling** — GraphQL's typed schema enables `graphql-codegen`, in-IDE autocomplete, schema-aware playgrounds. REST relies on OpenAPI.

## intuition
**REST** maps URLs to nouns: each noun is a row in a table. Verbs are HTTP methods. The server's response shape is fixed per endpoint.

**GraphQL** maps a single endpoint to a graph of types. The client sends a query like:
```graphql
{ user(id: 7) { name, posts { title, comments { author { name } } } } }
```
Server executes resolvers for each field, returns a JSON tree matching the query shape. Multiple resources, one round trip.

## visualization
```
REST (3 round trips to render "user with posts and comments"):
  GET /users/7                  → { id, name, email }
  GET /users/7/posts            → [{ id, title }, ...]
  GET /users/7/posts/42/comments→ [{ author_id, body }, ...]
  GET /users/91                 → { name }  ← for each comment author

GraphQL (1 round trip, exact shape):
  POST /graphql
  { user(id: 7) { name, posts { title, comments { author { name }, body } } } }
  →
  { "user": { "name": "Alice",
              "posts": [{ "title": "Hi", "comments": [{ "author": { "name": "Bob" }, "body": "..." }] }] } }
```

## bruteForce
**REST with `?include=` query params**: bolt-on field selection. Works, but ad-hoc and per-endpoint. Doesn't compose across relationships.

**Single mega-endpoint** returning everything: over-fetches; couples clients to the full shape.

**N+1 queries**: naive REST nested endpoints make N+1 DB queries when assembling. GraphQL has the same N+1 risk in resolvers — solved by DataLoader batching.

## optimal
**Choose REST when**:
- Cacheable resource fetches dominate (use HTTP caching).
- Public API with broad consumer base; consumers prefer simple curl-able URLs.
- File uploads / streaming responses.
- Strict per-endpoint rate limits.

**Choose GraphQL when**:
- Mobile / SPA frontend with deeply-nested screens — saves round trips.
- Frequent client-shape changes — schema additivity avoids versioning churn.
- Microservice composition — one GraphQL gateway federates many backends.
- Real-time subscriptions in same protocol (`subscription { ... }`).

**Mitigations** for GraphQL pitfalls:
- **DataLoader** to batch resolver calls (avoid N+1).
- **Query complexity limits** (`graphql-cost-analysis`) to prevent expensive queries.
- **Persisted queries** (hash → query string registry) to enable GET + HTTP caching.
- **Depth limits** + **field whitelists** to prevent abuse.

**REST best practices**:
- Use `Cache-Control` + `ETag` headers.
- Paginate large lists (cursor or offset).
- Return error envelopes consistently.

## complexity
| | REST | GraphQL |
|---|---|---|
| Round trips per screen | N | 1 |
| Server CPU per request | Low | Higher (query parse + resolver dispatch) |
| Cacheability | Per endpoint, easy | Hard (POST); persisted queries help |
| Schema evolution | Versioned URLs | Additive, deprecation directives |
| Tooling | OpenAPI ecosystem | Codegen, federation, schema-aware IDEs |

## pitfalls
- **GraphQL N+1**: resolvers fetch one entity at a time. Use DataLoader for batching + caching per-request.
- **Unbounded query depth/complexity**: a client query of depth 10 can DDoS. Limit + reject expensive queries.
- **REST over-fetching across mobile networks**: kills battery + bandwidth. Use `?fields=` or migrate to GraphQL.
- **Mixing REST + GraphQL on the same service**: confuses clients. Pick one per service.
- **GraphQL caching**: don't expect HTTP caching to "just work." Persisted queries + GET is the path.

## interviewTips
- For "design API for mobile app with many nested views" — GraphQL.
- For "design public API with broad consumers" — REST.
- Always mention **N+1 mitigation via DataLoader** for GraphQL.
- For senior interviews, discuss **GraphQL federation** (Apollo Federation / Wundergraph) for composing microservices.

## code.python
```python
# GraphQL server with Strawberry
import strawberry
@strawberry.type
class User:
    id: int; name: str

@strawberry.type
class Query:
    @strawberry.field
    def user(self, id: int) -> User:
        return User(id=id, name=fetch_user_name(id))

schema = strawberry.Schema(query=Query)
# Client query:
#   { user(id: 7) { name } }
```

## code.javascript
```javascript
// GraphQL server with Apollo + DataLoader for N+1 fix
const DataLoader = require('dataloader');
const userLoader = new DataLoader(async (ids) => {
  const rows = await db.fetch('SELECT * FROM users WHERE id = ANY($1)', [ids]);
  return ids.map(id => rows.find(r => r.id === id));
});

const resolvers = {
  Post: {
    author: (post) => userLoader.load(post.author_id),   // batched, no N+1
  },
};
```

## code.java
```java
// graphql-java schema
GraphQLObjectType userType = GraphQLObjectType.newObject()
    .name("User")
    .field(f -> f.name("id").type(Scalars.GraphQLInt))
    .field(f -> f.name("name").type(Scalars.GraphQLString))
    .build();
```

## code.cpp
```cpp
// Less common in C++. Use cppgraphqlgen (Microsoft) for typed schemas:
// https://github.com/microsoft/cppgraphqlgen
```
