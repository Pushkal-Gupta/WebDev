import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DryRunViewer from './DryRunViewer';
import './SolutionView.css';

export default function SolutionView({ problem }) {
  const [approaches, setApproaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCodeLang, setActiveCodeLang] = useState('python');

  useEffect(() => {
    if (!problem) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('PGcode_solution_approaches')
          .select('*')
          .eq('problem_id', problem.id)
          .order('approach_number', { ascending: true });
        setApproaches(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [problem?.id]);

  if (loading) return <div className="sv-loading">Loading solutions...</div>;

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
          <h3 className="sv-section-title">Visual Dry Run</h3>
          <DryRunViewer problemId={problem.id} />
        </div>
      </div>
    );
  }

  const langMap = { python: 'code_python', javascript: 'code_javascript', java: 'code_java', cpp: 'code_cpp' };
  const langLabels = { python: 'Python', javascript: 'JavaScript', java: 'Java', cpp: 'C++' };

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
        const steps = typeof ap.algorithm_steps === 'string'
          ? JSON.parse(ap.algorithm_steps)
          : (ap.algorithm_steps || []);
        const code = ap[langMap[activeCodeLang]] || ap.code_python || '';

        return (
          <div key={ap.id} className="sv-approach">
            <h3 className="sv-approach-title">{idx + 1}. {ap.approach_name}</h3>

            {/* Intuition */}
            <div className="sv-subsection">
              <h4 className="sv-subtitle">Intuition</h4>
              <p className="sv-text">{ap.intuition}</p>
            </div>

            {/* Algorithm */}
            <div className="sv-subsection">
              <h4 className="sv-subtitle">Algorithm</h4>
              <ol className="sv-algo-steps">
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Dry Run for the last/optimal approach */}
            {idx === approaches.length - 1 && (
              <div className="sv-subsection">
                <h4 className="sv-subtitle">Visual Dry Run</h4>
                <DryRunViewer problemId={problem.id} />
              </div>
            )}

            {/* Code */}
            <div className="sv-subsection">
              <div className="sv-code-header">
                {['python', 'javascript', 'java', 'cpp'].map(lang => (
                  <button
                    key={lang}
                    className={`sv-lang-tab ${activeCodeLang === lang ? 'active' : ''}`}
                    onClick={() => setActiveCodeLang(lang)}
                  >
                    {langLabels[lang]}
                  </button>
                ))}
              </div>
              <pre className="sv-code-block"><code>{code}</code></pre>
            </div>

            {/* Complexity */}
            <div className="sv-complexity">
              <span><strong>Time:</strong> {ap.time_complexity}</span>
              <span><strong>Space:</strong> {ap.space_complexity}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
