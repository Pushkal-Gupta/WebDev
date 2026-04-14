import { useCallback, useEffect, useMemo, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import usePrefsStore from '../../store/prefsStore';
import useCoachStore from '../../store/coachStore';
import { runIntent, INTENTS } from '../../utils/coachActions';
import styles from './CoachBubble.module.css';

const PROMPTS = [
  { id: INTENTS.BEST_MOVE,   label: 'Best move?' },
  { id: INTENTS.EXPLAIN,     label: 'Explain position' },
  { id: INTENTS.THREATS,     label: 'Any threats?' },
  { id: INTENTS.OPENING,     label: 'Opening theory' },
  { id: INTENTS.ENDGAME,     label: 'Endgame guide' },
  { id: INTENTS.REVIEW_LAST, label: 'Review last move' },
];

const KIND_LABEL = {
  'best-move': 'Best move',
  'overview':  'Position',
  'threats':   'Tactics',
  'opening':   'Opening',
  'endgame':   'Endgame',
  'review':    'Review',
  'text':      null,
};

function renderInline(text) {
  // minimal **bold** + _italic_ support so we don't pull in a markdown lib
  const parts = [];
  let i = 0;
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) parts.push(text.slice(i, m.index));
    const chunk = m[0];
    if (chunk.startsWith('**')) parts.push(<strong key={m.index}>{chunk.slice(2, -2)}</strong>);
    else parts.push(<em key={m.index}>{chunk.slice(1, -1)}</em>);
    i = m.index + chunk.length;
  }
  if (i < text.length) parts.push(text.slice(i));
  return parts;
}

function formatBody(text) {
  return (text || '').split('\n').map((line, idx, arr) => (
    <span key={idx}>
      {renderInline(line)}
      {idx < arr.length - 1 && <br />}
    </span>
  ));
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

export default function CoachBubble({
  context = 'analysis',
  autoOpen = false,
  greeting = null,
  fenOverride = null,
  moveHistoryOverride = null,
}) {
  const enabled = usePrefsStore((s) => s.coachEnabled);
  const position = usePrefsStore((s) => s.coachPosition);
  const isCoachGame = useGameStore((s) => s.isCoachGame);

  const messages = useCoachStore((s) => s.messages);
  const isOpen = useCoachStore((s) => s.isOpen);
  const pendingIntent = useCoachStore((s) => s.pendingIntent);
  const open = useCoachStore((s) => s.open);
  const close = useCoachStore((s) => s.close);
  const push = useCoachStore((s) => s.push);
  const setPendingIntent = useCoachStore((s) => s.setPendingIntent);
  const clear = useCoachStore((s) => s.clear);

  const chessInstance = useGameStore((s) => s.chessInstance);
  const storeMoveHistory = useGameStore((s) => s.moveHistory);

  const listRef = useRef(null);
  const didAutoOpenRef = useRef(false);
  const didGreetRef = useRef(false);

  const fen = fenOverride || chessInstance?.fen() || null;
  const moveHistory = moveHistoryOverride || storeMoveHistory;

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, isOpen, pendingIntent]);

  useEffect(() => {
    if (!enabled) return;
    if (autoOpen && !didAutoOpenRef.current) {
      didAutoOpenRef.current = true;
      open();
    }
  }, [autoOpen, enabled, open]);

  useEffect(() => {
    if (!enabled) return;
    if (greeting && !didGreetRef.current) {
      didGreetRef.current = true;
      push({ role: 'coach', kind: 'text', text: greeting });
    }
  }, [greeting, enabled, push]);

  const handlePrompt = useCallback(async (intentId, label) => {
    if (pendingIntent) return;
    push({ role: 'user', kind: 'text', text: label });
    setPendingIntent(intentId);
    push({ role: 'coach', kind: 'loading', text: '' });
    try {
      const msg = await runIntent(intentId, { fen, moveHistory });
      // Replace the placeholder loading bubble with the actual answer
      useCoachStore.getState().replaceLast(msg);
    } catch (e) {
      useCoachStore.getState().replaceLast({
        role: 'coach', kind: 'text',
        text: 'Something went wrong computing that.',
      });
    } finally {
      setPendingIntent(null);
    }
  }, [fen, moveHistory, pendingIntent, push, setPendingIntent]);

  const posClass = useMemo(() => {
    const key = `pos_${position}`;
    return styles[key] || styles.pos_br;
  }, [position]);

  if (!enabled) return null;
  // Suppress the reactive bubble while a coach game is active — the sidebar
  // chat card fills that role in that context.
  if (isCoachGame) return null;

  return (
    <div className={`${styles.container} ${posClass}`}>
      {!isOpen && (
        <button className={styles.toggle} onClick={open} title="Open Coach" aria-label="Open Coach">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5z" />
            <path d="M9 11l2 2 4-4" />
          </svg>
          <span className={styles.toggleDot} />
        </button>
      )}

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.title}>Coach</span>
            <div className={styles.headerRight}>
              <button
                className={styles.iconBtn}
                onClick={clear}
                title="Clear history"
                aria-label="Clear coach history"
              >
                ⟲
              </button>
              <button
                className={styles.iconBtn}
                onClick={close}
                title="Close"
                aria-label="Close coach"
              >
                ×
              </button>
            </div>
          </div>

          <div className={styles.subtitle}>
            {context === 'analysis' ? 'Analysis mode' :
             context === 'training' ? 'Training mode' :
             context === 'puzzle'   ? 'Puzzle mode' : 'Coach'}
          </div>

          <div className={styles.messageList} ref={listRef}>
            {messages.length === 0 && (
              <div className={styles.emptyMsg}>
                Ask me about the position. Try <b>Explain position</b> or <b>Opening theory</b> below.
              </div>
            )}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const tag = !isUser && KIND_LABEL[msg.kind];
              return (
                <div key={msg.id} className={`${styles.msgRow} ${isUser ? styles.msgUser : styles.msgCoach}`}>
                  <div className={styles.bubble}>
                    {tag && <span className={styles.kindTag}>{tag}</span>}
                    {msg.kind === 'loading' ? (
                      <span className={styles.loadingDots}><span /><span /><span /></span>
                    ) : (
                      <div>{formatBody(msg.text)}</div>
                    )}
                    {msg.kind !== 'loading' && (
                      <span className={styles.msgTime}>{formatTime(msg.ts)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.prompts}>
            {PROMPTS.map((p) => (
              <button
                key={p.id}
                className={styles.promptBtn}
                onClick={() => handlePrompt(p.id, p.label)}
                disabled={!!pendingIntent || !fen}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
