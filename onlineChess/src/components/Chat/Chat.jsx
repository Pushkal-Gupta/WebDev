import { useState, useRef, useEffect } from 'react';
import styles from './Chat.module.css';

export default function Chat({ messages, onSend, opponentName, myName, isConnected }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    if (!open && messages.length > 0) {
      setUnread(n => n + 1);
    }
  }, [messages.length]);

  const handleOpen = () => { setOpen(true); setUnread(0); };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  };

  return (
    <div className={styles.chatContainer}>
      {/* Toggle button */}
      {!open && (
        <button className={styles.chatToggle} onClick={handleOpen}>
          💬
          {unread > 0 && <span className={styles.badge}>{unread}</span>}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <span className={styles.chatTitle}>Chat</span>
            <div className={styles.chatHeaderRight}>
              <span className={`${styles.connDot} ${isConnected ? styles.connOnline : styles.connOff}`} />
              <span className={styles.connLabel}>{isConnected ? 'Connected' : 'Reconnecting…'}</span>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>×</button>
            </div>
          </div>

          <div className={styles.chatOpponent}>{opponentName || 'Opponent'}</div>

          <div className={styles.messageList} ref={listRef}>
            {messages.length === 0 && (
              <p className={styles.emptyMsg}>No messages yet. Say hello!</p>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.sender === myName;
              return (
                <div key={i} className={`${styles.msgRow} ${isMe ? styles.msgMe : styles.msgThem}`}>
                  <div className={styles.bubble}>
                    <span className={styles.msgText}>{msg.text}</span>
                    <span className={styles.msgTime}>{formatTime(msg.ts)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.inputRow}>
            <input
              className={styles.chatInput}
              placeholder="Message…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              maxLength={200}
            />
            <button className={styles.sendBtn} onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
