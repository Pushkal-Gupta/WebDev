import { useState } from 'react';

const ROWS = 6, COLS = 7;
const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

function checkWin(b) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) {
    const v = b[r][c];
    if (!v) continue;
    for (const [dr,dc] of dirs) {
      let k = 1;
      while (k<4 && r+dr*k>=0 && r+dr*k<ROWS && c+dc*k>=0 && c+dc*k<COLS && b[r+dr*k][c+dc*k]===v) k++;
      if (k===4) return v;
    }
  }
  return null;
}

export default function Connect4Game() {
  const [board, setBoard]   = useState(emptyBoard);
  const [turn, setTurn]     = useState('r');
  const [winner, setWinner] = useState(null);
  const [hover, setHover]   = useState(-1);
  // Track the row each cell landed on so we can animate only the freshly
  // dropped disc, not everything still on the board.
  const [lastDrop, setLastDrop] = useState(null); // { col, row } | null

  const drop = (col) => {
    if (winner) return;
    const nb = board.map((r) => r.slice());
    let landed = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!nb[r][col]) { nb[r][col] = turn; landed = r; break; }
    }
    if (landed === -1) return; // column full — ignore silently
    const w = checkWin(nb);
    setBoard(nb);
    setLastDrop({ col, row: landed });
    if (w) setWinner(w);
    else setTurn(turn === 'r' ? 'y' : 'r');
  };

  const reset = () => {
    setBoard(emptyBoard()); setTurn('r'); setWinner(null); setLastDrop(null);
  };

  const turnLabel = turn === 'r' ? 'Red' : 'Yellow';

  return (
    <div className="c4">
      <div className="c4-hud">
        {winner ? (
          <span className={`c4-status c4-status-win c4-side-${winner}`}>
            {winner === 'r' ? 'Red' : 'Yellow'} wins
          </span>
        ) : (
          <span className="c4-status">
            <span className={`c4-dot c4-side-${turn}`} aria-hidden="true"/>
            {turnLabel} to play
          </span>
        )}
        <button className="btn btn-ghost btn-sm c4-reset" onClick={reset}>
          {winner ? 'Rematch' : 'Reset'}
        </button>
      </div>

      <div className="c4-board" role="grid" aria-label="Connect 4 board">
        {Array.from({ length: COLS }, (_, c) => {
          const landingRow = (() => {
            for (let i = ROWS - 1; i >= 0; i--) if (!board[i][c]) return i;
            return -1;
          })();
          const isColActive = hover === c && !winner && landingRow !== -1;
          return (
            <button
              key={c}
              className={'c4-col' + (isColActive ? ' is-active' : '')}
              onMouseEnter={() => setHover(c)}
              onMouseLeave={() => setHover(-1)}
              onFocus={() => setHover(c)}
              onBlur={() => setHover(-1)}
              onClick={() => drop(c)}
              disabled={!!winner || landingRow === -1}
              aria-label={`Drop ${turnLabel} in column ${c + 1}`}>
              {Array.from({ length: ROWS }, (_, r) => {
                const v = board[r][c];
                const isGhost = isColActive && r === landingRow && !v;
                const dropped = lastDrop && lastDrop.col === c && lastDrop.row === r;
                return (
                  <span
                    key={r}
                    className={
                      'c4-cell' +
                      (v ? ` c4-cell-${v}` : '') +
                      (isGhost ? ` c4-cell-ghost c4-side-${turn}` : '') +
                      (dropped ? ' c4-cell-drop' : '')
                    }
                    aria-hidden="true"
                  />
                );
              })}
            </button>
          );
        })}
      </div>

      <p className="c4-help">Click a column to drop. First four in a row wins.</p>
    </div>
  );
}
