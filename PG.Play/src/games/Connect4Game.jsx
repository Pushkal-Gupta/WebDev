import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Celebration from '../components/Celebration.jsx';

const ROWS = 6, COLS = 7;
const HUMAN = 'r';   // red — player goes first
const BOT   = 'y';   // yellow
const DIFFICULTY_KEY = 'pd-c4-difficulty';

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const cloneBoard = (b) => b.map((row) => row.slice());

const landingRow = (b, col) => {
  for (let r = ROWS - 1; r >= 0; r--) if (!b[r][col]) return r;
  return -1;
};

const dropAt = (b, col, piece) => {
  const r = landingRow(b, col);
  if (r === -1) return null;
  const nb = cloneBoard(b);
  nb[r][col] = piece;
  return { board: nb, row: r };
};

const DIRS = [[0,1],[1,0],[1,1],[1,-1]];

// Returns { winner, line } where line is the array of [r, c] cells that
// formed the four-in-a-row, so the UI can highlight it. Both null when no
// winner yet.
function findWin(b) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const v = b[r][c];
    if (!v) continue;
    for (const [dr, dc] of DIRS) {
      const cells = [[r, c]];
      let ok = true;
      for (let k = 1; k < 4; k++) {
        const nr = r + dr*k, nc = c + dc*k;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr][nc] !== v) { ok = false; break; }
        cells.push([nr, nc]);
      }
      if (ok) return { winner: v, line: cells };
    }
  }
  return { winner: null, line: null };
}

// Thin wrapper for paths that just want the piece ID — used by the bot's
// minimax where the winning cells aren't needed.
const checkWin = (b) => findWin(b).winner;

const isFull = (b) => b[0].every((v) => v !== null);

const validCols = (b) => {
  const out = [];
  for (let c = 0; c < COLS; c++) if (b[0][c] === null) out.push(c);
  return out;
};

// Score every length-4 window: 100/10/1 for 4/3/2 of mine in an otherwise-clear
// window (and -100/-10/-1 for the opponent). Classic minimax heuristic.
const scoreWindow = (cells, me, opp) => {
  let mine = 0, theirs = 0;
  for (const v of cells) {
    if (v === me) mine++;
    else if (v === opp) theirs++;
  }
  if (mine && theirs) return 0;
  if (mine === 4) return 100000;
  if (theirs === 4) return -100000;
  if (mine === 3) return 50;
  if (mine === 2) return 5;
  if (theirs === 3) return -80;   // weight defense slightly higher than offense
  if (theirs === 2) return -4;
  return 0;
};

const evaluate = (b, me) => {
  const opp = me === BOT ? HUMAN : BOT;
  let score = 0;
  const center = Math.floor(COLS / 2);
  for (let r = 0; r < ROWS; r++) if (b[r][center] === me) score += 6;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    for (const [dr, dc] of DIRS) {
      const er = r + 3*dr, ec = c + 3*dc;
      if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
      const cells = [0,1,2,3].map((k) => b[r+dr*k][c+dc*k]);
      score += scoreWindow(cells, me, opp);
    }
  }
  return score;
};

// Minimax with alpha-beta. Center-ordered moves prune faster.
function minimax(board, depth, alpha, beta, maximizing) {
  const winner = checkWin(board);
  if (winner === BOT)   return { score: 1_000_000 + depth };
  if (winner === HUMAN) return { score: -1_000_000 - depth };
  if (depth === 0 || isFull(board)) return { score: evaluate(board, BOT) };

  const cols = validCols(board);
  cols.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));

  if (maximizing) {
    let bestScore = -Infinity, bestCol = cols[0];
    for (const c of cols) {
      const next = dropAt(board, c, BOT);
      if (!next) continue;
      const { score } = minimax(next.board, depth - 1, alpha, beta, false);
      if (score > bestScore) { bestScore = score; bestCol = c; }
      alpha = Math.max(alpha, bestScore);
      if (alpha >= beta) break;
    }
    return { score: bestScore, col: bestCol };
  } else {
    let bestScore = Infinity, bestCol = cols[0];
    for (const c of cols) {
      const next = dropAt(board, c, HUMAN);
      if (!next) continue;
      const { score } = minimax(next.board, depth - 1, alpha, beta, true);
      if (score < bestScore) { bestScore = score; bestCol = c; }
      beta = Math.min(beta, bestScore);
      if (alpha >= beta) break;
    }
    return { score: bestScore, col: bestCol };
  }
}

// Easy bot — tactical only: take an obvious win, block an obvious loss, then
// play randomly. No look-ahead beyond one ply, so it makes mistakes a casual
// player can punish.
const pickEasy = (board) => {
  for (const c of validCols(board)) {
    const next = dropAt(board, c, BOT);
    if (next && checkWin(next.board) === BOT) return c;
  }
  for (const c of validCols(board)) {
    const next = dropAt(board, c, HUMAN);
    if (next && checkWin(next.board) === HUMAN) return c;
  }
  const cs = validCols(board);
  return cs[Math.floor(Math.random() * cs.length)];
};

const pickBotMove = (board, difficulty) => {
  if (difficulty === 'easy') return pickEasy(board);
  const depth = difficulty === 'hard' ? 5 : 3;
  const { col } = minimax(board, depth, -Infinity, Infinity, true);
  return col ?? validCols(board)[0];
};

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function Connect4Game({ mode } = {}) {
  const vsBot = mode === 'bot';

  const [board, setBoard]   = useState(emptyBoard);
  const [turn, setTurn]     = useState(HUMAN);
  const [winner, setWinner] = useState(null);
  const [winLine, setWinLine] = useState(null);   // array of [r, c] | null
  const [draw, setDraw]     = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hover, setHover]   = useState(-1);
  const [lastDrop, setLastDrop] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [difficulty, setDifficulty] = useState(() => {
    try { return localStorage.getItem(DIFFICULTY_KEY) || 'medium'; }
    catch { return 'medium'; }
  });
  const botTimerRef = useRef(null);
  const gameOver = !!winner || draw;
  const winSet = useMemo(() => {
    if (!winLine) return null;
    return new Set(winLine.map(([r, c]) => `${r},${c}`));
  }, [winLine]);

  const reset = useCallback(() => {
    if (botTimerRef.current) window.clearTimeout(botTimerRef.current);
    setBoard(emptyBoard());
    setTurn(HUMAN);
    setWinner(null);
    setWinLine(null);
    setDraw(false);
    setShowCelebration(false);
    setLastDrop(null);
    setThinking(false);
  }, []);

  // Switching difficulty mid-game starts a fresh board — keeps the bot's
  // skill level honest and avoids weird mid-game tonal shifts.
  const persistDifficulty = (d) => {
    if (d === difficulty) return;
    setDifficulty(d);
    try { localStorage.setItem(DIFFICULTY_KEY, d); } catch { /* private mode */ }
    reset();
  };

  const place = useCallback((b, col, piece) => dropAt(b, col, piece), []);

  const drop = (col) => {
    if (gameOver || thinking) return;
    if (vsBot && turn !== HUMAN) return;
    const next = place(board, col, turn);
    if (!next) return;
    const w = findWin(next.board);
    setBoard(next.board);
    setLastDrop({ col, row: next.row });
    if (w.winner) {
      setWinner(w.winner);
      setWinLine(w.line);
      return;
    }
    if (isFull(next.board)) { setDraw(true); return; }
    setTurn(turn === HUMAN ? BOT : HUMAN);
  };

  // Bot turn — runs after the human's drop has rendered. Small delay so the
  // freshly dropped disc finishes its animation before the bot answers, and
  // an extra beat on hard so the player feels it deliberate.
  useEffect(() => {
    if (!vsBot || gameOver || turn !== BOT) return;
    setThinking(true);
    const delay = difficulty === 'hard' ? 520 : difficulty === 'easy' ? 240 : 360;
    botTimerRef.current = window.setTimeout(() => {
      const col = pickBotMove(board, difficulty);
      const next = place(board, col, BOT);
      if (!next) { setThinking(false); return; }
      const w = findWin(next.board);
      setBoard(next.board);
      setLastDrop({ col, row: next.row });
      setThinking(false);
      if (w.winner) {
        setWinner(w.winner);
        setWinLine(w.line);
      } else if (isFull(next.board)) {
        setDraw(true);
      } else {
        setTurn(HUMAN);
      }
    }, delay);
    return () => {
      if (botTimerRef.current) {
        window.clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
    };
  }, [vsBot, turn, gameOver, board, place, difficulty]);

  // Hold the celebration back briefly so the player sees the highlighted
  // winning line first, then trigger confetti. The Celebration's autoDismiss
  // handles the back half — fade itself out so the highlighted line stays
  // legible after the animation. Draws shorten the lead-in (no line to read).
  useEffect(() => {
    if (!gameOver) { setShowCelebration(false); return; }
    const t = setTimeout(() => setShowCelebration(true), draw ? 300 : 600);
    return () => clearTimeout(t);
  }, [gameOver, draw]);

  const sideName = (s) => (s === HUMAN ? (vsBot ? 'You' : 'Red') : (vsBot ? 'Bot' : 'Yellow'));
  const turnLabel = sideName(turn);

  // Celebration copy — confetti for player wins, silent card for bot win or
  // a draw. The card always offers a rematch shortcut.
  const endCopy = () => {
    if (draw) return {
      intensity: 0,
      title: 'Draw',
      sub: 'Board full, nobody got four in a row. Run it back?',
    };
    if (!winner) return null;
    if (vsBot) {
      if (winner === HUMAN) return {
        intensity: 4,
        title: 'You win!',
        sub: `Four in a row on ${difficulty}. Want a tougher rematch?`,
      };
      return {
        intensity: 0,
        title: 'Bot wins',
        sub: difficulty === 'hard'
          ? 'Hard is unforgiving. Try medium to find the rhythm.'
          : 'Close one. Run it back?',
      };
    }
    return {
      intensity: 3,
      title: `${sideName(winner)} wins!`,
      sub: 'Four in a row. Glory.',
    };
  };
  const wc = endCopy();

  return (
    <div className="c4">
      <div className="c4-hud">
        {winner ? (
          <span className={`c4-status c4-status-win c4-side-${winner}`}>
            {sideName(winner)} {winner === HUMAN && vsBot ? 'win' : 'wins'}
          </span>
        ) : draw ? (
          <span className="c4-status c4-status-draw">Draw</span>
        ) : (
          <span className="c4-status">
            <span className={`c4-dot c4-side-${turn}`} aria-hidden="true"/>
            {thinking ? 'Bot thinking…' : `${turnLabel} to play`}
          </span>
        )}
        {vsBot && (
          <div className="c4-difficulty" role="group" aria-label="Bot difficulty">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={'c4-diff-btn' + (difficulty === d ? ' is-active' : '')}
                onClick={() => persistDifficulty(d)}
                disabled={thinking}
                aria-pressed={difficulty === d}>
                {d}
              </button>
            ))}
          </div>
        )}
        <button className="btn btn-ghost btn-sm c4-reset" onClick={reset}>
          {gameOver ? 'Rematch' : 'Reset'}
        </button>
      </div>

      <div className="c4-board" role="grid" aria-label="Connect 4 board">
        {Array.from({ length: COLS }, (_, c) => {
          const lr = landingRow(board, c);
          const isColActive = hover === c && !gameOver && !thinking && lr !== -1
                              && (!vsBot || turn === HUMAN);
          const colDisabled = gameOver || lr === -1 || thinking
                              || (vsBot && turn !== HUMAN);
          return (
            <button
              key={c}
              className={'c4-col' + (isColActive ? ' is-active' : '')}
              onMouseEnter={() => setHover(c)}
              onMouseLeave={() => setHover(-1)}
              onFocus={() => setHover(c)}
              onBlur={() => setHover(-1)}
              onClick={() => drop(c)}
              disabled={colDisabled}
              aria-label={`Drop ${turnLabel} in column ${c + 1}`}>
              {Array.from({ length: ROWS }, (_, r) => {
                const v = board[r][c];
                const isGhost = isColActive && r === lr && !v;
                const dropped = lastDrop && lastDrop.col === c && lastDrop.row === r;
                const isWin = !!winSet && winSet.has(`${r},${c}`);
                return (
                  <span
                    key={r}
                    className={
                      'c4-cell' +
                      (v ? ` c4-cell-${v}` : '') +
                      (isGhost ? ` c4-cell-ghost c4-side-${turn}` : '') +
                      (dropped ? ' c4-cell-drop' : '') +
                      (isWin ? ' c4-cell-win' : '')
                    }
                    aria-hidden="true"
                  />
                );
              })}
            </button>
          );
        })}
      </div>

      <p className="c4-help">
        {vsBot ? 'Click a column to drop. Beat the bot — four in a row wins.'
               : 'Click a column to drop. First four in a row wins.'}
      </p>

      {wc && showCelebration && (
        <Celebration
          intensity={wc.intensity}
          title={wc.title}
          subtitle={wc.sub}
          autoDismissMs={4400}
          onDismiss={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
}
