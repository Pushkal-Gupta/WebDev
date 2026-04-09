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
  }, [activeProblem?.id]);

  useEffect(() => {
    if (!activeProblem) return;
    // Priority: localStorage > Supabase progress > DB template > generated template > fallback
    const localKey = `pgcode_code_${activeProblem.id}_${activeLang}`;
    const localCode = localStorage.getItem(localKey);
    if (localCode) setCodeContent(localCode);
    else if (userProgress?.last_code?.[activeLang]) setCodeContent(userProgress.last_code[activeLang]);
    else {
      const generated = generateTemplate(activeLang, activeProblem.method_name, activeProblem.params, activeProblem.return_type);
      setCodeContent(templates[activeLang] || generated || `class Solution:\n    def solve(self, input):\n        # Write your solution here\n        pass`);
    }
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

  const handleRun = async () => {
    setShowConsole(true);
    setLeftTab('testresult');
    setRunning(true);
    setConsoleOutput('Running...');

    try {
      const hasDriver = activeProblem.method_name && activeProblem.params;
      const fullCode = hasDriver
        ? wrapWithDriver(codeContent, activeLang, activeProblem.method_name, activeProblem.params)
        : codeContent;
      const stdin = hasDriver ? buildStdin(testInputs) : '';

      const result = await runCode(fullCode, activeLang, stdin);

      if (result.status !== 'success') {
        const label = result.status === 'compile_error' ? 'Compile Error'
          : result.status === 'time_limit' ? 'Time Limit Exceeded'
          : 'Runtime Error';
        setConsoleOutput(`${label}\n\n${result.output}`);
        return;
      }

      const testCase = activeProblem.test_cases?.[activeTestIdx];
      if (testCase && hasDriver) {
        const passed = compareOutput(result.output, testCase.expected);
        const params = activeProblem.params || [];
        const inputDisplay = params.map((p, i) => `${p.name} = ${testInputs[i]}`).join('\n');
        setConsoleOutput(
          `${passed ? 'Accepted' : 'Wrong Answer'}\n\n` +
          `Input:\n${inputDisplay}\n\n` +
          `Output:\n${result.output.trim()}\n\n` +
          `Expected:\n${testCase.expected}`
        );
      } else {
        setConsoleOutput(result.output);
      }
    } catch (err) {
      setConsoleOutput(`Execution failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeProblem.test_cases?.length || !activeProblem.method_name) {
      await handleRun();
      return;
    }

    setShowConsole(true);
    setLeftTab('testresult');
    setRunning(true);
    setConsoleOutput('Running all test cases...');

    try {
      const fullCode = wrapWithDriver(codeContent, activeLang, activeProblem.method_name, activeProblem.params);
      const params = activeProblem.params || [];
      let allPassed = true;
      const lines = [];

      for (let i = 0; i < activeProblem.test_cases.length; i++) {
        const tc = activeProblem.test_cases[i];
        const stdin = buildStdin(tc.inputs);
        const result = await runCode(fullCode, activeLang, stdin);

        if (result.status !== 'success') {
          allPassed = false;
          const inputDisplay = params.map((p, j) => `${p.name} = ${tc.inputs[j]}`).join(', ');
          lines.push(`Case ${i + 1}: ${result.status === 'compile_error' ? 'Compile Error' : 'Runtime Error'}\n  Input: ${inputDisplay}\n  ${result.output.trim().split('\n')[0]}`);
          break;
        }

        const passed = compareOutput(result.output, tc.expected);
        if (!passed) {
          allPassed = false;
          const inputDisplay = params.map((p, j) => `${p.name} = ${tc.inputs[j]}`).join(', ');
          lines.push(`Wrong Answer on Case ${i + 1}\n\nInput:\n${params.map((p, j) => `${p.name} = ${tc.inputs[j]}`).join('\n')}\n\nOutput:\n${result.output.trim()}\n\nExpected:\n${tc.expected}`);
          break;
        }
        lines.push(`Case ${i + 1}: Passed`);
      }

      if (allPassed) {
        setConsoleOutput(`Accepted\n\n${activeProblem.test_cases.length}/${activeProblem.test_cases.length} test cases passed.\n\n${lines.join('\n')}`);
        if (session?.user) {
          saveProgress({
            is_completed: true,
            last_solved_at: new Date().toISOString(),
            next_review_at: new Date(Date.now() + 3 * 86400000).toISOString(),
            solve_count: (userProgress?.solve_count || 0) + 1,
          });
        }
      } else {
        setConsoleOutput(lines.join('\n'));
      }
    } catch (err) {
      setConsoleOutput(`Execution failed: ${err.message}`);
    } finally {
      setRunning(false);
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
            {consoleOutput && (
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
                  {activeProblem.hints?.length > 0 && <span className="ws-tag-pill ws-tag-hint">Hint</span>}
                </div>

                <div className="ws-q-desc" dangerouslySetInnerHTML={{ __html: activeProblem.description }} />

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
                      {activeProblem.test_cases.map((tc, i) => (
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
                {consoleOutput ? (
                  <pre className="ws-result-output">{consoleOutput}</pre>
                ) : (
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
