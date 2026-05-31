import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, UserPlus, Users, Check, Clock, Trash2, Palette, Code2, Sparkles, RotateCcw } from 'lucide-react';
import {
  getAiKey, setAiKey, getProxyUrl, setProxyUrl,
  getAiProvider, setAiProvider, getAiModel, setAiModel,
  getAiEnabledPref, setAiEnabledPref,
  AI_PROVIDERS,
} from '../lib/ai';
import { loadCustomColors, saveCustomColors, applyCustomColors } from '../lib/customColors';
import './SettingsModal.css';

// CSS-var tokens the user can override. Labels are user-facing.
const COLOR_TOKENS = [
  { token: '--accent',    label: 'Accent (links, focus)' },
  { token: '--bg',        label: 'Background' },
  { token: '--surface',   label: 'Surface (cards, panels)' },
  { token: '--text-main', label: 'Main text' },
  { token: '--text-dim',  label: 'Dim text (labels)' },
  { token: '--border',    label: 'Border' },
  { token: '--hover-box', label: 'Hover tint' },
];

function rgbStringToHex(s) {
  // Accepts "#aabbcc", "rgb(170,187,204)", or "rgba(...)" — returns 6-digit hex.
  if (!s) return '#000000';
  if (s.startsWith('#')) return s.length === 4
    ? '#' + [1, 2, 3].map(i => s[i] + s[i]).join('')
    : s.slice(0, 7);
  const m = s.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) return '#000000';
  return '#' + [0, 1, 2].map(i => Number(m[i]).toString(16).padStart(2, '0')).join('');
}

function ColorCustomizer({ theme, onChange }) {
  // Pull live computed values for the active theme as the picker defaults.
  // Overrides (if any) take precedence.
  const initial = () => {
    const overrides = loadCustomColors();
    const cs = getComputedStyle(document.documentElement);
    const out = {};
    for (const { token } of COLOR_TOKENS) {
      out[token] = overrides[token] || rgbStringToHex(cs.getPropertyValue(token).trim());
    }
    return out;
  };
  const [colors, setColors] = useState(initial);
  // Tracks which tokens are explicitly overridden vs falling through to the theme.
  const [, setOverrides] = useState(() => Object.keys(loadCustomColors()));

  // Re-seed when the user picks a different base theme.
  useEffect(() => {
    const id = requestAnimationFrame(() => setColors(initial()));
    return () => cancelAnimationFrame(id);
  }, [theme]);

  const onPick = (token, value) => {
    const next = { ...colors, [token]: value };
    setColors(next);
    applyCustomColors(next);
    setOverrides(Object.keys(next));
    saveCustomColors(next);
    if (onChange) onChange();
  };

  const resetAll = () => {
    saveCustomColors({});
    setOverrides([]);
    setColors(initial());
  };

  return (
    <div className="appearance-block">
      <label className="settings-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><Palette size={12} /> Custom Colors</span>
        <button type="button" className="lang-card" style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }} onClick={resetAll}>
          <RotateCcw size={11} style={{ marginRight: 4 }} /> Reset to theme
        </button>
      </label>
      <p className="settings-hint" style={{ marginTop: 0 }}>
        Override individual tokens. Overrides stack on top of the base theme above and survive theme switches.
      </p>
      <div className="color-picker-grid">
        {COLOR_TOKENS.map(({ token, label }) => (
          <label key={token} className="color-picker-row">
            <input
              type="color"
              value={colors[token] || '#000000'}
              onChange={(e) => onPick(token, e.target.value)}
            />
            <span className="color-picker-label">{label}</span>
            <code className="color-picker-token">{token}</code>
          </label>
        ))}
      </div>
    </div>
  );
}

// Each preset declares its mode and a `pair` pointing to its opposite-mode
// sibling. The Dark/Light toggle in TopBar flips to that pair so users keep
// their palette identity (dracula stays dracula, etc.) across modes.
const THEME_PRESETS = [
  { id: 'dark',             name: 'Default Dark',     mode: 'dark',  pair: 'light',            swatches: ['#030a0a', '#061010', '#00fff5'] },
  { id: 'light',            name: 'Default Light',    mode: 'light', pair: 'dark',             swatches: ['#f5f2ed', '#ffffff', '#008a7e'] },
  { id: 'midnight',         name: 'Midnight',         mode: 'dark',  pair: 'midnight-light',   swatches: ['#0b1024', '#131a3a', '#a78bfa'] },
  { id: 'midnight-light',   name: 'Midnight Light',   mode: 'light', pair: 'midnight',         swatches: ['#eef1ff', '#dfe5ff', '#6b4dff'] },
  { id: 'solarized',        name: 'Solarized Light',  mode: 'light', pair: 'solarized-dark',   swatches: ['#fdf6e3', '#eee8d5', '#268bd2'] },
  { id: 'solarized-dark',   name: 'Solarized Dark',   mode: 'dark',  pair: 'solarized',        swatches: ['#002b36', '#073642', '#268bd2'] },
  { id: 'dracula',          name: 'Dracula',          mode: 'dark',  pair: 'dracula-light',    swatches: ['#282a36', '#21222c', '#ff79c6'] },
  { id: 'dracula-light',    name: 'Dracula Light',    mode: 'light', pair: 'dracula',          swatches: ['#f4f4ff', '#e5e5f5', '#c4378a'] },
];

export { THEME_PRESETS };

const LANG_OPTIONS = [
  { value: 'python',     label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java',       label: 'Java' },
  { value: 'cpp',        label: 'C++' },
];

const PROVIDER_META = {
  anthropic: {
    placeholder: 'sk-ant-...',
    link: { href: 'https://console.anthropic.com', label: 'console.anthropic.com' },
  },
  openai: {
    placeholder: 'sk-...',
    link: { href: 'https://platform.openai.com/api-keys', label: 'platform.openai.com/api-keys' },
  },
  gemini: {
    placeholder: 'AIza...',
    link: { href: 'https://aistudio.google.com/apikey', label: 'aistudio.google.com/apikey' },
  },
};

function AiSettings({ onMessage }) {
  const [provider, setProvider] = useState(() => getAiProvider());
  const [key, setKey] = useState(() => getAiKey(getAiProvider()));
  const [model, setModel] = useState(() => getAiModel(getAiProvider()));
  const [proxy, setProxy] = useState(() => getProxyUrl());
  const [reveal, setReveal] = useState(false);

  const onProviderChange = (next) => {
    // Persist the provider switch immediately so getAiKey/getAiModel below
    // read from the right slot, and load that provider's stored key+model.
    setAiProvider(next);
    setProvider(next);
    setKey(getAiKey(next));
    setModel(getAiModel(next));
  };

  const save = () => {
    setAiProvider(provider);
    setAiKey(key.trim(), provider);
    setAiModel(model.trim(), provider);
    setProxyUrl(proxy.trim());
    onMessage({ type: 'success', text: 'AI settings saved.' });
    setTimeout(() => onMessage(null), 1500);
  };

  const clear = () => {
    setAiKey('', provider);
    setProxyUrl('');
    setKey(''); setProxy('');
    onMessage({ type: 'info', text: `${provider} credentials cleared.` });
    setTimeout(() => onMessage(null), 1500);
  };

  const meta = PROVIDER_META[provider] || PROVIDER_META.anthropic;
  const providerLabel = AI_PROVIDERS.find(p => p.id === provider)?.label || provider;

  return (
    <div className="appearance-section">
      <div className="appearance-block">
        <label className="settings-label"><Sparkles size={12} /> AI hints + failure analysis</label>
        <p className="settings-hint">
          Opt-in. Your key stays in your browser — nothing is stored on the server.
          Pick a provider and paste a key. For production, set a proxy URL instead and your edge function forwards with the real key server-side.
        </p>

        <label className="settings-label" style={{ marginTop: '0.6rem' }}>Provider</label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {AI_PROVIDERS.map(p => (
            <button
              key={p.id}
              type="button"
              className="lang-card"
              onClick={() => onProviderChange(p.id)}
              style={{
                borderColor: provider === p.id ? 'var(--accent)' : 'var(--border)',
                color: provider === p.id ? 'var(--accent)' : 'var(--text-main)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <p className="sm-ai-explainer">
          AI is optional. Enable it to use these helpers across the platform:
          <br />• <strong>Workspace</strong>: explain why a submission failed.
          <br />• <strong>Solving</strong>: ask for a hint without revealing the full answer.
          <br />• <strong>Concepts</strong>: generate practice quizzes on the fly.
          <br />Your API key is stored locally only — never sent to our server.
        </p>
        <label className="settings-label" style={{ marginTop: '0.6rem' }}>{providerLabel} API key</label>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <input
            type={reveal ? 'text' : 'password'}
            className="settings-input"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={meta.placeholder}
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="lang-card" onClick={() => setReveal(r => !r)}>
            {reveal ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="settings-hint" style={{ marginTop: '0.35rem' }}>
          Get a key at <a href={meta.link.href} target="_blank" rel="noopener noreferrer">{meta.link.label}</a>.
        </p>

        <label className="settings-label" style={{ marginTop: '0.6rem' }}>Model (optional)</label>
        <input
          type="text"
          className="settings-input"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={AI_PROVIDERS.find(p => p.id === provider)?.defaultModel || ''}
          spellCheck={false}
        />

        <label className="settings-label" style={{ marginTop: '0.6rem' }}>Proxy URL (optional, overrides direct call)</label>
        <input
          type="url"
          className="settings-input"
          value={proxy}
          onChange={(e) => setProxy(e.target.value)}
          placeholder="https://your-edge-function.example.com/ai"
          spellCheck={false}
        />

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
          <button className="settings-save-btn" onClick={save}>Save</button>
          <button className="settings-save-btn" style={{ background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)' }} onClick={clear}>Clear key</button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsModal({ session, onClose, theme, applyTheme, setPreferredLang, preferredLang }) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [friendEmail, setFriendEmail] = useState('');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendProgress, setFriendProgress] = useState({});
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState(null);
  const [localPreferredLang, setLocalPreferredLang] = useState(preferredLang || 'python');
  // Editor-customization knobs stored in localStorage only (no backend yet).
  const [editorFontSize, setEditorFontSize] = useState(() => Number(localStorage.getItem('pg-editor-font-size')) || 14);
  const [editorTabSize, setEditorTabSize] = useState(() => Number(localStorage.getItem('pg-editor-tab-size')) || 2);
  const [editorMinimap, setEditorMinimap] = useState(() => localStorage.getItem('pg-editor-minimap') === 'true');
  const [editorWordWrap, setEditorWordWrap] = useState(() => localStorage.getItem('pg-editor-word-wrap') !== 'false');
  useEffect(() => { localStorage.setItem('pg-editor-font-size', String(editorFontSize)); }, [editorFontSize]);
  useEffect(() => { localStorage.setItem('pg-editor-tab-size', String(editorTabSize)); }, [editorTabSize]);
  useEffect(() => { localStorage.setItem('pg-editor-minimap', String(editorMinimap)); }, [editorMinimap]);
  useEffect(() => { localStorage.setItem('pg-editor-word-wrap', String(editorWordWrap)); }, [editorWordWrap]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLocalPreferredLang(preferredLang || 'python'); }, [preferredLang]);

  useEffect(() => {
    if (!session?.user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from('PGcode_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (data) setDisplayName(data.display_name || '');
    };
    const loadFriends = async () => {
      try {
        const { data: sent } = await supabase
          .from('PGcode_friends')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'accepted');
        const { data: received } = await supabase
          .from('PGcode_friends')
          .select('*')
          .eq('friend_id', session.user.id)
          .eq('status', 'accepted');
        const { data: pending } = await supabase
          .from('PGcode_friends')
          .select('*')
          .eq('friend_id', session.user.id)
          .eq('status', 'pending');

        setFriends([...(sent || []), ...(received || [])]);
        setPendingRequests(pending || []);

        const friendIds = [
          ...(sent || []).map(f => f.friend_id),
          ...(received || []).map(f => f.user_id),
        ];
        if (friendIds.length > 0) {
          const { data: profiles } = await supabase
            .from('PGcode_profiles')
            .select('*')
            .in('user_id', friendIds);
          const map = {};
          (profiles || []).forEach(p => { map[p.user_id] = p; });
          setFriendProgress(map);
        }
      } catch (err) {
        console.error('Error loading friends:', err);
      }
    };
    loadProfile();
    loadFriends();
  }, [session]);

  const reloadFriends = async () => {
    if (!session?.user) return;
    const { data: sent } = await supabase.from('PGcode_friends').select('*').eq('user_id', session.user.id).eq('status', 'accepted');
    const { data: received } = await supabase.from('PGcode_friends').select('*').eq('friend_id', session.user.id).eq('status', 'accepted');
    const { data: pending } = await supabase.from('PGcode_friends').select('*').eq('friend_id', session.user.id).eq('status', 'pending');
    setFriends([...(sent || []), ...(received || [])]);
    setPendingRequests(pending || []);
  };

  const saveProfile = async () => {
    if (!session?.user) return;
    const { error } = await supabase.from('PGcode_profiles').upsert({
      user_id: session.user.id,
      display_name: displayName,
    });
    setMessage(
      error
        ? { type: 'error', text: 'Failed to save profile.' }
        : { type: 'success', text: 'Profile saved.' }
    );
    setTimeout(() => setMessage(null), 2000);
  };

  const sendFriendRequest = async () => {
    if (!friendEmail.trim() || !session?.user) return;
    setMessage({ type: 'info', text: 'Friend request system requires user lookup. Share your profile link for now!' });
    setFriendEmail('');
    setTimeout(() => setMessage(null), 3000);
  };

  const acceptRequest = async (requestId) => {
    const { error } = await supabase.from('PGcode_friends').update({ status: 'accepted' }).eq('id', requestId);
    if (error) {
      setMessage({ type: 'error', text: `Couldn't accept request: ${error.message}` });
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    reloadFriends();
  };

  const rejectRequest = async (requestId) => {
    const { error } = await supabase.from('PGcode_friends').delete().eq('id', requestId);
    if (error) {
      setMessage({ type: 'error', text: `Couldn't reject request: ${error.message}` });
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    reloadFriends();
  };

  const handleThemePick = (id) => {
    if (applyTheme) applyTheme(id);
  };

  const handleLangPick = (lang) => {
    setLocalPreferredLang(lang);
    if (setPreferredLang) setPreferredLang(lang);
    if (session?.user) {
      setMessage({ type: 'success', text: `Default language set to ${LANG_OPTIONS.find(o => o.value === lang)?.label}.` });
      setTimeout(() => setMessage(null), 1800);
    }
  };

  return (
    <div className="settings-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="settings-content">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI
          </button>
          <button
            className={`settings-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends
          </button>
        </div>

        <div className="settings-body">
          {activeTab === 'appearance' && (
            <div className="appearance-section">
              <div className="appearance-block">
                <label className="settings-label">
                  <Palette size={12} /> Theme
                </label>
                <div className="theme-grid">
                  {THEME_PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`theme-card ${theme === p.id ? 'active' : ''}`}
                      onClick={() => handleThemePick(p.id)}
                      aria-pressed={theme === p.id}
                    >
                      <div className="theme-swatches">
                        {p.swatches.map((c, i) => (
                          <span key={i} className="theme-swatch" style={{ background: c }} />
                        ))}
                      </div>
                      <span className="theme-name">{p.name}</span>
                      {theme === p.id && <span className="theme-active-dot" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                <p className="settings-hint">
                  {session?.user
                    ? 'Saved to your profile so it follows you across devices.'
                    : 'Sign in to sync your theme across devices.'}
                </p>
              </div>

              <ColorCustomizer theme={theme} />

              <div className="appearance-block">
                <label className="settings-label">
                  <Code2 size={12} /> Default Coding Language
                </label>
                <div className="lang-grid">
                  {LANG_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      className={`lang-card ${localPreferredLang === o.value ? 'active' : ''}`}
                      onClick={() => handleLangPick(o.value)}
                      aria-pressed={localPreferredLang === o.value}
                      disabled={!session?.user}
                      title={!session?.user ? 'Sign in to save a default language' : ''}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="settings-hint">
                  {session?.user
                    ? 'New problems open in this language by default. You can switch any time inside the workspace.'
                    : 'Sign in to choose a default coding language.'}
                </p>
              </div>

              <div className="appearance-block">
                <label className="settings-label"><Code2 size={12} /> Editor Preferences</label>
                <div className="settings-pref-row">
                  <span className="settings-pref-name">Font size</span>
                  <div className="settings-pref-control">
                    <input
                      type="range" min="11" max="22" step="1"
                      value={editorFontSize}
                      onChange={(e) => setEditorFontSize(Number(e.target.value))}
                    />
                    <span className="settings-pref-value">{editorFontSize}px</span>
                  </div>
                </div>
                <div className="settings-pref-row">
                  <span className="settings-pref-name">Tab size</span>
                  <div className="settings-pref-control">
                    {[2, 4, 8].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`settings-pref-pill ${editorTabSize === n ? 'active' : ''}`}
                        onClick={() => setEditorTabSize(n)}
                      >{n}</button>
                    ))}
                  </div>
                </div>
                <div className="settings-pref-row">
                  <span className="settings-pref-name">Minimap</span>
                  <button
                    type="button"
                    className={`settings-toggle ${editorMinimap ? 'on' : ''}`}
                    onClick={() => setEditorMinimap(v => !v)}
                    aria-pressed={editorMinimap}
                  ><span /></button>
                </div>
                <div className="settings-pref-row">
                  <span className="settings-pref-name">Word wrap</span>
                  <button
                    type="button"
                    className={`settings-toggle ${editorWordWrap ? 'on' : ''}`}
                    onClick={() => setEditorWordWrap(v => !v)}
                    aria-pressed={editorWordWrap}
                  ><span /></button>
                </div>
                <p className="settings-hint">Applies on next problem load. Stored locally per browser.</p>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <AiSettings onMessage={setMessage} />
          )}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <label className="settings-label">Display Name</label>
              <input
                type="text"
                className="settings-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
              <p className="settings-hint">Email: {session?.user?.email}</p>
              <button className="settings-save-btn" onClick={saveProfile}>Save Profile</button>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="friends-section">
              <div className="add-friend-row">
                <input
                  type="email"
                  className="settings-input"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="Friend's email address"
                />
                <button className="add-friend-btn" onClick={sendFriendRequest}>
                  <UserPlus size={14} /> Add
                </button>
              </div>

              {pendingRequests.length > 0 && (
                <div className="friend-group">
                  <span className="friend-group-label">
                    <Clock size={12} /> Pending Requests
                  </span>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="friend-item pending">
                      <span className="friend-name">Friend request</span>
                      <div className="friend-actions">
                        <button className="friend-accept" onClick={() => acceptRequest(req.id)}>
                          <Check size={14} />
                        </button>
                        <button className="friend-reject" onClick={() => rejectRequest(req.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="friend-group">
                <span className="friend-group-label">
                  <Users size={12} /> Friends ({friends.length})
                </span>
                {friends.length === 0 ? (
                  <p className="friends-empty">No friends yet. Add someone to see their progress!</p>
                ) : (
                  friends.map((f, i) => {
                    const fId = f.friend_id === session.user.id ? f.user_id : f.friend_id;
                    const profile = friendProgress[fId];
                    return (
                      <div key={i} className="friend-item">
                        <div className="friend-info">
                          <span className="friend-name">{profile?.display_name || 'User'}</span>
                          <span className="friend-stats">
                            {profile?.total_solved || 0} solved
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {message && (
            <div className={`settings-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
