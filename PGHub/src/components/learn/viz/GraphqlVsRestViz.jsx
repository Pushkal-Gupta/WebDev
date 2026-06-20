import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, ArrowRight, ArrowLeft } from 'lucide-react';
import './GraphqlVsRestViz.css';

const MODES = [
  { id: 'rest', label: 'REST' },
  { id: 'graphql', label: 'GRAPHQL' },
];

const FIELDS = [
  { id: 'user.name', label: 'user.name', group: 'user', bytes: 24 },
  { id: 'user.email', label: 'user.email', group: 'user', bytes: 40 },
  { id: 'posts.title', label: 'posts.title', group: 'post', bytes: 30 },
  { id: 'posts.body', label: 'posts.body', group: 'post', bytes: 220 },
  { id: 'comments.text', label: 'comments.text', group: 'comment', bytes: 70 },
];

const USER_FULL = [
  { id: 'user.name', bytes: 24 },
  { id: 'user.email', bytes: 40 },
  { id: 'user.bio', bytes: 180 },
  { id: 'user.avatar', bytes: 120 },
  { id: 'user.joinedAt', bytes: 36 },
];
const POST_FULL = [
  { id: 'posts.title', bytes: 30 },
  { id: 'posts.body', bytes: 220 },
  { id: 'posts.createdAt', bytes: 36 },
  { id: 'posts.likes', bytes: 12 },
];
const COMMENT_FULL = [
  { id: 'comments.text', bytes: 70 },
  { id: 'comments.author', bytes: 28 },
  { id: 'comments.createdAt', bytes: 36 },
];
const COMMENTS_PER_POST = 2;
const ENVELOPE = 60;

const sumFull = (full) => full.reduce((a, f) => a + f.bytes, 0);
const sumWanted = (full, wanted) => full.filter((f) => wanted.has(f.id)).reduce((a, f) => a + f.bytes, 0);

function buildRestFrames(wanted, nPosts) {
  const frames = [];
  let total = 0;
  let over = 0;
  let under = 0;
  let trips = 0;

  const userFull = sumFull(USER_FULL) + ENVELOPE;
  const userWanted = sumWanted(USER_FULL, wanted);
  const userOver = userFull - userWanted - ENVELOPE;
  total += userFull; over += Math.max(0, userOver); trips += 1;
  const wantsComments = wanted.has('comments.text');
  if (wantsComments) under += 1;
  frames.push({
    trip: trips, total, over, under,
    call: 'GET /users/:id',
    dir: 'response',
    bytes: userFull,
    overBytes: Math.max(0, userOver),
    note: `Round-trip ${trips}: GET /users/:id returns the WHOLE user object (${userFull} B incl. envelope). The UI only wanted name/email it ticked, so ${Math.max(0, userOver)} B of bio/avatar/joinedAt are over-fetched. Posts aren't here — that's an under-fetch, another call needed.`,
  });

  const postFull = sumFull(POST_FULL) * nPosts + ENVELOPE;
  const postWanted = sumWanted(POST_FULL, wanted) * nPosts;
  const postOver = postFull - postWanted - ENVELOPE;
  total += postFull; over += Math.max(0, postOver); trips += 1;
  if (wantsComments) under += 1;
  frames.push({
    trip: trips, total, over, under,
    call: 'GET /users/:id/posts',
    dir: 'response',
    bytes: postFull,
    overBytes: Math.max(0, postOver),
    note: `Round-trip ${trips}: GET /users/:id/posts returns ${nPosts} full post object(s) (${postFull} B). Unticked fields (body/createdAt/likes) add ${Math.max(0, postOver)} B over-fetch. Comments still missing -> under-fetch -> ${nPosts} more call(s).`,
  });

  const commentFull = sumFull(COMMENT_FULL) * COMMENTS_PER_POST + ENVELOPE;
  const commentWanted = sumWanted(COMMENT_FULL, wanted) * COMMENTS_PER_POST;
  const commentOver = commentFull - commentWanted - ENVELOPE;
  for (let p = 0; p < nPosts; p += 1) {
    total += commentFull; over += Math.max(0, commentOver); trips += 1;
    frames.push({
      trip: trips, total, over, under,
      call: `GET /posts/${p + 1}/comments`,
      dir: 'response',
      bytes: commentFull,
      overBytes: Math.max(0, commentOver),
      note: `Round-trip ${trips}: GET /posts/${p + 1}/comments — the N+1 problem. One extra request per post. Returns full comment objects (${commentFull} B); ${Math.max(0, commentOver)} B over-fetch from author/createdAt the UI didn't ask for.`,
    });
  }

  frames.push({
    trip: trips, total, over, under,
    call: 'done',
    dir: 'done',
    bytes: 0,
    overBytes: 0,
    note: `Done. REST needed ${trips} round-trips (1 user + 1 posts + ${nPosts} comments = the N+1 tail), shipped ${total} B total with ${over} B over-fetched and ${under} under-fetch hop(s). More posts = more trips.`,
  });
  return frames;
}

function buildGraphqlFrames(wanted, nPosts) {
  const userB = sumWanted(USER_FULL, wanted);
  const postB = sumWanted(POST_FULL, wanted) * nPosts;
  const commentB = wanted.has('comments.text') ? sumWanted(COMMENT_FULL, wanted) * COMMENTS_PER_POST * nPosts : 0;
  const total = userB + postB + commentB + ENVELOPE;
  return [{
    trip: 1, total, over: 0, under: 0,
    call: 'POST /graphql',
    dir: 'response',
    bytes: total,
    overBytes: 0,
    note: `One POST /graphql carries a query selecting exactly the ticked fields. The server resolves user -> posts -> comments in a single round-trip and returns precisely that shape: ${total} B, 0 over-fetch, 0 under-fetch.`,
  }];
}

export default function GraphqlVsRestViz() {
  const [mode, setMode] = useState('rest');
  const [wanted, setWanted] = useState(new Set(['user.name', 'posts.title', 'comments.text']));
  const [nPosts, setNPosts] = useState(2);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'rest' ? buildRestFrames(wanted, nPosts) : buildGraphqlFrames(wanted, nPosts)),
    [mode, wanted, nPosts],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const toggleField = (id) => {
    setIsRunning(false);
    setStep(0);
    setWanted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const changePosts = (value) => {
    setIsRunning(false);
    setStep(0);
    setNPosts(Math.max(1, Math.min(5, value)));
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const W = 940;
  const rows = mode === 'rest' ? 2 + nPosts : 1;
  const rowH = 56;
  const top = 64;
  const H = top + rows * rowH + 44;

  const clientX = 70;
  const serverX = W - 70;
  const colW = 150;
  const lineL = clientX + colW / 2;
  const lineR = serverX - colW / 2;

  const queryShape = useMemo(() => {
    const lines = ['query {', '  user {'];
    if (wanted.has('user.name')) lines.push('    name');
    if (wanted.has('user.email')) lines.push('    email');
    lines.push('    posts {');
    if (wanted.has('posts.title')) lines.push('      title');
    if (wanted.has('posts.body')) lines.push('      body');
    if (wanted.has('comments.text')) {
      lines.push('      comments {');
      lines.push('        text');
      lines.push('      }');
    }
    lines.push('    }', '  }', '}');
    return lines;
  }, [wanted]);

  return (
    <div className="grv">
      <div className="grv-head">
        <h3 className="grv-title">REST vs GraphQL — round-trips and over-fetch</h3>
        <p className="grv-sub">
          A profile UI needs a user, their posts, and each post&apos;s comments. Tick the fields the UI
          actually uses and watch REST stack round-trips and waste bytes while one GraphQL query returns
          exactly the shape requested.
        </p>
      </div>

      <div className="grv-controls">
        <div className="grv-modes" role="tablist" aria-label="API style">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`grv-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="grv-fields">
          <span className="grv-input-label">UI needs</span>
          {FIELDS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`grv-chip grv-chip-${f.group} ${wanted.has(f.id) ? 'is-on' : ''}`}
              onClick={() => toggleField(f.id)}
              aria-pressed={wanted.has(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <label className="grv-slider">
          <span className="grv-input-label">posts</span>
          <input
            type="range" min={1} max={5} step={1} value={nPosts}
            onChange={(e) => changePosts(Number(e.target.value))}
            className="grv-range" aria-label="Number of posts"
          />
          <span className="grv-slider-val">{nPosts}</span>
        </label>

        <label className="grv-slider">
          <span className="grv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="grv-range" aria-label="Playback speed"
          />
          <span className="grv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="grv-spacer" aria-hidden="true" />

        <div className="grv-buttons">
          <button
            type="button"
            className="grv-btn grv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="grv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="grv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="grv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="grv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="grv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="grv-svg" preserveAspectRatio="xMidYMid meet">
          <rect className="grv-node" x={clientX - colW / 2} y={28} width={colW} height={H - 60} rx={8} />
          <text className="grv-node-label" x={clientX} y={48}>CLIENT (UI)</text>
          <rect className="grv-node grv-node-server" x={serverX - colW / 2} y={28} width={colW} height={H - 60} rx={8} />
          <text className="grv-node-label" x={serverX} y={48}>SERVER</text>
          <line className="grv-lifeline" x1={lineL} y1={56} x2={lineL} y2={H - 36} />
          <line className="grv-lifeline" x1={lineR} y1={56} x2={lineR} y2={H - 36} />

          {mode === 'rest' ? (
            frames.slice(0, frames.length - 1).map((f, i) => {
              const y = top + i * rowH + 22;
              const active = current.trip === f.trip && current.dir !== 'done';
              const visible = i < current.trip;
              const cls = ['grv-trip', active && 'is-active', visible && 'is-visible', f.overBytes > 0 && 'has-over'].filter(Boolean).join(' ');
              if (!visible) return null;
              return (
                <g key={`trip-${i}`} className={cls}>
                  <line className="grv-arrow grv-arrow-req" x1={lineL} y1={y - 12} x2={lineR} y2={y - 12} markerEnd="url(#grv-ahead-req)" />
                  <text className="grv-call" x={(lineL + lineR) / 2} y={y - 16}>{f.call}</text>
                  <line className="grv-arrow grv-arrow-res" x1={lineR} y1={y + 12} x2={lineL} y2={y + 12} markerEnd="url(#grv-ahead-res)" />
                  <text className="grv-bytes" x={(lineL + lineR) / 2} y={y + 26}>
                    {f.bytes} B{f.overBytes > 0 ? ` · ${f.overBytes} B over-fetch` : ''}
                  </text>
                </g>
              );
            })
          ) : (
            <g className="grv-trip is-active is-visible">
              <line className="grv-arrow grv-arrow-gql" x1={lineL} y1={top + 6} x2={lineR} y2={top + 6} markerEnd="url(#grv-ahead-gql)" />
              <text className="grv-call" x={(lineL + lineR) / 2} y={top + 2}>POST /graphql</text>
              <foreignObject x={lineL + 10} y={top + 18} width={lineR - lineL - 20} height={rowH * 1.6}>
                <div className="grv-query" xmlns="http://www.w3.org/1999/xhtml">
                  {queryShape.map((ln) => <div key={ln} className="grv-query-line">{ln}</div>)}
                </div>
              </foreignObject>
              <line className="grv-arrow grv-arrow-gql" x1={lineR} y1={H - 56} x2={lineL} y2={H - 56} markerEnd="url(#grv-ahead-gql)" />
              <text className="grv-bytes" x={(lineL + lineR) / 2} y={H - 40}>
                exact shape · {current.total} B · 0 over-fetch
              </text>
            </g>
          )}

          <defs>
            <marker id="grv-ahead-req" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path className="grv-ahead-req" d="M0,0 L6,3 L0,6 Z" />
            </marker>
            <marker id="grv-ahead-res" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path className="grv-ahead-res" d="M0,0 L6,3 L0,6 Z" />
            </marker>
            <marker id="grv-ahead-gql" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path className="grv-ahead-gql" d="M0,0 L6,3 L0,6 Z" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="grv-metrics">
        <div className="grv-metric">
          <span className="grv-metric-label">mode</span>
          <span className="grv-metric-value">{mode === 'rest' ? 'REST' : 'GraphQL'}</span>
        </div>
        <div className="grv-metric">
          <span className="grv-metric-label">round-trips</span>
          <span className="grv-metric-value">{current.trip}</span>
        </div>
        <div className="grv-metric">
          <span className="grv-metric-label">total bytes</span>
          <span className="grv-metric-value">{current.total} B</span>
        </div>
        <div className="grv-metric">
          <span className="grv-metric-label">over-fetched</span>
          <span className={`grv-metric-value ${current.over > 0 ? 'is-warn' : 'is-good'}`}>{current.over} B</span>
        </div>
        <div className="grv-metric">
          <span className="grv-metric-label">under-fetch hops</span>
          <span className={`grv-metric-value ${current.under > 0 ? 'is-warn' : 'is-good'}`}>{current.under}</span>
        </div>
      </div>

      <div className="grv-narration">
        <span className="grv-narration-label">
          {current.dir === 'done' ? <ArrowLeft size={12} /> : <ArrowRight size={12} />} trace
        </span>
        <span className="grv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
