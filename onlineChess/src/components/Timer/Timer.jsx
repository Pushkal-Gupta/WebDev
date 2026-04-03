import { useEffect, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import { formatTime } from '../../utils/timeFormatter';
import styles from './Timer.module.css';

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
