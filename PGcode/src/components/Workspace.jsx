import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { problemsData } from '../data/problems';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Save } from 'lucide-react';

export default function Workspace({ session, theme }) {
  const { categoryId } = useParams();
  const category = problemsData[categoryId];
  
  const [activeProblem, setActiveProblem] = useState(
    category && category.problems.length > 0 ? category.problems[0] : null
  );
  
  const [activeLang, setActiveLang] = useState('python');
  const [codeContent, setCodeContent] = useState('');

  // When switching problems or languages
  React.useEffect(() => {
    if (activeProblem && activeProblem.defaultCode[activeLang]) {
      setCodeContent(activeProblem.defaultCode[activeLang]);
    } else {
      setCodeContent('// Code stub not available');
    }
  }, [activeProblem, activeLang]);

  if (!category) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Category not found. <Link to="/">Go back</Link></div>;
  }

  return (
    <div style={workspaceContainer}>
      {/* Left Panel: Problem Context */}
      <div style={leftPanel}>
        <div style={panelHeader}>
          <Link to="/" style={backLink}><ArrowLeft size={16} /> Roadmap</Link>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--mono)' }}>
            {category.name} Setup
          </h2>
        </div>
        
        {/* Sub-nav for problems in this category */}
        <div style={problemTabsRow}>
          {category.problems.map(prob => (
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
          {category.problems.length === 0 && <div style={{padding: '0.5rem', color: 'var(--text-dim)'}}>No problems in this category yet.</div>}
        </div>

        {/* Dynamic content for active problem */}
        {activeProblem && (
          <div style={problemContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <h3 style={{ margin: 0 }}>{activeProblem.name}</h3>
               <span className={`diff-badge diff-${activeProblem.difficulty.toLowerCase()}`}>{activeProblem.difficulty}</span>
            </div>

            <div dangerouslySetInnerHTML={{ __html: activeProblem.description }} style={{ marginBottom: '2rem', fontSize: '0.95rem' }} />

            {activeProblem.videoEmbed && (
              <div style={videoContainer}>
                <iframe src={activeProblem.videoEmbed} title="Video Solution" style={iframeStyle} allowFullScreen></iframe>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel: Editor */}
      <div style={rightPanel}>
        <div style={panelHeaderEditor}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['python', 'java', 'javascript'].map(lang => (
              <button 
                key={lang}
                style={{
                  ...langBtn,
                  background: activeLang === lang ? 'var(--hover-box)' : 'transparent',
                  color: activeLang === lang ? 'var(--text-main)' : 'var(--text-dim)'
                }}
                onClick={() => setActiveLang(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
              <Save size={14} /> Save
            </button>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => alert('Code execution integration coming soon!')}>
              <Play size={14} /> Run Code
            </button>
          </div>
        </div>

        <div style={editorWrapper}>
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

const langBtn = {
  border: 'none',
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const editorWrapper = {
  flex: 1,
  paddingTop: '0.5rem'
};
