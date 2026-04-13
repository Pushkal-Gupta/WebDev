import { useState, useEffect, useCallback, useRef } from 'react';
import useThemeStore from '../../store/themeStore';
import styles from './Training.module.css';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const DIFFICULTIES = [
  { label: 'Easy', seconds: 15 },
  { label: 'Medium', seconds: 30 },
  { label: 'Hard', seconds: 60 },
];

function randomSquare() {
  return FILES[Math.floor(Math.random() * 8)] + RANKS[Math.floor(Math.random() * 8)];
}

function squareColor(sq) {
  const file = FILES.indexOf(sq[0]);
  const rank = parseInt(sq[1]) - 1;
  return (file + rank) % 2 === 0 ? 'dark' : 'light';
}

// ── Coordinate / Color Mode ─────────────────────────────────────────────────

function CoordMode({ mode }) {
  const { clr1, clr2 } = useThemeStore();
  const [target, setTarget]       = useState(randomSquare);
  const [score, setScore]         = useState(0);
  const [wrong, setWrong]         = useState(0);
  const [total, setTotal]         = useState(0);
  const [timeLeft, setTimeLeft]   = useState(30);
  const [active, setActive]       = useState(false);
  const [gameOver, setGameOver]   = useState(false);
  const [feedback, setFeedback]   = useState(null);
  const [flipped, setFlipped]     = useState(false);
  const [difficulty, setDifficulty] = useState(1); // index into DIFFICULTIES
  const [keyInput, setKeyInput]   = useState('');
  const [best, setBest]           = useState(() =>
    parseInt(localStorage.getItem(`coordBest_${mode}`) || '0', 10)
  );
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const duration = DIFFICULTIES[difficulty].seconds;
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

  const startGame = () => {
    setScore(0);
    setWrong(0);
    setTotal(0);
    setTimeLeft(duration);
    setActive(true);
    setGameOver(false);
    setFeedback(null);
    setKeyInput('');
    setTarget(randomSquare());
    setTimeout(() => inputRef.current?.focus(), 50);
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

  const checkAnswer = useCallback((answer) => {
    if (!active) return;
    setTotal(t => t + 1);
    if (mode === 'coord') {
      if (answer === target) {
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

  const handleCellClick = useCallback((sq) => {
    checkAnswer(sq);
  }, [checkAnswer]);

  const handleColorAnswer = useCallback((answer) => {
    if (!active) return;
    setTotal(t => t + 1);
    const correct = squareColor(target);
    if (answer === correct) {
      setScore(s => s + 1);
      setFeedback('correct');
      setTarget(randomSquare());
      setTimeout(() => setFeedback(null), 200);
    } else {
      setWrong(w => w + 1);
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
    }
  }, [active, target]);

  // Keyboard input for coordinate mode
  const handleKeyDown = useCallback((e) => {
    if (!active || mode !== 'coord') return;
    const key = e.key.toLowerCase();
    if (key === 'backspace') {
      setKeyInput('');
      return;
    }
    if (key === 'escape') {
      setKeyInput('');
      return;
    }
    if (keyInput.length === 0 && FILES.includes(key)) {
      setKeyInput(key);
    } else if (keyInput.length === 1 && RANKS.includes(key)) {
      const sq = keyInput + key;
      setKeyInput('');
      checkAnswer(sq);
    }
  }, [active, mode, keyInput, checkAnswer]);

  useEffect(() => {
    if (active && mode === 'coord') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [active, mode, handleKeyDown]);

  const rowOrder = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const colOrder = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  // Pre-game setup
  const showSetup = !active && !gameOver;

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
            <span className={styles.hudVal} style={{ color: total > 0 ? (accuracy >= 80 ? '#3ddc84' : accuracy >= 50 ? '#f0c94c' : '#ff7875') : undefined }}>{accuracy}%</span>
            <span className={styles.hudLbl}>Accuracy</span>
          </div>
          <div className={styles.hudItem}>
            <span className={styles.hudVal} style={{ color: '#ff7875' }}>{wrong}</span>
            <span className={styles.hudLbl}>Wrong</span>
          </div>
        </div>

        {/* Target prompt */}
        {active && mode === 'coord' && (
          <div className={styles.targetPrompt}>
            Click or type: <strong>{target}</strong>
            {keyInput && <span className={styles.keyInput}>{keyInput}_</span>}
          </div>
        )}
        {active && mode === 'color' && (
          <div className={styles.targetPrompt}>
            What color is <strong>{target}</strong>?
          </div>
        )}

        {/* Board */}
        {mode === 'coord' && (active || gameOver) && (
          <div className={styles.miniBoard}>
            {rowOrder.map(rank =>
              colOrder.map(file => {
                const sq = FILES[file] + RANKS[rank];
                const isLight = (file + rank) % 2 !== 0;
                return (
                  <div
                    key={sq}
                    className={styles.miniCell}
                    style={{ backgroundColor: isLight ? clr1 : clr2 }}
                    onClick={() => handleCellClick(sq)}
                  >
                    {(flipped ? file === 7 : file === 0) && <span className={styles.miniRank}>{RANKS[rank]}</span>}
                    {(flipped ? rank === 7 : rank === 0) && <span className={styles.miniFile}>{FILES[file]}</span>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Color mode buttons */}
        {mode === 'color' && active && (
          <div className={styles.colorBtns}>
            <button className={styles.colorBtnLight} onClick={() => handleColorAnswer('light')}>Light</button>
            <button className={styles.colorBtnDark} onClick={() => handleColorAnswer('dark')}>Dark</button>
          </div>
        )}

        {/* Feedback */}
        {feedback === 'correct' && <div className={styles.trainerFlash + ' ' + styles.trainerFlashOk}>+1</div>}
        {feedback === 'wrong' && <div className={styles.trainerFlash + ' ' + styles.trainerFlashBad}>X</div>}

        {/* Pre-game setup */}
        {showSetup && (
          <div className={styles.setupPanel}>
            <div className={styles.setupTitle}>{mode === 'coord' ? 'Coordinates' : 'Square Colors'}</div>
            <div className={styles.setupDesc}>
              {mode === 'coord'
                ? 'Click or type the named square as fast as you can.'
                : 'Identify whether the named square is light or dark.'}
            </div>

            <div className={styles.difficultyRow}>
              {DIFFICULTIES.map((d, i) => (
                <button
                  key={d.label}
                  className={`${styles.diffBtn} ${difficulty === i ? styles.diffBtnActive : ''}`}
                  onClick={() => setDifficulty(i)}
                >
                  {d.label} ({d.seconds}s)
                </button>
              ))}
            </div>

            {mode === 'coord' && (
              <label className={styles.flipToggle}>
                <input type="checkbox" checked={flipped} onChange={e => setFlipped(e.target.checked)} />
                Play as Black (flipped board)
              </label>
            )}

            <div className={styles.bestDisplay}>Best: {best}</div>
            <button className={styles.startBtn} onClick={startGame}>Start</button>
          </div>
        )}

        {/* Game over summary */}
        {gameOver && (
          <div className={styles.gameOverPanel}>
            <div className={styles.goTitle}>Time's Up!</div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal}>{score}</span>
                <span className={styles.summaryLbl}>Score</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal}>{accuracy}%</span>
                <span className={styles.summaryLbl}>Accuracy</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal}>{wrong}</span>
                <span className={styles.summaryLbl}>Wrong</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal}>{best}</span>
                <span className={styles.summaryLbl}>Best</span>
              </div>
            </div>
            {score >= best && score > 0 && <div className={styles.goNewBest}>New Best!</div>}
            <button className={styles.startBtn} onClick={startGame}>Play Again</button>
          </div>
        )}
      </div>
      <input ref={inputRef} className={styles.hiddenInput} tabIndex={-1} readOnly />
    </div>
  );
}

// ── Knight Vision ────────────────────────────────────────────────────────────

function KnightVision() {
  const { clr1, clr2 } = useThemeStore();
  const [knightSq, setKnightSq]     = useState(null);
  const [selected, setSelected]       = useState(new Set());
  const [score, setScore]             = useState(0);
  const [round, setRound]             = useState(0);
  const [total, setTotal]             = useState(10);
  const [feedback, setFeedback]       = useState(null);
  const [gameActive, setGameActive]   = useState(false);
  const [flipped, setFlipped]         = useState(false);
  const [timeLeft, setTimeLeft]       = useState(60);
  const [difficulty, setDifficulty]   = useState(1);
  const [best, setBest]               = useState(() =>
    parseInt(localStorage.getItem('coordBest_knight') || '0', 10)
  );
  const timerRef = useRef(null);

  const durations = [30, 60, 90];
  const rounds = [5, 10, 15];

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
    setKnightSq(randomSquare());
    setSelected(new Set());
    setFeedback(null);
  };

  const startGame = () => {
    const t = rounds[difficulty];
    setScore(0);
    setRound(0);
    setTotal(t);
    setTimeLeft(durations[difficulty]);
    setGameActive(true);
    setKnightSq(randomSquare());
    setSelected(new Set());
    setFeedback(null);
  };

  // Timer
  useEffect(() => {
    if (!gameActive) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGameActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameActive]);

  // Save best
  useEffect(() => {
    if (!gameActive && round > 0 && score > best) {
      setBest(score);
      localStorage.setItem('coordBest_knight', String(score));
    }
  }, [gameActive, round, score, best]);

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
    const nextRound = round + 1;
    setRound(nextRound);
    setTimeout(() => {
      if (nextRound < total && timeLeft > 0) {
        startRound();
      } else {
        setGameActive(false);
        clearInterval(timerRef.current);
      }
    }, 600);
  };

  const rowOrder = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const colOrder = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  const showSetup = !gameActive && round === 0;
  const showResult = !gameActive && round > 0;
  const accuracy = round > 0 ? Math.round((score / round) * 100) : 0;

  return (
    <div className={styles.trainerPage}>
      <div className={styles.boardArea}>
        <div className={styles.hud}>
          <div className={styles.hudItem}>
            <span className={styles.hudVal}>{score}/{round}</span>
            <span className={styles.hudLbl}>Score</span>
          </div>
          <div className={styles.hudItem}>
            <span className={`${styles.hudVal} ${timeLeft <= 5 ? styles.hudLow : ''}`}>{timeLeft}s</span>
            <span className={styles.hudLbl}>Time</span>
          </div>
          <div className={styles.hudItem}>
            <span className={styles.hudVal}>{total - round}</span>
            <span className={styles.hudLbl}>Left</span>
          </div>
        </div>

        {knightSq && gameActive && (
          <div className={styles.targetPrompt}>
            Select all squares the knight on <strong>{knightSq}</strong> can reach
          </div>
        )}

        {(gameActive || showResult) && (
          <div className={styles.miniBoard}>
            {rowOrder.map(rank =>
              colOrder.map(file => {
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
                    {(flipped ? file === 7 : file === 0) && <span className={styles.miniRank}>{RANKS[rank]}</span>}
                    {(flipped ? rank === 7 : rank === 0) && <span className={styles.miniFile}>{FILES[file]}</span>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {feedback === 'correct' && <div className={styles.trainerFlash + ' ' + styles.trainerFlashOk}>Correct!</div>}
        {feedback === 'wrong' && <div className={styles.trainerFlash + ' ' + styles.trainerFlashBad}>Wrong</div>}

        {gameActive && knightSq && (
          <button className={styles.submitBtn} onClick={handleSubmit}>
            Submit ({selected.size} selected)
          </button>
        )}

        {/* Pre-game setup */}
        {showSetup && (
          <div className={styles.setupPanel}>
            <div className={styles.setupTitle}>Knight Vision</div>
            <div className={styles.setupDesc}>
              Select all squares a knight can reach from the highlighted position.
            </div>

            <div className={styles.difficultyRow}>
              {['Easy', 'Medium', 'Hard'].map((label, i) => (
                <button
                  key={label}
                  className={`${styles.diffBtn} ${difficulty === i ? styles.diffBtnActive : ''}`}
                  onClick={() => setDifficulty(i)}
                >
                  {label} ({rounds[i]} rounds, {durations[i]}s)
                </button>
              ))}
            </div>

            <label className={styles.flipToggle}>
              <input type="checkbox" checked={flipped} onChange={e => setFlipped(e.target.checked)} />
              Play as Black (flipped board)
            </label>

            <div className={styles.bestDisplay}>Best: {best}/{rounds[difficulty]}</div>
            <button className={styles.startBtn} onClick={startGame}>Start</button>
          </div>
        )}

        {showResult && (
          <div className={styles.gameOverPanel}>
            <div className={styles.goTitle}>{timeLeft <= 0 ? "Time's Up!" : 'Complete!'}</div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal}>{score}/{round}</span>
                <span className={styles.summaryLbl}>Score</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal}>{accuracy}%</span>
                <span className={styles.summaryLbl}>Accuracy</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal}>{best}</span>
                <span className={styles.summaryLbl}>Best</span>
              </div>
            </div>
            {score >= best && score > 0 && <div className={styles.goNewBest}>New Best!</div>}
            <button className={styles.startBtn} onClick={startGame}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Training Page ───────────────────────────────────────────────────────

export default function TrainingPage() {
  const [mode, setMode] = useState('coord');

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
