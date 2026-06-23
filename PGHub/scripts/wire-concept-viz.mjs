// One-shot wiring of the 40 new concept viz into interactiveViz.js.
// Resolves each concept's REAL frontmatter slug (the registry key ConceptPage
// uses), adds the import if missing, and repoints an existing key or adds a new
// one. Idempotent: re-running makes no further changes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const ivPath = path.join(root, 'src/components/learn/interactiveViz.js');

// [mdFilenameSlug, componentName]
const MANIFEST = [
  ['dp-knuth-optimization', 'KnuthOptViz'],
  ['foundations-iterator-vs-iterable', 'IteratorIterableViz'],
  ['insertion-sort-algorithm', 'InsertionSortViz'],
  ['ip-vs-domain-routing', 'IpDomainRoutingViz'],
  ['jwt-vs-paseto-deep', 'JwtPasetoViz'],
  ['kahn-cycle-detect', 'KahnCycleViz'],
  ['kmp-deep-dive', 'KmpDeepDiveViz'],
  ['kosaraju-2pass', 'Kosaraju2PassViz'],
  ['link-cut-tree', 'LinkCutTreeViz'],
  ['lowest-common-ancestor-bst', 'LcaBstViz'],
  ['online-learning-systems', 'OnlineLearningSystemsViz'],
  ['palindrome-eertree', 'PalindromeEertreeViz'],
  ['permutations-backtrack', 'PermutationsBacktrackViz'],
  ['pigeonhole-principle', 'PigeonholePrincipleViz'],
  ['pipeline-parallel-training', 'PipelineParallelViz'],
  ['power-of-two-choices', 'PowerOfTwoChoicesViz'],
  ['presigned-url', 'PresignedUrlViz'],
  ['prim-vs-kruskal', 'PrimVsKruskalViz'],
  ['priority-inversion', 'PriorityInversionViz'],
  ['priority-queue-array', 'PriorityQueueArrayViz'],
  ['sd-auth-security-pkcs-jws', 'JwsSignatureViz'],
  ['sd-network-grpc-vs-thrift', 'GrpcVsThriftViz'],
  ['sd-reliability-canary-deployment', 'CanaryDeploymentViz'],
  ['sd-storage-replication-lag', 'ReplicationLagViz'],
  ['sd-storage-write-amplification', 'WriteAmplificationViz'],
  ['secrets-rotation', 'SecretsRotationViz'],
  ['selection-sort-algorithm', 'SelectionSortViz'],
  ['serverless-vs-containers', 'ServerlessVsContainersViz'],
  ['service-discovery', 'ServiceDiscoveryViz'],
  ['set-cover-greedy', 'SetCoverGreedyViz'],
  ['subsets-power-set', 'SubsetsPowerSetViz'],
  ['suffix-tree', 'SuffixTreeViz'],
  ['system-design-load-shedding', 'LoadSheddingViz'],
  ['system-design-tail-latency', 'TailLatencyViz'],
  ['t-digest-percentiles', 'TDigestPercentilesViz'],
  ['tarjan-articulation', 'TarjanArticulationViz'],
  ['tcp-congestion-control-deep', 'TcpCongestionControlViz'],
  ['tensor-parallel-training', 'TensorParallelViz'],
  ['three-pointer', 'ThreePointerViz'],
  ['time-series-storage', 'TimeSeriesStorageViz'],
];

// Resolve the concept's real frontmatter slug (falls back to the md filename).
function realSlug(mdName) {
  const p = path.join(root, 'content/concepts', `${mdName}.md`);
  try {
    const txt = fs.readFileSync(p, 'utf8');
    const m = txt.match(/^\s*slug:\s*["']?([a-z0-9-]+)["']?\s*$/m);
    if (m) return m[1];
  } catch { /* no md (e.g. three-pointer maps to three-pointers.md) */ }
  return mdName;
}

let src = fs.readFileSync(ivPath, 'utf8');
const report = { imported: [], repointed: [], added: [], fileMissing: [], skipped: [] };

for (const [mdName, comp] of MANIFEST) {
  const file = path.join(root, 'src/components/learn/viz', `${comp}.jsx`);
  if (!fs.existsSync(file)) { report.fileMissing.push(comp); continue; }

  // resolve slug: try md filename, then a few known aliases
  let slug = realSlug(mdName);
  if (mdName === 'three-pointer') slug = 'three-pointer'; // registry already uses singular

  // 1) ensure import
  if (!new RegExp(`import\\s+${comp}\\s+from`).test(src)) {
    const lastImport = src.lastIndexOf("\nimport ");
    const eol = src.indexOf('\n', lastImport + 1);
    src = src.slice(0, eol + 1) + `import ${comp} from './viz/${comp}';\n` + src.slice(eol + 1);
    report.imported.push(comp);
  }

  // 2) repoint existing key or add new
  const esc = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const m = src.match(new RegExp(`(['"]${esc}['"]\\s*:\\s*)([A-Za-z0-9_]+)(,)`));
  if (m) {
    if (m[2] === comp) { report.skipped.push(slug); continue; }
    src = src.replace(m[0], `${m[1]}${comp}${m[3]}`);
    report.repointed.push(`${slug}: ${m[2]} -> ${comp}`);
  } else {
    const closeIdx = src.indexOf('\n};', src.indexOf('export const INTERACTIVE_VIZ'));
    src = src.slice(0, closeIdx) + `\n  '${slug}': ${comp},` + src.slice(closeIdx);
    report.added.push(slug);
  }
}

fs.writeFileSync(ivPath, src);
console.log(JSON.stringify(report, null, 2));
console.log(`\nimported ${report.imported.length}, repointed ${report.repointed.length}, added ${report.added.length}, skipped ${report.skipped.length}, fileMissing ${report.fileMissing.length}`);
