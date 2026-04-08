import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Save, MonitorPlay, Code2, ExternalLink, CheckCircle, Star as StarIcon, RotateCcw } from 'lucide-react';
import DryRunViewer from './DryRunViewer';
import '../styles/Workspace.css'; // Will create this layout file

export default function Workspace({ session, theme, roadmapMode }) {
  const { categoryId } = useParams();
  const [topic, setTopic] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);

  const [activeLang, setActiveLang] = useState('python');
  const [codeContent, setCodeContent] = useState('');
  const [viewMode, setViewMode] = useState('code');
  const [templates, setTemplates] = useState({});
  const [userProgress, setUserProgress] = useState(null);
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    async function fetchWorkspaceData() {
      if (!categoryId) return;
      try {
        const { data: topicData } = await supabase
          .from('PGcode_topics')
          .select('*')
          .eq('id', categoryId)
          .single();
        if (topicData) setTopic(topicData);

        const { data: qData } = await supabase
          .from('PGcode_problems')
          .select('*')
          .eq('topic_id', categoryId);

        let filtered = qData || [];
        if (roadmapMode === '200') {
          filtered = filtered.filter(p =>
            p.roadmap_set === '200' || p.roadmap_set === 'both' || !p.roadmap_set
          );
        }

        if (filtered.length > 0) {
          setProblems(filtered);
          setActiveProblem(filtered[0]);
        }

      } catch (err) {
        console.error("Error fetching workspace data:", err);
      }
    }
    fetchWorkspaceData();
  }, [categoryId]);

  useEffect(() => {
    async function fetchTemplates() {
      if (!activeProblem) return;
      const { data } = await supabase
        .from('PGcode_problem_templates')
        .select('*')
        .eq('problem_id', activeProblem.id);
      
      const tmplMap = {};
      if (data) {
        data.forEach(t => { tmplMap[t.language] = t.code; });
      }
      setTemplates(tmplMap);
    }
    fetchTemplates();
  }, [activeProblem]);

  useEffect(() => {
    if (activeProblem) {
      setCodeContent(templates[activeLang] || '// Code template not found for this language');
    }
  }, [activeProblem, activeLang, templates]);

  // Load user progress for active problem
  useEffect(() => {
    if (!activeProblem || !session?.user) {
      setUserProgress(null);
      setNotes('');
      setConfidence(0);
      return;
    }
    async function loadProgress() {
      const { data } = await supabase
        .from('PGcode_user_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('problem_id', activeProblem.id)
        .single();
      if (data) {
        setUserProgress(data);
        setNotes(data.notes || '');
        setConfidence(data.confidence || 0);
      } else {
        setUserProgress(null);
        setNotes('');
        setConfidence(0);
      }
    }
    loadProgress();
  }, [activeProblem, session]);

  const saveProgress = async (updates) => {
    if (!session?.user || !activeProblem) return;
    const now = new Date().toISOString();
    const payload = {
      user_id: session.user.id,
      problem_id: activeProblem.id,
      updated_at: now,
      ...updates,
    };
    await supabase.from('PGcode_user_progress').upsert(payload);
    setUserProgress(prev => ({ ...prev, ...payload }));
  };

  const markComplete = () => {
    const newVal = !(userProgress?.is_completed);
    // Spaced repetition: next review in 3 days if marking complete
    const nextReview = newVal ? new Date(Date.now() + 3 * 86400000).toISOString() : null;
    saveProgress({
      is_completed: newVal,
      last_solved_at: newVal ? new Date().toISOString() : null,
      next_review_at: nextReview,
      solve_count: (userProgress?.solve_count || 0) + (newVal ? 1 : 0),
    });
  };

  const saveNotes = () => {
    saveProgress({ notes });
  };

  const setAndSaveConfidence = (val) => {
    setConfidence(val);
    // Adjust spaced repetition interval based on confidence
    const daysMap = { 1: 1, 2: 2, 3: 3, 4: 7, 5: 14 };
    const days = daysMap[val] || 3;
    saveProgress({
      confidence: val,
      next_review_at: new Date(Date.now() + days * 86400000).toISOString(),
    });
  };

  if (!topic && problems.length === 0) {
    return <div className="workspace-loading">Loading Workspace... <Link to="/" className="workspace-back">Go back</Link></div>;
  }

  return (
    <div className="workspace-container">
      {/* Left Panel: Problem Context */}
      <div className="workspace-left-panel">
        <div className="workspace-panel-header">
          <Link to="/" className="workspace-back"><ArrowLeft size={16} /> Roadmap</Link>
          <h2 className="workspace-topic-title">
            {(topic?.name || categoryId || '').split(/\\n|\n/)[0].trim()} Setup
          </h2>
          {topic?.name && (topic.name.split(/\\n|\n/).length > 1) && (
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem'}}>
              {topic.name.split(/\\n|\n/).slice(1).join(',').split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                 <span key={i} style={{padding: '0.2rem 0.6rem', background: 'var(--hover-box)', color: 'var(--accent)', borderRadius: '12px', fontSize: '0.8rem', fontFamily: 'var(--sans)'}}>
                    {tag}
                 </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="problem-tabs-row">
          {problems.map(prob => (
            <div 
              key={prob.id} 
              className={`prob-tab-item ${activeProblem?.id === prob.id ? 'active' : ''}`}
              onClick={() => setActiveProblem(prob)}
            >
              {prob.name}
            </div>
          ))}
          {problems.length === 0 && <div className="prob-tab-empty">No problems mapped.</div>}
        </div>

        {activeProblem && (
          <div className="problem-content">
            <div className="problem-header-row">
               <h3>{activeProblem.name}</h3>
               <span className={`diff-badge diff-${activeProblem.difficulty?.toLowerCase()}`}>{activeProblem.difficulty}</span>
            </div>

            <div className="problem-description" dangerouslySetInnerHTML={{ __html: activeProblem.description }} />

            {activeProblem.solution_video_url && (
              <div className="video-container">
                <iframe src={`https://www.youtube.com/embed/${activeProblem.solution_video_url}`} title="Video Solution" className="video-iframe" allowFullScreen></iframe>
              </div>
            )}
            
            {activeProblem.hints && activeProblem.hints.length > 0 && (
              <div className="problem-hints">
                <h4>Hints</h4>
                <ul>
                  {activeProblem.hints.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}

            {/* Action Bar: LeetCode + Mark Complete */}
            <div className="problem-actions">
              {activeProblem.leetcode_url && (
                <a href={activeProblem.leetcode_url} target="_blank" rel="noopener noreferrer" className="action-btn action-lc">
                  <ExternalLink size={14} /> Solve on LeetCode
                </a>
              )}
              {session && (
                <button
                  className={`action-btn ${userProgress?.is_completed ? 'action-done' : 'action-mark'}`}
                  onClick={markComplete}
                >
                  <CheckCircle size={14} /> {userProgress?.is_completed ? 'Completed' : 'Mark Complete'}
                </button>
              )}
              {userProgress?.next_review_at && (
                <span className="review-badge">
                  <RotateCcw size={12} /> Review {new Date(userProgress.next_review_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Confidence Rating */}
            {session && (
              <div className="confidence-section">
                <span className="confidence-label">Confidence</span>
                <div className="confidence-dots">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      className={`confidence-dot ${confidence >= val ? 'active' : ''}`}
                      onClick={() => setAndSaveConfidence(val)}
                      title={['Again', 'Hard', 'Good', 'Easy', 'Mastered'][val - 1]}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <span className="confidence-hint">
                  {['', 'Again soon', 'Review in 2d', 'Review in 3d', 'Review in 1w', 'Review in 2w'][confidence]}
                </span>
              </div>
            )}

            {/* Personal Notes */}
            {session && (
              <div className="notes-section">
                <span className="notes-label">Personal Notes</span>
                <textarea
                  className="notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your approach, edge cases, things to remember..."
                  rows={4}
                />
                <button className="notes-save" onClick={saveNotes}>Save Notes</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel: Editor / Interactive Viewer */}
      <div className="workspace-right-panel">
        <div className="panel-header-editor">
          <div className="editor-mode-toggle">
            <button 
              className={`mode-btn ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => setViewMode('code')}
            >
              <Code2 size={16} /> Code
            </button>
            <button 
              className={`mode-btn ${viewMode === 'visual' ? 'active' : ''}`}
              onClick={() => setViewMode('visual')}
            >
              <MonitorPlay size={16} /> Visual Dry Run
            </button>
          </div>
          
          {viewMode === 'code' && (
            <div className="editor-actions">
              <select 
                className="lang-select"
                value={activeLang}
                onChange={(e) => setActiveLang(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
            
              <button className="btn-primary save-btn">
                <Save size={14} /> <span>Save</span>
              </button>
              <button className="btn-primary run-btn" onClick={() => alert('Validation coming soon!')}>
                <Play size={14} /> <span>Run</span>
              </button>
            </div>
          )}
        </div>

        <div className="editor-wrapper">
          {viewMode === 'code' ? (
            <Editor
              height="100%"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              language={activeLang}
              value={codeContent}
              onChange={(val) => setCodeContent(val)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--mono)'
              }}
            />
          ) : (
            activeProblem ? <DryRunViewer problemId={activeProblem.id} /> : null
          )}
        </div>
      </div>
    </div>
  );
}
