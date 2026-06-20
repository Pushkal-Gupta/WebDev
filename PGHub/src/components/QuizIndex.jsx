import React, { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sparkles, ArrowRight, ListChecks, Lock, ArrowLeft, X, ChevronDown, Check } from 'lucide-react';
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

      <ul className="quiz-grid">
        {topics.flatMap(t => t.quizzes.map(q => ({ ...q, _topic: t.label }))).map(q => (
          <li key={q.id} className="quiz-card">
            <div className="quiz-card-head">
              <span className="quiz-card-topic">{q._topic}</span>
              <span className={`quiz-pill ${DIFFICULTY_CLASS[q.difficulty] || ''}`}>
                {q.difficulty}
              </span>
            </div>
            <h3 className="quiz-card-title">{q.title}</h3>
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
    </div>
  );
}

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

function QuizDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = options.find(o => o.value === value);

  return (
    <div className="quiz-dd" ref={ref}>
      <button
        type="button"
        className={`quiz-dd-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="quiz-dd-value">{active ? active.label : value}</span>
        <ChevronDown size={15} className={`quiz-dd-chev ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <ul className="quiz-dd-menu" role="listbox">
          {options.map(opt => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className={`quiz-dd-opt ${opt.value === value ? 'active' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check size={14} className="quiz-dd-check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
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

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const topicOptions = useMemo(
    () => Object.entries(TOPIC_LABELS).map(([value, label]) => ({ value, label })),
    []
  );
  const difficultyOptions = useMemo(
    () => DIFFICULTY_OPTIONS.map(d => ({ value: d, label: d })),
    []
  );

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
    <div
      className="quiz-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="quiz-modal" role="dialog" aria-modal="true" aria-label="Custom quiz builder">
        <button type="button" className="quiz-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="quiz-modal-head">
          <h3 className="quiz-modal-title">
            <Sparkles size={16} /> Custom quiz builder
          </h3>
          <p className="quiz-modal-sub">Pick a topic and difficulty, name a weak spot, set how many questions.</p>
        </div>

        <div className="quiz-modal-body">
          <div className="quiz-modal-form">
            <div className="quiz-field">
              <span className="quiz-field-label">Topic</span>
              <QuizDropdown label="Topic" value={topic} options={topicOptions} onChange={setTopic} />
            </div>
            <div className="quiz-field">
              <span className="quiz-field-label">Difficulty</span>
              <QuizDropdown label="Difficulty" value={difficulty} options={difficultyOptions} onChange={setDifficulty} />
            </div>
            <div className="quiz-field">
              <span className="quiz-field-label">Questions</span>
              <input
                className="quiz-field-input"
                type="number"
                min={4}
                max={15}
                value={questions}
                onChange={(e) => setQuestions(Math.min(15, Math.max(4, Number(e.target.value) || 8)))}
              />
            </div>
            <div className="quiz-field quiz-field-wide">
              <span className="quiz-field-label">Focus (optional)</span>
              <input
                className="quiz-field-input"
                type="text"
                value={focus}
                placeholder="e.g. monotonic stacks, time complexity edge cases…"
                onChange={(e) => setFocus(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className="quiz-modal-generate"
            onClick={generate}
            disabled={generating}
          >
            <Sparkles size={14} /> {generating ? 'Generating…' : 'Generate quiz'}
          </button>

          {error && <p className="quiz-error">{error}</p>}
          {generated && <CustomQuizPreview quiz={generated} />}
        </div>
      </div>
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
