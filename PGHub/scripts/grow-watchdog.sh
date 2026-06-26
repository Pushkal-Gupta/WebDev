#!/bin/zsh
# Never-stopping test-case grow drive. Loops bulk-grow-test-cases.js (resumable)
# so every problem keeps accruing Judge0-graded test cases toward the target.
# bulk-grow's VERIFY GATE re-grades each new case against the canonical Python and
# drops mismatches, so growth is trustworthy: correct code passes, wrong code fails.
# Runs forever; the user stops it explicitly. If a full pass adds nothing (all at
# target or Judge0 down), it backs off and retries rather than spinning hot.
cd /Users/pushkalgupta/Desktop/WebDev/PGHub || exit 1
mkdir -p .logs
pass=0
while true; do
  pass=$((pass + 1))
  echo "=== grow pass $pass start ===" >> .logs/grow-watchdog.log
  before=$(grep -cE '\(\+[1-9]' .logs/grow.log 2>/dev/null || echo 0)
  node scripts/bulk-grow-test-cases.js --max 500 --target 50 --resume >> .logs/grow.log 2>&1
  after=$(grep -cE '\(\+[1-9]' .logs/grow.log 2>/dev/null || echo 0)
  grew=$((after - before))
  echo "=== grow pass $pass done: ~$grew problems grew this pass ===" >> .logs/grow-watchdog.log
  if [ "$grew" -le 0 ]; then
    # nothing grew — either converged or Judge0 hiccup. Back off, then retry.
    echo "=== grow pass $pass added nothing; backing off 120s ===" >> .logs/grow-watchdog.log
    sleep 120
  else
    sleep 8
  fi
done
