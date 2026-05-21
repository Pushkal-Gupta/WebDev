import React, { useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { isAiEnabled } from '../../lib/ai';

export default function ConceptQuiz({ concept }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setQuiz(null);
    setPicked(null);
    setRevealed(false);
    try {
      const { aiQuizFromConcept } = await import('../../lib/ai');
      const bodyText = Object.values(concept.body || {})
        .map(v => typeof v === 'string' ? v : Array.isArray(v) ? v.join(' ') : JSON.stringify(v))
        .join('\n\n');
      const q = await aiQuizFromConcept({ conceptTitle: concept.title, conceptBody: bodyText });
      if (!q?.question || !Array.isArray(q?.options) || q.options.length < 2) {
        throw new Error('AI returned an incomplete quiz.');
      }
      setQuiz(q);
    } catch (e) {
      setError(e?.message || 'Quiz generation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAiEnabled()) {
    return (
      <div className="quiz-disabled">
        <Sparkles size={14} />
        <span>Enable AI in Settings to auto-generate a quiz from this concept.</span>
      </div>
    );
  }

  if (!quiz && !loading && !error) {
    return (
      <button className="quiz-generate-btn" onClick={generate}>
        <Sparkles size={13} /> Generate a quick quiz
      </button>
    );
  }

  if (loading) {
    return (
      <div className="quiz-loading">
        <Loader2 size={14} className="quiz-spin" /> Generating a quiz from this concept…
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-error">
        <span>{error}</span>
        <button className="quiz-generate-btn" onClick={generate}>
          <RefreshCw size={12} /> Try again
        </button>
      </div>
    );
  }

  const correctIdx = Number(quiz.correctIndex) || 0;

  return (
    <div className="quiz-card">
      <div className="quiz-head">
        <Sparkles size={13} className="quiz-spark" /> <span>Quick quiz</span>
        <button className="quiz-refresh" onClick={generate} title="Regenerate">
          <RefreshCw size={12} />
        </button>
      </div>
      <p className="quiz-question">{quiz.question}</p>
      <ul className="quiz-options">
        {quiz.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = revealed && i === correctIdx;
          const isWrong = revealed && isPicked && i !== correctIdx;
          return (
            <li key={i}>
              <button
                className={`quiz-option ${isPicked ? 'picked' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => { setPicked(i); setRevealed(true); }}
                disabled={revealed}
              >
                <span className="quiz-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="quiz-opt-text">{opt}</span>
                {isCorrect && <CheckCircle2 size={13} className="quiz-opt-icon ok" />}
                {isWrong && <XCircle size={13} className="quiz-opt-icon bad" />}
              </button>
            </li>
          );
        })}
      </ul>
      {revealed && quiz.explanation && (
        <p className="quiz-explanation">{quiz.explanation}</p>
      )}
    </div>
  );
}
