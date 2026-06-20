-- 41: split every oversized top-level concept-module (>15 entries) into
-- sub-modules of ~10-15 concepts each, mirroring the system-design pattern
-- from migrations 37 + 39. Each parent module keeps its slug + name; new
-- sub-modules nest under it via `parent_slug`. Reassignment is idempotent
-- (UPDATE-by-slug; rows that no longer exist simply skip).
--
-- A sibling agent is concurrently deleting legacy LC-problem-solution concept
-- files (and DB rows), so this migration is designed to remain correct under
-- ~20% shrinkage: sub-module assignments are by explicit slug list, and the
-- sub-module rows themselves do not depend on any particular child count.
--
-- Modules at the time of this migration:
--   graphs (53), cs-core (38), trees (33), arrays-searching (32),
--   sd-reliability (23) [already nested], foundations (22), dp (22),
--   sd-microservices (20) [already nested], sorting-strings (20),
--   sd-storage (18) [already nested], math (18).
-- We split the seven TOP-LEVEL offenders. The sd-* children of system-design
-- are intentionally left untouched (already nested via migration 39; further
-- nesting would over-complicate the senior-track section).

----------------------------------------------------------------------
-- GRAPHS — 53 concepts -> 6 sub-modules
----------------------------------------------------------------------

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon, parent_slug) VALUES
  ('graphs-traversal',      'Traversal & Topological Order', 'BFS, DFS, iterative stack walks, Kahns algorithm, topo sort, cycle detection.',                          1001, 'GitBranch', 'graphs'),
  ('graphs-shortest-paths', 'Shortest Paths',                'Dijkstra family, Bellman-Ford, Floyd-Warshall, Johnson, A*, 0-1 BFS, DAG shortest path.',                1002, 'Route',     'graphs'),
  ('graphs-mst',            'Minimum Spanning Trees',        'Kruskal, Prim, Borůvka, grid MSTs, Prim-vs-Kruskal tradeoffs.',                                          1003, 'Network',   'graphs'),
  ('graphs-union-find',     'Union-Find & Connectivity',     'DSU variants, rollback, weighted, deep clone, island counts.',                                           1004, 'Boxes',     'graphs'),
  ('graphs-advanced',       'Advanced Structure',            'SCCs, bridges, articulation points, Eulerian paths, 2-SAT, bipartite matching, Mo on trees.',            1005, 'Layers',    'graphs'),
  ('graphs-flow-grids',     'Flow & Grid Problems',          'Max flow, min-cost flow, Dinic, keys-and-locks, shortest bridge, word ladder.',                          1006, 'Activity',  'graphs')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon,
      parent_slug = EXCLUDED.parent_slug;

UPDATE public."PGcode_concepts" SET module_slug = 'graphs-traversal' WHERE slug IN (
  'dfs-iterative','course-schedule-topo','cycle-detection-graph',
  'kahn-cycle-detect','kahns-algorithm','topo-shortest-dag','topological-sort',
  'topological-sort-dfs','graph-shortest-cycle-bfs','zero-one-bfs',
  'graph-bipartite-coloring','bipartite-check'
);

UPDATE public."PGcode_concepts" SET module_slug = 'graphs-shortest-paths' WHERE slug IN (
  'a-star-search','astar-search','bellman-ford','bellman-ford-detection',
  'dijkstra-double-source','dijkstra-fibonacci-heap','dijkstra-no-negative',
  'dijkstra-on-grid','dijkstra-pq','dijkstra-stops','dijkstra-with-path',
  'dijkstras-algorithm','floyd-warshall','graph-floyd-warshall',
  'johnson-all-pairs','graph-network-delay','graph-cheapest-flight-k-stops'
);

UPDATE public."PGcode_concepts" SET module_slug = 'graphs-mst' WHERE slug IN (
  'kruskals-mst','mst-boruvka','mst-kruskal','mst-prim','prim-vs-kruskal','graph-grid-mst'
);

UPDATE public."PGcode_concepts" SET module_slug = 'graphs-union-find' WHERE slug IN (
  'disjoint-set-rank','union-find','union-find-rollback','weighted-union-find',
  'graph-redundant-connection','graph-clone-deep','island-count-bfs'
);

UPDATE public."PGcode_concepts" SET module_slug = 'graphs-advanced' WHERE slug IN (
  'articulation-bridges','graph-bridges-articulation','tarjan-articulation',
  'network-bridge-finding','graph-tarjan-scc','tarjan-scc','strongly-connected',
  'kosaraju-2pass','graph-eulerian','graph-eulerian-path-circuit',
  'two-sat','graph-2sat','bipartite-matching-kuhn','hopcroft-karp',
  'graph-coloring-greedy','mo-on-trees'
);

UPDATE public."PGcode_concepts" SET module_slug = 'graphs-flow-grids' WHERE slug IN (
  'max-flow','min-cost-max-flow','network-flow-dinic',
  'graph-shortest-bridge','graph-shortest-path-keys-locks','word-ladder-bfs'
);

----------------------------------------------------------------------
-- ARRAYS & SEARCHING — 32 concepts -> 3 sub-modules
----------------------------------------------------------------------

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon, parent_slug) VALUES
  ('arrays-binary-search',    'Binary Search & Intervals',   'Vanilla binary search, search-on-answer, ternary search, peak finding, rotated arrays, 2D matrix search, interval merge and sweep line.', 1101, 'Search',   'arrays-searching'),
  ('arrays-pointers-windows', 'Two-Pointer & Window Tricks', 'Two and three pointers, sliding window medians, Dutch flag, cyclic sort, three-reverse rotation.',                                       1102, 'Move',     'arrays-searching'),
  ('arrays-range-structures', 'Range Query Structures',      'Fenwick, segment trees (lazy, beats, persistent, interval, merge), sparse table, sqrt decomposition, 2D prefix.',                        1103, 'Layers',   'arrays-searching'),
  ('arrays-counting-select',  'Counting & Selection',        'Boyer-Moore voting, inversion counting, median of medians, Mos algorithm, coordinate compression, top-k streaming, wavelet trees.',     1104, 'BarChart3','arrays-searching')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon,
      parent_slug = EXCLUDED.parent_slug;

UPDATE public."PGcode_concepts" SET module_slug = 'arrays-binary-search' WHERE slug IN (
  'binary-search','binary-search-on-answer','ternary-search',
  'arrays-find-peak-element','find-peak-element','arrays-find-min-rotated',
  'arrays-search-2d-matrix',
  'arrays-insert-interval','arrays-merge-intervals','interval-merge',
  'intervals-employee-free','sweep-line','arrays-merge-k-sorted-arrays',
  'arrays-product-except-self','arrays-rotate-image'
);

UPDATE public."PGcode_concepts" SET module_slug = 'arrays-pointers-windows' WHERE slug IN (
  'two-pointers','three-pointers','arrays-3sum-smaller',
  'arrays-best-time-buy-sell-stock-ii','arrays-subarray-product-less-than-k',
  'subarray-product-less-k','longest-substr-k-distinct','dutch-national-flag',
  'array-cyclic-sort','array-rotate-three-reverse','find-duplicate-floyd',
  'sliding-window-medians'
);

UPDATE public."PGcode_concepts" SET module_slug = 'arrays-range-structures' WHERE slug IN (
  'fenwick-bit','fenwick-tree','segment-tree-beats','segment-tree-lazy',
  'segment-tree-merge','segment-tree-on-intervals','segment-tree-persistent',
  'persistent-segment-tree','sparse-table','sparse-table-rmq',
  'sqrt-decomposition','range-sum-2d','range-update-range-query'
);

UPDATE public."PGcode_concepts" SET module_slug = 'arrays-counting-select' WHERE slug IN (
  'boyer-moore-majority','boyer-moore-voting-extended',
  'count-inversions-mergesort','counting-inversions',
  'median-of-medians','mo-algorithm','mos-algorithm',
  'coordinate-compress','coordinate-compression',
  'topk-streaming','wavelet-matrix','wavelet-tree'
);

----------------------------------------------------------------------
-- DYNAMIC PROGRAMMING — 22 concepts -> 2 sub-modules
----------------------------------------------------------------------

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon, parent_slug) VALUES
  ('dp-classical',  'Classical DP Patterns',  'Kadane, LIS, knapsack, coin change, edit distance, palindrome partitioning, grid paths, tree DP, recursion vs iteration.',                     1201, 'Hash', 'dp'),
  ('dp-advanced',   'Advanced DP Techniques', 'Bitmask, digit, matrix exponentiation, state compression, Knuth and divide-conquer optimizations, convex hull trick, game theory, meet in the middle.', 1202, 'Cpu',  'dp')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon,
      parent_slug = EXCLUDED.parent_slug;

UPDATE public."PGcode_concepts" SET module_slug = 'dp-classical' WHERE slug IN (
  'dp-recursion-vs-iteration','kadanes-algorithm',
  'longest-increasing-subseq','lis-patience-sorting',
  'dp-russian-doll-envelopes','russian-doll-envelopes',
  'dp-longest-arithmetic-seq',
  'dp-decode-ways','string-decode-ways',
  'dp-house-robber-circle','dp-maximum-product-subarray',
  'dp-paint-fence','paint-house-dp',
  'zero-one-knapsack','dp-knapsack-bounded-unbounded',
  'coin-change-variants','dp-coin-change-min-coins',
  'dp-target-sum',
  'best-stock-multiple-tx','dp-best-time-buy-sell-cooldown',
  'dp-edit-distance-levenshtein','string-edit-distance','edit-distance-allowed-ops','string-edit-trace',
  'dp-distinct-subseq','dp-longest-palindromic-substring',
  'wildcard-matching','dp-word-break',
  'unique-paths-grid','dp-cherry-pickup-grid',
  'dp-interval-mcm','dp-optimal-bst','dp-burst-balloons','palindrome-partition-dp',
  'dp-tree','dp-job-scheduling','egg-dropping-puzzle'
);

UPDATE public."PGcode_concepts" SET module_slug = 'dp-advanced' WHERE slug IN (
  'bit-dp','dp-bitmask','digit-dp','dp-digit',
  'dp-matrix-exponentiation','dp-state-compression',
  'dp-knuth-optimization','divide-conquer-optimization','convex-hull-trick',
  'dp-game-theory','dp-stone-game','meet-in-the-middle',
  'subset-sum-fft','subset-sum-meet-bitset'
);

----------------------------------------------------------------------
-- TREES — 33 concepts -> 3 sub-modules
----------------------------------------------------------------------

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon, parent_slug) VALUES
  ('trees-traversal-bst',       'Traversal & BSTs',                  'BFS/DFS, Morris, iterative walks, vertical/zigzag order, construction from traversals, serialize, validate BST, in-order iterator, LCA in BST, kth smallest, recover BST.', 1301, 'GitBranch', 'trees'),
  ('trees-balanced-disk',       'Balanced & Disk-Friendly Trees',    'AVL, red-black, splay, treap, skip list, B-tree, B+ tree, radix, trie, Merkle Patricia, quadtree.',                                                                            1302, 'Database',  'trees'),
  ('trees-advanced-queries',    'Advanced Tree Queries',             'LCA via binary lifting, Euler tour, heavy-light, centroid decomposition, DSU on tree, rerooting DP, link-cut, segment tree, tree DP, diameter, max path sum.',              1303, 'Layers',    'trees')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon,
      parent_slug = EXCLUDED.parent_slug;

UPDATE public."PGcode_concepts" SET module_slug = 'trees-traversal-bst' WHERE slug IN (
  'bfs-dfs','tree-iterative-traversals','morris-traversal','tree-morris-traversal',
  'binary-tree-zigzag-level','tree-vertical-order-traversal','tree-vertical-traversal',
  'tree-construct-from-traversals','tree-serialize-deserialize','tree-flatten-to-list',
  'tree-right-side-view',
  'validate-bst','tree-recover-bst',
  'kth-smallest-bst','tree-kth-smallest-bst',
  'bst-iterator-inorder','lowest-common-ancestor-bst','tree-lca-bst',
  'tree-cousins-in-binary-tree'
);

UPDATE public."PGcode_concepts" SET module_slug = 'trees-balanced-disk' WHERE slug IN (
  'avl-tree','red-black-tree','splay-tree','treap','treap-randomized-bst',
  'skiplist-concurrent','b-tree','b-tree-classic','b-plus-tree',
  'radix-tree','trie','merkle-patricia-trie','quadtree-spatial'
);

UPDATE public."PGcode_concepts" SET module_slug = 'trees-advanced-queries' WHERE slug IN (
  'binary-lifting-general','binary-lifting-lca','lca-binary-lifting',
  'euler-tour-flatten','euler-tour-tree',
  'heavy-light-decomposition','centroid-decomposition','dsu-on-tree','mst-rerooting',
  'link-cut-tree','dp-on-trees','segment-tree',
  'tree-diameter','tree-max-path-sum','tree-distribute-coins'
);

----------------------------------------------------------------------
-- CS CORE — 38 concepts -> 4 sub-modules
----------------------------------------------------------------------

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon, parent_slug) VALUES
  ('cs-os-concurrency',   'OS & Concurrency',             'Processes, threads, fork vs pthread, schedulers, virtual memory, mmap, epoll/kqueue, priority inversion, locks, CAS, snapshots.',     1401, 'Cpu',      'cs-core'),
  ('cs-db-transactions',  'Databases & Transactions',     'ACID, BASE, isolation levels, indexes, connection pools, snapshot isolation, optimistic/pessimistic locking, 2PL, WAL.',              1402, 'Database', 'cs-core'),
  ('cs-network-protocols','Networking Protocols',         'TCP handshake, congestion control, UDP, QUIC, HTTP/2 vs HTTP/3, TLS 1.3, IP routing.',                                                1403, 'Network',  'cs-core'),
  ('cs-tools-encodings',  'Tools, Encodings & Internals', 'Git internals, merge vs rebase, shell pipes, redirection, Unicode/UTF-8, endianness, compression, vector clocks, CPU cache friendliness.', 1404, 'Terminal', 'cs-core')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon,
      parent_slug = EXCLUDED.parent_slug;

UPDATE public."PGcode_concepts" SET module_slug = 'cs-os-concurrency' WHERE slug IN (
  'process-vs-thread','fork-vs-pthread','scheduler-algorithms','virtual-memory',
  'memory-mmap-vs-read','epoll-kqueue','priority-inversion',
  'cas-lock-free','read-write-lock','optimistic-locking','pessimistic-locking',
  'consistent-snapshot'
);

UPDATE public."PGcode_concepts" SET module_slug = 'cs-db-transactions' WHERE slug IN (
  'acid-transactions','acid-vs-base','database-isolation-levels','snapshot-isolation',
  'db-indexes','database-connection-pool','two-phase-locking','write-ahead-log'
);

UPDATE public."PGcode_concepts" SET module_slug = 'cs-network-protocols' WHERE slug IN (
  'tcp-handshake','tcp-vs-udp','tcp-vs-quic','quic-protocol','slowstart-tcp',
  'http2-multiplex','http2-vs-http3','tls-handshake','ip-vs-domain-routing'
);

UPDATE public."PGcode_concepts" SET module_slug = 'cs-tools-encodings' WHERE slug IN (
  'git-internals-objects','git-merge-vs-rebase',
  'cs-core-shell-redirection-pipes','unix-pipes',
  'unicode-utf8','endianness-explained',
  'compression-gzip-brotli','vector-clocks','cs-core-cpu-cache-friendliness'
);

----------------------------------------------------------------------
-- FOUNDATIONS — 22 concepts -> 2 sub-modules
----------------------------------------------------------------------

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon, parent_slug) VALUES
  ('foundations-analysis',  'Analysis & Principles',  'Master theorem, amortized analysis, SOLID, dependency injection, functors and monads, iterators and iterables.', 1601, 'Sigma', 'foundations'),
  ('foundations-patterns',  'Design Patterns',        'GoF classics — singleton, factory, builder, decorator, observer, strategy, state, visitor, MVC, and friends.',   1602, 'Boxes', 'foundations')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon,
      parent_slug = EXCLUDED.parent_slug;

UPDATE public."PGcode_concepts" SET module_slug = 'foundations-analysis' WHERE slug IN (
  'master-theorem','amortized-analysis','solid-principles','dependency-injection',
  'monad-functor','foundations-iterator-pattern','foundations-iterator-vs-iterable'
);

UPDATE public."PGcode_concepts" SET module_slug = 'foundations-patterns' WHERE slug IN (
  'design-pattern-singleton','design-pattern-factory','design-pattern-builder',
  'design-pattern-decorator','design-pattern-observer','design-pattern-strategy',
  'design-pattern-state','design-pattern-visitor','design-pattern-mvc',
  'design-pattern-command','design-pattern-chain-of-responsibility',
  'design-pattern-flyweight','design-pattern-iterator','design-pattern-mediator',
  'design-pattern-template-method'
);

----------------------------------------------------------------------
-- SORTING & STRINGS — 20 concepts -> 2 sub-modules
----------------------------------------------------------------------

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon, parent_slug) VALUES
  ('strings-matching',    'Pattern Matching',           'KMP, Z-function, Boyer-Moore, rolling hash, Manachers algorithm, regex engines.',                                          1701, 'Search', 'sorting-strings'),
  ('strings-advanced',    'Advanced String Structures', 'Aho-Corasick, suffix arrays, suffix automaton, palindromic tree, deterministic quickselect, minimum window substring.', 1702, 'Layers', 'sorting-strings')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon,
      parent_slug = EXCLUDED.parent_slug;

UPDATE public."PGcode_concepts" SET module_slug = 'strings-matching' WHERE slug IN (
  'kmp','kmp-failure-function',
  'z-algorithm','string-z-function',
  'boyer-moore-string-search','boyer-moore-bad-char',
  'string-hashing','string-rolling-hash',
  'manachers-algorithm','string-manacher',
  'regex-engines','regex-engine-build'
);

UPDATE public."PGcode_concepts" SET module_slug = 'strings-advanced' WHERE slug IN (
  'aho-corasick','aho-corasick-failure',
  'suffix-array','string-suffix-array',
  'suffix-automaton','string-suffix-automaton',
  'palindrome-eertree','quickselect-deterministic','string-min-window-substring'
);

----------------------------------------------------------------------
-- MATH & NUMBER THEORY — 18 concepts -> 2 sub-modules
----------------------------------------------------------------------

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon, parent_slug) VALUES
  ('math-number-theory', 'Number Theory & Algebra',  'GCD, sieve, modular inverse, fast exponentiation, CRT, matrix exponentiation, pigeonhole, FFT, Strassen, LP duality, IEEE floats.', 2001, 'Sigma',   'math'),
  ('math-geom-sampling', 'Geometry & Sampling',      'Convex hull, Quickhull, CORDIC trig, Fisher-Yates shuffle, reservoir and weighted sampling.',                                       2002, 'Compass', 'math')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon,
      parent_slug = EXCLUDED.parent_slug;

UPDATE public."PGcode_concepts" SET module_slug = 'math-number-theory' WHERE slug IN (
  'euclidean-gcd','sieve-of-eratosthenes','math-modular-inverse-fermat',
  'math-pow-fast-exponentiation','chinese-remainder','matrix-exponentiation',
  'pigeonhole-principle','fft-basics','strassen-matrix-mult',
  'lp-duality','floating-point-ieee'
);

UPDATE public."PGcode_concepts" SET module_slug = 'math-geom-sampling' WHERE slug IN (
  'convex-hull','quickhull','cordic-trig',
  'random-shuffle-fisher-yates','reservoir-sampling','random-reservoir-stream',
  'random-weighted-sampling'
);
