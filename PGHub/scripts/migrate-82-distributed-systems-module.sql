-- 82: add the Distributed Systems module so /learn/distributed-systems/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 38 slots it after the most recent learn modules. This is the THEORY of
-- distribution (why agreement is hard) -- CAP and consistency models, the absence of
-- a global clock and how logical/vector clocks recover causal order, replication with
-- quorums and conflict resolution, and consensus via Raft. It is deliberately distinct
-- from the system-design module's sd-consensus submodule (Paxos/2PC/CRDT mechanics):
-- this module builds the intuition those mechanisms rest on.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'distributed-systems',
  'Distributed Systems',
  'Why agreement across machines is hard, and the theory that tames it — the CAP and PACELC tradeoffs behind consistency models from linearizable to eventual, the absence of a global clock and how Lamport and vector clocks recover causal order, leader-follower and quorum replication with W+R>N overlap and conflict resolution, and consensus through Raft''s leader election and log replication — with interactive partition, logical-clock, quorum-overlap, and leader-election visualizations.',
  38,
  'Network'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
