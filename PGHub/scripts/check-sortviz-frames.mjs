// One-off sanity check for the sorting visualizations: frame counts,
// caption presence, and final-frame-sorted invariant.
import { VISUALIZATIONS } from '../src/components/learn/conceptVisualizations.js';

let failed = false;
for (const slug of ['insertion-sort', 'selection-sort', 'heap-sort', 'counting-sort', 'shell-sort']) {
  const v = VISUALIZATIONS[slug];
  if (!v) { console.log(slug, 'MISSING'); failed = true; continue; }
  for (const c of v.cases) {
    const last = c.frames[c.frames.length - 1].array;
    const nums = last.filter((x) => typeof x === 'number');
    const sorted = nums.every((x, i) => i === 0 || nums[i - 1] <= x);
    const allHaveCaptions = c.frames.every((f) => typeof f.caption === 'string' && f.caption.length > 0);
    if (!sorted || !allHaveCaptions) failed = true;
    console.log(slug, '|', c.label, '| frames:', c.frames.length, '| final sorted:', sorted, '| captions:', allHaveCaptions, '| final:', JSON.stringify(last));
  }
}
process.exit(failed ? 1 : 0);
