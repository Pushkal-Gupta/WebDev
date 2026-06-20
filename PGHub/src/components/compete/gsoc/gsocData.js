export const GSOC_CATEGORIES = ['AI/ML', 'Systems', 'Web', 'Graphics', 'Data', 'Cloud', 'Languages', 'Science'];

export const GSOC_TIMELINE = [
  { phase: 'Org applications', window: 'Jan – Feb', detail: 'Mentoring organizations apply and publish their idea lists.' },
  { phase: 'Proposal window', window: 'Mar – Apr', detail: 'Contributors draft and submit project proposals to chosen orgs.' },
  { phase: 'Community bonding', window: 'May', detail: 'Accepted contributors meet mentors, set up tooling, and scope milestones.' },
  { phase: 'Coding phase 1', window: 'Jun – Jul', detail: 'First half of the build — early deliverables and a midterm checkpoint.' },
  { phase: 'Midterm review', window: 'Jul', detail: 'Mentors evaluate progress; passing contributors continue funded work.' },
  { phase: 'Final submission', window: 'Aug – Sep', detail: 'Code freeze, final evaluation, and merged contributions land upstream.' },
];

export const GSOC_ORGS = [
  {
    name: 'CERN-HSF', slug: 'cern-hsf', category: 'Science', tech: ['C++', 'Python', 'ROOT'],
    yearsParticipated: 11, projectsCount: 34, difficulty: 'Advanced',
    blurb: 'High-energy physics software collaboration spanning detector simulation, data analysis, and machine learning for particle research.',
    sampleIdeas: [
      { title: 'Accelerated histogram filling in ROOT', summary: 'Vectorize the core fill loop and benchmark against the existing scalar path.' },
      { title: 'Differentiable detector simulation', summary: 'Prototype gradient propagation through a simplified calorimeter model.' },
    ],
  },
  {
    name: 'Python Software Foundation', slug: 'psf', category: 'Languages', tech: ['Python', 'C', 'CPython'],
    yearsParticipated: 18, projectsCount: 52, difficulty: 'Intermediate',
    blurb: 'Stewards the Python language and a wide umbrella of sub-orgs covering packaging, scientific computing, and developer tooling.',
    sampleIdeas: [
      { title: 'Faster pure-Python decimal paths', summary: 'Profile hot arithmetic routines and trim allocations without breaking the C fallback.' },
      { title: 'Type-checker diagnostics', summary: 'Improve error messages for common generic-inference failures.' },
    ],
  },
  {
    name: 'Apache Software Foundation', slug: 'apache', category: 'Cloud', tech: ['Java', 'Scala', 'Go'],
    yearsParticipated: 16, projectsCount: 60, difficulty: 'Advanced',
    blurb: 'Hundreds of top-level projects across data, messaging, and web infrastructure powering a large share of the open internet.',
    sampleIdeas: [
      { title: 'Kafka consumer rebalance tracing', summary: 'Add structured spans around partition reassignment to expose stalls.' },
      { title: 'Spark adaptive shuffle metrics', summary: 'Surface skew detection counters in the live UI.' },
    ],
  },
  {
    name: 'Mozilla', slug: 'mozilla', category: 'Web', tech: ['Rust', 'JavaScript', 'C++'],
    yearsParticipated: 14, projectsCount: 28, difficulty: 'Intermediate',
    blurb: 'Browser engine, web standards, and privacy tooling built in the open, with a strong push toward memory-safe systems code.',
    sampleIdeas: [
      { title: 'DevTools network throttling presets', summary: 'Ship configurable profiles and persist them across sessions.' },
      { title: 'WebExtension storage quotas', summary: 'Add per-origin usage reporting to the extension API.' },
    ],
  },
  {
    name: 'Django', slug: 'django', category: 'Web', tech: ['Python', 'SQL', 'JavaScript'],
    yearsParticipated: 13, projectsCount: 22, difficulty: 'Beginner',
    blurb: 'The batteries-included Python web framework, with focus areas in the ORM, async views, and the admin interface.',
    sampleIdeas: [
      { title: 'Async-native ORM helpers', summary: 'Extend queryset methods that still block under the async stack.' },
      { title: 'Admin bulk-action UX', summary: 'Add confirmation summaries before destructive batch operations.' },
    ],
  },
  {
    name: 'PostgreSQL', slug: 'postgresql', category: 'Data', tech: ['C', 'SQL', 'Perl'],
    yearsParticipated: 12, projectsCount: 19, difficulty: 'Advanced',
    blurb: 'The reference open-source relational database, with work spanning the planner, storage engine, and extension ecosystem.',
    sampleIdeas: [
      { title: 'Planner cardinality hints', summary: 'Expose optional row-count overrides for hard-to-estimate joins.' },
      { title: 'Logical replication metrics', summary: 'Add lag and throughput counters to the replication views.' },
    ],
  },
  {
    name: 'OpenCV', slug: 'opencv', category: 'Graphics', tech: ['C++', 'Python', 'CUDA'],
    yearsParticipated: 13, projectsCount: 30, difficulty: 'Intermediate',
    blurb: 'The most widely used computer-vision library, covering classical image processing through modern deep-learning inference.',
    sampleIdeas: [
      { title: 'GPU path for feature matching', summary: 'Port a CPU descriptor matcher to a batched CUDA kernel.' },
      { title: 'ONNX op coverage', summary: 'Close gaps in the DNN module against a target model zoo.' },
    ],
  },
  {
    name: 'TensorFlow', slug: 'tensorflow', category: 'AI/ML', tech: ['Python', 'C++', 'XLA'],
    yearsParticipated: 8, projectsCount: 24, difficulty: 'Advanced',
    blurb: 'End-to-end machine-learning platform with project space across the compiler stack, model garden, and on-device runtimes.',
    sampleIdeas: [
      { title: 'XLA fusion diagnostics', summary: 'Produce a readable report of why two ops did or did not fuse.' },
      { title: 'Lite quantization presets', summary: 'Add one-line recipes for common int8 export targets.' },
    ],
  },
  {
    name: 'Red Hat', slug: 'red-hat', category: 'Systems', tech: ['C', 'Go', 'Python'],
    yearsParticipated: 12, projectsCount: 26, difficulty: 'Advanced',
    blurb: 'Enterprise Linux, container tooling, and systems daemons, with deep work in the kernel-adjacent userspace stack.',
    sampleIdeas: [
      { title: 'Podman rootless networking', summary: 'Improve diagnostics when slirp paths fail to initialize.' },
      { title: 'systemd unit linting', summary: 'Catch common misconfigurations before activation.' },
    ],
  },
  {
    name: 'GNOME', slug: 'gnome', category: 'Graphics', tech: ['C', 'Vala', 'GTK'],
    yearsParticipated: 17, projectsCount: 31, difficulty: 'Beginner',
    blurb: 'A complete free desktop environment, with approachable project space across apps, the shell, and accessibility tooling.',
    sampleIdeas: [
      { title: 'Settings search relevance', summary: 'Rank results by usage and synonyms instead of raw substring match.' },
      { title: 'Screen-reader caret tracking', summary: 'Smooth focus following in long text views.' },
    ],
  },
  {
    name: 'KDE', slug: 'kde', category: 'Graphics', tech: ['C++', 'Qt', 'QML'],
    yearsParticipated: 17, projectsCount: 29, difficulty: 'Intermediate',
    blurb: 'A sprawling Qt-based desktop and application suite, from the Plasma shell to creative tools like Krita.',
    sampleIdeas: [
      { title: 'Plasma panel layout presets', summary: 'Let users save and switch full panel arrangements.' },
      { title: 'Krita brush-engine profiling', summary: 'Find and trim stalls in large-canvas strokes.' },
    ],
  },
  {
    name: 'The Rust Foundation', slug: 'rust', category: 'Languages', tech: ['Rust', 'LLVM', 'C'],
    yearsParticipated: 6, projectsCount: 18, difficulty: 'Advanced',
    blurb: 'A memory-safe systems language with compiler, tooling, and ecosystem project space for ambitious contributors.',
    sampleIdeas: [
      { title: 'Cargo build-graph visualizer', summary: 'Emit a dependency timeline to explain slow cold builds.' },
      { title: 'Borrow-checker error hints', summary: 'Suggest minimal lifetime annotations for common failures.' },
    ],
  },
  {
    name: 'LLVM', slug: 'llvm', category: 'Languages', tech: ['C++', 'LLVM IR', 'Python'],
    yearsParticipated: 13, projectsCount: 27, difficulty: 'Advanced',
    blurb: 'The compiler infrastructure behind Clang, Swift, and Rust, with project space in optimization passes and tooling.',
    sampleIdeas: [
      { title: 'Pass-pipeline introspection', summary: 'Dump per-pass IR diffs in a navigable format.' },
      { title: 'clang-tidy autofix coverage', summary: 'Add fixes for a batch of currently diagnostic-only checks.' },
    ],
  },
  {
    name: 'CNCF / Kubernetes', slug: 'cncf', category: 'Cloud', tech: ['Go', 'YAML', 'gRPC'],
    yearsParticipated: 9, projectsCount: 40, difficulty: 'Advanced',
    blurb: 'Cloud-native orchestration and the surrounding observability and networking ecosystem under one umbrella.',
    sampleIdeas: [
      { title: 'Scheduler trace replay', summary: 'Replay recorded scheduling decisions to debug placement.' },
      { title: 'CRD validation messages', summary: 'Turn schema rejections into actionable field-level hints.' },
    ],
  },
  {
    name: 'Wikimedia Foundation', slug: 'wikimedia', category: 'Web', tech: ['PHP', 'JavaScript', 'Lua'],
    yearsParticipated: 15, projectsCount: 25, difficulty: 'Beginner',
    blurb: 'The platform behind Wikipedia and its sister projects, with work in editing tools, search, and content APIs.',
    sampleIdeas: [
      { title: 'Edit-conflict resolution UX', summary: 'Show a clearer three-way merge for overlapping edits.' },
      { title: 'Citation gap detector', summary: 'Flag unsourced statements during editing.' },
    ],
  },
  {
    name: 'Blender', slug: 'blender', category: 'Graphics', tech: ['C', 'C++', 'Python'],
    yearsParticipated: 14, projectsCount: 23, difficulty: 'Advanced',
    blurb: 'A full 3D creation suite covering modeling, animation, and the Cycles and EEVEE render engines.',
    sampleIdeas: [
      { title: 'Sculpt-mode performance', summary: 'Reduce latency on multi-million-vertex meshes.' },
      { title: 'Geometry-nodes presets', summary: 'Ship a starter library of reusable node groups.' },
    ],
  },
  {
    name: 'Godot Engine', slug: 'godot', category: 'Graphics', tech: ['C++', 'GDScript', 'GLSL'],
    yearsParticipated: 7, projectsCount: 21, difficulty: 'Intermediate',
    blurb: 'A free game engine with a tight editor-runtime loop and project space across rendering, physics, and tooling.',
    sampleIdeas: [
      { title: 'Shader-graph live preview', summary: 'Render node output thumbnails inline as the graph changes.' },
      { title: 'Profiler frame drill-down', summary: 'Attribute spikes to specific nodes and scripts.' },
    ],
  },
  {
    name: 'The Julia Language', slug: 'julia', category: 'Science', tech: ['Julia', 'LLVM', 'C'],
    yearsParticipated: 10, projectsCount: 26, difficulty: 'Intermediate',
    blurb: 'A high-performance language for technical computing, strong in numerical methods and differentiable programming.',
    sampleIdeas: [
      { title: 'Sparse-array kernel tuning', summary: 'Specialize hot paths for common sparsity patterns.' },
      { title: 'Autodiff edge cases', summary: 'Close gaps where reverse-mode silently returns wrong gradients.' },
    ],
  },
  {
    name: 'Zephyr Project', slug: 'zephyr', category: 'Systems', tech: ['C', 'Kconfig', 'Devicetree'],
    yearsParticipated: 6, projectsCount: 17, difficulty: 'Advanced',
    blurb: 'A small real-time OS for resource-constrained devices, with project space in drivers, networking, and power management.',
    sampleIdeas: [
      { title: 'Power-state tracing', summary: 'Log transitions to debug unexpected wakeups.' },
      { title: 'Sensor driver template', summary: 'Generate a compliant skeleton from a datasheet spec.' },
    ],
  },
  {
    name: 'Eclipse Foundation', slug: 'eclipse', category: 'Cloud', tech: ['Java', 'Kotlin', 'TypeScript'],
    yearsParticipated: 11, projectsCount: 24, difficulty: 'Intermediate',
    blurb: 'IDE platforms, IoT runtimes, and enterprise Java projects, with a broad surface for tooling contributions.',
    sampleIdeas: [
      { title: 'Language-server reconnect', summary: 'Recover gracefully when a backend process crashes mid-session.' },
      { title: 'IoT message-routing UI', summary: 'Visualize broker topic flows in real time.' },
    ],
  },
  {
    name: 'FreeBSD', slug: 'freebsd', category: 'Systems', tech: ['C', 'Shell', 'DTrace'],
    yearsParticipated: 16, projectsCount: 20, difficulty: 'Advanced',
    blurb: 'A complete operating system known for its networking stack, filesystems, and clean kernel-userland separation.',
    sampleIdeas: [
      { title: 'DTrace one-liner library', summary: 'Curate and document probes for common diagnostics.' },
      { title: 'Jail networking presets', summary: 'Simplify common isolated-network configurations.' },
    ],
  },
  {
    name: 'Drupal', slug: 'drupal', category: 'Web', tech: ['PHP', 'Twig', 'JavaScript'],
    yearsParticipated: 14, projectsCount: 19, difficulty: 'Beginner',
    blurb: 'A content-management framework powering large publishing sites, with approachable module and theme project space.',
    sampleIdeas: [
      { title: 'Media-library bulk tagging', summary: 'Apply taxonomy terms to many assets at once.' },
      { title: 'Migration dry-run reports', summary: 'Preview row-level outcomes before committing a migration.' },
    ],
  },
  {
    name: 'Scikit-learn', slug: 'scikit-learn', category: 'AI/ML', tech: ['Python', 'Cython', 'NumPy'],
    yearsParticipated: 9, projectsCount: 18, difficulty: 'Intermediate',
    blurb: 'The reference classical-ML toolkit, with project space across estimators, model selection, and performance.',
    sampleIdeas: [
      { title: 'Pipeline introspection', summary: 'Expose intermediate transform outputs without rerunning fit.' },
      { title: 'Cython kernel speedups', summary: 'Profile and tighten a slow distance computation.' },
    ],
  },
  {
    name: 'The Linux Foundation', slug: 'linux-foundation', category: 'Systems', tech: ['C', 'Go', 'Rust'],
    yearsParticipated: 10, projectsCount: 35, difficulty: 'Advanced',
    blurb: 'An umbrella for kernel-adjacent and infrastructure projects spanning networking, security, and observability.',
    sampleIdeas: [
      { title: 'eBPF program explorer', summary: 'Visualize attached programs and their hook points.' },
      { title: 'Tracing overhead audit', summary: 'Measure and document the cost of common probes.' },
    ],
  },
];
