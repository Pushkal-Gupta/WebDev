import { create } from 'zustand';
import { Chess } from 'chess.js';

// chess.js piece type => image filename part
const PIECE_NAME_MAP = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};

const COLOR_MAP = { w: 'white', b: 'black' };

function buildBoardState(chess) {
  return chess.board();
}

function parseMoveToRowCol(move, flipped) {
  // move is like { from: 'e2', to: 'e4' }
  const fileToCol = (f) => f.charCodeAt(0) - 'a'.charCodeAt(0);
  const rankToRow = (r) => 8 - parseInt(r);
  const from = { row: rankToRow(move.from[1]), col: fileToCol(move.from[0]) };
  const to = { row: rankToRow(move.to[1]), col: fileToCol(move.to[0]) };
  return { from, to };
}

const initialState = {
  chessInstance: null,
  boardState: null,
  moveHistory: [], // array of { san, from, to, color, fen }
  currentMoveIndex: -1,
  selectedSquare: null, // { row, col }
  validMoves: [], // array of { row, col }
  lastMove: null, // { from: {row,col}, to: {row,col} }
  underCheck: null, // { row, col }
  gameStarted: false,
  gameOver: false,
  gameOverMessage: '',
  flipped: false,
  showLabels: true,
  highlightLastMove: true,
  highlightSelected: true,
  showLegalDots: true,
  dotSize: 12,
  timeControl: null, // { display, total, incr }
  whiteTime: 0,
  blackTime: 0,
  activeColor: 'w', // 'w' or 'b'
  timerRunning: false,
  timerData: [], // array of { color, time } for each move
  isComp: false,
  compColor: 'black', // color of computer
  compStrength: 4,
  compThinking: false,
  pawnPromotion: null, // { from, to } pending promotion
  disableBoard: false,
  capturedByWhite: [], // pieces captured by white
  capturedByBlack: [],
  oppName: 'Opponent',
  youName: 'You (White)',
};

const useGameStore = create((set, get) => ({
  ...initialState,

  init: () => {
    const chess = new Chess();
    set({
      ...initialState,
      chessInstance: chess,
      boardState: buildBoardState(chess),
    });
  },

  startGame: (timeControl, isComp = false, compColor = 'black', compStrength = 4) => {
    const chess = new Chess();
    const total = timeControl ? timeControl.total : 0;
    set({
      chessInstance: chess,
      boardState: buildBoardState(chess),
      moveHistory: [],
      currentMoveIndex: -1,
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      underCheck: null,
      gameStarted: true,
      gameOver: false,
      gameOverMessage: '',
      timeControl,
      whiteTime: total,
      blackTime: total,
      activeColor: 'w',
      timerRunning: !!timeControl,
      timerData: [],
      isComp,
      compColor,
      compStrength,
      compThinking: false,
      pawnPromotion: null,
      disableBoard: false,
      capturedByWhite: [],
      capturedByBlack: [],
      flipped: isComp && compColor === 'white',
    });
  },

  selectSquare: (row, col) => {
    const { chessInstance, selectedSquare, validMoves, gameOver, disableBoard, activeColor, isComp, compColor, currentMoveIndex, moveHistory } = get();
    if (!chessInstance || gameOver || disableBoard) return;

    // If viewing history, don't allow moves
    if (currentMoveIndex !== moveHistory.length - 1 && moveHistory.length > 0) return;

    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = String(8 - row);
    const square = file + rank;

    // If clicking a valid move square
    const isValidMove = validMoves.some(m => m.row === row && m.col === col);
    if (selectedSquare && isValidMove) {
      get().makeMove(selectedSquare, { row, col });
      return;
    }

    const piece = chessInstance.get(square);
    const turn = chessInstance.turn();

    // Can't select opponent's piece when it's your turn, or computer's turn
    if (!piece || piece.color !== turn) {
      set({ selectedSquare: null, validMoves: [] });
      return;
    }

    // If playing vs computer, can't move if it's computer's turn
    if (isComp) {
      const isCompTurn = (compColor === 'white' && turn === 'w') || (compColor === 'black' && turn === 'b');
      if (isCompTurn) {
        set({ selectedSquare: null, validMoves: [] });
        return;
      }
    }

    const moves = chessInstance.moves({ square, verbose: true });
    const validMoveSquares = moves.map(m => {
      const mFile = m.to[0];
      const mRank = m.to[1];
      return {
        row: 8 - parseInt(mRank),
        col: mFile.charCodeAt(0) - 'a'.charCodeAt(0),
      };
    });

    set({ selectedSquare: { row, col }, validMoves: validMoveSquares });
  },

  makeMove: (from, to, promotion = null) => {
    const { chessInstance, moveHistory, timeControl, whiteTime, blackTime, activeColor, timerData, capturedByWhite, capturedByBlack } = get();
    if (!chessInstance) return false;

    const fromFile = String.fromCharCode('a'.charCodeAt(0) + from.col);
    const fromRank = String(8 - from.row);
    const toFile = String.fromCharCode('a'.charCodeAt(0) + to.col);
    const toRank = String(8 - to.row);
    const fromSq = fromFile + fromRank;
    const toSq = toFile + toRank;

    // Check if pawn promotion needed
    const piece = chessInstance.get(fromSq);
    if (piece && piece.type === 'p' && !promotion) {
      if ((piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1')) {
        set({ pawnPromotion: { from, to }, disableBoard: true });
        return false;
      }
    }

    const moveObj = { from: fromSq, to: toSq };
    if (promotion) moveObj.promotion = promotion;

    const result = chessInstance.move(moveObj);
    if (!result) return false;

    // Track captured pieces
    const newCapturedByWhite = [...capturedByWhite];
    const newCapturedByBlack = [...capturedByBlack];
    if (result.captured) {
      const capturedPiece = { type: result.captured, color: result.color === 'w' ? 'b' : 'w' };
      if (result.color === 'w') newCapturedByWhite.push(capturedPiece);
      else newCapturedByBlack.push(capturedPiece);
    }

    // Update timer data
    const newTimerData = [...timerData, {
      color: result.color,
      time: result.color === 'w' ? whiteTime : blackTime,
    }];

    // Increment time
    let newWhiteTime = whiteTime;
    let newBlackTime = blackTime;
    if (timeControl && timeControl.incr) {
      if (result.color === 'w') newWhiteTime += timeControl.incr;
      else newBlackTime += timeControl.incr;
    }

    // Build move history entry
    const newMove = {
      san: result.san,
      from: { row: from.row, col: from.col },
      to: { row: to.row, col: to.col },
      color: result.color,
      fen: chessInstance.fen(),
      moveNumber: Math.floor(moveHistory.length / 2) + 1,
    };
    const newHistory = [...moveHistory, newMove];

    // Check state
    let underCheck = null;
    if (chessInstance.inCheck()) {
      const turn = chessInstance.turn();
      const board = chessInstance.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const sq = board[r][c];
          if (sq && sq.type === 'k' && sq.color === turn) {
            underCheck = { row: r, col: c };
          }
        }
      }
    }

    set({
      boardState: buildBoardState(chessInstance),
      moveHistory: newHistory,
      currentMoveIndex: newHistory.length - 1,
      selectedSquare: null,
      validMoves: [],
      lastMove: { from, to },
      underCheck,
      activeColor: chessInstance.turn(),
      whiteTime: newWhiteTime,
      blackTime: newBlackTime,
      timerData: newTimerData,
      pawnPromotion: null,
      disableBoard: false,
      capturedByWhite: newCapturedByWhite,
      capturedByBlack: newCapturedByBlack,
    });

    // Check game over
    get().checkGameOver();
    return true;
  },

  completePromotion: (piece) => {
    const { pawnPromotion } = get();
    if (!pawnPromotion) return;
    get().makeMove(pawnPromotion.from, pawnPromotion.to, piece);
  },

  checkGameOver: () => {
    const { chessInstance } = get();
    if (!chessInstance) return;

    let message = '';
    if (chessInstance.isCheckmate()) {
      const winner = chessInstance.turn() === 'w' ? 'Black' : 'White';
      message = `Checkmate! ${winner} wins!`;
    } else if (chessInstance.isStalemate()) {
      message = 'Stalemate! Draw.';
    } else if (chessInstance.isDraw()) {
      message = 'Draw!';
    }

    if (message) {
      set({ gameOver: true, gameOverMessage: message, timerRunning: false, disableBoard: true });
    }
  },

  timeExpired: (color) => {
    const winner = color === 'w' ? 'Black' : 'White';
    set({
      gameOver: true,
      gameOverMessage: `Time expired! ${winner} wins!`,
      timerRunning: false,
      disableBoard: true,
    });
  },

  tickTimer: () => {
    const { activeColor, whiteTime, blackTime, timerRunning, gameOver } = get();
    if (!timerRunning || gameOver) return;
    if (activeColor === 'w') {
      const newTime = whiteTime - 1;
      if (newTime <= 0) {
        set({ whiteTime: 0 });
        get().timeExpired('w');
      } else {
        set({ whiteTime: newTime });
      }
    } else {
      const newTime = blackTime - 1;
      if (newTime <= 0) {
        set({ blackTime: 0 });
        get().timeExpired('b');
      } else {
        set({ blackTime: newTime });
      }
    }
  },

  undoMove: () => {
    const { chessInstance, moveHistory, capturedByWhite, capturedByBlack } = get();
    if (!chessInstance || moveHistory.length === 0) return;
    chessInstance.undo();
    const newHistory = moveHistory.slice(0, -1);

    // Rebuild captures from history
    const newCapturedByWhite = capturedByWhite.slice(0, -0); // approximate
    const newCapturedByBlack = capturedByBlack.slice(0, -0);

    const lastMove = newHistory.length > 0 ? {
      from: newHistory[newHistory.length - 1].from,
      to: newHistory[newHistory.length - 1].to,
    } : null;

    let underCheck = null;
    if (chessInstance.inCheck()) {
      const turn = chessInstance.turn();
      const board = chessInstance.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const sq = board[r][c];
          if (sq && sq.type === 'k' && sq.color === turn) {
            underCheck = { row: r, col: c };
          }
        }
      }
    }

    set({
      boardState: buildBoardState(chessInstance),
      moveHistory: newHistory,
      currentMoveIndex: newHistory.length - 1,
      selectedSquare: null,
      validMoves: [],
      lastMove,
      underCheck,
      activeColor: chessInstance.turn(),
      gameOver: false,
      gameOverMessage: '',
      disableBoard: false,
    });
  },

  redoMove: () => {
    // Redo is handled by navigating history
    const { currentMoveIndex, moveHistory } = get();
    if (currentMoveIndex < moveHistory.length - 1) {
      get().goToMove(currentMoveIndex + 1);
    }
  },

  goToMove: (index) => {
    const { moveHistory } = get();
    if (index < -1 || index >= moveHistory.length) return;

    // Reconstruct chess state at move index
    const chess = new Chess();
    for (let i = 0; i <= index; i++) {
      const move = moveHistory[i];
      const fromFile = String.fromCharCode('a'.charCodeAt(0) + move.from.col);
      const fromRank = String(8 - move.from.row);
      const toFile = String.fromCharCode('a'.charCodeAt(0) + move.to.col);
      const toRank = String(8 - move.to.row);
      // Get san to extract promotion if any
      const san = move.san;
      const promotion = san.includes('=') ? san.split('=')[1][0].toLowerCase() : undefined;
      chess.move({ from: fromFile + fromRank, to: toFile + toRank, promotion });
    }

    const lastMove = index >= 0 ? {
      from: moveHistory[index].from,
      to: moveHistory[index].to,
    } : null;

    let underCheck = null;
    if (chess.inCheck()) {
      const turn = chess.turn();
      const board = chess.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const sq = board[r][c];
          if (sq && sq.type === 'k' && sq.color === turn) {
            underCheck = { row: r, col: c };
          }
        }
      }
    }

    set({
      boardState: buildBoardState(chess),
      currentMoveIndex: index,
      selectedSquare: null,
      validMoves: [],
      lastMove,
      underCheck,
    });
  },

  importPgn: (pgnStr) => {
    const chess = new Chess();
    try {
      chess.loadPgn(pgnStr);
    } catch (e) {
      return false;
    }

    const history = chess.history({ verbose: true });
    const newChess = new Chess();
    const moves = [];

    history.forEach((m, i) => {
      newChess.move(m);
      const fromR = 8 - parseInt(m.from[1]);
      const fromC = m.from.charCodeAt(0) - 'a'.charCodeAt(0);
      const toR = 8 - parseInt(m.to[1]);
      const toC = m.to.charCodeAt(0) - 'a'.charCodeAt(0);
      moves.push({
        san: m.san,
        from: { row: fromR, col: fromC },
        to: { row: toR, col: toC },
        color: m.color,
        fen: newChess.fen(),
        moveNumber: Math.floor(i / 2) + 1,
      });
    });

    set({
      chessInstance: chess,
      boardState: buildBoardState(chess),
      moveHistory: moves,
      currentMoveIndex: moves.length - 1,
      selectedSquare: null,
      validMoves: [],
      lastMove: moves.length > 0 ? { from: moves[moves.length-1].from, to: moves[moves.length-1].to } : null,
      gameStarted: true,
      gameOver: false,
    });
    return true;
  },

  setCompThinking: (val) => set({ compThinking: val }),
  setDisableBoard: (val) => set({ disableBoard: val }),
  setFlipped: (val) => set({ flipped: val }),
  setShowLabels: (val) => set({ showLabels: val }),
  setHighlightLastMove: (val) => set({ highlightLastMove: val }),
  setHighlightSelected: (val) => set({ highlightSelected: val }),
  setShowLegalDots: (val) => set({ showLegalDots: val }),
  setDotSize: (val) => set({ dotSize: val }),
  setOppName: (val) => set({ oppName: val }),
  setYouName: (val) => set({ youName: val }),
  setTimerRunning: (val) => set({ timerRunning: val }),

  getPgn: () => {
    const { chessInstance } = get();
    return chessInstance ? chessInstance.pgn() : '';
  },

  getFen: () => {
    const { chessInstance } = get();
    return chessInstance ? chessInstance.fen() : '';
  },
}));

export default useGameStore;
