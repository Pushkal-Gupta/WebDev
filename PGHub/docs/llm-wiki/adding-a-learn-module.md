# adding-a-learn-module

How to stand up a whole new subject area in Learn (e.g. Calculus, Linear Algebra,
Operating Systems). A "module" is a top-level folder of concepts shown on the Learn
index; concepts attach to it by `module_slug`. For adding *concepts* into an existing
module, see [`content-growth-pipeline.md`](./content-growth-pipeline.md).

## The data model

- **`PGcode_modules`** — one row per module. Columns: `slug` (unique),
  `name`, `description`, `position` (sort order on the index), `icon` (a lucide icon
  name, e.g. `'TrendingUp'`), and `parent_slug` (set only for **sub-modules** —
  see below).
- **`PGcode_concepts`** — `module_slug` is the FK back to `PGcode_modules.slug`.
  A concept's `module:` frontmatter becomes this column on import.

## 1 — The migration (idempotent)

New module = a numbered migration `scripts/migrate-NN-<topic>-module.sql`. Always
`ON CONFLICT (slug) DO UPDATE` so re-running keeps the row in sync (canonical:
`scripts/migrate-62-calculus-module.sql`):

```sql
INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'calculus',
  'Calculus',
  'Limits, derivatives, the chain rule, and integration as area — built from intuition with interactive visuals.',
  16,
  'TrendingUp'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon;
```

Apply: `supabase db query --linked --file scripts/migrate-62-calculus-module.sql`.
(A service-role `sb.from('PGcode_modules').upsert(row, { onConflict:'slug' })` from a
Node script works too — same effect, no migration file.)

- **`position`**: pick a slot that reads sensibly on the index. Math-flavoured
  modules sit ~2–16; `system-design` is 100. Don't collide with an existing position
  if order matters.
- **`icon`**: a real lucide-react name; the index renders it. No emoji (CLAUDE.md).
- **Copy**: the `description` is reader-facing — one declarative line, no "this module
  contains…" / builder voice (CLAUDE.md voice rule).

## 2 — How the Learn index groups by module

`LearnIndex.jsx` calls `useModules()` (reads `PGcode_modules` ordered by `position`)
and `useAllConceptsCompact()`, then buckets concepts by `module_slug`. Each module
becomes a card (a `ForgeThumb` motif + a rotating `--hue-*` accent); clicking it
opens `/learn/:moduleSlug` with that module's concepts sorted by `position`. So a new
module row + at least one imported concept is all it takes to appear — no component
edit.

## 3 — Sub-modules (splitting a big module)

When a module grows past ~40 concepts (CLAUDE.md: system-design is the canonical
offender), split it into sub-modules of 10–15. A sub-module is just a
`PGcode_modules` row with `parent_slug` set to the parent's slug. `LearnIndex.jsx`
treats top-level modules as `modules.filter(m => !m.parent_slug)` and nests the rest.
Concepts still attach via `module_slug` (pointing at the sub-module's slug).

## 4 — Then add concepts

With the module row live, author `content/concepts/<slug>.md` files whose
`module:` frontmatter equals the new slug, build + register their viz, and import:
`node scripts/import-concepts.js --dry` then live. `--dry` will error on an unknown
module, so the migration must land first. Full loop:
[`content-growth-pipeline.md`](./content-growth-pipeline.md).

## Checklist

- [ ] `migrate-NN-<topic>-module.sql`, idempotent `ON CONFLICT (slug) DO UPDATE`.
- [ ] Applied via `supabase db query --linked --file …`.
- [ ] `icon` is a valid lucide name; `description` is reader-direct, one line.
- [ ] `position` doesn't clobber an existing module's slot.
- [ ] Concepts authored with matching `module:` + imported (`--dry` first).
- [ ] `/learn` shows the new module card; `/learn/<slug>` lists its concepts.

---
*Last updated: 2026-06-27.*
