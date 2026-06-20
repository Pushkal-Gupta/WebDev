-- 37: split the oversized `system-design` module into 8 sub-modules.
-- Original `system-design` module had 111 concepts; CLAUDE.md targets 10-15 per module.
-- Idempotent: safe to re-run. New module rows use ON CONFLICT DO UPDATE.
-- Each concept's module_slug is reassigned by explicit slug list.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon) VALUES
  ('sd-network',       'Network & Protocols',          'HTTP variants, gRPC, WebRTC, DNS, TLS/mTLS, CORS — the wire-level building blocks.',                101, 'Network'),
  ('sd-storage',       'Storage & Databases',          'Sharding, replication, indexing, CAP/PACELC, NoSQL vs SQL, LSM trees, consistent hashing.',          102, 'Database'),
  ('sd-consensus',     'Distributed Consensus',        'Paxos, Raft, quorum, Spanner TrueTime, gossip, CRDTs, leader election, Dynamo.',                     103, 'GitMerge'),
  ('sd-caching-cdn',   'Caching & CDN',                'Cache-aside/through, eviction, edge caching, purge strategies, presigned URLs, ETags, service workers.', 104, 'Layers'),
  ('sd-auth-security', 'Auth & Security',              'OAuth2 flows, JWT, SAML/OIDC, SigV4, CSRF/XSS/SQLi, Kerberos, secrets management.',                  105, 'ShieldCheck'),
  ('sd-api',           'API Design',                   'Rate limiting, pagination, idempotency, versioning, webhooks, API gateway, GraphQL vs REST, uploads.', 106, 'Globe'),
  ('sd-reliability',   'Reliability & Observability',  'Chaos eng, circuit breakers, bulkheads, backpressure, tracing, SLOs, load shedding, deploys.',       107, 'Activity'),
  ('sd-microservices', 'Microservices Patterns',       'Saga, outbox, CQRS, event sourcing, CDC, service mesh/discovery, Kafka, fan-out/in, actor model.',   108, 'Boxes')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;

-- Reassign existing concepts by slug. ON CONFLICT not needed: UPDATE is idempotent.

UPDATE public."PGcode_concepts" SET module_slug = 'sd-network' WHERE slug IN (
  'grpc-vs-rest','dns-architecture','dns-prefetch','cors-explained','mtls-mutual',
  'sse-vs-websockets','webrtc-stun-turn','protocol-buffers','kerberos-protocol'
);

UPDATE public."PGcode_concepts" SET module_slug = 'sd-storage' WHERE slug IN (
  'cap-theorem','pacelc-theorem','nosql-vs-sql','database-indexing','database-replication',
  'database-sharding','sharding','db-partitioning-strategies','multi-master-replication',
  'read-replica-quorum','lsm-tree','merkle-tree','data-lake-warehouse','consistent-hashing',
  'consistent-hash-jump'
);

UPDATE public."PGcode_concepts" SET module_slug = 'sd-consensus' WHERE slug IN (
  'paxos-basics','raft-consensus','cas-vs-paxos','quorum-consensus','spanner-truetime',
  'gossip-protocol','crdt-conflict-free','leader-election-patterns','dynamo-paper-architecture',
  'distributed-lock'
);

UPDATE public."PGcode_concepts" SET module_slug = 'sd-caching-cdn' WHERE slug IN (
  'caching','cache-aside-vs-through','cache-eviction-policies','cdn-edge-caching',
  'cdn-purge-strategies','presigned-url','etag-conditional','service-worker-pwa',
  'request-coalescing'
);

UPDATE public."PGcode_concepts" SET module_slug = 'sd-auth-security' WHERE slug IN (
  'auth-oauth-jwt','jwt-anatomy','oauth2-flows','oauth2-pkce','oauth2-refresh-token',
  'oauth2-device-code','saml-vs-oidc','sigv4-aws-signing','csrf-protection','xss-prevention',
  'sql-injection','secrets-management','secrets-rotation','api-key-management'
);

UPDATE public."PGcode_concepts" SET module_slug = 'sd-api' WHERE slug IN (
  'rate-limiting','rate-limit-leaky-bucket','rate-limiter-token-bucket','api-rate-limit-design',
  'api-pagination','idempotency','idempotency-key','api-versioning','webhooks-design',
  'webhook-receiver-best-practices','api-gateway-pattern','graphql-vs-rest','multipart-upload',
  'multipart-form-upload'
);

UPDATE public."PGcode_concepts" SET module_slug = 'sd-reliability' WHERE slug IN (
  'chaos-engineering','circuit-breaker','bulkhead-isolation','backpressure-streams',
  'distributed-tracing','observability','observability-otel','observability-slo',
  'metrics-vs-logs-vs-traces','system-design-load-shedding','system-design-tail-latency',
  'graceful-degradation','exponential-backoff-jitter','feature-flags','migration-zero-downtime',
  'blue-green-deployment','zero-downtime-deploys','load-balancing','load-balancing-strategies',
  'power-of-two-choices','sd-microservices-circuit-breaker-states','feature-flags-design'
);

UPDATE public."PGcode_concepts" SET module_slug = 'sd-microservices' WHERE slug IN (
  'saga-pattern','outbox-pattern','cqrs-pattern','event-sourcing','cdc-change-data-capture',
  'cdc-debezium','event-bus-design','service-mesh','service-discovery','strangler-fig-migration',
  'actor-model','fan-out-fan-in','microservices-vs-monolith','serverless-vs-containers',
  'kafka-exactly-once','kafka-partitions','kafka-consumer-group','message-queues',
  'queue-priority-fair-sched','feature-store-ml'
);
