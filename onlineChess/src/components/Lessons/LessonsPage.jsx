import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { LESSON_CATEGORIES, getLessonsByCategory, getLessonById, getCompletedLessons, markLessonComplete } from '../../data/lessons';
import useThemeStore, { useBoardColors, cellStyle, boardContainerStyle } from '../../store/themeStore';
import { usePieceResolver } from '../../utils/pieceResolver';
import styles from './LessonsPage.module.css';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['1','2','3','4','5','6','7','8'];

// Mini board for lesson display
function LessonBoard({ fen, onSquareClick, highlight }) {
  const { clr1, clr2, isImageTheme, boardImageUrl } = useBoardColors();
  const resolvePiece = usePieceResolver();
  const chess = new Chess(fen);
  const board = chess.board();

  return (
    <div className={styles.board} style={boardContainerStyle(isImageTheme, boardImageUrl)}>
      {[7,6,5,4,3,2,1,0].map(rank =>
        [0,1,2,3,4,5,6,7].map(file => {
          const sq = FILES[file] + RANKS[rank];
          const piece = board[7 - rank]?.[file];
          const isLight = (file + rank) % 2 !== 0;
          const isHighlighted = highlight === sq;
          let bg = isLight ? clr1 : clr2;
          const hl = isHighlighted;
          if (hl) bg = 'rgba(0,255,245,0.35)';

          return (
            <div
              key={sq}
              className={styles.cell}
              style={cellStyle(isLight, bg, isImageTheme, boardImageUrl, hl)}
              onClick={() => onSquareClick?.(sq)}
            >
              {piece && (
                <img
                  src={resolvePiece(piece.type, piece.color)}
                  alt=""
                  className={styles.pieceImg}
                />
              )}
              {file === 0 && <span className={styles.rankLabel}>{RANKS[rank]}</span>}
              {rank === 0 && <span className={styles.fileLabel}>{FILES[file]}</span>}
            </div>
          );
        })
      )}
    </div>
  );
}

// Step renderer
function LessonStep({ step, onCorrect, onNext }) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [hintShown, setHintShown] = useState(false);

  const handleSquareClick = useCallback((sq) => {
    if (step.type !== 'play' || feedback === 'correct') return;

    if (!selectedSquare) {
      setSelectedSquare(sq);
      return;
    }

    // Try to make the move
    const chess = new Chess(step.fen);
    const result = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
    setSelectedSquare(null);

    if (!result) {
      // Try clicking a different piece
      const piece = chess.get(sq);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(sq);
        return;
      }
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
      return;
    }

    if (result.san === step.correctMove) {
      setFeedback('correct');
      setShowExplanation(true);
      onCorrect?.();
    } else {
      // Wrong move -- undo
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
    }
  }, [step, selectedSquare, feedback, onCorrect]);

  const handleQuizAnswer = (idx) => {
    setQuizAnswer(idx);
    if (idx === step.correctIndex) {
      setFeedback('correct');
      setShowExplanation(true);
      onCorrect?.();
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
    }
  };

  // Explain step
  if (step.type === 'explain') {
    return (
      <div className={styles.stepContent}>
        {step.fen && <LessonBoard fen={step.fen} />}
        <div className={styles.explainText}>{step.text}</div>
        <button className={styles.nextBtn} onClick={onNext}>Continue</button>
      </div>
    );
  }

  // Play step
  if (step.type === 'play') {
    return (
      <div className={styles.stepContent}>
        <LessonBoard fen={step.fen} onSquareClick={handleSquareClick} highlight={selectedSquare} />

        <div className={styles.playPrompt}>
          {feedback === 'correct' ? 'Correct!' : 'Find the best move.'}
        </div>

        {feedback === 'wrong' && <div className={styles.wrongFlash}>Not quite. Try again.</div>}

        {!hintShown && feedback !== 'correct' && step.hint && (
          <button className={styles.hintBtn} onClick={() => setHintShown(true)}>Show Hint</button>
        )}
        {hintShown && !showExplanation && (
          <div className={styles.hintText}>{step.hint}</div>
        )}

        {showExplanation && (
          <>
            <div className={styles.explanation}>{step.explanation}</div>
            <button className={styles.nextBtn} onClick={onNext}>Continue</button>
          </>
        )}
      </div>
    );
  }

  // Quiz step
  if (step.type === 'quiz') {
    return (
      <div className={styles.stepContent}>
        <div className={styles.quizQuestion}>{step.question}</div>
        <div className={styles.quizOptions}>
          {step.options.map((opt, i) => (
            <button
              key={i}
              className={`${styles.quizOption} ${
                quizAnswer === i
                  ? i === step.correctIndex ? styles.quizCorrect : styles.quizWrong
                  : ''
              }`}
              onClick={() => handleQuizAnswer(i)}
              disabled={feedback === 'correct'}
            >
              {opt}
            </button>
          ))}
        </div>
        {showExplanation && (
          <>
            <div className={styles.explanation}>{step.explanation}</div>
            <button className={styles.nextBtn} onClick={onNext}>Continue</button>
          </>
        )}
      </div>
    );
  }

  return null;
}

// Main Lessons Page
export default function LessonsPage() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepsCorrect, setStepsCorrect] = useState(0);
  const [completed] = useState(() => getCompletedLessons());

  const handleSelectLesson = (id) => {
    const lesson = getLessonById(id);
    setActiveLesson(lesson);
    setStepIndex(0);
    setStepsCorrect(0);
  };

  const handleNext = () => {
    if (!activeLesson) return;
    if (stepIndex < activeLesson.steps.length - 1) {
      setStepIndex(s => s + 1);
    } else {
      // Lesson complete
      markLessonComplete(activeLesson.id);
      setActiveLesson(null);
      setActiveCategory(null);
    }
  };

  const handleCorrect = () => setStepsCorrect(s => s + 1);

  // Lesson in progress
  if (activeLesson) {
    const step = activeLesson.steps[stepIndex];
    const progress = ((stepIndex + 1) / activeLesson.steps.length) * 100;

    return (
      <div className={styles.page}>
        <div className={styles.lessonHeader}>
          <button className={styles.backBtn} onClick={() => setActiveLesson(null)}>Back</button>
          <div className={styles.lessonTitle}>{activeLesson.title}</div>
          <div className={styles.stepCounter}>{stepIndex + 1} / {activeLesson.steps.length}</div>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <LessonStep key={stepIndex} step={step} onCorrect={handleCorrect} onNext={handleNext} />
      </div>
    );
  }

  // Category view
  if (activeCategory) {
    const lessons = getLessonsByCategory(activeCategory);
    const cat = LESSON_CATEGORIES.find(c => c.id === activeCategory);
    const accent = cat?.color || '#5dade2';

    return (
      <div className={styles.page}>
        <div className={styles.catHeader}>
          <button className={styles.backBtn} onClick={() => setActiveCategory(null)}>← Lessons</button>
          <div>
            <div className={styles.catTitle}>{cat.label}</div>
            <div className={styles.catDesc}>{cat.desc}</div>
          </div>
        </div>
        <div className={styles.lessonList}>
          {lessons.length === 0 && (
            <div className={styles.emptyState}>Lessons coming soon for this category.</div>
          )}
          {lessons.map(lesson => (
            <button
              key={lesson.id}
              className={styles.lessonCard}
              style={{ '--accent': accent }}
              onClick={() => handleSelectLesson(lesson.id)}
            >
              <span className={styles.lessonIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4z"/>
                  <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4z"/>
                </svg>
              </span>
              <div className={styles.lessonInfo}>
                <div className={styles.lessonName}>{lesson.title}</div>
                <div className={styles.lessonDesc}>{lesson.description}</div>
                <div className={styles.lessonMeta}>
                  <span className={`${styles.diffBadge} ${styles[`diff_${lesson.difficulty}`]}`}>{lesson.difficulty}</span>
                  <span className={styles.stepCount}>{lesson.steps.length} steps</span>
                </div>
              </div>
              {completed.includes(lesson.id)
                ? <span className={styles.checkmark}>✓ Done</span>
                : <span className={styles.lessonArrow}>→</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Category grid
  return (
    <div className={styles.page}>
      <div className={styles.pageTitle}>Lessons</div>
      <div className={styles.pageDesc}>Interactive lessons to improve your chess, step by step.</div>
      <div className={styles.catGrid}>
        {LESSON_CATEGORIES.map(cat => {
          const lessons = getLessonsByCategory(cat.id);
          const done = lessons.filter(l => completed.includes(l.id)).length;
          const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
          return (
            <button
              key={cat.id}
              className={styles.catCard}
              style={{ '--accent': cat.color }}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className={styles.catIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4z"/>
                  <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4z"/>
                </svg>
              </span>
              <div className={styles.catCardTitle}>{cat.label}</div>
              <div className={styles.catCardDesc}>{cat.desc}</div>
              <div className={styles.catCardFoot}>
                {lessons.length > 0
                  ? <span className={styles.catProgress}>{done}/{lessons.length} done</span>
                  : <span className={styles.catProgress}>Coming soon</span>}
                {lessons.length > 0 && (
                  <span className={styles.catProgressBar}>
                    <span className={styles.catProgressFill} style={{ width: `${pct}%` }} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
