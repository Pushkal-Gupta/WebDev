import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import useThemeStore from '../../store/themeStore';
import { usePieceResolver } from '../../utils/pieceResolver';
import { playSound } from '../../utils/soundManager';
import { getBestMove } from '../../utils/stockfish';
import { getLocalBestMove } from '../../utils/localAI';
import { fetchTablebase, countPieces } from '../../utils/tablebaseService';
import styles from './EndgameTrainer.module.css';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['1','2','3','4','5','6','7','8'];

const ENDGAME_POSITIONS = [
  {
    id: 'kq-vs-k',
    name: 'King + Queen vs King',
    category: 'basic',
    difficulty: 'beginner',
    description: 'Checkmate with king and queen. Avoid stalemate!',
    positions: [
      { fen: '8/8/8/4k3/8/8/8/4K2Q w - - 0 1', goal: 'win', hint: 'Push the enemy king to the edge, then deliver checkmate.' },
      { fen: '7k/8/5K2/8/8/8/8/7Q w - - 0 1', goal: 'win', hint: 'Be careful not to stalemate. Leave an escape square before delivering mate.' },
      { fen: 'k7/8/1K6/8/8/8/Q7/8 w - - 0 1', goal: 'win', hint: 'The king is already on the edge. Find checkmate.' },
    ],
  },
  {
    id: 'kr-vs-k',
    name: 'King + Rook vs King',
    category: 'basic',
    difficulty: 'beginner',
    description: 'Checkmate with king and rook. Use the "box" technique.',
    positions: [
      { fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1', goal: 'win', hint: 'Use the rook to cut off the king, then push it to the edge with your king.' },
      { fen: '4k3/8/8/8/8/4K3/R7/8 w - - 0 1', goal: 'win', hint: 'Keep cutting off files with the rook while advancing your king.' },
    ],
  },
  {
    id: 'kp-vs-k',
    name: 'King + Pawn vs King',
    category: 'pawns',
    difficulty: 'intermediate',
    description: 'Learn opposition and the key square concept to promote your pawn.',
    positions: [
      { fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', goal: 'win', hint: 'You have the opposition. Advance when the enemy king moves aside.' },
      { fen: '8/4k3/8/4PK2/8/8/8/8 w - - 0 1', goal: 'win', hint: 'Take the opposition by moving your king in front of the pawn.' },
      { fen: '8/8/8/8/4k3/8/4P3/4K3 w - - 0 1', goal: 'win', hint: 'Advance your king first, not the pawn. King leads the way.' },
    ],
  },
  {
    id: 'lucena',
    name: 'Lucena Position',
    category: 'rook',
    difficulty: 'intermediate',
    description: 'The most important rook endgame position. Learn the "bridge" technique.',
    positions: [
      { fen: '3K4/3P1k2/8/8/8/8/8/1R6 w - - 0 1', goal: 'win', hint: 'Build a bridge: get your rook to the 4th rank to block checks.' },
    ],
  },
  {
    id: 'philidor',
    name: 'Philidor Position',
    category: 'rook',
    difficulty: 'intermediate',
    description: 'The key defensive rook endgame. Learn to hold the draw.',
    positions: [
      { fen: '4k3/8/8/4Pp2/8/8/8/4K2R w - - 0 1', goal: 'draw', hint: 'Keep your rook on the 3rd rank (Philidor setup) to prevent the king from advancing.' },
    ],
  },
  {
    id: 'two-bishops',
    name: 'Two Bishops Checkmate',
    category: 'basic',
    difficulty: 'advanced',
    description: 'Checkmate with two bishops. Drive the king to the corner.',
    positions: [
      { fen: '8/8/8/3k4/8/8/1BB5/4K3 w - - 0 1', goal: 'win', hint: 'Coordinate both bishops diagonally to restrict the king to a corner.' },
    ],
  },
];

const CATEGORIES = [
  { id: 'basic', label: 'Basic Mates', desc: 'KQ, KR, and two bishops vs king' },
  { id: 'pawns', label: 'Pawn Endings', desc: 'Opposition, key squares, promotion' },
  { id: 'rook', label: 'Rook Endings', desc: 'Lucena, Philidor, and practical positions' },
];

// ── Mini Board ───────────────────────────────────────────────────────────────

function MiniBoard({ fen, flipped, onSquareClick, highlight, lastMove }) {
  const { clr1, clr2, clr1p, clr2p } = useThemeStore();
  const resolvePiece = usePieceResolver();
  const chess = new Chess(fen);
  const board = chess.board();
  const rowOrder = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const colOrder = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  return (
    <div className={styles.board}>
      {rowOrder.map(rank =>
        colOrder.map(file => {
          const sq = FILES[file] + RANKS[rank];
          const piece = board[7 - rank]?.[file];
          const isLight = (file + rank) % 2 !== 0;
          const isHl = highlight === sq;
          const isLast = lastMove && (sq === lastMove.from || sq === lastMove.to);
          let bg = isLight ? clr1 : clr2;
          if (isLast) bg = isLight ? clr1p : clr2p;
          if (isHl) bg = 'rgba(0,255,245,0.35)';

          return (
            <div key={sq} className={styles.cell} style={{ backgroundColor: bg }} onClick={() => onSquareClick?.(sq)}>
              {piece && <img src={resolvePiece(piece.type, piece.color)} alt="" className={styles.pieceImg} />}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Play Mode ────────────────────────────────────────────────────────────────

function PlayMode({ position, endgame, onBack, onNext }) {
  const [chess] = useState(() => new Chess(position.fen));
  const [fen, setFen] = useState(position.fen);
  const [selectedSq, setSelectedSq] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [moveCount, setMoveCount] = useState(0);
  const [status, setStatus] = useState('playing'); // playing | won | drawn | lost
  const [tbResult, setTbResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const thinkingRef = useRef(false);

  // Check tablebase for initial evaluation
  useEffect(() => {
    if (countPieces(position.fen) <= 7) {
      fetchTablebase(position.fen).then(r => setTbResult(r)).catch(() => {});
    }
  }, [position.fen]);

  // Opponent plays engine move
  const playEngineMove = useCallback(async () => {
    if (thinkingRef.current || chess.isGameOver()) return;
    thinkingRef.current = true;

    await new Promise(r => setTimeout(r, 300)); // slight delay

    try {
      let uci;
      try { uci = await getBestMove(chess.fen(), { strength: 6 }); }
      catch { uci = getLocalBestMove(chess.fen(), 5); }

      if (uci && uci !== '(none)') {
        const result = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
        if (result) {
          playSound(result.captured ? 'capture' : 'move');
          setFen(chess.fen());
          setLastMove({ from: uci.slice(0, 2), to: uci.slice(2, 4) });
          checkGameEnd();
        }
      }
    } catch (e) {
      console.error('Engine move failed:', e);
    } finally {
      thinkingRef.current = false;
    }
  }, [chess]);

  const checkGameEnd = useCallback(() => {
    if (chess.isCheckmate()) {
      setStatus(chess.turn() === 'b' ? 'won' : 'lost');
    } else if (chess.isStalemate() || chess.isDraw()) {
      setStatus(position.goal === 'draw' ? 'won' : 'drawn');
    }
  }, [chess, position.goal]);

  const handleSquareClick = useCallback((sq) => {
    if (status !== 'playing' || chess.turn() !== 'w') return;

    if (!selectedSq) {
      const piece = chess.get(sq);
      if (piece && piece.color === 'w') setSelectedSq(sq);
      return;
    }

    const result = chess.move({ from: selectedSq, to: sq, promotion: 'q' });
    setSelectedSq(null);

    if (!result) {
      const piece = chess.get(sq);
      if (piece && piece.color === 'w') { setSelectedSq(sq); return; }
      return;
    }

    playSound(result.captured ? 'capture' : chess.inCheck() ? 'check' : 'move');
    setFen(chess.fen());
    setLastMove({ from: selectedSq, to: sq });
    setMoveCount(m => m + 1);
    setShowHint(false);

    checkGameEnd();
    if (!chess.isGameOver()) {
      setTimeout(() => playEngineMove(), 200);
    }
  }, [selectedSq, chess, status, playEngineMove, checkGameEnd]);

  const goalText = position.goal === 'win' ? 'White to play and win' : 'White to play and draw';

  return (
    <div className={styles.playPage}>
      <div className={styles.playHeader}>
        <button className={styles.backBtn} onClick={onBack}>Back</button>
        <div>
          <div className={styles.playTitle}>{endgame.name}</div>
          <div className={styles.playGoal}>{goalText}</div>
        </div>
      </div>

      <MiniBoard fen={fen} flipped={false} onSquareClick={handleSquareClick} highlight={selectedSq} lastMove={lastMove} />

      <div className={styles.moveCounter}>Moves: {moveCount}</div>

      {tbResult && (
        <div className={styles.tbInfo}>
          Tablebase: {tbResult.category === 'win' ? `Win in ${tbResult.dtm || '?'} moves` :
            tbResult.category === 'draw' ? 'Theoretical draw' :
            tbResult.category === 'loss' ? 'Lost position' : tbResult.category}
        </div>
      )}

      {status === 'playing' && !showHint && (
        <button className={styles.hintBtn} onClick={() => setShowHint(true)}>Hint</button>
      )}
      {showHint && <div className={styles.hintText}>{position.hint}</div>}

      {status === 'won' && (
        <div className={styles.result}>
          <div className={styles.resultTitle} style={{ color: '#3ddc84' }}>
            {position.goal === 'win' ? 'Checkmate!' : 'Draw achieved!'}
          </div>
          <div className={styles.resultSub}>Completed in {moveCount} moves.</div>
          <button className={styles.nextBtn} onClick={onNext}>Next Position</button>
        </div>
      )}
      {status === 'drawn' && position.goal === 'win' && (
        <div className={styles.result}>
          <div className={styles.resultTitle} style={{ color: '#f0c94c' }}>Draw -- you needed to win!</div>
          <button className={styles.retryBtn} onClick={onBack}>Try Again</button>
        </div>
      )}
      {status === 'lost' && (
        <div className={styles.result}>
          <div className={styles.resultTitle} style={{ color: '#ff7875' }}>You got checkmated!</div>
          <button className={styles.retryBtn} onClick={onBack}>Try Again</button>
        </div>
      )}
    </div>
  );
}

// ── Main Endgame Trainer ─────────────────────────────────────────────────────

export default function EndgameTrainer() {
  const [selectedEndgame, setSelectedEndgame] = useState(null);
  const [posIdx, setPosIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [best, setBest] = useState(() => {
    try { return JSON.parse(localStorage.getItem('endgame_best') || '{}'); } catch { return {}; }
  });

  const markBest = (id, moves) => {
    const updated = { ...best };
    if (!updated[id] || moves < updated[id]) updated[id] = moves;
    setBest(updated);
    localStorage.setItem('endgame_best', JSON.stringify(updated));
  };

  if (selectedEndgame) {
    const pos = selectedEndgame.positions[posIdx];
    if (!pos) {
      setSelectedEndgame(null);
      setPosIdx(0);
      return null;
    }

    return (
      <PlayMode
        key={`${selectedEndgame.id}-${posIdx}`}
        position={pos}
        endgame={selectedEndgame}
        onBack={() => { setSelectedEndgame(null); setPosIdx(0); }}
        onNext={() => {
          if (posIdx + 1 < selectedEndgame.positions.length) {
            setPosIdx(p => p + 1);
          } else {
            setSelectedEndgame(null);
            setPosIdx(0);
          }
        }}
      />
    );
  }

  if (activeCategory) {
    const catEndgames = ENDGAME_POSITIONS.filter(e => e.category === activeCategory);
    const cat = CATEGORIES.find(c => c.id === activeCategory);

    return (
      <div className={styles.page}>
        <div className={styles.catHeader}>
          <button className={styles.backBtn} onClick={() => setActiveCategory(null)}>Back</button>
          <div>
            <div className={styles.catTitle}>{cat.label}</div>
            <div className={styles.catDesc}>{cat.desc}</div>
          </div>
        </div>
        <div className={styles.endgameList}>
          {catEndgames.map(eg => (
            <button key={eg.id} className={styles.endgameCard} onClick={() => { setSelectedEndgame(eg); setPosIdx(0); }}>
              <div className={styles.endgameName}>{eg.name}</div>
              <div className={styles.endgameDesc}>{eg.description}</div>
              <div className={styles.endgameMeta}>
                <span className={`${styles.diffBadge} ${styles[`diff_${eg.difficulty}`]}`}>{eg.difficulty}</span>
                <span>{eg.positions.length} positions</span>
                {best[eg.id] && <span className={styles.bestTag}>Best: {best[eg.id]} moves</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageTitle}>Endgame Trainer</div>
      <div className={styles.pageDesc}>Master essential endgame techniques with structured practice positions.</div>
      <div className={styles.catGrid}>
        {CATEGORIES.map(cat => {
          const endgames = ENDGAME_POSITIONS.filter(e => e.category === cat.id);
          return (
            <button key={cat.id} className={styles.catCard} onClick={() => setActiveCategory(cat.id)}>
              <div className={styles.catCardTitle}>{cat.label}</div>
              <div className={styles.catCardDesc}>{cat.desc}</div>
              <div className={styles.catCardCount}>{endgames.length} endgames</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
