import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Save, FileText, Lightbulb, MonitorPlay, ExternalLink, CheckCircle, RotateCcw, StickyNote } from 'lucide-react';
import DryRunViewer from './DryRunViewer';
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
  const [showNotes, setShowNotes] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [showTestCases, setShowTestCases] = useState(true);

  // Resizable divider
  const [leftWidth, setLeftWidth] = useState(
    () => parseInt(localStorage.getItem('pgcode_split_width')) || 45
  );

  // Fetch topic + problems
  useEffect(() => {
    async function fetchData() {
      if (!categoryId) return;
      try {
        const { data: topicData } = await supabase
          .from('PGcode_topics').select('*').eq('id', categoryId).single();
        if (topicData) setTopic(topicData);

        const { data: qData } = await supabase
          .from('PGcode_problems').select('*').eq('topic_id', categoryId);

        let filtered = qData || [];
        if (roadmapMode === '200') {
          filtered = filtered.filter(p =>
            p.roadmap_set === '200' || p.roadmap_set === 'both' || !p.roadmap_set
          );
        } else if (roadmapMode === '300') {
          filtered = filtered.filter(p =>
            p.roadmap_set === '200' || p.roadmap_set === '300' || p.roadmap_set === 'both' || !p.roadmap_set
          );
        }

        if (filtered.length > 0) {
          setProblems(filtered);
          // Auto-select from URL or first problem
          if (problemId) {
            const found = filtered.find(p => p.id === problemId);
            setActiveProblem(found || filtered[0]);
          } else {
            setActiveProblem(filtered[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching workspace data:', err);
      }
    }
    fetchData();
  }, [categoryId, roadmapMode, problemId]);

  // Fetch templates for active problem
  useEffect(() => {
    if (!activeProblem) return;
    async function fetchTemplates() {
      try {
        const { data } = await supabase
          .from('PGcode_problem_templates').select('*').eq('problem_id', activeProblem.id);
        const tmplMap = {};
        if (data) data.forEach(t => { tmplMap[t.language] = t.code; });
        setTemplates(tmplMap);
      } catch (err) {
        setTemplates({});
      }
    }
    fetchTemplates();
  }, [activeProblem]);

  // Set code content when language or problem changes
  useEffect(() => {
    if (activeProblem) {
      // Check if user has saved code for this language
      if (userProgress?.last_code?.[activeLang]) {
        setCodeContent(userProgress.last_code[activeLang]);
      } else {
        setCodeContent(templates[activeLang] || `# ${activeProblem.name}\n# Write your solution here\n`);
      }
    }
  }, [activeProblem, activeLang, templates, userProgress]);

  // Load user progress
  useEffect(() => {
    if (!activeProblem || !session?.user) {
      setUserProgress(null); setNotes(''); setConfidence(0);
      return;
    }
    async function loadProgress() {
      try {
        const { data } = await supabase
          .from('PGcode_user_progress').select('*')
          .eq('user_id', session.user.id).eq('problem_id', activeProblem.id).single();
        if (data) {
          setUserProgress(data);
          setNotes(data.notes || '');
          setConfidence(data.confidence || 0);
        } else {
          setUserProgress(null); setNotes(''); setConfidence(0);
        }
      } catch { setUserProgress(null); }
    }
    loadProgress();
  }, [activeProblem, session]);

  // Save progress helper
  const saveProgress = async (updates) => {
    if (!session?.user || !activeProblem) return;
    const payload = {
      user_id: session.user.id,
      problem_id: activeProblem.id,
      updated_at: new Date().toISOString(),
      ...updates,
    };
    const { error } = await supabase.from('PGcode_user_progress').upsert(payload);
    if (!error) setUserProgress(prev => ({ ...prev, ...payload }));
  };

  // Save code
  const handleSave = async () => {
    if (!session?.user || !activeProblem) {
      setSaveMsg('Login to save'); setTimeout(() => setSaveMsg(''), 2000); return;
    }
    const lastCode = { ...(userProgress?.last_code || {}), [activeLang]: codeContent };
    await saveProgress({ last_code: lastCode });
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  // Simulated Run
  const handleRun = () => {
    setShowTestCases(true);
    const runtime = Math.floor(Math.random() * 50) + 2;
    const memory = (Math.random() * 10 + 5).toFixed(1);
    setRunResult({
      status: 'simulated',
      runtime: `${runtime} ms`,
      memory: `${memory} MB`,
      beat: `${Math.floor(Math.random() * 40) + 50}%`,
    });
  };

  // Mark complete
  const markComplete = () => {
    const newVal = !(userProgress?.is_completed);
    const nextReview = newVal ? new Date(Date.now() + 3 * 86400000).toISOString() : null;
    saveProgress({
      is_completed: newVal,
      last_solved_at: newVal ? new Date().toISOString() : null,
      next_review_at: nextReview,
      solve_count: (userProgress?.solve_count || 0) + (newVal ? 1 : 0),
    });
  };

  const setAndSaveConfidence = (val) => {
    setConfidence(val);
    const daysMap = { 1: 1, 2: 2, 3: 3, 4: 7, 5: 14 };
    saveProgress({
      confidence: val,
      next_review_at: new Date(Date.now() + (daysMap[val] || 3) * 86400000).toISOString(),
    });
  };

  const saveNotes = () => { saveProgress({ notes }); setSaveMsg('Notes saved!'); setTimeout(() => setSaveMsg(''), 2000); };

  // Resizable divider
  const handleDividerDrag = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMove = (moveEvent) => {
      const container = document.querySelector('.workspace-main');
      if (!container) return;
      const delta = moveEvent.clientX - startX;
      const pct = startWidth + (delta / container.offsetWidth) * 100;
      if (pct >= 25 && pct <= 70) setLeftWidth(pct);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = 'default';
      localStorage.setItem('pgcode_split_width', Math.round(leftWidth));
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [leftWidth]);

  if (!topic && problems.length === 0) {
    return <div className="ws-loading">Loading Workspace... <Link to="/">Go back</Link></div>;
  }

  return (
    <div className="workspace-container">
      {/* Top Bar */}
      <div className="workspace-topbar">
        <Link to="/" className="ws-back"><ArrowLeft size={16} /> Roadmap</Link>
        <div className="ws-problem-info">
          <h2 className="ws-title">{activeProblem?.name || topic?.name?.split(/\\n|\n/)[0]}</h2>
          {activeProblem?.difficulty && (
            <span className={`diff-badge diff-${activeProblem.difficulty.toLowerCase()}`}>
              {activeProblem.difficulty}
            </span>
          )}
        </div>
        <div className="ws-prob-tabs">
          {problems.map(prob => (
            <button key={prob.id}
              className={`ws-prob-tab ${activeProblem?.id === prob.id ? 'active' : ''}`}
              onClick={() => setActiveProblem(prob)}>
              {prob.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split */}
      <div className="workspace-main">
        {/* Left Panel */}
        <div className="ws-left" style={{ width: `${leftWidth}%` }}>
          <div className="ws-left-tabs">
            <button className={`ws-ltab ${leftTab === 'description' ? 'active' : ''}`}
              onClick={() => setLeftTab('description')}>
              <FileText size={13} /> Description
            </button>
            <button className={`ws-ltab ${leftTab === 'solution' ? 'active' : ''}`}
              onClick={() => setLeftTab('solution')}>
              <Lightbulb size={13} /> Solution
            </button>
            <button className={`ws-ltab ${leftTab === 'dryrun' ? 'active' : ''}`}
              onClick={() => setLeftTab('dryrun')}>
              <MonitorPlay size={13} /> Visual Dry Run
            </button>
          </div>

          <div className={`ws-left-content ${leftTab === 'dryrun' ? 'ws-left-content-full' : ''}`}>
            {leftTab === 'description' && activeProblem && (
              <div className="ws-desc">
                <div className="problem-description" dangerouslySetInnerHTML={{ __html: activeProblem.description }} />

                {activeProblem.hints?.length > 0 && (
                  <details className="ws-hints">
                    <summary>Hints ({activeProblem.hints.length})</summary>
                    <ul>{activeProblem.hints.map((h, i) => <li key={i}>{h}</li>)}</ul>
                  </details>
                )}
              </div>
            )}

            {leftTab === 'solution' && activeProblem && (
              <div className="ws-solution">
                {activeProblem.solution_video_url ? (
                  <div className="ws-video-wrap">
                    <iframe
                      src={`https://www.youtube.com/embed/${activeProblem.solution_video_url}`}
                      title="Video Solution" allowFullScreen />
                  </div>
                ) : (
                  <p className="ws-no-content">No video solution available yet.</p>
                )}
              </div>
            )}

            {leftTab === 'dryrun' && activeProblem && (
              <div className="ws-dryrun-wrap">
                <DryRunViewer problemId={activeProblem.id} />
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="ws-divider" onMouseDown={handleDividerDrag} />

        {/* Right Panel */}
        <div className="ws-right" style={{ width: `${100 - leftWidth}%` }}>
          <div className="ws-editor-toolbar">
            <select className="ws-lang-select" value={activeLang}
              onChange={(e) => setActiveLang(e.target.value)}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>
            <div className="ws-editor-actions">
              <button className="ws-save-btn" onClick={handleSave}>
                <Save size={13} /> {saveMsg || 'Save'}
              </button>
              <button className="ws-run-btn" onClick={handleRun}>
                <Play size={13} /> Run
              </button>
            </div>
          </div>

          <div className="ws-editor-area">
            <Editor
              height="100%"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              language={activeLang}
              value={codeContent}
              onChange={(val) => setCodeContent(val || '')}
              options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: '"Space Mono", monospace' }}
            />
          </div>

          {/* Test Cases */}
          {showTestCases && (
            <div className="ws-testcases">
              <div className="ws-tc-header">
                <span className="ws-tc-title">
                  {runResult ? (
                    <span className="ws-tc-result">
                      Simulated Run &mdash; Runtime: {runResult.runtime} &middot; Memory: {runResult.memory} &middot; Beats {runResult.beat}
                    </span>
                  ) : 'Test Cases'}
                </span>
                <button className="ws-tc-toggle" onClick={() => setShowTestCases(false)}>&times;</button>
              </div>
              <div className="ws-tc-body">
                <div className="ws-tc-tabs">
                  <button className="ws-tc-tab active">Case 1</button>
                  <button className="ws-tc-tab">Case 2</button>
                </div>
                <div className="ws-tc-content">
                  <div className="ws-tc-row">
                    <span className="ws-tc-label">Input</span>
                    <code className="ws-tc-value">nums = [2, 7, 11, 15], target = 9</code>
                  </div>
                  <div className="ws-tc-row">
                    <span className="ws-tc-label">Expected</span>
                    <code className="ws-tc-value">[0, 1]</code>
                  </div>
                  {runResult && (
                    <div className="ws-tc-row ws-tc-output">
                      <span className="ws-tc-label">Output</span>
                      <code className="ws-tc-value">Simulated &mdash; verify on LeetCode</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="workspace-bottom">
        <div className="wb-left">
          {session && (
            <button className={`wb-btn ${userProgress?.is_completed ? 'wb-done' : ''}`}
              onClick={markComplete}>
              <CheckCircle size={13} /> {userProgress?.is_completed ? 'Completed' : 'Mark Complete'}
            </button>
          )}
          {activeProblem?.leetcode_url && (
            <a href={activeProblem.leetcode_url} target="_blank" rel="noopener noreferrer" className="wb-btn wb-lc">
              <ExternalLink size={13} /> LeetCode
            </a>
          )}
          {userProgress?.next_review_at && (
            <span className="wb-review"><RotateCcw size={11} /> {new Date(userProgress.next_review_at).toLocaleDateString()}</span>
          )}
        </div>

        {session && (
          <div className="wb-center">
            {[1,2,3,4,5].map(val => (
              <button key={val}
                className={`wb-conf ${confidence >= val ? 'active' : ''}`}
                onClick={() => setAndSaveConfidence(val)}
                title={['Again','Hard','Good','Easy','Mastered'][val-1]}>
                {val}
              </button>
            ))}
          </div>
        )}

        <div className="wb-right">
          {session && (
            <button className={`wb-btn ${showNotes ? 'wb-active' : ''}`}
              onClick={() => setShowNotes(!showNotes)}>
              <StickyNote size={13} /> Notes
            </button>
          )}
        </div>
      </div>

      {/* Notes Drawer */}
      {showNotes && session && (
        <div className="ws-notes-drawer">
          <textarea className="ws-notes-ta" value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Your approach, edge cases, things to remember..." rows={5} />
          <button className="ws-notes-save" onClick={saveNotes}>Save Notes</button>
        </div>
      )}
    </div>
  );
}
