import useGameStore from '../../store/gameStore';
import { formatTime } from '../../utils/timeFormatter';
import styles from './Timer.module.css';

export default function Timer({ color }) {
  const { whiteTime, blackTime, activeColor, timerRunning, timeControl } = useGameStore();

  const time = color === 'w' ? whiteTime : blackTime;
  const isActive = activeColor === color && timerRunning;

  if (!timeControl) return null;

  const isLow = time <= 10_000 && time > 0;

  return (
    <div className={`${styles.timer} ${isActive ? styles.active : ''} ${isLow && isActive ? styles.low : ''}`}>
      {formatTime(time)}
    </div>
  );
}
