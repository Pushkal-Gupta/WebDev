import { useState } from 'react';
import styles from './OnlineLobby.module.css';
import useAuthStore from '../../store/authStore';

function formatElapsed(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `0:${String(sec).padStart(2, '0')}`;
}

export default function OnlineLobby({
  onCreateRoom, onJoinRoom, onFindGame, onCancelSearch,
  roomId, waitingForOpponent, onCancelWait,
  timeControls, selectedTime, onSelectTime,
  isSearching, searchElapsed, userRating,
}) {
  const { user, username } = useAuthStore();
  const [joinCode, setJoinCode]   = useState('');
  const [joinError, setJoinError] = useState('');
  const [loading, setLoading]     = useState(false);

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

  // ── Searching state ────────────────────────────────────────
  if (isSearching) {
    return (
      <div className={styles.lobbyWrap}>
        <div className={styles.waitCard}>
          <div className={styles.waitSpinner} />
          <h2 className={styles.waitTitle}>Finding opponent…</h2>
          <p className={styles.waitSub}>
            {selectedTime ? `${selectedTime.display} · ${selectedTime.cat}` : ''}&nbsp;
          </p>
          <div className={styles.searchTimer}>{formatElapsed(searchElapsed || 0)}</div>
          {userRating != null && (
            <p className={styles.waitSub}>Your rating: <span className={styles.ratingHighlight}>{userRating}</span></p>
          )}
          <p className={styles.expandNote}>
            {(searchElapsed || 0) < 30 ? 'Matching ±200 rating' :
             (searchElapsed || 0) < 60 ? 'Expanding to ±400…' :
             (searchElapsed || 0) < 90 ? 'Expanding to ±800…' :
             'Any opponent…'}
          </p>
          <button className={styles.cancelBtn} onClick={onCancelSearch}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── Waiting for manual room opponent ──────────────────────
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

  const canFindGame = !!selectedTime; // untimed games can't be auto-matched

  return (
    <div className={styles.lobbyWrap}>
      <div className={styles.lobbyCard}>
        <h2 className={styles.lobbyTitle}>Play Online</h2>
        <p className={styles.lobbySub}>
          Logged in as <span className={styles.lobbyUser}>{username || user?.email}</span>
          {userRating != null && selectedTime && (
            <span className={styles.lobbyRating}> · {selectedTime.cat} {userRating}</span>
          )}
        </p>

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

        {/* Find Game (auto-match) */}
        <button
          className={styles.findGameBtn}
          onClick={() => canFindGame && onFindGame()}
          disabled={!canFindGame || loading}
          title={!canFindGame ? 'Select a time control to find a game' : ''}
        >
          Find Game
          {!canFindGame && <span className={styles.findGameHint}> (select time control)</span>}
        </button>

        <div className={styles.orRow}><span>or play with a friend</span></div>

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
