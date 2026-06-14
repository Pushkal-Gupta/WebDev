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
import TarjanSCCViz from './viz/TarjanSCCViz';
import KahnTopoSortViz from './viz/KahnTopoSortViz';
import AVLRotationViz from './viz/AVLRotationViz';
import AStarSearchViz from './viz/AStarSearchViz';
import BubbleSortViz from './viz/BubbleSortViz';
import BSTOperationsViz from './viz/BSTOperationsViz';
import XorPropertiesViz from './viz/XorPropertiesViz';
import BoyerMooreVotingViz from './viz/BoyerMooreVotingViz';
import InorderIteratorViz from './viz/InorderIteratorViz';
import BinaryLiftingLCAViz from './viz/BinaryLiftingLCAViz';
import BTreeInsertViz from './viz/BTreeInsertViz';
import BloomFilterViz from './viz/BloomFilterViz';
import ArticulationBridgesViz from './viz/ArticulationBridgesViz';
import BipartiteMatchingViz from './viz/BipartiteMatchingViz';
import GraphColoringViz from './viz/GraphColoringViz';
import BitCountingViz from './viz/BitCountingViz';
import GrayCodeViz from './viz/GrayCodeViz';
import BoyerMooreBadCharViz from './viz/BoyerMooreBadCharViz';
import CacheEvictionViz from './viz/CacheEvictionViz';
import SubsetEnumerationViz from './viz/SubsetEnumerationViz';
import EventLoopViz from './viz/EventLoopViz';
import BPlusTreeViz from './viz/BPlusTreeViz';
import CASViz from './viz/CASViz';
import ConsistentHashingViz from './viz/ConsistentHashingViz';
import FenwickTreeViz from './viz/FenwickTreeViz';
import RateLimiterViz from './viz/RateLimiterViz';
import RenderPipelineViz from './viz/RenderPipelineViz';
import NetworkFlowViz from './viz/NetworkFlowViz';
import ConvexHullViz from './viz/ConvexHullViz';
import SuffixArrayViz from './viz/SuffixArrayViz';
import MergeSortViz from './viz/MergeSortViz';
import QuickSortViz from './viz/QuickSortViz';
import AhoCorasickViz from './viz/AhoCorasickViz';
import TopoSortDFSViz from './viz/TopoSortDFSViz';
import MoAlgorithmViz from './viz/MoAlgorithmViz';
import CacheStrategyViz from './viz/CacheStrategyViz';
import CDCViz from './viz/CDCViz';
import KMPFailureViz from './viz/KMPFailureViz';
import RedBlackTreeViz from './viz/RedBlackTreeViz';
import CountMinSketchViz from './viz/CountMinSketchViz';
import WALViz from './viz/WALViz';
import SkipListViz from './viz/SkipListViz';
import CountingSortViz from './viz/CountingSortViz';
import HyperLogLogViz from './viz/HyperLogLogViz';
import TwoPhaseCommitViz from './viz/TwoPhaseCommitViz';
import SplayTreeViz from './viz/SplayTreeViz';
import LSMTreeViz from './viz/LSMTreeViz';
import VectorClocksViz from './viz/VectorClocksViz';
import SagaPatternViz from './viz/SagaPatternViz';
import SqrtDecompositionViz from './viz/SqrtDecompositionViz';
import LeakyBucketViz from './viz/LeakyBucketViz';
import GossipProtocolViz from './viz/GossipProtocolViz';
import QuorumConsensusViz from './viz/QuorumConsensusViz';
import PersistentSegTreeViz from './viz/PersistentSegTreeViz';
import BoruvkaMSTViz from './viz/BoruvkaMSTViz';
import MinCostMaxFlowViz from './viz/MinCostMaxFlowViz';
import LamportClockViz from './viz/LamportClockViz';
import CentroidDecompositionViz from './viz/CentroidDecompositionViz';
import JohnsonAPSPViz from './viz/JohnsonAPSPViz';
import BulkheadIsolationViz from './viz/BulkheadIsolationViz';
import DatabaseShardingViz from './viz/DatabaseShardingViz';
import DatabaseReplicationViz from './viz/DatabaseReplicationViz';
import DeadlockViz from './viz/DeadlockViz';
import BitmaskDPViz from './viz/BitmaskDPViz';
import IntervalDPViz from './viz/IntervalDPViz';
import DigitDPViz from './viz/DigitDPViz';
import DistributedLockViz from './viz/DistributedLockViz';
import DijkstraGridViz from './viz/DijkstraGridViz';
import GameTheoryDPViz from './viz/GameTheoryDPViz';
import OptimalBSTViz from './viz/OptimalBSTViz';
import IntervalSchedulingViz from './viz/IntervalSchedulingViz';
import CDNPurgeViz from './viz/CDNPurgeViz';
import CombinationsBacktrackViz from './viz/CombinationsBacktrackViz';
import FloydWarshallViz from './viz/FloydWarshallViz';
import LISPatienceViz from './viz/LISPatienceViz';
import MedianStreamViz from './viz/MedianStreamViz';
import EulerTourViz from './viz/EulerTourViz';
import TreeDPViz from './viz/TreeDPViz';
import TwoSatViz from './viz/TwoSatViz';
import MatrixExpoViz from './viz/MatrixExpoViz';
import EulerianViz from './viz/EulerianViz';
import LeftistHeapViz from './viz/LeftistHeapViz';
import KruskalMSTViz from './viz/KruskalMSTViz';
import AcidTransactionViz from './viz/AcidTransactionViz';
import ApiGatewayViz from './viz/ApiGatewayViz';
import CdnEdgeCacheViz from './viz/CdnEdgeCacheViz';
import CpuSchedulingViz from './viz/CpuSchedulingViz';
import CircuitBreakerViz from './viz/CircuitBreakerViz';
import BlueGreenDeployViz from './viz/BlueGreenDeployViz';

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
  'acid-transactions': AcidTransactionViz,
  'api-gateway-pattern': ApiGatewayViz,
  'cdn-edge-caching': CdnEdgeCacheViz,
  'cpu-scheduling-algorithms': CpuSchedulingViz,
  'circuit-breaker': CircuitBreakerViz,
  'blue-green-deployment': BlueGreenDeployViz,

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

  'tarjan-scc': TarjanSCCViz,

  'kahns-algorithm': KahnTopoSortViz,
  'kahn-topological-sort': KahnTopoSortViz,
  'topological-sort': KahnTopoSortViz,

  'avl-tree-rotations': AVLRotationViz,
  'astar-search': AStarSearchViz,
  'bubble-sort-algorithm': BubbleSortViz,
  'binary-search-tree-operations': BSTOperationsViz,

  'bitwise-xor-properties': XorPropertiesViz,
  'boyer-moore-voting-extended': BoyerMooreVotingViz,
  'bst-iterator-inorder': InorderIteratorViz,
  'binary-lifting-lca': BinaryLiftingLCAViz,

  'b-tree': BTreeInsertViz,
  'bloom-filter-tuning': BloomFilterViz,
  'articulation-bridges': ArticulationBridgesViz,
  'bipartite-matching-kuhn': BipartiteMatchingViz,
  'graph-coloring-greedy': GraphColoringViz,

  'bit-counting-tricks': BitCountingViz,
  'bitwise-gray-code': GrayCodeViz,
  'boyer-moore-bad-char': BoyerMooreBadCharViz,
  'cache-eviction-policies': CacheEvictionViz,

  'bitwise-power-set-bitmask': SubsetEnumerationViz,
  'browser-event-loop': EventLoopViz,
  'b-plus-tree': BPlusTreeViz,
  'cas-lock-free': CASViz,

  'consistent-hashing': ConsistentHashingViz,
  'fenwick-bit': FenwickTreeViz,
  'api-rate-limit-design': RateLimiterViz,
  'browser-rendering-pipeline': RenderPipelineViz,

  'max-flow': NetworkFlowViz,
  'network-flow-dinic': NetworkFlowViz,

  'convex-hull': ConvexHullViz,
  'quickhull': ConvexHullViz,

  'suffix-array': SuffixArrayViz,
  'string-suffix-array': SuffixArrayViz,

  'merge-sort-algorithm': MergeSortViz,
  'quicksort-algorithm': QuickSortViz,
  'aho-corasick-failure': AhoCorasickViz,
  'topological-sort-dfs': TopoSortDFSViz,
  'mo-algorithm': MoAlgorithmViz,
  'cache-aside-vs-through': CacheStrategyViz,
  'cdc-change-data-capture': CDCViz,

  'kmp-failure-function': KMPFailureViz,
  'red-black-tree': RedBlackTreeViz,
  'count-min-sketch': CountMinSketchViz,
  'write-ahead-log': WALViz,

  'skip-list': SkipListViz,
  'counting-sort-algorithm': CountingSortViz,
  'hyperloglog': HyperLogLogViz,
  'two-phase-commit': TwoPhaseCommitViz,

  'splay-tree': SplayTreeViz,
  'lsm-tree': LSMTreeViz,
  'vector-clocks': VectorClocksViz,
  'saga-pattern': SagaPatternViz,

  'sqrt-decomposition': SqrtDecompositionViz,
  'leaky-bucket': LeakyBucketViz,
  'gossip-protocol': GossipProtocolViz,
  'quorum-consensus': QuorumConsensusViz,

  'persistent-segment-tree': PersistentSegTreeViz,
  'mst-boruvka': BoruvkaMSTViz,
  'min-cost-max-flow': MinCostMaxFlowViz,
  'lamport-clock': LamportClockViz,

  'centroid-decomposition': CentroidDecompositionViz,
  'johnson-all-pairs': JohnsonAPSPViz,
  'bulkhead-isolation': BulkheadIsolationViz,

  'database-sharding': DatabaseShardingViz,
  'database-replication': DatabaseReplicationViz,
  'deadlock-coffman-conditions': DeadlockViz,
  'dp-bitmask': BitmaskDPViz,

  'dp-interval-mcm': IntervalDPViz,
  'dp-digit': DigitDPViz,
  'distributed-lock': DistributedLockViz,
  'dijkstra-on-grid': DijkstraGridViz,

  'dp-game-theory': GameTheoryDPViz,
  'dp-optimal-bst': OptimalBSTViz,
  'dp-job-scheduling': IntervalSchedulingViz,
  'cdn-purge-strategies': CDNPurgeViz,

  'combinations-backtrack': CombinationsBacktrackViz,
  'graph-floyd-warshall': FloydWarshallViz,
  'lis-patience-sorting': LISPatienceViz,
  'heaps-median-from-stream': MedianStreamViz,

  'euler-tour-flatten': EulerTourViz,
  'dp-tree': TreeDPViz,
  'graph-2sat': TwoSatViz,

  'dp-matrix-exponentiation': MatrixExpoViz,
  'graph-eulerian': EulerianViz,
  'heaps-skew-leftist': LeftistHeapViz,
  'kruskals-algorithm': KruskalMSTViz,
};

export default INTERACTIVE_VIZ;
