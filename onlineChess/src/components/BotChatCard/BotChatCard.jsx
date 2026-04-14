import { useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';
import usePrefsStore from '../../store/prefsStore';
import { getBotById, getBotByStrength } from '../../data/bots';
import { getCoachById } from '../../data/coaches';
import { commentOnMove, greetingLine } from '../../utils/botCommentary';
import { commentOnMoveCoach, coachGreeting } from '../../utils/coachCommentary';
import styles from './BotChatCard.module.css';

const MAX_LINES_BOT = 6;
const MAX_LINES_COACH = 15;
let lineId = 1;

/**
 * Sidebar-embedded chat card for bot and coach games.
 * Shows the persona chip at top and a stack of the latest N speech lines.
 */
export default function BotChatCard({ mode = 'bot' }) {
  const enabled = usePrefsStore((s) =>
    mode === 'coach' ? s.coachEnabled : s.botCommentaryEnabled
  );
  const isComp        = useGameStore((s) => s.isComp);
  const isCoachGame   = useGameStore((s) => s.isCoachGame);
  const compStrength  = useGameStore((s) => s.compStrength);
  const compColor     = useGameStore((s) => s.compColor);
  const selectedBotId = useGameStore((s) => s.selectedBotId);
  const selectedCoachId = useGameStore((s) => s.selectedCoachId);
  const gameStarted   = useGameStore((s) => s.gameStarted);
  const gameOver      = useGameStore((s) => s.gameOver);
  const moveHistory   = useGameStore((s) => s.moveHistory);

  const personality = mode === 'coach'
    ? getCoachById(selectedCoachId)
    : (isComp
        ? (getBotById(selectedBotId) || getBotByStrength(compStrength))
        : null);

  const [lines, setLines] = useState([]);
  const storageKey = `botchat_${mode}_collapsed`;
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });
  const lastLenRef = useRef(0);
  const greetedRef = useRef(false);
  const inFlightRef = useRef(false);
  const bubbleRef = useRef(null);

  // Auto-scroll bubble to bottom when new line added
  useEffect(() => {
    if (bubbleRef.current && !collapsed) {
      bubbleRef.current.scrollTop = bubbleRef.current.scrollHeight;
    }
  }, [lines.length, collapsed]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(storageKey, next ? '1' : '0'); } catch { /* ignore */ }
  };

  const maxLines = mode === 'coach' ? MAX_LINES_COACH : MAX_LINES_BOT;

  const push = (text) => {
    if (!text) return;
    setLines((prev) => {
      const next = [...prev, { id: `l${lineId++}`, text, ts: Date.now() }];
      return next.slice(-maxLines);
    });
  };

  // Reset on new game
  useEffect(() => {
    if (!gameStarted) {
      setLines([]);
      lastLenRef.current = 0;
      greetedRef.current = false;
    }
  }, [gameStarted]);

  // Greet once per game
  useEffect(() => {
    if (!enabled || !personality || !gameStarted || gameOver) return;
    if (greetedRef.current) return;
    if (moveHistory.length > 0) return;
    greetedRef.current = true;
    if (mode === 'coach') {
      push(coachGreeting(personality));
    } else {
      const g = greetingLine(personality, { playerColor: compColor === 'white' ? 'black' : 'white' });
      push(stripName(g, personality.name));
    }
  }, [enabled, personality, gameStarted, gameOver, moveHistory.length, mode, compColor]);

  // React to new moves
  useEffect(() => {
    if (!enabled || !personality || !gameStarted) return;
    if (moveHistory.length <= lastLenRef.current) {
      lastLenRef.current = moveHistory.length;
      return;
    }
    const lastMove = moveHistory[moveHistory.length - 1];
    lastLenRef.current = moveHistory.length;

    if (mode === 'coach') {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      const side = lastMove.color === (compColor === 'white' ? 'w' : 'b') ? 'coach' : 'user';
      commentOnMoveCoach({
        coach: personality,
        moveHistory,
        fen: lastMove.fen,
        side,
      }).then((text) => {
        if (text) push(text);
      }).catch(() => {}).finally(() => {
        inFlightRef.current = false;
      });
    } else {
      const line = commentOnMove(personality, {
        lastMove,
        botColor: compColor,
        moveCount: moveHistory.length,
      });
      if (line) push(stripName(line, personality.name));
    }
  }, [moveHistory.length, enabled, personality, gameStarted, compColor, mode, moveHistory]);

  if (!enabled || !personality) return null;
  if (mode === 'bot' && (!isComp || isCoachGame)) return null;
  if (mode === 'coach' && !isCoachGame) return null;

  return (
    <div className={styles.card} style={{ '--chip-color': personality.color }}>
      <div className={styles.header}>
        <span className={styles.chip}>
          <svg viewBox="0 0 24 24" className={styles.chipIcon}
            dangerouslySetInnerHTML={{ __html: personality.icon }} />
        </span>
        <div className={styles.headerText}>
          <span className={styles.name}>{personality.name}</span>
          <span className={styles.sub}>
            {mode === 'coach' ? 'Coach' : `Rating ${personality.rating || ''}`}
          </span>
        </div>
        {lines.length > 0 && (
          <button
            className={styles.collapseBtn}
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand chat' : 'Collapse chat'}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▾' : '▴'}
          </button>
        )}
      </div>

      {lines.length > 0 && !collapsed && (
        <div className={styles.bubble} ref={bubbleRef}>
          <span className={styles.tail} />
          {lines.map((l, idx) => {
            const isLatest = idx === lines.length - 1;
            return (
              <div
                key={l.id}
                className={`${styles.line} ${isLatest ? styles.lineLatest : styles.lineOld}`}
              >
                {l.text}
              </div>
            );
          })}
        </div>
      )}
      {lines.length > 0 && collapsed && (
        <div className={styles.collapsedPeek} onClick={toggleCollapsed} title="Expand">
          {lines[lines.length - 1].text}
        </div>
      )}
    </div>
  );
}

function stripName(text, name) {
  if (!text || !name) return text || '';
  const prefix = `${name}: `;
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}
