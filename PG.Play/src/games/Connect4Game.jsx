import { useState } from 'react';

const ROWS = 6, COLS = 7;
const emptyBoard = () => Array.from({length:ROWS}, () => Array(COLS).fill(null));

function checkWin(b) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
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
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState('r');
  const [winner, setWinner] = useState(null);
  const [hover, setHover] = useState(-1);

  const drop = (col) => {
    if (winner) return;
    const nb = board.map(r => r.slice());
    for (let r = ROWS-1; r >= 0; r--) {
      if (!nb[r][col]) { nb[r][col] = turn; break; }
    }
    const w = checkWin(nb);
    setBoard(nb);
    if (w) setWinner(w);
    else setTurn(turn === 'r' ? 'y' : 'r');
  };

  const reset = () => { setBoard(emptyBoard()); setTurn('r'); setWinner(null); };

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
      <div style={{display:'flex',alignItems:'center',gap:14,fontFamily:'var(--mono)',fontSize:12,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--dim)'}}>
        {winner ? (
          <span style={{color: winner==='r' ? '#ff4d6d' : '#ffe14f', fontWeight:700}}>
            {winner==='r' ? 'RED' : 'YELLOW'} WINS
          </span>
        ) : (
          <>
            <span style={{width:14,height:14,borderRadius:'50%',background:turn==='r'?'#ff4d6d':'#ffe14f',display:'inline-block'}}/>
            <span>{turn==='r' ? 'RED' : 'YELLOW'} TO PLAY</span>
          </>
        )}
        <button onClick={reset} style={{marginLeft:12,background:'var(--surface)',border:'1px solid var(--line)',color:'var(--text)',padding:'5px 12px',borderRadius:8,fontFamily:'var(--mono)',fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer'}}>Reset</button>
      </div>
      <div style={{background:'#1b3a8f',padding:10,borderRadius:14,boxShadow:'0 20px 40px -10px rgba(0,0,0,0.6)'}}>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${COLS},44px)`,gap:6}}>
          {Array.from({length:COLS},(_,c)=>(
            <div key={c}
              onMouseEnter={() => setHover(c)}
              onMouseLeave={() => setHover(-1)}
              onClick={() => drop(c)}
              style={{cursor:winner?'default':'pointer',display:'flex',flexDirection:'column',gap:6}}>
              {Array.from({length:ROWS},(_,r)=>{
                const v = board[r][c];
                const landingRow = (() => {
                  for (let i=ROWS-1;i>=0;i--) if (!board[i][c]) return i;
                  return -1;
                })();
                const isHover = hover===c && !v && !winner && r===landingRow;
                const fill = v==='r' ? '#ff4d6d' : v==='y' ? '#ffe14f' : 'transparent';
                return (
                  <div key={r} style={{
                    width:44, height:44, borderRadius:'50%',
                    background: v ? fill : '#142a72',
                    border: isHover ? `2px dashed ${turn==='r'?'#ff4d6d':'#ffe14f'}` : '2px solid #0a1a4a',
                    boxShadow: v ? 'inset 0 -2px 6px rgba(0,0,0,0.3)' : 'inset 0 2px 6px rgba(0,0,0,0.5)',
                    transition:'all 180ms',
                  }}/>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--mute)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
        Click a column to drop. First four in a row wins.
      </div>
    </div>
  );
}
