import { useState } from 'react';
import styles from './OnlineLobby.module.css';
import useAuthStore from '../../store/authStore';

export default function OnlineLobby({ onCreateRoom, onJoinRoom, roomId, waitingForOpponent, onCancelWait, timeControls, selectedTime, onSelectTime }) {
  const { user, username } = useAuthStore();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try { await onCreateRoom(); } catch (e) { setJoinError(e.message); }
    setLoading(false);
  };

  const handleJoin = async () => {
    setJoinError('');
    if (!joinCode.trim()) { setJoinError('Enter a room code.'); return; }
    setLoading(true);
    try { await onJoinRoom(joinCode.trim()); } catch (e) { setJoinError(e.message); }
    setLoading(false);
  };

  if (waitingForOpponent) {
    return (
      <div className={styles.lobbyWrap}>
        <div className={styles.waitCard}>
          <div className={styles.waitSpinner} />
          <h2 className={styles.waitTitle}>Waiting for opponent…</h2>
          <p className={styles.waitSub}>Share this code with a friend</p>
          <div className={styles.roomCodeBox}>{roomId}</div>
          <button className={styles.cancelBtn} onClick={onCancelWait}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.lobbyWrap}>
      <div className={styles.lobbyCard}>
        <h2 className={styles.lobbyTitle}>Play Online</h2>
        <p className={styles.lobbySub}>Logged in as <span className={styles.lobbyUser}>{username || user?.email}</span></p>

        {/* Time control picker */}
        <div className={styles.sectionLabel}>Time Control</div>
        <div className={styles.timeGrid}>
          {timeControls.map(tc => (
            <button
              key={tc.display}
              className={`${styles.timeBtn} ${selectedTime?.display === tc.display ? styles.timeBtnSelected : ''}`}
              onClick={() => onSelectTime(tc)}
            >
              {tc.display}
            </button>
          ))}
          <button
            className={`${styles.timeBtn} ${!selectedTime ? styles.timeBtnSelected : ''}`}
            onClick={() => onSelectTime(null)}
          >
            Untimed
          </button>
        </div>

        <div className={styles.divider} />

        {/* Create room */}
        <button
          className={styles.createBtn}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Create Room'}
        </button>

        <div className={styles.orRow}><span>or join with a code</span></div>

        {/* Join room */}
        <div className={styles.joinRow}>
          <input
            className={styles.codeInput}
            placeholder="ABC123"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            maxLength={6}
          />
          <button className={styles.joinBtn} onClick={handleJoin} disabled={loading}>
            {loading ? '…' : 'Join'}
          </button>
        </div>

        {joinError && <p className={styles.error}>{joinError}</p>}
      </div>
    </div>
  );
}
