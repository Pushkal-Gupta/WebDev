import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Zap, Copy, Check, Trophy, Clock, Send, User, Swords, ArrowLeft, Link2, Share2, MessageSquare, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMatch, joinMatch, updateMatch, pickRandomProblem, matchChannel } from '../../lib/versus';
import { gradeOnServer } from '../../lib/codeRunner';
import { generateTemplate } from '../../lib/driverCode';
import '../../styles/versus.css';

const MONACO_LANG = { python: 'python', javascript: 'javascript', java: 'java', cpp: 'cpp' };

export default function VersusMatch({ session }) {
  const { code } = useParams();
  const nav = useNavigate();
  const user = session?.user;
  const myName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';

  const [match, setMatch] = useState(null);
  const [problem, setProblem] = useState(null);
  const [role, setRole] = useState(null);          // 'host' | 'guest'
  const [oppPresent, setOppPresent] = useState(false);
  const [oppName, setOppName] = useState('Opponent');
  const [codeText, setCodeText] = useState('');
  const [myProg, setMyProg] = useState({ passed: 0, total: 0 });
  const [oppProg, setOppProg] = useState({ passed: 0, total: 0 });
  const [oppTyping, setOppTyping] = useState(false);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);       // { win: bool, reason }
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [err, setErr] = useState('');

  const chanRef = useRef(null);
  const typingTimer = useRef(null);
  const oppTypingTimer = useRef(null);
  const wonRef = useRef(false);

  const inviteUrl = `${window.location.origin}${window.location.pathname}#/versus/${code}`;
  const shareText = `Battle me on PGBattle — join with code ${code}: ${inviteUrl}`;
  const copyCode = () => { navigator.clipboard?.writeText(code); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1500); };
  const copyLink = () => { navigator.clipboard?.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const nativeShare = () => { navigator.share?.({ title: 'PGBattle', text: `Battle me on PGBattle — code ${code}`, url: inviteUrl }).catch(() => {}); };

  // load + join the match; determine role
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        let m = await getMatch(code);
        if (!m) { setErr('Match not found. It may have expired.'); return; }
        if (m.host_id === user.id) { if (!cancelled) setRole('host'); }
        else if (!m.guest_id || m.guest_id === user.id) { m = await joinMatch(code, user.id, myName) || m; if (!cancelled) setRole('guest'); }
        else if (m.guest_id !== user.id) { setErr('This match is already full.'); return; }
        if (!cancelled) setMatch(m);
      } catch (e) { if (!cancelled) setErr(e.message || 'Failed to load match'); }
    })();
    return () => { cancelled = true; };
  }, [code, user, myName]);

  // realtime channel: presence + broadcast
  useEffect(() => {
    if (!role || !user) return;
    const ch = matchChannel(code, user.id);
    chanRef.current = ch;
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const others = Object.values(state).flat().filter((p) => p.uid !== user.id);
      setOppPresent(others.length > 0);
      if (others[0]?.name) setOppName(others[0].name);
    });
    ch.on('broadcast', { event: 'progress' }, ({ payload }) => { if (payload.uid !== user.id) setOppProg({ passed: payload.passed, total: payload.total }); });
    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.uid === user.id) return;
      setOppTyping(true);
      clearTimeout(oppTypingTimer.current);
      oppTypingTimer.current = setTimeout(() => setOppTyping(false), 1400);
    });
    ch.on('broadcast', { event: 'joined' }, ({ payload }) => {
      if (payload.uid === user.id) return;
      setOppPresent(true);
      if (payload.name) setOppName(payload.name);
      if (role === 'host') refreshMatch();     // pull the freshly-claimed guest_id/name
    });
    ch.on('broadcast', { event: 'start' }, ({ payload }) => { if (payload.uid !== user.id) refreshMatch(); });
    ch.on('broadcast', { event: 'win' }, ({ payload }) => {
      if (payload.uid !== user.id && !wonRef.current) { wonRef.current = true; setResult({ win: false, reason: `${payload.name} passed every test first.` }); }
    });
    ch.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      ch.track({ uid: user.id, name: myName, role });
      // announce ourselves so the other side updates even if a presence sync is missed
      ch.send({ type: 'broadcast', event: 'joined', payload: { uid: user.id, name: myName, role } });
    });
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user, code]);

  const refreshMatch = useCallback(async () => { const m = await getMatch(code); if (m) setMatch(m); }, [code]);

  // when the match becomes active, load the problem + starter template
  useEffect(() => {
    if (!match || match.status !== 'active' || !match.problem_id || problem) return;
    (async () => {
      const { data } = await supabase.from('PGcode_problems').select('id, name, description, difficulty, method_name, params, return_type, test_cases').eq('id', match.problem_id).single();
      if (!data) return;
      setProblem(data);
      const total = (data.test_cases || []).length;
      setMyProg({ passed: 0, total });
      setOppProg({ passed: 0, total });
      const starter = generateTemplate(match.language, data.method_name, data.params, data.return_type) || '';
      setCodeText(starter);
    })();
  }, [match, problem]);

  // shared countdown tick
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);

  // fallback poll for missed realtime signals: host waits for a guest to claim the
  // slot; guest waits for the host to flip the match to active.
  useEffect(() => {
    if (!match || match.status !== 'waiting') return;
    const needsPoll = (role === 'host' && !match.guest_id) || role === 'guest';
    if (!needsPoll) return;
    const t = setInterval(refreshMatch, 3000);
    return () => clearInterval(t);
  }, [role, match, refreshMatch]);

  // host starts the match: pick a problem, flip to active, broadcast
  const start = async () => {
    if (role !== 'host') return;
    setErr('');
    try {
      const pid = await pickRandomProblem(match.difficulty);
      if (!pid) { setErr('No gradeable problem found for that difficulty.'); return; }
      const { count } = await supabase.from('PGcode_problems').select('test_cases').eq('id', pid).single().then((r) => ({ count: (r.data?.test_cases || []).length }));
      const m = await updateMatch(code, { problem_id: pid, status: 'active', started_at: new Date().toISOString(), host_total: count, guest_total: count });
      setMatch(m);
      chanRef.current?.send({ type: 'broadcast', event: 'start', payload: { uid: user.id } });
    } catch (e) { setErr(e.message || 'Could not start'); }
  };

  const onCodeChange = (v) => {
    setCodeText(v || '');
    if (chanRef.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => chanRef.current?.send({ type: 'broadcast', event: 'typing', payload: { uid: user.id } }), 120);
    }
  };

  const submit = async () => {
    if (!problem || running || result) return;
    setRunning(true);
    try {
      const res = await gradeOnServer(problem.id, match.language, codeText);
      const passed = res?.passed ?? 0, total = res?.total ?? myProg.total;
      setMyProg({ passed, total });
      chanRef.current?.send({ type: 'broadcast', event: 'progress', payload: { uid: user.id, passed, total } });
      if (total > 0 && passed === total && !wonRef.current) {
        wonRef.current = true;
        setResult({ win: true, reason: 'You passed every test first!' });
        const elapsed = match.started_at ? Date.now() - new Date(match.started_at).getTime() : 0;
        await updateMatch(code, { status: 'finished', winner: role, winner_id: user.id, finished_at: new Date().toISOString(), [`${role}_passed`]: passed });
        chanRef.current?.send({ type: 'broadcast', event: 'win', payload: { uid: user.id, name: myName, ms: elapsed } });
      }
    } catch (e) { setErr(e.message || 'Grading failed'); }
    setRunning(false);
  };

  if (!user) return <div className="vs-page"><div className="vs-signin"><h3>Sign in to battle</h3></div></div>;
  if (err && !match) return <div className="vs-page"><div className="vs-signin"><h3>{err}</h3><button className="vs-secondary" onClick={() => nav('/versus')}><ArrowLeft size={14} /> Back to PGBattle</button></div></div>;
  if (!match) return <div className="vs-page"><div className="vs-loading"><Zap className="vs-bolt spin" /> Loading match…</div></div>;

  // ── Waiting room ──
  if (match.status === 'waiting') {
    const rivalHere = oppPresent || (!!match.guest_id && match.guest_id !== user.id);
    return (
      <div className="vs-page">
        <div className="vs-room">
          <h2 className="vs-room-title"><Zap className="vs-bolt" /> Match {code}</h2>
          <p className="vs-room-sub">{match.difficulty} · {Math.round(match.time_limit_sec / 60)} min · {match.language}</p>
          <div className="vs-lobby-players">
            <div className="vs-avatar you"><User /><span>{myName}</span><small>{role}</small></div>
            <div className="vs-vs-badge">VS</div>
            <div className={`vs-avatar foe ${rivalHere ? 'here' : ''}`}><User /><span>{rivalHere ? (match.guest_id && match.guest_id !== user.id && match.guest_name ? match.guest_name : oppName) : 'Waiting…'}</span><small>{rivalHere ? 'ready' : 'not joined'}</small></div>
          </div>
          <div className="vs-invite">
            <span className="vs-invite-label">Invite your rival</span>
            <div className="vs-code-big">
              <span className="vs-code-chars">{code}</span>
              <button className="vs-code-copy" onClick={copyCode}>{codeCopied ? <Check size={14} /> : <Copy size={14} />} {codeCopied ? 'Copied' : 'Copy code'}</button>
            </div>
            <div className="vs-share-row">
              <button className="vs-share-btn" onClick={copyLink}>{copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? 'Link copied' : 'Copy link'}</button>
              {typeof navigator !== 'undefined' && navigator.share ? <button className="vs-share-btn" onClick={nativeShare}><Share2 size={14} /> Share</button> : null}
              <a className="vs-share-btn" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer"><MessageSquare size={14} /> WhatsApp</a>
              <a className="vs-share-btn" href={`mailto:?subject=${encodeURIComponent('Battle me on PGBattle')}&body=${encodeURIComponent(shareText)}`}><Mail size={14} /> Email</a>
            </div>
            <p className="vs-invite-hint">Your rival joins by entering the code on PGBattle, or by opening the link.</p>
          </div>
          {role === 'host'
            ? <button className="vs-primary" onClick={start} disabled={!rivalHere}><Swords size={16} /> {rivalHere ? 'Start race' : 'Waiting for opponent…'}</button>
            : <p className="vs-room-hint">Waiting for the host to start the race…</p>}
          {err ? <p className="vs-err">{err}</p> : null}
        </div>
      </div>
    );
  }

  // ── Battle ──
  const started = match.started_at ? new Date(match.started_at).getTime() : now;
  const remain = Math.max(0, match.time_limit_sec - Math.floor((now - started) / 1000));
  const mm = String(Math.floor(remain / 60)).padStart(2, '0'), ss = String(remain % 60).padStart(2, '0');
  const pct = (p) => (p.total ? Math.round((p.passed / p.total) * 100) : 0);
  const showExact = match.powerup === 'radar';
  // time-out resolution
  if (remain === 0 && !result && !wonRef.current) {
    wonRef.current = true;
    const win = myProg.passed > oppProg.passed;
    setResult({ win, reason: win ? 'Time up — you passed more tests.' : (myProg.passed === oppProg.passed ? "Time up — it's a draw." : 'Time up — your rival passed more tests.') });
  }

  return (
    <div className="vs-battle">
      <div className="vs-battle-bar">
        <button className="vs-back" onClick={() => nav('/versus')}><ArrowLeft size={15} /></button>
        <div className="vs-timer"><Clock size={15} /> {mm}:{ss}</div>
        <div className="vs-battle-players">
          <div className="vs-bp me">
            <span className="vs-bp-name"><User size={13} /> {myName}</span>
            <div className="vs-bp-bar"><div className="vs-bp-fill me" style={{ width: pct(myProg) + '%' }} /></div>
            <span className="vs-bp-count">{myProg.passed}/{myProg.total}</span>
          </div>
          <Swords size={16} className="vs-bp-swords" />
          <div className="vs-bp foe">
            <span className="vs-bp-name">{oppTyping ? <em className="vs-typing">typing…</em> : <><User size={13} /> {oppName}</>}</span>
            <div className="vs-bp-bar"><div className="vs-bp-fill foe" style={{ width: pct(oppProg) + '%' }} /></div>
            <span className="vs-bp-count">{showExact ? `${oppProg.passed}/${oppProg.total}` : `${pct(oppProg)}%`}</span>
          </div>
        </div>
      </div>

      <div className="vs-battle-main">
        <div className="vs-prob">
          <h3>{problem?.name || 'Loading…'} <span className={`vs-diff ${(problem?.difficulty || '').toLowerCase()}`}>{problem?.difficulty}</span></h3>
          <div className="vs-prob-body" dangerouslySetInnerHTML={{ __html: problem?.description || '' }} />
        </div>
        <div className="vs-editor">
          <div className="vs-editor-head">
            <span>{match.language}</span>
            <button className="vs-run" onClick={submit} disabled={running || !!result}>{running ? <>Running…</> : <><Send size={14} /> Submit</>}</button>
          </div>
          <div className="vs-editor-body">
            <Editor height="100%" language={MONACO_LANG[match.language] || 'python'} theme="vs-dark" value={codeText} onChange={onCodeChange}
              options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true }} />
          </div>
          {err ? <p className="vs-err">{err}</p> : null}
        </div>
      </div>

      {result ? (
        <div className="vs-overlay">
          <div className={`vs-result ${result.win ? 'win' : 'lose'}`}>
            <Trophy size={40} />
            <h2>{result.win ? 'Victory' : 'Defeated'}</h2>
            <p>{result.reason}</p>
            <div className="vs-result-bars">
              <div className="vs-rb">
                <span className="vs-rb-label"><User size={12} /> {myName}</span>
                <div className="vs-rb-track"><div className="vs-bp-fill me" style={{ width: pct(myProg) + '%' }} /></div>
                <span className="vs-rb-count">{myProg.passed}/{myProg.total}</span>
              </div>
              <div className="vs-rb">
                <span className="vs-rb-label"><User size={12} /> {oppName}</span>
                <div className="vs-rb-track"><div className="vs-bp-fill foe" style={{ width: pct(oppProg) + '%' }} /></div>
                <span className="vs-rb-count">{oppProg.passed}/{oppProg.total}</span>
              </div>
            </div>
            <div className="vs-result-meta"><Clock size={13} /> {mm}:{ss} left · <span className="vs-diff-inline">{match.difficulty}</span> · {match.language}</div>
            <div className="vs-result-actions">
              <button className="vs-secondary" onClick={() => nav('/versus')}><ArrowLeft size={14} /> Lobby</button>
              <button className="vs-primary" onClick={() => nav('/versus')}><Zap size={15} /> New race</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
