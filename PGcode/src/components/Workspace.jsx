import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Save, MonitorPlay, Code2 } from 'lucide-react';
import DryRunViewer from './DryRunViewer';

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
        // Fetch topic
        const { data: topicData } = await supabase
          .from('PGcode_topics')
          .select('*')
          .eq('id', categoryId)
          .single();
        if (topicData) setTopic(topicData);

        // Fetch problems
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

  // Fetch templates when problem changes
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

  // Set code content when lang or templates finish loading
  useEffect(() => {
    if (activeProblem) {
      setCodeContent(templates[activeLang] || '// Code template not found for this language');
    }
  }, [activeProblem, activeLang, templates]);

  if (!topic && problems.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-main)', fontFamily: 'var(--mono)'}}>Loading Workspace... <Link to="/" style={{color: 'var(--accent)'}}>Go back</Link></div>;
  }

  return (
    <div style={workspaceContainer}>
      {/* Left Panel: Problem Context */}
      <div style={leftPanel}>
        <div style={panelHeader}>
          <Link to="/" style={backLink}><ArrowLeft size={16} /> Roadmap</Link>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--mono)' }}>
            {topic?.name || categoryId} Setup
          </h2>
        </div>
        
        {/* Sub-nav for problems in this category */}
        <div style={problemTabsRow}>
          {problems.map(prob => (
            <div 
              key={prob.id} 
              style={{
                ...probTabItem, 
                borderBottomColor: activeProblem?.id === prob.id ? 'var(--accent)' : 'transparent',
                color: activeProblem?.id === prob.id ? 'var(--accent)' : 'var(--text-dim)'
              }}
              onClick={() => setActiveProblem(prob)}
            >
              {prob.name}
            </div>
          ))}
          {problems.length === 0 && <div style={{padding: '0.5rem', color: 'var(--text-dim)', fontFamily: 'var(--mono)'}}>No problems mapped.</div>}
        </div>

        {/* Dynamic content for active problem */}
        {activeProblem && (
          <div style={problemContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <h3 style={{ margin: 0, fontFamily: 'var(--sans)' }}>{activeProblem.name}</h3>
               <span className={`diff-badge diff-${activeProblem.difficulty?.toLowerCase()}`}>{activeProblem.difficulty}</span>
            </div>

            <div dangerouslySetInnerHTML={{ __html: activeProblem.description }} style={{ marginBottom: '2rem', fontSize: '0.95rem' }} />

            {activeProblem.solution_video_url && (
              <div style={{...videoContainer, marginTop: '2rem'}}>
                <iframe src={`https://www.youtube.com/embed/${activeProblem.solution_video_url}`} title="Video Solution" style={iframeStyle} allowFullScreen></iframe>
              </div>
            )}
            
            {activeProblem.hints && activeProblem.hints.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{fontFamily: 'var(--sans)'}}>Hints</h4>
                <ul style={{fontFamily: 'var(--sans)', color: 'var(--text-dim)', fontSize: '0.9rem'}}>
                  {activeProblem.hints.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel: Editor / Interactive Viewer */}
      <div style={rightPanel}>
        <div style={panelHeaderEditor}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              style={{...modeBtn, color: viewMode === 'code' ? 'var(--accent)' : 'var(--text-dim)'}}
              onClick={() => setViewMode('code')}
            >
              <Code2 size={16} /> Code
            </button>
            <button 
              style={{...modeBtn, color: viewMode === 'visual' ? 'var(--accent)' : 'var(--text-dim)'}}
              onClick={() => setViewMode('visual')}
            >
              <MonitorPlay size={16} /> Visual Dry Run
            </button>
          </div>
          
          {viewMode === 'code' && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select 
                style={selectStyle}
                value={activeLang}
                onChange={(e) => setActiveLang(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
            
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <Save size={14} /> Save
              </button>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => alert('Validation coming soon!')}>
                <Play size={14} /> Run
              </button>
            </div>
          )}
        </div>

        <div style={editorWrapper}>
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

// ─── Inline Styles ─────────────────────────
const workspaceContainer = {
  display: 'flex',
  height: 'calc(100vh - 70px)',
  width: '100%',
  overflow: 'hidden'
};

const leftPanel = {
  flex: 1,
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg)',
  overflowY: 'auto'
};

const panelHeader = {
  padding: '1rem 1.5rem',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const backLink = {
  color: 'var(--text-dim)',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontFamily: 'var(--mono)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem'
};

const problemTabsRow = {
  display: 'flex',
  borderBottom: '1px solid var(--border)',
  background: 'var(--card-bg)',
  padding: '0 1rem',
  overflowX: 'auto'
};

const probTabItem = {
  padding: '0.75rem 1rem',
  fontSize: '0.85rem',
  fontFamily: 'var(--mono)',
  cursor: 'pointer',
  borderBottom: '2px solid transparent',
  whiteSpace: 'nowrap'
};

const problemContent = {
  padding: '1.5rem',
  flex: 1
};

const videoContainer = {
  position: 'relative',
  paddingBottom: '56.25%',
  height: 0,
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
};

const iframeStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: 'none'
};

const rightPanel = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg)'
};

const panelHeaderEditor = {
  padding: '0.5rem 1rem',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'var(--card-bg)'
};

const modeBtn = {
  background: 'none',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontFamily: 'var(--mono)',
  fontSize: '0.9rem',
  cursor: 'pointer',
  padding: '0.5rem',
  transition: 'color var(--t)'
};

const selectStyle = {
  background: 'var(--bg)',
  color: 'var(--text-main)',
  border: '1px solid var(--border)',
  padding: '0.4rem 0.8rem',
  fontFamily: 'var(--mono)',
  borderRadius: '4px',
  outline: 'none'
};

const editorWrapper = {
  flex: 1,
  paddingTop: '0'
};
