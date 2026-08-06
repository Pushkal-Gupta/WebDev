import { useState, useEffect, useCallback } from 'react';
import { Pencil, Check, X, Trophy, Users, Heart, Loader2, PenSquare, UserPlus, Video as VideoIcon, ArrowRight, Link2, ExternalLink, FileText, MapPin, Building2, Globe as LinkIcon } from 'lucide-react';
import { getMyProfile, updateMyProfile, getFollowCounts, getUserPosts, deletePost } from '../../lib/social';
import { platformById } from '../../lib/connections';

const goTab = (t) => window.dispatchEvent(new CustomEvent('pg:connect-tab', { detail: t }));
const startVideoRoom = () => window.dispatchEvent(new CustomEvent('pg:start-room', { detail: { mode: 'video' } }));

// Custom profile backgrounds — theme-token gradients so they adapt to every palette.
const BG_PRESETS = {
  aurora: 'linear-gradient(135deg, color-mix(in srgb, var(--hue-violet) 70%, transparent), color-mix(in srgb, var(--hue-sky) 70%, transparent))',
  ocean:  'linear-gradient(135deg, color-mix(in srgb, var(--hue-sky) 75%, transparent), color-mix(in srgb, var(--hue-mint) 70%, transparent))',
  sunset: 'linear-gradient(135deg, color-mix(in srgb, var(--hard) 70%, transparent), color-mix(in srgb, var(--warning) 70%, transparent))',
  mint:   'linear-gradient(135deg, color-mix(in srgb, var(--hue-mint) 75%, transparent), color-mix(in srgb, var(--easy) 65%, transparent))',
  violet: 'linear-gradient(135deg, color-mix(in srgb, var(--hue-violet) 80%, transparent), color-mix(in srgb, var(--hue-pink) 65%, transparent))',
  accent: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 40%, var(--surface)))',
};
const PRESET_KEYS = Object.keys(BG_PRESETS);

function timeAgo(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'now'; const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`; const d = Math.floor(h / 24);
  return d < 7 ? `${d}d` : `${Math.floor(d / 7)}w`;
}

export default function ProfileTab({ user, myName }) {
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: '', username: '', bio: '', background_preset: 'aurora', location: '', company: '', website_url: '', skills: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    getMyProfile(user.id).then((p) => {
      setProfile(p);
      setForm({ display_name: p.display_name || myName, username: p.username || '', bio: p.bio || '', background_preset: p.background_preset || 'aurora', location: p.location || '', company: p.company || '', website_url: p.website_url || '', skills: Array.isArray(p.skills) ? p.skills.join(', ') : '' });
    }).catch(() => {});
    getFollowCounts(user.id).then(setCounts).catch(() => {});
    getUserPosts(user.id, user.id).then(setPosts).catch(() => {});
  }, [user.id, myName]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setErr('');
    const uname = form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    try {
      await updateMyProfile(user.id, {
        display_name: form.display_name.trim() || myName, username: uname || null, bio: form.bio.trim() || null, background_preset: form.background_preset,
        location: form.location.trim() || null, company: form.company.trim() || null,
        website_url: form.website_url.trim() || null,
        skills: [...new Set(form.skills.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 12),
      });
      setEditing(false); load();
    } catch (e) { setErr(e.message?.includes('duplicate') || e.code === '23505' ? 'That username is taken.' : 'Could not save.'); }
    setSaving(false);
  };
  const removePost = async (id) => { setPosts((l) => l.filter((p) => p.id !== id)); try { await deletePost(id); } catch { load(); } };

  if (!profile) return <div className="pgc-feed-loading"><Loader2 size={22} className="pgc-spin" /></div>;
  const bg = BG_PRESETS[form.background_preset] || BG_PRESETS.aurora;

  return (
    <div className="pgc-profile">
      <div className="pgc-banner" style={{ background: bg }}>
        {!editing ? (
          <button className="pgc-edit-btn" onClick={() => setEditing(true)}><Pencil size={13} /> Edit</button>
        ) : (
          <div className="pgc-edit-actions">
            <button className="pgc-edit-save" onClick={save} disabled={saving}>{saving ? <Loader2 size={13} className="pgc-spin" /> : <Check size={13} />} Save</button>
            <button className="pgc-edit-cancel" onClick={() => { setEditing(false); setErr(''); }} aria-label="Cancel editing"><X size={13} /></button>
          </div>
        )}
        <span className="pgc-banner-av">{(form.display_name || myName || '?').slice(0, 1).toUpperCase()}</span>
      </div>

      <div className="pgc-profile-body">
        {editing ? (
          <div className="pgc-edit-form">
            <label>Display name<input value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} maxLength={40} /></label>
            <label>Username<div className="pgc-uname"><span>@</span><input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} maxLength={24} placeholder="username" /></div></label>
            <label>Bio<textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} maxLength={200} rows={2} placeholder="Tell people what you're building…" /></label>
            <div className="pgc-edit-row">
              <label>Location<input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} maxLength={60} placeholder="City, Country" /></label>
              <label>Company / School<input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} maxLength={60} placeholder="Where you work or study" /></label>
            </div>
            <label>Website<input value={form.website_url} onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))} maxLength={120} placeholder="https://…" /></label>
            <label>Skills<input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} maxLength={200} placeholder="Comma-separated, e.g. Python, DP, Systems" /></label>
            <div className="pgc-bg-picker">
              <span>Background</span>
              <div className="pgc-bg-swatches">
                {PRESET_KEYS.map((k) => (
                  <button key={k} type="button" className={`pgc-bg-swatch ${form.background_preset === k ? 'on' : ''}`} style={{ background: BG_PRESETS[k] }} onClick={() => setForm((f) => ({ ...f, background_preset: k }))} title={k} />
                ))}
              </div>
            </div>
            {err ? <p className="pgc-edit-err">{err}</p> : null}
          </div>
        ) : (
          <>
            <h2 className="pgc-profile-name">{profile.display_name || myName}</h2>
            {profile.username ? <span className="pgc-profile-handle">@{profile.username}</span> : null}
            {profile.bio ? <p className="pgc-profile-bio">{profile.bio}</p> : null}
            {profile.location || profile.company || profile.website_url ? (
              <div className="pgc-profile-meta">
                {profile.location ? <span><MapPin size={13} /> {profile.location}</span> : null}
                {profile.company ? <span><Building2 size={13} /> {profile.company}</span> : null}
                {profile.website_url ? <a href={/^https?:\/\//.test(profile.website_url) ? profile.website_url : `https://${profile.website_url}`} target="_blank" rel="noreferrer"><LinkIcon size={13} /> {profile.website_url.replace(/^https?:\/\//, '')}</a> : null}
              </div>
            ) : null}
            {Array.isArray(profile.skills) && profile.skills.length ? (
              <div className="pgc-profile-skills">{profile.skills.map((s) => <span key={s} className="pgc-skill">{s}</span>)}</div>
            ) : null}
            <div className="pgc-profile-stats">
              {(() => {
                const across = (profile.linked_accounts || []).reduce((s, a) => s + (Number(a.stats?.solved) || 0), 0);
                const solved = Math.max(profile.total_solved || 0, across);
                return <span><b>{solved.toLocaleString()}</b> <Trophy size={12} /> solved{across > 0 ? <em className="pgc-stat-sub">across platforms</em> : null}</span>;
              })()}
              <span><b>{counts.followers}</b> <Users size={12} /> followers</span>
              <span><b>{counts.following}</b> following</span>
            </div>
            {profile.linked_accounts?.length || profile.resume_url ? (
              <div className="pgc-profile-links">
                {(profile.linked_accounts || []).map((a) => {
                  const p = platformById(a.id); if (!p) return null;
                  return (
                    <a key={a.id} className="pgc-plink" href={p.url(a.handle)} target="_blank" rel="noreferrer" style={{ '--pc': `var(${p.hue})` }}>
                      {p.name}{a.stats?.solved != null ? <b>{a.stats.solved}</b> : <ExternalLink size={11} />}
                    </a>
                  );
                })}
                {profile.resume_url ? (
                  <a className="pgc-plink" href={profile.resume_url} target="_blank" rel="noreferrer" style={{ '--pc': 'var(--accent)' }}>
                    <FileText size={12} /> Resume
                  </a>
                ) : null}
                <button className="pgc-plink-manage" onClick={() => goTab('accounts')}>Manage</button>
              </div>
            ) : (
              <button className="pgc-plink-cta" onClick={() => goTab('accounts')}><Link2 size={14} /> Connect accounts &amp; upload resume</button>
            )}
          </>
        )}

        <div className="pgc-profile-posts">
          <div className="pgc-group-label">Your posts</div>
          {posts.length === 0 ? (
            <div className="pgc-onboard">
              <p>Your posts will show up here. Get started:</p>
              <div className="pgc-onboard-cards">
                <button onClick={() => goTab('feed')}>
                  <span className="pgc-onboard-ic feed"><PenSquare size={18} /></span>
                  <b>Write your first post</b>
                  <span>Share an update or a question in the Feed</span>
                  <ArrowRight size={15} className="pgc-onboard-go" />
                </button>
                <button onClick={() => goTab('people')}>
                  <span className="pgc-onboard-ic people"><UserPlus size={18} /></span>
                  <b>Find people to follow</b>
                  <span>Discover coders and build your network</span>
                  <ArrowRight size={15} className="pgc-onboard-go" />
                </button>
                <button onClick={startVideoRoom}>
                  <span className="pgc-onboard-ic meet"><VideoIcon size={18} /></span>
                  <b>Start a Meet room</b>
                  <span>Video or voice — share the code to invite</span>
                  <ArrowRight size={15} className="pgc-onboard-go" />
                </button>
              </div>
            </div>
          ) : posts.map((p) => (
            <article key={p.id} className="pgc-post compact">
              <div className="pgc-post-main">
                <div className="pgc-post-head"><span className="pgc-post-time">{timeAgo(p.created_at)}</span></div>
                <p className="pgc-post-body">{p.body}</p>
                <div className="pgc-post-actions">
                  <span className="pgc-post-act"><Heart size={14} /> {p.like_count || 0}</span>
                  <button className="pgc-post-act del" onClick={() => removePost(p.id)} aria-label="Delete post"><X size={13} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
