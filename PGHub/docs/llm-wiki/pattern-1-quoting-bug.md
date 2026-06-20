# pattern-1-quoting-bug

The single biggest source of false WA verdicts in the catalog. Discovered Wave 13 during a verify-prune sample. **~75 of 138 bad test cases (54%)** trace to this one root cause.

## The bug

String-param inputs are stored with extra layer of JSON-encoding. The harness then double-decodes them and feeds the wrong value to the canonical Python.

Example (`add-binary`, signature `addBinary(a: str, b: str)`):

```json
{
  "inputs": ["\"0\"", "\"0\""],
  "expected": "\"0\""
}
```

`json.loads('"0"')` returns the string `"0"` — that's fine.

But many problems have inputs stored as `["\"\\\"0\\\"\""]` — a JSON-encoded JSON-encoded string. The decoder returns the literal `\"0\"` (with escape chars), the canonical does `int(s, 2)`, and Python raises `ValueError`.

In every reported case, the bug is in the STORED DATA, not the canonical Python or the test logic.

## How it got there

Suspected: during one of the early scrapes (probably Wave 4 or 5 LC import), string fields were `JSON.stringify(value)`-ed before being placed inside the `inputs` array that itself gets serialized. The double encoding survived migration.

## The fix recipe

Build `scripts/fix-pattern1-quoting.mjs`:

1. Page through `PGcode_problems` (1000 at a time).
2. Filter to rows where any of `params[i].type == "string"`.
3. For each row, inspect every test case's `inputs[i]`. If the param at index `i` is `string` AND the stored value matches the double-quote pattern, unwrap once.
4. **Pre-flight every fix**: run the canonical against the corrected first 3 test cases via Judge0. If even one fails, SKIP the entire problem — don't risk silently corrupting good cases.
5. **Dry-run by default** (`--apply` to actually write).
6. Log every change for the audit trail.

## How to recognize the bug when verifying

When a verify-prune sweep reports "runtime_error" on a problem with string params, check the stored input format BEFORE assuming the canonical is wrong:

```bash
node -e '
import("@supabase/supabase-js").then(async ({createClient}) => {
  const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await sb.from("PGcode_problems").select("params,test_cases").eq("id", "add-binary").single();
  console.log("params:", data.params);
  console.log("first test case:", JSON.stringify(data.test_cases[0], null, 2));
});'
```

If you see `"inputs": ["\"0\"", ...]` and the param type is `string`, it's Pattern 1. Don't drop the case. Unwrap it.

## What NOT to do

- **Don't `verify-prune-tests.js --apply` blindly** across the catalog before Pattern 1 is fixed. You will delete ~75 cases that are actually salvageable.
- **Don't unwrap unconditionally.** Some inputs LEGITIMATELY have escape chars in them (e.g. JSON-encoded data structures). The unwrap should only fire when the stored value is `"\"...\""` shape AND the param type is `string`.
- **Don't fix this on individual problems.** Build the script once, run it across the catalog under `--dry`, eyeball the changes, then `--apply`.

## Confidence level

HIGH that fixing Pattern 1 closes ~75/138 bad cases (54%). The remaining patterns:
- **Pattern 2 (~60 cases):** Problems with no canonical Python (SQL imported as code). Fix: author canonical or de-list.
- **Pattern 3 (1 case so far):** Genuinely wrong stored expected. Hand-fix.
- **Pattern 4 (2 cases):** Transient Judge0 504s. Re-run.

---
*Last updated: 2026-06-10. Discovered by verify-prune sample on 10 Easy problems (435 cases scanned).*
