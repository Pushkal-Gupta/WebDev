import { useState, useEffect, useCallback } from 'react';
import useThemeStore from '../../store/themeStore';
import useGameStore from '../../store/gameStore';
import usePrefsStore from '../../store/prefsStore';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../utils/supabase';
import { playSound } from '../../utils/soundManager';
import styles from './SettingsPage.module.css';

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

export default function SettingsPage() {
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

  // Profile state (local, fetched from supabase)
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileCountry, setProfileCountry] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Load profile from supabase
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
    // Reset gameStore display prefs
    setShowLabels(true);
    setHighlightLastMove(true);
    setHighlightSelected(true);
    setShowLegalDots(true);
    setDotSize(12);
    setBlindfoldMode(false);
  }, [resetTheme, resetPrefs, setShowLabels, setHighlightLastMove, setHighlightSelected, setShowLegalDots, setDotSize, setBlindfoldMode]);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Settings</h2>

      {/* ════════ Section 1: Board & Pieces ════════ */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Board & Pieces</h3>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Piece Set</label>
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

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Board Theme</label>
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

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Board Colors</label>
          <div className={styles.colorGrid}>
            <label className={styles.colorItem}>
              <span>Light Square</span>
              <input type="color" value={clr1} onChange={e => setColor('clr1', e.target.value)} />
            </label>
            <label className={styles.colorItem}>
              <span>Dark Square</span>
              <input type="color" value={clr2} onChange={e => setColor('clr2', e.target.value)} />
            </label>
            <label className={styles.colorItem}>
              <span>Highlight</span>
              <input type="color" value={clr1x} onChange={e => { setColor('clr1x', e.target.value); setColor('clr2x', e.target.value); }} />
            </label>
            <label className={styles.colorItem}>
              <span>Check</span>
              <input type="color" value={clr1c} onChange={e => { setColor('clr1c', e.target.value); setColor('clr2c', e.target.value); }} />
            </label>
            <label className={styles.colorItem}>
              <span>Last Move</span>
              <input type="color" value={clr1p} onChange={e => { setColor('clr1p', e.target.value); setColor('clr2p', e.target.value); }} />
            </label>
          </div>
        </div>
      </section>

      {/* ════════ Section 2: Display ════════ */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Display</h3>
        <div className={styles.toggleList}>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
            <span>Board Labels</span>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={highlightLastMove} onChange={e => setHighlightLastMove(e.target.checked)} />
            <span>Highlight Last Move</span>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={highlightSelected} onChange={e => setHighlightSelected(e.target.checked)} />
            <span>Highlight Selected Square</span>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={showLegalDots} onChange={e => setShowLegalDots(e.target.checked)} />
            <span>Legal Move Dots</span>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={blindfoldMode} onChange={e => setBlindfoldMode(e.target.checked)} />
            <span>Blindfold Mode</span>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={showCaptured} onChange={e => setShowCaptured(e.target.checked)} />
            <span>Show Captured Pieces</span>
          </label>
        </div>
        {showLegalDots && (
          <div className={styles.rangeField}>
            <label className={styles.rangeLabel}>Dot Size: {dotSize}px</label>
            <input type="range" min="4" max="28" value={dotSize} onChange={e => setDotSize(Number(e.target.value))} className={styles.range} />
          </div>
        )}
      </section>

      {/* ════════ Section 3: Sound ════════ */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Sound</h3>
        <div className={styles.toggleList}>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} />
            <span>Sound Effects</span>
          </label>
        </div>
        {soundEnabled && (
          <>
            <div className={styles.rangeField}>
              <label className={styles.rangeLabel}>Volume: {Math.round(soundVolume * 100)}%</label>
              <input type="range" min="0" max="100" value={Math.round(soundVolume * 100)} onChange={e => setSoundVolume(Number(e.target.value) / 100)} className={styles.range} />
            </div>
            <div className={styles.field} style={{ marginTop: 12 }}>
              <label className={styles.fieldLabel}>Individual Sounds</label>
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
                    <button
                      className={styles.testBtn}
                      onClick={() => playSound(key)}
                      title={`Preview ${label}`}
                    >
                      Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ════════ Section 4: Game Behavior ════════ */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Game Behavior</h3>
        <div className={styles.toggleList}>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={autoQueen} onChange={e => setAutoQueen(e.target.checked)} />
            <div>
              <span>Auto-Queen</span>
              <p className={styles.infoText}>Automatically promote to queen without showing the dialog</p>
            </div>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={moveConfirmation} onChange={e => setMoveConfirmation(e.target.checked)} />
            <div>
              <span>Move Confirmation</span>
              <p className={styles.infoText}>Show a confirm button before committing each move</p>
            </div>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={enablePremoves} onChange={e => setEnablePremoves(e.target.checked)} />
            <div>
              <span>Premoves</span>
              <p className={styles.infoText}>Queue your next move while waiting for your opponent (online games)</p>
            </div>
          </label>
        </div>
        <div className={styles.field} style={{ marginTop: 12 }}>
          <label className={styles.fieldLabel}>Animation Speed</label>
          <select
            className={styles.select}
            value={animationSpeed}
            onChange={e => setAnimationSpeed(e.target.value)}
          >
            {ANIMATION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ════════ Section 5: Clock ════════ */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Clock</h3>
        <div className={styles.rangeField}>
          <label className={styles.rangeLabel}>Low-Time Warning: {lowTimeThreshold}s</label>
          <input
            type="range" min="10" max="60" step="5"
            value={lowTimeThreshold}
            onChange={e => setLowTimeThreshold(Number(e.target.value))}
            className={styles.range}
          />
          <p className={styles.infoText}>Clock turns red when time drops below this threshold</p>
        </div>
        <div className={styles.toggleList} style={{ marginTop: 8 }}>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={lowTimeSound} onChange={e => setLowTimeSound(e.target.checked)} />
            <span>Low-Time Sound Warning</span>
          </label>
        </div>
      </section>

      {/* ════════ Section 6: Profile ════════ */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Profile</h3>
        {!user ? (
          <p className={styles.profileGuest}>Sign in to customize your profile.</p>
        ) : profileLoading ? (
          <p className={styles.infoText}>Loading profile...</p>
        ) : (
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
              <button
                className={styles.saveBtn}
                onClick={handleProfileSave}
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
              {profileMsg && (
                <span className={`${styles.profileMsg} ${profileMsg.startsWith('Failed') ? styles.profileMsgError : ''}`}>
                  {profileMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ════════ Section 7: Notifications ════════ */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Notifications</h3>
        {!user ? (
          <p className={styles.profileGuest}>Sign in to manage notification preferences.</p>
        ) : (
          <div className={styles.toggleList}>
            <label className={styles.toggleRow}>
              <input type="checkbox" checked={notifFriendRequests} onChange={e => setNotifFriendRequests(e.target.checked)} />
              <span>Friend Requests</span>
            </label>
            <label className={styles.toggleRow}>
              <input type="checkbox" checked={notifGameInvites} onChange={e => setNotifGameInvites(e.target.checked)} />
              <span>Game Invites</span>
            </label>
            <label className={styles.toggleRow}>
              <input type="checkbox" checked={notifTournaments} onChange={e => setNotifTournaments(e.target.checked)} />
              <span>Tournament Updates</span>
            </label>
            <label className={styles.toggleRow}>
              <input type="checkbox" checked={notifClubs} onChange={e => setNotifClubs(e.target.checked)} />
              <span>Club Activity</span>
            </label>
            <label className={styles.toggleRow}>
              <input type="checkbox" checked={browserNotifications} onChange={e => handleBrowserNotif(e.target.checked)} />
              <div>
                <span>Browser Notifications</span>
                <p className={styles.infoText}>Show desktop notifications for game events</p>
              </div>
            </label>
          </div>
        )}
      </section>

      {/* ════════ Section 8: Accessibility ════════ */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Accessibility</h3>
        <div className={styles.toggleList}>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} />
            <div>
              <span>Reduced Motion</span>
              <p className={styles.infoText}>Disable all animations and transitions</p>
            </div>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={highContrast} onChange={e => setHighContrast(e.target.checked)} />
            <div>
              <span>High Contrast</span>
              <p className={styles.infoText}>Increase border visibility and text contrast</p>
            </div>
          </label>
        </div>
        <div className={styles.rangeField} style={{ marginTop: 8 }}>
          <label className={styles.rangeLabel}>Piece Scale: {pieceScale}%</label>
          <input
            type="range" min="100" max="130" step="5"
            value={pieceScale}
            onChange={e => setPieceScale(Number(e.target.value))}
            className={styles.range}
          />
        </div>
      </section>

      {/* ════════ Reset ════════ */}
      <button className={styles.resetBtn} onClick={handleResetAll}>
        Reset All to Default
      </button>
    </div>
  );
}
