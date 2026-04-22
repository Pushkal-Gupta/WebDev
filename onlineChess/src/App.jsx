import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import LeftNav from './components/LeftNav/LeftNav';
import Board from './components/Board/Board';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import RightSidebar from './components/RightSidebar/RightSidebar';
import LoginModal from './components/modals/LoginModal';
import LogoutModal from './components/modals/LogoutModal';
import GameOverModal from './components/modals/GameOverModal';
import StrengthModal from './components/modals/StrengthModal';
import PromotionModal from './components/modals/PromotionModal';
import ConfirmModal from './components/modals/ConfirmModal';
import CustomAlert from './components/modals/CustomAlert';
import Chat from './components/Chat/Chat';
import useGameStore from './store/gameStore';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import useRatingStore from './store/ratingStore';
import useMatchmakingStore from './store/matchmakingStore';
import useNotificationStore from './store/notificationStore';
import { getBotByStrength } from './data/bots';
import { p2p } from './utils/p2pService';
import useFriendStore from './store/friendStore';
// getBestMove moved to useComputerAI hook
import usePrefsStore from './store/prefsStore';
import { setSoundToggles, setSoundTheme as initSoundTheme } from './utils/soundManager';
import { postGame, getGames } from './utils/gameServer';
import { supabase } from './utils/supabase';
import { getSuggestion } from './utils/localAI';
import { reviewGame } from './utils/reviewEngine';
import useComputerAI from './hooks/useComputerAI';
import useGameTimer from './hooks/useGameTimer';
import { submitMove as serverSubmitMove } from './utils/serverMoveService';
import { requestRatingUpdate } from './utils/serverRatingService';
import {
  createRoom, joinRoom, subscribeToRoom,
  broadcastMove as bcastMove, broadcastChat, broadcastResign, broadcastJoin,
  broadcastUndoRequest, broadcastUndoResponse,
  endRoom, unsubscribe, sqToRowCol, rowColToSq, updateRoomFen,
} from './utils/multiplayerService';

// ─── Lazy-loaded route components (code-split into separate chunks) ──────────
const AnalysisBoard  = lazy(() => import('./components/AnalysisBoard/AnalysisBoard'));
const PuzzlePage     = lazy(() => import('./components/Puzzles/PuzzlePage'));
const OnlineLobby    = lazy(() => import('./components/OnlineLobby/OnlineLobby'));
const SpectateList   = lazy(() => import('./components/Spectate/SpectateList'));
const FriendsPage    = lazy(() => import('./components/Friends/FriendsPage'));
const LeaderboardPage = lazy(() => import('./components/Leaderboard/LeaderboardPage'));
const TournamentsPage = lazy(() => import('./components/Tournaments/TournamentsPage'));
const ClubsPage      = lazy(() => import('./components/Clubs/ClubsPage'));
const TrainingHub    = lazy(() => import('./components/Training/TrainingHub'));
const ComputerSetup  = lazy(() => import('./components/ComputerSetup/ComputerSetup'));
const CoachSetup     = lazy(() => import('./components/CoachSetup/CoachSetup'));
const SettingsPage   = lazy(() => import('./components/Settings/SettingsPage'));
const P2PSetup       = lazy(() => import('./components/P2PPlay/P2PSetup'));
const P2PGame        = lazy(() => import('./components/P2PPlay/P2PGame'));
const RatingCard     = lazy(() => import('./components/Profile/RatingCard'));

// ─── Time presets ─────────────────────────────────────────────────────────────
// Time presets — all values in MILLISECONDS
const TC_PRESETS = [
  { display: '1+0',   total: 60_000,    incr: 0,      cat: 'Bullet',    delayType: 'none', delay: 0 },
  { display: '1+1',   total: 60_000,    incr: 1_000,  cat: 'Bullet',    delayType: 'fischer', delay: 1_000 },
  { display: '2+1',   total: 120_000,   incr: 1_000,  cat: 'Bullet',    delayType: 'fischer', delay: 1_000 },
  { display: '3+0',   total: 180_000,   incr: 0,      cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '3+2',   total: 180_000,   incr: 2_000,  cat: 'Blitz',     delayType: 'fischer', delay: 2_000 },
  { display: '5+0',   total: 300_000,   incr: 0,      cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '5+3',   total: 300_000,   incr: 3_000,  cat: 'Blitz',     delayType: 'fischer', delay: 3_000 },
  { display: '10+0',  total: 600_000,   incr: 0,      cat: 'Rapid',     delayType: 'none', delay: 0 },
  { display: '10+5',  total: 600_000,   incr: 5_000,  cat: 'Rapid',     delayType: 'fischer', delay: 5_000 },
  { display: '15+10', total: 900_000,   incr: 10_000, cat: 'Rapid',     delayType: 'fischer', delay: 10_000 },
  { display: '30+0',  total: 1_800_000, incr: 0,      cat: 'Classical', delayType: 'none', delay: 0 },
  { display: '30+20', total: 1_800_000, incr: 20_000, cat: 'Classical', delayType: 'fischer', delay: 20_000 },
];

const ONLINE_TIME_CONTROLS = TC_PRESETS;

const PATH_TO_TAB = {
  '/': 0, '/play': 1, '/analysis': 2, '/computer': 3, '/online': 4,
  '/account': 5, '/puzzles': 6, '/spectate': 7, '/friends': 8,
  '/clubs': 9, '/tournaments': 10, '/leaderboard': 11, '/p2p': 12, '/training': 13, '/settings': 14,
  '/coach': 15,
};
const TAB_TO_PATH = Object.fromEntries(Object.entries(PATH_TO_TAB).map(([k, v]) => [v, k]));

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = PATH_TO_TAB[location.pathname] ?? 0;
  const setActiveTab = (tab) => navigate(TAB_TO_PATH[tab] || '/');
  const [pendingTimeControl, setPendingTimeControl] = useState(null);
  const [boardArrows, setBoardArrows]       = useState([]);  // hint/coach arrows
  const hintTimeoutRef                      = useRef(null);   // cleanup for hint arrow auto-clear
  const [showLogin, setShowLogin]           = useState(false);
  const [showLogout, setShowLogout]         = useState(false);
  const [showStrength, setShowStrength]     = useState(false);
  const [selectedBot, setSelectedBot]       = useState(null);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [confirmMsg, setConfirmMsg]         = useState('');
  const confirmActionRef                    = useRef(null); // use ref to avoid React functional-update quirks

  // Online undo state
  const [undoRequest, setUndoRequest]       = useState(null); // { playerColor, name } incoming request
  const [undoPending, setUndoPending]       = useState(false); // outgoing request awaiting response
  const undosUsedRef                        = useRef({ white: 0, black: 0 }); // max 2 per player
  const [alertMsg, setAlertMsg]             = useState('');
  const [analysisGames, setAnalysisGames]   = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [reviewResults, setReviewResults]   = useState(null);
  const [isReviewing, setIsReviewing]       = useState(false);
  const [pendingReviewPgn, setPendingReviewPgn] = useState(null);
  const [ratingDelta, setRatingDelta]       = useState(null);
  // gameEval removed — eval bar only in analysis now

  // P2P state
  const [p2pMyColor, setP2pMyColor] = useState(null); // 'w'|'b' — set when connected

  // Online multiplayer state
  const onlineChannelRef      = useRef(null);
  const broadcastedMoveRef    = useRef(-1);
  const [onlineRoom, setOnlineRoom]             = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [chatMessages, setChatMessages]         = useState([]);
  const [isOnlineConnected, setIsOnlineConnected] = useState(false);
  const [onlineTimeControl, setOnlineTimeControl] = useState(null);

  // ─── Stores ────────────────────────────────────────────────────────────────
  const { user, token, username, init: initAuth } = useAuthStore();

  // ── Game store selectors (subscribe only to what's needed) ──
  const gameStarted = useGameStore(s => s.gameStarted);
  const gameOver = useGameStore(s => s.gameOver);
  const gameOverMessage = useGameStore(s => s.gameOverMessage);
  const startGame = useGameStore(s => s.startGame);
  const startOnlineGame = useGameStore(s => s.startOnlineGame);
  const initGame = useGameStore(s => s.init);
  const pawnPromotion = useGameStore(s => s.pawnPromotion);
  const completePromotion = useGameStore(s => s.completePromotion);
  const isComp = useGameStore(s => s.isComp);
  const compColor = useGameStore(s => s.compColor);
  const compStrength = useGameStore(s => s.compStrength);
  const chessInstance = useGameStore(s => s.chessInstance);
  const activeColor = useGameStore(s => s.activeColor);
  const timerData = useGameStore(s => s.timerData);
  const oppName = useGameStore(s => s.oppName);
  const youName = useGameStore(s => s.youName);
  const moveHistory = useGameStore(s => s.moveHistory);
  const currentMoveIndex = useGameStore(s => s.currentMoveIndex);
  const importPgn = useGameStore(s => s.importPgn);
  const undoMove = useGameStore(s => s.undoMove);
  const redoMove = useGameStore(s => s.redoMove);
  const undoTwoMoves = useGameStore(s => s.undoTwoMoves);
  const setFlipped = useGameStore(s => s.setFlipped);
  const getPgn = useGameStore(s => s.getPgn);
  const boardState = useGameStore(s => s.boardState);
  const flipped = useGameStore(s => s.flipped);
  const isOnline = useGameStore(s => s.isOnline);
  const onlineColor = useGameStore(s => s.onlineColor);
  const capturedByWhite = useGameStore(s => s.capturedByWhite);
  const capturedByBlack = useGameStore(s => s.capturedByBlack);
  const whiteTime = useGameStore(s => s.whiteTime);
  const blackTime = useGameStore(s => s.blackTime);
  const timerRunning = useGameStore(s => s.timerRunning);
  const timeControl = useGameStore(s => s.timeControl);
  const gameResult = useGameStore(s => s.gameResult);
  const gameCategory = useGameStore(s => s.gameCategory);
  const onlineOpponentId = useGameStore(s => s.onlineOpponentId);
  const setGameResult = useGameStore(s => s.setGameResult);
  const setOnlineOpponentId = useGameStore(s => s.setOnlineOpponentId);

  const { updateOnlineGameRating, myRatings, loadRatings } = useRatingStore();
  const { status: mmStatus, elapsedSeconds: mmElapsed,
          joinQueue, cancelQueue: cancelMatchmaking, reset: resetMatchmaking } = useMatchmakingStore();
  const { loadNotifications, subscribe: subscribeNotifs,
          unsubscribe: unsubscribeNotifs, unreadCount: notifUnread } = useNotificationStore();
  const { loadFriends, incoming: friendRequests } = useFriendStore();
  const showCapturedPref = usePrefsStore(s => s.showCaptured);

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    initAuth();
    initGame();
    useThemeStore.getState().applyThemeToDOM();
  }, []);

  // ─── Accessibility & sound toggles sync ──────────────────────────────────
  const reducedMotion = usePrefsStore(s => s.reducedMotion);
  const highContrast = usePrefsStore(s => s.highContrast);
  const soundToggles = useThemeStore(s => s.soundToggles);
  const soundTheme = useThemeStore(s => s.soundThemeId);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.reducedMotion = reducedMotion ? 'true' : 'false';
  }, [reducedMotion]);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.highContrast = highContrast ? 'true' : 'false';
  }, [highContrast]);

  useEffect(() => {
    setSoundToggles(soundToggles);
  }, [soundToggles]);

  useEffect(() => {
    initSoundTheme(soundTheme);
  }, [soundTheme]);

  // ─── Load ratings, notifications, friends when user logs in ───────────────
  useEffect(() => {
    if (user?.id) {
      loadRatings(user.id);
      loadNotifications(user.id);
      subscribeNotifs(user.id);
      loadFriends(user.id);
      useThemeStore.getState().loadThemeFromProfile(user.id);
    } else {
      unsubscribeNotifs();
      resetMatchmaking();
      useFriendStore.setState({ friends: [], incoming: [], outgoing: [] });
      if (onlineChannelRef.current) {
        unsubscribe(onlineChannelRef.current);
        onlineChannelRef.current = null;
      }
    }
  }, [user?.id]); // eslint-disable-line

  // ─── Clean up Supabase channels on page unload ───────────────────────────
  useEffect(() => {
    const cleanup = () => {
      if (onlineChannelRef.current) {
        unsubscribe(onlineChannelRef.current);
        onlineChannelRef.current = null;
      }
      resetMatchmaking();
    };
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []); // eslint-disable-line

  // ─── Timer tick (extracted to hook) ──
  useGameTimer();

  // ─── Computer AI (extracted to hook) ───────
  useComputerAI(setAlertMsg);

  // ─── Online: broadcast local moves ────────────────────────────────────────
  useEffect(() => {
    const state = useGameStore.getState();
    if (!state.isOnline || !onlineChannelRef.current || state.moveHistory.length === 0) return;
    if (state.moveHistory.length <= broadcastedMoveRef.current + 1) return;

    const lastMove = state.moveHistory[state.moveHistory.length - 1];
    const ourCode  = state.onlineColor === 'white' ? 'w' : 'b';
    if (lastMove.color !== ourCode) return; // don't re-broadcast opponent's move

    broadcastedMoveRef.current = state.moveHistory.length - 1;

    const from = rowColToSq(lastMove.from.row, lastMove.from.col);
    const to   = rowColToSq(lastMove.to.row,   lastMove.to.col);
    const promotion = lastMove.san.includes('=')
      ? lastMove.san.split('=')[1][0].toLowerCase()
      : undefined;

    const currentFen = useGameStore.getState().getFen();

    // Submit to server for validation (server broadcasts to opponent)
    // Also send legacy broadcast for backwards compatibility
    if (onlineRoom?.id) {
      serverSubmitMove({ roomId: onlineRoom.id, from, to, promotion })
        .catch((err) => {
          // Fallback: broadcast directly if Edge Function unavailable
          bcastMove(onlineChannelRef.current, { from, to, promotion, fen: currentFen })
            .catch(() => {
              console.error('Failed to broadcast move');
              useGameStore.getState().setDisableBoard(false);
            });
        });
      updateRoomFen(onlineRoom.id, currentFen).catch(() => {});
    } else {
      bcastMove(onlineChannelRef.current, { from, to, promotion, fen: currentFen })
        .catch(() => {
          console.error('Failed to broadcast move');
          useGameStore.getState().setDisableBoard(false);
        });
    }

    // Disable board until opponent responds
    if (!state.gameOver) useGameStore.getState().setDisableBoard(true);

    // Any new move clears transient hint/coach arrows
    setBoardArrows((prev) => prev.filter((a) => a.kind !== 'hint'));
  }, [moveHistory.length]);

  // ─── Online: cleanup channel when game ends ───────────────────────────────
  useEffect(() => {
    if (gameOver && isOnline && onlineRoom) {
      endRoom(onlineRoom.id).catch(console.error);
      if (onlineChannelRef.current) {
        unsubscribe(onlineChannelRef.current);
        onlineChannelRef.current = null;
      }
      // Reset undo counters for next game
      undosUsedRef.current = { white: 0, black: 0 };
      setUndoRequest(null);
      setUndoPending(false);
    }
  }, [gameOver]);

  // ─── Save local/computer game on end ─────────────────────────────────────
  useEffect(() => {
    if (gameOver && user && moveHistory.length > 0 && !isOnline) {
      const pgn   = useGameStore.getState().getPgn();
      const color = isComp ? (compColor === 'white' ? 'black' : 'white') : 'white';
      const gr    = useGameStore.getState().gameResult;
      postGame({
        userId: user.id,
        color,
        opponent: oppName,
        timerData,
        pgnStr: pgn,
        result: gr?.winner,
        resultReason: gr?.reason,
        category: gameCategory,
        isRated: false,
      }).catch(console.error);
    }
  }, [gameOver]);

  // ─── Rate + save online game on end ──────────────────────────────────────
  useEffect(() => {
    if (!gameOver || !isOnline || !user) return;
    const gr = useGameStore.getState().gameResult;
    if (!gr) return;

    const store   = useGameStore.getState();
    const myColor = store.onlineColor;
    const cat     = store.gameCategory;
    const oppId   = store.onlineOpponentId;

    let score;
    if (gr.winner === 'draw') score = 0.5;
    else score = gr.winner === myColor ? 1 : 0;

    let cancelled = false;
    (async () => {
      try {
        // Try server-side rating first (authoritative)
        let delta = null;
        if (onlineRoom?.id) {
          try {
            const serverResult = await requestRatingUpdate({
              roomId: onlineRoom.id,
              winner: gr.winner,
              reason: gr.reason,
            });
            if (serverResult?.ok) {
              const myData = myColor === 'white' ? serverResult.white : serverResult.black;
              const oppData = myColor === 'white' ? serverResult.black : serverResult.white;
              delta = {
                oldRating: myData.oldRating,
                newRating: myData.newRating,
                ratingChange: myData.change,
                opponentOldRating: oppData.oldRating,
              };
              // Reload ratings from server to stay in sync
              loadRatings(user.id);
            }
          } catch (serverErr) {
            // Fallback to client-side rating
            delta = await updateOnlineGameRating({
              userId: user.id,
              username: username || user.email,
              opponentId: oppId,
              score,
              category: cat || 'blitz',
            });
          }
        } else {
          delta = await updateOnlineGameRating({
            userId: user.id,
            username: username || user.email,
            opponentId: oppId,
            score,
            category: cat || 'blitz',
          });
        }
        if (cancelled) return;
        if (delta) setRatingDelta(delta);

        // Save the game record
        const pgn = store.getPgn();
        await postGame({
          userId: user.id,
          color: myColor,
          opponent: oppName,
          timerData,
          pgnStr: pgn,
          result: gr.winner,
          resultReason: gr.reason,
          whiteUserId:    myColor === 'white' ? user.id : oppId,
          blackUserId:    myColor === 'black' ? user.id : oppId,
          whiteUsername:  myColor === 'white' ? (username || user.email) : oppName,
          blackUsername:  myColor === 'black' ? (username || user.email) : oppName,
          whiteRating:    myColor === 'white' ? delta?.oldRating    : delta?.opponentOldRating,
          blackRating:    myColor === 'black' ? delta?.oldRating    : delta?.opponentOldRating,
          whiteRatingChange: myColor === 'white' ? delta?.ratingChange : null,
          blackRatingChange: myColor === 'black' ? delta?.ratingChange : null,
          category: cat,
          isRated: true,
          timeControlDisplay: timeControl?.display,
        });
      } catch (e) {
        console.error('Online game end error:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [gameOver, isOnline]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const showAlert = (msg) => setAlertMsg(msg);

  const handleGetHint = () => {
    if (!chessInstance || gameOver) return;
    // Only hint on the user's own turn — otherwise we'd compute the opponent's best move.
    const turn = chessInstance.turn();
    const state = useGameStore.getState();
    if (state.isComp) {
      const userTurn = state.compColor === 'white' ? turn === 'b' : turn === 'w';
      if (!userTurn) { showAlert('Wait for the opponent to move.'); return; }
    } else if (state.isOnline) {
      const userTurn = state.onlineColor === 'white' ? turn === 'w' : turn === 'b';
      if (!userTurn) { showAlert('Wait for the opponent to move.'); return; }
    }

    const s = getSuggestion(chessInstance.fen());
    if (!s) { showAlert('No hint available.'); return; }
    const toRC = (sq) => ({
      row: 8 - parseInt(sq[1], 10),
      col: sq.charCodeAt(0) - 'a'.charCodeAt(0),
    });
    setBoardArrows([{ from: toRC(s.from), to: toRC(s.to), color: '#3ddc84', kind: 'hint' }]);
    showAlert(`Hint: ${s.from} → ${s.to}`);
    // Replace any in-flight auto-clear so rapid re-hints don't cancel each other early.
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => {
      setBoardArrows((prev) => prev.filter((a) => a.kind !== 'hint'));
      hintTimeoutRef.current = null;
    }, 4000);
  };

  // Clean up pending hint-arrow timeout on unmount
  useEffect(() => () => {
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
  }, []);

  // Clear any stale arrows when a new game starts / resets
  useEffect(() => {
    setBoardArrows([]);
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
  }, [gameStarted]);

  // ─── Online game handlers ─────────────────────────────────────────────────
  const onIncomingMove = (payload) => {
    const { from, to, promotion } = payload;
    const { col: fc, row: fr } = sqToRowCol(from);
    const { col: tc, row: tr } = sqToRowCol(to);
    useGameStore.getState().makeMove({ row: fr, col: fc }, { row: tr, col: tc }, promotion || null, true);
    // Only re-enable board if game didn't just end (checkmate/stalemate sets disableBoard:true)
    if (!useGameStore.getState().gameOver) {
      useGameStore.getState().setDisableBoard(false);
      // Execute premove if one was queued
      const pm = useGameStore.getState().premove;
      if (pm?.to) {
        setTimeout(() => useGameStore.getState().executePremove(), 50);
      }
    }
  };

  // Handler for server-validated moves (from Edge Function broadcast)
  const onValidatedMove = (payload) => {
    const { from, to, promotion, whiteTimeMs, blackTimeMs, gameOver: serverGameOver, gameResult: serverResult } = payload;
    const { col: fc, row: fr } = sqToRowCol(from);
    const { col: tc, row: tr } = sqToRowCol(to);
    useGameStore.getState().makeMove({ row: fr, col: fc }, { row: tr, col: tc }, promotion || null, true);

    // Sync server-authoritative timers
    if (whiteTimeMs != null) useGameStore.setState({ whiteTime: whiteTimeMs });
    if (blackTimeMs != null) useGameStore.setState({ blackTime: blackTimeMs });

    if (serverGameOver && serverResult) {
      const winner = serverResult.winner === 'draw' ? 'Draw' : serverResult.winner === 'white' ? 'White' : 'Black';
      const msg = serverResult.reason === 'checkmate' ? `Checkmate! ${winner} wins!`
        : serverResult.reason === 'timeout' ? `Time expired! ${winner} wins!`
        : serverResult.reason === 'stalemate' ? 'Stalemate! Draw.'
        : `${winner} wins!`;
      useGameStore.setState({
        gameOver: true,
        gameOverMessage: msg,
        timerRunning: false,
        disableBoard: true,
        premove: null,
        gameResult: serverResult,
      });
    } else if (!useGameStore.getState().gameOver) {
      useGameStore.getState().setDisableBoard(false);
      const pm = useGameStore.getState().premove;
      if (pm?.to) {
        setTimeout(() => useGameStore.getState().executePremove(), 50);
      }
    }
  };

  const onIncomingChat = (payload) => {
    setChatMessages(msgs => {
      if (msgs.some(m => m.ts === payload.ts && m.sender === payload.sender)) return msgs;
      return [...msgs, payload];
    });
  };

  const onOpponentResign = () => {
    if (useGameStore.getState().gameOver) return;
    const myColor = useGameStore.getState().onlineColor;
    const winner  = myColor === 'white' ? 'White' : 'Black';
    useGameStore.setState({
      gameOver: true,
      gameOverMessage: `${winner} wins! Opponent resigned.`,
      timerRunning: false,
      disableBoard: true,
      premove: null,
      gameResult: { winner: winner.toLowerCase(), reason: 'resign' },
    });
    if (onlineChannelRef.current) {
      unsubscribe(onlineChannelRef.current);
      onlineChannelRef.current = null;
    }
  };

  const handleCreateRoom = async () => {
    if (!user) { setShowLogin(true); return; }
    const roomId = await createRoom({
      hostId: user.id,
      hostName: username || user.email,
      timeControl: onlineTimeControl,
    });
    setOnlineRoom({ id: roomId, hostColor: 'white' });
    setWaitingForOpponent(true);
    broadcastedMoveRef.current = -1;
    setChatMessages([]);

    try {
      const channel = await subscribeToRoom(roomId, {
        onOpponentJoined: (payload) => {
          setWaitingForOpponent(false);
          setOnlineRoom(r => ({ ...r, guestName: payload.username, status: 'playing' }));
          setIsOnlineConnected(true);
          const store = useGameStore.getState();
          store.startOnlineGame(onlineTimeControl, 'white');
          store.setOppName(payload.username || 'Opponent');
          store.setOnlineOpponentId(payload.userId);
        },
        onMove:         onIncomingMove,
        onValidatedMove: onValidatedMove,
        onChat:         onIncomingChat,
        onResign:       onOpponentResign,
        onUndoRequest:  onIncomingUndoRequest,
        onUndoResponse: onIncomingUndoResponse,
      });
      onlineChannelRef.current = channel;
    } catch (err) {
      showAlert('Could not connect to room. Please try again.');
      setWaitingForOpponent(false);
    }
  };

  const handleJoinRoom = async (code) => {
    if (!user) { setShowLogin(true); return; }
    const room    = await joinRoom({ roomId: code, guestId: user.id, guestName: username || user.email });
    const myColor = room.host_color === 'white' ? 'black' : 'white';
    setOnlineRoom({ ...room, status: 'playing' });
    setIsOnlineConnected(true);
    broadcastedMoveRef.current = -1;
    setChatMessages([]);

    let channel;
    try {
      channel = await subscribeToRoom(code.toUpperCase(), {
        onMove:         onIncomingMove,
        onValidatedMove: onValidatedMove,
        onChat:         onIncomingChat,
        onResign:       onOpponentResign,
        onUndoRequest:  onIncomingUndoRequest,
        onUndoResponse: onIncomingUndoResponse,
      });
    } catch (err) {
      showAlert('Could not connect to room. Please try again.');
      setIsOnlineConnected(false);
      return;
    }
    onlineChannelRef.current = channel;

    const store = useGameStore.getState();
    store.startOnlineGame(room.time_control, myColor);
    store.setOppName(room.host_name || 'Opponent');
    store.setOnlineOpponentId(room.host_id);

    // Critical: only broadcast join AFTER subscription is fully established,
    // otherwise the host's onOpponentJoined handler may never fire.
    await broadcastJoin(channel, { userId: user.id, username: username || user.email });
  };

  const handleOnlineSendChat = (text) => {
    if (!onlineChannelRef.current) return;
    const myName = username || user?.email || 'You';
    const msg    = { text, sender: myName, ts: Date.now() };
    setChatMessages(msgs => [...msgs, msg]);
    broadcastChat(onlineChannelRef.current, { text, sender: myName });
  };

  const handleLocalResign = () => {
    if (!gameStarted || gameOver) return;
    confirmActionRef.current = () => {
      if (useGameStore.getState().gameOver) return;
      const state = useGameStore.getState();
      // In computer mode, human is opposite of compColor; in pass-and-play, active player resigns
      const myColor = state.isComp
        ? (state.compColor === 'white' ? 'black' : 'white')
        : (state.activeColor === 'w' ? 'white' : 'black');
      const winner = myColor === 'white' ? 'Black' : 'White';
      useGameStore.setState({
        gameOver: true,
        gameOverMessage: `${winner} wins! You resigned.`,
        timerRunning: false,
        disableBoard: true,
        premove: null,
        gameResult: { winner: winner.toLowerCase(), reason: 'resign' },
      });
    };
    setConfirmMsg('Are you sure you want to resign?');
    setShowConfirm(true);
  };

  const handleOnlineResign = () => {
    if (!onlineChannelRef.current || useGameStore.getState().gameOver) return;
    confirmActionRef.current = async () => {
      if (useGameStore.getState().gameOver || !onlineChannelRef.current) return;
      await broadcastResign(onlineChannelRef.current, user.id);
      const myColor = useGameStore.getState().onlineColor;
      const winner  = myColor === 'white' ? 'Black' : 'White'; // I resigned
      useGameStore.setState({
        gameOver: true,
        gameOverMessage: `${winner} wins! You resigned.`,
        timerRunning: false,
        disableBoard: true,
        premove: null,
        gameResult: { winner: winner.toLowerCase(), reason: 'resign' },
      });
    };
    setConfirmMsg('Are you sure you want to resign?');
    setShowConfirm(true);
  };

  // ─── Online undo handlers ─────────────────────────────────────────────────
  const handleRequestUndo = async () => {
    if (!onlineChannelRef.current) return;
    const myColor = useGameStore.getState().onlineColor; // 'white' | 'black'
    const used    = undosUsedRef.current[myColor] || 0;
    if (used >= 2) { showAlert('You have used all your undo requests (2 max).'); return; }
    const history = useGameStore.getState().moveHistory;
    if (history.length < 2) { showAlert('Not enough moves to undo.'); return; }
    if (undoPending) { showAlert('Undo request already pending.'); return; }
    undosUsedRef.current[myColor] = used + 1;
    setUndoPending(true);
    await broadcastUndoRequest(onlineChannelRef.current, {
      userId: useAuthStore.getState().user?.id,
      playerColor: myColor,
    });
  };

  const onIncomingUndoRequest = (payload) => {
    const myColor = useGameStore.getState().onlineColor;
    if (payload.playerColor === myColor) return; // shouldn't happen but guard
    setUndoRequest({ playerColor: payload.playerColor, name: useGameStore.getState().oppName });
  };

  const handleAcceptUndo = async () => {
    setUndoRequest(null);
    await broadcastUndoResponse(onlineChannelRef.current, { accepted: true, userId: useAuthStore.getState().user?.id });
    useGameStore.getState().undoTwoMoves();
    // Re-enable board for the player whose turn it is now
    useGameStore.getState().setDisableBoard(false);
  };

  const handleRejectUndo = async () => {
    setUndoRequest(null);
    await broadcastUndoResponse(onlineChannelRef.current, { accepted: false, userId: useAuthStore.getState().user?.id });
  };

  const onIncomingUndoResponse = (payload) => {
    setUndoPending(false);
    if (payload.accepted) {
      useGameStore.getState().undoTwoMoves();
      useGameStore.getState().setDisableBoard(false);
    } else {
      showAlert('Undo request was declined by opponent.');
      // Refund the undo token since it was rejected
      const myColor = useGameStore.getState().onlineColor;
      undosUsedRef.current[myColor] = Math.max(0, (undosUsedRef.current[myColor] || 0) - 1);
    }
  };

  const handleCancelWait = () => {
    setWaitingForOpponent(false);
    if (onlineRoom) endRoom(onlineRoom.id).catch(console.error);
    if (onlineChannelRef.current) {
      unsubscribe(onlineChannelRef.current);
      onlineChannelRef.current = null;
    }
    setOnlineRoom(null);
  };

  const leaveOnlineGame = () => {
    if (onlineChannelRef.current) {
      unsubscribe(onlineChannelRef.current);
      onlineChannelRef.current = null;
    }
    setOnlineRoom(null);
    setWaitingForOpponent(false);
    setIsOnlineConnected(false);
    setChatMessages([]);
    broadcastedMoveRef.current = -1;
    undosUsedRef.current = { white: 0, black: 0 };
    setUndoRequest(null);
    setUndoPending(false);
    resetMatchmaking();
    initGame();
  };

  // ─── Matchmaking handlers ─────────────────────────────────────────────────
  const handleMatchFound = async ({ roomId, opponentName, opponentId, yourColor, timeControl: matchedTC }) => {
    const tc = matchedTC || onlineTimeControl;
    broadcastedMoveRef.current = -1; // reset BEFORE subscribing/starting
    undosUsedRef.current = { white: 0, black: 0 };
    setChatMessages([]);
    setUndoRequest(null);
    setUndoPending(false);
    setOnlineRoom({ id: roomId, status: 'playing', hostColor: yourColor === 'white' ? 'white' : 'black' });
    setIsOnlineConnected(true);

    try {
      const channel = await subscribeToRoom(roomId, {
        onMove:         onIncomingMove,
        onValidatedMove: onValidatedMove,
        onChat:         onIncomingChat,
        onResign:       onOpponentResign,
        onUndoRequest:  onIncomingUndoRequest,
        onUndoResponse: onIncomingUndoResponse,
      });
      onlineChannelRef.current = channel;
    } catch (err) {
      showAlert('Could not connect to match. Please try again.');
      setIsOnlineConnected(false);
      return;
    }

    const store = useGameStore.getState();
    store.startOnlineGame(tc, yourColor);
    store.setOppName(opponentName || 'Opponent');
    store.setOnlineOpponentId(opponentId);
  };

  const handleFindGame = () => {
    if (!user) { setShowLogin(true); return; }
    if (!onlineTimeControl) { showAlert('Select a time control first.'); return; }
    const cat     = onlineTimeControl.cat?.toLowerCase() || 'blitz';
    const myRating = myRatings[cat]?.rating ?? 1500;
    joinQueue(
      { userId: user.id, username: username || user.email, rating: myRating, category: cat, timeControl: onlineTimeControl },
      handleMatchFound,
    );
  };

  const handleCancelSearch = async () => {
    await cancelMatchmaking();
  };

  // ─── Tab navigation ───────────────────────────────────────────────────────
  const handleTabClick = (index) => {
    // Skip if already on this tab and no active game to end
    if (index === activeTab && (!gameStarted || gameOver)) return;

    // Account tab (5)
    if (index === 5) {
      if (!user) { setShowLogin(true); return; }
      if (gameStarted && !gameOver) {
        setConfirmMsg('End current game?');
        confirmActionRef.current = () => { initGame(); executeTabSwitch(index); };
        setShowConfirm(true);
      } else {
        executeTabSwitch(index);
      }
      return;
    }

    // Online tab (4) — requires login
    if (index === 4) {
      if (!user) { setShowLogin(true); return; }
      if (gameStarted && !gameOver) {
        setConfirmMsg(isOnline ? 'Leave online game? (You will forfeit)' : 'End current game?');
        confirmActionRef.current = () => { if (isOnline) leaveOnlineGame(); initGame(); executeTabSwitch(index); };
        setShowConfirm(true);
      } else {
        executeTabSwitch(index);
      }
      return;
    }

    if (gameStarted && !gameOver) {
      const contextLabels = { 2: 'Close Analysis', 6: 'Close Puzzles', 13: 'Close Training', 15: 'Close Coach Session' };
      const msg = isOnline ? 'Leave online game? (You will forfeit)'
        : contextLabels[activeTab] || 'End current game?';
      setConfirmMsg(msg);
      confirmActionRef.current = () => { if (isOnline) leaveOnlineGame(); initGame(); executeTabSwitch(index); };
      setShowConfirm(true);
      return;
    }
    executeTabSwitch(index);
  };

  const executeTabSwitch = (index) => {
    setShowConfirm(false);
    setActiveTab(index);
    // Clean up P2P if leaving tab 12
    if (index !== 12 && p2pMyColor) {
      p2p.close();
      setP2pMyColor(null);
    }
    if (index === 0) {
      initGame();
    } else if (index === 1) {
      initGame();
    } else if (index === 2) {
      initGame();
      loadAnalysisGames();
    } else if (index === 3) {
      // Game setup happens from HomeScreen
    } else if (index === 4) {
      // Online tab — lobby shown by default, no initGame (don't reset mid-session)
    } else if (index === 5) {
      // Account screen — no extra init needed
    } else if (index === 6) {
      // Puzzles
    } else if (index === 7) {
      // Spectate
    } else if (index === 8) {
      // Friends
    } else if (index === 9) {
      // Clubs
    } else if (index === 10) {
      // Tournaments
    } else if (index === 11) {
      // Leaderboard
    } else if (index === 12) {
      // P2P — reset state so user always starts fresh from setup
      if (p2pMyColor) { p2p.close(); setP2pMyColor(null); }
    }
  };

  const loadAnalysisGames = async () => {
    setAnalysisLoading(true);
    try {
      const games = await getGames(user?.id);
      setAnalysisGames(Array.isArray(games) ? games : []);
    } catch (e) {
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleStrengthSelect = (strength, color, chosenBot = null) => {
    setShowStrength(false);
    let compCol = color === 'white' ? 'black' : 'white';
    if (color === 'random') compCol = Math.random() < 0.5 ? 'white' : 'black';
    const bot = chosenBot || getBotByStrength(strength);
    setSelectedBot(bot);
    initGame();
    startGame(pendingTimeControl, true, compCol, strength, { botId: bot?.id || null });
    applyRealUsername();
    setPendingTimeControl(null);
    setActiveTab(3);
  };

  // Replace the store's default "You (Color)" label with the authenticated
  // username so PGN headers, analysis cards, and player panels show a real name.
  const applyRealUsername = () => {
    const name = username || (user?.email ? user.email.split('@')[0] : null) || 'You';
    useGameStore.getState().setYouName(name);
  };

  const handleGameOverNewGame = () => {
    if (isOnline) leaveOnlineGame();
    initGame();
    setReviewResults(null);
    setRatingDelta(null);
    setActiveTab(0);
  };

  const handleReviewGame = () => {
    const state = useGameStore.getState();
    const pgn = state.getPgn();
    if (!pgn) return;
    // Capture the user's color before we init — we'll pass it through so
    // Analysis can flip the board to the player's perspective.
    const userColor = state.isComp
      ? (state.compColor === 'white' ? 'black' : 'white')
      : state.isOnline
        ? state.onlineColor
        : 'white';
    // Close modal and navigate to Analysis tab with the PGN
    initGame();
    setRatingDelta(null);
    setPendingReviewPgn({ pgn, userColor });
    setActiveTab(2); // Analysis tab
  };

  // ─── Computed ─────────────────────────────────────────────────────────────
  const isOnlineGameActive = activeTab === 4 && isOnline && gameStarted;
  const isGameViewActive   = (activeTab === 1 || activeTab === 3 || activeTab === 15 || isOnlineGameActive) && gameStarted;

  // Player panel data (top = opponent perspective, bottom = you)
  const _PVALS = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const { whiteMat, blackMat } = useMemo(() => {
    const _mat = (arr) => arr.reduce((s, p) => s + (_PVALS[p.type] || 0), 0);
    return { whiteMat: _mat(capturedByWhite), blackMat: _mat(capturedByBlack) };
  }, [capturedByWhite, capturedByBlack]);
  const topColor    = flipped ? 'w' : 'b';
  const bottomColor = flipped ? 'b' : 'w';
  const compDisplayName = isComp && selectedBot ? `${selectedBot.name} (${selectedBot.rating})` : oppName;
  const playerColor = isComp ? (compColor === 'white' ? 'black' : 'white') :
                      isOnline ? onlineColor : 'white';
  const whiteName = playerColor === 'white' ? youName : compDisplayName;
  const blackName = playerColor === 'black' ? youName : compDisplayName;
  const topName     = flipped ? whiteName : blackName;
  const bottomName  = flipped ? blackName : whiteName;
  const topCaptured    = flipped ? capturedByWhite : capturedByBlack;
  const bottomCaptured = flipped ? capturedByBlack : capturedByWhite;
  const topAdv    = flipped ? (whiteMat - blackMat) : (blackMat - whiteMat);
  const bottomAdv = flipped ? (blackMat - whiteMat) : (whiteMat - blackMat);
  const topTime    = flipped ? whiteTime : blackTime;
  const bottomTime = flipped ? blackTime : whiteTime;
  const topActive    = activeColor === topColor;
  const bottomActive = activeColor === bottomColor;
  // eval bar removed from game view — only in analysis

  const onlineOpponentName = onlineRoom
    ? (useGameStore.getState().onlineColor === 'white'
       ? (onlineRoom.guestName || 'Opponent')
       : (onlineRoom.host_name || 'Opponent'))
    : 'Opponent';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <LeftNav activeTab={activeTab} onTabClick={handleTabClick} friendBadge={friendRequests.length + notifUnread} />

      <div className="main-content">
       <Suspense fallback={<div className="lazy-fallback"><div className="lazy-spinner" /></div>}>
        {/* Left sidebar removed — controls moved to board-controls bar */}

        {/* ── Tab 0: Home ── */}
        {activeTab === 0 && (
          <HomeScreen
            user={user}
            onStart={(mode, tc) => {
              if (mode === 'local') {
                initGame();
                startGame(tc, false, 'black', 4);
                applyRealUsername();
                setActiveTab(1);
              } else if (mode === 'computer') {
                setPendingTimeControl(tc);
                setShowStrength(true);
              }
            }}
            onPlayOnline={() => executeTabSwitch(4)}
            onTabClick={handleTabClick}
            onQuickMatch={(tc) => {
              if (!user) { setShowLogin(true); return; }
              setOnlineTimeControl({
                display: tc.display, cat: tc.cat,
                total: tc.total, incr: tc.incr,
                initialTime: tc.total, increment: tc.incr,
              });
              executeTabSwitch(4);
            }}
          />
        )}

        {/* ── Tab 2: Analysis ── */}
        {activeTab === 2 && (
          <AnalysisBoard savedGames={analysisGames} gamesLoading={analysisLoading} pendingPgn={pendingReviewPgn} onPendingPgnConsumed={() => setPendingReviewPgn(null)} />
        )}

        {/* ── Tab 3: Computer Setup ── */}
        {activeTab === 3 && !gameStarted && (
          <ComputerSetup onStart={(bot, tc, color) => {
            setSelectedBot(bot);
            initGame();
            const compCol = color === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : (color === 'white' ? 'black' : 'white');
            startGame(tc, true, compCol, bot.strength, { botId: bot.id });
            applyRealUsername();
          }} />
        )}

        {/* ── Tab 15: Play with Coach ── */}
        {activeTab === 15 && !gameStarted && (
          <CoachSetup onStart={(coach, level, tc, color) => {
            const compCol = color === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : (color === 'white' ? 'black' : 'white');
            // Shape a bot-compatible opponent from the coach + level so the
            // rest of the app (player panel, game-over message, etc.) works.
            setSelectedBot({
              id: coach.id,
              name: coach.name,
              rating: level.rating,
              strength: level.strength,
              icon: coach.icon,
              color: coach.color,
              tagline: coach.tagline || '',
              description: coach.description || '',
              winMsg: coach.closingWin  || 'Well played!',
              loseMsg: coach.closingLoss || 'Good effort — let’s review.',
              drawMsg: coach.closingDraw || 'A fair result.',
            });
            initGame();
            startGame(tc, true, compCol, level.strength, { isCoachGame: true, coachId: coach.id });
          }} />
        )}

        {/* ── Tab 4: Online lobby (no active game) ── */}
        {activeTab === 4 && !isOnline && (() => {
          const cat = onlineTimeControl?.cat?.toLowerCase();
          const userRatingForCat = cat ? (myRatings[cat]?.rating ?? null) : null;
          return (
            <OnlineLobby
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onFindGame={handleFindGame}
              onCancelSearch={handleCancelSearch}
              roomId={onlineRoom?.id}
              waitingForOpponent={waitingForOpponent}
              onCancelWait={handleCancelWait}
              timeControls={ONLINE_TIME_CONTROLS}
              selectedTime={onlineTimeControl}
              onSelectTime={setOnlineTimeControl}
              isSearching={mmStatus === 'searching'}
              searchElapsed={mmElapsed}
              userRating={userRatingForCat}
            />
          );
        })()}

        {/* ── Tab 6: Puzzles ── */}
        {activeTab === 6 && <PuzzlePage />}

        {/* ── Tab 7: Spectate ── */}
        {activeTab === 7 && <SpectateList />}

        {/* ── Tab 8: Friends ── */}
        {activeTab === 8 && <FriendsPage />}

        {/* ── Tab 9: Clubs ── */}
        {activeTab === 9 && <ClubsPage />}

        {/* ── Tab 10: Tournaments ── */}
        {activeTab === 10 && <TournamentsPage />}

        {/* ── Tab 11: Leaderboard ── */}
        {activeTab === 11 && <LeaderboardPage />}

        {/* ── Tab 13: Training (Lessons, Coach, Openings, Endgames, Basics) ── */}
        {activeTab === 13 && <TrainingHub />}

        {/* ── Tab 14: Settings ── */}
        {activeTab === 14 && <SettingsPage />}

        {/* ── Tab 12: P2P Nearby Play ── */}
        {activeTab === 12 && !p2pMyColor && (
          <P2PSetup onConnected={(color) => setP2pMyColor(color)} />
        )}
        {activeTab === 12 && p2pMyColor && (
          <P2PGame
            myColor={p2pMyColor}
            onExit={() => { p2p.close(); setP2pMyColor(null); }}
          />
        )}

        {/* ── Tab 5: Account ── */}
        {activeTab === 5 && !user && (
          <div className="sign-in-prompt">
            <div className="sign-in-prompt-icon icon-glow">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5.5" r="3"/>
                <path d="M9.5 8.5C9.5 8.5 8 11 8 13c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2 0-2-1.5-4.5-1.5-4.5H9.5z"/>
                <path d="M7 17h10l1 3H6l1-3z"/>
                <rect x="5" y="20.5" width="14" height="2" rx="0.5"/>
              </svg>
            </div>
            <div className="sign-in-prompt-title">Sign in to view your profile</div>
            <div className="sign-in-prompt-sub">Track your ratings, review games, and connect with friends.</div>
            <button className="sign-in-prompt-btn" onClick={() => setShowLogin(true)}>Sign In</button>
          </div>
        )}
        {activeTab === 5 && user && (
          <AccountScreen
            onAlert={showAlert}
            onLogout={() => setShowLogout(true)}
            onLoadGame={(game) => {
              if (game.pgnStr) {
                const ok = importPgn(game.pgnStr);
                if (ok) { setActiveTab(1); showAlert('Game loaded for analysis'); }
              }
            }}
          />
        )}

        {/* ── Game view (New Game / Computer / Online) ── */}
        {isGameViewActive && (
          <div className="game-layout">
            {/* Board column */}
            <div className="board-column">
              {/* Online status strip */}
              {isOnline && (
                <div className="online-controls">
                  <span className={`online-dot ${isOnlineConnected ? 'online' : 'offline'}`} />
                  <span className="online-room-id">Room: {onlineRoom?.id}</span>
                  {!gameOver && (
                    <div className="online-actions">
                      <button
                        className="online-btn undo-btn"
                        onClick={handleRequestUndo}
                        disabled={undoPending || undosUsedRef.current[useGameStore.getState().onlineColor] >= 2}
                        title={undoPending ? 'Waiting for response…' : `Undo (${2 - (undosUsedRef.current[useGameStore.getState().onlineColor] || 0)} left)`}
                      >
                        {undoPending ? 'Pending…' : 'Undo'}
                      </button>
                      <button className="online-btn resign-btn" onClick={handleOnlineResign}>Resign</button>
                      <button className="online-btn leave-btn" onClick={() => {
                        confirmActionRef.current = () => { leaveOnlineGame(); initGame(); setActiveTab(0); };
                        setConfirmMsg('Leave game? You will forfeit.');
                        setShowConfirm(true);
                      }}>Leave</button>
                    </div>
                  )}
                </div>
              )}

              {isOnline && gameStarted && !gameOver && (() => {
                const myTurn = (onlineColor === 'white' && activeColor === 'w') ||
                               (onlineColor === 'black' && activeColor === 'b');
                return !myTurn ? <div className="opponent-thinking">Opponent is thinking...</div> : null;
              })()}

              {/* Top player panel */}
              <PlayerPanel
                name={topName} colorCode={topColor}
                time={topTime} timeActive={topActive} timerRunning={timerRunning}
                captured={topCaptured} materialAdv={topAdv}
                timeControl={timeControl}
                showCaptured={showCapturedPref}
              />

              <div className="board-area">
                <Board arrows={boardArrows} />
              </div>

              {/* Board controls — flip, undo, redo, resign, copy PGN */}
              <div className="board-controls">
                <button className="board-ctrl-btn" onClick={() => setFlipped(!flipped)} title="Flip board">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
                </button>
                <button className="board-ctrl-btn" onClick={() => isComp ? undoTwoMoves() : undoMove()} disabled={!gameStarted || gameOver} title="Undo">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5"/></svg>
                </button>
                <button className="board-ctrl-btn" onClick={redoMove} disabled={!gameStarted || gameOver} title="Redo">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10H11a5 5 0 00-5 5v2M21 10l-5-5M21 10l-5 5"/></svg>
                </button>
                {gameOver && (
                  <button className="board-ctrl-btn" onClick={() => {
                    const pgn = getPgn();
                    if (pgn) navigator.clipboard.writeText(pgn).then(() => showAlert('PGN copied!'));
                  }} title="Copy PGN">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </button>
                )}
                {!isOnline && gameStarted && !gameOver && (
                  <button className="board-ctrl-btn board-ctrl-resign" onClick={handleLocalResign} title="Resign">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                  </button>
                )}
              </div>

              {/* Bottom player panel */}
              <PlayerPanel
                name={bottomName} colorCode={bottomColor}
                time={bottomTime} timeActive={bottomActive} timerRunning={timerRunning}
                captured={bottomCaptured} materialAdv={bottomAdv}
                timeControl={timeControl}
                showHint={!isOnline} onHint={handleGetHint}
                showCaptured={showCapturedPref}
              />
            </div>

            <RightSidebar onAlert={showAlert} reviewResults={reviewResults} isReviewing={isReviewing} />
          </div>
        )}
       </Suspense>
      </div>

      {/* Online chat — floating, shown during online game */}
      {isOnlineGameActive && (
        <Chat
          messages={chatMessages}
          onSend={handleOnlineSendChat}
          opponentName={onlineOpponentName}
          myName={username || user?.email || 'You'}
          isConnected={isOnlineConnected}
        />
      )}

      {/* ── Modals ── */}
      {alertMsg && <CustomAlert message={alertMsg} onDone={() => setAlertMsg('')} />}

      {showConfirm && (
        <ConfirmModal
          message={confirmMsg}
          onConfirm={() => {
            setShowConfirm(false);
            const fn = confirmActionRef.current;
            confirmActionRef.current = null;
            fn?.();
          }}
          onCancel={() => { setShowConfirm(false); confirmActionRef.current = null; }}
        />
      )}


      {gameOver && gameOverMessage && (
        <GameOverModal
          message={gameOverMessage}
          ratingDelta={ratingDelta}
          botMessage={isComp && selectedBot ? (() => {
            const gr = useGameStore.getState().gameResult;
            const playerWon = gr?.winner && gr.winner !== 'draw' && gr.winner !== compColor;
            const isDraw = gr?.winner === 'draw';
            return {
              icon: selectedBot.icon,
              color: selectedBot.color,
              name: selectedBot.name,
              text: playerWon ? selectedBot.winMsg : isDraw ? selectedBot.drawMsg : selectedBot.loseMsg,
            };
          })() : null}
          onNewGame={handleGameOverNewGame}
          onCancel={() => { initGame(); setRatingDelta(null); setActiveTab(0); }}
          onAnalyse={() => { initGame(); setRatingDelta(null); }}
          onReview={handleReviewGame}
        />
      )}

      {showStrength && (
        <StrengthModal
          onSelect={handleStrengthSelect}
          onCancel={() => { setShowStrength(false); setPendingTimeControl(null); if (activeTab === 3) setActiveTab(0); }}
        />
      )}

      {pawnPromotion && (
        <PromotionModal
          color={activeColor === 'w' ? 'white' : 'black'}
          onSelect={completePromotion}
        />
      )}

      {/* Online undo request dialog */}
      {undoRequest && (
        <ConfirmModal
          message={`${undoRequest.name} requests to undo the last 2 moves. Allow?`}
          onConfirm={handleAcceptUndo}
          onCancel={handleRejectUndo}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => showAlert('Logged in successfully!')}
        />
      )}

      {showLogout && <LogoutModal onClose={() => setShowLogout(false)} />}
    </div>
  );
}

// ─── Home screen ─────────────────────────────────────────────────────────────

const QUICK_TCS = [
  { display: '1+0',   cat: 'Bullet',    total: 60_000,    incr: 0,      catKey: 'bullet',    accent: '#f0c94c' },
  { display: '1+1',   cat: 'Bullet',    total: 60_000,    incr: 1_000,  catKey: 'bullet',    accent: '#f0c94c' },
  { display: '2+1',   cat: 'Bullet',    total: 120_000,   incr: 1_000,  catKey: 'bullet',    accent: '#f0c94c' },
  { display: '3+0',   cat: 'Blitz',     total: 180_000,   incr: 0,      catKey: 'blitz',     accent: '#ffa94d' },
  { display: '3+2',   cat: 'Blitz',     total: 180_000,   incr: 2_000,  catKey: 'blitz',     accent: '#ffa94d' },
  { display: '5+0',   cat: 'Blitz',     total: 300_000,   incr: 0,      catKey: 'blitz',     accent: '#ffa94d' },
  { display: '5+3',   cat: 'Blitz',     total: 300_000,   incr: 3_000,  catKey: 'blitz',     accent: '#ffa94d' },
  { display: '10+0',  cat: 'Rapid',     total: 600_000,   incr: 0,      catKey: 'rapid',     accent: '#6fdc8c' },
  { display: '10+5',  cat: 'Rapid',     total: 600_000,   incr: 5_000,  catKey: 'rapid',     accent: '#6fdc8c' },
  { display: '15+10', cat: 'Rapid',     total: 900_000,   incr: 10_000, catKey: 'rapid',     accent: '#6fdc8c' },
  { display: '30+0',  cat: 'Classical', total: 1_800_000, incr: 0,      catKey: 'classical', accent: '#a78bfa' },
  { display: '30+20', cat: 'Classical', total: 1_800_000, incr: 20_000, catKey: 'classical', accent: '#a78bfa' },
];

const FEATURE_CARDS = [
  { icon: 'AI', title: 'vs Computer',  desc: '10 difficulty levels',       tab: 3,  accent: '#a78bfa' },
  { icon: 'Pz', title: 'Puzzles',      desc: 'Train your tactics',         tab: 6,  accent: '#fbbf24' },
  { icon: 'An', title: 'Analysis',     desc: 'Review & explore games',     tab: 2,  accent: '#34d399' },
  { icon: 'Tr', title: 'Tournaments',  desc: 'Swiss & arena events',       tab: 10, accent: '#f97316' },
  { icon: 'Cl', title: 'Clubs',        desc: 'Join a chess community',     tab: 9,  accent: '#fb923c' },
  { icon: 'Sp', title: 'Watch',        desc: 'Live games in progress',     tab: 7,  accent: '#38bdf8' },
  { icon: 'Lb', title: 'Leaderboard',  desc: 'Top rated players',          tab: 11, accent: '#e879f9' },
  { icon: 'Fr', title: 'Friends',      desc: 'Connect & challenge',        tab: 8,  accent: '#4ade80' },
];

const RATING_CATS = [
  { key: 'blitz',     label: 'Blitz' },
  { key: 'rapid',     label: 'Rapid' },
  { key: 'bullet',    label: 'Bullet' },
  { key: 'classical', label: 'Classical' },
];

// Default CTA fires blitz 5+0
const DEFAULT_CTA_TC = QUICK_TCS[2]; // 5+0 Blitz

function HomeScreen({ user, onStart, onPlayOnline, onTabClick, onQuickMatch }) {
  const [liveCount, setLiveCount] = useState(null);
  const { myRatings } = useRatingStore();

  useEffect(() => {
    const fetchCount = () =>
      supabase
        .from('chess_rooms')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'playing')
        .then(({ count }) => setLiveCount(count ?? 0))
        .catch(() => {});
    fetchCount();
    const id = setInterval(fetchCount, 30000); // refresh every 30 s
    return () => clearInterval(id);
  }, []);

  const ratingCats = user ? RATING_CATS.filter(c => myRatings[c.key]) : [];

  return (
    <div className="home-screen">
      <div className="home-body">

        {/* ── Hero ── */}
        <div className="home-hero-wrap">
          <h1 className="home-title">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign: 'middle', marginRight: '6px'}} xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="5.5" r="3"/>
              <path d="M9.5 8.5C9.5 8.5 8 11 8 13c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2 0-2-1.5-4.5-1.5-4.5H9.5z"/>
              <path d="M7 17h10l1 3H6l1-3z"/>
              <rect x="5" y="20.5" width="14" height="2" rx="0.5"/>
            </svg><span className="home-title-accent">Chess</span>
          </h1>
          <p className="home-tagline">
            Free · No ads · No paywalls
          </p>

          {/* Live badge */}
          {liveCount !== null && liveCount > 0 && (
            <div className="home-live-row">
              <span className="home-live-badge">
                <span className="home-live-dot" />
                {liveCount} live
              </span>
            </div>
          )}

          {/* Rating bar — logged in users only */}
          {ratingCats.length > 0 && (
            <div className="home-rating-bar">
              {ratingCats.map(c => {
                const r = myRatings[c.key];
                return (
                  <div key={c.key} className="home-rating-chip">
                    <span className="home-rating-chip-cat">{c.label}</span>
                    <span className="home-rating-chip-val">{r.rating}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Play section — all game modes ── */}
        <div className="home-section">
          <div className="home-section-label">Play</div>
          <div className="home-play-grid">
            {/* Primary CTA */}
            <button
              className="home-play-card home-play-primary"
              style={{ '--card-accent': '#00fff5' }}
              onClick={() => onQuickMatch(DEFAULT_CTA_TC)}
            >
              <div className="home-play-card-top">
                <span className="home-play-card-icon icon-glow">5+0</span>
                <span className="home-play-card-badge">Blitz</span>
              </div>
              <div className="home-play-card-title">Quick Match</div>
              <div className="home-play-card-desc">Play online now</div>
            </button>

            <button
              className="home-play-card"
              style={{ '--card-accent': '#a78bfa' }}
              onClick={() => onTabClick(3)}
            >
              <div className="home-play-card-top">
                <span className="home-play-card-icon icon-glow">AI</span>
              </div>
              <div className="home-play-card-title">vs Computer</div>
              <div className="home-play-card-desc">10 difficulty levels</div>
            </button>

            <button
              className="home-play-card"
              style={{ '--card-accent': '#38bdf8' }}
              onClick={onPlayOnline}
            >
              <div className="home-play-card-top">
                <span className="home-play-card-icon icon-glow">ON</span>
              </div>
              <div className="home-play-card-title">Play Online</div>
              <div className="home-play-card-desc">Custom time controls</div>
            </button>

            <button
              className="home-play-card"
              style={{ '--card-accent': '#34d399' }}
              onClick={() => onStart('local', { display: '10+0', total: 600_000, incr: 0, cat: 'Rapid', delayType: 'none', delay: 0 })}
            >
              <div className="home-play-card-top">
                <span className="home-play-card-icon icon-glow">2P</span>
              </div>
              <div className="home-play-card-title">Pass and Play</div>
              <div className="home-play-card-desc">Two players, one device</div>
            </button>
          </div>
        </div>

        {/* ── More time controls ── */}
        <div className="home-section">
          <div className="home-section-label">Online — Pick a Time Control</div>
          <div className="home-tc-grid">
            {QUICK_TCS.map(tc => (
              <button
                key={tc.display}
                className="home-tc-btn"
                style={{ '--tc-accent': tc.accent }}
                onClick={() => onQuickMatch(tc)}
              >
                <span className="home-tc-time">{tc.display}</span>
                <span className="home-tc-cat">{tc.cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Feature grid ── */}
        <div className="home-section">
          <div className="home-section-label">Explore</div>
          <div className="home-feat-grid">
            {FEATURE_CARDS.map(f => (
              <button
                key={f.tab}
                className="home-feat-card"
                style={{ '--feat-accent': f.accent }}
                onClick={() => onTabClick(f.tab)}
              >
                <span className="home-feat-icon icon-glow">{f.icon}</span>
                <div className="home-feat-text">
                  <div className="home-feat-title">{f.title}</div>
                  <div className="home-feat-desc">{f.desc}</div>
                </div>
                <span className="home-feat-arrow">›</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Player panel ─────────────────────────────────────────────────────────────
// Use shared time formatter
import { formatTime as formatPPTime } from './utils/timeFormatter';
import { usePieceResolver } from './utils/pieceResolver';

function PlayerPanel({ name, colorCode, time, timeActive, timerRunning, captured, materialAdv, timeControl, showHint, onHint, showCaptured = true }) {
  const resolvePiece = usePieceResolver();
  const lowTimeThreshold = usePrefsStore(s => s.lowTimeThreshold);
  const initial = (name || (colorCode === 'w' ? 'W' : 'B'))[0].toUpperCase();
  const isLow   = timeActive && timerRunning && time <= (lowTimeThreshold * 1000);
  const ticking = timeActive && timerRunning;

  return (
    <div className={`player-panel ${ticking ? 'player-panel-ticking' : ''}`}>
      <div className="pp-left">
        <div className={`pp-avatar pp-avatar-${colorCode}`}>{initial}</div>
        <div className="pp-meta">
          <span className="pp-name" title={name || (colorCode === 'w' ? 'White' : 'Black')}>{name || (colorCode === 'w' ? 'White' : 'Black')}</span>
          {showCaptured && (
            <div className="pp-captures">
              {captured.map((p, i) => (
                <img
                  key={`${p.type}-${p.color}-${i}`}
                  src={resolvePiece(p.type, p.color)}
                  className="pp-cap-img"
                  alt={p.type}
                />
              ))}
              {materialAdv > 0 && <span className="pp-adv">+{materialAdv}</span>}
            </div>
          )}
        </div>
      </div>
      <div className="pp-right">
        {showHint && (
          <button className="pp-hint-btn" onClick={onHint} title="Get hint">Hint</button>
        )}
        {timeControl ? (
          <div className={`pp-clock ${ticking ? 'pp-clock-active' : ''} ${isLow ? 'pp-clock-low' : ''}`}>
            {formatPPTime(time)}
          </div>
        ) : (
          <div className="pp-clock pp-clock-untimed">Untimed</div>
        )}
      </div>
    </div>
  );
}

// ─── Account / Profile screen ────────────────────────────────────────────────
const RATING_CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical'];

function AccountScreen({ onAlert, onLoadGame }) {
  const { user, username, logout } = useAuthStore();
  const { myRatings, loadRatings } = useRatingStore();
  const [games, setGames]           = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [activeTab, setActiveTab]   = useState('ratings');
  const [editName, setEditName]     = useState(username || '');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadRatings(user.id);
      getGames(user.id).then(g => { setGames(Array.isArray(g) ? g : []); setGamesLoading(false); }).catch(err => { console.error('Failed to load games:', err); setGamesLoading(false); });
    }
  }, [user?.id]);

  // Correct W/L/D: compare game.result ('white'|'black'|'draw') with game.color
  const ratedGames = games.filter(g => g.result);
  const wins  = ratedGames.filter(g => g.result === g.color).length;
  const draws = ratedGames.filter(g => g.result === 'draw').length;
  const losses = ratedGames.filter(g => g.result && g.result !== g.color && g.result !== 'draw').length;

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getResultLabel = (game) => {
    if (!game.result) return null;
    if (game.result === 'draw') return { label: '½', cls: 'draw' };
    if (game.result === game.color) return { label: 'Win', cls: 'win' };
    return { label: 'Loss', cls: 'loss' };
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: editName.trim() } });
      if (error) throw error;
      onAlert('Display name updated!');
    } catch (e) {
      onAlert('Failed to update name: ' + e.message);
    } finally {
      setSavingName(false);
    }
  };

  const totalGamesPlayed = RATING_CATEGORIES.reduce((sum, cat) => sum + (myRatings[cat]?.games_played || 0), 0);

  return (
    <div className="account-screen">
      {/* ── Header ── */}
      <div className="account-header">
        <div className="account-avatar">{(username || user?.email || '?')[0].toUpperCase()}</div>
        <div className="account-info">
          <div className="account-name">{username || user?.email}</div>
          <div className="account-email">{user?.email}</div>
        </div>
        <button className="account-logout-btn" onClick={async () => { await logout(); }}>Logout</button>
      </div>

      {/* ── Overall stats ── */}
      <div className="account-stats">
        <div className="stat-box">
          <div className="stat-value">{totalGamesPlayed || games.length}</div>
          <div className="stat-label">Rated games</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{color:'#6fdc8c'}}>{wins}</div>
          <div className="stat-label">Wins</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{color:'#ff7875'}}>{losses}</div>
          <div className="stat-label">Losses</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{color:'#ffd666'}}>{draws}</div>
          <div className="stat-label">Draws</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="acct-tabs">
        {['ratings','profile','games'].map(t => (
          <button key={t} className={`acct-tab ${activeTab === t ? 'acct-tab-active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Ratings tab ── */}
      {activeTab === 'ratings' && (
        <div className="acct-section">
          <div className="acct-label" style={{marginBottom: 12}}>Glicko-2 Ratings</div>
          <div className="rating-cards-grid">
            {RATING_CATEGORIES.map(cat => (
              <RatingCard key={cat} category={cat} data={myRatings[cat] || null} />
            ))}
          </div>
          {totalGamesPlayed === 0 && (
            <p style={{color:'rgba(255,255,255,0.35)', fontSize:'0.85rem', marginTop:16, textAlign:'center'}}>
              Play rated online games to build your rating.
            </p>
          )}
        </div>
      )}

      {/* ── Profile tab ── */}
      {activeTab === 'profile' && (
        <div className="acct-section">
          <div className="acct-field">
            <label className="acct-label">Display Name</label>
            <div className="acct-input-row">
              <input className="acct-input" value={editName} onChange={e => setEditName(e.target.value)}
                placeholder="Enter display name" maxLength={32} />
              <button className="acct-save-btn" onClick={handleSaveName} disabled={savingName}>
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
          <div className="acct-field">
            <label className="acct-label">Email</label>
            <div className="acct-value-readonly">{user?.email}</div>
          </div>
          <div className="acct-field">
            <label className="acct-label">Member since</label>
            <div className="acct-value-readonly">{formatDate(user?.created_at)}</div>
          </div>
        </div>
      )}

      {/* ── Games tab ── */}
      {activeTab === 'games' && (
        <div className="acct-section">
          {gamesLoading && <p style={{color:'rgba(255,255,255,0.4)'}}>Loading games…</p>}
          {!gamesLoading && games.length === 0 && <p style={{color:'rgba(255,255,255,0.4)'}}>No games yet.</p>}
          <div className="account-games-list">
            {games.map((game, i) => {
              const res = getResultLabel(game);
              const rChange = game.color === 'white' ? game.white_rating_change
                            : game.color === 'black' ? game.black_rating_change
                            : null;
              return (
                <div key={i} className="account-game-row" onClick={() => onLoadGame(game)}>
                  <div className="account-game-vs">
                    <span className={`game-color-badge ${game.color}`}>
                      {game.color === 'white' ? 'W' : 'B'}
                    </span>
                    <span className="game-opp">
                      vs {game.opponent || (game.color === 'white' ? game.black_username : game.white_username) || 'Unknown'}
                    </span>
                    {game.time_control_display && (
                      <span className="game-tc">{game.time_control_display}</span>
                    )}
                  </div>
                  <div className="account-game-meta">
                    {res && <span className={`game-result game-result-${res.cls}`}>{res.label}</span>}
                    {rChange != null && (
                      <span className={`game-rating-change ${rChange >= 0 ? 'game-rc-up' : 'game-rc-down'}`}>
                        {rChange >= 0 ? '+' : ''}{rChange}
                      </span>
                    )}
                    <span className="game-date">{formatDate(game.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
