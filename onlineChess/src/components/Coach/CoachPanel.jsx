import { useState, useEffect, useCallback, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import { getPositionOverview, getProgressiveHint, explainEvalChange } from '../../utils/coachEngine';
import { getBestMove } from '../../utils/stockfish';
import { getLocalBestMove } from '../../utils/localAI';
import styles from './CoachPanel.module.css';

const HINT_LEVELS = ['Idea', 'Piece', 'Direction', 'Move'];

export default function CoachPanel() {
  const chessInstance = useGameStore(s => s.chessInstance);
  const gameStarted = useGameStore(s => s.gameStarted);
  const gameOver = useGameStore(s => s.gameOver);
  const activeColor = useGameStore(s => s.activeColor);
  const moveHistory = useGameStore(s => s.moveHistory);
  const currentMoveIndex = useGameStore(s => s.currentMoveIndex);

  const [overview, setOverview] = useState([]);
  const [hintLevel, setHintLevel] = useState(-1);
  const [hintText, setHintText] = useState('');
  const [bestMove, setBestMove] = useState(null); // { san, uci }
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const fen = chessInstance?.fen() || null;

  // Update position overview when FEN changes
  useEffect(() => {
    if (!fen || !gameStarted) return;
    const sections = getPositionOverview(fen);
    setOverview(sections);
    setHintLevel(-1);
    setHintText('');
    setBestMove(null);
  }, [fen, gameStarted]);

  // Add coach messages on move
  useEffect(() => {
    if (!gameStarted || moveHistory.length === 0) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    if (currentMoveIndex !== moveHistory.length - 1) return;

    const msg = {
      id: Date.now(),
      type: 'move',
      text: `${lastMove.color === 'w' ? 'White' : 'Black'} played ${lastMove.san}.`,
    };
    setMessages(prev => [...prev.slice(-20), msg]);
  }, [moveHistory.length, currentMoveIndex, gameStarted]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGetHint = useCallback(async () => {
    if (!fen || loading) return;

    const nextLevel = hintLevel + 1;
    if (nextLevel > 3) return;

    // Fetch best move on first hint request
    if (!bestMove) {
      setLoading(true);
      try {
        let uci;
        try {
          uci = await getBestMove(fen, { strength: 8 });
        } catch {
          uci = getLocalBestMove(fen, 6);
        }

        if (uci && uci !== '(none)') {
          // Convert UCI to SAN
          const { Chess } = await import('chess.js');
          const chess = new Chess(fen);
          const result = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
          const san = result?.san || uci;
          setBestMove({ san, uci });

          const hint = getProgressiveHint(fen, san, uci, 0);
          setHintLevel(0);
          setHintText(hint);
          setMessages(prev => [...prev.slice(-20), { id: Date.now(), type: 'hint', level: 0, text: hint }]);
        }
      } catch (e) {
        setHintText('Could not analyze this position.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Progressive hint
    const hint = getProgressiveHint(fen, bestMove.san, bestMove.uci, nextLevel);
    setHintLevel(nextLevel);
    setHintText(hint);
    setMessages(prev => [...prev.slice(-20), { id: Date.now(), type: 'hint', level: nextLevel, text: hint }]);
  }, [fen, loading, hintLevel, bestMove]);

  const handleOverview = useCallback(() => {
    if (!fen) return;
    const sections = getPositionOverview(fen);
    setOverview(sections);
    const overviewText = sections.map(s => `${s.title}: ${s.text}`).join(' ');
    setMessages(prev => [...prev.slice(-20), { id: Date.now(), type: 'overview', text: overviewText }]);
  }, [fen]);

  if (!gameStarted) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>Coach</div>
        <div className={styles.empty}>Start a game to get coaching advice.</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        Coach
        {gameOver && <span className={styles.badge}>Game Over</span>}
      </div>

      {/* Position overview cards */}
      {overview.length > 0 && (
        <div className={styles.overviewGrid}>
          {overview.map((s, i) => (
            <div key={i} className={styles.overviewCard}>
              <div className={styles.overviewTitle}>{s.title}</div>
              <div className={styles.overviewText}>{s.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Message history */}
      <div className={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.msg} ${styles[`msg_${msg.type}`]}`}>
            {msg.type === 'hint' && (
              <span className={styles.hintBadge}>{HINT_LEVELS[msg.level]}</span>
            )}
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Current hint display */}
      {hintText && (
        <div className={styles.hintBox}>
          <div className={styles.hintHeader}>
            Hint ({HINT_LEVELS[hintLevel]})
          </div>
          <div className={styles.hintContent}>{hintText}</div>
        </div>
      )}

      {/* Action buttons */}
      {!gameOver && (
        <div className={styles.actions}>
          <button
            className={styles.hintBtn}
            onClick={handleGetHint}
            disabled={loading || hintLevel >= 3}
          >
            {loading ? 'Thinking...' : hintLevel < 0 ? 'Get Hint' : hintLevel < 3 ? 'More Detail' : 'Move Shown'}
          </button>
          <button className={styles.overviewBtn} onClick={handleOverview}>
            Overview
          </button>
        </div>
      )}
    </div>
  );
}
