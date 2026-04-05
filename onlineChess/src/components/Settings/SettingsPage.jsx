import { useState, useEffect, useCallback } from 'react';
import useThemeStore from '../../store/themeStore';
import useGameStore from '../../store/gameStore';
import usePrefsStore from '../../store/prefsStore';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../utils/supabase';
import { playSound, previewTheme } from '../../utils/soundManager';
import { PIECE_SETS, BOARD_THEMES, SOUND_THEMES } from '../../data/assetRegistry';
import { getPieceSetPreviewUrl, resolvePieceUrl } from '../../utils/pieceResolver';
import { getPieceSetById } from '../../data/assetRegistry';
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

const CASTLING_OPTIONS = [
  { value: 'normal', label: 'Normal', desc: 'Castle by moving the king two squares' },
  { value: 'legacy', label: 'Legacy', desc: 'Castle by moving the king onto the rook' },
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
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AO', name: 'Angola' }, { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BD', name: 'Bangladesh' }, { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' },
  { code: 'BO', name: 'Bolivia' }, { code: 'BA', name: 'Bosnia and Herzegovina' }, { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' }, { code: 'CO', name: 'Colombia' }, { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' }, { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' },
  { code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' }, { code: 'EE', name: 'Estonia' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'South Korea' }, { code: 'LV', name: 'Latvia' }, { code: 'LT', name: 'Lithuania' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MX', name: 'Mexico' }, { code: 'MA', name: 'Morocco' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' }, { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' }, { code: 'PK', name: 'Pakistan' }, { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'RS', name: 'Serbia' }, { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' }, { code: 'ZA', name: 'South Africa' }, { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'TH', name: 'Thailand' }, { code: 'TR', name: 'Turkey' }, { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
];

/* ─── SVG Icons for sidebar ─── */
const IconBoard = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="16" height="16" rx="2" />
    <rect x="2" y="2" width="8" height="8" fill="currentColor" opacity="0.3" />
    <rect x="10" y="10" width="8" height="8" fill="currentColor" opacity="0.3" />
  </svg>
);
const IconGameplay = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="7" r="3" />
    <path d="M7 10h6l1.5 7h-9L7 10z" fill="currentColor" opacity="0.2" />
    <line x1="10" y1="12" x2="10" y2="15" />
    <line x1="8.5" y1="13.5" x2="11.5" y2="13.5" />
  </svg>
);
const IconSound = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 3L5 7H2v6h3l5 4V3z" fill="currentColor" opacity="0.2" />
    <path d="M14 7.5a4 4 0 010 5" />
    <path d="M16.5 5a8 8 0 010 10" />
  </svg>
);
const IconInterface = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="16" height="12" rx="2" />
    <line x1="6" y1="18" x2="14" y2="18" />
    <line x1="10" y1="15" x2="10" y2="18" />
  </svg>
);
const IconProfile = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="7" r="4" />
    <path d="M3 18c0-3.5 3.1-6.5 7-6.5s7 3 7 6.5" strokeLinecap="round" />
  </svg>
);
const IconAccount = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="8" width="10" height="9" rx="2" />
    <path d="M7 8V6a3 3 0 016 0v2" />
    <circle cx="10" cy="12.5" r="1.2" fill="currentColor" />
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
  { id: 'gameplay', label: 'Gameplay', icon: IconGameplay },
  { id: 'sound', label: 'Sound', icon: IconSound },
  { id: 'interface', label: 'Interface', icon: IconInterface },
  { id: 'divider1', divider: true },
  { id: 'profile', label: 'Profile', icon: IconProfile },
  { id: 'account', label: 'Account', icon: IconAccount },
  { id: 'notifications', label: 'Notifications', icon: IconNotif },
  { id: 'divider2', divider: true },
  { id: 'accessibility', label: 'Accessibility', icon: IconAccessibility },
];

/* ─── Toggle Switch ─── */
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

/* ─── Mini Board Preview ─── */
function MiniBoard({ theme, pieceSet, size = 80 }) {
  const cellSize = size / 4;
  // piece positions: (type, color) tuples
  const layout = [
    [null, null, ['b','w'], null],
    [null, ['p','b'], null, ['p','w']],
    [['p','w'], null, ['n','w'], null],
    [null, null, null, ['r','w']],
  ];
  const isImage = theme?.type === 'image';
  const boardStyle = isImage && theme.imageUrl
    ? { backgroundImage: `url(${theme.imageUrl})`, backgroundSize: '100% 100%' }
    : {};

  return (
    <div style={{ width: size, height: size, display: 'grid', gridTemplateColumns: `repeat(4, ${cellSize}px)`, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', ...boardStyle }}>
      {layout.flat().map((p, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const isLight = (row + col) % 2 === 0;
        const bg = isImage ? 'transparent' : (isLight ? (theme?.clr1 || '#fff') : (theme?.clr2 || '#33b3a6'));
        return (
          <div key={i} style={{ width: cellSize, height: cellSize, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {p && pieceSet && <img src={resolvePieceUrl(p[0], p[1], pieceSet)} alt="" loading="lazy" style={{ width: cellSize * 0.82, height: cellSize * 0.82, objectFit: 'contain' }} />}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('board');


  // Theme store
  const {
    pieceSetId, setPieceSet,
    boardThemeId, applyBoardTheme,
    clr1, clr2, clr1c, clr1p, clr1x,
    setColor, resetDefault: resetTheme,
    soundEnabled, setSoundEnabled, soundVolume, setSoundVolume,
    soundThemeId, setSoundTheme,
    soundToggles, setSoundToggle,
  } = useThemeStore();

  const currentPieceSet = getPieceSetById(pieceSetId);

  // Game store
  const {
    showLabels, setShowLabels,
    coordinateDisplay, setCoordinateDisplay,
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
    confirmResign, setConfirmResign,
    enablePremoves, setEnablePremoves,
    showCaptured, setShowCaptured,
    animationSpeed, setAnimationSpeed,
    whiteAlwaysOnBottom, setWhiteAlwaysOnBottom,
    castlingMethod, setCastlingMethod,
    showEngineEval, setShowEngineEval,
    showPostGameFeedback, setShowPostGameFeedback,
    showTimestamps, setShowTimestamps,
    showMoveClassification, setShowMoveClassification,
    showRatings, setShowRatings,
    showPieceIcons, setShowPieceIcons,
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

  // Account state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    setProfileLoading(true);
    supabase.from('user_profiles').select('display_name, bio, country').eq('user_id', user.id).maybeSingle()
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
    setProfileSaving(true); setProfileMsg('');
    try {
      await Promise.all([
        supabase.auth.updateUser({ data: { display_name: profileName.trim(), full_name: profileName.trim() } }),
        supabase.from('user_profiles').upsert({ user_id: user.id, display_name: profileName.trim(), bio: profileBio.trim(), country: profileCountry || null, last_seen_at: new Date().toISOString() }),
      ]);
      setProfileMsg('Profile saved');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (e) { setProfileMsg('Failed to save: ' + e.message); }
    finally { setProfileSaving(false); }
  }, [user?.id, profileName, profileBio, profileCountry]);

  const handlePasswordChange = useCallback(async () => {
    if (!newPw || newPw.length < 6) { setPwMsg('Password must be at least 6 characters'); return; }
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match'); return; }
    setPwSaving(true); setPwMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwMsg('Password updated successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (e) { setPwMsg('Failed: ' + e.message); }
    finally { setPwSaving(false); }
  }, [newPw, confirmPw]);

  const handleBrowserNotif = useCallback(async (val) => {
    if (val && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    }
    setBrowserNotifications(val);
  }, [setBrowserNotifications]);

  const handleResetAll = useCallback(() => {
    resetTheme(); resetPrefs();
    setShowLabels(true); setCoordinateDisplay('inside');
    setHighlightLastMove(true); setHighlightSelected(true);
    setShowLegalDots(true); setDotSize(12); setBlindfoldMode(false);
  }, [resetTheme, resetPrefs, setShowLabels, setCoordinateDisplay, setHighlightLastMove, setHighlightSelected, setShowLegalDots, setDotSize, setBlindfoldMode]);


  /* ═══════════════════════════════════════════════════
     Section Renderers
     ═══════════════════════════════════════════════════ */

  const renderBoard = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconBoard /></span>
        <h2 className={styles.sectionTitle}>Board & Pieces</h2>
      </div>
      <p className={styles.sectionDesc}>Customize the look and feel of your chess set.</p>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Piece Set ({PIECE_SETS.length})</h4>
        <div className={styles.scrollGrid}>
          <div className={styles.pieceGrid}>
            {PIECE_SETS.map(ps => (
              <button key={ps.id} className={`${styles.pieceBtn} ${pieceSetId === ps.id ? styles.pieceBtnActive : ''}`} onClick={() => setPieceSet(ps.id)}>
                <img src={getPieceSetPreviewUrl(ps)} alt={ps.name} className={styles.pieceImg} loading="lazy" onError={e => { e.target.onerror = null; e.target.style.opacity = '0.3'; }} />
                <span>{ps.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Board Theme ({BOARD_THEMES.length})</h4>
        <div className={styles.scrollGrid}>
          <div className={styles.themeGrid}>
            {BOARD_THEMES.map(th => (
              <button key={th.id} className={`${styles.themeBtn} ${boardThemeId === th.id ? styles.themeBtnActive : ''}`} onClick={() => applyBoardTheme(th.id)}>
                <MiniBoard theme={th} pieceSet={currentPieceSet} size={80} />
                <span>{th.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Custom Board Colors</h4>
        <div className={styles.colorGrid}>
          <label className={styles.colorItem}><input type="color" value={clr1} onChange={e => setColor('clr1', e.target.value)} /><span>Light Square</span></label>
          <label className={styles.colorItem}><input type="color" value={clr2} onChange={e => setColor('clr2', e.target.value)} /><span>Dark Square</span></label>
          <label className={styles.colorItem}><input type="color" value={clr1x} onChange={e => { setColor('clr1x', e.target.value); setColor('clr2x', e.target.value); }} /><span>Highlight</span></label>
          <label className={styles.colorItem}><input type="color" value={clr1c} onChange={e => { setColor('clr1c', e.target.value); setColor('clr2c', e.target.value); }} /><span>Check</span></label>
          <label className={styles.colorItem}><input type="color" value={clr1p} onChange={e => { setColor('clr1p', e.target.value); setColor('clr2p', e.target.value); }} /><span>Last Move</span></label>
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Board Coordinates</h4>
        <div className={styles.radioGroup}>
          {[{ v: 'none', l: 'None' }, { v: 'inside', l: 'Inside' }, { v: 'outside', l: 'Outside' }].map(o => (
            <label key={o.v} className={styles.radioItem}>
              <input type="radio" name="coordDisplay" value={o.v} checked={coordinateDisplay === o.v} onChange={() => setCoordinateDisplay(o.v)} />
              <span>{o.l}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Board Display</h4>
        <div className={styles.toggleList}>
          <Toggle checked={highlightLastMove} onChange={setHighlightLastMove} label="Highlight Last Move" desc="Highlight the squares of the most recent move" />
          <Toggle checked={highlightSelected} onChange={setHighlightSelected} label="Highlight Selected Square" desc="Highlight the piece you've selected" />
          <Toggle checked={showLegalDots} onChange={setShowLegalDots} label="Show Legal Moves" desc="Show dots on squares where the selected piece can move" />
          <Toggle checked={blindfoldMode} onChange={setBlindfoldMode} label="Blindfold Mode" desc="Hide all pieces on the board for training" />
        </div>
        {showLegalDots && (
          <div className={styles.rangeField} style={{ marginTop: 10 }}>
            <label className={styles.rangeLabel}>Dot Size: {dotSize}px</label>
            <input type="range" min="4" max="28" value={dotSize} onChange={e => setDotSize(Number(e.target.value))} className={styles.range} />
          </div>
        )}
      </div>
    </>
  );

  const renderGameplay = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconGameplay /></span>
        <h2 className={styles.sectionTitle}>Gameplay</h2>
      </div>
      <p className={styles.sectionDesc}>Manage settings for gameplay, moves, and analysis.</p>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>General</h4>
        <div className={styles.toggleList}>
          <Toggle checked={autoQueen} onChange={setAutoQueen} label="Always Promote to Queen" desc="Disable auto-queen by holding the ALT key when promoting" />
          <Toggle checked={confirmResign} onChange={setConfirmResign} label="Confirm Resign/Draw" desc="When you resign or send a draw offer, you will be asked to confirm" />
          <Toggle checked={showLegalDots} onChange={setShowLegalDots} label="Show Legal Moves" />
          <Toggle checked={whiteAlwaysOnBottom} onChange={setWhiteAlwaysOnBottom} label="White Always on Bottom" />
        </div>
        <div className={styles.field} style={{ marginTop: 14 }}>
          <label className={styles.fieldLabel}>Castling Method</label>
          <select className={styles.select} value={castlingMethod} onChange={e => setCastlingMethod(e.target.value)}>
            {CASTLING_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
          <p className={styles.infoText}>{CASTLING_OPTIONS.find(o => o.value === castlingMethod)?.desc}</p>
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Live</h4>
        <div className={styles.toggleList}>
          <Toggle checked={enablePremoves} onChange={setEnablePremoves} label="Enable Premoves" desc="Make legal moves during your opponent's turn to be played automatically on your turn" />
          <Toggle checked={lowTimeSound} onChange={setLowTimeSound} label="Low-Time Warning" desc="Visual and audible warnings when you're low on time" />
          <Toggle checked={moveConfirmation} onChange={setMoveConfirmation} label="Confirm Move" desc="Confirm your move after you make it, before it's played" />
        </div>
        <div className={styles.rangeField} style={{ marginTop: 10 }}>
          <label className={styles.rangeLabel}>Low-Time Threshold: {lowTimeThreshold}s</label>
          <input type="range" min="10" max="60" step="5" value={lowTimeThreshold} onChange={e => setLowTimeThreshold(Number(e.target.value))} className={styles.range} />
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Analysis</h4>
        <div className={styles.toggleList}>
          <Toggle checked={showEngineEval} onChange={setShowEngineEval} label="Engine Evaluation" desc="Display engine evaluation at the end of a game" />
          <Toggle checked={showPostGameFeedback} onChange={setShowPostGameFeedback} label="Show Post-Game Feedback" desc="Get a recap at the end of the game" />
          <Toggle checked={showTimestamps} onChange={setShowTimestamps} label="Show Timestamps" desc="Display how much time was spent on each move" />
          <Toggle checked={showMoveClassification} onChange={setShowMoveClassification} label="Show Move Classification Icons" desc="Brilliant, blunders, and other icons in the move list" />
        </div>
      </div>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Animation</h4>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Piece Animation Speed</label>
          <select className={styles.select} value={animationSpeed} onChange={e => setAnimationSpeed(e.target.value)}>
            {ANIMATION_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
        </div>
      </div>
    </>
  );

  const renderSound = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconSound /></span>
        <h2 className={styles.sectionTitle}>Sound</h2>
      </div>
      <p className={styles.sectionDesc}>Configure sound effects and choose a sound theme.</p>

      <div className={styles.subsection}>
        <div className={styles.toggleList}>
          <Toggle checked={soundEnabled} onChange={setSoundEnabled} label="Play Sounds" desc="Enable or disable all sound effects" />
        </div>
      </div>

      {soundEnabled && (
        <>
          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>Sound Theme</h4>
            <div className={styles.soundThemeRow}>
              <select className={styles.select} value={soundThemeId} onChange={e => setSoundTheme(e.target.value)}>
                {SOUND_THEMES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button className={styles.previewBtn} onClick={() => previewTheme(soundThemeId)} title="Preview theme">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 3L5 7H2v6h3l5 4V3z" fill="currentColor" opacity="0.3" />
                  <path d="M14 7.5a4 4 0 010 5" />
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>Volume</h4>
            <div className={styles.rangeField}>
              <label className={styles.rangeLabel}>Master Volume: {Math.round(soundVolume * 100)}%</label>
              <input type="range" min="0" max="100" value={Math.round(soundVolume * 100)} onChange={e => setSoundVolume(Number(e.target.value) / 100)} className={styles.range} />
            </div>
          </div>

          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>Individual Sounds</h4>
            <div className={styles.soundGrid}>
              {SOUND_LABELS.map(({ key, label }) => (
                <div key={key} className={styles.soundRow}>
                  <label className={styles.soundToggle}>
                    <input type="checkbox" checked={soundToggles[key] !== false} onChange={e => setSoundToggle(key, e.target.checked)} />
                    <span>{label}</span>
                  </label>
                  <button className={styles.testBtn} onClick={() => playSound(key)} title={`Preview ${label}`}>Test</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );

  const renderInterface = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconInterface /></span>
        <h2 className={styles.sectionTitle}>Interface</h2>
      </div>
      <p className={styles.sectionDesc}>Customize your interface and display options.</p>

      <div className={styles.subsection}>
        <div className={styles.toggleList}>
          <Toggle checked={showRatings} onChange={setShowRatings} label="Show Player Ratings During Game" desc="Display player ratings next to usernames" />
          <Toggle checked={showCaptured} onChange={setShowCaptured} label="Show Captured Pieces" desc="Display material difference above the board" />
          <Toggle checked={showPieceIcons} onChange={setShowPieceIcons} label="Show Piece Icons in Game Notation" desc="Use piece symbols instead of letters (e.g. ♞ instead of N)" />
        </div>
      </div>
    </>
  );

  const renderProfile = () => {
    const initial = (profileName || user?.email || '?')[0].toUpperCase();
    const memberSince = user?.created_at
      ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : null;
    return (
      <>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}><IconProfile /></span>
          <h2 className={styles.sectionTitle}>Profile</h2>
        </div>
        <p className={styles.sectionDesc}>Edit your public profile visible to other players.</p>
        {!user ? (
          <div className={styles.profileGuestCard}>
            <div className={styles.profileGuestIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><circle cx="12" cy="8" r="5" /><path d="M3 21c0-4.4 4-8 9-8s9 3.6 9 8" /></svg>
            </div>
            <p className={styles.profileGuestTitle}>Sign in to customize your profile</p>
            <p className={styles.profileGuestSub}>Your display name, bio, and country will be visible to other players.</p>
          </div>
        ) : profileLoading ? (
          <div className={styles.profileCard}><p className={styles.infoText} style={{ padding: 20, textAlign: 'center' }}>Loading profile...</p></div>
        ) : (
          <>
            <div className={styles.profileCard}>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatar}>{initial}</div>
                <div className={styles.profileMeta}>
                  <div className={styles.profileDisplayName}>{profileName || user?.email?.split('@')[0]}</div>
                  <div className={styles.profileEmail}>{user?.email}</div>
                  {memberSince && (
                    <div className={styles.profileJoined}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" opacity="0.5"><path d="M14 0H2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2zM1 3.9V2a1 1 0 011-1h12a1 1 0 011 1v1.9H1zM15 14a1 1 0 01-1 1H2a1 1 0 01-1-1V5h14v9z"/><rect x="3" y="7" width="2" height="2" rx=".5"/><rect x="7" y="7" width="2" height="2" rx=".5"/></svg>
                      Member since {memberSince}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.profileCard}>
              <h4 className={styles.profileCardTitle}>Personal Information</h4>
              <div className={styles.profileForm}>
                <div className={styles.profileField}>
                  <label className={styles.profileFieldLabel}>Display Name</label>
                  <input type="text" className={styles.textInput} value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your display name" maxLength={32} />
                  <span className={styles.profileFieldHint}>This is how other players will see you</span>
                </div>
                <div className={styles.profileField}>
                  <label className={styles.profileFieldLabel}>Country</label>
                  <select className={styles.select} value={profileCountry} onChange={e => setProfileCountry(e.target.value)}>
                    {COUNTRIES.map((c, i) => c.code === '---' ? (<option key={`sep-${i}`} disabled>{c.name}</option>) : (<option key={`${c.code}-${i}`} value={c.code}>{c.name}</option>))}
                  </select>
                  <span className={styles.profileFieldHint}>Your country flag will appear on your profile</span>
                </div>
              </div>
            </div>
            <div className={styles.profileCard}>
              <h4 className={styles.profileCardTitle}>About <span className={styles.charCount}>{profileBio.length} / 200</span></h4>
              <div className={styles.profileForm}>
                <div className={styles.profileField}>
                  <textarea className={styles.textarea} value={profileBio} onChange={e => setProfileBio(e.target.value.slice(0, 200))} placeholder="Tell other players about yourself..." maxLength={200} rows={4} />
                </div>
              </div>
            </div>
            <div className={styles.profileSaveRow}>
              <button className={styles.saveBtn} onClick={handleProfileSave} disabled={profileSaving}>
                {profileSaving ? (<><span className={styles.saveBtnSpinner} />Saving...</>) : (<><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2 8.5 6 12.5 14 3.5" /></svg>Save Changes</>)}
              </button>
              {profileMsg && <span className={`${styles.profileMsg} ${profileMsg.startsWith('Failed') ? styles.profileMsgError : ''}`}>{profileMsg}</span>}
            </div>
          </>
        )}
      </>
    );
  };

  const renderAccount = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconAccount /></span>
        <h2 className={styles.sectionTitle}>Account</h2>
      </div>
      <p className={styles.sectionDesc}>Change your password, manage account security.</p>

      {!user ? (
        <div className={styles.profileGuestCard}>
          <p className={styles.profileGuestTitle}>Sign in to manage your account</p>
        </div>
      ) : (
        <>
          <div className={styles.profileCard}>
            <h4 className={styles.profileCardTitle}>Change Password</h4>
            <div className={styles.profileForm}>
              <div className={styles.profileField}>
                <label className={styles.profileFieldLabel}>Current Password</label>
                <input type="password" className={styles.textInput} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className={styles.profileField}>
                <label className={styles.profileFieldLabel}>New Password</label>
                <input type="password" className={styles.textInput} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password" />
              </div>
              <div className={styles.profileField}>
                <label className={styles.profileFieldLabel}>Confirm Password</label>
                <input type="password" className={styles.textInput} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Retype new password" />
              </div>
              <div className={styles.profileSaveRow}>
                <button className={styles.saveBtn} onClick={handlePasswordChange} disabled={pwSaving || !newPw}>
                  {pwSaving ? 'Saving...' : 'Update Password'}
                </button>
                {pwMsg && <span className={`${styles.profileMsg} ${pwMsg.startsWith('Failed') ? styles.profileMsgError : ''}`}>{pwMsg}</span>}
              </div>
            </div>
          </div>

          <div className={styles.profileCard}>
            <h4 className={styles.profileCardTitle}>Contact Info</h4>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email Address</span>
              <span className={styles.detailValue}>{user.email}</span>
            </div>
          </div>
        </>
      )}
    </>
  );

  const renderNotifications = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconNotif /></span>
        <h2 className={styles.sectionTitle}>Notifications</h2>
      </div>
      <p className={styles.sectionDesc}>Manage when and where you receive notifications.</p>
      {!user ? (
        <div className={styles.profileGuestCard}><p className={styles.profileGuestTitle}>Sign in to manage notification preferences.</p></div>
      ) : (
        <>
          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>Play</h4>
            <div className={styles.toggleList}>
              <Toggle checked={notifGameInvites} onChange={setNotifGameInvites} label="Game Invites" desc="Get notified when someone invites you to a game" />
              <Toggle checked={notifTournaments} onChange={setNotifTournaments} label="Tournament Updates" desc="Receive updates about tournaments you're in" />
            </div>
          </div>
          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>Social</h4>
            <div className={styles.toggleList}>
              <Toggle checked={notifFriendRequests} onChange={setNotifFriendRequests} label="Friend Requests" desc="Get notified when someone sends you a friend request" />
              <Toggle checked={notifClubs} onChange={setNotifClubs} label="Club Activity" desc="Get notified about activity in your clubs" />
            </div>
          </div>
          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>System</h4>
            <div className={styles.toggleList}>
              <Toggle checked={browserNotifications} onChange={handleBrowserNotif} label="Browser Notifications" desc="Show desktop notifications for game events" />
            </div>
          </div>
        </>
      )}
    </>
  );

  const renderAccessibility = () => (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}><IconAccessibility /></span>
        <h2 className={styles.sectionTitle}>Accessibility</h2>
      </div>
      <p className={styles.sectionDesc}>Choose your language and set audio and visual options.</p>

      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>Sound</h4>
        <div className={styles.toggleList}>
          <Toggle checked={soundEnabled} onChange={setSoundEnabled} label="Play Sounds" />
        </div>
        {soundEnabled && (
          <div className={styles.field} style={{ marginTop: 10 }}>
            <label className={styles.fieldLabel}>Sound Theme</label>
            <div className={styles.soundThemeRow}>
              <select className={styles.select} value={soundThemeId} onChange={e => setSoundTheme(e.target.value)}>
                {SOUND_THEMES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button className={styles.previewBtn} onClick={() => previewTheme(soundThemeId)} title="Preview">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 3L5 7H2v6h3l5 4V3z" fill="currentColor" opacity="0.3" /><path d="M14 7.5a4 4 0 010 5" /></svg>
              </button>
            </div>
          </div>
        )}
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
          <input type="range" min="100" max="130" step="5" value={pieceScale} onChange={e => setPieceScale(Number(e.target.value))} className={styles.range} />
        </div>
      </div>

      <div className={styles.subsection}>
        <button className={styles.resetBtn} onClick={handleResetAll}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2v5h5" /><path d="M2 7C3.5 3.5 6.5 2 9 2a6 6 0 11-5.6 8" /></svg>
          Reset All Settings to Default
        </button>
      </div>
    </>
  );

  const contentMap = {
    board: renderBoard,
    gameplay: renderGameplay,
    sound: renderSound,
    interface: renderInterface,
    profile: renderProfile,
    account: renderAccount,
    notifications: renderNotifications,
    accessibility: renderAccessibility,
  };

  return (
    <div className={styles.page}>
      <nav className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Settings</div>
        <ul className={styles.sidebarList}>
          {CATEGORIES.map((cat) =>
            cat.divider ? (
              <li key={cat.id} className={styles.sidebarDivider} />
            ) : (
              <li key={cat.id}>
                <button className={`${styles.sidebarItem} ${activeCategory === cat.id ? styles.sidebarItemActive : ''}`} onClick={() => setActiveCategory(cat.id)}>
                  <span className={styles.sidebarIcon}><cat.icon /></span>
                  <span className={styles.sidebarLabel}>{cat.label}</span>
                </button>
              </li>
            )
          )}
        </ul>
      </nav>
      <div className={styles.content}>
        <div className={styles.contentInner}>
          {contentMap[activeCategory]?.()}
        </div>
      </div>
    </div>
  );
}
