import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Zap, Copy, Check, Trophy, Clock, Send, User, Swords, ArrowLeft, Link2, Share2, MessageSquare, Mail, Code2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMatch, joinMatch, updateMatch, pickRandomProblems, matchChannel, setGuestLanguage } from '../../lib/versus';
import { gradeOnServer } from '../../lib/codeRunner';
import { generateTemplate } from '../../lib/driverCode';
import '../../styles/versus.css';

const MONACO_LANG = { python: 'python', javascript: 'javascript', java: 'java', cpp: 'cpp' };
const LANGS = ['python', 'javascript', 'java', 'cpp'];

export default function VersusMatch({ session }) {
  const { code } = useParams();
  const nav = useNavigate();
  const user = session?.user;
  const myName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';

  const [match, setMatch] = useState(null);
  const [problems, setProblems] = useState([]);      // [{id,name,description,difficulty,...}]
  const [qIndex, setQIndex] = useState(0);
  const [codeByQ, setCodeByQ] = useState({});        // qIndex -> code text
  const [role, setRole] = useState(null);            // 'host' | 'guest'
  const [oppPresent, setOppPresent] = useState(false);
  const [oppName, setOppName] = useState('Opponent');
  const [mySolved, setMySolved] = useState([]);      // solved question indices
  const [oppSolvedCount, setOppSolvedCount] = useState(0);
  const [oppTyping, setOppTyping] = useState(false);
  const [running, setRunning] = useState(false);
  const [caseInfo, setCaseInfo] = useState(null);    // {passed,total} of last submit on current q
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [err, setErr] = useState('');

  const chanRef = useRef(null);
  const typingTimer = useRef(null);
  const oppTypingTimer = useRef(null);
  const wonRef = useRef(false);

  const numQ = match?.num_questions || 1;
  const myLang = (role === 'host' ? (match?.host_language || match?.language) : (match?.guest_language || match?.language)) || 'python';
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

  const refreshMatch = useCallback(async () => { const m = await getMatch(code); if (m) setMatch(m); }, [code]);

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
    ch.on('broadcast', { event: 'progress' }, ({ payload }) => { if (payload.uid !== user.id) setOppSolvedCount(payload.solved || 0); });
    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.uid === user.id) return;
      setOppTyping(true);
      clearTimeout(oppTypingTimer.current);
      oppTypingTimer.current = setTimeout(() => setOppTyping(false), 1400);
    });
    ch.on('broadcast', { event: 'joined' }, ({ payload }) => {
      if (payload.uid === user.id) return;
      setOppPresent(true); if (payload.name) setOppName(payload.name);
      if (role === 'host') refreshMatch();
    });
    ch.on('broadcast', { event: 'start' }, ({ payload }) => { if (payload.uid !== user.id) refreshMatch(); });
    ch.on('broadcast', { event: 'win' }, ({ payload }) => {
      if (payload.uid !== user.id && !wonRef.current) { wonRef.current = true; setResult({ win: false, reason: `${payload.name} finished every question first.` }); }
    });
    ch.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      ch.track({ uid: user.id, name: myName, role });
      ch.send({ type: 'broadcast', event: 'joined', payload: { uid: user.id, name: myName, role } });
    });
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user, code]);

  // when active, load THE SAME problems the host chose (match.problem_ids) + per-question
  // starter templates in MY language. Both players read the identical id list, so they
  // always get the same questions. If the id list hasn't propagated yet, refetch and retry.
  useEffect(() => {
    if (!match || match.status !== 'active' || problems.length) return;
    const ids = Array.isArray(match.problem_ids) && match.problem_ids.length ? match.problem_ids : (match.problem_id ? [match.problem_id] : []);
    if (!ids.length) { const t = setTimeout(refreshMatch, 700); return () => clearTimeout(t); }
    let live = true;
    (async () => {
      const { data } = await supabase.from('PGcode_problems').select('id, name, description, difficulty, method_name, params, return_type, test_cases').in('id', ids);
      if (!data || !live) return;
      const ordered = ids.map((id) => data.find((d) => d.id === id)).filter(Boolean);
      const starters = {};
      ordered.forEach((p, i) => { starters[i] = generateTemplate(myLang, p.method_name, p.params, p.return_type) || ''; });
      setProblems(ordered);
      setCodeByQ(starters);
    })();
    return () => { live = false; };
  }, [match, problems.length, myLang, refreshMatch]);

  // shared countdown tick
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);

  // fallback poll for missed realtime signals
  useEffect(() => {
    if (!match || match.status !== 'waiting') return;
    const needsPoll = (role === 'host' && !match.guest_id) || role === 'guest';
    if (!needsPoll) return;
    const t = setInterval(refreshMatch, 3000);
    return () => clearInterval(t);
  }, [role, match, refreshMatch]);

  // host starts: pick N problems ONCE, persist them on the match (both players read this
  // same list), flip to active, broadcast. Persisted so a reload keeps the same questions.
  const [starting, setStarting] = useState(false);
  const start = async () => {
    if (role !== 'host' || starting) return;
    setErr(''); setStarting(true);
    try {
      const ids = await pickRandomProblems(match.difficulty, numQ);
      if (!ids.length) { setErr('No gradeable problem found for that difficulty.'); setStarting(false); return; }
      const m = await updateMatch(code, { problem_ids: ids, problem_id: ids[0], status: 'active', started_at: new Date().toISOString() });
      if (m) setMatch(m); else await refreshMatch();
      chanRef.current?.send({ type: 'broadcast', event: 'start', payload: { uid: user.id } });
    } catch (e) { setErr(`Could not start: ${e.message || e}`); setStarting(false); }
  };

  const onCodeChange = (v) => {
    setCodeByQ((prev) => ({ ...prev, [qIndex]: v || '' }));
    if (chanRef.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => chanRef.current?.send({ type: 'broadcast', event: 'typing', payload: { uid: user.id } }), 120);
    }
  };

  const submit = async () => {
    const prob = problems[qIndex];
    if (!prob || running || result) return;
    setRunning(true); setErr('');
    try {
      const res = await gradeOnServer(prob.id, myLang, codeByQ[qIndex] || '');
      const passed = res?.passed ?? 0, total = res?.total ?? 0;
      setCaseInfo({ passed, total });
      if (total > 0 && passed === total && !mySolved.includes(qIndex)) {
        const solved = [...mySolved, qIndex];
        setMySolved(solved);
        const col = role === 'host' ? 'host_solved' : 'guest_solved';
        updateMatch(code, { [col]: solved }).catch(() => {});
        chanRef.current?.send({ type: 'broadcast', event: 'progress', payload: { uid: user.id, solved: solved.length } });
        if (solved.length >= numQ && !wonRef.current) {
          wonRef.current = true;
          setResult({ win: true, reason: `You finished all ${numQ} question${numQ > 1 ? 's' : ''} first!` });
          await updateMatch(code, { status: 'finished', winner: role, winner_id: user.id, finished_at: new Date().toISOString() });
          chanRef.current?.send({ type: 'broadcast', event: 'win', payload: { uid: user.id, name: myName } });
        } else {
          // auto-advance to the next unsolved question
          const next = [...Array(numQ).keys()].find((i) => !solved.includes(i));
          if (next != null) setQIndex(next);
        }
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
    const guestLang = match.guest_language || match.language;
    return (
      <div className="vs-page">
        <div className="vs-room">
          <h2 className="vs-room-title"><Swords size={20} /> Match {code}</h2>
          <p className="vs-room-sub">{match.difficulty} · {numQ} question{numQ > 1 ? 's' : ''} · {Math.round(match.time_limit_sec / 60)} min</p>
          <div className="vs-lobby-players">
            <div className="vs-avatar you"><User /><span>{myName}</span><small>{role} · {myLang}</small></div>
            <div className="vs-vs-badge">VS</div>
            <div className={`vs-avatar foe ${rivalHere ? 'here' : ''}`}><User /><span>{rivalHere ? (match.guest_id && match.guest_id !== user.id && match.guest_name ? match.guest_name : oppName) : 'Waiting…'}</span><small>{rivalHere ? 'ready' : 'not joined'}</small></div>
          </div>

          {role === 'guest' && (
            <div className="vs-room-lang">
              <span className="vs-row-label"><Code2 size={13} /> Your language</span>
              <div className="vs-chips">{LANGS.map((l) => (
                <button key={l} className={`vs-chip ${guestLang === l ? 'on' : ''}`}
                  onClick={async () => { const m = await setGuestLanguage(code, l); if (m) setMatch(m); }}>{l}</button>
              ))}</div>
            </div>
          )}

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
            <p className="vs-invite-hint">Your rival joins by entering the code on PGBattle, or by opening the link. You can each code in a different language.</p>
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
  const myCount = mySolved.length;
  const pctMe = numQ ? Math.round((myCount / numQ) * 100) : 0;
  const pctOpp = numQ ? Math.round((oppSolvedCount / numQ) * 100) : 0;
  const prob = problems[qIndex];
  // time-out resolution
  if (remain === 0 && !result && !wonRef.current) {
    wonRef.current = true;
    const win = myCount > oppSolvedCount;
    setResult({ win, reason: win ? 'Time up — you solved more.' : (myCount === oppSolvedCount ? "Time up — it's a draw." : 'Time up — your rival solved more.') });
  }

  return (
    <div className="vs-battle">
      <div className="vs-battle-bar">
        <button className="vs-back" onClick={() => nav('/versus')}><ArrowLeft size={15} /></button>
        <div className="vs-timer"><Clock size={15} /> {mm}:{ss}</div>
        {numQ > 1 && (
          <div className="vs-qtabs">
            {[...Array(numQ).keys()].map((i) => (
              <button key={i} className={`vs-qtab ${i === qIndex ? 'on' : ''} ${mySolved.includes(i) ? 'solved' : ''}`} onClick={() => setQIndex(i)}>
                {mySolved.includes(i) ? <Check size={12} /> : `Q${i + 1}`}
              </button>
            ))}
          </div>
        )}
        <div className="vs-battle-players">
          <div className="vs-bp me">
            <span className="vs-bp-name"><User size={13} /> {myName}</span>
            <div className="vs-bp-bar"><div className="vs-bp-fill me" style={{ width: pctMe + '%' }} /></div>
            <span className="vs-bp-count">{myCount}/{numQ}</span>
          </div>
          <Swords size={16} className="vs-bp-swords" />
          <div className="vs-bp foe">
            <span className="vs-bp-name">{oppTyping ? <em className="vs-typing">typing…</em> : <><User size={13} /> {oppName}</>}</span>
            <div className="vs-bp-bar"><div className="vs-bp-fill foe" style={{ width: pctOpp + '%' }} /></div>
            <span className="vs-bp-count">{oppSolvedCount}/{numQ}</span>
          </div>
        </div>
      </div>

      <div className="vs-battle-main">
        <div className="vs-prob">
          <h3>{prob ? `${numQ > 1 ? `Q${qIndex + 1}. ` : ''}${prob.name}` : 'Loading…'} {prob ? <span className={`vs-diff ${(prob.difficulty || '').toLowerCase()}`}>{prob.difficulty}</span> : null}</h3>
          <div className="vs-prob-body" dangerouslySetInnerHTML={{ __html: prob?.description || '' }} />
        </div>
        <div className="vs-editor">
          <div className="vs-editor-head">
            <span>{myLang}</span>
            <div className="vs-editor-head-right">
              {caseInfo ? <span className="vs-case-info">{caseInfo.passed}/{caseInfo.total} tests</span> : null}
              <button className="vs-run" onClick={submit} disabled={running || !!result || mySolved.includes(qIndex)}>
                {mySolved.includes(qIndex) ? <><Check size={14} /> Solved</> : running ? 'Running…' : <><Send size={14} /> Submit</>}
              </button>
            </div>
          </div>
          <div className="vs-editor-body">
            <Editor height="100%" language={MONACO_LANG[myLang] || 'python'} theme="vs-dark" value={codeByQ[qIndex] || ''} onChange={onCodeChange}
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
                <div className="vs-rb-track"><div className="vs-bp-fill me" style={{ width: pctMe + '%' }} /></div>
                <span className="vs-rb-count">{myCount}/{numQ}</span>
              </div>
              <div className="vs-rb">
                <span className="vs-rb-label"><User size={12} /> {oppName}</span>
                <div className="vs-rb-track"><div className="vs-bp-fill foe" style={{ width: pctOpp + '%' }} /></div>
                <span className="vs-rb-count">{oppSolvedCount}/{numQ}</span>
              </div>
            </div>
            <div className="vs-result-meta"><Clock size={13} /> {mm}:{ss} left · <span className="vs-diff-inline">{match.difficulty}</span> · {myLang}</div>
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
