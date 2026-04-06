import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Save, MonitorPlay, Code2 } from 'lucide-react';
import DryRunViewer from './DryRunViewer';
import '../styles/Workspace.css'; // Will create this layout file

export default function Workspace({ session, theme }) {
  const { categoryId } = useParams();
  const [topic, setTopic] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  
  const [activeLang, setActiveLang] = useState('python');
  const [codeContent, setCodeContent] = useState('');
  const [viewMode, setViewMode] = useState('code'); // 'code' | 'visual'
  const [templates, setTemplates] = useState({});

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
        
        if (qData && qData.length > 0) {
          setProblems(qData);
          setActiveProblem(qData[0]);
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
                 <span key={i} style={{padding: '0.2rem 0.6rem', background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: '12px', fontSize: '0.8rem', fontFamily: 'var(--sans)'}}>
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
