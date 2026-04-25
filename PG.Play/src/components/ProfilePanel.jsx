// ProfilePanel — slide-in drawer.
//
// Header: large monogram avatar, display-font name, edit-name pencil.
// Stats strip: achievements unlocked, total runs, games with bests.
// "My bests" lists every game with a recorded best, click → /game/:id.
// Achievements grid keeps the existing semantic shape, restyled to match.
// Sign out lives at the bottom; Esc closes.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '../icons.jsx';
import { ACHIEVEMENTS } from '../hooks/useAchievements.js';
import { GAMES } from '../data.js';
import { supabase } from '../supabase.js';

const PENCIL = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>
  </svg>
);

function monogram(user) {
  if (!user) return 'PG';
  const meta = user.user_metadata || {};
  const name = meta.display_name || meta.full_name || meta.name || '';
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return (user.email || 'PG').slice(0, 2).toUpperCase();
}

function displayName(user) {
  if (!user) return 'Guest';
  const meta = user.user_metadata || {};
  return meta.display_name || meta.full_name || meta.name || (user.email || '').split('@')[0] || 'Player';
}

function fmtBest(b) {
  if (b == null) return '—';
  if (typeof b !== 'number') return String(b);
  return b.toLocaleString();
}

export default function ProfilePanel({
  user, bests, unlocked, onOpenAuth, onSignOut, onClose,
}) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const [editing, setEditing]   = useState(false);
  const [nameDraft, setNameDraft] = useState(() => displayName(user));
  const [savingName, setSavingName] = useState(false);
  const inputRef = useRef(null);
  const drawerRef = useRef(null);

  // Esc-to-close + Tab-trap inside the drawer so focus can't leak back to
  // the page underneath while the dialog is open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const totalBests   = Object.keys(bests || {}).length;
  const totalPlays   = Object.values(bests || {}).reduce((s, b) => s + (b.plays || 0), 0);
  const unlockedCt   = Object.values(unlocked || {}).filter(Boolean).length;
  const totalCt      = ACHIEVEMENTS.length;

  // "My bests" — list every game id that has a stored best, hydrated with
  // the registry's display name + cover lookup if available.
  const bestsRows = useMemo(() => {
    const rows = Object.entries(bests || {})
      .map(([id, b]) => {
        const g = GAMES.find((x) => x.id === id);
        return {
          id,
          name: g?.name || id,
          playable: !!g?.playable,
          best: b?.best,
          plays: b?.plays || 0,
        };
      })
      .sort((a, b) => (b.best ?? 0) - (a.best ?? 0));
    return rows;
  }, [bests]);

  const saveName = async () => {
    if (!user) return;
    const v = nameDraft.trim();
    if (!v) { setEditing(false); return; }
    setSavingName(true);
    try {
      await supabase.auth.updateUser({ data: { display_name: v } });
    } catch { /* noop — UI optimism */ }
    setSavingName(false);
    setEditing(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="profile-backdrop"
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.aside
        key="profile-drawer"
        ref={drawerRef}
        className="drawer profile-v2 glass-strong"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        initial={reduced ? { opacity: 0 } : { opacity: 0, x: 32 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, x: 32 }}
        transition={{ duration: reduced ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="drawer-head">
          <h2 id="profile-title" className="drawer-title">Profile</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close profile">{Icon.close}</button>
        </div>

        <div className="drawer-body">
          {/* Hero */}
          <div className="profile-v2-hero">
            <div className="profile-v2-avatar" aria-hidden="true">{monogram(user)}</div>
            <div className="profile-v2-id">
              {user && editing ? (
                <div className="profile-v2-name-edit">
                  <input
                    ref={inputRef}
                    className="profile-v2-name-input"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') { setEditing(false); setNameDraft(displayName(user)); }
                    }}
                    maxLength={40}
                    aria-label="Display name"
                  />
                  <button className="btn btn-primary btn-sm" onClick={saveName} disabled={savingName}>
                    {savingName ? '…' : 'Save'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setNameDraft(displayName(user)); }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="profile-v2-name-row">
                  <div className="profile-v2-name">{displayName(user)}</div>
                  {user && (
                    <button
                      className="profile-v2-edit"
                      onClick={() => { setNameDraft(displayName(user)); setEditing(true); }}
                      aria-label="Edit display name"
                      type="button">
                      {PENCIL}
                    </button>
                  )}
                </div>
              )}
              <div className="profile-v2-handle">
                {user ? user.email : 'Not signed in — local progress only.'}
              </div>
              {!user && (
                <button className="btn btn-primary btn-sm profile-v2-cta" onClick={onOpenAuth}>
                  Sign in to sync
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stat-grid">
            <div className="profile-stat-cell">
              <div className="profile-stat-v2-v">
                <span className="numeric">{unlockedCt}</span>
                <span className="profile-stat-v2-of">/{totalCt}</span>
              </div>
              <div className="profile-stat-v2-l">Achievements</div>
            </div>
            <div className="profile-stat-cell">
              <div className="profile-stat-v2-v"><span className="numeric">{totalBests}</span></div>
              <div className="profile-stat-v2-l">Games tracked</div>
            </div>
            <div className="profile-stat-cell">
              <div className="profile-stat-v2-v"><span className="numeric">{totalPlays}</span></div>
              <div className="profile-stat-v2-l">Runs recorded</div>
            </div>
          </div>

          {/* My bests */}
          <section>
            <div className="profile-v2-section-head">
              <span className="profile-v2-kicker">My bests</span>
              <span className="profile-v2-count">{bestsRows.length}</span>
            </div>
            {bestsRows.length === 0 ? (
              <div className="profile-v2-empty">
                Play a game and your best score lands here.
              </div>
            ) : (
              <div className="profile-bests-list">
                {bestsRows.map((r) => (
                  <button
                    key={r.id}
                    className="profile-bests-row"
                    onClick={() => { onClose(); if (r.playable) navigate(`/game/${r.id}`); }}
                    disabled={!r.playable}>
                    <span className="profile-bests-name">{r.name}</span>
                    <span className="profile-bests-meta">
                      <span className="profile-bests-plays">
                        <span className="numeric">{r.plays}</span> run{r.plays === 1 ? '' : 's'}
                      </span>
                      <span className="profile-bests-best numeric">{fmtBest(r.best)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Achievements */}
          <section>
            <div className="profile-v2-section-head">
              <span className="profile-v2-kicker">Achievements</span>
              <span className="profile-v2-count">
                <span className="numeric">{unlockedCt}</span>/{totalCt}
              </span>
            </div>
            <div className="ach-list">
              {ACHIEVEMENTS.map((a) => (
                <div key={a.id} className={'ach-item' + (unlocked[a.id] ? ' is-unlocked' : '')}>
                  <div className="ach-icon" aria-hidden="true">
                    {unlocked[a.id] ? Icon.check : <span className="ach-dot"/>}
                  </div>
                  <div className="ach-text">
                    <div className="ach-label">{a.label}</div>
                    <div className="ach-desc">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {user && (
            <div className="profile-v2-foot">
              <button className="btn btn-ghost" onClick={onSignOut}>Sign out</button>
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
