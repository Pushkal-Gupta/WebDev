import { useState, useEffect, useRef } from 'react';
import styles from './FriendsPage.module.css';
import useFriendStore from '../../store/friendStore';
import useNotificationStore from '../../store/notificationStore';
import useAuthStore from '../../store/authStore';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Friends tab ────────────────────────────────────────────────────────────

function FriendsTab({ userId }) {
  const { friends, loading, removeRequest } = useFriendStore();
  const [removing, setRemoving] = useState(null);

  const handleUnfriend = async (friendshipId) => {
    setRemoving(friendshipId);
    try { await removeRequest(friendshipId, userId); } catch {}
    setRemoving(null);
  };

  if (loading) return <div className={styles.empty}>Loading…</div>;
  if (!friends.length) return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>♟</div>
      <div>No friends yet. Use "Find Players" to connect with others.</div>
    </div>
  );

  return (
    <div className={styles.list}>
      {friends.map(f => (
        <div key={f.userId} className={styles.friendRow}>
          <div className={styles.friendAvatar}>{(f.username || '?')[0].toUpperCase()}</div>
          <div className={styles.friendInfo}>
            <div className={styles.friendName}>{f.username}</div>
            {f.rating && <div className={styles.friendRating}>{f.rating}</div>}
          </div>
          <button
            className={styles.dangerBtn}
            onClick={() => handleUnfriend(f.friendshipId)}
            disabled={removing === f.friendshipId}
          >
            {removing === f.friendshipId ? '…' : 'Unfriend'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Requests tab ───────────────────────────────────────────────────────────

function RequestsTab({ userId }) {
  const { incoming, outgoing, acceptRequest, removeRequest, loading } = useFriendStore();
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const [acting, setActing] = useState(null);

  const friendNotifs = notifications.filter(
    n => (n.type === 'friend_request' || n.type === 'friend_accepted') && !n.read
  );

  const handleAccept = async (req) => {
    setActing(req.id);
    try { await acceptRequest(req.id, userId); } catch {}
    setActing(null);
  };

  const handleDecline = async (req) => {
    setActing(req.id);
    try { await removeRequest(req.id, userId); } catch {}
    setActing(null);
  };

  return (
    <div className={styles.requestsWrap}>
      {/* Notification banner */}
      {friendNotifs.length > 0 && (
        <div className={styles.notifBanner}>
          <span>{friendNotifs.length} unread notification{friendNotifs.length > 1 ? 's' : ''}</span>
          <button className={styles.markAllBtn} onClick={() => markAllRead(userId)}>
            Mark all read
          </button>
        </div>
      )}

      {/* Recent notifications */}
      {notifications.length > 0 && (
        <div className={styles.notifSection}>
          <div className={styles.sectionLabel}>Notifications</div>
          <div className={styles.notifList}>
            {notifications.slice(0, 8).map(n => (
              <div
                key={n.id}
                className={`${styles.notifRow} ${!n.read ? styles.notifUnread : ''}`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <span className={styles.notifDot} />
                <div className={styles.notifBody}>
                  <div className={styles.notifTitle}>{n.title}</div>
                  {n.body && <div className={styles.notifText}>{n.body}</div>}
                </div>
                <div className={styles.notifAge}>{timeAgo(n.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming requests */}
      <div className={styles.sectionLabel}>
        Incoming {incoming.length > 0 && <span className={styles.badge}>{incoming.length}</span>}
      </div>
      {loading && <div className={styles.empty}>Loading…</div>}
      {!loading && incoming.length === 0 && (
        <div className={styles.empty} style={{padding:'12px 0'}}>No incoming requests.</div>
      )}
      <div className={styles.list}>
        {incoming.map(req => (
          <div key={req.id} className={styles.requestRow}>
            <div className={styles.requestInfo}>
              <div className={styles.requestAvatar}>
                {(req.data?.from_username || '?')[0].toUpperCase()}
              </div>
              <div>
                <div className={styles.friendName}>{req.data?.from_username || 'Unknown'}</div>
                <div className={styles.requestAge}>{timeAgo(req.created_at)}</div>
              </div>
            </div>
            <div className={styles.requestActions}>
              <button
                className={styles.acceptBtn}
                onClick={() => handleAccept(req)}
                disabled={acting === req.id}
              >
                {acting === req.id ? '…' : 'Accept'}
              </button>
              <button
                className={styles.declineBtn}
                onClick={() => handleDecline(req)}
                disabled={acting === req.id}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Outgoing requests */}
      {outgoing.length > 0 && (
        <>
          <div className={styles.sectionLabel} style={{marginTop:20}}>Sent</div>
          <div className={styles.list}>
            {outgoing.map(req => (
              <div key={req.id} className={styles.requestRow}>
                <div className={styles.requestInfo}>
                  <div className={styles.requestAvatar}>?</div>
                  <div>
                    <div className={styles.friendName}>Pending…</div>
                    <div className={styles.requestAge}>{timeAgo(req.created_at)}</div>
                  </div>
                </div>
                <button
                  className={styles.dangerBtn}
                  onClick={() => handleDecline(req)}
                  disabled={acting === req.id}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Find Players tab ───────────────────────────────────────────────────────

function FindTab({ userId }) {
  const { searchResults, searchLoading, searchPlayers, clearSearch, sendRequest, getFriendshipStatus, getFriendshipId, removeRequest } = useFriendStore();
  const [query, setQuery] = useState('');
  const [acting, setActing] = useState(null);
  const [localStatus, setLocalStatus] = useState({}); // userId → status after action
  const debounceRef = useRef(null);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { clearSearch(); return; }
    debounceRef.current = setTimeout(() => searchPlayers(val, userId), 300);
  };

  const handleSend = async (targetId) => {
    setActing(targetId);
    try {
      await sendRequest(userId, targetId);
      setLocalStatus(s => ({ ...s, [targetId]: 'outgoing' }));
    } catch {}
    setActing(null);
  };

  const handleCancel = async (targetId) => {
    const fid = getFriendshipId(targetId);
    if (!fid) return;
    setActing(targetId);
    try {
      await removeRequest(fid, userId);
      setLocalStatus(s => ({ ...s, [targetId]: 'none' }));
    } catch {}
    setActing(null);
  };

  useEffect(() => () => clearSearch(), []); // eslint-disable-line

  return (
    <div className={styles.findWrap}>
      <div className={styles.searchBox}>
        <input
          className={styles.searchInput}
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by username…"
          autoComplete="off"
        />
        {searchLoading && <span className={styles.searchSpinner}>⟳</span>}
      </div>

      {query && !searchLoading && searchResults.length === 0 && (
        <div className={styles.empty}>No players found for "{query}"</div>
      )}

      <div className={styles.list}>
        {searchResults.map(p => {
          const status = localStatus[p.user_id] ?? getFriendshipStatus(p.user_id);
          const isActing = acting === p.user_id;
          return (
            <div key={p.user_id} className={styles.playerRow}>
              <div className={styles.friendAvatar}>{(p.username || '?')[0].toUpperCase()}</div>
              <div className={styles.friendInfo}>
                <div className={styles.friendName}>{p.username}</div>
                {p.rating && <div className={styles.friendRating}>{p.rating} rated</div>}
              </div>
              {status === 'friends' && (
                <span className={styles.friendsBadge}>Friends ✓</span>
              )}
              {status === 'outgoing' && (
                <button className={styles.cancelBtn} onClick={() => handleCancel(p.user_id)} disabled={isActing}>
                  {isActing ? '…' : 'Cancel'}
                </button>
              )}
              {status === 'incoming' && (
                <span className={styles.incomingBadge}>Sent you a request</span>
              )}
              {status === 'none' && (
                <button className={styles.addBtn} onClick={() => handleSend(p.user_id)} disabled={isActing}>
                  {isActing ? '…' : '+ Add'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main FriendsPage ───────────────────────────────────────────────────────

export default function FriendsPage() {
  const { user } = useAuthStore();
  const { loadFriends, incoming } = useFriendStore();
  const { notifications, unreadCount } = useNotificationStore();
  const [tab, setTab] = useState('friends');

  const friendNotifCount = notifications.filter(
    n => (n.type === 'friend_request' || n.type === 'friend_accepted') && !n.read
  ).length;

  useEffect(() => {
    if (user?.id) loadFriends(user.id);
  }, [user?.id]); // eslint-disable-line

  if (!user) return (
    <div className={styles.page}>
      <div className={styles.empty}>Sign in to use Friends.</div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Friends</h2>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'friends' ? styles.tabActive : ''}`} onClick={() => setTab('friends')}>
          Friends
          {incoming.length > 0 && tab !== 'requests' && (
            <span className={styles.tabBadge}>{incoming.length}</span>
          )}
        </button>
        <button className={`${styles.tab} ${tab === 'requests' ? styles.tabActive : ''}`} onClick={() => setTab('requests')}>
          Requests
          {(incoming.length > 0 || friendNotifCount > 0) && (
            <span className={styles.tabBadge}>{incoming.length + friendNotifCount}</span>
          )}
        </button>
        <button className={`${styles.tab} ${tab === 'find' ? styles.tabActive : ''}`} onClick={() => setTab('find')}>
          Find Players
        </button>
      </div>

      <div className={styles.content}>
        {tab === 'friends'  && <FriendsTab  userId={user.id} />}
        {tab === 'requests' && <RequestsTab userId={user.id} />}
        {tab === 'find'     && <FindTab     userId={user.id} />}
      </div>
    </div>
  );
}
