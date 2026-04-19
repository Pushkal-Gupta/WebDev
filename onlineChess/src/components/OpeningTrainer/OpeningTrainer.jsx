import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import useThemeStore, { useBoardColors, cellStyle, boardContainerStyle } from '../../store/themeStore';
import { usePieceResolver } from '../../utils/pieceResolver';
import { playSound } from '../../utils/soundManager';
import {
  BUILT_IN_REPERTOIRES, loadSrsData, saveSrsData,
  getDueLines, recordReview,
} from '../../data/openingLines';
import styles from './OpeningTrainer.module.css';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['1','2','3','4','5','6','7','8'];

// ── Mini Board ───────────────────────────────────────────────────────────────

function MiniBoard({ fen, flipped, onSquareClick, highlight }) {
  const { clr1, clr2, isImageTheme, boardImageUrl } = useBoardColors();
  const resolvePiece = usePieceResolver();
  const chess = new Chess(fen);
  const board = chess.board();
  const rowOrder = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const colOrder = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  return (
    <div className={styles.board} style={boardContainerStyle(isImageTheme, boardImageUrl)}>
      {rowOrder.map(rank =>
        colOrder.map(file => {
          const sq = FILES[file] + RANKS[rank];
          const piece = board[7 - rank]?.[file];
          const isLight = (file + rank) % 2 !== 0;
          const isHl = highlight === sq;
          const bg = isHl ? 'rgba(0,255,245,0.35)' : (isLight ? clr1 : clr2);
          return (
            <div
              key={sq}
              className={styles.cell}
              style={cellStyle(isLight, bg, isImageTheme, boardImageUrl, isHl)}
              onClick={() => onSquareClick?.(sq)}
            >
              {piece && <img src={resolvePiece(piece.type, piece.color)} alt="" className={styles.pieceImg} />}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Drill Mode ───────────────────────────────────────────────────────────────

function DrillMode({ lines, color, onBack }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [moveIdx, setMoveIdx] = useState(0);
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [feedback, setFeedback] = useState(null);
  const [selectedSq, setSelectedSq] = useState(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [showHint, setShowHint] = useState(false);
  const [lineComplete, setLineComplete] = useState(false);
  const [srsData, setSrsData] = useState(loadSrsData);
  const flipped = color === 'black';

  const line = lines[currentIdx];
  if (!line) return <div className={styles.empty}>No lines to drill.</div>;

  const isPlayerTurn = () => {
    const turn = chess.turn();
    return (color === 'white' && turn === 'w') || (color === 'black' && turn === 'b');
  };

  // Play opponent's moves automatically
  useEffect(() => {
    if (lineComplete || !line) return;
    if (moveIdx >= line.moves.length) {
      setLineComplete(true);
      const updated = recordReview(srsData, line, score.wrong === 0);
      setSrsData(updated);
      saveSrsData(updated);
      return;
    }
    if (!isPlayerTurn()) {
      // Opponent's move -- play automatically after a short delay
      const timer = setTimeout(() => {
        const move = line.moves[moveIdx];
        const result = chess.move(move);
        if (result) {
          playSound('move');
          setFen(chess.fen());
          setMoveIdx(m => m + 1);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [moveIdx, lineComplete, chess, line]);

  const handleSquareClick = useCallback((sq) => {
    if (lineComplete || !isPlayerTurn() || moveIdx >= line.moves.length) return;

    if (!selectedSq) {
      const piece = chess.get(sq);
      if (piece && piece.color === chess.turn()) {
        setSelectedSq(sq);
      }
      return;
    }

    // Try the move
    const result = chess.move({ from: selectedSq, to: sq, promotion: 'q' });
    setSelectedSq(null);

    if (!result) {
      // Maybe clicking a different own piece
      const piece = chess.get(sq);
      if (piece && piece.color === chess.turn()) {
        setSelectedSq(sq);
        return;
      }
      return;
    }

    const expectedSan = line.moves[moveIdx];
    if (result.san === expectedSan) {
      setFeedback('correct');
      playSound(result.captured ? 'capture' : 'move');
      setScore(s => ({ ...s, correct: s.correct + 1 }));
      setFen(chess.fen());
      setMoveIdx(m => m + 1);
      setShowHint(false);
    } else {
      // Wrong move -- undo it
      chess.undo();
      setFeedback('wrong');
      setScore(s => ({ ...s, wrong: s.wrong + 1 }));
      playSound('illegal');
    }
    setTimeout(() => setFeedback(null), 400);
  }, [selectedSq, chess, line, moveIdx, lineComplete]);

  const handleNextLine = () => {
    chess.reset();
    setFen(chess.fen());
    setMoveIdx(0);
    setFeedback(null);
    setSelectedSq(null);
    setLineComplete(false);
    setShowHint(false);
    if (currentIdx + 1 < lines.length) {
      setCurrentIdx(i => i + 1);
    } else {
      setCurrentIdx(0); // loop back
    }
  };

  const movesPlayed = line.moves.slice(0, moveIdx);
  const progress = line.moves.length > 0 ? (moveIdx / line.moves.length) * 100 : 0;

  return (
    <div className={styles.drillPage}>
      <div className={styles.drillHeader}>
        <button className={styles.backBtn} onClick={onBack}>Back</button>
        <div className={styles.drillTitle}>{line.name}</div>
        <div className={styles.drillScore}>{score.correct} / {score.correct + score.wrong}</div>
      </div>
      <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>

      <MiniBoard fen={fen} flipped={flipped} onSquareClick={handleSquareClick} highlight={selectedSq} />

      {/* Move list */}
      <div className={styles.moveList}>
        {movesPlayed.map((m, i) => (
          <span key={i} className={styles.moveSan}>
            {i % 2 === 0 && <span className={styles.moveNum}>{Math.floor(i / 2) + 1}.</span>}
            {m}
          </span>
        ))}
      </div>

      {feedback === 'correct' && <div className={styles.feedbackOk}>Correct!</div>}
      {feedback === 'wrong' && <div className={styles.feedbackBad}>Wrong move. Try again.</div>}

      {isPlayerTurn() && !lineComplete && !showHint && line.hint && (
        <button className={styles.hintBtn} onClick={() => setShowHint(true)}>Hint</button>
      )}
      {showHint && <div className={styles.hintText}>{line.hint}</div>}

      {lineComplete && (
        <div className={styles.lineComplete}>
          <div className={styles.lineCompleteTitle}>Line Complete!</div>
          <div className={styles.lineCompleteScore}>
            {score.wrong === 0 ? 'Perfect -- no mistakes!' : `${score.wrong} mistake(s) this line.`}
          </div>
          <button className={styles.nextBtn} onClick={handleNextLine}>
            {currentIdx + 1 < lines.length ? 'Next Line' : 'Restart'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Opening Trainer ─────────────────────────────────────────────────────

export default function OpeningTrainer() {
  const [color, setColor] = useState('white');
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [drilling, setDrilling] = useState(false);
  const [drillLines, setDrillLines] = useState([]);
  const [srsData] = useState(loadSrsData);

  const repertoire = BUILT_IN_REPERTOIRES[color] || [];

  const handleDrillAll = (opening) => {
    setDrillLines(opening.lines);
    setSelectedOpening(opening);
    setDrilling(true);
  };

  const handleDrillDue = () => {
    const allLines = repertoire.flatMap(o => o.lines);
    const due = getDueLines(srsData, allLines);
    if (due.length === 0) {
      setDrillLines(allLines.slice(0, 3)); // if nothing due, drill first 3
    } else {
      setDrillLines(due);
    }
    setDrilling(true);
  };

  if (drilling) {
    return (
      <DrillMode
        lines={drillLines}
        color={color}
        onBack={() => { setDrilling(false); setSelectedOpening(null); }}
      />
    );
  }

  const allLines = repertoire.flatMap(o => o.lines);
  const dueCount = getDueLines(srsData, allLines).length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Opening Trainer</div>
        <div className={styles.pageDesc}>Learn and drill your opening repertoire with spaced repetition.</div>
      </div>

      {/* Color selector */}
      <div className={styles.colorRow}>
        <button
          className={`${styles.colorBtn} ${color === 'white' ? styles.colorBtnActive : ''}`}
          onClick={() => setColor('white')}
        >
          <span className={styles.colorDot} style={{ background: '#fff' }} /> White
        </button>
        <button
          className={`${styles.colorBtn} ${color === 'black' ? styles.colorBtnActive : ''}`}
          onClick={() => setColor('black')}
        >
          <span className={styles.colorDot} style={{ background: '#333', border: '1px solid rgba(255,255,255,0.3)' }} /> Black
        </button>

        <button className={styles.drillDueBtn} onClick={handleDrillDue}>
          Drill Due Lines {dueCount > 0 && <span className={styles.dueBadge}>{dueCount}</span>}
        </button>
      </div>

      {/* Opening cards */}
      <div className={styles.openingGrid}>
        {repertoire.map(opening => {
          const linesDue = getDueLines(srsData, opening.lines).length;
          const accent = opening.color || '#5dade2';
          return (
            <div
              key={opening.id}
              className={styles.openingCard}
              style={{ '--accent': accent }}
            >
              <div className={styles.openingHead}>
                <span className={styles.openingIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4z"/>
                    <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4z"/>
                  </svg>
                </span>
                <span className={styles.openingEco}>{opening.eco}</span>
                {linesDue > 0 && <span className={styles.dueTag}>{linesDue} due</span>}
              </div>
              <div className={styles.openingName}>{opening.name}</div>
              <div className={styles.openingDesc}>{opening.description}</div>
              <div className={styles.openingIdeas}>
                {opening.keyIdeas.map((idea, i) => (
                  <div key={i} className={styles.ideaChip}>{idea}</div>
                ))}
              </div>
              <div className={styles.openingFoot}>
                <span className={styles.openingMeta}>{opening.lines.length} lines</span>
                <button className={styles.drillBtn} onClick={() => handleDrillAll(opening)}>
                  Drill All →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
