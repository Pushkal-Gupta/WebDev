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
import BloomVsCuckooViz from './viz/BloomVsCuckooViz';
import BloomCascadeViz from './viz/BloomCascadeViz';
import BloomCardinalityViz from './viz/BloomCardinalityViz';
import DnsPrefetchViz from './viz/DnsPrefetchViz';
import ArticulationBridgesViz from './viz/ArticulationBridgesViz';
import BipartiteMatchingViz from './viz/BipartiteMatchingViz';
import GraphColoringViz from './viz/GraphColoringViz';
import BitCountingViz from './viz/BitCountingViz';
import BitManipulationViz from './viz/BitManipulationViz';
import CoordinateCompressViz from './viz/CoordinateCompressViz';
import BTreeVsLsmViz from './viz/BTreeVsLsmViz';
import BloomFilterVariantsViz from './viz/BloomFilterVariantsViz';
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
import GradientAccumulationViz from './viz/GradientAccumulationViz';
import FeatureStoreViz from './viz/FeatureStoreViz';
import GracefulDegradationViz from './viz/GracefulDegradationViz';
import GraphqlVsRestViz from './viz/GraphqlVsRestViz';
import RenderPipelineViz from './viz/RenderPipelineViz';
import NetworkFlowViz from './viz/NetworkFlowViz';
import ConvexHullViz from './viz/ConvexHullViz';
import McvPatternViz from './viz/McvPatternViz';
import TemplateMethodViz from './viz/TemplateMethodViz';
import MediatorPatternViz from './viz/MediatorPatternViz';
import CordicTrigViz from './viz/CordicTrigViz';
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
import GitObjectsViz from './viz/GitObjectsViz';
import GitMergeRebaseViz from './viz/GitMergeRebaseViz';
import GossipProtocolViz2 from './viz/GossipProtocolViz2';
import ForkVsThreadViz from './viz/ForkVsThreadViz';
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
import SemaphoreMutexViz from './viz/SemaphoreMutexViz';
import ProducerConsumerViz from './viz/ProducerConsumerViz';
import ReadersWritersViz from './viz/ReadersWritersViz';
import OptimisticLockViz from './viz/OptimisticLockViz';
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
import ApiKeyManagementViz from './viz/ApiKeyManagementViz';
import BulkheadPatternViz from './viz/BulkheadPatternViz';
import CdcDebeziumViz from './viz/CdcDebeziumViz';
import DataLakeWarehouseViz from './viz/DataLakeWarehouseViz';
import OAuthJwtViz from './viz/OAuthJwtViz';
import BackpressureStreamsViz from './viz/BackpressureStreamsViz';
import ChaosEngineeringViz from './viz/ChaosEngineeringViz';
import CompressionViz from './viz/CompressionViz';
import ActorModelViz from './viz/ActorModelViz';
import CapTheoremViz from './viz/CapTheoremViz';
import CqrsViz from './viz/CqrsViz';
import CrdtCountersViz from './viz/CrdtCountersViz';
import ApiPaginationViz from './viz/ApiPaginationViz';
import ApiVersioningViz from './viz/ApiVersioningViz';
import BuilderPatternViz from './viz/BuilderPatternViz';
import ChainOfResponsibilityViz from './viz/ChainOfResponsibilityViz';
import CsrfProtectionViz from './viz/CsrfProtectionViz';
import CorsFlowViz from './viz/CorsFlowViz';
import DebounceThrottleViz from './viz/DebounceThrottleViz';
import DependencyInjectionViz from './viz/DependencyInjectionViz';
import DatabaseIndexingViz from './viz/DatabaseIndexingViz';
import DbPartitioningViz from './viz/DbPartitioningViz';
import DatabaseConnectionPoolViz from './viz/DatabaseConnectionPoolViz';
import DbIsolationLevelsViz from './viz/DbIsolationLevelsViz';
import AcidTransactionViz from './viz/AcidTransactionViz';
import ApiGatewayViz from './viz/ApiGatewayViz';
import CdnEdgeCacheViz from './viz/CdnEdgeCacheViz';
import CpuSchedulingViz from './viz/CpuSchedulingViz';
import CircuitBreakerViz from './viz/CircuitBreakerViz';
import BlueGreenDeployViz from './viz/BlueGreenDeployViz';
import GraphBridgesViz from './viz/GraphBridgesViz';
import EulerianPathViz from './viz/EulerianPathViz';
import TarjanSccViz2 from './viz/TarjanSccViz2';
import BipartiteColoringViz from './viz/BipartiteColoringViz';
import ExponentialBackoffViz from './viz/ExponentialBackoffViz';
import FanOutFanInViz from './viz/FanOutFanInViz';
import FeatureFlagsViz from './viz/FeatureFlagsViz';
import FloatingPointViz from './viz/FloatingPointViz';
import TcpHandshakeViz from './viz/TcpHandshakeViz';
import TlsHandshakeViz from './viz/TlsHandshakeViz';
import HttpCachingViz from './viz/HttpCachingViz';
import LoadBalancingViz from './viz/LoadBalancingViz';
import EpollKqueueViz from './viz/EpollKqueueViz';
import DpRecursionVsIterationViz from './viz/DpRecursionVsIterationViz';
import DynamoArchitectureViz from './viz/DynamoArchitectureViz';
import EmbeddingStoreViz from './viz/EmbeddingStoreViz';
import CrdtOrSetViz from './viz/CrdtOrSetViz';
import BuildGraphViz from './viz/BuildGraphViz';
import DijkstraFibHeapViz from './viz/DijkstraFibHeapViz';
import DpLongestArithSeqViz from './viz/DpLongestArithSeqViz';
import EditDistanceViz from './viz/EditDistanceViz';
import DpStateCompressionViz from './viz/DpStateCompressionViz';
import DijkstraWithPathViz from './viz/DijkstraWithPathViz';
import DivideConquerOptViz from './viz/DivideConquerOptViz';
import EventSourcingViz from './viz/EventSourcingViz';
import EventBusViz from './viz/EventBusViz';
import EtagConditionalViz from './viz/EtagConditionalViz';
import EndiannessViz from './viz/EndiannessViz';
import ConsistentSnapshotViz from './viz/ConsistentSnapshotViz';
import CrdtConflictFreeViz from './viz/CrdtConflictFreeViz';
import CacheFriendlinessViz from './viz/CacheFriendlinessViz';
import ShellPipesViz from './viz/ShellPipesViz';
import FlyweightPatternViz from './viz/FlyweightPatternViz';
import VisitorPatternViz from './viz/VisitorPatternViz';
import AcidVsBaseViz from './viz/AcidVsBaseViz';
import CsrfVsCorsViz from './viz/CsrfVsCorsViz';
import CommandPatternViz from './viz/CommandPatternViz';
import SingletonPatternViz from './viz/SingletonPatternViz';
import StatePatternViz from './viz/StatePatternViz';
import IteratorPatternViz from './viz/IteratorPatternViz';
import ObserverPatternViz from './viz/ObserverPatternViz';
import StrategyPatternViz from './viz/StrategyPatternViz';
import DecoratorPatternViz from './viz/DecoratorPatternViz';
import FactoryPatternViz from './viz/FactoryPatternViz';
import DistributedTracingViz from './viz/DistributedTracingViz';
import DnsArchitectureViz from './viz/DnsArchitectureViz';
import DataParallelTrainingViz from './viz/DataParallelTrainingViz';
import CasVsPaxosViz from './viz/CasVsPaxosViz';
import FloydTortoiseHareViz from './viz/FloydTortoiseHareViz';
import WaveletTreeViz from './viz/WaveletTreeViz';
import TreapSplitMergeViz from './viz/TreapSplitMergeViz';
import HopcroftKarpMatchViz from './viz/HopcroftKarpMatchViz';

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
import DutchNationalFlagViz from './viz/DutchNationalFlagViz';
import KadaneViz from './viz/KadaneViz';
import PrefixSumViz from './viz/PrefixSumViz';
import CyclicSortViz from './viz/CyclicSortViz';
import BinarySearchAnswerViz from './viz/BinarySearchAnswerViz';
import ReservoirSamplingViz from './viz/ReservoirSamplingViz';
import MorrisTraversalViz from './viz/MorrisTraversalViz';
import EuclideanGcdViz from './viz/EuclideanGcdViz';
import FastExponentiationViz from './viz/FastExponentiationViz';
import BellmanFordViz from './viz/BellmanFordViz';
import GrpcVsRestViz from './viz/GrpcVsRestViz';
import HeapSortViz from './viz/HeapSortViz';
import HeavyLightDecompositionViz from './viz/HeavyLightDecompositionViz';
import IdempotencyKeyViz from './viz/IdempotencyKeyViz';
import KMPViz from './viz/KMPViz';
import LRUCacheViz from './viz/LRUCacheViz';
import MonotonicStackViz from './viz/MonotonicStackViz';
import NQueensViz from './viz/NQueensViz';
import RadixTreeViz from './viz/RadixTreeViz';
import SegmentTreeLazyViz from './viz/SegmentTreeLazyViz';
import SegmentTreeViz from './viz/SegmentTreeViz';
import SieveOfEratosthenesViz from './viz/SieveOfEratosthenesViz';
import SuffixAutomatonViz from './viz/SuffixAutomatonViz';
import TrieViz from './viz/TrieViz';
import UnionFindViz from './viz/UnionFindViz';
import ZAlgorithmViz from './viz/ZAlgorithmViz';

import KnapsackViz from './viz/KnapsackViz';
import RabinKarpViz from './viz/RabinKarpViz';
import HuffmanViz from './viz/HuffmanViz';
import ManacherViz from './viz/ManacherViz';
import QuickSelectViz from './viz/QuickSelectViz';
import TreapViz from './viz/TreapViz';

import PrimMSTViz from './viz/PrimMSTViz';

import MessageQueueViz from './viz/MessageQueueViz';
import LeaderElectionViz from './viz/LeaderElectionViz';
import HashRingRebalanceViz from './viz/HashRingRebalanceViz';
import ReadReplicaQuorumViz from './viz/ReadReplicaQuorumViz';
import MvccViz from './viz/MvccViz';
import OutboxPatternViz from './viz/OutboxPatternViz';
import KafkaPartitionsViz from './viz/KafkaPartitionsViz';
import KafkaConsumerGroupViz from './viz/KafkaConsumerGroupViz';
import OAuth2FlowsViz from './viz/OAuth2FlowsViz';
import ObservabilityViz from './viz/ObservabilityViz';
import Http2MultiplexViz from './viz/Http2MultiplexViz';
import JwtAnatomyViz from './viz/JwtAnatomyViz';
import MtlsMutualViz from './viz/MtlsMutualViz';
import KafkaExactlyOnceViz from './viz/KafkaExactlyOnceViz';
import Oauth2PkceViz from './viz/Oauth2PkceViz';
import Http3StreamsViz from './viz/Http3StreamsViz';
import KerberosProtocolViz from './viz/KerberosProtocolViz';
import MultipartUploadViz from './viz/MultipartUploadViz';
import PaxosMultiPaxosViz from './viz/PaxosMultiPaxosViz';
import MultiMasterReplicationViz from './viz/MultiMasterReplicationViz';
import MigrationZeroDowntimeViz from './viz/MigrationZeroDowntimeViz';
import PacelcTheoremViz from './viz/PacelcTheoremViz';
import PbftByzantineViz from './viz/PbftByzantineViz';
import MerklePatriciaTrieViz from './viz/MerklePatriciaTrieViz';
import ObservabilitySloViz from './viz/ObservabilitySloViz';
import Oauth2DeviceCodeViz from './viz/Oauth2DeviceCodeViz';
import ObservabilityOtelViz from './viz/ObservabilityOtelViz';
import Oauth2RefreshTokenViz from './viz/Oauth2RefreshTokenViz';
import MaterializedViewMaintenanceViz from './viz/MaterializedViewMaintenanceViz';
import NosqlVsSqlViz from './viz/NosqlVsSqlViz';
import TcpVsUdpViz from './viz/TcpVsUdpViz';
import TcpVsQuicViz from './viz/TcpVsQuicViz';
import Http2Vs3Viz from './viz/Http2Vs3Viz';
import Tls13HandshakeDeepViz from './viz/Tls13HandshakeDeepViz';
import MetricsLogsTracesViz from './viz/MetricsLogsTracesViz';
import MicroservicesVsMonolithViz from './viz/MicroservicesVsMonolithViz';
import HotWarmColdStorageViz from './viz/HotWarmColdStorageViz';
import MvccDeepDiveViz from './viz/MvccDeepDiveViz';
import VirtualDomDiffViz from './viz/VirtualDomDiffViz';
import FiberReconcilerViz from './viz/FiberReconcilerViz';
import ServiceWorkerPwaViz from './viz/ServiceWorkerPwaViz';
import RenderModelsViz from './viz/RenderModelsViz';

export const INTERACTIVE_VIZ = {
  'tcp-vs-udp': TcpVsUdpViz,
  'tcp-vs-quic': TcpVsQuicViz,
  'http2-vs-http3': Http2Vs3Viz,
  'tls13-handshake-deep': Tls13HandshakeDeepViz,
  'metrics-vs-logs-vs-traces': MetricsLogsTracesViz,
  'microservices-vs-monolith': MicroservicesVsMonolithViz,
  'hot-warm-cold-storage': HotWarmColdStorageViz,
  'mvcc-deep-dive': MvccDeepDiveViz,
  'virtual-dom-internals': VirtualDomDiffViz,
  'react-fiber-reconciler': FiberReconcilerViz,
  'service-worker-pwa': ServiceWorkerPwaViz,
  'rsc-vs-ssr-vs-csr': RenderModelsViz,
  'message-queues': MessageQueueViz,
  'leader-election-patterns': LeaderElectionViz,
  'hash-ring-rebalance': HashRingRebalanceViz,
  'read-replica-quorum': ReadReplicaQuorumViz,
  'mvcc': MvccViz,
  'outbox-pattern': OutboxPatternViz,
  'kafka-partitions': KafkaPartitionsViz,
  'kafka-consumer-group': KafkaConsumerGroupViz,
  'oauth2-flows': OAuth2FlowsViz,
  'observability': ObservabilityViz,
  'http2-multiplex': Http2MultiplexViz,
  'jwt-anatomy': JwtAnatomyViz,
  'mtls-mutual': MtlsMutualViz,
  'kafka-exactly-once': KafkaExactlyOnceViz,
  'oauth2-pkce': Oauth2PkceViz,
  'http3-streams-and-multiplexing': Http3StreamsViz,
  'kerberos-protocol': KerberosProtocolViz,
  'multipart-upload': MultipartUploadViz,
  'paxos-multi-paxos': PaxosMultiPaxosViz,
  'multi-master-replication': MultiMasterReplicationViz,
  'migration-zero-downtime': MigrationZeroDowntimeViz,
  'pacelc-theorem': PacelcTheoremViz,
  'pbft-byzantine-tolerance': PbftByzantineViz,
  'merkle-patricia-trie': MerklePatriciaTrieViz,
  'observability-slo': ObservabilitySloViz,
  'oauth2-device-code': Oauth2DeviceCodeViz,
  'observability-otel': ObservabilityOtelViz,
  'oauth2-refresh-token': Oauth2RefreshTokenViz,
  'materialized-view-maintenance': MaterializedViewMaintenanceViz,
  'nosql-vs-sql': NosqlVsSqlViz,
  'next-greater-element': MonotonicStackViz,
  'mst-kruskal': KruskalMSTViz,
  'kruskals-mst': KruskalMSTViz,
  'mst-prim': PrimMSTViz,
  'dutch-national-flag': DutchNationalFlagViz,
  'kadanes-algorithm': KadaneViz,
  'prefix-sum': PrefixSumViz,
  'array-cyclic-sort': CyclicSortViz,
  'binary-search-on-answer': BinarySearchAnswerViz,
  'reservoir-sampling': ReservoirSamplingViz,
  'morris-traversal': MorrisTraversalViz,
  'euclidean-gcd': EuclideanGcdViz,
  'math-pow-fast-exponentiation': FastExponentiationViz,
  'bellman-ford-detection': BellmanFordViz,
  'dijkstra-double-source': DijkstraViz,
  'dijkstra-no-negative': DijkstraViz,
  'dijkstra-stops': DijkstraViz,
  'dp-edit-distance-levenshtein': EditDistanceViz,
  'dp-knapsack-bounded-unbounded': KnapsackViz,
  'euler-tour-tree': EulerTourViz,
  'feature-store-ml': FeatureStoreViz,
  'foundations-iterator-pattern': IteratorPatternViz,
  'hash-rolling-rabin-karp': RabinKarpViz,
  'heap-sort-algorithm': HeapSortViz,
  'huffman-canonical': HuffmanViz,
  'huffman-coding': HuffmanViz,
  'idempotency': IdempotencyKeyViz,
  'load-balancing-strategies': LoadBalancingViz,
  'lsm-tree-internals': LSMTreeViz,
  'manachers-algorithm': ManacherViz,
  'matrix-exponentiation': MatrixExpoViz,
  'n-queens-backtrack': NQueensViz,
  'quickselect-deterministic': QuickSelectViz,
  'rate-limit-leaky-bucket': LeakyBucketViz,
  'rate-limiter-token-bucket': RateLimiterViz,
  'red-black-tree-properties': RedBlackTreeViz,
  'sd-microservices-circuit-breaker-states': CircuitBreakerViz,
  'sd-storage-acid-vs-base': AcidVsBaseViz,
  'segment-tree-beats': SegmentTreeViz,
  'segment-tree-merge': SegmentTreeViz,
  'segment-tree-on-intervals': SegmentTreeViz,
  'segment-tree-persistent': SegmentTreeViz,
  'sharding': DatabaseShardingViz,
  'skiplist-concurrent': SkipListViz,
  'sliding-window-medians': SlidingWindowViz,
  'string-manacher': ManacherViz,
  'string-suffix-automaton': SuffixAutomatonViz,
  'suffix-automaton-applications': SuffixAutomatonViz,
  'tarjan-scc-algorithm': TarjanSCCViz,
  'treap-implicit-key': TreapViz,
  'treap-randomized-bst': TreapViz,
  'union-find-data-structure': UnionFindViz,
  'union-find-rollback': UnionFindViz,
  'vector-clock': VectorClocksViz,
  'weighted-union-find': UnionFindViz,
  'zero-one-knapsack': KnapsackViz,
  'paxos': CasVsPaxosViz,
  'coordinate-compression': CoordinateCompressViz,
  'boyer-moore-string-search': BoyerMooreBadCharViz,
  'boyer-moore-majority': BoyerMooreVotingViz,
  'bipartite-check': BipartiteColoringViz,
  'disjoint-set-rank': UnionFindViz,
  'a-star-search': AStarSearchViz,
  'aho-corasick': AhoCorasickViz,
  'bellman-ford': BellmanFordViz,
  'bloom-filter': BloomFilterViz,
  'digit-dp': DigitDPViz,
  'fenwick-tree': FenwickTreeViz,
  'floyd-warshall': FloydWarshallViz,
  'grpc-vs-rest': GrpcVsRestViz,
  'heap-sort': HeapSortViz,
  'heavy-light-decomposition': HeavyLightDecompositionViz,
  'idempotency-key': IdempotencyKeyViz,
  'interval-scheduling': IntervalSchedulingViz,
  'kmp': KMPViz,
  'lru-cache': LRUCacheViz,
  'monotonic-stack': MonotonicStackViz,
  'n-queens': NQueensViz,
  'radix-tree': RadixTreeViz,
  'segment-tree-lazy': SegmentTreeLazyViz,
  'segment-tree': SegmentTreeViz,
  'sieve-of-eratosthenes': SieveOfEratosthenesViz,
  'suffix-automaton': SuffixAutomatonViz,
  'trie': TrieViz,
  'two-sat': TwoSatViz,
  'union-find': UnionFindViz,
  'z-algorithm': ZAlgorithmViz,
  'floyd-cycle-detection': FloydTortoiseHareViz,
  'wavelet-tree': WaveletTreeViz,
  'treap': TreapSplitMergeViz,
  'hopcroft-karp': HopcroftKarpMatchViz,
  'avl-tree': AVLRotationViz,
  'b-tree-classic': BTreeInsertViz,
  'bplus-tree-internals': BPlusTreeViz,
  'caching': HttpCachingViz,
  'graph-bridges-articulation': GraphBridgesViz,
  'graph-eulerian-path-circuit': EulerianPathViz,
  'graph-tarjan-scc': TarjanSccViz2,
  'graph-bipartite-coloring': BipartiteColoringViz,
  'exponential-backoff-jitter': ExponentialBackoffViz,
  'fan-out-fan-in': FanOutFanInViz,
  'feature-flags': FeatureFlagsViz,
  'floating-point-ieee': FloatingPointViz,
  'tcp-handshake': TcpHandshakeViz,
  'tls-handshake': TlsHandshakeViz,
  'load-balancing': LoadBalancingViz,
  'consistent-hash-jump': ConsistentHashingViz,
  'epoll-kqueue': EpollKqueueViz,
  'dp-recursion-vs-iteration': DpRecursionVsIterationViz,
  'dynamo-paper-architecture': DynamoArchitectureViz,
  'embedding-store-design': EmbeddingStoreViz,
  'crdt-or-set': CrdtOrSetViz,
  'build-graph-vite-vs-webpack': BuildGraphViz,
  'dijkstra-fibonacci-heap': DijkstraFibHeapViz,
  'dp-longest-arithmetic-seq': DpLongestArithSeqViz,
  'edit-distance-algorithm': EditDistanceViz,
  'dp-state-compression': DpStateCompressionViz,
  'dijkstra-with-path': DijkstraWithPathViz,
  'divide-conquer-optimization': DivideConquerOptViz,
  'event-sourcing': EventSourcingViz,
  'event-bus-design': EventBusViz,
  'etag-conditional': EtagConditionalViz,
  'endianness-explained': EndiannessViz,
  'consistent-snapshot': ConsistentSnapshotViz,
  'crdt-conflict-free': CrdtConflictFreeViz,
  'cs-core-cpu-cache-friendliness': CacheFriendlinessViz,
  'cs-core-shell-redirection-pipes': ShellPipesViz,
  'design-pattern-flyweight': FlyweightPatternViz,
  'design-pattern-visitor': VisitorPatternViz,
  'acid-vs-base': AcidVsBaseViz,
  'csrf-vs-cors-deep': CsrfVsCorsViz,
  'design-pattern-command': CommandPatternViz,
  'design-pattern-singleton': SingletonPatternViz,
  'design-pattern-state': StatePatternViz,
  'design-pattern-iterator': IteratorPatternViz,
  'design-pattern-observer': ObserverPatternViz,
  'design-pattern-strategy': StrategyPatternViz,
  'design-pattern-decorator': DecoratorPatternViz,
  'design-pattern-factory': FactoryPatternViz,
  'distributed-tracing': DistributedTracingViz,
  'dns-architecture': DnsArchitectureViz,
  'data-parallel-training': DataParallelTrainingViz,
  'cas-vs-paxos': CasVsPaxosViz,
  'api-key-management': ApiKeyManagementViz,
  'bulkhead-pattern': BulkheadPatternViz,
  'cdc-debezium': CdcDebeziumViz,
  'data-lake-warehouse': DataLakeWarehouseViz,
  'auth-oauth-jwt': OAuthJwtViz,
  'backpressure-streams': BackpressureStreamsViz,
  'chaos-engineering': ChaosEngineeringViz,
  'compression-gzip-brotli': CompressionViz,
  'actor-model': ActorModelViz,
  'cap-theorem': CapTheoremViz,
  'cqrs': CqrsViz,
  'cqrs-pattern': CqrsViz,
  'crdt-counters-and-sets': CrdtCountersViz,
  'api-pagination': ApiPaginationViz,
  'api-versioning': ApiVersioningViz,
  'design-pattern-builder': BuilderPatternViz,
  'design-pattern-chain-of-responsibility': ChainOfResponsibilityViz,
  'csrf-protection': CsrfProtectionViz,
  'cors-explained': CorsFlowViz,
  'debounce-vs-throttle': DebounceThrottleViz,
  'dependency-injection': DependencyInjectionViz,
  'database-indexing': DatabaseIndexingViz,
  'db-indexes': DatabaseIndexingViz,
  'db-partitioning-strategies': DbPartitioningViz,
  'database-connection-pool': DatabaseConnectionPoolViz,
  'database-isolation-levels': DbIsolationLevelsViz,
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
  'bloom-vs-cuckoo': BloomVsCuckooViz,
  'bloom-filter-cascade': BloomCascadeViz,
  'bloom-cardinality-tradeoff': BloomCardinalityViz,
  'dns-prefetch': DnsPrefetchViz,
  'articulation-bridges': ArticulationBridgesViz,
  'bipartite-matching-kuhn': BipartiteMatchingViz,
  'graph-coloring-greedy': GraphColoringViz,

  'bit-counting-tricks': BitCountingViz,
  'bitwise-bit-manipulation-tricks': BitManipulationViz,
  'coordinate-compress': CoordinateCompressViz,
  'b-tree-vs-lsm-tree': BTreeVsLsmViz,
  'bloom-filter-variants': BloomFilterVariantsViz,
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
  'gradient-accumulation': GradientAccumulationViz,
  'feature-store-online-offline': FeatureStoreViz,
  'graceful-degradation': GracefulDegradationViz,
  'graphql-vs-rest': GraphqlVsRestViz,
  'browser-rendering-pipeline': RenderPipelineViz,

  'max-flow': NetworkFlowViz,
  'network-flow-dinic': NetworkFlowViz,

  'convex-hull': ConvexHullViz,
  'quickhull': ConvexHullViz,

  'design-pattern-mvc': McvPatternViz,
  'design-pattern-template-method': TemplateMethodViz,
  'design-pattern-mediator': MediatorPatternViz,
  'cordic-trig': CordicTrigViz,

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
  'git-internals-objects': GitObjectsViz,
  'git-merge-vs-rebase': GitMergeRebaseViz,
  'gossip-protocols': GossipProtocolViz2,
  'fork-vs-pthread': ForkVsThreadViz,

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
  'mutex-semaphore-condvar': SemaphoreMutexViz,
  'pessimistic-locking': ProducerConsumerViz,
  'read-write-lock': ReadersWritersViz,
  'optimistic-locking': OptimisticLockViz,
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
