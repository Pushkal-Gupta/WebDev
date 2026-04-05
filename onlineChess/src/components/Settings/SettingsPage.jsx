import { useState, useEffect, useCallback } from 'react';
import useThemeStore from '../../store/themeStore';
import useGameStore from '../../store/gameStore';
import usePrefsStore from '../../store/prefsStore';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../utils/supabase';
import { playSound } from '../../utils/soundManager';
import styles from './SettingsPage.module.css';

/* ─── Constants ─── */
const SOUND_LABELS = [
  { key: 'move', label: 'Move' },
  { key: 'capture', label: 'Capture' },
  { key: 'check', label: 'Check' },
  { key: 'castle', label: 'Castle' },
  { key: 'promote', label: 'Promote' },
  { key: 'gameStart', label: 'Game Start' },
  { key: 'gameEnd', label: 'Game End' },
  { key: 'lowTime', label: 'Low Time' },
  { key: 'illegal', label: 'Illegal Move' },
];

const ANIMATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fast', label: 'Fast' },
  { value: 'normal', label: 'Normal' },
  { value: 'slow', label: 'Slow' },
];

const COUNTRIES = [
  { code: '', name: 'Select country' },
  { code: '---', name: '--- Popular ---' },
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'RU', name: 'Russia' },
  { code: 'CN', name: 'China' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'NO', name: 'Norway' },
  { code: 'SE', name: 'Sweden' },
  { code: 'TR', name: 'Turkey' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'AR', name: 'Argentina' },
  { code: '---', name: '--- All ---' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AO', name: 'Angola' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' },
  { code: 'EE', name: 'Estonia' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'South Korea' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MA', name: 'Morocco' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' },
];

/* ─── SVG Icons for sidebar ─── */
const IconBoard = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="16" height="16" rx="2" />
    <rect x="2" y="2" width="8" height="8" fill="currentColor" opacity="0.3" />
    <rect x="10" y="10" width="8" height="8" fill="currentColor" opacity="0.3" />
  </svg>
);
const IconDisplay = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
    <circle cx="10" cy="10" r="3" />
  </svg>
);
const IconSound = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 3L5 7H2v6h3l5 4V3z" fill="currentColor" opacity="0.2" />
    <path d="M14 7.5a4 4 0 010 5" />
    <path d="M16.5 5a8 8 0 010 10" />
  </svg>
);
const IconGame = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="7" r="3" />
    <path d="M7 10h6l1.5 7h-9L7 10z" fill="currentColor" opacity="0.2" />
    <line x1="10" y1="12" x2="10" y2="15" />
    <line x1="8.5" y1="13.5" x2="11.5" y2="13.5" />
  </svg>
);
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 5v5l3.5 3.5" strokeLinecap="round" />
  </svg>
);
const IconProfile = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="7" r="4" />
    <path d="M3 18c0-3.5 3.1-6.5 7-6.5s7 3 7 6.5" strokeLinecap="round" />
  </svg>
);
const IconNotif = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 8a4 4 0 018 0c0 4 2 5 2 5H4s2-1 2-5z" />
    <path d="M8.5 16a1.5 1.5 0 003 0" />
  </svg>
);
const IconAccessibility = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="4.5" r="2" />
    <path d="M4 8l6 1 6-1" strokeLinecap="round" />
    <path d="M8 9l-1.5 8M12 9l1.5 8" strokeLinecap="round" />
    <path d="M10 9v4" />
  </svg>
);

const CATEGORIES = [
  { id: 'board', label: 'Board & Pieces', icon: IconBoard },
  { id: 'display', label: 'Display', icon: IconDisplay },
  { id: 'sound', label: 'Sound', icon: IconSound },
  { id: 'game', label: 'Game Behavior', icon: IconGame },
  { id: 'clock', label: 'Clock', icon: IconClock },
  { id: 'divider1', divider: true },
  { id: 'profile', label: 'Profile', icon: IconProfile },
  { id: 'notifications', label: 'Notifications', icon: IconNotif },
  { id: 'divider2', divider: true },
  { id: 'accessibility', label: 'Accessibility', icon: IconAccessibility },
];

/* ─── Toggle Switch component ─── */
function Toggle({ checked, onChange, label, desc }) {
  return (
    <label className={styles.toggleRow}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className={`${styles.switch} ${checked ? styles.switchChecked : ''}`}>
        <span className={styles.switchTrack} />
        <span className={styles.switchThumb} />
      </span>
      <span className={styles.toggleInfo}>
        <span className={styles.toggleLabel}>{label}</span>
        {desc && <p className={styles.toggleDesc}>{desc}</p>}
      </span>
    </label>
  );
}

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('board');

  // Theme store
  const {
    pieceSets, pieceSetIndex, setPieceSet,
    themes, themeIndex, applyTheme,
    clr1, clr2, clr1c, clr1p, clr1x,
    setColor, resetDefault: resetTheme,
    soundEnabled, setSoundEnabled, soundVolume, setSoundVolume,
    soundToggles, setSoundToggle,
  } = useThemeStore();

  // Game store (display prefs)
  const {
    showLabels, setShowLabels,
    highlightLastMove, setHighlightLastMove,
    highlightSelected, setHighlightSelected,
    showLegalDots, setShowLegalDots,
    dotSize, setDotSize,
    blindfoldMode, setBlindfoldMode,
  } = useGameStore();

  // Prefs store
  const {
    autoQueen, setAutoQueen,
    moveConfirmation, setMoveConfirmation,
    enablePremoves, setEnablePremoves,
    showCaptured, setShowCaptured,
    animationSpeed, setAnimationSpeed,
    notifFriendRequests, setNotifFriendRequests,
    notifGameInvites, setNotifGameInvites,
    notifTournaments, setNotifTournaments,
    notifClubs, setNotifClubs,
    browserNotifications, setBrowserNotifications,
    lowTimeThreshold, setLowTimeThreshold,
    lowTimeSound, setLowTimeSound,
    reducedMotion, setReducedMotion,
    highContrast, setHighContrast,
    pieceScale, setPieceScale,
    resetPrefs,
  } = usePrefsStore();

  // Auth
  const { user } = useAuthStore();

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileCountry, setProfileCountry] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    setProfileLoading(true);
    supabase
      .from('user_profiles')
      .select('display_name, bio, country')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileName(data.display_name || user.user_metadata?.full_name || '');
          setProfileBio(data.bio || '');
          setProfileCountry(data.country || '');
        } else {
          setProfileName(user.user_metadata?.full_name || user.user_metadata?.display_name || '');
        }
      })
      .finally(() => setProfileLoading(false));
  }, [user?.id]);

  const handleProfileSave = useCallback(async () => {
    if (!user?.id) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await Promise.all([
        supabase.auth.updateUser({ data: { display_name: profileName.trim(), full_name: profileName.trim() } }),
        supabase.from('user_profiles').upsert({
          user_id: user.id,
          display_name: profileName.trim(),
          bio: profileBio.trim(),
          country: profileCountry || null,
          last_seen_at: new Date().toISOString(),
        }),
      ]);
      setProfileMsg('Profile saved');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (e) {
      setProfileMsg('Failed to save: ' + e.message);
    } finally {
      setProfileSaving(false);
    }
  }, [user?.id, profileName, profileBio, profileCountry]);

  const handleBrowserNotif = useCallback(async (val) => {
    if (val && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    }
    setBrowserNotifications(val);
  }, [setBrowserNotifications]);

  const handleResetAll = useCallback(() => {
    resetTheme();
    resetPrefs();
    setShowLabels(true);
    setHighlightLastMove(true);
    setHighlightSelected(true);
    setShowLegalDots(true);
    setDotSize(12);
    setBlindfoldMode(false);
  }, [resetTheme, resetPrefs, setShowLabels, setHighlightLastMove, setHighlightSelected, setShowLegalDots, setDotSize, setBlindfoldMode]);

  /* ─── Content renderers per category ─── */

  const renderBoard = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconBoard /></span>
        <h2 className={styles.sectionTitle}>Board & Pieces</h2>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Piece Set</h4>
        <div className={styles.pieceGrid}>
          {pieceSets.map((ps, i) => (
            <button
              key={ps.name}
              className={`${styles.pieceBtn} ${pieceSetIndex === i ? styles.pieceBtnActive : ''}`}
              onClick={() => setPieceSet(i)}
            >
              <img src={`./images/${ps.path}queen-white.png`} alt={ps.name} className={styles.pieceImg} />
              <span>{ps.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Board Theme</h4>
        <div className={styles.themeGrid}>
          {themes.map((th, i) => (
            <button
              key={th.name}
              className={`${styles.themeBtn} ${themeIndex === i ? styles.themeBtnActive : ''}`}
              onClick={() => applyTheme(i)}
            >
              <div className={styles.themeSwatch}>
                <div style={{ background: th.clr1, width: '50%', height: '100%' }} />
                <div style={{ background: th.clr2, width: '50%', height: '100%' }} />
              </div>
              <span>{th.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Custom Board Colors</h4>
        <div className={styles.colorGrid}>
          <label className={styles.colorItem}>
            <input type="color" value={clr1} onChange={e => setColor('clr1', e.target.value)} />
            <span>Light Square</span>
          </label>
          <label className={styles.colorItem}>
            <input type="color" value={clr2} onChange={e => setColor('clr2', e.target.value)} />
            <span>Dark Square</span>
          </label>
          <label className={styles.colorItem}>
            <input type="color" value={clr1x} onChange={e => { setColor('clr1x', e.target.value); setColor('clr2x', e.target.value); }} />
            <span>Highlight</span>
          </label>
          <label className={styles.colorItem}>
            <input type="color" value={clr1c} onChange={e => { setColor('clr1c', e.target.value); setColor('clr2c', e.target.value); }} />
            <span>Check</span>
          </label>
          <label className={styles.colorItem}>
            <input type="color" value={clr1p} onChange={e => { setColor('clr1p', e.target.value); setColor('clr2p', e.target.value); }} />
            <span>Last Move</span>
          </label>
        </div>
      </div>
    </>
  );

  const renderDisplay = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconDisplay /></span>
        <h2 className={styles.sectionTitle}>Display</h2>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Board Display</h4>
        <div className={styles.toggleList}>
          <Toggle checked={showLabels} onChange={setShowLabels} label="Board Labels" desc="Show rank and file labels on the board" />
          <Toggle checked={highlightLastMove} onChange={setHighlightLastMove} label="Highlight Last Move" desc="Highlight the squares of the most recent move" />
          <Toggle checked={highlightSelected} onChange={setHighlightSelected} label="Highlight Selected Square" desc="Highlight the piece you've selected" />
          <Toggle checked={showLegalDots} onChange={setShowLegalDots} label="Legal Move Dots" desc="Show dots on squares where the selected piece can move" />
          <Toggle checked={showCaptured} onChange={setShowCaptured} label="Show Captured Pieces" desc="Display material difference above the board" />
          <Toggle checked={blindfoldMode} onChange={setBlindfoldMode} label="Blindfold Mode" desc="Hide all pieces on the board for training" />
        </div>
      </div>

      {showLegalDots && (
        <div className={styles.subsection}>
          <h4 className={styles.subsectionTitle}>Dot Settings</h4>
          <div className={styles.rangeField}>
            <label className={styles.rangeLabel}>Dot Size: {dotSize}px</label>
            <input type="range" min="4" max="28" value={dotSize} onChange={e => setDotSize(Number(e.target.value))} className={styles.range} />
          </div>
        </div>
      )}
    </>
  );

  const renderSound = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconSound /></span>
        <h2 className={styles.sectionTitle}>Sound</h2>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Master Controls</h4>
        <div className={styles.toggleList}>
          <Toggle checked={soundEnabled} onChange={setSoundEnabled} label="Sound Effects" desc="Enable or disable all sound effects" />
        </div>
        {soundEnabled && (
          <div className={styles.rangeField} style={{ marginTop: 12 }}>
            <label className={styles.rangeLabel}>Master Volume: {Math.round(soundVolume * 100)}%</label>
            <input type="range" min="0" max="100" value={Math.round(soundVolume * 100)} onChange={e => setSoundVolume(Number(e.target.value) / 100)} className={styles.range} />
          </div>
        )}
      </div>

      {soundEnabled && (
        <div className={styles.subsection}>
          <h4 className={styles.subsectionTitle}>Individual Sounds</h4>
          <div className={styles.soundGrid}>
            {SOUND_LABELS.map(({ key, label }) => (
              <div key={key} className={styles.soundRow}>
                <label className={styles.soundToggle}>
                  <input
                    type="checkbox"
                    checked={soundToggles[key] !== false}
                    onChange={e => setSoundToggle(key, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
                <button className={styles.testBtn} onClick={() => playSound(key)} title={`Preview ${label}`}>
                  Test
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const renderGame = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconGame /></span>
        <h2 className={styles.sectionTitle}>Game Behavior</h2>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Move Settings</h4>
        <div className={styles.toggleList}>
          <Toggle checked={autoQueen} onChange={setAutoQueen} label="Auto-Queen" desc="Automatically promote to queen without showing the dialog" />
          <Toggle checked={moveConfirmation} onChange={setMoveConfirmation} label="Move Confirmation" desc="Show a confirm button before committing each move" />
          <Toggle checked={enablePremoves} onChange={setEnablePremoves} label="Premoves" desc="Queue your next move while waiting for your opponent" />
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Animation</h4>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Animation Speed</label>
          <select className={styles.select} value={animationSpeed} onChange={e => setAnimationSpeed(e.target.value)}>
            {ANIMATION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );

  const renderClock = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconClock /></span>
        <h2 className={styles.sectionTitle}>Clock</h2>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Low-Time Warning</h4>
        <div className={styles.rangeField}>
          <label className={styles.rangeLabel}>Warning Threshold: {lowTimeThreshold}s</label>
          <input
            type="range" min="10" max="60" step="5"
            value={lowTimeThreshold}
            onChange={e => setLowTimeThreshold(Number(e.target.value))}
            className={styles.range}
          />
          <p className={styles.infoText}>Clock turns red when time drops below this threshold</p>
        </div>
        <div className={styles.toggleList} style={{ marginTop: 12 }}>
          <Toggle checked={lowTimeSound} onChange={setLowTimeSound} label="Low-Time Sound Warning" desc="Play a warning sound when time is running low" />
        </div>
      </div>
    </>
  );

  const renderProfile = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconProfile /></span>
        <h2 className={styles.sectionTitle}>Profile</h2>
      </div>

      {!user ? (
        <p className={styles.profileGuest}>Sign in to customize your profile.</p>
      ) : profileLoading ? (
        <p className={styles.infoText}>Loading profile...</p>
      ) : (
        <div className={styles.subsection}>
          <div className={styles.profileForm}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Display Name</label>
              <input
                type="text"
                className={styles.textInput}
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Your display name"
                maxLength={32}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Bio / Tagline
                <span className={styles.charCount}>{profileBio.length}/200</span>
              </label>
              <textarea
                className={styles.textarea}
                value={profileBio}
                onChange={e => setProfileBio(e.target.value.slice(0, 200))}
                placeholder="Write something about yourself..."
                maxLength={200}
                rows={3}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Country</label>
              <select
                className={styles.select}
                value={profileCountry}
                onChange={e => setProfileCountry(e.target.value)}
              >
                {COUNTRIES.map((c, i) =>
                  c.code === '---' ? (
                    <option key={`sep-${i}`} disabled>{c.name}</option>
                  ) : (
                    <option key={`${c.code}-${i}`} value={c.code}>{c.name}</option>
                  )
                )}
              </select>
            </div>
            <div className={styles.profileActions}>
              <button className={styles.saveBtn} onClick={handleProfileSave} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
              {profileMsg && (
                <span className={`${styles.profileMsg} ${profileMsg.startsWith('Failed') ? styles.profileMsgError : ''}`}>
                  {profileMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderNotifications = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconNotif /></span>
        <h2 className={styles.sectionTitle}>Notifications</h2>
      </div>

      {!user ? (
        <p className={styles.profileGuest}>Sign in to manage notification preferences.</p>
      ) : (
        <div className={styles.subsection}>
          <h4 className={styles.subsectionTitle}>Notification Preferences</h4>
          <div className={styles.toggleList}>
            <Toggle checked={notifFriendRequests} onChange={setNotifFriendRequests} label="Friend Requests" desc="Get notified when someone sends you a friend request" />
            <Toggle checked={notifGameInvites} onChange={setNotifGameInvites} label="Game Invites" desc="Get notified when someone invites you to a game" />
            <Toggle checked={notifTournaments} onChange={setNotifTournaments} label="Tournament Updates" desc="Receive updates about tournaments you're in" />
            <Toggle checked={notifClubs} onChange={setNotifClubs} label="Club Activity" desc="Get notified about activity in your clubs" />
            <Toggle checked={browserNotifications} onChange={handleBrowserNotif} label="Browser Notifications" desc="Show desktop notifications for game events" />
          </div>
        </div>
      )}
    </>
  );

  const renderAccessibility = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconAccessibility /></span>
        <h2 className={styles.sectionTitle}>Accessibility</h2>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Visual</h4>
        <div className={styles.toggleList}>
          <Toggle checked={reducedMotion} onChange={setReducedMotion} label="Reduced Motion" desc="Disable all animations and transitions" />
          <Toggle checked={highContrast} onChange={setHighContrast} label="High Contrast" desc="Increase border visibility and text contrast" />
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Piece Size</h4>
        <div className={styles.rangeField}>
          <label className={styles.rangeLabel}>Piece Scale: {pieceScale}%</label>
          <input
            type="range" min="100" max="130" step="5"
            value={pieceScale}
            onChange={e => setPieceScale(Number(e.target.value))}
            className={styles.range}
          />
        </div>
      </div>

      <div className={styles.subsection}>
        <button className={styles.resetBtn} onClick={handleResetAll}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 2v5h5" />
            <path d="M2 7C3.5 3.5 6.5 2 9 2a6 6 0 11-5.6 8" />
          </svg>
          Reset All Settings to Default
        </button>
      </div>
    </>
  );

  const contentMap = {
    board: renderBoard,
    display: renderDisplay,
    sound: renderSound,
    game: renderGame,
    clock: renderClock,
    profile: renderProfile,
    notifications: renderNotifications,
    accessibility: renderAccessibility,
  };

  return (
    <div className={styles.page}>
      {/* ── Sidebar ── */}
      <nav className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Settings</div>
        <ul className={styles.sidebarList}>
          {CATEGORIES.map((cat) =>
            cat.divider ? (
              <li key={cat.id} className={styles.sidebarDivider} />
            ) : (
              <li key={cat.id}>
                <button
                  className={`${styles.sidebarItem} ${activeCategory === cat.id ? styles.sidebarItemActive : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className={styles.sidebarIcon}><cat.icon /></span>
                  <span className={styles.sidebarLabel}>{cat.label}</span>
                </button>
              </li>
            )
          )}
        </ul>
      </nav>

      {/* ── Content ── */}
      <div className={styles.content}>
        <div className={styles.contentInner}>
          {contentMap[activeCategory]?.()}
        </div>
      </div>
    </div>
  );
}
