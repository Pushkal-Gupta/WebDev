import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { p2p } from '../../utils/p2pService';
import useThemeStore from '../../store/themeStore';
import { formatTime } from '../../utils/timeFormatter';
import { PIECE_NAME, FILE_LABELS, squareName, rankToRow, fileToCol, parseFen } from '../../utils/boardHelpers';
import styles from './P2PGame.module.css';

const INIT_TIME = 300; // 5 min each side by default

// ── Inline board ──────────────────────────────────────────────────────────────

function P2PBoard({ fen, myColor, interactive, onMove, lastFrom, lastTo }) {
  const { clr1, clr2, clr1p, clr2p, clr1x, clr2x, pieceSetIndex, pieceSets } = useThemeStore();
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [chess] = useState(() => new Chess());

  const imagePath = `./images/${pieceSets[pieceSetIndex].path}`;
  const flipped   = myColor === 'b';
  const rows      = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const cols      = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  useEffect(() => { setSelected(null); setValidMoves([]); }, [fen]);

  const handleClick = useCallback((row, col) => {
    if (!interactive) return;
    chess.load(fen);
    const sq    = squareName(row, col);
    const piece = chess.get(sq);

    const target = validMoves.find(m => m.row === row && m.col === col);
    if (target && selected) {
      onMove(target.uci);
      setSelected(null);
      setValidMoves([]);
      return;
    }

    if (piece && piece.color === myColor) {
      const moves = chess.moves({ square: sq, verbose: true });
      setSelected({ row, col });
      setValidMoves(moves.map(m => ({
        row: rankToRow(m.to[1]),
        col: fileToCol(m.to[0]),
        uci: m.from + m.to + (m.promotion || ''),
      })));
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  }, [fen, selected, validMoves, interactive, myColor, onMove, chess]);

  const boardData = parseFen(fen);

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board}>
        {rows.map((row, dr) =>
          cols.map((col, dc) => {
            const piece     = boardData[row]?.[col];
            const isLight   = (row + col) % 2 === 0;
            const isSel     = selected?.row === row && selected?.col === col;
            const isTarget  = validMoves.some(m => m.row === row && m.col === col);
            const isLastF   = lastFrom && lastFrom[0] === row && lastFrom[1] === col;
            const isLastT   = lastTo   && lastTo[0]   === row && lastTo[1]   === col;

            let bg = isLight ? clr1 : clr2;
            if (isSel)              bg = isLight ? clr1x : clr2x;
            else if (isLastF || isLastT) bg = isLight ? clr1p : clr2p;

            return (
              <div
                key={`${row}-${col}`}
                className={styles.cell}
                style={{ backgroundColor: bg }}
                onClick={() => handleClick(row, col)}
              >
                {dc === 0 && (
                  <span className={styles.rankLabel} style={{ color: isLight ? clr2 : clr1 }}>
                    {flipped ? row + 1 : 8 - row}
                  </span>
                )}
                {dr === 7 && (
                  <span className={styles.fileLabel} style={{ color: isLight ? clr2 : clr1 }}>
                    {FILE_LABELS[flipped ? 7 - col : col]}
                  </span>
                )}
                {piece && (
                  <img
                    src={`${imagePath}${PIECE_NAME[piece.type]}-${piece.color === 'w' ? 'white' : 'black'}.png`}
                    className={styles.piece}
                    alt={piece.color + piece.type}
                  />
                )}
                {isTarget && (
                  <svg className={styles.dot} viewBox="0 0 80 80">
                    {piece
                      ? <circle cx="40" cy="40" r="36" fill="rgba(255,80,80,0.3)" />
                      : <circle cx="40" cy="40" r="18" fill="rgba(80,80,80,0.4)" />
                    }
                  </svg>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Player bar ─────────────────────────────────────────────────────────────────

function PlayerBar({ name, color, time, active }) {
  const isLow = active && time <= 30;
  return (
    <div className={`${styles.playerBar} ${active ? styles.playerBarActive : ''}`}>
      <div className={styles.playerLeft}>
        <span className={`${styles.pDot} ${color === 'w' ? styles.pDotW : styles.pDotB}`} />
        <span className={styles.pName}>{name}</span>
      </div>
      <div className={`${styles.pClock} ${active ? styles.pClockActive : ''} ${isLow ? styles.pClockLow : ''}`}>
        {formatTime(time)}
      </div>
    </div>
  );
}

// ── Main game ─────────────────────────────────────────────────────────────────

export default function P2PGame({ myColor, onExit }) {
  const [chess]        = useState(() => new Chess());
  const [fen,          setFen]          = useState(chess.fen());
  const [status,       setStatus]       = useState('playing'); // 'playing'|'over'
  const [result,       setResult]       = useState('');
  const [lastFrom,     setLastFrom]     = useState(null);
  const [lastTo,       setLastTo]       = useState(null);
  const [wTime,        setWTime]        = useState(INIT_TIME);
  const [bTime,        setBTime]        = useState(INIT_TIME);
  const [peerName]     = useState(myColor === 'w' ? 'Black (peer)' : 'White (peer)');
  const [myName]       = useState(myColor === 'w' ? 'White (you)'  : 'Black (you)');
  const [promotion,    setPromotion]    = useState(null); // { uci } awaiting promo choice

  const timerRef = useRef(null);
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);

  const myTurn = status === 'playing' && chess.turn() === myColor;
  const interactive = myTurn && !promotion;

  const endGame = useCallback((msg) => {
    clearInterval(timerRef.current);
    setStatus('over');
    setResult(msg);
  }, []);

  // ── Move handling ─────────────────────────────────────────────────────────
  const applyMove = useCallback((uci, isMine) => {
    const from = uci.slice(0, 2);
    const to   = uci.slice(2, 4);
    const promo = uci[4] || undefined;
    const moveResult = chess.move({ from, to, promotion: promo });
    if (!moveResult) return false;

    setFen(chess.fen());
    setLastFrom([rankToRow(from[1]), fileToCol(from[0])]);
    setLastTo([rankToRow(to[1]), fileToCol(to[0])]);

    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'Black' : 'White';
      endGame(`${winner} wins by checkmate`);
    } else if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isDraw()) {
      endGame('Draw');
    }

    if (isMine) p2p.send({ type: 'move', uci });
    return true;
  }, [chess, endGame]);

  const handleMyMove = useCallback((uci) => {
    // Check if pawn promotion
    const from  = uci.slice(0, 2);
    const to    = uci.slice(2, 4);
    const piece = chess.get(from);
    const toRow = rankToRow(to[1]);
    if (piece?.type === 'p' && (toRow === 0 || toRow === 7)) {
      setPromotion({ from, to });
      return;
    }
    applyMove(uci, true);
  }, [chess, applyMove]);

  const handlePromotion = (piece) => {
    if (!promotion) return;
    const uci = promotion.from + promotion.to + piece;
    setPromotion(null);
    applyMove(uci, true);
  };

  // ── Peer message handler ──────────────────────────────────────────────────
  useEffect(() => {
    p2p.on('message', (msg) => {
      if (msg.type === 'move')       applyMove(msg.uci, false);
      if (msg.type === 'resign')     endGame(myColor === 'w' ? 'You win — opponent resigned' : 'Opponent wins — you resigned');
    });
    p2p.on('close', () => {
      if (statusRef.current === 'playing') endGame('Opponent disconnected');
    });
    return () => { p2p.off('message'); p2p.off('close'); };
  }, [myColor, applyMove, endGame]);

  // ── Clock tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => {
      if (chess.turn() === 'w') {
        setWTime(t => {
          if (t <= 1) { clearInterval(id); endGame('Black wins on time'); return 0; }
          return t - 1;
        });
      } else {
        setBTime(t => {
          if (t <= 1) { clearInterval(id); endGame('White wins on time'); return 0; }
          return t - 1;
        });
      }
    }, 1000);
    timerRef.current = id;
    return () => clearInterval(id);
  }, [status, chess, endGame]);

  function handleResign() {
    p2p.send({ type: 'resign' });
    endGame(myColor === 'w' ? 'Black wins — you resigned' : 'White wins — you resigned');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const topColor   = myColor === 'w' ? 'b' : 'w';
  const topName    = peerName;
  const topTime    = myColor === 'w' ? bTime : wTime;
  const topActive  = chess.turn() === topColor && status === 'playing';
  const botTime    = myColor === 'w' ? wTime : bTime;
  const botActive  = chess.turn() === myColor && status === 'playing';

  return (
    <div className={styles.page}>
      <div className={styles.boardCol}>

        <PlayerBar name={topName}  color={topColor} time={topTime} active={topActive} />

        <P2PBoard
          fen={fen}
          myColor={myColor}
          interactive={interactive}
          onMove={handleMyMove}
          lastFrom={lastFrom}
          lastTo={lastTo}
        />

        <PlayerBar name={myName} color={myColor} time={botTime} active={botActive} />

        {/* Controls */}
        {status === 'playing' && (
          <div className={styles.controls}>
            <button className={styles.resignBtn} onClick={handleResign}>Resign</button>
          </div>
        )}

        {/* Game over overlay */}
        {status === 'over' && (
          <div className={styles.overBanner}>
            <div className={styles.overTitle}>Game Over</div>
            <div className={styles.overResult}>{result}</div>
            <button className={styles.exitBtn} onClick={onExit}>Exit</button>
          </div>
        )}

        {/* Promotion picker */}
        {promotion && (
          <div className={styles.promoOverlay}>
            <div className={styles.promoBox}>
              <div className={styles.promoTitle}>Promote to</div>
              {['q','r','b','n'].map(p => (
                <button key={p} className={styles.promoBtn} onClick={() => handlePromotion(p)}>
                  {p === 'q' ? '♛' : p === 'r' ? '♜' : p === 'b' ? '♝' : '♞'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sideTitle}>P2P Game</div>
        <div className={styles.sideRow}>
          <span className={styles.sideLabel}>Mode</span>
          <span className={styles.sideVal}>Offline P2P</span>
        </div>
        <div className={styles.sideRow}>
          <span className={styles.sideLabel}>You play</span>
          <span className={styles.sideVal}>{myColor === 'w' ? 'White' : 'Black'}</span>
        </div>
        <div className={styles.sideRow}>
          <span className={styles.sideLabel}>Turn</span>
          <span className={styles.sideVal}>{status === 'over' ? '—' : chess.turn() === 'w' ? 'White' : 'Black'}</span>
        </div>
        {chess.isCheck() && status === 'playing' && (
          <div className={styles.checkBadge}>Check!</div>
        )}
        <div className={styles.sideSpacer} />
        <button className={styles.exitSideBtn} onClick={onExit}>← Exit</button>
      </div>
    </div>
  );
}
