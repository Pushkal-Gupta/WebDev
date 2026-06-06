// Interactive (full React component) visualizations, keyed by concept slug.
// Rendered by ConceptPage in a "Try it yourself" block AFTER the existing
// frame-based AlgoVisualizer walkthrough. Both render side-by-side — the
// frame viz narrates the algorithm step-by-step, the interactive one lets
// the reader poke at inputs and see the structure respond live.

import BinarySearchViz from './viz/BinarySearchViz';
import SlidingWindowViz from './viz/SlidingWindowViz';
import TwoPointersViz from './viz/TwoPointersViz';
import BFSViz from './viz/BFSViz';
import DFSViz from './viz/DFSViz';
import HeapInsertViz from './viz/HeapInsertViz';
import DPGridViz from './viz/DPGridViz';
import DijkstraViz from './viz/DijkstraViz';

// Concept slug -> interactive React component. Slugs verified against
// content/concepts/*.md and the VISUALIZATIONS frame map.
//
// - 'binary-search'        -> content/concepts/binary-search.md
// - 'sliding-window'       -> content/concepts/sliding-window.md
// - 'two-pointers'         -> content/concepts/two-pointers.md
// - 'bfs-algorithm'        -> content/concepts/bfs-algorithm.md
// - 'dfs-algorithm'        -> content/concepts/dfs-algorithm.md
// - 'heap-binary'          -> content/concepts/heap-binary.md (canonical min/max-heap concept)
// - 'unique-paths-grid'    -> matches DP grid-paths concept in the registry
// - 'dijkstras-algorithm'  -> content/concepts/dijkstras-algorithm.md (note: plural)
//
// Aliases are included for adjacent slugs that cover the same algorithm —
// readers landing on a sibling concept (e.g. 'bfs-dfs', 'dijkstra-pq',
// 'unique-paths') still get the interactive viz.
export const INTERACTIVE_VIZ = {
  'binary-search': BinarySearchViz,

  'sliding-window': SlidingWindowViz,

  'two-pointers': TwoPointersViz,

  'bfs-algorithm': BFSViz,
  'bfs-dfs': BFSViz,

  'dfs-algorithm': DFSViz,
  'dfs-traversal': DFSViz,
  'dfs-iterative': DFSViz,

  'heap-binary': HeapInsertViz,
  'min-heap': HeapInsertViz,
  'max-heap': HeapInsertViz,

  'unique-paths-grid': DPGridViz,
  'unique-paths': DPGridViz,

  'dijkstras-algorithm': DijkstraViz,
  'dijkstra-shortest-path': DijkstraViz,
  'dijkstra-pq': DijkstraViz,
};

export default INTERACTIVE_VIZ;
