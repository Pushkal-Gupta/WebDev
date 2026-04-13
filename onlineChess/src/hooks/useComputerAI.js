import { useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { getBestMove } from '../utils/stockfish';
import { getLocalBestMove } from '../utils/localAI';

/**
 * Handles computer AI move generation.
 * Extracted from App.jsx to reduce god-component complexity.
 * @param {function} setAlertMsg - Callback to show alert messages
 */
export default function useComputerAI(setAlertMsg) {
  const gameStarted = useGameStore(s => s.gameStarted);
  const gameOver = useGameStore(s => s.gameOver);
  const isComp = useGameStore(s => s.isComp);
  const compColor = useGameStore(s => s.compColor);
  const compStrength = useGameStore(s => s.compStrength);
  const compThinking = useGameStore(s => s.compThinking);
  const setCompThinking = useGameStore(s => s.setCompThinking);
  const setDisableBoard = useGameStore(s => s.setDisableBoard);
  const chessInstance = useGameStore(s => s.chessInstance);
  const activeColor = useGameStore(s => s.activeColor);
  const currentMoveIndex = useGameStore(s => s.currentMoveIndex);
  const moveHistory = useGameStore(s => s.moveHistory);

  useEffect(() => {
    if (!gameStarted || gameOver || !isComp || compThinking) return;
    const isCompTurn = (compColor === 'white' && activeColor === 'w') ||
                       (compColor === 'black' && activeColor === 'b');
    if (!isCompTurn) return;
    if (currentMoveIndex !== moveHistory.length - 1) return;

    const makeCompMove = async () => {
      if (!chessInstance) return;
      const fen = chessInstance.fen();
      setCompThinking(true);
      setDisableBoard(true);
      const thinkStart = Date.now();
      try {
        let bestMove;
        if ((compStrength || 4) <= 6) {
          bestMove = getLocalBestMove(fen, compStrength || 4);
        } else {
          try {
            bestMove = await getBestMove(fen, { strength: compStrength || 10 });
          } catch {
            bestMove = getLocalBestMove(fen, compStrength || 8);
          }
        }
        if (!bestMove || bestMove === '(none)') return;
        const elapsed = Date.now() - thinkStart;
        const minThink = 120;
        const remaining = Math.max(0, minThink - elapsed);
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
        const from = bestMove.slice(0, 2);
        const to   = bestMove.slice(2, 4);
        const promotion = bestMove.length === 5 ? bestMove[4] : undefined;
        useGameStore.getState().makeMove(
          { row: 8 - parseInt(from[1]), col: from.charCodeAt(0) - 97 },
          { row: 8 - parseInt(to[1]),   col: to.charCodeAt(0) - 97 },
          promotion,
          true
        );
      } catch (e) {
        console.error('Computer move failed:', e);
        setAlertMsg('Computer move error.');
      } finally {
        setCompThinking(false);
        if (!useGameStore.getState().gameOver) {
          setDisableBoard(false);
          const pm = useGameStore.getState().premove;
          if (pm?.to) {
            setTimeout(() => useGameStore.getState().executePremove(), 50);
          }
        }
      }
    };

    const clockKey2 = (compColor === 'white' ? 'whiteTime' : 'blackTime');
    const bt = useGameStore.getState()[clockKey2] || 60_000;
    const initDelay = bt < 30_000 ? 50 : bt < 120_000 ? 150 : 300;
    const t = setTimeout(makeCompMove, initDelay);
    return () => clearTimeout(t);
  }, [activeColor, gameStarted, gameOver, isComp, compColor, compStrength, compThinking, currentMoveIndex, chessInstance, moveHistory.length]);
}
