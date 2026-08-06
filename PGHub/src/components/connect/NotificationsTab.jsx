import { useEffect, useState, useCallback } from 'react';
import { Bell, UserPlus, Heart, MessageCircle, Check, Trash2, Loader2 } from 'lucide-react';
import { getNotifications, markAllRead, clearNotifications, markOneRead } from '../../lib/notifications';
import './NotificationsTab.css';

function Avatar({ url, name, size = 40 }) {
  if (url) return <img className="pgc-av" src={url} alt="" style={{ width: size, height: size }} />;
  return (
    <span className="pgc-av pgc-av-ph" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {(name || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (!then || Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const wks = Math.floor(days / 7);
  return `${wks}w`;
}

const TYPE_ICON = {
  follow: UserPlus,
  like: Heart,
  reply: MessageCircle,
};

const TYPE_TEXT = {
  follow: 'started following you',
  like: 'liked your post',
  reply: 'replied to your post',
};

export default function NotificationsTab({ user }) {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    const rows = await getNotifications(user.id);
    setItems(Array.isArray(rows) ? rows : []);
  }, [user.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const unread = (items || []).filter((n) => n.read === false).length;

  const handleMarkAll = async () => {
    try { await markAllRead(user.id); await load(); } catch { /* ignore */ }
  };

  const handleClear = async () => {
    const snapshot = items;
    setItems([]);
    try { await clearNotifications(user.id); } catch { setItems(snapshot); }
  };

  const openActor = (item) => {
    if (!item.actor_id) return;
    window.dispatchEvent(new CustomEvent('pg:view-profile', { detail: { id: item.actor_id, name: item.actorName } }));
    setItems((prev) => (prev || []).map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    markOneRead(user.id, item.id); // persist read state (component unmounts on navigation)
  };

  if (items === null) {
    return (
      <div className="pgc-notif">
        <div className="pgc-notif-loading"><Loader2 size={22} className="pgc-spin" /></div>
      </div>
    );
  }

  return (
    <div className="pgc-notif">
      <div className="pgc-notif-head">
        <h2 className="pgc-notif-title">Notifications</h2>
        <div className="pgc-notif-actions">
          {unread > 0 && (
            <button type="button" className="pgc-notif-btn" onClick={handleMarkAll}>
              <Check size={14} /> Mark all read
            </button>
          )}
          {items.length > 0 && (
            <button type="button" className="pgc-notif-btn pgc-notif-btn-danger" onClick={handleClear}>
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="pgc-notif-empty">
          <Bell size={40} />
          <p className="pgc-notif-empty-title">No notifications yet</p>
          <p className="pgc-notif-empty-hint">Follows, likes, and replies to your posts show up here.</p>
        </div>
      ) : (
        <ul className="pgc-notif-list">
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type] || Bell;
            const showSnippet = (item.type === 'like' || item.type === 'reply') && item.postSnippet;
            return (
              <li
                key={item.id}
                className={`pgc-notif-item${item.read === false ? ' pgc-notif-unread' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => openActor(item)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openActor(item); } }}
              >
                <div className="pgc-notif-avwrap">
                  <Avatar url={item.actorAvatar} name={item.actorName} size={40} />
                  <span className={`pgc-notif-badge pgc-notif-badge-${item.type}`}>
                    <Icon size={11} />
                  </span>
                </div>
                <div className="pgc-notif-body">
                  <p className="pgc-notif-text">
                    <b>{item.actorName}</b> {TYPE_TEXT[item.type] || 'sent you a notification'}
                  </p>
                  {showSnippet && <p className="pgc-notif-snippet">{item.postSnippet}</p>}
                </div>
                <div className="pgc-notif-meta">
                  {item.read === false && <span className="pgc-notif-dot" />}
                  <span className="pgc-notif-time">{timeAgo(item.created_at)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
