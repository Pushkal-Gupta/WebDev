#!/bin/zsh
# Continuous mutation-testing adequacy drive. Pages through the whole catalog in
# chunks, and for every problem with a real canonical: generates mutants, kills
# them with the existing suite, and for any survivor synthesizes a distinguishing
# input + adds it as a verified case (`--fix`). When a full sweep finishes it loops
# from the top — so the suite's adequacy only ever ratchets up (regression). This
# is the engine that gives each problem "the proper amount of cases" — however many
# it takes to reach mutation score 100% — not a flat 50. Needs local Judge0 (env
# JUDGE0_URL/JUDGE0_AUTH_TOKEN) or it crawls on the rate-limited public CE.
cd /Users/pushkalgupta/Desktop/WebDev/PGHub || exit 1
mkdir -p .logs
CHUNK=200
TOTAL=5000          # safe upper bound on catalog size; range() past the end just yields fewer rows
sweep=0
while true; do
  sweep=$((sweep + 1))
  echo "=== mutation sweep $sweep start ===" >> .logs/mutation-watchdog.log
  off=0
  while [ "$off" -lt "$TOTAL" ]; do
    node scripts/mutation-test.mjs --max $CHUNK --offset $off --fix >> .logs/mutation.log 2>&1
    off=$((off + CHUNK))
  done
  echo "=== mutation sweep $sweep done ===" >> .logs/mutation-watchdog.log
  sleep 20
done
