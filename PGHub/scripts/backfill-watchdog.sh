#!/bin/zsh
# Resilient backfill runner: re-runs backfill-solutions.mjs until it converges
# (a full pass that writes 0 new solutions) or hits the pass cap. The backfill
# skips already-present languages, so each subsequent pass only re-grades the
# ones that failed transiently on Judge0 (rate-limit / network blips). Survives
# individual run completion; a machine sleep still stops it (re-launch on next
# invocation). Logs to .logs/backfill.log + .logs/watchdog.log.
cd /Users/pushkalgupta/Desktop/WebDev/PGHub || exit 1
mkdir -p .logs
prev=-1
for pass in {1..12}; do
  before=$(grep -cE '→ wrote:' .logs/backfill.log 2>/dev/null || echo 0)
  echo "=== watchdog pass $pass start (writes so far: $before) $(node -e 'process.stdout.write(""+Date.now())') ===" >> .logs/watchdog.log
  node scripts/backfill-solutions.mjs >> .logs/backfill.log 2>&1
  after=$(grep -cE '→ wrote:' .logs/backfill.log 2>/dev/null || echo 0)
  delta=$((after - before))
  echo "=== watchdog pass $pass done: +$delta writes (total $after) ===" >> .logs/watchdog.log
  if [ "$delta" -le 0 ]; then
    echo "=== watchdog converged after pass $pass (0 new writes) ===" >> .logs/watchdog.log
    break
  fi
  sleep 15
done
echo "=== watchdog finished $(node -e 'process.stdout.write(""+Date.now())') ===" >> .logs/watchdog.log
