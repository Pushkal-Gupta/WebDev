# Screenshot QA harness — verify the app actually renders

**Agents' "build passes / eslint clean" reports are NOT proof the UI renders correctly.** Multiple times a wave reported success while the page rendered blank, with collapsed cards, white-on-white text, or clipped content. The only reliable check is to look at the rendered page. This harness lets you (the orchestrator) do that headlessly.

## Setup

PGcode has no `puppeteer` dependency. The sibling repo does — reuse its bundled Chromium:

```bash
npm run dev              # Vite; lands on :5173 (or :5174 if taken). Note the port.
NODE_PATH=/Users/pushkalgupta/Desktop/WebDev/PG.Play/node_modules node scripts/_shot.cjs
```

Routes are HashRouter (`#/...`). The scripts read `SHOT_BASE` (default `http://localhost:5173`) — pass `SHOT_BASE=http://localhost:5174` if dev landed there.

## The scripts (QA-only, not imported by the app — safe to delete)

- **`scripts/_shot.cjs`** — captures every route, light + dark (`pg-theme=midnight` via `localStorage`), to `/tmp/pgshots/*.png`. Edit its `SHOTS` array `[name, route, theme, clickText?, scrollY?]` to add routes / click into a tab / scroll deep.
- **`scripts/_diag.cjs`** — `page.evaluate` probe that returns computed styles/dimensions of a selector. This is how the collapsed-lesson-card bug was pinned (it reported `thumbH:0`, `titleColor: rgb(255,255,255)`, `cardH:58`) — reach for it when "why is it blank/wrong" needs measurement, not eyeballing.
- **`scripts/_vshot.cjs`** — small targeted capture (scratch file; rewrite its `SHOTS` per check).

## CRITICAL: two settings or `captureScreenshot` hangs

Continuously-animating SVG pages keep the compositor busy and hang the screenshot. Launch with:

```js
puppeteer.launch({ headless: 'new', protocolTimeout: 120000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
// per page, BEFORE goto:
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
```

`prefers-reduced-motion` freezes the viz animations (they honor it), so the screenshot can complete. Even so, very viz-dense lessons could still time out — that's what the `VizBlock` lazy-mount (see `premium-explorer-viz.md`) fixed: off-screen viz never mount, so heavy lesson pages capture in ~3s instead of hanging. The harness still gets flaky under sustained heavy load over a long session; restart the dev server fresh if captures start timing out.

## The loop

1. Capture (`_shot.cjs`).
2. Dispatch a **reviewer sub-agent** that `Read`s the PNGs and returns a **text punch list** (file → problem). This keeps the main-loop context lean — don't read 40 images into your own context; let the sub-agent triage.
3. Fix the real findings (filter out anon/headless artifacts — see below).
4. Re-capture, confirm.

## Anon / headless artifacts (NOT bugs)

- Supabase-backed pages (**Practice**, **Companies** at `/company`) render blank/skeleton in anon headless — they load when the user is logged in. Don't "fix" these by editing code.
- `supabase db query --linked` returns 401 without `SUPABASE_DB_PASSWORD` in the env — can't seed/verify anon data from the CLI without it.
- The dark capture occasionally renders light (theme re-applied after first paint) — a harness quirk, not a bug.
- Use the correct route: it's `/company` (singular), not `/companies`.
