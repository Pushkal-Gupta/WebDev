import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Sparkles, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { friendlyError } from '../../lib/errors';
import { isAiEnabled } from '../../lib/ai';
import Markdown from './MarkdownRenderer';

const TIME_DISTRACTORS = ['O(1)', 'O(n)', 'O(n log n)', 'O(n^2)'];
const SPACE_DISTRACTORS = ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'];
const PITFALL_DISTRACTORS = ['Off-by-one error in the loop bound', 'Forgetting to handle null input', 'Sorting unnecessarily before processing'];
const APPROACH_DISTRACTORS = ['Brute force enumeration', 'Recursive backtracking only', 'Random sampling'];

function shuffleWithAnswer(correct, distractors) {
  const pool = distractors.filter(d => d && d.toLowerCase() !== String(correct).toLowerCase());
  const opts = [correct, ...pool].slice(0, 4);
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { options: opts, correctIndex: opts.indexOf(correct) };
}

function buildStaticQuiz(concept) {
  const body = concept?.body || {};
  const questions = [];

  const optimalTime = body?.complexity?.time;
  if (optimalTime) {
    const { options, correctIndex } = shuffleWithAnswer(optimalTime, TIME_DISTRACTORS);
    questions.push({ question: 'What is the optimal time complexity?', options, correctIndex });
  }

  const optimalSpace = body?.complexity?.space;
  if (optimalSpace) {
    const { options, correctIndex } = shuffleWithAnswer(optimalSpace, SPACE_DISTRACTORS);
    questions.push({ question: 'What is the optimal space complexity?', options, correctIndex });
  }

  const firstPitfall = Array.isArray(body?.pitfalls) ? body.pitfalls[0] : null;
  const pitfallText = typeof firstPitfall === 'string' ? firstPitfall : firstPitfall?.title || firstPitfall?.text;
  if (pitfallText) {
    const { options, correctIndex } = shuffleWithAnswer(pitfallText, PITFALL_DISTRACTORS);
    questions.push({ question: 'Which is a common pitfall for this concept?', options, correctIndex });
  }

  const optimalApproach = body?.optimal?.approach || body?.optimal?.name;
  if (optimalApproach) {
    const { options, correctIndex } = shuffleWithAnswer(optimalApproach, APPROACH_DISTRACTORS);
    questions.push({ question: 'Which approach is best for this problem?', options, correctIndex });
  }

  const bruteTime = body?.bruteForce?.complexity?.time;
  if (bruteTime) {
    const { options, correctIndex } = shuffleWithAnswer(bruteTime, TIME_DISTRACTORS);
    questions.push({ question: 'What is the brute force time complexity?', options, correctIndex });
  }

  return questions;
}

function StaticQuiz({ questions }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  const submit = () => {
    if (picked === null) return;
    setRevealed(true);
  };

  const next = () => {
    setIdx(i => (i + 1) % questions.length);
    setPicked(null);
    setRevealed(false);
  };

  return (
    <div className="quiz-card">
      <div className="quiz-head">
        <Sparkles size={13} className="quiz-spark" />
        <span>Quick quiz</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-dim)' }}>
          {idx + 1} / {questions.length}
        </span>
      </div>
      <p className="quiz-question"><Markdown inline>{q.question}</Markdown></p>
      <ul className="quiz-options">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = revealed && i === q.correctIndex;
          const isWrong = revealed && isPicked && i !== q.correctIndex;
          return (
            <li key={i}>
              <button
                className={`quiz-option ${isPicked ? 'picked' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => !revealed && setPicked(i)}
                disabled={revealed}
              >
                <span className="quiz-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="quiz-opt-text"><Markdown inline>{opt}</Markdown></span>
                {isCorrect && <CheckCircle2 size={13} className="quiz-opt-icon ok" />}
                {isWrong && <XCircle size={13} className="quiz-opt-icon bad" />}
              </button>
            </li>
          );
        })}
      </ul>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {!revealed ? (
          <button className="quiz-generate-btn" onClick={submit} disabled={picked === null}>
            Submit
          </button>
        ) : (
          <button className="quiz-generate-btn" onClick={next}>
            {isLast ? 'Restart' : 'Next'} <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ConceptQuiz({ concept }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const staticQuestions = useMemo(() => buildStaticQuiz(concept), [concept]);

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
      setError(friendlyError(e, 'Quiz generation failed.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAiEnabled()) {
    if (staticQuestions.length >= 2) {
      return <StaticQuiz key={concept?.slug || concept?.id || 'q'} questions={staticQuestions} />;
    }
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
      <p className="quiz-question"><Markdown inline>{quiz.question}</Markdown></p>
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
                <span className="quiz-opt-text"><Markdown inline>{opt}</Markdown></span>
                {isCorrect && <CheckCircle2 size={13} className="quiz-opt-icon ok" />}
                {isWrong && <XCircle size={13} className="quiz-opt-icon bad" />}
              </button>
            </li>
          );
        })}
      </ul>
      {revealed && quiz.explanation && (
        <p className="quiz-explanation"><Markdown inline>{quiz.explanation}</Markdown></p>
      )}
    </div>
  );
}
