// Aggregates concept-visualization batch modules so they can be merged into the
// master VISUALIZATIONS map without editing the monolith. Each batch default-exports
// an object keyed by concept slug: { slug: { title, renderer, cases, build?, inputSchema? } }.
// Inline entries in conceptVisualizations.js take precedence over anything here.
import batchAvlTrees from './batchAvlTrees';
import batchGraphTraversal from './batchGraphTraversal';
import batchBitwise from './batchBitwise';
import batchStringMatch from './batchStringMatch';
import batchVisualgoGaps from './batchVisualgoGaps';
import batchDP from './batchDP';
import batchGraphAdvanced from './batchGraphAdvanced';
import batchStringsNp from './batchStringsNp';
import batchHeapStackQueue from './batchHeapStackQueue';
import batchTreesAdvanced from './batchTreesAdvanced';
import batchBacktracking from './batchBacktracking';
import batchMath from './batchMath';
import batchShortestTopo from './batchShortestTopo';
import batchMstScc from './batchMstScc';
import batchAdvancedDS from './batchAdvancedDS';
import batchStringsStreams from './batchStringsStreams';
import batchAdvancedTrees2 from './batchAdvancedTrees2';
import batchStringsGreedy from './batchStringsGreedy';
import batchGraphDpTrie from './batchGraphDpTrie';
import batchMoreAlgosA from './batchMoreAlgosA';
import batchMoreAlgosB from './batchMoreAlgosB';
import batchMoreAlgosC from './batchMoreAlgosC';
import batchMoreAlgosD from './batchMoreAlgosD';

const batches = [
  batchAvlTrees,
  batchGraphTraversal,
  batchBitwise,
  batchStringMatch,
  batchVisualgoGaps,
  batchDP,
  batchGraphAdvanced,
  batchStringsNp,
  batchHeapStackQueue,
  batchTreesAdvanced,
  batchBacktracking,
  batchMath,
  batchShortestTopo,
  batchMstScc,
  batchAdvancedDS,
  batchStringsStreams,
  batchAdvancedTrees2,
  batchStringsGreedy,
  batchGraphDpTrie,
  batchMoreAlgosA,
  batchMoreAlgosB,
  batchMoreAlgosC,
  batchMoreAlgosD,
];

export default batches.reduce((acc, b) => Object.assign(acc, b || {}), {});
