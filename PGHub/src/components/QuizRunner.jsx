import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, ArrowRight, ListChecks, Trophy, Timer,
} from 'lucide-react';
import Breadcrumb from './common/Breadcrumb';
import { getQuizById, TOPIC_LABELS } from '../content/quizzes';
import './QuizRunner.css';

function pctClass(pct) {
  if (pct >= 80) return 'quiz-score-good';
  if (pct >= 50) return 'quiz-score-mid';
  return 'quiz-score-low';
}

// mm:ss (or h:mm:ss past an hour) — how long the quiz took to answer.
function fmtDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export default function QuizRunner({ quiz: passedQuiz, embedded = false }) {
  const params = useParams();

  const quiz = useMemo(() => {
    if (passedQuiz) return passedQuiz;
    return getQuizById(params.id);
  }, [passedQuiz, params.id]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState({});
  const [revealedSet, setRevealedSet] = useState({});
  const [finished, setFinished] = useState(false);

  // Timer: starts on mount, ticks once a second while answering, freezes on finish.
  const [startTime, setStartTime] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState(null);

  useEffect(() => {
    if (finished) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finished]);

  const elapsedMs = (finishedAt ?? now) - startTime;

  if (!quiz) {
    return (
      <div className="quiz-container">
        <Breadcrumb items={[{ label: 'Quiz', to: '/quiz' }, { label: 'Quiz' }]} />
        <p className="quiz-not-found">
          That quiz doesn&rsquo;t exist or has been retired.{' '}
          <Link to="/quiz" className="quiz-link">Back to all quizzes</Link>.
        </p>
      </div>
    );
  }

  const total = quiz.questions.length;
  const current = quiz.questions[index];
  const currentPicked = picked[current.id];
  const currentRevealed = Boolean(revealedSet[current.id]);

  const submit = (optionIdx) => {
    if (currentRevealed) return;
    setPicked(p => ({ ...p, [current.id]: optionIdx }));
    setRevealedSet(r => ({ ...r, [current.id]: true }));
  };

  const next = () => {
    if (index < total - 1) setIndex(i => i + 1);
    else { setFinishedAt(Date.now()); setFinished(true); }
  };

  const prev = () => {
    if (index > 0) setIndex(i => i - 1);
  };

  const restart = () => {
    setIndex(0);
    setPicked({});
    setRevealedSet({});
    setFinished(false);
    setStartTime(Date.now());
    setNow(Date.now());
    setFinishedAt(null);
  };

  const score = quiz.questions.reduce(
    (acc, q) => acc + (picked[q.id] === q.correct ? 1 : 0),
    0,
  );
  const answeredCount = Object.keys(revealedSet).length;
  const pct = Math.round((score / total) * 100);

  if (finished) {
    return (
      <div className={embedded ? '' : 'quiz-container'}>
        {!embedded && (
          <Breadcrumb items={[{ label: 'Quiz', to: '/quiz' }, { label: quiz.title || 'Quiz' }]} />
        )}
        <div className="quiz-result-card">
          <Trophy size={28} className="quiz-result-icon" />
          <h2 className="quiz-result-title">{quiz.title}</h2>
          <p className={`quiz-result-score ${pctClass(pct)}`}>
            {score} / {total} correct
            <span className="quiz-result-pct">({pct}%)</span>
          </p>
          <p className="quiz-result-time">
            <Timer size={14} /> Time taken <strong>{fmtDuration(elapsedMs)}</strong>
          </p>
          <p className="quiz-result-sub">
            {pct >= 80
              ? 'Solid grasp. Try a harder quiz on the same topic, or jump to a related one.'
              : pct >= 50
                ? 'Mixed results. Review the explanations below and retake when ready.'
                : 'Worth revisiting the concept before retrying — check the explanations below.'}
          </p>
          <div className="quiz-result-actions">
            <button type="button" className="quiz-btn quiz-btn-primary" onClick={restart}>
              <RotateCcw size={13} /> Retake
            </button>
            {!embedded && (
              <Link to="/quiz" className="quiz-btn">
                <ListChecks size={13} /> Browse more quizzes
              </Link>
            )}
          </div>
        </div>

        <ol className="quiz-review-list">
          {quiz.questions.map((q, i) => {
            const userPick = picked[q.id];
            const correct = userPick === q.correct;
            return (
              <li key={q.id} className={`quiz-review-item ${correct ? 'right' : 'wrong'}`}>
                <header className="quiz-review-head">
                  <span className="quiz-review-num">Q{i + 1}</span>
                  {correct
                    ? <span className="quiz-review-tag right"><CheckCircle2 size={12} /> Correct</span>
                    : <span className="quiz-review-tag wrong"><XCircle size={12} /> Off</span>}
                </header>
                <p className="quiz-review-prompt">{q.prompt}</p>
                <ul className="quiz-review-options">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === q.correct;
                    const isPick = oi === userPick;
                    return (
                      <li
                        key={oi}
                        className={`quiz-review-opt ${isCorrect ? 'correct' : ''} ${isPick && !isCorrect ? 'picked-wrong' : ''}`}
                      >
                        <span className="quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                        <span>{opt}</span>
                      </li>
                    );
                  })}
                </ul>
                {q.explanation && (
                  <p className="quiz-review-explanation">{q.explanation}</p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'quiz-container'}>
      {!embedded && (
        <Breadcrumb items={[{ label: 'Quiz', to: '/quiz' }, { label: quiz.title || 'Quiz' }]} />
      )}

      <header className="quiz-run-header">
        <div>
          <p className="quiz-run-topic">
            {TOPIC_LABELS[quiz.topic] || quiz.topic} · {quiz.difficulty}
          </p>
          <h1 className="quiz-run-title">{quiz.title}</h1>
        </div>
        <div className="quiz-run-progress">
          <span className="quiz-run-count">
            Question <strong>{index + 1}</strong> of {total}
            <span className="quiz-run-timer"><Timer size={12} /> {fmtDuration(elapsedMs)}</span>
          </span>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <article className="quiz-question-card">
        <p className="quiz-question-prompt">{current.prompt}</p>
        <ul className="quiz-options">
          {current.options.map((opt, oi) => {
            const isPick = currentPicked === oi;
            const isCorrect = currentRevealed && oi === current.correct;
            const isWrong = currentRevealed && isPick && oi !== current.correct;
            return (
              <li key={oi}>
                <button
                  type="button"
                  className={`quiz-option ${isPick ? 'picked' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => submit(oi)}
                  disabled={currentRevealed}
                >
                  <span className="quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                  <span className="quiz-opt-text">{opt}</span>
                  {isCorrect && <CheckCircle2 size={14} className="quiz-opt-icon ok" />}
                  {isWrong && <XCircle size={14} className="quiz-opt-icon bad" />}
                </button>
              </li>
            );
          })}
        </ul>
        {currentRevealed && current.explanation && (
          <p className="quiz-explanation">
            <strong>Why: </strong>{current.explanation}
          </p>
        )}
      </article>

      <div className="quiz-nav-row">
        <button type="button" className="quiz-btn" onClick={prev} disabled={index === 0}>
          <ArrowLeft size={13} /> Previous
        </button>
        <span className="quiz-nav-meta">
          {answeredCount} of {total} answered
        </span>
        <button
          type="button"
          className="quiz-btn quiz-btn-primary"
          onClick={next}
          disabled={!currentRevealed}
        >
          {index === total - 1 ? 'Finish' : 'Next'}
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
