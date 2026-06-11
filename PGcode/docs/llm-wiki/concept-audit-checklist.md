# concept-audit-checklist

`content/concepts/` is 440+ files. Agents have written duplicates 4 times because they didn't audit first. Don't be the 5th.

## Before writing ANY new concept

```bash
ls content/concepts/ | grep -i <topic-keyword>
```

Check for both the exact slug AND variants. The catalog has:

- `bloom-filter.md`, `bloom-cardinality-tradeoff.md`, `bloom-filter-variants.md`, `bloom-filter-tuning.md` — all distinct, all kept.
- `cqrs.md` AND `cqrs-pattern.md` — duplicates, one to deprecate.
- `bulkhead-pattern.md` AND `bulkhead-isolation.md` — same topic, different slugs.
- `rate-limiter-token-bucket.md` AND `rate-limit-leaky-bucket.md` — distinct, both kept.

If your topic ALREADY EXISTS, skip and report it in the agent's response. Don't write a duplicate.

If your topic has a CLOSE-BUT-DIFFERENT variant, decide deliberately whether yours adds new value (deeper variant, different module focus) or is a duplicate.

## Required structure

Every concept file must hit the content bar from CLAUDE.md:

- Front matter: `slug`, `module`, `title`, `subtitle`, `difficulty`, `position` (pick a non-colliding number), `estimatedReadMinutes`, `prereqs: []`, `relatedProblems: []`, `references` (3+ entries with `title`/`url`/`type`), `status: published`.
- Body sections (lengths are floors, not ceilings):
  - `intro` — 60+ words
  - `whyItMatters` — 70+ words
  - `intuition` — 200+ words (this is where you teach the mental model)
  - `visualization` — 8+ fenced ASCII lines INSIDE a ` ``` ` code block (this is the only place ASCII art is allowed; the no-ASCII rule applies to ML lessons + viz components, NOT Concepts)
  - `bruteForce` — 60+ words
  - `optimal` — 200+ words
  - `complexity` — 40+ words, include the actual math formulas
  - `pitfalls` — 4+ items
  - `interviewTips` — 3 items
  - `code.python` / `.javascript` / `.java` / `.cpp` — working canonical skeletons in all 4 languages

## Voice rules

**Reader-direct only.** Never use:
- "We built…"
- "This lesson covers…"
- "In this guide we will…"
- "Welcome to X!"

The reader is here to learn. Tell them what they're getting, then show it. See `feedback_customer_voice` memory for the canonical rule.

## References must be WebFetch-verified

Don't paste a URL you haven't checked. The user has been burned by stale Microsoft architecture catalog links 3 times. For each reference:

1. WebFetch the URL.
2. Confirm it resolves and matches the topic.
3. If 404 or off-topic, swap for a different authoritative source.

Good source classes: Wikipedia (stable), arXiv papers (stable), Cloudflare/Stripe/AWS engineering blogs (mostly stable), CMU papers, original paper PDFs hosted by the author's university page.

Bad source classes: Microsoft architecture catalog (URLs rot constantly), random Medium articles, anything behind a paywall.

## After writing

1. `node scripts/import-concepts.js --dry` — confirm all files parse.
2. `node scripts/import-concepts.js` — push to Supabase.
3. Check the count delta: was 440, should be 440 + N where N = number of NEW files you wrote.
4. `npm run build` — exit 0.

---
*Last updated: 2026-06-10. Catalog at 444+ concepts.*
