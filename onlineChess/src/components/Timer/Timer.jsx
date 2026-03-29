import { useEffect, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import styles from './Timer.module.css';

function formatTime(seconds) {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Timer({ color }) {
  const { whiteTime, blackTime, activeColor, timerRunning, tickTimer, timeControl } = useGameStore();
  const intervalRef = useRef(null);

  const time = color === 'w' ? whiteTime : blackTime;
  const isActive = activeColor === color && timerRunning;

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning, tickTimer]);

  if (!timeControl) return null;

  const isLow = time <= 30 && time > 0;

  return (
    <div className={`${styles.timer} ${isActive ? styles.active : ''} ${isLow && isActive ? styles.low : ''}`}>
      {formatTime(time)}
    </div>
  );
}
