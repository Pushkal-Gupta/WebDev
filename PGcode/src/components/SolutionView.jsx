import React, { useState, useEffect } from 'react';
import { Copy, Check, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DryRunViewer from './DryRunViewer';
import ProblemVisualizer from './ProblemVisualizer';
import LanguageIcon from './LanguageIcon';
import { RICH_CONTENT } from '../content/problemContent';
import './SolutionView.css';

const LANG_ORDER = ['python', 'javascript', 'typescript', 'java', 'kotlin', 'cpp', 'c', 'go', 'rust', 'swift', 'csharp', 'ruby', 'php', 'bash'];

export default function SolutionView({ problem, activeLang: wsLang }) {
  const [approaches, setApproaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCodeLang, setActiveCodeLang] = useState(wsLang || 'python');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => { if (wsLang) setActiveCodeLang(wsLang); }, [wsLang]);

  const handleCopy = async (approachId, text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(approachId);
      setTimeout(() => setCopiedId(prev => (prev === approachId ? null : prev)), 1500);
    } catch {
      // clipboard may be blocked; fall back silently
    }
  };

  const problemId = problem?.id;
  useEffect(() => {
    if (!problemId) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('PGcode_solution_approaches')
          .select('*')
          .eq('problem_id', problemId)
          .order('approach_number', { ascending: true });
        setApproaches(data || []);
      } catch (err) {
        console.error('Failed to load solution approaches:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [problemId]);

  if (loading) return <div className="sv-loading">Loading solutions...</div>;

  // If any explained_samples entry sets `viz_anchor`, hand the FIRST anchor to
  // ProblemVisualizer so the viz steps through that exact case. No-op when
  // missing — the viz just falls back to its default test-case walkthrough.
  const vizAnchor = (() => {
    const samples = Array.isArray(problem?.explained_samples) ? problem.explained_samples : [];
    for (const s of samples) {
      if (s && typeof s.viz_anchor === 'string' && s.viz_anchor.trim()) return s.viz_anchor.trim();
    }
    return null;
  })();

  // Fallback to DB column problem.solutions, then to client-side RICH_CONTENT.
  // `solutions` can be stored either as flat strings ({python: "code"}) from
  // bulk import, nested objects ({python: {code, approach, complexity}}) from
  // older RICH_CONTENT, or arrays of approach objects ({python: [{name, code,
  // intuition, complexity}, ...]}) from new multi-approach entries.
  // Normalise to {lang: [approach, ...]} so the UI is uniform.
  const langLabels = {
    python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript',
    java: 'Java', kotlin: 'Kotlin', cpp: 'C++', c: 'C', go: 'Go',
    rust: 'Rust', swift: 'Swift', csharp: 'C#', ruby: 'Ruby', php: 'PHP', bash: 'Bash',
  };
  const rawFallback = (problem.solutions && Object.keys(problem.solutions).length > 0)
    ? problem.solutions
    : (RICH_CONTENT[problem.id]?.solutions || null);
  const fallback = rawFallback ? Object.fromEntries(
    Object.entries(rawFallback).map(([lang, v]) => {
      if (Array.isArray(v)) return [lang, v];
      if (typeof v === 'string') return [lang, [{ code: v }]];
      return [lang, [v]];
    })
  ) : null;

  if (approaches.length === 0 && fallback) {
    const availableLangs = LANG_ORDER.filter(l => fallback[l]?.length);
    const langsToShow = availableLangs.length ? availableLangs : LANG_ORDER.slice(0, 6);
    const currentLangApproaches = fallback[activeCodeLang] || [];
    const numApproaches = Math.max(
      ...Object.values(fallback).map(arr => arr?.length || 0),
      1
    );

    return (
      <div className="sv-container">
        <h2 className="sv-problem-title">{problem.name} — reference solution</h2>
        {Array.from({ length: numApproaches }, (_, i) => i).map(idx => {
          const ap = currentLangApproaches[idx];
          // Pull approach metadata (name, intuition) from whichever language
          // first defines it so descriptions persist when switching languages.
          const meta = LANG_ORDER
            .map(l => fallback[l]?.[idx])
            .find(a => a && (a.name || a.intuition));
          const approachName = ap?.name || meta?.name || `Approach ${idx + 1}`;
          const intuition = ap?.intuition || meta?.intuition;
          const complexity = ap?.complexity;
          const code = ap?.code;
          const copyKey = `fb-${idx}`;
          const isLast = idx === numApproaches - 1;
          return (
            <details key={idx} className="sv-approach" open={idx === 0}>
              <summary className="sv-approach-summary">
                <ChevronRight size={16} className="sv-chevron" />
                <span className="sv-approach-title">{idx + 1}. {approachName}</span>
                {complexity && (
                  <span className="sv-complexity-badge">
                    {complexity.time} time &middot; {complexity.space} space
                  </span>
                )}
              </summary>
              <div className="sv-approach-body">
                {intuition && (
                  <div className="sv-subsection">
                    <h4 className="sv-subtitle">Intuition</h4>
                    <p className="sv-text">{intuition}</p>
                  </div>
                )}

                {ap?.approach && (
                  <div className="sv-subsection">
                    <h4 className="sv-subtitle">Approach</h4>
                    <p className="sv-text">{ap.approach}</p>
                  </div>
                )}

                <div className="sv-subsection">
                  <div className="sv-code-header">
                    <div className="sv-lang-tabs">
                      {langsToShow.map(lang => (
                        <button
                          key={lang}
                          className={`sv-lang-tab ${activeCodeLang === lang ? 'active' : ''}`}
                          onClick={() => setActiveCodeLang(lang)}
                          disabled={!fallback[lang]?.[idx]?.code}
                        >
                          <LanguageIcon lang={lang} size={14} />
                          <span>{langLabels[lang]}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      className={`sv-copy-btn ${copiedId === copyKey ? 'copied' : ''}`}
                      onClick={() => handleCopy(copyKey, code)}
                      disabled={!code}
                    >
                      {copiedId === copyKey ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId === copyKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  {code ? (
                    <pre className="sv-code-block"><code>{code}</code></pre>
                  ) : (
                    <div className="sv-code-empty">No {langLabels[activeCodeLang]} solution yet for this approach.</div>
                  )}
                </div>

                {isLast && (
                  <div className="sv-subsection">
                    <h4 className="sv-subtitle">Step-by-step visualization</h4>
                    <ProblemVisualizer problem={problem} vizAnchor={vizAnchor} />
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    );
  }

  if (approaches.length === 0) {
    return (
      <div className="sv-container">
        {problem.solution_video_url && (
          <div className="sv-section">
            <h3 className="sv-section-title">Video Explanation</h3>
            <div className="sv-video-wrap">
              <iframe src={`https://www.youtube.com/embed/${problem.solution_video_url}`} title="Video" allowFullScreen />
            </div>
          </div>
        )}
        <div className="sv-section">
          <h3 className="sv-section-title">Step-by-step visualization</h3>
          <ProblemVisualizer problem={problem} vizAnchor={vizAnchor} />
        </div>
        <div className="sv-section">
          <h3 className="sv-section-title">Visual Dry Run</h3>
          <DryRunViewer problemId={problem.id} />
        </div>
      </div>
    );
  }

  const langMap = { python: 'code_python', javascript: 'code_javascript', java: 'code_java', cpp: 'code_cpp', c: 'code_c', go: 'code_go' };

  return (
    <div className="sv-container">
      {/* Problem title */}
      <h2 className="sv-problem-title">{problem.name} - Explanation</h2>

      {/* Video */}
      {problem.solution_video_url && (
        <div className="sv-section">
          <h3 className="sv-section-title">Video Explanation</h3>
          <div className="sv-video-wrap">
            <iframe src={`https://www.youtube.com/embed/${problem.solution_video_url}`} title="Video" allowFullScreen />
          </div>
        </div>
      )}

      {/* Approaches */}
      {approaches.map((ap, idx) => {
        let steps = [];
        try {
          const raw = typeof ap.algorithm_steps === 'string'
            ? JSON.parse(ap.algorithm_steps)
            : (ap.algorithm_steps || []);
          steps = Array.isArray(raw) ? raw : (raw?.steps || []);
        } catch { /* malformed JSON — show empty steps */ }
        const code = ap[langMap[activeCodeLang]] || ap.code_python || '';
        const isLast = idx === approaches.length - 1;

        return (
          <details key={ap.id} className="sv-approach" open={idx === 0}>
            <summary className="sv-approach-summary">
              <ChevronRight size={16} className="sv-chevron" />
              <span className="sv-approach-title">{idx + 1}. {ap.approach_name}</span>
              {(ap.time_complexity || ap.space_complexity) && (
                <span className="sv-complexity-badge">
                  {ap.time_complexity} time &middot; {ap.space_complexity} space
                </span>
              )}
            </summary>
            <div className="sv-approach-body">
              {/* Intuition */}
              <div className="sv-subsection">
                <h4 className="sv-subtitle">Intuition</h4>
                <p className="sv-text">{ap.intuition}</p>
              </div>

              {/* Algorithm */}
              {steps.length > 0 && (
                <div className="sv-subsection">
                  <h4 className="sv-subtitle">Algorithm</h4>
                  <ol className="sv-algo-steps">
                    {steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Code */}
              <div className="sv-subsection">
                <div className="sv-code-header">
                  <div className="sv-lang-tabs">
                    {['python', 'javascript', 'java', 'cpp', 'c', 'go'].map(lang => (
                      <button
                        key={lang}
                        className={`sv-lang-tab ${activeCodeLang === lang ? 'active' : ''}`}
                        onClick={() => setActiveCodeLang(lang)}
                      >
                        <LanguageIcon lang={lang} size={14} />
                        <span>{langLabels[lang]}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    className={`sv-copy-btn ${copiedId === ap.id ? 'copied' : ''}`}
                    onClick={() => handleCopy(ap.id, code)}
                    disabled={!code}
                    title={code ? 'Copy code' : 'No code to copy'}
                    aria-label="Copy code"
                  >
                    {copiedId === ap.id ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedId === ap.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                {code ? (
                  <pre className="sv-code-block"><code>{code}</code></pre>
                ) : (
                  <div className="sv-code-empty">
                    No {langLabels[activeCodeLang]} reference yet for this approach.
                  </div>
                )}
              </div>

              {/* Step-by-step visualization + Dry Run for the last/optimal approach */}
              {isLast && (
                <>
                  <div className="sv-subsection">
                    <h4 className="sv-subtitle">Step-by-step visualization</h4>
                    <ProblemVisualizer problem={problem} vizAnchor={vizAnchor} />
                  </div>
                  <div className="sv-subsection">
                    <h4 className="sv-subtitle">Visual Dry Run</h4>
                    <DryRunViewer problemId={problem.id} />
                  </div>
                </>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
