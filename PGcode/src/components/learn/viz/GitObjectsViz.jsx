import React, { useMemo, useState } from 'react';
import { RotateCcw, FilePen, GitCommitHorizontal, Hash } from 'lucide-react';
import './GitObjectsViz.css';

// Git's object model — content-addressed blobs, trees, commits.
//
// Every piece of git state is an immutable object named by the SHA-1 of its
// content. A BLOB is raw file bytes. A TREE lists (name -> blob/tree) for one
// directory. A COMMIT points at one root tree plus its parent commit(s).
//
// The deep idea: identical content -> identical hash -> ONE stored object.
// When you edit one file, only that blob, the trees on the path to it, and a
// new commit are created; every untouched subtree is SHARED with the parent
// snapshot. This viz lets the reader edit a file and watch exactly which
// objects get re-hashed and which are reused, with the commit DAG growing.
//
// Hashes here are a deterministic 7-hex digest of the object's content string
// (FNV-1a, seeded) so the display replays identically — not real SHA-1, but it
// has the property that matters: same content => same id, different => different.

function fnv7(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

// The working tree: a root dir with two subdirs, each holding one file.
// Editing changes a file's content string, which cascades hashes upward.
const FILES = [
  { path: 'src/app.js', dir: 'src', name: 'app.js' },
  { path: 'src/util.js', dir: 'src', name: 'util.js' },
  { path: 'docs/readme.md', dir: 'docs', name: 'readme.md' },
];

const BASE_CONTENT = {
  'src/app.js': 'main()',
  'src/util.js': 'helpers',
  'docs/readme.md': '# project',
};

function buildSnapshot(content, commitMsg, parentId) {
  // blobs: one per file
  const blobs = FILES.map((f) => ({
    key: f.path,
    name: f.name,
    dir: f.dir,
    body: content[f.path],
    id: fnv7(`blob:${content[f.path]}`),
  }));

  // trees: one per directory, content = sorted (name -> blobId)
  const dirs = [...new Set(FILES.map((f) => f.dir))];
  const subTrees = dirs.map((d) => {
    const entries = blobs.filter((b) => b.dir === d);
    const tcontent = entries.map((b) => `${b.name}:${b.id}`).sort().join('|');
    return { dir: d, entries, id: fnv7(`tree:${tcontent}`), tcontent };
  });

  // root tree references the sub-trees
  const rootContent = subTrees.map((t) => `${t.dir}:${t.id}`).sort().join('|');
  const rootTree = { dir: '/', subTrees, id: fnv7(`tree:${rootContent}`) };

  const commitId = fnv7(`commit:${rootTree.id}:${parentId || 'root'}:${commitMsg}`);
  return {
    blobs,
    subTrees,
    rootTree,
    commit: { id: commitId, tree: rootTree.id, parent: parentId, msg: commitMsg },
  };
}

const EDIT_VARIANTS = {
  'src/app.js': 'main(); log()',
  'src/util.js': 'helpers v2',
  'docs/readme.md': '# project (v2)',
};

export default function GitObjectsViz() {
  // committed history: list of { content, snapshot }
  const initial = useMemo(() => {
    const snap = buildSnapshot(BASE_CONTENT, 'initial commit', null);
    return [{ content: BASE_CONTENT, snapshot: snap }];
  }, []);

  const [history, setHistory] = useState(initial);
  const [editPath, setEditPath] = useState('src/app.js');

  const head = history[history.length - 1];

  // The pending working-tree state if the chosen file is edited.
  const draft = useMemo(() => {
    const content = { ...head.content, [editPath]: EDIT_VARIANTS[editPath] };
    return { content, snapshot: buildSnapshot(content, `edit ${editPath}`, head.snapshot.commit.id) };
  }, [head, editPath]);

  // Which objects in the draft are NEW vs SHARED with HEAD's snapshot.
  const reuse = useMemo(() => {
    const headIds = new Set();
    head.snapshot.blobs.forEach((b) => headIds.add(b.id));
    head.snapshot.subTrees.forEach((t) => headIds.add(t.id));
    headIds.add(head.snapshot.rootTree.id);
    headIds.add(head.snapshot.commit.id);

    const blobChanged = draft.snapshot.blobs.filter((b) => !headIds.has(b.id)).map((b) => b.key);
    const treeChanged = draft.snapshot.subTrees.filter((t) => !headIds.has(t.id)).map((t) => t.dir);
    const treeShared = draft.snapshot.subTrees.filter((t) => headIds.has(t.id)).map((t) => t.dir);
    const rootChanged = !headIds.has(draft.snapshot.rootTree.id);
    const newCount = 1 + (rootChanged ? 1 : 0) + treeChanged.length + blobChanged.length;
    const sharedCount = treeShared.length + (FILES.length - blobChanged.length);
    return { headIds, blobChanged, treeChanged, treeShared, rootChanged, newCount, sharedCount };
  }, [head, draft]);

  const commit = () => {
    setHistory((h) => [...h, draft]);
  };
  const reset = () => setHistory(initial);

  // ---- SVG layout ----
  const W = 940;
  const H = 430;

  // Object graph (left): commit -> root tree -> sub trees -> blobs, columns.
  const colX = { commit: 95, root: 250, tree: 430, blob: 640 };
  const snap = draft.snapshot; // show the DRAFT so reader sees new/shared
  const treeY = (i) => 95 + i * 120;
  const blobY = (i) => 70 + i * 95;

  const isNewBlob = (key) => reuse.blobChanged.includes(key);
  const isNewTree = (dir) => reuse.treeChanged.includes(dir);

  // DAG (bottom strip): committed history left->right + the pending draft node.
  const dagY = H - 34;
  const dagX0 = 60;
  const dagGap = 150;
  const dagNodes = history.map((h, i) => ({ id: h.snapshot.commit.id, msg: h.snapshot.commit.msg, x: dagX0 + i * dagGap, pending: false }));
  const pendingX = dagX0 + history.length * dagGap;

  const blobOf = (key) => snap.blobs.find((b) => b.key === key);
  const treeOf = (dir) => snap.subTrees.find((t) => t.dir === dir);

  return (
    <div className="gov">
      <div className="gov-head">
        <h3 className="gov-title">Git objects — blobs, trees, commits, content-addressed by hash</h3>
        <p className="gov-sub">
          Edit a file and watch git re-hash only the changed blob, the trees on its path, and a new commit —
          every untouched subtree is shared with the parent snapshot.
        </p>
      </div>

      <div className="gov-controls">
        <div className="gov-pick" role="group" aria-label="file to edit">
          <span className="gov-input-label">edit file</span>
          {FILES.map((f) => (
            <button
              key={f.path}
              type="button"
              className={`gov-chip ${editPath === f.path ? 'is-on' : ''}`}
              onClick={() => setEditPath(f.path)}
            >
              {f.path}
            </button>
          ))}
        </div>

        <span className="gov-spacer" aria-hidden="true" />

        <div className="gov-buttons">
          <button type="button" className="gov-btn gov-btn-primary" onClick={commit}>
            <GitCommitHorizontal size={14} /> Commit edit
          </button>
          <button type="button" className="gov-btn" onClick={reset} disabled={history.length === 1}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="gov-stepcount">
          commits <strong>{history.length}</strong>
        </div>
      </div>

      <div className="gov-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gov-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="gov-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
          </defs>

          <text x={colX.commit - 30} y={28} className="gov-col-label">commit</text>
          <text x={colX.root - 36} y={28} className="gov-col-label">root tree</text>
          <text x={colX.tree - 30} y={28} className="gov-col-label">trees (dirs)</text>
          <text x={colX.blob - 30} y={28} className="gov-col-label">blobs (files)</text>

          {/* edges: commit -> root */}
          <line x1={colX.commit + 46} y1={blobY(1)} x2={colX.root - 46} y2={treeY(0) + 20} className="gov-edge" markerEnd="url(#gov-arrow)" />
          {/* root -> subtrees */}
          {snap.subTrees.map((t, i) => (
            <line key={`rt-${t.dir}`} x1={colX.root + 46} y1={treeY(0) + 20} x2={colX.tree - 46} y2={treeY(i) + 18} className="gov-edge" markerEnd="url(#gov-arrow)" />
          ))}
          {/* subtree -> blobs */}
          {snap.subTrees.map((t, ti) => t.entries.map((b) => {
            const bi = snap.blobs.findIndex((x) => x.key === b.key);
            return (
              <line
                key={`tb-${b.key}`}
                x1={colX.tree + 46}
                y1={treeY(ti) + 18}
                x2={colX.blob - 48}
                y2={blobY(bi) + 16}
                className="gov-edge"
                markerEnd="url(#gov-arrow)"
              />
            );
          }))}

          {/* commit node */}
          <g className="gov-obj gov-obj-commit is-new">
            <rect x={colX.commit - 46} y={blobY(1) - 26} width={92} height={52} rx={9} className="gov-obj-box" />
            <text x={colX.commit} y={blobY(1) - 8} className="gov-obj-id">{snap.commit.id}</text>
            <text x={colX.commit} y={blobY(1) + 8} className="gov-obj-kind">commit</text>
            <text x={colX.commit} y={blobY(1) + 21} className="gov-obj-meta">tree {snap.rootTree.id}</text>
          </g>

          {/* root tree */}
          <g className={`gov-obj gov-obj-tree ${reuse.rootChanged ? 'is-new' : 'is-shared'}`}>
            <rect x={colX.root - 46} y={treeY(0) - 2} width={92} height={44} rx={9} className="gov-obj-box" />
            <text x={colX.root} y={treeY(0) + 16} className="gov-obj-id">{snap.rootTree.id}</text>
            <text x={colX.root} y={treeY(0) + 31} className="gov-obj-kind">{reuse.rootChanged ? 'tree NEW' : 'tree reused'}</text>
          </g>

          {/* sub trees */}
          {snap.subTrees.map((t, i) => (
            <g key={`tree-${t.dir}`} className={`gov-obj gov-obj-tree ${isNewTree(t.dir) ? 'is-new' : 'is-shared'}`}>
              <rect x={colX.tree - 46} y={treeY(i) - 2} width={92} height={44} rx={9} className="gov-obj-box" />
              <text x={colX.tree} y={treeY(i) + 14} className="gov-obj-id">{t.id}</text>
              <text x={colX.tree} y={treeY(i) + 29} className="gov-obj-kind">{t.dir}/ {isNewTree(t.dir) ? '· new' : '· shared'}</text>
            </g>
          ))}

          {/* blobs */}
          {snap.blobs.map((b, i) => (
            <g key={`blob-${b.key}`} className={`gov-obj gov-obj-blob ${isNewBlob(b.key) ? 'is-new' : 'is-shared'}`}>
              <rect x={colX.blob - 50} y={blobY(i) - 4} width={100} height={48} rx={9} className="gov-obj-box" />
              <text x={colX.blob} y={blobY(i) + 12} className="gov-obj-id">{b.id}</text>
              <text x={colX.blob} y={blobY(i) + 27} className="gov-obj-kind">{b.name}</text>
              <text x={colX.blob} y={blobY(i) + 40} className="gov-obj-body">"{b.body}"</text>
            </g>
          ))}

          {/* commit DAG strip */}
          <line x1={20} y1={dagY - 36} x2={W - 20} y2={dagY - 36} className="gov-dag-rule" />
          <text x={26} y={dagY - 44} className="gov-col-label">commit DAG (history)</text>
          {dagNodes.map((n, i) => (
            <g key={`dag-${i}`}>
              {i > 0 && (
                <line x1={dagNodes[i - 1].x + 16} y1={dagY} x2={n.x - 16} y2={dagY} className="gov-dag-edge" markerEnd="url(#gov-arrow)" />
              )}
              <circle cx={n.x} cy={dagY} r={14} className={`gov-dag-dot ${i === dagNodes.length - 1 ? 'is-head' : ''}`} />
              <text x={n.x} y={dagY + 4} className="gov-dag-id">{n.id.slice(0, 4)}</text>
              <text x={n.x} y={dagY + 30} className="gov-dag-msg" textAnchor="middle">{n.msg}</text>
            </g>
          ))}
          {/* pending draft node */}
          <line x1={dagNodes[dagNodes.length - 1].x + 16} y1={dagY} x2={pendingX - 16} y2={dagY} className="gov-dag-edge is-pending" markerEnd="url(#gov-arrow)" />
          <circle cx={pendingX} cy={dagY} r={14} className="gov-dag-dot is-pending" />
          <text x={pendingX} y={dagY + 4} className="gov-dag-id">{snap.commit.id.slice(0, 4)}</text>
          <text x={pendingX} y={dagY + 30} className="gov-dag-msg" textAnchor="middle">pending</text>
        </svg>
      </div>

      <div className="gov-metrics">
        <div className="gov-metric">
          <span className="gov-metric-label">objects re-hashed</span>
          <span className="gov-metric-value">{reuse.newCount}</span>
        </div>
        <div className="gov-metric">
          <span className="gov-metric-label">objects shared</span>
          <span className="gov-metric-value">{reuse.sharedCount}</span>
        </div>
        <div className="gov-metric gov-metric-dim">
          <span className="gov-metric-label">new commit</span>
          <span className="gov-metric-value gov-metric-dimval"><Hash size={12} /> {snap.commit.id}</span>
        </div>
        <div className="gov-metric gov-metric-dim">
          <span className="gov-metric-label">parent</span>
          <span className="gov-metric-value gov-metric-dimval">{snap.commit.parent ? snap.commit.parent : '(root)'}</span>
        </div>
      </div>

      <div className="gov-caption">
        <span className="gov-caption-label"><FilePen size={12} /> trace</span>
        <span className="gov-caption-body">
          Editing <strong>{editPath}</strong> -&gt; "{EDIT_VARIANTS[editPath]}" gives it a new blob hash{' '}
          <strong>{blobOf(editPath)?.id}</strong>. That changes the <strong>{FILES.find((f) => f.path === editPath).dir}/</strong> tree
          (now <strong>{treeOf(FILES.find((f) => f.path === editPath).dir)?.id}</strong>) and the root tree, so a fresh commit{' '}
          <strong>{snap.commit.id}</strong> is created pointing at parent <strong>{snap.commit.parent}</strong>. The other{' '}
          {reuse.treeShared.length === 1 ? 'directory tree is' : `${reuse.treeShared.length} directory trees are`} reused
          unchanged — git stores nothing twice. Press Commit to grow the DAG.
        </span>
      </div>
    </div>
  );
}
