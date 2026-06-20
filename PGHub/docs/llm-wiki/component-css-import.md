# component-css-import

A component that renders on a route different from where its CSS is imported ships UNSTYLED there — and unstyled SVG defaults to **solid black fill at full size** (the infamous "giant black circle").

## The bug (shipped 2026-06-14)
`LeetCodeAnalytics.jsx` and `ExternalContestsCalendar.jsx` did NOT `import './Contests.css'` themselves — they relied on `ContestsIndex.jsx` importing it. That worked on `/contests` (ContestsIndex mounted) but the components were ALSO composed into the new `/compete` hub (`CompeteHub`, which imports only `CompeteHub.css`). On `/compete`, `ContestsIndex` never mounts, so the `lca-*`/`exc-*` rules were absent from that route's loaded CSS → the rating gauge `<path>`/`<circle>` fell back to default `fill:black` at full container width = a huge black blob. Build was green and code reviewers (reading the CSS file, which was correct) saw nothing wrong — only the live render exposed it.

## The rule
**Every component imports its own CSS.** `import './Foo.css'` belongs at the top of `Foo.jsx`, not inherited from whatever parent happens to mount it. Vite dedupes the import across the bundle, so it's free to import in multiple components. Never rely on a sibling/parent route component to have pulled in the stylesheet.

## How to catch it
When a component is reused under a NEW route/hub, grep it: `grep -L "\.css'" Component.jsx` — if it uses CSS classes but imports no stylesheet, find which file defines those classes and add the import to the component. Symptom in the browser: unstyled black SVGs / full-width elements that look fine on the original route.

---
*Last updated: 2026-06-14 — Compete hub gauge rendered as a black circle because Contests.css wasn't loaded on /compete.*
