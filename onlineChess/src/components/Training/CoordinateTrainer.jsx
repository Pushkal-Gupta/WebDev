import { useState, useEffect, useCallback, useRef } from 'react';
import useThemeStore from '../../store/themeStore';
import styles from './Training.module.css';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

function randomSquare() {
  return FILES[Math.floor(Math.random() * 8)] + RANKS[Math.floor(Math.random() * 8)];
}

function squareColor(sq) {
  const file = FILES.indexOf(sq[0]);
  const rank = parseInt(sq[1]) - 1;
  return (file + rank) % 2 === 0 ? 'dark' : 'light';
}

// ── Coordinate Trainer ──────────────────────────────────────────────────────

function CoordMode({ mode }) {
  const { clr1, clr2 } = useThemeStore();
  const [target, setTarget]       = useState(randomSquare);
  const [score, setScore]         = useState(0);
  const [wrong, setWrong]         = useState(0);
  const [timeLeft, setTimeLeft]   = useState(30);
  const [active, setActive]       = useState(false);
  const [gameOver, setGameOver]   = useState(false);
  const [feedback, setFeedback]   = useState(null);
  const [best, setBest]           = useState(() =>
    parseInt(localStorage.getItem(`coordBest_${mode}`) || '0', 10)
  );
  const timerRef = useRef(null);

  const startGame = () => {
    setScore(0);
    setWrong(0);
    setTimeLeft(30);
    setActive(true);
    setGameOver(false);
    setFeedback(null);
    setTarget(randomSquare());
  };

  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setActive(false);
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active]);

  useEffect(() => {
    if (gameOver && score > best) {
      setBest(score);
      localStorage.setItem(`coordBest_${mode}`, String(score));
    }
  }, [gameOver, score, best, mode]);

  const handleCellClick = useCallback((sq) => {
    if (!active) return;
    if (mode === 'coord') {
      if (sq === target) {
        setScore(s => s + 1);
        setFeedback('correct');
        setTarget(randomSquare());
      } else {
        setWrong(w => w + 1);
        setFeedback('wrong');
      }
      setTimeout(() => setFeedback(null), 200);
    }
  }, [active, target, mode]);

  const handleColorAnswer = useCallback((answer) => {
    if (!active) return;
    const correct = squareColor(target);
    if (answer === correct) {
      setScore(s => s + 1);
      setFeedback('correct');
      setTarget(randomSquare());
      setTimeout(() => setFeedback(null), 200);
    } else {
      setWrong(w => w + 1);
      setFeedback('wrong');
      // Don't advance — same square, let user see the mistake
      setTimeout(() => setFeedback(null), 500);
    }
  }, [active, target]);

  const rows = [7,6,5,4,3,2,1,0];
  const cols = [0,1,2,3,4,5,6,7];

  return (
    <div className={styles.trainerPage}>
      <div className={styles.boardArea}>
        {/* HUD */}
        <div className={styles.hud}>
          <div className={styles.hudItem}>
            <span className={styles.hudVal}>{score}</span>
            <span className={styles.hudLbl}>Score</span>
          </div>
          <div className={styles.hudItem}>
            <span className={`${styles.hudVal} ${timeLeft <= 5 ? styles.hudLow : ''}`}>{timeLeft}s</span>
            <span className={styles.hudLbl}>Time</span>
          </div>
          <div className={styles.hudItem}>
            <span className={styles.hudVal} style={{ color: '#ff7875' }}>{wrong}</span>
            <span className={styles.hudLbl}>Wrong</span>
          </div>
        </div>

        {/* Target prompt */}
        {active && mode === 'coord' && (
          <div className={styles.targetPrompt}>
            Click: <strong>{target}</strong>
          </div>
        )}
        {active && mode === 'color' && (
          <div className={styles.targetPrompt}>
            What color is <strong>{target}</strong>?
          </div>
        )}

        {/* Board */}
        {mode === 'coord' && (
          <div className={styles.miniBoard}>
            {rows.map(rank =>
              cols.map(file => {
                const sq = FILES[file] + RANKS[rank];
                const isLight = (file + rank) % 2 !== 0;
                const isTarget = active && sq === target;
                return (
                  <div
                    key={sq}
                    className={`${styles.miniCell} ${isTarget ? styles.miniCellTarget : ''}`}
                    style={{ backgroundColor: isLight ? clr1 : clr2 }}
                    onClick={() => handleCellClick(sq)}
                  >
                    {file === 0 && <span className={styles.miniRank}>{RANKS[rank]}</span>}
                    {rank === 0 && <span className={styles.miniFile}>{FILES[file]}</span>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Color mode buttons */}
        {mode === 'color' && active && (
          <div className={styles.colorBtns}>
            <button className={styles.colorBtnLight} onClick={() => handleColorAnswer('light')}>
              Light
            </button>
            <button className={styles.colorBtnDark} onClick={() => handleColorAnswer('dark')}>
              Dark
            </button>
          </div>
        )}

        {/* Feedback */}
        {feedback === 'correct' && <div className={styles.trainerFlash + ' ' + styles.trainerFlashOk}>+1</div>}
        {feedback === 'wrong' && <div className={styles.trainerFlash + ' ' + styles.trainerFlashBad}>X</div>}

        {/* Start / Game Over */}
        {!active && !gameOver && (
          <button className={styles.startBtn} onClick={startGame}>
            Start (30s)
          </button>
        )}

        {gameOver && (
          <div className={styles.gameOverPanel}>
            <div className={styles.goTitle}>Time's Up!</div>
            <div className={styles.goScore}>Score: {score}</div>
            {score >= best && score > 0 && <div className={styles.goNewBest}>New Best!</div>}
            <div className={styles.goBest}>Best: {best}</div>
            <button className={styles.startBtn} onClick={startGame}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Knight Vision ────────────────────────────────────────────────────────────

function KnightVision() {
  const { clr1, clr2 } = useThemeStore();
  const [knightSq, setKnightSq]   = useState(null);
  const [selected, setSelected]     = useState(new Set());
  const [score, setScore]           = useState(0);
  const [round, setRound]           = useState(0);
  const [feedback, setFeedback]     = useState(null);
  const [gameActive, setGameActive] = useState(false);

  const getKnightMoves = (sq) => {
    const f = FILES.indexOf(sq[0]);
    const r = parseInt(sq[1]) - 1;
    const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    return offsets
      .map(([df, dr]) => [f + df, r + dr])
      .filter(([nf, nr]) => nf >= 0 && nf < 8 && nr >= 0 && nr < 8)
      .map(([nf, nr]) => FILES[nf] + RANKS[nr]);
  };

  const startRound = () => {
    const sq = randomSquare();
    setKnightSq(sq);
    setSelected(new Set());
    setFeedback(null);
  };

  const startGame = () => {
    setScore(0);
    setRound(0);
    setGameActive(true);
    const sq = randomSquare();
    setKnightSq(sq);
    setSelected(new Set());
    setFeedback(null);
  };

  const handleCellClick = (sq) => {
    if (!gameActive || !knightSq || sq === knightSq) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(sq)) next.delete(sq); else next.add(sq);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!knightSq) return;
    const correct = new Set(getKnightMoves(knightSq));
    const isCorrect = correct.size === selected.size && [...correct].every(s => selected.has(s));
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    setRound(r => r + 1);
    setTimeout(() => {
      if (round + 1 < 10) {
        startRound();
      } else {
        setGameActive(false);
      }
    }, 600);
  };

  const rows = [7,6,5,4,3,2,1,0];
  const cols = [0,1,2,3,4,5,6,7];

  return (
    <div className={styles.trainerPage}>
      <div className={styles.boardArea}>
        <div className={styles.hud}>
          <div className={styles.hudItem}>
            <span className={styles.hudVal}>{score}/{round}</span>
            <span className={styles.hudLbl}>Score</span>
          </div>
          <div className={styles.hudItem}>
            <span className={styles.hudVal}>{10 - round}</span>
            <span className={styles.hudLbl}>Left</span>
          </div>
        </div>

        {knightSq && gameActive && (
          <div className={styles.targetPrompt}>
            Select all squares the knight on <strong>{knightSq}</strong> can reach
          </div>
        )}

        <div className={styles.miniBoard}>
          {rows.map(rank =>
            cols.map(file => {
              const sq = FILES[file] + RANKS[rank];
              const isLight = (file + rank) % 2 !== 0;
              const isKnight = sq === knightSq;
              const isSel = selected.has(sq);
              let bg = isLight ? clr1 : clr2;
              if (isSel) bg = 'rgba(0,255,245,0.3)';
              if (isKnight) bg = 'rgba(255,200,0,0.4)';

              return (
                <div
                  key={sq}
                  className={styles.miniCell}
                  style={{ backgroundColor: bg }}
                  onClick={() => handleCellClick(sq)}
                >
                  {isKnight && (
                    <svg className={styles.knightIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 20h8M9 20v-3c0-1 .5-2 2-3l-2-1c-1-.5-1.5-1.5-1-3l1-2c.5-1 1.5-1.5 2.5-1h1c1 0 2 .5 2.5 1.5l.5 1.5c.3 1-.2 2-1 2.5l-1 .5"/>
                      <circle cx="13" cy="7" r="1" fill="currentColor"/>
                    </svg>
                  )}
                  {file === 0 && <span className={styles.miniRank}>{RANKS[rank]}</span>}
                  {rank === 0 && <span className={styles.miniFile}>{FILES[file]}</span>}
                </div>
              );
            })
          )}
        </div>

        {feedback === 'correct' && <div className={styles.trainerFlash + ' ' + styles.trainerFlashOk}>Correct!</div>}
        {feedback === 'wrong' && <div className={styles.trainerFlash + ' ' + styles.trainerFlashBad}>Wrong</div>}

        {gameActive && knightSq && (
          <button className={styles.submitBtn} onClick={handleSubmit}>
            Submit ({selected.size} selected)
          </button>
        )}

        {!gameActive && round === 0 && (
          <button className={styles.startBtn} onClick={startGame}>Start (10 rounds)</button>
        )}

        {!gameActive && round >= 10 && (
          <div className={styles.gameOverPanel}>
            <div className={styles.goTitle}>Complete!</div>
            <div className={styles.goScore}>{score} / 10 correct</div>
            <button className={styles.startBtn} onClick={startGame}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Training Page ───────────────────────────────────────────────────────

export default function TrainingPage() {
  const [mode, setMode] = useState('coord'); // coord | color | knight

  return (
    <div className={styles.page}>
      <div className={styles.modeBar}>
        <button className={`${styles.modeBtn} ${mode === 'coord' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('coord')}>Coordinates</button>
        <button className={`${styles.modeBtn} ${mode === 'color' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('color')}>Square Colors</button>
        <button className={`${styles.modeBtn} ${mode === 'knight' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('knight')}>Knight Vision</button>
      </div>

      {mode === 'coord' && <CoordMode mode="coord" />}
      {mode === 'color' && <CoordMode mode="color" />}
      {mode === 'knight' && <KnightVision />}
    </div>
  );
}
