import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, UserPlus, Users, Check, Clock, Trash2, Palette, Code2, Sparkles, RotateCcw, LogOut, RefreshCw, Star, GitBranch, Users as UsersIcon } from 'lucide-react';
import ShareableCard from './ShareableCard';
import {
  getAiKey, setAiKey, getProxyUrl, setProxyUrl,
  getAiProvider, setAiProvider, getAiModel, setAiModel,
  AI_PROVIDERS,
} from '../lib/ai';
import { loadCustomColors, saveCustomColors, applyCustomColors } from '../lib/customColors';
import { sanitizeError } from '../lib/sanitizeError';
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
  const [activeTab, setActiveTab] = useState('profile');
  const [friendEmail, setFriendEmail] = useState('');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendProgress, setFriendProgress] = useState({});
  const [displayName, setDisplayName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [leetcodeHandle, setLeetcodeHandle] = useState('');
  const [message, setMessage] = useState(null);
  const [githubUsername, setGithubUsername] = useState(() => localStorage.getItem('pg-github-username') || '');
  const [ghStats, setGhStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pg-github-stats') || 'null'); } catch { return null; }
  });
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState(null);

  const fetchGithubStats = async (uname) => {
    const name = (uname ?? githubUsername).trim();
    if (!name) { setGhError('Add a GitHub username first.'); return; }
    setGhLoading(true);
    setGhError(null);
    try {
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}`);
      if (!userRes.ok) throw new Error(userRes.status === 404 ? 'GitHub user not found.' : `GitHub API ${userRes.status}`);
      const user = await userRes.json();
      const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}/repos?per_page=100&sort=updated`);
      const repos = reposRes.ok ? await reposRes.json() : [];
      const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
      const langs = {};
      repos.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
      const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
      const next = {
        login: user.login,
        name: user.name,
        avatar: user.avatar_url,
        bio: user.bio,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        stars,
        topLangs,
        fetchedAt: new Date().toISOString(),
      };
      setGhStats(next);
      localStorage.setItem('pg-github-stats', JSON.stringify(next));
      localStorage.setItem('pg-github-username', name);
    } catch (err) {
      setGhError(sanitizeError(err, "Couldn't load GitHub stats."));
    } finally {
      setGhLoading(false);
    }
  };
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

  useEffect(() => { setLocalPreferredLang(preferredLang || 'python'); }, [preferredLang]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!session?.user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from('PGcode_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name || '');
        setProfileUsername(data.username || '');
        setLeetcodeHandle(data.leetcode_handle || '');
      }
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
      leetcode_handle: leetcodeHandle.trim() || null,
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
      setMessage({ type: 'error', text: `Couldn't accept request: ${sanitizeError(error)}` });
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    reloadFriends();
  };

  const rejectRequest = async (requestId) => {
    const { error } = await supabase.from('PGcode_friends').delete().eq('id', requestId);
    if (error) {
      setMessage({ type: 'error', text: `Couldn't reject request: ${sanitizeError(error)}` });
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

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    onClose();
  };

  const [linkMsg, setLinkMsg] = useState(null);
  const handleLinkGithub = async () => {
    setLinkMsg(null);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'github',
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
    } catch (err) {
      setLinkMsg(sanitizeError(err, 'Could not start the GitHub link flow.'));
    }
  };
  const linkedProviders = (session?.user?.identities || []).map(i => i.provider);
  const hasGithubIdentity = linkedProviders.includes('github');

  return (
    <div className="settings-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="settings-content">
        <div className="settings-header">
          <div className="settings-header-text">
            <h2>Settings</h2>
            {session?.user?.email && <span className="settings-email">{session.user.email}</span>}
          </div>
          <div className="settings-header-actions">
            {session && (
              <button className="settings-logout" onClick={handleLogout} type="button">
                <LogOut size={14} /> Log out
              </button>
            )}
            <button className="settings-close" onClick={onClose}><X size={20} /></button>
          </div>
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
              {session?.user && !hasGithubIdentity && (
                <div className="github-link-row">
                  <div className="github-link-text">
                    <strong>Link your GitHub account</strong>
                    <span>Sign in once with GitHub to fetch stats automatically and skip the username field.</span>
                  </div>
                  <button type="button" className="github-link-btn" onClick={handleLinkGithub}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
                    </svg>
                    Link GitHub
                  </button>
                </div>
              )}
              {linkMsg && (
                <div className="link-error" role="alert">
                  <span className="link-error-msg">{linkMsg}</span>
                  <button type="button" className="link-error-dismiss" onClick={() => setLinkMsg(null)} aria-label="Dismiss">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="github-connect">
                <div className="github-connect-label">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
                  </svg>
                  Connect GitHub to enrich your card
                </div>
                <div className="github-connect-row">
                  <input
                    type="text"
                    className="settings-input"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="your-github-username"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="github-fetch-btn"
                    onClick={() => fetchGithubStats()}
                    disabled={ghLoading || !githubUsername.trim()}
                  >
                    {ghLoading ? <RefreshCw size={13} className="spin" /> : <RefreshCw size={13} />}
                    {ghStats ? 'Refresh' : 'Connect'}
                  </button>
                </div>
                {ghError && <p className="github-error">{ghError}</p>}
                {ghStats && <p className="github-meta">Last updated {new Date(ghStats.fetchedAt).toLocaleString()} · stats below appear on your card</p>}
              </div>

              {session?.user && (
                <div className="profile-card-block">
                  <ShareableCard
                    embedded
                    presetUserId={session.user.id}
                    presetUsername={profileUsername || session.user.email?.split('@')[0]}
                    presetDisplayName={displayName || session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}
                    githubStats={ghStats}
                    leetcodeHandle={leetcodeHandle}
                  />
                </div>
              )}

              <div className="profile-edit-block">
                <label className="settings-label">Display Name</label>
                <input
                  type="text"
                  className="settings-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
                <label className="settings-label" style={{ marginTop: '0.6rem' }}>
                  <Code2 size={12} /> LeetCode username
                </label>
                <input
                  type="text"
                  className="settings-input"
                  value={leetcodeHandle}
                  onChange={(e) => setLeetcodeHandle(e.target.value)}
                  placeholder="your-leetcode-username"
                  spellCheck={false}
                  autoComplete="off"
                />
                <p className="settings-hint">Adds your live LeetCode rating, rank, and contest history to your shareable card.</p>
                <p className="settings-hint">Email: {session?.user?.email}</p>
                <button className="settings-save-btn" onClick={saveProfile}>Save Profile</button>
              </div>
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
