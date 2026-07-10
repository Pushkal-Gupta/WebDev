import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Lock, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { isAiEnabled } from '../lib/ai';
import './HintsPanel.css';

const LEVEL_LABELS = [
  'Direction',
  'Pattern',
  'Partial logic',
  'Key insight',
  'Pseudocode',
];

// Hints are authored with a mix of markdown (`code`, **bold**) and inline HTML
// (<code>, <sup>, <sub>). Render both as real elements instead of leaking raw tags.
function renderHint(text) {
  if (typeof text !== 'string' || !text) return text;
  let s = text
    .replace(/<sup>(.*?)<\/sup>/gi, '^$1')
    .replace(/<sub>(.*?)<\/sub>/gi, '_$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(?:b|strong)\s*>/gi, '**')
    .replace(/<\/?(?:i|em)\s*>/gi, '*');
  const out = [];
  const re = /<code>([\s\S]*?)<\/code>|`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0, m, k = 0;
  const clean = (t) => t.replace(/<\/?[a-z][^>]*>/gi, '');
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(clean(s.slice(last, m.index)));
    if (m[1] !== undefined || m[2] !== undefined) out.push(<code key={k++} className="hint-code">{m[1] ?? m[2]}</code>);
    else out.push(<strong key={k++}>{m[3]}</strong>);
    last = re.lastIndex;
  }
  if (last < s.length) out.push(clean(s.slice(last)));
  return out;
}

export default function HintsPanel({ hints = [], problemId, problemName, problemDescription, code, onRevealCountChange }) {
  const storageKey = problemId ? `pgcode_hints_${problemId}` : null;
  const aiKey = problemId ? `pgcode_aihint_${problemId}` : null;

  const [aiHint, setAiHint] = useState(() => {
    if (!aiKey) return null;
    try { return localStorage.getItem(aiKey) || null; } catch { return null; }
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const requestAiHint = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      // Lazy-load the heavier AI module so it isn't pulled into any chunk
      // until the user actually asks for AI help.
      const { aiAdaptiveHint } = await import('../lib/ai');
      const next = await aiAdaptiveHint({
        problemName: problemName || problemId,
        problemDescription,
        levelsAlreadyShown: hints.slice(0, revealed),
        code,
      });
      setAiHint(next);
      if (aiKey) localStorage.setItem(aiKey, next);
    } catch (e) {
      setAiError(e?.message || 'AI hint failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const [revealed, setRevealed] = useState(() => {
    if (!storageKey) return 0;
    const n = parseInt(localStorage.getItem(storageKey) || '0', 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(hints.length, n)) : 0;
  });

  useEffect(() => {
    if (!storageKey) return;
    const n = parseInt(localStorage.getItem(storageKey) || '0', 10);
    setRevealed(Number.isFinite(n) ? Math.max(0, Math.min(hints.length, n)) : 0);
  }, [storageKey, hints.length]);

  const persist = useCallback((n) => {
    setRevealed(n);
    if (storageKey) localStorage.setItem(storageKey, String(n));
    if (onRevealCountChange) onRevealCountChange(n);
  }, [storageKey, onRevealCountChange]);

  if (!hints || hints.length === 0) {
    return (
      <div className="hints-empty">
        <Lightbulb size={20} className="hints-empty-icon" />
        <p className="hints-empty-title">No hints for this one.</p>
        <p className="hints-empty-sub">Try the editorial in the Solution tab, or work it out from the constraints.</p>
      </div>
    );
  }

  return (
    <div className="hints-panel">
      <div className="hints-header">
        <h3 className="hints-title">
          <Lightbulb size={14} /> Hints ({revealed} / {hints.length} revealed)
        </h3>
        {revealed > 0 && (
          <button className="hints-reset" onClick={() => persist(0)} title="Hide all hints">
            <EyeOff size={12} /> Hide all
          </button>
        )}
      </div>
      <p className="hints-warning">
        Each hint gives away more. Try the next level only after honestly trying without it.
      </p>

      <ol className="hints-list">
        {hints.map((h, i) => {
          const idx = i + 1;
          const isShown = i < revealed;
          const isNext = i === revealed;
          return (
            <li
              key={i}
              className={`hints-item ${isShown ? 'shown' : ''} ${isNext ? 'next' : ''}`}
            >
              <div className="hints-item-head">
                <span className="hints-item-num">{idx}</span>
                <span className="hints-item-label">
                  Level {idx} — {LEVEL_LABELS[i] || 'Deeper hint'}
                </span>
              </div>
              {isShown ? (
                <p className="hints-item-body">{renderHint(h)}</p>
              ) : (
                <button
                  className="hints-reveal-btn"
                  onClick={() => persist(idx)}
                  disabled={!isNext}
                  title={isNext ? 'Reveal this hint' : 'Reveal earlier hints first'}
                >
                  {isNext ? 'Reveal hint' : <><Lock size={11} /> Locked</>}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {isAiEnabled() && (
        <div className="hints-ai">
          <div className="hints-ai-head">
            <Sparkles size={12} /> AI hint
          </div>
          {aiHint ? (
            <p className="hints-item-body" style={{ paddingLeft: 0 }}>{aiHint}</p>
          ) : aiError ? (
            <p className="hints-ai-error">{aiError}</p>
          ) : null}
          <button
            className="hints-reveal-btn"
            onClick={requestAiHint}
            disabled={aiLoading}
            style={{ marginLeft: 0 }}
          >
            {aiLoading ? <><Loader2 size={11} className="hints-spin" /> Thinking…</>
              : aiHint ? <><Sparkles size={11} /> Get a deeper AI hint</>
              : <><Sparkles size={11} /> Get an AI hint</>}
          </button>
        </div>
      )}
    </div>
  );
}
