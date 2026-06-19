import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Plus, Minus, UploadCloud, RefreshCw,
  CheckCircle2, AlertTriangle, Boxes, Hash, ArrowRight,
} from 'lucide-react';
import './MultipartUploadViz.css';

// Multipart upload of one large object split into N parts. Each part uploads
// independently and in parallel; a part that fails its checksum can be retried
// on its own without restarting the whole transfer. Once every part reports an
// ETag, a single CompleteMultipartUpload call assembles them server-side in
// order into the final object. The reader can: change the part count, run the
// parallel upload, fail+retry one part, and complete.

const MIN_PARTS = 3;
const MAX_PARTS = 8;
const TICK_MS = 90;
const PART_BYTES = 8;          // abstract "MB" per part for the readout
// Deterministic per-part speeds so parallel progress is visibly staggered.
const SPEEDS = [3, 2, 4, 2, 3, 5, 2, 4];

// status: 'pending' | 'uploading' | 'failed' | 'retrying' | 'done'
function initParts(n, failIndex) {
  return Array.from({ length: n }, (_, i) => ({
    i,
    progress: 0,
    status: 'pending',
    etag: null,
    speed: SPEEDS[i % SPEEDS.length],
    willFail: i === failIndex,
    failedOnce: false,
  }));
}

function etagFor(i) {
  // Stable pseudo-ETag per part.
  const h = ((i + 1) * 2654435761) >>> 0;
  return `"${h.toString(16).slice(0, 8)}-${i + 1}"`;
}

export default function MultipartUploadViz() {
  const [partCount, setPartCount] = useState(5);
  const [failIndex, setFailIndex] = useState(2);
  const [injectFail, setInjectFail] = useState(true);
  const [speed, setSpeed] = useState(1.5);
  const [isRunning, setIsRunning] = useState(false);
  const [parts, setParts] = useState(() => initParts(5, 2));
  const [completed, setCompleted] = useState(false);

  const runTimer = useRef(null);

  const effFail = injectFail ? Math.min(failIndex, partCount - 1) : -1;

  const reset = (n = partCount, fi = effFail) => {
    setIsRunning(false);
    setCompleted(false);
    setParts(initParts(n, fi));
  };

  const changeCount = (next) => {
    const clamped = Math.max(MIN_PARTS, Math.min(MAX_PARTS, next));
    const fi = injectFail ? Math.min(failIndex, clamped - 1) : -1;
    setPartCount(clamped);
    reset(clamped, fi);
  };

  const changeFailIndex = (next) => {
    const clamped = Math.max(0, Math.min(partCount - 1, next));
    setFailIndex(clamped);
    reset(partCount, injectFail ? clamped : -1);
  };

  const toggleFail = () => {
    const nextInject = !injectFail;
    setInjectFail(nextInject);
    reset(partCount, nextInject ? Math.min(failIndex, partCount - 1) : -1);
  };

  const delay = useMemo(() => Math.max(16, Math.round(TICK_MS / Math.max(speed, 0.1))), [speed]);

  // Derived phase flags.
  const allUploaded = parts.length > 0 && parts.every((p) => p.status === 'done');
  const anyFailed = parts.some((p) => p.status === 'failed');
  const uploadingDone = allUploaded;
  // Once every part is terminal (done, or failed-and-stuck) there is nothing
  // left to animate, so the interval stays parked. We derive the button's
  // running state from this rather than flipping isRunning inside an effect.
  const terminal = parts.length > 0
    && parts.every((p) => p.status === 'done' || p.status === 'failed');
  const running = isRunning && !terminal;

  // Drive parallel progress. A part marked willFail stalls at ~60% as 'failed'
  // until it is retried; retrying clears the flag and lets it finish.
  useEffect(() => {
    if (!running) return undefined;
    runTimer.current = setInterval(() => {
      setParts((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          if (p.status === 'done' || p.status === 'failed') return p;
          if (p.status === 'pending' || p.status === 'uploading' || p.status === 'retrying') {
            const inc = p.speed;
            let progress = Math.min(100, p.progress + inc);
            let status = 'uploading';
            let etag = p.etag;
            let failedOnce = p.failedOnce;
            if (p.willFail && !p.failedOnce && progress >= 60) {
              progress = 60;
              status = 'failed';
              failedOnce = true;
            } else if (progress >= 100) {
              progress = 100;
              status = 'done';
              etag = etagFor(p.i);
            }
            changed = true;
            return { ...p, progress, status, etag, failedOnce };
          }
          return p;
        });
        return changed ? next : prev;
      });
    }, delay);
    return () => {
      if (runTimer.current) {
        clearInterval(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [running, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
  }, []);

  const startUpload = () => {
    if (allUploaded) return;
    setIsRunning((v) => !v);
  };

  const retryFailed = () => {
    setParts((prev) => prev.map((p) => (
      p.status === 'failed'
        ? { ...p, status: 'retrying', willFail: false }
        : p
    )));
    setIsRunning(true);
  };

  const complete = () => {
    if (!allUploaded) return;
    setIsRunning(false);
    setCompleted(true);
  };

  const doneCount = parts.filter((p) => p.status === 'done').length;
  const totalBytes = partCount * PART_BYTES;
  const uploadedBytes = parts.reduce((s, p) => s + (p.progress / 100) * PART_BYTES, 0);

  const phase = completed
    ? 'complete'
    : anyFailed
      ? 'failed'
      : allUploaded
        ? 'ready'
        : running
          ? 'uploading'
          : 'idle';

  const phaseLabel = {
    idle: 'ready to upload',
    uploading: 'uploading parts in parallel',
    failed: 'part failed — retry it',
    ready: 'all parts uploaded — complete to assemble',
    complete: 'object assembled',
  }[phase];

  // SVG geometry — one progress lane per part, plus an assembled-object strip.
  const W = 960;
  const labelW = 96;
  const barX = labelW + 12;
  const etagW = 96;
  const barRight = W - etagW - 16;
  const barW = barRight - barX;
  const rowH = 30;
  const rowGap = 9;
  const topPad = 30;
  const assembleH = 46;
  const botPad = 18;
  const H = topPad + partCount * (rowH + rowGap) + 16 + assembleH + botPad;

  return (
    <div className="muv">
      <div className="muv-head">
        <h3 className="muv-title">Multipart upload — N parts in parallel, retry one, then assemble</h3>
        <p className="muv-sub">
          A large object is split into parts that upload independently. A failed part retries on its own
          without restarting the others. When every part returns an ETag, one complete call assembles
          them server-side into the final object.
        </p>
      </div>

      <div className="muv-controls">
        <div className="muv-stepper" role="group" aria-label="Part count">
          <span className="muv-input-label">parts</span>
          <button
            type="button"
            className="muv-step-btn"
            onClick={() => changeCount(partCount - 1)}
            disabled={partCount <= MIN_PARTS}
            aria-label="Fewer parts"
          >
            <Minus size={13} />
          </button>
          <input
            type="range"
            min={MIN_PARTS}
            max={MAX_PARTS}
            step={1}
            value={partCount}
            onChange={(e) => changeCount(Number(e.target.value))}
            className="muv-range"
            aria-label="Number of parts"
          />
          <button
            type="button"
            className="muv-step-btn"
            onClick={() => changeCount(partCount + 1)}
            disabled={partCount >= MAX_PARTS}
            aria-label="More parts"
          >
            <Plus size={13} />
          </button>
          <span className="muv-range-value">{partCount}</span>
        </div>

        <button
          type="button"
          className={`muv-toggle ${injectFail ? 'is-on' : ''}`}
          onClick={toggleFail}
          aria-pressed={injectFail}
          title="Toggle whether one part fails its checksum mid-upload"
        >
          <AlertTriangle size={13} /> fail a part {injectFail ? 'on' : 'off'}
        </button>

        {injectFail && (
          <div className="muv-stepper" role="group" aria-label="Which part fails">
            <span className="muv-input-label">fails</span>
            <button
              type="button"
              className="muv-step-btn"
              onClick={() => changeFailIndex(failIndex - 1)}
              disabled={failIndex <= 0}
              aria-label="Earlier part fails"
            >
              <Minus size={13} />
            </button>
            <span className="muv-range-value">part {Math.min(failIndex, partCount - 1) + 1}</span>
            <button
              type="button"
              className="muv-step-btn"
              onClick={() => changeFailIndex(failIndex + 1)}
              disabled={failIndex >= partCount - 1}
              aria-label="Later part fails"
            >
              <Plus size={13} />
            </button>
          </div>
        )}

        <label className="muv-speed">
          <span className="muv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="muv-range"
            aria-label="Playback speed"
          />
          <span className="muv-range-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="muv-spacer" aria-hidden="true" />

        <div className="muv-buttons">
          <button
            type="button"
            className="muv-btn muv-btn-primary"
            onClick={startUpload}
            disabled={allUploaded || anyFailed}
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? 'Pause' : 'Upload'}
          </button>
          <button
            type="button"
            className="muv-btn muv-btn-warn"
            onClick={retryFailed}
            disabled={!anyFailed}
          >
            <RefreshCw size={14} /> Retry part
          </button>
          <button
            type="button"
            className="muv-btn muv-btn-ok"
            onClick={complete}
            disabled={!allUploaded || completed}
          >
            <CheckCircle2 size={14} /> Complete
          </button>
          <button type="button" className="muv-btn" onClick={() => reset()}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="muv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="muv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="muv-conn-label" x={barX} y={18} textAnchor="start">
            PUT part?partNumber=k&amp;uploadId=… — independent, parallel
          </text>
          <text className="muv-clock-label" x={barRight} y={18} textAnchor="end">
            {`${doneCount} / ${partCount} parts done`}
          </text>

          {parts.map((p) => {
            const y = topPad + p.i * (rowH + rowGap);
            const fillW = (Math.max(0, Math.min(100, p.progress)) / 100) * barW;
            return (
              <g key={`part-${p.i}`}>
                <text className="muv-lane-label" x={0} y={y + rowH / 2 + 4}>
                  {`part ${p.i + 1}`}
                </text>
                <rect className="muv-track" x={barX} y={y} width={barW} height={rowH} rx={6} />
                <rect
                  className={`muv-fill is-${p.status}`}
                  x={barX}
                  y={y}
                  width={Math.max(0, fillW)}
                  height={rowH}
                  rx={6}
                />
                <text
                  className={`muv-pct is-${p.status}`}
                  x={barX + 8}
                  y={y + rowH / 2 + 4}
                  textAnchor="start"
                >
                  {p.status === 'failed'
                    ? 'checksum failed'
                    : p.status === 'retrying'
                      ? `retrying ${Math.round(p.progress)}%`
                      : `${Math.round(p.progress)}%`}
                </text>
                {p.etag ? (
                  <text className="muv-etag is-done" x={barRight + 10} y={y + rowH / 2 + 4} textAnchor="start">
                    {`ETag ${p.etag}`}
                  </text>
                ) : (
                  <text className={`muv-etag is-${p.status}`} x={barRight + 10} y={y + rowH / 2 + 4} textAnchor="start">
                    {p.status === 'failed' ? 'no ETag' : '—'}
                  </text>
                )}
              </g>
            );
          })}

          {/* assembled-object strip */}
          {(() => {
            const y = topPad + partCount * (rowH + rowGap) + 14;
            const segW = barW / Math.max(1, partCount);
            return (
              <g>
                <text className="muv-assemble-label" x={0} y={y + assembleH / 2 + 4}>
                  object
                </text>
                <rect
                  className={`muv-assemble-frame ${completed ? 'is-complete' : ''}`}
                  x={barX}
                  y={y}
                  width={barW}
                  height={assembleH}
                  rx={7}
                />
                {parts.map((p) => {
                  const sx = barX + p.i * segW;
                  const placed = completed;
                  const ready = p.status === 'done';
                  return (
                    <g key={`seg-${p.i}`}>
                      <rect
                        className={`muv-seg ${placed ? 'is-placed' : ready ? 'is-ready' : 'is-missing'}`}
                        x={sx + 2}
                        y={y + 5}
                        width={Math.max(2, segW - 4)}
                        height={assembleH - 10}
                        rx={4}
                      />
                      <text
                        className={`muv-seg-label ${placed ? 'is-placed' : ''}`}
                        x={sx + segW / 2}
                        y={y + assembleH / 2 + 4}
                        textAnchor="middle"
                      >
                        {p.i + 1}
                      </text>
                    </g>
                  );
                })}
                <text className={`muv-assemble-status ${completed ? 'is-complete' : ''}`} x={barRight + 10} y={y + assembleH / 2 + 4} textAnchor="start">
                  {completed ? 'assembled' : `${doneCount}/${partCount}`}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="muv-metrics">
        <div className="muv-metric">
          <span className="muv-metric-label">phase</span>
          <span className={`muv-metric-value ${phase === 'complete' || phase === 'ready' ? 'is-ok' : (phase === 'failed' ? 'is-warn' : '')}`}>
            {phase}
          </span>
        </div>
        <div className="muv-metric">
          <span className="muv-metric-label">parts done</span>
          <span className="muv-metric-value">{`${doneCount} / ${partCount}`}</span>
        </div>
        <div className="muv-metric">
          <span className="muv-metric-label">uploaded</span>
          <span className="muv-metric-value">
            {`${uploadedBytes.toFixed(1)} / ${totalBytes} MB`}
          </span>
        </div>
        <div className="muv-metric">
          <span className="muv-metric-label">retries needed</span>
          <span className={`muv-metric-value ${anyFailed ? 'is-warn' : ''}`}>
            {parts.filter((p) => p.failedOnce).length}
          </span>
        </div>
        <div className="muv-metric muv-metric-dim">
          <span className="muv-metric-label">complete call</span>
          <span className={`muv-metric-value ${completed ? 'is-ok' : ''}`}>
            {completed ? 'assembled from ETags' : (allUploaded ? 'ready to send' : 'waiting for parts')}
          </span>
        </div>
      </div>

      <div className={`muv-narration ${phase === 'complete' ? 'is-ok' : (phase === 'failed' ? 'is-warn' : '')}`}>
        <span className={`muv-narration-label ${phase === 'complete' ? 'is-ok' : (phase === 'failed' ? 'is-warn' : '')}`}>
          {phaseLabel}
        </span>
        <span className="muv-narration-body">
          {phase === 'complete'
            ? `CompleteMultipartUpload took the ${partCount} ETags in order and the server stitched the parts into one object — no re-upload of the bytes, just a manifest of part numbers and ETags. The big file is whole.`
            : phase === 'failed'
              ? `Part ${parts.findIndex((p) => p.status === 'failed') + 1} failed its checksum at 60%. Only that part has to be re-sent — every other part keeps its progress and ETag. Press "Retry part" to upload just the failed one; the others are untouched.`
              : phase === 'ready'
                ? `All ${partCount} parts uploaded and each returned an ETag — a server-side fingerprint of that part's bytes. Nothing is assembled yet. Press "Complete" to send the list of (partNumber, ETag) pairs and have the server build the final object.`
                : phase === 'uploading'
                  ? `Each part is a separate PUT carrying its own byte range, all in flight at once over the same uploadId. They progress at different speeds — the slowest part bounds the upload, not the sum. A part that finishes returns an ETag immediately.`
                  : `One object, ${partCount} parts. Each part uploads independently so the transfer parallelizes and a failure is local. Press "Upload" to send all parts at once.`}
        </span>
      </div>

      <div className="muv-legend">
        <span className="muv-legend-item"><UploadCloud size={13} className="muv-ic" /> each part = an independent parallel PUT</span>
        <span className="muv-legend-item"><AlertTriangle size={13} className="muv-ic is-warn" /> failed part retries alone — others untouched</span>
        <span className="muv-legend-item"><Hash size={13} className="muv-ic is-accent" /> ETag = server fingerprint per part</span>
        <span className="muv-legend-item"><Boxes size={13} className="muv-ic is-ok" /> complete assembles parts in order</span>
        <span className="muv-legend-item"><ArrowRight size={13} className="muv-ic" /> {uploadingDone ? 'parts ready' : 'upload in progress'}</span>
      </div>
    </div>
  );
}
