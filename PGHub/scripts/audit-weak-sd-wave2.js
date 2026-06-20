#!/usr/bin/env node
// Audit weak files in the system-design / patterns bucket (wave 2).
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('content/concepts');
const PREFIXES = [
  'sd-','design-','db-','database-','sql-','cs-','foundations-','math-','oauth2-','saml-','jwt-','mtls-','tls-','cors-','csrf-','xss-','kerberos-','secrets-','auth-','bloom-','redis-','kafka-','cdn-','dns-','tcp-','http2-','quic-','webrtc-','webhook-','webhooks-','sse-','graphql-','grpc-','api-','rate-','cache-','caching-','cap-','pacelc-','acid-','cas-','cdc-','cqrs-','crdt-','dynamo-','spanner-','paxos-','raft-','quorum-','gossip-','vector-','merkle-','hyperloglog-','cuckoo-','consistent-','sharding-','nosql-','lsm-','wal-','mvcc-','compression-','etag-','presigned-','sigv4-','idempotency-','outbox-','saga-','strangler-','event-','actor-','serverless-','microservices-','service-','bulkhead-','circuit-','chaos-','blue-','multipart-','request-','validate-','git-','floating-','endianness-','unicode-','unix-','process-','scheduler-','epoll-','fork-','memory-','network-','observability-','metrics-','message-','protocol-','ip-','slowstart-','optimistic-','pessimistic-','snapshot-','feature-','monotonic-','migration-','solid-','dependency-','leader-','load-','graceful-','backpressure-','convex-','coordinate-','cordic-','lru-','chinese-','divide-','digit-','fft-','hopcroft-','centroid-','heavy-','russian-','power-','pigeonhole-','quadtree-','wavelet-','treap-','mos-','splay-','tortoise-','lowest-','lca-','find-','hash-','skip-','skiplist-','sqrt-','strassen-','strongly-','sieve-','gpu-','weighted-','write-'
];

const BARS = { whyItMatters: 70, intuition: 200, optimal: 200 };

function wc(s){ return (s||'').trim().split(/\s+/).filter(Boolean).length; }
function extractSection(md, name){
  // grab from `## name` until next `## ` or `## code.` or end
  const re = new RegExp(`(^|\\n)##\\s+${name}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+\\w|$)`, 'i');
  const m = md.match(re);
  if(!m) return '';
  return m[2];
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md') && PREFIXES.some(p => f.startsWith(p)));
const rows = [];
for(const f of files){
  const md = fs.readFileSync(path.join(DIR, f), 'utf8');
  const why = wc(extractSection(md, 'whyItMatters'));
  const intu = wc(extractSection(md, 'intuition'));
  const opt = wc(extractSection(md, 'optimal'));
  const deficit = Math.max(0, BARS.whyItMatters - why) + Math.max(0, BARS.intuition - intu) + Math.max(0, BARS.optimal - opt);
  if(deficit > 0) rows.push({ f, why, intu, opt, deficit });
}
rows.sort((a,b) => b.deficit - a.deficit);
console.log(`Weak in bucket: ${rows.length} of ${files.length}`);
console.log('Top 60:');
for(const r of rows.slice(0,60)){
  console.log(`${String(r.deficit).padStart(4)}  why=${String(r.why).padStart(3)} int=${String(r.intu).padStart(3)} opt=${String(r.opt).padStart(3)}  ${r.f}`);
}
console.log(`\nTotal weak: ${rows.length}`);
