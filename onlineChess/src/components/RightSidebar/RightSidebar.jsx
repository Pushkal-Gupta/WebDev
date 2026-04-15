import { useRef, useState, useMemo, useEffect } from 'react';
import styles from './RightSidebar.module.css';
import useGameStore from '../../store/gameStore';
import { getOpeningName } from '../../utils/evaluation';
import { CLASSIFICATIONS } from '../../utils/reviewEngine';
import BotChatCard from '../BotChatCard/BotChatCard';

const TAB_KEY = 'chess_right_tab';
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function OpeningStrip({ name }) {
  if (!name) return null;
  return (
    <div className={styles.openingStrip} title={name}>
      <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4.5A1.5 1.5 0 014.5 3H16v14H4.5A1.5 1.5 0 013 15.5v-11z"/>
        <path d="M3 15.5A1.5 1.5 0 014.5 14H16"/>
      </svg>
      <span className={styles.openingLabel}>{name}</span>
    </div>
  );
}

function phaseFromMoves(n, totalMaterial) {
  if (n < 14) return 'Opening';
  if (totalMaterial <= 22) return 'Endgame';
  return 'Middlegame';
}

function countMaterial(boardState) {
  if (!boardState) return { w: 0, b: 0, total: 0 };
  let w = 0, b = 0;
  for (const row of boardState) {
    for (const sq of row) {
      if (!sq) continue;
      if (sq.color === 'w') w += PIECE_VALUES[sq.type] || 0;
      else b += PIECE_VALUES[sq.type] || 0;
    }
  }
  return { w, b, total: w + b };
}

function InfoTab({ moveHistory, boardState, openingName, reviewResults, currentMoveIndex, capturedByWhite, capturedByBlack }) {
  const mat = useMemo(() => countMaterial(boardState), [boardState]);
  const phase = phaseFromMoves(moveHistory.length, mat.total);
  const matDiff = mat.w - mat.b;
  const latestReview = reviewResults?.[currentMoveIndex];
  const cls = latestReview?.classification ? CLASSIFICATIONS[latestReview.classification] : null;
  const activeName = currentMoveIndex >= 0 ? moveHistory[currentMoveIndex]?.san : null;

  return (
    <div className={styles.infoScroll}>
      <section className={styles.infoCard}>
        <div className={styles.infoLabel}>Opening</div>
        <div className={styles.infoValue}>{openingName || <span className={styles.dim}>Out of book</span>}</div>
      </section>

      <section className={styles.infoCard}>
        <div className={styles.infoLabel}>Phase</div>
        <div className={styles.infoValue}>{phase}</div>
        <div className={styles.infoSub}>
          Move {Math.ceil(moveHistory.length / 2) || 0} · {moveHistory.length} plies played
        </div>
      </section>

      <section className={styles.infoCard}>
        <div className={styles.infoLabel}>Material</div>
        <div className={styles.infoRow}>
          <span className={styles.matWhite}>♙ {mat.w}</span>
          <span className={styles.matDiff} style={{ color: matDiff === 0 ? 'rgba(255,255,255,0.4)' : matDiff > 0 ? '#6fdc8c' : '#ff7875' }}>
            {matDiff === 0 ? 'Equal' : matDiff > 0 ? `+${matDiff} White` : `+${-matDiff} Black`}
          </span>
          <span className={styles.matBlack}>♟ {mat.b}</span>
        </div>
      </section>

      {cls && activeName && (
        <section className={styles.infoCard} style={{ '--cls-color': cls.color }}>
          <div className={styles.infoLabel}>Last-move review</div>
          <div className={styles.infoRow}>
            <span className={styles.infoBadge}>{cls.symbol}</span>
            <span className={styles.infoValue} style={{ color: cls.color }}>{cls.label}</span>
            <span className={styles.dim}>{activeName}</span>
          </div>
        </section>
      )}

      {(capturedByWhite?.length > 0 || capturedByBlack?.length > 0) && (
        <section className={styles.infoCard}>
          <div className={styles.infoLabel}>Captured</div>
          <div className={styles.captureRow}>
            <div className={styles.captureLine}>
              <span className={styles.dim}>White took:</span>
              <span>{(capturedByWhite || []).map(p => pieceGlyph(p, 'b')).join(' ') || '–'}</span>
            </div>
            <div className={styles.captureLine}>
              <span className={styles.dim}>Black took:</span>
              <span>{(capturedByBlack || []).map(p => pieceGlyph(p, 'w')).join(' ') || '–'}</span>
            </div>
          </div>
        </section>
      )}

      {moveHistory.length === 0 && (
        <section className={styles.infoHint}>
          Make a move to see live stats appear here.
        </section>
      )}
    </div>
  );
}

function pieceGlyph(p, _pov) {
  // Uses standard unicode chess pieces. Opponent color (value of capture).
  const GLYPH = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
  };
  return GLYPH[p.color]?.[p.type] || '?';
}

export default function RightSidebar({ onAlert, reviewResults, isReviewing, isOnlineGame = false }) {
  const {
    moveHistory, currentMoveIndex, goToMove, boardState,
    getPgn, gameStarted, flipped, setFlipped, undoMove, undoTwoMoves, isComp, isOnline, isCoachGame,
    capturedByWhite, capturedByBlack,
    variation, clearVariation,
  } = useGameStore();

  const moveHistoryRef = useRef(null);

  const showBotChat   = isComp && !isCoachGame && !isOnline && !isOnlineGame;
  const showCoachChat = isCoachGame;
  const hasCoachTab   = showBotChat || showCoachChat;

  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY);
      if (saved === 'moves' || saved === 'coach' || saved === 'info') return saved;
    } catch { /* ignore */ }
    return hasCoachTab ? 'coach' : 'moves';
  });

  // If the coach tab disappears (online game), bounce to moves
  useEffect(() => {
    if (tab === 'coach' && !hasCoachTab) setTab('moves');
  }, [tab, hasCoachTab]);

  const selectTab = (t) => {
    setTab(t);
    try { localStorage.setItem(TAB_KEY, t); } catch { /* ignore */ }
  };

  // Auto-scroll to active move
  const scrollToActive = () => {
    if (moveHistoryRef.current) {
      const active = moveHistoryRef.current.querySelector(`.${styles.moveCellActive}`);
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  };

  const handleCopyPgn = () => {
    const pgn = getPgn();
    if (!pgn) { onAlert?.('No game in progress'); return; }
    navigator.clipboard.writeText(pgn).then(() => onAlert?.('PGN copied!'));
  };

  // Build move row pairs
  const moveRows = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    moveRows.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i],       whiteIdx: i,
      black: moveHistory[i + 1] || null, blackIdx: i + 1,
    });
  }

  const openingName = getOpeningName(moveHistory);

  return (
    <aside className={styles.sidebar}>
      {/* Tab bar */}
      <div className={styles.tabBar} role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'moves'}
          className={`${styles.tabBtn} ${tab === 'moves' ? styles.tabBtnActive : ''}`}
          onClick={() => selectTab('moves')}
        >Moves{moveHistory.length > 0 && <span className={styles.tabCount}>{moveHistory.length}</span>}</button>
        {hasCoachTab && (
          <button
            role="tab"
            aria-selected={tab === 'coach'}
            className={`${styles.tabBtn} ${tab === 'coach' ? styles.tabBtnActive : ''}`}
            onClick={() => selectTab('coach')}
          >{isCoachGame ? 'Coach' : 'Bot'}</button>
        )}
        <button
          role="tab"
          aria-selected={tab === 'info'}
          className={`${styles.tabBtn} ${tab === 'info' ? styles.tabBtnActive : ''}`}
          onClick={() => selectTab('info')}
        >Info</button>
      </div>

      {/* Opening strip (always visible regardless of tab) */}
      <OpeningStrip name={openingName} />

      {/* Review progress bar */}
      {isReviewing && (
        <div className={styles.reviewBar}>
          <span className={styles.reviewLabel}>Reviewing game...</span>
          <div className={styles.reviewSpinner} />
        </div>
      )}

      {/* ── Panel body ── */}
      {tab === 'coach' && hasCoachTab && (
        <div className={styles.coachPanel}>
          {showBotChat   && <BotChatCard mode="bot"   reviewResult={reviewResults?.[currentMoveIndex] || null} />}
          {showCoachChat && <BotChatCard mode="coach" reviewResult={reviewResults?.[currentMoveIndex] || null} />}
        </div>
      )}

      {tab === 'info' && (
        <InfoTab
          moveHistory={moveHistory}
          boardState={boardState}
          openingName={openingName}
          reviewResults={reviewResults}
          currentMoveIndex={currentMoveIndex}
          capturedByWhite={capturedByWhite}
          capturedByBlack={capturedByBlack}
        />
      )}

      {tab === 'moves' && (
        <div className={styles.moveHistory} ref={moveHistoryRef} onScroll={() => {}}>
          {moveHistory.length === 0 ? (
            <div className={styles.emptyMoves}>
              <span>No moves yet</span>
              <span className={styles.emptyHint}>Played moves show up here in pairs.</span>
            </div>
          ) : (
            <table className={styles.moveTable}>
              <tbody>
                {moveRows.map((row) => {
                  const wReview = reviewResults?.[row.whiteIdx];
                  const bReview = row.black ? reviewResults?.[row.blackIdx] : null;
                  const wClass  = wReview ? CLASSIFICATIONS[wReview.classification] : null;
                  const bClass  = bReview ? CLASSIFICATIONS[bReview.classification] : null;
                  return (
                    <tr key={row.number} className={styles.moveRow}>
                      <td className={styles.moveCellNum}>{row.number}.</td>
                      <td
                        className={`${styles.moveCell} ${currentMoveIndex === row.whiteIdx ? styles.moveCellActive : ''}`}
                        onClick={() => { goToMove(row.whiteIdx); setTimeout(scrollToActive, 50); }}
                      >
                        {row.white?.san || ''}
                        {wClass && (
                          <span className={styles.badge} style={{ color: wClass.color }} title={wClass.label}>
                            {wClass.symbol}
                          </span>
                        )}
                      </td>
                      <td
                        className={`${styles.moveCell} ${row.black && currentMoveIndex === row.blackIdx ? styles.moveCellActive : ''}`}
                        onClick={() => { if (row.black) { goToMove(row.blackIdx); setTimeout(scrollToActive, 50); } }}
                      >
                        {row.black?.san || ''}
                        {bClass && (
                          <span className={styles.badge} style={{ color: bClass.color }} title={bClass.label}>
                            {bClass.symbol}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Analysis side-line — alt-moves played from a historical position. */}
          {variation && variation.length > 0 && (
            <div className={styles.variationStrip}>
              <div className={styles.variationHeader}>
                <span className={styles.variationLabel}>Exploring</span>
                <button className={styles.variationBack} onClick={clearVariation} title="Return to the original game">
                  ← Back to game
                </button>
              </div>
              <div className={styles.variationMoves}>
                {variation.map((m, i) => {
                  // Determine the move number this variation move would have.
                  const baseIdx = (currentMoveIndex >= 0 ? currentMoveIndex : -1) + 1 + i;
                  const moveNum = Math.floor(baseIdx / 2) + 1;
                  const isWhite = baseIdx % 2 === 0;
                  return (
                    <span key={i} className={styles.variationMove}>
                      {isWhite && <span className={styles.variationNum}>{moveNum}.</span>}
                      {!isWhite && i === 0 && <span className={styles.variationNum}>{moveNum}…</span>}
                      <span className={styles.variationSan}>{m.san}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons (always visible — shared across tabs) */}
      <div className={styles.navBtns}>
        <button className={styles.navBtn} onClick={() => goToMove(-1)} title="Start">⏮</button>
        <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex - 1)} title="Prev" disabled={currentMoveIndex < 0}>◀</button>
        <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex + 1)} title="Next" disabled={currentMoveIndex >= moveHistory.length - 1}>▶</button>
        <button className={styles.navBtn} onClick={() => goToMove(moveHistory.length - 1)} title="End">⏭</button>
      </div>

      {/* Action row */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => setFlipped(!flipped)} title="Flip board">⇅ Flip</button>
        {!isOnline && (
          <button className={styles.actionBtn} onClick={() => isComp ? undoTwoMoves() : undoMove()} disabled={!gameStarted} title="Undo">↩ Undo</button>
        )}
        <button className={styles.actionBtn} onClick={handleCopyPgn} title="Copy PGN">⎘ PGN</button>
      </div>
    </aside>
  );
}
