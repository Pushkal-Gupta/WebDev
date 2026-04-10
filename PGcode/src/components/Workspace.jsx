import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor from '@monaco-editor/react';
import { ChevronLeft, ChevronUp, ChevronDown, Play, ExternalLink, CheckCircle, RotateCcw, Code2, FileText, Award, MessageSquare, TestTube, Lightbulb } from 'lucide-react';
import SolutionView from './SolutionView';
import { runCode } from '../lib/codeRunner';
import { generateTemplate, wrapWithDriver, buildStdin, compareOutput } from '../lib/driverCode';
import '../styles/Workspace.css';

export default function Workspace({ session, theme, roadmapMode }) {
  const { categoryId, problemId } = useParams();
  const [topic, setTopic] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);

  const [activeLang, setActiveLang] = useState('python');
  const [codeContent, setCodeContent] = useState('');
  const [templates, setTemplates] = useState({});
  const [leftTab, setLeftTab] = useState('description');
  const [userProgress, setUserProgress] = useState(null);
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [editorStatus, setEditorStatus] = useState('');
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [activeTestIdx, setActiveTestIdx] = useState(0);
  const [testInputs, setTestInputs] = useState([]);
  // Structured test/submit result
  const [runResult, setRunResult] = useState(null);
  const [resultCaseIdx, setResultCaseIdx] = useState(0);
  const [submitProgress, setSubmitProgress] = useState(null); // { current, total }
  // Submission history (persisted to localStorage)
  const [submissions, setSubmissions] = useState([]);
  const editorRef = useRef(null);

  const [leftWidth, setLeftWidth] = useState(
    () => parseInt(localStorage.getItem('pgcode_split')) || 45
  );

  // Fetch topic + problems
  useEffect(() => {
    if (!categoryId) return;
    (async () => {
      try {
        const { data: topicData } = await supabase.from('PGcode_topics').select('*').eq('id', categoryId).single();
        if (topicData) setTopic(topicData);
        const { data: qData } = await supabase.from('PGcode_problems').select('*').eq('topic_id', categoryId);
        let filtered = qData || [];
        if (roadmapMode === '200') filtered = filtered.filter(p => p.roadmap_set === '200' || p.roadmap_set === 'both' || !p.roadmap_set);
        else if (roadmapMode === '300') filtered = filtered.filter(p => p.roadmap_set === '200' || p.roadmap_set === '300' || p.roadmap_set === 'both' || !p.roadmap_set);
        if (filtered.length > 0) {
          setProblems(filtered);
          setActiveProblem(problemId ? (filtered.find(p => p.id === problemId) || filtered[0]) : filtered[0]);
        }
      } catch (err) { console.error(err); }
    })();
  }, [categoryId, roadmapMode, problemId]);

  // Fetch templates
  useEffect(() => {
    if (!activeProblem) return;
    (async () => {
      try {
        const { data } = await supabase.from('PGcode_problem_templates').select('*').eq('problem_id', activeProblem.id);
        const m = {};
        if (data) data.forEach(t => { m[t.language] = t.code; });
        setTemplates(m);
      } catch { setTemplates({}); }
    })();
  }, [activeProblem]);

  // Initialize test case inputs when problem changes
  useEffect(() => {
    if (activeProblem?.test_cases?.length > 0) {
      setActiveTestIdx(0);
      setTestInputs([...activeProblem.test_cases[0].inputs]);
    } else {
      setActiveTestIdx(0);
      setTestInputs([]);
    }
    setRunResult(null);
    setSubmitProgress(null);
    // Load submission history
    try {
      const saved = JSON.parse(localStorage.getItem(`pgcode_subs_${activeProblem?.id}`) || '[]');
      setSubmissions(saved);
    } catch { setSubmissions([]); }
  }, [activeProblem?.id]);

  useEffect(() => {
    if (!activeProblem) return;
    const localKey = `pgcode_code_${activeProblem.id}_${activeLang}`;
    const localCode = localStorage.getItem(localKey);
    const hasMetadata = activeProblem.method_name && activeProblem.params;
    const generated = hasMetadata ? generateTemplate(activeLang, activeProblem.method_name, activeProblem.params, activeProblem.return_type) : null;

    // Detect stale generic templates from before metadata was added
    const isStaleGeneric = localCode && (
      localCode.includes('def solve(self, input)') ||
      localCode.includes('var solve = function(input)') ||
      localCode.includes('Object solve(')
    );

    // If metadata exists and localStorage has old generic template, clear it
    if (isStaleGeneric && hasMetadata) localStorage.removeItem(localKey);

    // Priority: localStorage (non-stale) > Supabase progress > generated > DB template > fallback
    if (localCode && !isStaleGeneric) setCodeContent(localCode);
    else if (userProgress?.last_code?.[activeLang]) setCodeContent(userProgress.last_code[activeLang]);
    else setCodeContent(generated || templates[activeLang] || `class Solution:\n    def solve(self, input):\n        # Write your solution here\n        pass`);
  }, [activeProblem, activeLang, templates, userProgress]);

  useEffect(() => {
    if (!activeProblem || !session?.user) { setUserProgress(null); setNotes(''); setConfidence(0); return; }
    (async () => {
      try {
        const { data } = await supabase.from('PGcode_user_progress').select('*').eq('user_id', session.user.id).eq('problem_id', activeProblem.id).single();
        if (data) { setUserProgress(data); setNotes(data.notes || ''); setConfidence(data.confidence || 0); }
        else { setUserProgress(null); setNotes(''); setConfidence(0); }
      } catch { setUserProgress(null); }
    })();
  }, [activeProblem, session]);

  const saveProgress = async (updates) => {
    if (!session?.user || !activeProblem) return;
    const payload = { user_id: session.user.id, problem_id: activeProblem.id, updated_at: new Date().toISOString(), ...updates };
    const { error } = await supabase.from('PGcode_user_progress').upsert(payload);
    if (!error) setUserProgress(prev => ({ ...prev, ...payload }));
  };

  const handleSave = async () => {
    if (!session?.user) { setEditorStatus('Login to save'); setTimeout(() => setEditorStatus(''), 2000); return; }
    const lastCode = { ...(userProgress?.last_code || {}), [activeLang]: codeContent };
    await saveProgress({ last_code: lastCode });
    if (activeProblem) localStorage.setItem(`pgcode_code_${activeProblem.id}_${activeLang}`, codeContent);
    setEditorStatus('Saved'); setTimeout(() => setEditorStatus(''), 2000);
  };

  const MAX_VISIBLE_CASES = 8;

  const handleRun = async () => {
    // Fall back to single raw execution for problems without driver metadata
    if (!activeProblem.test_cases?.length || !activeProblem.method_name || !activeProblem.params) {
      setLeftTab('testresult');
      setRunning(true);
      setRunResult(null);
      setConsoleOutput('Running...');
      try {
        const result = await runCode(codeContent, activeLang, '');
        if (result.status !== 'success') {
          const statusMap = { compile_error: 'Compile Error', time_limit: 'Time Limit Exceeded', runtime_error: 'Runtime Error' };
          setRunResult({ status: 'error', statusText: statusMap[result.status] || 'Error', error: result.output, isSubmission: false });
          setConsoleOutput('');
        } else {
          setConsoleOutput(result.output);
          setRunResult(null);
        }
      } catch (err) {
        setRunResult({ status: 'error', statusText: 'Execution Failed', error: err.message, isSubmission: false });
        setConsoleOutput('');
      } finally {
        setRunning(false);
      }
      return;
    }

    setLeftTab('testresult');
    setRunning(true);
    setRunResult(null);
    setConsoleOutput('');
    const total = Math.min(activeProblem.test_cases.length, MAX_VISIBLE_CASES);
    setSubmitProgress({ current: 0, total });

    try {
      const fullCode = wrapWithDriver(codeContent, activeLang, activeProblem.method_name, activeProblem.params);
      const params = activeProblem.params || [];
      const cases = [];
      let passedCount = 0;
      let firstFailIdx = -1;

      for (let i = 0; i < total; i++) {
        setSubmitProgress({ current: i + 1, total });
        const tc = activeProblem.test_cases[i];
        const stdin = buildStdin(tc.inputs);
        const result = await runCode(fullCode, activeLang, stdin);

        if (result.status !== 'success') {
          // Compile error is code-level — will fail identically for all cases, so break early
          if (result.status === 'compile_error') {
            const statusMap = { compile_error: 'Compile Error', time_limit: 'Time Limit Exceeded', runtime_error: 'Runtime Error' };
            setRunResult({
              status: 'error',
              statusText: statusMap[result.status] || 'Error',
              error: result.output,
              totalCases: total,
              totalPassed: passedCount,
              isSubmission: false,
            });
            return;
          }
          // Runtime error / TLE may be case-specific — record and continue
          if (firstFailIdx === -1) firstFailIdx = i;
          cases.push({
            passed: false,
            input: params.map((p, j) => ({ name: p.name, value: tc.inputs[j] || '' })),
            output: result.output?.trim() || '(Error)',
            expected: tc.expected,
          });
          continue;
        }

        const passed = compareOutput(result.output, tc.expected);
        if (passed) passedCount++;
        if (!passed && firstFailIdx === -1) firstFailIdx = i;

        cases.push({
          passed,
          input: params.map((p, j) => ({ name: p.name, value: tc.inputs[j] || '' })),
          output: result.output.trim(),
          expected: tc.expected,
        });
      }

      const allPassed = passedCount === total;
      setRunResult({
        status: allPassed ? 'accepted' : 'wrong_answer',
        statusText: allPassed ? 'Accepted' : 'Wrong Answer',
        cases,
        activeCaseIdx: firstFailIdx >= 0 ? firstFailIdx : 0,
        totalCases: total,
        totalPassed: passedCount,
        isSubmission: false,
      });
      setResultCaseIdx(firstFailIdx >= 0 ? firstFailIdx : 0);
    } catch (err) {
      setRunResult({ status: 'error', statusText: 'Execution Failed', error: err.message, isSubmission: false });
    } finally {
      setRunning(false);
      setSubmitProgress(null);
    }
  };

  const handleSubmit = async () => {
    if (!activeProblem.test_cases?.length || !activeProblem.method_name) {
      await handleRun();
      return;
    }

    setLeftTab('testresult');
    setRunning(true);
    setRunResult(null);
    setConsoleOutput('');
    const total = activeProblem.test_cases.length;
    setSubmitProgress({ current: 0, total });

    const startTime = Date.now();

    try {
      const fullCode = wrapWithDriver(codeContent, activeLang, activeProblem.method_name, activeProblem.params);
      const params = activeProblem.params || [];
      const cases = [];
      let allPassed = true;
      let failIdx = -1;

      for (let i = 0; i < total; i++) {
        setSubmitProgress({ current: i + 1, total });
        const tc = activeProblem.test_cases[i];
        const stdin = buildStdin(tc.inputs);
        const result = await runCode(fullCode, activeLang, stdin);

        if (result.status !== 'success') {
          allPassed = false;
          failIdx = i;
          const statusMap = { compile_error: 'Compile Error', time_limit: 'Time Limit Exceeded', runtime_error: 'Runtime Error' };
          setRunResult({
            status: 'error',
            statusText: statusMap[result.status] || 'Error',
            error: result.output,
            failedCase: i + 1,
            totalCases: total,
            totalPassed: i,
            isSubmission: true,
          });
          break;
        }

        const passed = compareOutput(result.output, tc.expected);
        cases.push({
          passed,
          input: params.map((p, j) => ({ name: p.name, value: tc.inputs[j] || '' })),
          output: result.output.trim(),
          expected: tc.expected,
        });

        if (!passed) {
          allPassed = false;
          failIdx = i;
          setRunResult({
            status: 'wrong_answer',
            statusText: 'Wrong Answer',
            cases: cases,
            activeCaseIdx: i,
            failedCase: i + 1,
            totalCases: total,
            totalPassed: i,
            isSubmission: true,
          });
          break;
        }
      }

      const elapsed = Date.now() - startTime;

      if (allPassed) {
        setRunResult({
          status: 'accepted',
          statusText: 'Accepted',
          cases,
          activeCaseIdx: 0,
          totalCases: total,
          totalPassed: total,
          runtime: elapsed,
          isSubmission: true,
        });
        if (session?.user) {
          saveProgress({
            is_completed: true,
            last_solved_at: new Date().toISOString(),
            next_review_at: new Date(Date.now() + 3 * 86400000).toISOString(),
            solve_count: (userProgress?.solve_count || 0) + 1,
          });
        }
      }

      // Save submission to history
      const sub = {
        status: allPassed ? 'Accepted' : (failIdx >= 0 ? 'Wrong Answer' : 'Error'),
        language: activeLang,
        runtime: allPassed ? `${elapsed}ms` : 'N/A',
        passed: allPassed ? total : (failIdx >= 0 ? failIdx : 0),
        total,
        date: new Date().toISOString(),
      };
      const newSubs = [sub, ...submissions].slice(0, 20);
      setSubmissions(newSubs);
      try { localStorage.setItem(`pgcode_subs_${activeProblem.id}`, JSON.stringify(newSubs)); } catch {}

    } catch (err) {
      setRunResult({ status: 'error', statusText: 'Execution Failed', error: err.message, isSubmission: true });
    } finally {
      setRunning(false);
      setSubmitProgress(null);
    }
  };

  const markComplete = () => {
    const newVal = !(userProgress?.is_completed);
    saveProgress({ is_completed: newVal, last_solved_at: newVal ? new Date().toISOString() : null, next_review_at: newVal ? new Date(Date.now() + 3 * 86400000).toISOString() : null, solve_count: (userProgress?.solve_count || 0) + (newVal ? 1 : 0) });
  };

  const setAndSaveConfidence = (val) => {
    setConfidence(val);
    const days = { 1: 1, 2: 2, 3: 3, 4: 7, 5: 14 };
    saveProgress({ confidence: val, next_review_at: new Date(Date.now() + (days[val] || 3) * 86400000).toISOString() });
  };

  const saveNotes = () => { saveProgress({ notes }); setEditorStatus('Notes saved'); setTimeout(() => setEditorStatus(''), 2000); };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ ln: e.position.lineNumber, col: e.position.column });
    });
  };

  const handleDividerDrag = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = leftWidth;
    const onMove = (ev) => {
      const c = document.querySelector('.ws-main');
      if (!c) return;
      const pct = startW + ((ev.clientX - startX) / c.offsetWidth) * 100;
      if (pct >= 25 && pct <= 70) setLeftWidth(pct);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      localStorage.setItem('pgcode_split', Math.round(leftWidth));
    };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [leftWidth]);

  if (!activeProblem) return <div className="ws-loading">Loading... <Link to="/">Back to Roadmap</Link></div>;

  const displayName = activeProblem.name.replace(/Pattern #(\d+)/, 'Problem #$1').replace(/Challenge #(\d+)/, 'Problem #$1');

  return (
    <div className="ws-container">
      <div className="ws-main">
        {/* ═══ LEFT PANEL ═══ */}
        <div className="ws-left" style={{ width: `${leftWidth}%` }}>
          <div className="ws-left-header">
            <Link to="/" className="ws-back"><ChevronLeft size={14} /> Back</Link>
          </div>

          {/* LeetCode-style tabs */}
          <div className="ws-left-tabs">
            <button className={`ws-tab ${leftTab === 'description' ? 'active' : ''}`} onClick={() => setLeftTab('description')}>
              <FileText size={13} /> Description
            </button>
            <button className={`ws-tab ${leftTab === 'solution' ? 'active' : ''}`} onClick={() => setLeftTab('solution')}>
              <Lightbulb size={13} /> Solution
            </button>
            <button className={`ws-tab ${leftTab === 'submissions' ? 'active' : ''}`} onClick={() => setLeftTab('submissions')}>
              <Award size={13} /> Submissions
            </button>
            <button className={`ws-tab ${leftTab === 'testcase' ? 'active' : ''}`} onClick={() => setLeftTab('testcase')}>
              <TestTube size={13} /> Testcase
            </button>
            {(consoleOutput || runResult || running) && (
              <button className={`ws-tab ${leftTab === 'testresult' ? 'active' : ''}`} onClick={() => setLeftTab('testresult')}>
                Test Result
              </button>
            )}
          </div>

          <div className="ws-left-content">
            {/* ── DESCRIPTION TAB ── */}
            {leftTab === 'description' && (
              <div className="ws-question">
                <h1 className="ws-q-title">{displayName}</h1>
                <div className="ws-q-tags">
                  <span className={`ws-diff-badge ws-diff-${activeProblem.difficulty?.toLowerCase()}`}>{activeProblem.difficulty}</span>
                  {topic?.category && <span className="ws-tag-pill">{topic.category}</span>}
                </div>

                <div className="ws-q-desc" dangerouslySetInnerHTML={{ __html: activeProblem.description }} />

                {/* Constraints */}
                {activeProblem.constraints && (
                  <div className="ws-constraints">
                    <div className="ws-constraints-title">Constraints:</div>
                    <ul>
                      {(Array.isArray(activeProblem.constraints)
                        ? activeProblem.constraints
                        : activeProblem.constraints.split('\n').filter(Boolean)
                      ).map((c, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: c.replace(/`([^`]+)`/g, '<code>$1</code>') }} />
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up */}
                {activeProblem.follow_up && (
                  <div className="ws-followup">
                    <div className="ws-followup-label">Follow-up:</div>
                    <p>{activeProblem.follow_up}</p>
                  </div>
                )}

                {/* Topics */}
                {(activeProblem.topics?.length > 0 || topic?.category) && (
                  <details className="ws-expandable">
                    <summary>Topics</summary>
                    <div style={{ padding: '0.5rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {(activeProblem.topics || [topic?.category]).filter(Boolean).map((t, i) => (
                        <span key={i} className="ws-topic-pill">{t}</span>
                      ))}
                    </div>
                  </details>
                )}

                {/* Hints */}
                {activeProblem.hints?.length > 0 && activeProblem.hints.map((hint, i) => (
                  <details key={i} className="ws-expandable">
                    <summary>Hint {i + 1}</summary>
                    <p>{hint}</p>
                  </details>
                ))}

                {activeProblem.leetcode_url && (
                  <a href={activeProblem.leetcode_url} target="_blank" rel="noopener noreferrer" className="ws-lc-link">
                    <ExternalLink size={13} /> Solve on LeetCode
                  </a>
                )}
              </div>
            )}

            {/* ── SOLUTION TAB ── */}
            {leftTab === 'solution' && (
              <div className="ws-solution">
                <SolutionView problem={activeProblem} />
              </div>
            )}

            {/* ── SUBMISSIONS TAB ── */}
            {leftTab === 'submissions' && (
              <div className="ws-submissions">
                <div className="ws-sub-actions">
                  {session ? (
                    <button className={`ws-sub-btn ${userProgress?.is_completed ? 'ws-sub-done' : ''}`} onClick={markComplete}>
                      <CheckCircle size={15} /> {userProgress?.is_completed ? 'Completed' : 'Mark Complete'}
                    </button>
                  ) : (
                    <p className="ws-empty-msg">Login to track progress</p>
                  )}
                  {userProgress?.next_review_at && (
                    <span className="ws-sub-review"><RotateCcw size={12} /> Review: {new Date(userProgress.next_review_at).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Submission history */}
                {submissions.length > 0 && (
                  <div className="ws-sub-history">
                    <div className="ws-sub-history-header">
                      <span className="ws-sub-col-status">Status</span>
                      <span className="ws-sub-col ws-sub-col-lang">Language</span>
                      <span className="ws-sub-col ws-sub-col-time">Runtime</span>
                      <span className="ws-sub-col">Date</span>
                    </div>
                    {submissions.map((sub, i) => (
                      <div key={i} className="ws-sub-history-row">
                        <span className={`ws-sub-col-status ${sub.status === 'Accepted' ? 'accepted' : 'failed'}`}>
                          {sub.status}
                          <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '0.3rem' }}>
                            {sub.passed}/{sub.total}
                          </span>
                        </span>
                        <span className="ws-sub-col ws-sub-col-lang">{sub.language}</span>
                        <span className="ws-sub-col ws-sub-col-time">{sub.runtime}</span>
                        <span className="ws-sub-col">{new Date(sub.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {submissions.length === 0 && (
                  <p className="ws-empty-msg" style={{ padding: '1rem 0' }}>No submissions yet. Submit your code to see results here.</p>
                )}

                {session && (
                  <>
                    <div className="ws-sub-section">
                      <span className="ws-sub-label">Confidence</span>
                      <div className="ws-conf-dots">
                        {[1,2,3,4,5].map(v => (
                          <button key={v} className={`ws-conf-dot ${confidence >= v ? 'active' : ''}`}
                            onClick={() => setAndSaveConfidence(v)} title={['Again','Hard','Good','Easy','Mastered'][v-1]}>{v}</button>
                        ))}
                      </div>
                    </div>
                    <div className="ws-sub-section">
                      <span className="ws-sub-label">Personal Notes</span>
                      <textarea className="ws-notes-ta" value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Your approach, edge cases, things to remember..." rows={5} />
                      <button className="ws-notes-save" onClick={saveNotes}>Save Notes</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── TESTCASE TAB ── */}
            {leftTab === 'testcase' && (
              <div className="ws-testcase">
                {activeProblem.test_cases?.length > 0 ? (
                  <>
                    <div className="ws-tc-cases">
                      {activeProblem.test_cases.slice(0, MAX_VISIBLE_CASES).map((tc, i) => (
                        <button key={i} className={`ws-tc-case ${activeTestIdx === i ? 'active' : ''}`}
                          onClick={() => { setActiveTestIdx(i); setTestInputs([...tc.inputs]); }}>
                          Case {i + 1}
                        </button>
                      ))}
                    </div>
                    <div className="ws-tc-fields">
                      {(activeProblem.params || []).map((param, i) => (
                        <div key={i} className="ws-tc-field">
                          <label>{param.name} =</label>
                          <input type="text" value={testInputs[i] || ''} onChange={e => {
                            const next = [...testInputs];
                            next[i] = e.target.value;
                            setTestInputs(next);
                          }} className="ws-tc-input" />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="ws-empty-msg">No test cases available for this problem yet.</p>
                )}
              </div>
            )}

            {/* ── TEST RESULT TAB ── */}
            {leftTab === 'testresult' && (
              <div className="ws-testresult">
                {/* Submit progress */}
                {running && submitProgress && (
                  <div className="ws-submit-progress">
                    <div className="ws-submit-progress-text">
                      Running test case {submitProgress.current} / {submitProgress.total}...
                    </div>
                    <div className="ws-submit-progress-track">
                      <div className="ws-submit-progress-fill" style={{ width: `${(submitProgress.current / submitProgress.total) * 100}%` }} />
                    </div>
                  </div>
                )}

                {/* Structured result */}
                {runResult && (
                  <>
                    {/* Status header */}
                    <div className={`ws-result-status ${runResult.status === 'accepted' ? 'accepted' : runResult.status === 'wrong_answer' ? 'wrong-answer' : 'error'}`}>
                      {runResult.statusText}
                      {runResult.totalCases && (
                        <span className="ws-result-subtitle">
                          {runResult.totalPassed}/{runResult.totalCases} testcases passed
                        </span>
                      )}
                    </div>

                    {/* Submit stats */}
                    {runResult.isSubmission && runResult.status === 'accepted' && runResult.runtime && (
                      <div className="ws-submit-stats">
                        <div className="ws-submit-stat">
                          <span className="ws-submit-stat-label">Runtime</span>
                          <span className="ws-submit-stat-value">{runResult.runtime}ms</span>
                        </div>
                        <div className="ws-submit-stat">
                          <span className="ws-submit-stat-label">Language</span>
                          <span className="ws-submit-stat-value">{activeLang}</span>
                        </div>
                      </div>
                    )}

                    {/* Error output */}
                    {runResult.error && (
                      <div className="ws-result-error">{runResult.error}</div>
                    )}

                    {/* Case tabs + details */}
                    {runResult.cases?.length > 0 && (
                      <>
                        <div className="ws-result-cases">
                          {runResult.cases.map((c, i) => (
                            <button key={i}
                              className={`ws-result-case ${resultCaseIdx === i ? 'active' : ''}`}
                              onClick={() => setResultCaseIdx(i)}>
                              <span className={`case-dot ${c.passed ? 'pass' : 'fail'}`} />
                              Case {i + 1}
                            </button>
                          ))}
                        </div>

                        {runResult.cases[resultCaseIdx] && (
                          <>
                            <div className="ws-result-section">
                              <div className="ws-result-label">Input</div>
                              <div className="ws-result-value">
                                {runResult.cases[resultCaseIdx].input.map((inp, j) => (
                                  <div key={j}>{inp.name} = {inp.value}</div>
                                ))}
                              </div>
                            </div>
                            <div className="ws-result-section">
                              <div className="ws-result-label">Output</div>
                              <div className="ws-result-value">{runResult.cases[resultCaseIdx].output}</div>
                            </div>
                            <div className="ws-result-section">
                              <div className="ws-result-label">Expected</div>
                              <div className="ws-result-value">{runResult.cases[resultCaseIdx].expected}</div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Fallback for raw output */}
                {!runResult && consoleOutput && (
                  <pre className="ws-result-output">{consoleOutput}</pre>
                )}

                {/* Empty state */}
                {!runResult && !consoleOutput && !running && (
                  <p className="ws-empty-msg">You must run your code first</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ DIVIDER ═══ */}
        <div className="ws-divider" onMouseDown={handleDividerDrag} />

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="ws-right" style={{ width: `${100 - leftWidth}%` }}>
          <div className="ws-editor-header">
            <div className="ws-editor-label"><Code2 size={14} /> Code</div>
            <select className="ws-lang" value={activeLang} onChange={e => setActiveLang(e.target.value)}>
              <option value="python">Python3</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="ws-editor-area">
            <Editor height="100%" theme={theme === 'dark' ? 'vs-dark' : 'light'}
              language={activeLang} value={codeContent}
              onChange={val => {
                const code = val || '';
                setCodeContent(code);
                if (activeProblem) localStorage.setItem(`pgcode_code_${activeProblem.id}_${activeLang}`, code);
              }}
              onMount={handleEditorMount}
              options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: '"Space Mono", monospace', scrollBeyondLastLine: false }} />
          </div>

          <div className="ws-editor-footer">
            <div className="ws-footer-left">
              <span className="ws-cursor-pos">Ln {cursorPos.ln}, Col {cursorPos.col}</span>
              {editorStatus && <span className="ws-editor-status">{editorStatus}</span>}
            </div>
            <div className="ws-footer-btns">
              <button className="ws-run-btn" onClick={handleRun} disabled={running}>{running ? 'Running...' : 'Run'}</button>
              <button className="ws-submit-btn" onClick={handleSubmit} disabled={running}>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
