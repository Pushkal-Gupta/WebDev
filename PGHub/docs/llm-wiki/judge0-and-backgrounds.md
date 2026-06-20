# judge0-and-backgrounds

When to launch background processes, how to monitor them, and why Judge0 is the bottleneck on ~everything.

## Judge0 is the chokepoint

Test-case growth, mutation testing, LC scraping, verify-prune — they ALL hit the Supabase Edge Function `run-code`, which calls Judge0. Per-call latency is 1–5 seconds (compile + run + return). At realistic concurrency, the whole catalog sweep takes hours-to-days. Plan for it.

| Operation | Per-problem cost |
|---|---|
| `multiply-test-cases.js` | ~30–120 s (20–40 Judge0 calls to grade new inputs) |
| `verify-prune-tests.js` | ~20–200 s (1 Judge0 call per existing test case) |
| `mutation-test.js` | ~100 s per problem × `--max-mutations` factor |
| `scrape-lc-testcases.js` | ~5 s (LC API + 3 Judge0 calls per LC sample) |

## When to launch in background

If the task takes > 10 minutes wall time, launch as `nohup ... &` and report the PID. Don't block agent execution waiting for it.

Pattern:

```bash
mkdir -p logs
nohup node scripts/multiply-test-cases.js --all --difficulty Easy --target 50 \
  > logs/bulk-grow-easy-50-$(date +%Y%m%d-%H%M%S).log 2>&1 &
PID=$!
echo "PID: $PID"
sleep 3
ps -p $PID -o pid,stat,etime,command
```

The `sleep 3` + `ps` is critical — if the process died immediately, you need to know NOW, not after the user comes back in an hour.

## How to monitor a long-running background process

Do NOT read the JSONL output file (the harness warns about this — it'll overflow context). Instead:

```bash
# Is it alive?
ps -p <PID> -o pid,etime,stat

# How far has it gotten?
grep -c "merged →\|✓ updated\|pulled" logs/<latest>.log

# Recent output (the LAST 5 lines, not the whole log)
tail -5 logs/<latest>.log
```

`grep -c` against a structured progress marker scales — `wc -l` on a 30k-line log eats your context.

## The PostgREST pagination trap

`sb.from('PGcode_problems').select('*')` returns at MOST 1000 rows by default. Several scripts (`multiply-test-cases.js --all`, `mutation-test.js --all`, `verify-prune-tests.js --all` legacy wrapper) hit this cap silently. They process the first 1000 and exit "successfully," leaving 2700 untouched.

Workaround:
- Use `.range(offset, offset + 999)` and iterate offsets.
- Or: filter by `--difficulty Easy|Medium|Hard` to get one bucket at a time (each is < 2100 problems).

If you write a new "all-catalog" script, BUILD pagination in from the start.

## Rate-limit awareness

The Supabase Edge Function has soft rate limits. If 3+ concurrent processes hit Judge0 hard, you'll see 5xx responses in the logs. Each script handles this differently:

- `multiply-test-cases.js` — retries internally, but slows down
- `scrape-lc-testcases.js` — exponential backoff on 429/5xx
- `mutation-test.js` — fails the individual mutation, moves on
- `verify-prune-tests.js` — logs the case as "transient" (Pattern 4), doesn't drop it

If you see > 5% Pattern-4-style transient errors, drop concurrency.

## Killing a runaway

```bash
# Find it
ps -ef | grep "node scripts/" | grep -v grep | awk '{print $2, $NF}'

# Kill politely
kill <PID>
sleep 3
ps -p <PID> -o stat  # confirm gone (no output = killed)

# If still alive, harder
kill -9 <PID>
```

The user runs `git push` themselves — same rule applies to killing background work. Confirm before killing anything you didn't start.

## Status report after a background launch

In your agent report:
- PID
- Log path
- Estimated wall time
- What signal indicates "done" (e.g. "look for `Done. Added N test cases total.` at end of log")
- Where the structured output JSON will land

Without these, the user can't pick up monitoring after the agent exits.

---
*Last updated: 2026-06-10. Background processes seen: 3 bulk-grow + LC scraper + mutation-test + verify-prune sweep.*
