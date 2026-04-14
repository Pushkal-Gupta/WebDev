import { useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';
import usePrefsStore from '../../store/prefsStore';
import { getBotByStrength } from '../../data/bots';
import { commentOnMove, greetingLine } from '../../utils/botCommentary';
import styles from './BotCommentaryStrip.module.css';

const TOAST_TTL = 8000;
let toastId = 1;

export default function BotCommentaryStrip() {
  const enabled = usePrefsStore((s) => s.botCommentaryEnabled);
  const isComp = useGameStore((s) => s.isComp);
  const compStrength = useGameStore((s) => s.compStrength);
  const compColor = useGameStore((s) => s.compColor);
  const gameStarted = useGameStore((s) => s.gameStarted);
  const gameOver = useGameStore((s) => s.gameOver);
  const moveHistory = useGameStore((s) => s.moveHistory);

  const [toasts, setToasts] = useState([]);
  const lastLenRef = useRef(0);
  const greetedRef = useRef(false);

  const personality = isComp ? getBotByStrength(compStrength) : null;

  const pushToast = (text) => {
    if (!text) return;
    const id = `t${toastId++}`;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_TTL);
  };

  // Greet on game start
  useEffect(() => {
    if (!enabled || !isComp || !gameStarted || gameOver) {
      greetedRef.current = false;
      return;
    }
    if (!greetedRef.current && moveHistory.length === 0 && personality) {
      greetedRef.current = true;
      const line = greetingLine(personality, { playerColor: compColor === 'white' ? 'black' : 'white' });
      pushToast(line);
    }
  }, [enabled, isComp, gameStarted, gameOver, moveHistory.length, personality, compColor]);

  // Comment on new moves
  useEffect(() => {
    if (!enabled || !isComp || !gameStarted || gameOver || !personality) {
      lastLenRef.current = moveHistory.length;
      return;
    }
    if (moveHistory.length > lastLenRef.current) {
      const lastMove = moveHistory[moveHistory.length - 1];
      const line = commentOnMove(personality, {
        lastMove,
        botColor: compColor,
        moveCount: moveHistory.length,
      });
      if (line) pushToast(line);
    }
    lastLenRef.current = moveHistory.length;
  }, [moveHistory.length, enabled, isComp, gameStarted, gameOver, personality, compColor, moveHistory]);

  if (!enabled || !isComp || !personality) return null;

  return (
    <div className={styles.strip}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={styles.toast}
          style={{ '--bot-color': personality.color }}
        >
          <svg
            className={styles.icon}
            width="22"
            height="22"
            viewBox="0 0 24 24"
            dangerouslySetInnerHTML={{ __html: personality.icon }}
          />
          <div className={styles.body}>
            <span className={styles.name}>{personality.name}</span>
            {t.text.replace(new RegExp(`^${personality.name}:\\s*`), '')}
          </div>
        </div>
      ))}
    </div>
  );
}
