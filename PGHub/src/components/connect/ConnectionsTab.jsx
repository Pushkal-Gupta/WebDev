import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ExternalLink, RefreshCw, X, Check, Loader2, Plus, Contact, Bird, Camera, Play,
  Send, Globe, Code2, Trophy, Binary, ChefHat, LayoutGrid,
  Braces, Swords, Layers, BarChart3, GitBranch, Briefcase, MessagesSquare,
  MessageCircle, BookOpen, FileText, Upload, Download, Trash2,
} from 'lucide-react';
import {
  PLATFORMS, PLATFORM_GROUPS, getLinkedAccounts, saveLinkedAccounts, fetchPlatformStats,
  uploadResume, getResumeUrl, removeResume,
} from '../../lib/connections';

const ICONS = {
  leetcode: Code2, github: GitBranch, codeforces: Trophy, codechef: ChefHat, hackerrank: Binary,
  gfg: Braces, atcoder: Swords, hackerearth: Layers, kaggle: BarChart3, stackoverflow: Layers,
  gitlab: GitBranch, codolio: LayoutGrid, linkedin: Contact, naukri: Briefcase, twitter: Bird,
  discord: MessagesSquare, instagram: Camera, youtube: Play, telegram: Send, reddit: MessageCircle,
  medium: BookOpen, devto: Code2, website: Globe,
};

export default function ConnectionsTab({ user }) {
  const [accounts, setAccounts] = useState(null);
  const [resume, setResume] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(() => {
    getLinkedAccounts(user.id).then(setAccounts).catch(() => setAccounts([]));
    getResumeUrl(user.id).then(setResume).catch(() => setResume(null));
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  const byId = (id) => (accounts || []).find((a) => a.id === id);
  const persist = async (next) => { setAccounts(next); try { await saveLinkedAccounts(user.id, next); } catch { setErr('Could not save — has the profile migration been applied?'); } };

  const connect = async (p) => {
    const h = handle.trim(); if (!h) return;
    setBusy(p.id); setErr('');
    let stats = null;
    if (p.kind === 'stats') {
      try { stats = await fetchPlatformStats(p.id, h); }
      catch (e) { setErr(`${p.name}: ${e.message || 'could not fetch'}`); setBusy(null); return; }
    }
    const entry = { id: p.id, handle: h, stats, synced_at: new Date().toISOString() };
    await persist([...(accounts || []).filter((a) => a.id !== p.id), entry]);
    setBusy(null); setOpenId(null); setHandle('');
  };
  const sync = async (p) => {
    const a = byId(p.id); if (!a) return;
    setBusy(p.id); setErr('');
    try {
      const stats = await fetchPlatformStats(p.id, a.handle);
      await persist(accounts.map((x) => (x.id === p.id ? { ...x, stats, synced_at: new Date().toISOString() } : x)));
    } catch (e) { setErr(`${p.name}: ${e.message || 'sync failed'}`); }
    setBusy(null);
  };
  const remove = async (p) => { await persist((accounts || []).filter((a) => a.id !== p.id)); if (openId === p.id) setOpenId(null); };

  const onResumeFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy('resume'); setErr('');
    try { const url = await uploadResume(user.id, file); setResume(url); }
    catch (er) { setErr(`Resume: ${er.message || 'upload failed'}`); }
    setBusy(null); if (fileRef.current) fileRef.current.value = '';
  };
  const dropResume = async () => { try { await removeResume(user.id); setResume(null); } catch { setErr('Could not remove resume.'); } };

  if (accounts === null) return <div className="pgc-feed-loading"><Loader2 size={22} className="pgc-spin" /></div>;

  const connected = accounts.length;
  const totalSolved = accounts.reduce((s, a) => s + (Number(a.stats?.solved) || 0), 0);

  const card = (p) => {
    const a = byId(p.id); const b = busy === p.id; const Ic = ICONS[p.id] || Globe;
    return (
      <div key={p.id} className={`pgc-conn-card ${a ? 'on' : ''}`} style={{ '--pc': `var(${p.hue})` }}>
        <div className="pgc-conn-top">
          <span className="pgc-conn-ic"><Ic size={18} /></span>
          <div className="pgc-conn-name">
            {p.name}
            {a
              ? <a href={p.url(a.handle)} target="_blank" rel="noreferrer">@{a.handle} <ExternalLink size={10} /></a>
              : <span className="pgc-conn-kind">{p.kind === 'stats' ? 'live stats' : 'profile link'}</span>}
          </div>
          {a ? <button className="pgc-conn-remove" onClick={() => remove(p)} title="Disconnect"><X size={14} /></button> : null}
        </div>

        {a && a.stats?.items?.length ? (
          <div className="pgc-conn-stats">
            {a.stats.items.map((it, i) => (
              <div key={i} className="pgc-conn-chip"><b>{it.value}</b><span>{it.label}</span></div>
            ))}
          </div>
        ) : a && p.kind === 'link' ? (
          <a className="pgc-conn-open" href={p.url(a.handle)} target="_blank" rel="noreferrer">Open profile <ExternalLink size={12} /></a>
        ) : null}

        <div className="pgc-conn-foot">
          {a ? (
            p.kind === 'stats'
              ? <button className="pgc-conn-sync" onClick={() => sync(p)} disabled={b}>{b ? <Loader2 size={13} className="pgc-spin" /> : <RefreshCw size={13} />} Sync</button>
              : <span className="pgc-conn-linked"><Check size={13} /> Linked</span>
          ) : openId === p.id ? (
            <form className="pgc-conn-form" onSubmit={(e) => { e.preventDefault(); connect(p); }}>
              <input autoFocus value={handle} onChange={(e) => setHandle(e.target.value)} placeholder={p.ph} maxLength={200} />
              <button type="submit" className="ok" disabled={b || !handle.trim()}>{b ? <Loader2 size={13} className="pgc-spin" /> : <Check size={14} />}</button>
              <button type="button" onClick={() => { setOpenId(null); setHandle(''); }}><X size={14} /></button>
            </form>
          ) : (
            <button className="pgc-conn-add" onClick={() => { setOpenId(p.id); setHandle(''); setErr(''); }}><Plus size={14} /> Connect</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pgc-conns">
      <header className="pgc-conns-hero">
        <h1>Connected accounts</h1>
        <p>Link every coding and social profile into one card — live stats where the platform allows it, verified links everywhere else. Upload your resume too.</p>
      </header>

      <div className="pgc-conns-summary">
        <div className="pgc-conns-stat"><b>{connected}</b><span>connected</span></div>
        <div className="pgc-conns-stat"><b>{totalSolved.toLocaleString()}</b><span>problems solved</span></div>
        <div className="pgc-conns-stat"><b>{PLATFORMS.length}</b><span>platforms available</span></div>
      </div>
      {err ? <p className="pgc-conns-err">{err}</p> : null}

      {/* Resume */}
      <div className="pgc-resume">
        <span className="pgc-resume-ic"><FileText size={20} /></span>
        <div className="pgc-resume-body">
          <b>Resume</b>
          <span>{resume ? 'PDF uploaded — shown on your profile.' : 'Upload a PDF to attach to your profile (max 8 MB).'}</span>
        </div>
        <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onResumeFile} />
        {resume ? (
          <div className="pgc-resume-actions">
            <a className="pgc-resume-btn" href={resume} target="_blank" rel="noreferrer"><Download size={14} /> View</a>
            <button className="pgc-resume-btn" onClick={() => fileRef.current?.click()} disabled={busy === 'resume'}>{busy === 'resume' ? <Loader2 size={14} className="pgc-spin" /> : <Upload size={14} />} Replace</button>
            <button className="pgc-resume-btn del" onClick={dropResume}><Trash2 size={14} /></button>
          </div>
        ) : (
          <button className="pgc-resume-btn primary" onClick={() => fileRef.current?.click()} disabled={busy === 'resume'}>{busy === 'resume' ? <Loader2 size={14} className="pgc-spin" /> : <Upload size={14} />} Upload PDF</button>
        )}
      </div>

      {PLATFORM_GROUPS.map((g) => (
        <section key={g} className="pgc-conns-section">
          <div className="pgc-group-label">{g}</div>
          <div className="pgc-conns-grid">{PLATFORMS.filter((p) => p.group === g).map(card)}</div>
        </section>
      ))}
    </div>
  );
}
