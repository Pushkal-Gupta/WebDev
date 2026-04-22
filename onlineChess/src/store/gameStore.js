import { create } from 'zustand';
import { Chess } from 'chess.js';
import { playSoundForMove, playSound } from '../utils/soundManager';

// Persist display preferences to localStorage
const PREFS_KEY = 'chess_display_prefs';
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}
function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
}
const savedPrefs = loadPrefs();

// chess.js piece type => image filename part
const PIECE_NAME_MAP = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};

const COLOR_MAP = { w: 'white', b: 'black' };

function buildBoardState(chess) {
  return chess.board();
}

function findCheck(chess) {
  if (!chess.inCheck()) return null;
  const turn = chess.turn();
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (sq && sq.type === 'k' && sq.color === turn) {
        return { row: r, col: c };
      }
    }
  }
  return null;
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
  showLabels: savedPrefs.showLabels ?? true,
  coordinateDisplay: savedPrefs.coordinateDisplay ?? (savedPrefs.showLabels === false ? 'none' : 'inside'),
  highlightLastMove: savedPrefs.highlightLastMove ?? true,
  highlightSelected: savedPrefs.highlightSelected ?? true,
  showLegalDots: savedPrefs.showLegalDots ?? true,
  dotSize: savedPrefs.dotSize ?? 12,
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
  isCoachGame: false,      // true when playing the "Play with Coach" mode
  selectedCoachId: null,   // id from src/data/coaches.js
  selectedBotId: null,     // id from src/data/bots.js — set when a bot game starts
  isOnline: false,
  onlineColor: 'white', // local player's color in online game
  pawnPromotion: null, // { from, to } pending promotion
  disableBoard: false,
  capturedByWhite: [], // pieces captured by white
  capturedByBlack: [],
  oppName: 'Opponent',
  youName: 'You (White)',
  turnStartWhite: 0,
  turnStartBlack: 0,
  delayRemaining: 0,
  // Rating / result tracking
  gameResult: null,       // { winner: 'white'|'black'|'draw', reason: string }
  gameCategory: null,     // 'bullet'|'blitz'|'rapid'|'classical' — derived from timeControl
  onlineOpponentId: null, // opponent's auth user ID (set when online game starts)
  premove: null,          // { from: {row,col}, to: {row,col}|null } — queued premove
  illegalMoveAt: 0,       // timestamp of last illegal move attempt (triggers shake)
  lastMoveIsNew: false,   // true only when a real move was made (not undo/navigation)
  variation: [],          // analysis side-line (alt-move tangent); cleared via clearVariation()
};

const useGameStore = create((set, get) => ({
  ...initialState,

  init: () => {
    const chess = new Chess();
    set({
      ...initialState,
      chessInstance: chess,
      boardState: buildBoardState(chess),
      turnStartWhite: 0,
      turnStartBlack: 0,
      delayRemaining: 0,
    });
  },

  startGame: (timeControl, isComp = false, compColor = 'black', compStrength = 4, opts = {}) => {
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
      turnStartWhite: total,
      turnStartBlack: total,
      delayRemaining: (timeControl?.delayType === 'simple' ? (timeControl?.delay || 0) : 0),
      isComp,
      compColor,
      compStrength,
      compThinking: false,
      isCoachGame: !!opts.isCoachGame,
      selectedCoachId: opts.coachId || null,
      selectedBotId: opts.botId || null,
      pawnPromotion: null,
      disableBoard: false,
      capturedByWhite: [],
      capturedByBlack: [],
      flipped: isComp && compColor === 'white',
      youName: isComp ? (compColor === 'white' ? 'You (Black)' : 'You (White)') : 'You (White)',
      gameResult: null,
      gameCategory: timeControl?.cat?.toLowerCase() || null,
      onlineOpponentId: null,
      premove: null,
    });
  },

  startOnlineGame: (timeControl, playerColor) => {
    const chess = new Chess();
    const total = timeControl ? timeControl.total : 0;
    const isBlack = playerColor === 'black';
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
      turnStartWhite: total,
      turnStartBlack: total,
      delayRemaining: (timeControl?.delayType === 'simple' ? (timeControl?.delay || 0) : 0),
      isComp: false,
      isOnline: true,
      onlineColor: playerColor,
      compThinking: false,
      isCoachGame: false,
      selectedCoachId: null,
      selectedBotId: null,
      pawnPromotion: null,
      disableBoard: isBlack, // black waits for white to move first
      capturedByWhite: [],
      capturedByBlack: [],
      flipped: isBlack,
      oppName: 'Opponent',
      youName: isBlack ? 'You (Black)' : 'You (White)',
      gameResult: null,
      gameCategory: timeControl?.cat?.toLowerCase() || null,
      onlineOpponentId: null,
      premove: null,
    });
  },

  selectSquare: (row, col) => {
    const { chessInstance, selectedSquare, validMoves, gameOver, disableBoard, activeColor, isComp, compColor, isOnline, onlineColor, currentMoveIndex, moveHistory, premove } = get();
    if (!chessInstance || gameOver) return;

    // Live games (computer / online): refuse clicks while viewing history.
    // Analysis / local mode: allow — playing will branch from the current
    // displayed position (makeMove truncates future history).
    const isLive = isComp || isOnline;
    if (isLive && currentMoveIndex !== moveHistory.length - 1 && moveHistory.length > 0) return;

    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = String(8 - row);
    const square = file + rank;
    const piece = chessInstance.get(square);
    const turn = chessInstance.turn();

    // Determine if it's the opponent's turn (premove mode)
    let myColor = null;
    let isOpponentTurn = false;
    if (isComp) {
      myColor = compColor === 'white' ? 'b' : 'w';
      isOpponentTurn = turn !== myColor;
    } else if (isOnline) {
      myColor = onlineColor === 'white' ? 'w' : 'b';
      isOpponentTurn = turn !== myColor;
    }

    // ── Premove mode: opponent's turn ──────────────────────────────────────────
    // Chess.com / Lichess UX:
    //   • click own piece → premove source (highlight)
    //   • click legal destination for that piece → premove destination (ghost + arrow)
    //   • click source again → cancel
    //   • click a different own piece → replace source
    //   • click illegal / unrelated square → do NOTHING (don't clobber premove)
    if (isOpponentTurn && (isComp || isOnline)) {
      const pmFrom = premove?.from;

      // Helper: legal destinations from pmFrom, computed on a FEN where it IS
      // our turn (chess.js would otherwise refuse to list moves for a piece
      // whose side isn't to move).
      const legalDestsFromPremoveSrc = () => {
        if (!pmFrom) return [];
        const fromFile = String.fromCharCode('a'.charCodeAt(0) + pmFrom.col);
        const fromRank = String(8 - pmFrom.row);
        const fromSq = fromFile + fromRank;
        try {
          const parts = chessInstance.fen().split(' ');
          parts[1] = myColor;
          const Chess = chessInstance.constructor;
          const tmp = new Chess();
          // Some FENs won't be loadable when it's "our turn" while opponent
          // is also in check, etc. — swallow and fall back to empty list.
          if (!tmp.load(parts.join(' '))) return [];
          const moves = tmp.moves({ square: fromSq, verbose: true }) || [];
          return moves.map(m => ({
            row: 8 - parseInt(m.to[1], 10),
            col: m.to.charCodeAt(0) - 'a'.charCodeAt(0),
          }));
        } catch {
          return [];
        }
      };

      if (pmFrom) {
        // Same source square → cancel premove entirely.
        if (pmFrom.row === row && pmFrom.col === col) {
          set({ premove: null });
          return;
        }
        // Another own piece → replace source (clears any previous destination).
        if (piece && piece.color === myColor) {
          set({ premove: { from: { row, col }, to: null, piece: { type: piece.type, color: piece.color } } });
          return;
        }
        // Only accept squares that are LEGAL destinations for the premoved
        // piece — prevents stray clicks from setting random blue "ghost" squares.
        const legal = legalDestsFromPremoveSrc();
        const isLegal = legal.some((m) => m.row === row && m.col === col);
        if (isLegal) {
          set({ premove: { ...get().premove, from: pmFrom, to: { row, col } } });
        }
        // Illegal clicks are ignored — keeps the existing premove intact.
        return;
      }

      // No premove source yet.
      if (piece && piece.color === myColor) {
        set({ premove: { from: { row, col }, to: null, piece: { type: piece.type, color: piece.color } } });
      } else {
        // Click on empty / opponent square with no premove: clear stale state.
        set({ premove: null });
      }
      return;
    }

    // ── Normal mode: player's turn ────────────────────────────────────────────
    if (premove) set({ premove: null });
    if (disableBoard) return;

    // If clicking a valid move square
    const isValidMove = validMoves.some(m => m.row === row && m.col === col);
    if (selectedSquare && isValidMove) {
      get().makeMove(selectedSquare, { row, col });
      return;
    }

    // Can't select opponent's piece
    if (!piece || piece.color !== turn) {
      set({ selectedSquare: null, validMoves: [], pawnPromotion: null });
      return;
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

  makeMove: (from, to, promotion = null, _bypassValidation = false) => {
    const { chessInstance, moveHistory, timeControl, whiteTime, blackTime, activeColor, timerData, capturedByWhite, capturedByBlack } = get();
    if (!chessInstance) return false;

    // Validate that the move is allowed (skip for engine/online incoming moves)
    if (!_bypassValidation) {
      const { gameOver, disableBoard, gameStarted, isComp, compColor, isOnline, onlineColor, currentMoveIndex: ci, moveHistory: mh } = get();
      if (!gameStarted || gameOver || disableBoard) return false;
      const isLive = isComp || isOnline;
      // Live games: refuse moves from a historical position.
      // Analysis/local: allow branching — the move replaces the future.
      if (isLive && ci !== mh.length - 1 && mh.length > 0) return false;
      const turn = chessInstance.turn();
      if (isComp) {
        const isCompTurn = (compColor === 'white' && turn === 'w') || (compColor === 'black' && turn === 'b');
        if (isCompTurn) return false;
      }
      if (isOnline) {
        const isMyTurn = (onlineColor === 'white' && turn === 'w') || (onlineColor === 'black' && turn === 'b');
        if (!isMyTurn) return false;
      }
    }

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
    if (!result) {
      // Illegal move — trigger shake feedback + sound
      if (!_bypassValidation) {
        playSound('illegal');
        set({ illegalMoveAt: Date.now() });
      }
      return false;
    }

    // Play sound effect
    playSoundForMove(result, chessInstance);

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
    const { turnStartWhite, turnStartBlack } = get();
    let newWhiteTime = whiteTime;
    let newBlackTime = blackTime;
    if (timeControl) {
      const dt = timeControl.delayType || 'fischer';
      const inc = timeControl.delay ?? timeControl.incr ?? 0;
      if (dt === 'fischer' || (dt !== 'bronstein' && dt !== 'simple' && dt !== 'none' && timeControl.incr)) {
        if (result.color === 'w') newWhiteTime += inc;
        else newBlackTime += inc;
      } else if (dt === 'bronstein' && inc > 0) {
        if (result.color === 'w') {
          const spent = Math.max(0, turnStartWhite - whiteTime);
          newWhiteTime += Math.min(spent, inc);
        } else {
          const spent = Math.max(0, turnStartBlack - blackTime);
          newBlackTime += Math.min(spent, inc);
        }
      }
      // none and simple: no increment on move
    }
    const newTurnStartWhite = result.color === 'b' ? newWhiteTime : turnStartWhite;
    const newTurnStartBlack = result.color === 'w' ? newBlackTime : turnStartBlack;
    const newDelayRemaining = timeControl?.delayType === 'simple' ? (timeControl?.delay || 0) : 0;

    // Build move history entry
    const newMove = {
      san: result.san,
      from: { row: from.row, col: from.col },
      to: { row: to.row, col: to.col },
      color: result.color,
      fen: chessInstance.fen(),
      moveNumber: Math.floor(moveHistory.length / 2) + 1,
    };

    // ── Analysis-mode branching ─────────────────────────────────────────
    // If the user played from a historical position (analysis/local mode),
    // do NOT touch the original game. Push the move onto `variation` instead
    // — a parallel side-line shown in grey. Calling `clearVariation()` returns
    // to the main game.
    const { currentMoveIndex: curIdx, isComp: _isComp, isOnline: _isOnline, variation: _variation } = get();
    const _isLive = _isComp || _isOnline;
    const _branching = !_isLive && curIdx < moveHistory.length - 1 && moveHistory.length > 0;
    const _onVariation = !_isLive && (_variation?.length > 0);
    if (_branching || _onVariation) {
      const nextVar = [...(_variation || []), newMove];
      set({
        boardState: buildBoardState(chessInstance),
        variation: nextVar,
        selectedSquare: null,
        validMoves: [],
        lastMove: {
          from, to,
          pieceType: piece?.type || result.piece,
          pieceColor: result.color,
          flags: result.flags || '',
          san: result.san,
        },
        lastMoveIsNew: true,
        underCheck: findCheck(chessInstance),
        activeColor: chessInstance.turn(),
        pawnPromotion: null,
        disableBoard: false,
      });
      return true;
    }
    const newHistory = [...moveHistory, newMove];

    // Check state
    const underCheck = findCheck(chessInstance);

    set({
      boardState: buildBoardState(chessInstance),
      moveHistory: newHistory,
      currentMoveIndex: newHistory.length - 1,
      selectedSquare: null,
      validMoves: [],
      lastMove: {
        from, to,
        pieceType: piece?.type || result.piece,  // source piece type (before promotion)
        pieceColor: result.color,
        flags: result.flags || '',               // 'k'=kingside castle, 'q'=queenside, 'e'=en passant, 'p'=promotion
        san: result.san,
      },
      lastMoveIsNew: true,
      underCheck,
      activeColor: chessInstance.turn(),
      whiteTime: newWhiteTime,
      blackTime: newBlackTime,
      timerData: newTimerData,
      turnStartWhite: newTurnStartWhite,
      turnStartBlack: newTurnStartBlack,
      delayRemaining: newDelayRemaining,
      pawnPromotion: null,
      premove: null,
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
    get().makeMove(pawnPromotion.from, pawnPromotion.to, piece, true);
  },

  checkGameOver: () => {
    const { chessInstance, gameOver } = get();
    if (gameOver) return;
    if (!chessInstance) return;

    let message = '';
    let gameResult = null;
    if (chessInstance.isCheckmate()) {
      const winner = chessInstance.turn() === 'w' ? 'Black' : 'White';
      message = `Checkmate! ${winner} wins!`;
      gameResult = { winner: winner.toLowerCase(), reason: 'checkmate' };
    } else if (chessInstance.isStalemate()) {
      message = 'Stalemate! Draw.';
      gameResult = { winner: 'draw', reason: 'stalemate' };
    } else if (chessInstance.isDraw()) {
      message = 'Draw!';
      gameResult = { winner: 'draw', reason: 'draw' };
    }

    if (message) {
      set({ gameOver: true, gameOverMessage: message, timerRunning: false, disableBoard: true, gameResult, compThinking: false, premove: null });
    }
  },

  timeExpired: (color) => {
    if (get().gameOver) return; // guard against double-call
    const winner = color === 'w' ? 'Black' : 'White';
    set({
      gameOver: true,
      gameOverMessage: `Time expired! ${winner} wins!`,
      timerRunning: false,
      disableBoard: true,
      compThinking: false,
      premove: null,
      gameResult: { winner: winner.toLowerCase(), reason: 'timeout' },
    });
  },

  tickTimer: (deltaMs = 100) => {
    const { activeColor, whiteTime, blackTime, timerRunning, gameOver, timeControl, delayRemaining } = get();
    if (!timerRunning || gameOver) return;
    // Simple delay: hold clock for delay period at start of each turn
    if (timeControl?.delayType === 'simple' && delayRemaining > 0) {
      set({ delayRemaining: Math.max(0, delayRemaining - deltaMs) });
      return;
    }
    if (activeColor === 'w') {
      const newTime = whiteTime - deltaMs;
      if (newTime <= 0) { set({ whiteTime: 0 }); get().timeExpired('w'); }
      else set({ whiteTime: newTime });
    } else {
      const newTime = blackTime - deltaMs;
      if (newTime <= 0) { set({ blackTime: 0 }); get().timeExpired('b'); }
      else set({ blackTime: newTime });
    }
  },

  // Rebuild captured-pieces arrays by replaying a history slice from scratch
  _rebuildCaptures: (history) => {
    const tempChess = new Chess();
    const capturedByWhite = [];
    const capturedByBlack = [];
    for (const move of history) {
      const fromFile = String.fromCharCode('a'.charCodeAt(0) + move.from.col);
      const fromRank = String(8 - move.from.row);
      const toFile   = String.fromCharCode('a'.charCodeAt(0) + move.to.col);
      const toRank   = String(8 - move.to.row);
      const promotion = move.san.includes('=') ? move.san.split('=')[1][0].toLowerCase() : undefined;
      const result = tempChess.move({ from: fromFile + fromRank, to: toFile + toRank, promotion });
      if (result?.captured) {
        const cp = { type: result.captured, color: result.color === 'w' ? 'b' : 'w' };
        if (result.color === 'w') capturedByWhite.push(cp);
        else capturedByBlack.push(cp);
      }
    }
    return { capturedByWhite, capturedByBlack };
  },

  undoMove: () => {
    const { chessInstance, moveHistory } = get();
    if (!chessInstance || moveHistory.length === 0) return;
    chessInstance.undo();
    const newHistory = moveHistory.slice(0, -1);

    const { capturedByWhite: newCapturedByWhite, capturedByBlack: newCapturedByBlack } =
      get()._rebuildCaptures(newHistory);

    const lastMove = newHistory.length > 0 ? {
      from: newHistory[newHistory.length - 1].from,
      to: newHistory[newHistory.length - 1].to,
    } : null;

    const underCheck = findCheck(chessInstance);

    set({
      boardState: buildBoardState(chessInstance),
      moveHistory: newHistory,
      currentMoveIndex: newHistory.length - 1,
      selectedSquare: null,
      validMoves: [],
      lastMove,
      lastMoveIsNew: false,
      underCheck,
      activeColor: chessInstance.turn(),
      gameOver: false,
      gameOverMessage: '',
      gameResult: null,
      disableBoard: false,
      capturedByWhite: newCapturedByWhite,
      capturedByBlack: newCapturedByBlack,
    });
  },

  // Undo two half-moves (one for each player) — used for computer undo and online undo-request
  undoTwoMoves: () => {
    const { chessInstance, moveHistory } = get();
    if (!chessInstance || moveHistory.length === 0) return;
    const count = moveHistory.length >= 2 ? 2 : 1;
    for (let i = 0; i < count; i++) chessInstance.undo();
    const newHistory = moveHistory.slice(0, -count);

    const { capturedByWhite: newCapturedByWhite, capturedByBlack: newCapturedByBlack } =
      get()._rebuildCaptures(newHistory);

    const lastMove = newHistory.length > 0 ? {
      from: newHistory[newHistory.length - 1].from,
      to:   newHistory[newHistory.length - 1].to,
    } : null;

    let underCheck = null;
    if (chessInstance.inCheck()) {
      const turn = chessInstance.turn();
      const board = chessInstance.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const sq = board[r][c];
          if (sq && sq.type === 'k' && sq.color === turn) underCheck = { row: r, col: c };
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
      lastMoveIsNew: false,
      underCheck,
      activeColor: chessInstance.turn(),
      gameOver: false,
      gameOverMessage: '',
      gameResult: null,
      disableBoard: false,
      capturedByWhite: newCapturedByWhite,
      capturedByBlack: newCapturedByBlack,
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
    const { moveHistory, currentMoveIndex: prevIdx } = get();
    if (index < -1 || index >= moveHistory.length) return;
    if (index === prevIdx) return; // no-op if already there

    // Reconstruct chess state at move index
    const chess = new Chess();
    let lastResult = null;
    for (let i = 0; i <= index; i++) {
      const move = moveHistory[i];
      const fromFile = String.fromCharCode('a'.charCodeAt(0) + move.from.col);
      const fromRank = String(8 - move.from.row);
      const toFile = String.fromCharCode('a'.charCodeAt(0) + move.to.col);
      const toRank = String(8 - move.to.row);
      const san = move.san;
      const promotion = san.includes('=') ? san.split('=')[1][0].toLowerCase() : undefined;
      lastResult = chess.move({ from: fromFile + fromRank, to: toFile + toRank, promotion });
    }

    // Play sound for the move being navigated to
    if (index >= 0 && lastResult) {
      if (chess.inCheck()) playSound('check');
      else if (lastResult.san.includes('O-O')) playSound('castle');
      else if (lastResult.san.includes('=')) playSound('promote');
      else if (lastResult.captured) playSound('capture');
      else playSound('move');
    }

    const lastMove = (index >= 0 && lastResult) ? {
      from: moveHistory[index].from,
      to: moveHistory[index].to,
      pieceType: lastResult.piece,
      pieceColor: lastResult.color,
      flags: lastResult.flags || '',
      san: lastResult.san,
    } : null;

    const underCheck = findCheck(chess);

    const { isComp, isOnline } = get();
    const isLive = isComp || isOnline;
    const isLatest = index === moveHistory.length - 1;

    set({
      boardState: buildBoardState(chess),
      currentMoveIndex: index,
      selectedSquare: null,
      validMoves: [],
      lastMove,
      lastMoveIsNew: false,
      underCheck,
      activeColor: chess.turn(),
      // Navigating in the main move list always drops any active variation
      // (analysis side-line) so we land on a clean main-game position.
      variation: [],
      // In live games, keep chessInstance pinned to the latest played position
      // so clicks can't alter history. In analysis/local mode, always sync
      // chessInstance to the displayed position — enables playing alternative
      // moves from any point in the game.
      ...((!isLive || isLatest) ? { chessInstance: chess } : {}),
    });
  },

  // Drop any in-progress analysis side-line and snap back to the main game's
  // current move index.
  clearVariation: () => {
    const { moveHistory, currentMoveIndex } = get();
    set({ variation: [] });
    // Re-sync to the main-game position the user was on before exploring.
    if (currentMoveIndex >= 0 && currentMoveIndex < moveHistory.length) {
      get().goToMove(currentMoveIndex);
    } else if (moveHistory.length > 0) {
      get().goToMove(moveHistory.length - 1);
    }
  },

  importPgn: (pgnStr) => {
    const chess = new Chess();
    try {
      chess.loadPgn(pgnStr);
    } catch (e) {
      return false;
    }

    const history = chess.history({ verbose: true });
    if (history.length === 0) {
      set({
        chessInstance: chess,
        boardState: buildBoardState(chess),
        moveHistory: [],
        currentMoveIndex: -1,
        selectedSquare: null,
        validMoves: [],
        lastMove: null,
        gameStarted: true,
        gameOver: false,
      });
      return true;
    }
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

  // ── Premove ─────────────────────────────────────────────────────────────────
  clearPremove: () => set({ premove: null }),

  executePremove: () => {
    const { premove, gameOver, chessInstance, isComp, compColor, isOnline, onlineColor } = get();
    if (!premove?.from || !premove?.to || gameOver || !chessInstance) {
      set({ premove: null });
      return false;
    }
    // Verify it's the player's turn before executing
    const turn = chessInstance.turn();
    if (isComp) {
      const isCompTurn = (compColor === 'white' && turn === 'w') || (compColor === 'black' && turn === 'b');
      if (isCompTurn) { set({ premove: null }); return false; }
    }
    if (isOnline) {
      const isMyTurn = (onlineColor === 'white' && turn === 'w') || (onlineColor === 'black' && turn === 'b');
      if (!isMyTurn) { set({ premove: null }); return false; }
    }
    const pm = premove;
    // Ensure board is interactive and clear the premove
    set({ premove: null, disableBoard: false });
    // Check if this is a pawn promotion premove — auto-promote to queen
    const fromFile = String.fromCharCode('a'.charCodeAt(0) + pm.from.col);
    const fromRank = String(8 - pm.from.row);
    const toRank = String(8 - pm.to.row);
    const piece = chessInstance.get(fromFile + fromRank);
    const needsPromo = piece && piece.type === 'p' &&
      ((piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1'));
    return get().makeMove(pm.from, pm.to, needsPromo ? 'q' : null);
  },
  setGameResult: (val) => set({ gameResult: val }),
  setOnlineOpponentId: (val) => set({ onlineOpponentId: val }),
  setFlipped: (val) => set({ flipped: val }),
  setShowLabels: (val) => { set({ showLabels: val }); const p = loadPrefs(); p.showLabels = val; savePrefs(p); },
  setCoordinateDisplay: (val) => { set({ coordinateDisplay: val, showLabels: val !== 'none' }); const p = loadPrefs(); p.coordinateDisplay = val; p.showLabels = val !== 'none'; savePrefs(p); },
  setHighlightLastMove: (val) => { set({ highlightLastMove: val }); const p = loadPrefs(); p.highlightLastMove = val; savePrefs(p); },
  setHighlightSelected: (val) => { set({ highlightSelected: val }); const p = loadPrefs(); p.highlightSelected = val; savePrefs(p); },
  setShowLegalDots: (val) => { set({ showLegalDots: val }); const p = loadPrefs(); p.showLegalDots = val; savePrefs(p); },
  setDotSize: (val) => { set({ dotSize: val }); const p = loadPrefs(); p.dotSize = val; savePrefs(p); },
  setOppName: (val) => set({ oppName: val }),
  setYouName: (val) => set({ youName: val }),
  setTimerRunning: (val) => set({ timerRunning: val }),

  getPgn: () => {
    const { chessInstance, youName, oppName, isComp, compColor, isOnline, onlineColor } = get();
    if (!chessInstance) return '';
    let whiteName, blackName;
    if (isComp) {
      whiteName = compColor === 'white' ? (oppName || 'Computer') : (youName || 'You');
      blackName = compColor === 'black' ? (oppName || 'Computer') : (youName || 'You');
    } else if (isOnline) {
      whiteName = onlineColor === 'white' ? (youName || 'You') : (oppName || 'Opponent');
      blackName = onlineColor === 'black' ? (youName || 'You') : (oppName || 'Opponent');
    } else {
      whiteName = 'White';
      blackName = 'Black';
    }
    whiteName = whiteName.replace(/\s*\((?:White|Black)\)\s*$/, '');
    blackName = blackName.replace(/\s*\((?:White|Black)\)\s*$/, '');
    chessInstance.header('White', whiteName, 'Black', blackName);
    return chessInstance.pgn();
  },

  getFen: () => {
    const { chessInstance } = get();
    return chessInstance ? chessInstance.fen() : '';
  },
}));

export default useGameStore;
