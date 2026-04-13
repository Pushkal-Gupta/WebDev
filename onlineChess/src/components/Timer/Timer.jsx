import useGameStore from '../../store/gameStore';
import usePrefsStore from '../../store/prefsStore';
import { formatTime } from '../../utils/timeFormatter';
import styles from './Timer.module.css';

export default function Timer({ color }) {
  const whiteTime = useGameStore(s => s.whiteTime);
  const blackTime = useGameStore(s => s.blackTime);
  const activeColor = useGameStore(s => s.activeColor);
  const timerRunning = useGameStore(s => s.timerRunning);
  const timeControl = useGameStore(s => s.timeControl);
  const lowTimeThreshold = usePrefsStore(s => s.lowTimeThreshold);

  const time = color === 'w' ? whiteTime : blackTime;
  const isActive = activeColor === color && timerRunning;

  if (!timeControl) return null;

  const isLow = time <= (lowTimeThreshold * 1000) && time > 0;

  return (
    <div className={`${styles.timer} ${isActive ? styles.active : ''} ${isLow && isActive ? styles.low : ''}`}>
      {formatTime(time)}
    </div>
  );
}
