import React, { useMemo, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sparkles, ArrowRight, ListChecks, Lock, ArrowLeft } from 'lucide-react';
import { QUIZZES, QUIZZES_BY_TOPIC, TOPIC_LABELS } from '../content/quizzes';
import { isAiEnabled } from '../lib/ai';
import './QuizIndex.css';

const LazyQuizRunner = lazy(() => import('./QuizRunner'));

const DIFFICULTY_CLASS = {
  Beginner: 'quiz-pill-beginner',
  Intermediate: 'quiz-pill-intermediate',
  Advanced: 'quiz-pill-advanced',
};

export default function QuizIndex() {
  const aiReady = isAiEnabled();
  const [customOpen, setCustomOpen] = useState(false);

  const topics = useMemo(() => {
    return Object.keys(QUIZZES_BY_TOPIC).map(topic => ({
      topic,
      label: TOPIC_LABELS[topic] || topic,
      quizzes: QUIZZES_BY_TOPIC[topic],
    }));
  }, []);

  return (
    <div className="quiz-container">
      <header className="quiz-page-header">
        <Link to="/learning" className="learn-crumb">
          <ArrowLeft size={13} /> <span>Learning</span>
          <span className="learn-crumb-sep">/</span>
          <span className="learn-crumb-here">Quizzes</span>
        </Link>
        <h1 className="quiz-page-title">
          <Brain size={20} className="quiz-page-icon" /> Quizzes
        </h1>
        <p className="quiz-page-sub">Pick a quiz, answer one at a time, see why right after each commit.</p>
      </header>

      <section className="quiz-custom-row">
        <div className="quiz-custom-copy">
          <h2 className="quiz-custom-title">
            <Sparkles size={14} /> Build your own with AI
          </h2>
          <p className="quiz-custom-sub">
            Generate a quiz tailored to any topic, difficulty, or specific weak spot. Requires your
            own AI key (Anthropic, OpenAI, or Gemini) — add one in Settings, then come back.
          </p>
        </div>
        <button
          type="button"
          className={`quiz-custom-btn ${aiReady ? '' : 'disabled'}`}
          onClick={() => aiReady && setCustomOpen(true)}
          title={aiReady ? 'Open custom quiz builder' : 'Add an AI key in Settings first'}
        >
          {aiReady ? (
            <>
              <Sparkles size={13} /> Custom quiz
            </>
          ) : (
            <>
              <Lock size={13} /> Add AI key in Settings
            </>
          )}
        </button>
      </section>

      {customOpen && aiReady && (
        <CustomQuizPanel onClose={() => setCustomOpen(false)} />
      )}

      <div className="quiz-topics">
        {topics.map(t => (
          <section key={t.topic} className="quiz-topic-section">
            <h2 className="quiz-topic-heading">{t.label}</h2>
            <ul className="quiz-grid">
              {t.quizzes.map(q => (
                <li key={q.id} className="quiz-card">
                  <div className="quiz-card-head">
                    <h3 className="quiz-card-title">{q.title}</h3>
                    <span className={`quiz-pill ${DIFFICULTY_CLASS[q.difficulty] || ''}`}>
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="quiz-card-summary">{q.summary}</p>
                  <div className="quiz-card-meta">
                    <span className="quiz-meta-chip">
                      <ListChecks size={11} /> {q.questions.length} questions
                    </span>
                    <Link to={`/quiz/${q.id}`} className="quiz-card-cta">
                      Start <ArrowRight size={12} />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function CustomQuizPanel({ onClose }) {
  const [topic, setTopic] = useState('arrays');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [focus, setFocus] = useState('');
  const [questions, setQuestions] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(null);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setGenerated(null);
    try {
      const { aiCustomQuiz } = await import('../lib/ai');
      const result = await aiCustomQuiz({
        topic: TOPIC_LABELS[topic] || topic,
        difficulty,
        focus,
        count: questions,
      });
      setGenerated(result);
    } catch (e) {
      setError(e?.message || 'Generation failed. Check your AI key in Settings.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="quiz-custom-panel">
      <div className="quiz-custom-panel-head">
        <h3>
          <Sparkles size={14} /> Custom quiz builder
        </h3>
        <button type="button" className="quiz-link" onClick={onClose}>Close</button>
      </div>
      <div className="quiz-custom-form">
        <label>
          <span>Topic</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {Object.entries(TOPIC_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Difficulty</span>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </label>
        <label>
          <span>Questions</span>
          <input
            type="number"
            min={4}
            max={15}
            value={questions}
            onChange={(e) => setQuestions(Math.min(15, Math.max(4, Number(e.target.value) || 8)))}
          />
        </label>
        <label className="quiz-custom-focus">
          <span>Focus (optional)</span>
          <input
            type="text"
            value={focus}
            placeholder="e.g. monotonic stacks, time complexity edge cases…"
            onChange={(e) => setFocus(e.target.value)}
          />
        </label>
      </div>
      <button
        type="button"
        className="quiz-custom-generate"
        onClick={generate}
        disabled={generating}
      >
        <Sparkles size={13} /> {generating ? 'Generating…' : 'Generate quiz'}
      </button>
      {error && <p className="quiz-error">{error}</p>}
      {generated && (
        <CustomQuizPreview quiz={generated} />
      )}
    </div>
  );
}

function CustomQuizPreview({ quiz }) {
  // Render the generated quiz inline using the same QuizRunner UX.
  return (
    <Suspense fallback={<p className="quiz-meta-chip">Loading quiz…</p>}>
      <LazyQuizRunner quiz={quiz} embedded />
    </Suspense>
  );
}
