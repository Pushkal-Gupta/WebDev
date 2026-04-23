import { useState, useRef, useEffect, useCallback } from 'react';

const ARROW_COLOR = 'rgba(0, 170, 50, 0.85)';
const DRAWING_COLOR = 'rgba(0, 170, 50, 0.6)';

function getSquare(e, boardEl, flippedRef) {
  const rect = boardEl.getBoundingClientRect();
  const cellSize = rect.width / 8;
  const dc = Math.min(7, Math.max(0, Math.floor((e.clientX - rect.left) / cellSize)));
  const dr = Math.min(7, Math.max(0, Math.floor((e.clientY - rect.top) / cellSize)));
  const col = flippedRef.current ? 7 - dc : dc;
  const row = flippedRef.current ? 7 - dr : dr;
  return { row, col };
}

function sameSquare(a, b) {
  return a && b && a.row === b.row && a.col === b.col;
}

export default function useArrowDrawing(boardRef, flipped) {
  const [userArrows, setUserArrows] = useState([]);
  const [drawingArrow, setDrawingArrow] = useState(null);
  const drawStartRef = useRef(null);
  const flippedRef = useRef(flipped);

  useEffect(() => { flippedRef.current = flipped; }, [flipped]);

  const clearUserArrows = useCallback(() => setUserArrows([]), []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const onContextMenu = (e) => e.preventDefault();

    const onMouseDown = (e) => {
      if (e.button !== 2) return;
      e.preventDefault();
      const sq = getSquare(e, board, flippedRef);
      drawStartRef.current = sq;
      setDrawingArrow(null);
    };

    const onMouseMove = (e) => {
      if (!drawStartRef.current) return;
      const sq = getSquare(e, board, flippedRef);
      if (!sameSquare(sq, drawStartRef.current)) {
        setDrawingArrow({ from: drawStartRef.current, to: sq, color: DRAWING_COLOR, kind: 'user-drawing' });
      } else {
        setDrawingArrow(null);
      }
    };

    const onMouseUp = (e) => {
      if (e.button !== 2 || !drawStartRef.current) return;
      const from = drawStartRef.current;
      const to = getSquare(e, board, flippedRef);
      drawStartRef.current = null;
      setDrawingArrow(null);

      if (sameSquare(from, to)) {
        setUserArrows([]);
        return;
      }

      setUserArrows(prev => {
        const idx = prev.findIndex(a =>
          a.from.row === from.row && a.from.col === from.col &&
          a.to.row === to.row && a.to.col === to.col
        );
        if (idx >= 0) return prev.filter((_, i) => i !== idx);
        return [...prev, { from, to, color: ARROW_COLOR, kind: 'user' }];
      });
    };

    const onMouseLeave = () => {
      if (drawStartRef.current) {
        drawStartRef.current = null;
        setDrawingArrow(null);
      }
    };

    board.addEventListener('contextmenu', onContextMenu);
    board.addEventListener('mousedown', onMouseDown);
    board.addEventListener('mousemove', onMouseMove);
    board.addEventListener('mouseup', onMouseUp);
    board.addEventListener('mouseleave', onMouseLeave);
    return () => {
      board.removeEventListener('contextmenu', onContextMenu);
      board.removeEventListener('mousedown', onMouseDown);
      board.removeEventListener('mousemove', onMouseMove);
      board.removeEventListener('mouseup', onMouseUp);
      board.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [boardRef]);

  return { userArrows, drawingArrow, clearUserArrows };
}
