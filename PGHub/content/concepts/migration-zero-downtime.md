---
slug: migration-zero-downtime
module: sd-reliability
title: Zero-Downtime DB Migrations
subtitle: Expand-contract pattern — ADD new column, dual-write, backfill, switch reads, REMOVE old. Never block writes mid-deploy.
difficulty: Advanced
position: 54
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications (Kleppmann) — Evolvability"
    url: "https://dataintensive.net/"
    type: book
  - title: "GitHub Engineering — Online schema migrations with gh-ost"
    url: "https://github.blog/engineering/"
    type: blog
  - title: "github/gh-ost — online schema change for MySQL"
    url: "https://github.com/github/gh-ost"
    type: repo
status: published
---

## intro
You need to rename a column in production. Naive: `ALTER TABLE users RENAME COLUMN name TO full_name` → app code expecting `name` breaks instantly. **Zero-downtime migration** breaks this into 5 reversible phases via the **expand-contract** pattern: ADD the new column, dual-write to both, backfill historical data, switch reads to new column, REMOVE the old column. Each phase is independently shippable + rollback-safe.

## whyItMatters
Production DBs can't be taken down for schema changes:
- Strict SLAs (99.9%+).
- Multi-region deploys with rolling restarts.
- Online users mid-transaction.
- Subscription-based — downtime = refunds.

Done wrong: 5xx storm + lost writes + corrupted data. Done right: customers don't notice.

## intuition
**Expand** (additive — backward compatible):
1. ADD new column (NULLable).
2. App writes to BOTH old + new column.
3. Backfill old rows: copy old → new in batches.

**Contract** (after all readers migrate):
4. App reads from new column only; writes only new.
5. After soak period, DROP old column.

Each step independently deployable. Rollback at any phase = just revert the latest app version.

## visualization
```
Phase 1: ADD new column (additive, instant in Postgres)
  ALTER TABLE users ADD COLUMN full_name TEXT;
  App v1 still reads/writes `name`. Zero behavior change.

Phase 2: Dual-write
  App v2: writes both `name` AND `full_name`.
  Reads still from `name`.
  Old rows still have `full_name = NULL` until backfill.

Phase 3: Backfill in batches
  UPDATE users SET full_name = name WHERE full_name IS NULL AND id BETWEEN $1 AND $2;
  Run in 1000-row chunks; respect locks; throttle.
  After complete: every row has both populated.

Phase 4: Switch reads
  App v3: reads from `full_name`, writes both.
  All reads now use new column.

Phase 5: Cleanup
  App v4: writes only `full_name`.
  After soak (1 week): ALTER TABLE users DROP COLUMN name;
```

## bruteForce
**Single ALTER + restart**: ALTER TABLE on multi-GB table locks for hours. Writes blocked. Customer 500s.

**Take downtime, run ALTER, restart**: scheduled outage. Customers angry, but at least predictable.

**pt-online-schema-change / gh-ost** (MySQL): create shadow table, copy rows, swap. Faster + non-blocking but still single-shot.

Expand-contract is the application-level pattern that beats DB-level tools for renames + type changes.

## optimal
**Migration script pattern** (Rails / Django / Alembic / Flyway):
- Each phase = separate migration file + matching app deploy.
- Phase numbers in filename: `001_add_full_name.sql`, `002_dual_write_app.code`, `003_backfill.sql`, etc.
- Tag each migration with rollback steps.

**Postgres specifics**:
- `ADD COLUMN ... NULL` is instant (just metadata).
- `ADD COLUMN ... NOT NULL DEFAULT 'foo'` is instant in Postgres 11+ (no table rewrite).
- `DROP COLUMN` is instant (just metadata; physical removal at VACUUM).
- Index creation: `CREATE INDEX CONCURRENTLY` — doesn't block writes; takes longer.
- `ALTER COLUMN ... TYPE`: rewrites the table — use expand-contract instead.

**Type change** via expand-contract:
1. Add `name_v2 BIGINT` (new type).
2. Dual-write: `name_v2 = name_v1` cast on every insert/update.
3. Backfill historic rows.
4. App reads from `name_v2`.
5. Drop `name_v1`, rename `name_v2 → name_v1`.

**Migration runners**:
- Postgres: pg_migrate, Flyway, Liquibase, Alembic.
- MySQL: gh-ost, pt-online-schema-change.
- General: Sqitch.

## complexity
- **Wall-clock**: phases 1-3 can run in 1 deploy; phases 4-5 wait days/weeks for confidence.
- **DB load**: backfill is the main cost; throttle batches (~1000 rows + 100ms sleep).
- **Engineering coordination**: 4 deploys instead of 1. Requires discipline.

## pitfalls
- **Skipping the soak period**: dropping the old column before all replicas + clients updated → 500s.
- **Backfill in one giant transaction**: locks table; defeats the point. Batch with explicit chunk sizes.
- **Forgetting to enforce NOT NULL after backfill**: violations slip in. After backfill done, `ALTER COLUMN SET NOT NULL` (Postgres 12+ validates in background).
- **Renaming via single ALTER**: there is no "online rename" in most DBs. Always use expand-contract.
- **Long-held locks blocking ALTER**: kill long-running transactions before migration OR use `lock_timeout`.

## interviewTips
- For "how would you rename a column in production" → expand-contract, never single ALTER.
- Mention **dual-write window** + **soak period** + **rollback at every step**.
- For senior: discuss **online schema change tools** (gh-ost, pt-osc) vs application-level expand-contract, and **multi-region replication delays** that lengthen the soak.

## code.python
```python
# Phase 3: backfill in batches via Alembic op.execute
def upgrade():
    op.execute("ALTER TABLE users ADD COLUMN full_name TEXT")
    # Backfill done in a separate script after deploy of dual-write app version
def downgrade():
    op.execute("ALTER TABLE users DROP COLUMN full_name")

# Backfill script (run after dual-write deployed)
def backfill():
    batch = 1000
    last_id = 0
    while True:
        rows = db.fetch("""
            UPDATE users SET full_name = name
            WHERE id > %s AND id <= %s AND full_name IS NULL
            RETURNING id
        """, (last_id, last_id + batch))
        if not rows: break
        last_id += batch
        time.sleep(0.1)  # throttle
```

## code.javascript
```javascript
// Knex migration pattern
exports.up = async (knex) => {
  await knex.schema.alterTable('users', t => t.text('full_name').nullable());
};
exports.down = async (knex) => {
  await knex.schema.alterTable('users', t => t.dropColumn('full_name'));
};

// Backfill script (run after deploy of dual-write code)
async function backfill() {
  let lastId = 0; const batch = 1000;
  while (true) {
    const updated = await knex.raw(`
      UPDATE users SET full_name = name
      WHERE id > ? AND id <= ? AND full_name IS NULL
      RETURNING id
    `, [lastId, lastId + batch]);
    if (!updated.rows.length) break;
    lastId += batch;
    await new Promise(r => setTimeout(r, 100));
  }
}
```

## code.java
```java
// Flyway migration V001__add_full_name.sql
// ALTER TABLE users ADD COLUMN full_name TEXT;
// Dual-write enforced in app code.
@Service
class UserRepository {
    public void save(User u) {
        jdbc.update("INSERT INTO users (id, name, full_name) VALUES (?, ?, ?)",
                    u.getId(), u.getName(), u.getName());  // dual write
    }
}
```

## code.cpp
```cpp
// Migration files via Sqitch or your custom runner. App-side dual write same shape.
// pqxx::work tx(conn);
// tx.exec("INSERT INTO users (id, name, full_name) VALUES ($1, $2, $2)", id, name);
```
