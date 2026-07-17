import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { isAiEnabled } from '../lib/ai';
import { sanitizeError } from '../lib/sanitizeError';
import './AiExplainFailure.css';

export default function AiExplainFailure({ problem, result, code, language }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isAiEnabled()) {
    return (
      <div className="aiex-disabled">
        <Sparkles size={12} /> Enable AI in Settings to get a one-paragraph explanation of why this failed.
      </div>
    );
  }

  // Find the first failing case (if cases were recorded)
  const failingCase = (result?.cases || []).find(c => !c.passed) || null;

  const explain = async () => {
    setLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const { aiExplainFailure } = await import('../lib/ai');
      const text = await aiExplainFailure({
        problemName: problem?.name || problem?.id,
        problemDescription: (problem?.description || '').replace(/<[^>]+>/g, ' ').slice(0, 1500),
        failingInput: failingCase?.input || '(not captured)',
        expectedOutput: failingCase?.expected || '(not captured)',
        actualOutput: failingCase?.actual || result?.error || '(no output)',
        code: (code || '').slice(0, 4000),
        language,
      });
      setExplanation(text);
    } catch (e) {
      setError(sanitizeError(e, 'AI call failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aiex">
      <div className="aiex-head">
        <Sparkles size={12} className="aiex-spark" />
        <span>AI failure analysis</span>
        {explanation && (
          <button className="aiex-refresh" onClick={explain} title="Re-run">
            <RefreshCw size={11} />
          </button>
        )}
      </div>
      {explanation && <p className="aiex-body">{explanation}</p>}
      {error && <p className="aiex-error">{error}</p>}
      {!explanation && (
        <button className="aiex-btn" onClick={explain} disabled={loading}>
          {loading ? <><Loader2 size={11} className="aiex-spin" /> Thinking…</>
            : <><Sparkles size={11} /> Explain why this failed</>}
        </button>
      )}
    </div>
  );
}
