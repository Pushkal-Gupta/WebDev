import { useCallback, useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';
import usePrefsStore from '../../store/prefsStore';
import { getBotById, getBotByStrength } from '../../data/bots';
import { getCoachById } from '../../data/coaches';
import { commentOnMove, greetingLine } from '../../utils/botCommentary';
import { commentOnMoveCoach, coachGreeting } from '../../utils/coachCommentary';
import { runIntent, INTENTS } from '../../utils/coachActions';
import { CLASSIFICATIONS } from '../../utils/reviewEngine';
import styles from './BotChatCard.module.css';

/**
 * Dashboard-style persona module for computer + coach games.
 * Replaces the old floating speech bubble with a dense stack of cards:
 *   - Persona strip (small chip + name + role)
 *   - Insight line (one sentence, no bubble tail)
 *   - Move feedback (classification icon + label) — when a review is available
 *   - Coach accordions (Why / Best line / Plan) — coach mode only, on demand
 */
export default function BotChatCard({ mode = 'bot', reviewResult = null }) {
  const enabled = usePrefsStore((s) =>
    mode === 'coach' ? s.coachEnabled : s.botCommentaryEnabled
  );
  const isComp          = useGameStore((s) => s.isComp);
  const isCoachGame     = useGameStore((s) => s.isCoachGame);
  const compStrength    = useGameStore((s) => s.compStrength);
  const compColor       = useGameStore((s) => s.compColor);
  const selectedBotId   = useGameStore((s) => s.selectedBotId);
  const selectedCoachId = useGameStore((s) => s.selectedCoachId);
  const gameStarted     = useGameStore((s) => s.gameStarted);
  const gameOver        = useGameStore((s) => s.gameOver);
  const moveHistory     = useGameStore((s) => s.moveHistory);

  const personality = mode === 'coach'
    ? getCoachById(selectedCoachId)
    : (isComp
        ? (getBotById(selectedBotId) || getBotByStrength(compStrength))
        : null);

  const [insight, setInsight]     = useState('');
  const [openAcc, setOpenAcc]     = useState(null);        // 'why' | 'best' | 'plan' | null
  const [accContent, setAccContent] = useState({ why: null, best: null, plan: null });
  const [loadingAcc, setLoadingAcc] = useState(null);       // intent id currently loading

  const lastLenRef = useRef(0);
  const greetedRef = useRef(false);
  const inFlightRef = useRef(false);
  const lastCommentedMoveRef = useRef(-1);   // idx of last move that produced an insight

  const reset = () => {
    setInsight('');
    setOpenAcc(null);
    setAccContent({ why: null, best: null, plan: null });
    lastLenRef.current = 0;
    greetedRef.current = false;
    lastCommentedMoveRef.current = -1;
    inFlightRef.current = false;
  };

  useEffect(() => {
    if (!gameStarted) reset();
  }, [gameStarted]);

  // Invalidate cached accordion content when position advances.
  // Keep the currently-open accordion open — content will either refresh
  // automatically on next click, or the user can close it manually.
  useEffect(() => {
    setAccContent({ why: null, best: null, plan: null });
  }, [moveHistory.length]);

  // Greet once per game
  useEffect(() => {
    if (!enabled || !personality || !gameStarted || gameOver) return;
    if (greetedRef.current) return;
    if (moveHistory.length > 0) return;
    greetedRef.current = true;
    if (mode === 'coach') {
      setInsight(coachGreeting(personality));
    } else {
      const g = greetingLine(personality, { playerColor: compColor === 'white' ? 'black' : 'white' });
      setInsight(stripName(g, personality.name));
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
        if (text) setInsight(text);
      }).catch(() => {}).finally(() => {
        inFlightRef.current = false;
      });
    } else {
      // Throttle: if we already commented within the last ply, skip this one
      // to avoid spam. Ensures a comment appears at most every ~2 half-moves.
      const movesSince = moveHistory.length - lastCommentedMoveRef.current;
      if (movesSince < 2 && lastCommentedMoveRef.current > 0) return;
      const line = commentOnMove(personality, {
        lastMove,
        botColor: compColor,
        moveCount: moveHistory.length,
      });
      if (line) {
        setInsight(stripName(line, personality.name));
        lastCommentedMoveRef.current = moveHistory.length;
      }
    }
  }, [moveHistory.length, enabled, personality, gameStarted, compColor, mode, moveHistory]);

  const toggleAcc = useCallback(async (key, intent) => {
    // Collapse if already open
    if (openAcc === key) { setOpenAcc(null); return; }
    setOpenAcc(key);
    if (accContent[key] || loadingAcc === intent) return;
    setLoadingAcc(intent);
    try {
      const fen = moveHistory[moveHistory.length - 1]?.fen
        || (useGameStore.getState().chessInstance?.fen() || null);
      const msg = await runIntent(intent, { fen, moveHistory });
      setAccContent((prev) => ({ ...prev, [key]: msg?.text || 'No information available.' }));
    } catch {
      setAccContent((prev) => ({ ...prev, [key]: 'Failed to compute.' }));
    } finally {
      setLoadingAcc(null);
    }
  }, [openAcc, accContent, loadingAcc, moveHistory]);

  if (!enabled || !personality) return null;
  if (mode === 'bot' && (!isComp || isCoachGame)) return null;
  if (mode === 'coach' && !isCoachGame) return null;

  const cls = reviewResult?.classification
    ? CLASSIFICATIONS[reviewResult.classification]
    : null;

  return (
    <div className={styles.card} style={{ '--chip-color': personality.color }}>
      {/* Persona strip */}
      <div className={styles.personaRow}>
        <span className={styles.chip}>
          <svg viewBox="0 0 24 24" className={styles.chipIcon}
            dangerouslySetInnerHTML={{ __html: personality.icon }} />
        </span>
        <div className={styles.personaText}>
          <span className={styles.name}>{personality.name}</span>
          <span className={styles.role}>
            {mode === 'coach' ? 'Coach' : `${personality.rating}`}
            {mode !== 'coach' && <span className={styles.roleDim}> · bot</span>}
          </span>
        </div>
      </div>

      {/* One-line insight */}
      {insight && (
        <div className={styles.insightRow}>
          <span className={styles.insightBar} />
          <span className={styles.insightText}>{insight}</span>
        </div>
      )}

      {/* Move feedback (classification) */}
      {cls && (
        <div className={styles.feedback} style={{ '--cls-color': cls.color }}>
          <span className={styles.feedbackIcon}>{cls.symbol}</span>
          <span className={styles.feedbackLabel}>{cls.label}</span>
          {reviewResult?.bestSan && reviewResult.bestSan !== reviewResult.san && (
            <span className={styles.feedbackAlt}>
              Best: <b>{reviewResult.bestSan}</b>
            </span>
          )}
        </div>
      )}

      {/* Coach accordions */}
      {mode === 'coach' && moveHistory.length > 0 && (
        <div className={styles.accordions}>
          <AccRow
            label="Why it matters"
            open={openAcc === 'why'}
            loading={loadingAcc === INTENTS.REVIEW_LAST}
            onClick={() => toggleAcc('why', INTENTS.REVIEW_LAST)}
            content={accContent.why}
          />
          <AccRow
            label="Best line"
            open={openAcc === 'best'}
            loading={loadingAcc === INTENTS.BEST_MOVE}
            onClick={() => toggleAcc('best', INTENTS.BEST_MOVE)}
            content={accContent.best}
          />
          <AccRow
            label="Plan"
            open={openAcc === 'plan'}
            loading={loadingAcc === INTENTS.THREATS}
            onClick={() => toggleAcc('plan', INTENTS.THREATS)}
            content={accContent.plan}
          />
        </div>
      )}
    </div>
  );
}

function AccRow({ label, open, loading, onClick, content }) {
  return (
    <div className={`${styles.acc} ${open ? styles.accOpen : ''}`}>
      <button className={styles.accHead} onClick={onClick}
        aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} ${label}`}>
        <span className={styles.accCaret}>{open ? '▾' : '▸'}</span>
        <span className={styles.accLabel}>{label}</span>
        {loading && <span className={styles.accSpin} />}
      </button>
      {open && (
        <div className={styles.accBody}>
          {content ? renderMarkdownInline(content) : (loading ? '…' : 'Tap to load')}
        </div>
      )}
    </div>
  );
}

function renderMarkdownInline(text) {
  // Preserve simple **bold** and _italic_ in accordion bodies.
  const parts = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let i = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) parts.push(text.slice(i, m.index));
    const chunk = m[0];
    if (chunk.startsWith('**')) parts.push(<strong key={`b${m.index}`}>{chunk.slice(2, -2)}</strong>);
    else parts.push(<em key={`e${m.index}`}>{chunk.slice(1, -1)}</em>);
    i = m.index + chunk.length;
  }
  if (i < text.length) parts.push(text.slice(i));
  return <>{parts.map((p, idx) => typeof p === 'string'
    ? p.split('\n').map((line, j, arr) => <span key={`${idx}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>)
    : p)}</>;
}

function stripName(text, name) {
  if (!text || !name) return text || '';
  const prefix = `${name}: `;
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}
