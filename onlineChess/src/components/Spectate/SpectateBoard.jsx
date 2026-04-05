import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import styles from './SpectateBoard.module.css';
import { subscribeAsSpectator, unsubscribe, sqToRowCol } from '../../utils/multiplayerService';
import useThemeStore from '../../store/themeStore';
import { usePieceResolver, getFallbackUrl } from '../../utils/pieceResolver';
import { PIECE_NAME, FILE_LABELS, parseFen } from '../../utils/boardHelpers';

function ReadOnlyBoard({ fen, lastMoveFrom, lastMoveTo, flipped }) {
  const { clr1, clr2, clr1p, clr2p } = useThemeStore();
  const resolvePiece = usePieceResolver();
  const rows = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const cols = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const board = parseFen(fen);

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board}>
        {rows.map((row, displayRow) =>
          cols.map((col, displayCol) => {
            const piece   = board[row]?.[col];
            const isLight = (row + col) % 2 === 0;
            const isLast  = (lastMoveFrom && lastMoveFrom[0] === row && lastMoveFrom[1] === col) ||
                            (lastMoveTo   && lastMoveTo[0]   === row && lastMoveTo[1]   === col);
            const bg = isLast ? (isLight ? clr1p : clr2p) : (isLight ? clr1 : clr2);
            const showRank = displayCol === 0;
            const showFile = displayRow === 7;

            return (
              <div key={`${row}-${col}`} className={styles.cell} style={{backgroundColor: bg}}>
                {showRank && (
                  <span className={styles.rankLabel} style={{color: isLight ? clr2 : clr1}}>
                    {flipped ? row + 1 : 8 - row}
                  </span>
                )}
                {showFile && (
                  <span className={styles.fileLabel} style={{color: isLight ? clr2 : clr1}}>
                    {FILE_LABELS[flipped ? 7 - col : col]}
                  </span>
                )}
                {piece && (
                  <img
                    src={resolvePiece(piece.type, piece.color)}
                    onError={e => { e.target.onerror = null; e.target.src = getFallbackUrl(piece.type, piece.color); }}
                    alt={piece.type}
                    className={styles.piece}
                    draggable={false}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function SpectateBoard({ room, onBack }) {
  const [fen, setFen]                 = useState(room.current_fen);
  const [lastMoveFrom, setLastMoveFrom] = useState(null);
  const [lastMoveTo,   setLastMoveTo]   = useState(null);
  const [moveCount,    setMoveCount]    = useState(0);
  const [resigned,     setResigned]     = useState(null); // player name who resigned
  const [flipped,      setFlipped]      = useState(false);
  const channelRef = useRef(null);
  // Keep a ref to current FEN so the subscription callback never captures a stale closure
  const fenRef = useRef(room.current_fen);
  useEffect(() => { fenRef.current = fen; }, [fen]);

  useEffect(() => {
    if (!room?.id) return;
    channelRef.current = subscribeAsSpectator(room.id, {
      onMove({ from, to, fen: newFen }) {
        if (newFen) {
          setFen(newFen);
        } else {
          // Fallback: apply move to the live FEN via ref (avoids stale closure)
          try {
            const chess = new Chess();
            chess.load(fenRef.current);
            chess.move({ from, to });
            setFen(chess.fen());
          } catch (err) { console.warn('Fallback move apply failed:', err); }
        }
        const { row: fr, col: fc } = sqToRowCol(from);
        const { row: tr, col: tc } = sqToRowCol(to);
        setLastMoveFrom([fr, fc]);
        setLastMoveTo([tr, tc]);
        setMoveCount(n => n + 1);
      },
      onResign({ userId }) {
        const name = userId === room?.host_id ? (room?.host_name) : (room?.guest_name);
        setResigned(name || 'A player');
      },
    });

    return () => unsubscribe(channelRef.current);
  }, [room?.id]); // eslint-disable-line

  // Determine who's turn it is from FEN
  let turnLabel = '';
  try {
    const chess = new Chess(fen);
    turnLabel = chess.turn() === 'w' ? `${room.host_name || 'White'}'s turn` : `${room.guest_name || 'Black'}'s turn`;
  } catch {}

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onBack}>← Back to list</button>
        <span className={styles.roomId}>Room {room.id}</span>
        <button className={styles.flipBtn} onClick={() => setFlipped(f => !f)}>⇅ Flip</button>
      </div>

      <div className={styles.content}>
        {/* Player labels */}
        <div className={styles.playerBar}>
          <span className={styles.playerDot} style={{background: flipped ? '#222' : '#f0f0f0', border: '1px solid rgba(255,255,255,0.2)'}} />
          <span className={styles.playerName}>{flipped ? (room.guest_name || 'Black') : (room.host_name || 'White')}</span>
        </div>

        <ReadOnlyBoard
          fen={fen}
          lastMoveFrom={lastMoveFrom}
          lastMoveTo={lastMoveTo}
          flipped={flipped}
        />

        <div className={styles.playerBar}>
          <span className={styles.playerDot} style={{background: flipped ? '#f0f0f0' : '#222', border: '1px solid rgba(255,255,255,0.2)'}} />
          <span className={styles.playerName}>{flipped ? (room.host_name || 'White') : (room.guest_name || 'Black')}</span>
        </div>

        {/* Status */}
        <div className={styles.status}>
          {resigned
            ? <span className={styles.statusResign}>{resigned} resigned</span>
            : <span className={styles.statusTurn}>{turnLabel}</span>
          }
          <span className={styles.moveCount}>{moveCount} moves seen</span>
        </div>
      </div>
    </div>
  );
}
