import { useState, useEffect, useRef } from 'react';
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
import OnlineLobby from './components/OnlineLobby/OnlineLobby';
import Chat from './components/Chat/Chat';
import AnalysisBoard from './components/AnalysisBoard/AnalysisBoard';
import useGameStore from './store/gameStore';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import useRatingStore from './store/ratingStore';
import useMatchmakingStore from './store/matchmakingStore';
import RatingCard from './components/Profile/RatingCard';
import PuzzlePage from './components/Puzzles/PuzzlePage';
import SpectateList from './components/Spectate/SpectateList';
import FriendsPage from './components/Friends/FriendsPage';
import LeaderboardPage from './components/Leaderboard/LeaderboardPage';
import TournamentsPage from './components/Tournaments/TournamentsPage';
import ClubsPage from './components/Clubs/ClubsPage';
import useNotificationStore from './store/notificationStore';
import useFriendStore from './store/friendStore';
import { getBestMove } from './utils/stockfish';
import { postGame, getGames } from './utils/gameServer';
import { getOpeningName } from './utils/evaluation';
import { supabase } from './utils/supabase';
import { getLocalBestMove, getSuggestion } from './utils/localAI';
import { reviewGame } from './utils/reviewEngine';
import {
  createRoom, joinRoom, subscribeToRoom,
  broadcastMove as bcastMove, broadcastChat, broadcastResign, broadcastJoin,
  endRoom, unsubscribe, sqToRowCol, rowColToSq, updateRoomFen,
} from './utils/multiplayerService';

// ─── Time presets ─────────────────────────────────────────────────────────────
const TC_PRESETS = [
  { display: '1+0',   total: 60,   incr: 0,  cat: 'Bullet',    delayType: 'none', delay: 0 },
  { display: '1+1',   total: 60,   incr: 1,  cat: 'Bullet',    delayType: 'fischer', delay: 1 },
  { display: '2+1',   total: 120,  incr: 1,  cat: 'Bullet',    delayType: 'fischer', delay: 1 },
  { display: '3+0',   total: 180,  incr: 0,  cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '3+2',   total: 180,  incr: 2,  cat: 'Blitz',     delayType: 'fischer', delay: 2 },
  { display: '5+0',   total: 300,  incr: 0,  cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '5+3',   total: 300,  incr: 3,  cat: 'Blitz',     delayType: 'fischer', delay: 3 },
  { display: '10+0',  total: 600,  incr: 0,  cat: 'Rapid',     delayType: 'none', delay: 0 },
  { display: '10+5',  total: 600,  incr: 5,  cat: 'Rapid',     delayType: 'fischer', delay: 5 },
  { display: '15+10', total: 900,  incr: 10, cat: 'Rapid',     delayType: 'fischer', delay: 10 },
  { display: '30+0',  total: 1800, incr: 0,  cat: 'Classical', delayType: 'none', delay: 0 },
  { display: '30+20', total: 1800, incr: 20, cat: 'Classical', delayType: 'fischer', delay: 20 },
];

const ONLINE_TIME_CONTROLS = TC_PRESETS.filter(p => ['1+0','3+0','5+0','10+0','15+10'].includes(p.display));

const DELAY_TYPES = [
  { key: 'none',      label: 'No Delay' },
  { key: 'fischer',   label: 'Fischer',      tip: 'Add seconds after each move' },
  { key: 'bronstein', label: 'Bronstein',    tip: 'Recover time spent (up to max)' },
  { key: 'simple',    label: 'Simple Delay', tip: 'Clock waits N sec before ticking' },
];

const MODES = [
  { key: 'online',   icon: '♟', title: 'Play Online',   desc: 'Challenge players worldwide', iconBg: 'rgba(0,255,245,0.08)' },
  { key: 'computer', icon: '♛', title: 'vs Computer',   desc: '10 difficulty levels',       iconBg: 'rgba(180,120,255,0.1)' },
  { key: 'local',    icon: '♞', title: 'Pass & Play',   desc: 'Two players, one device',    iconBg: 'rgba(255,180,0,0.08)' },
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab]           = useState(0);
  const [pendingTimeControl, setPendingTimeControl] = useState(null);
  const [showLogin, setShowLogin]           = useState(false);
  const [showLogout, setShowLogout]         = useState(false);
  const [showStrength, setShowStrength]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [confirmMsg, setConfirmMsg]         = useState('');
  const [confirmAction, setConfirmAction]   = useState(null);
  const [alertMsg, setAlertMsg]             = useState('');
  const [analysisGames, setAnalysisGames]   = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [reviewResults, setReviewResults]   = useState(null);
  const [isReviewing, setIsReviewing]       = useState(false);
  const [ratingDelta, setRatingDelta]       = useState(null);

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

  const {
    gameStarted, gameOver, gameOverMessage,
    startGame, startOnlineGame, init: initGame,
    pawnPromotion, completePromotion,
    isComp, compColor, compStrength, compThinking,
    setCompThinking, setDisableBoard,
    chessInstance, activeColor,
    timerData, oppName, youName,
    moveHistory, currentMoveIndex,
    importPgn,
    boardState, flipped,
    isOnline,
    capturedByWhite, capturedByBlack,
    whiteTime, blackTime, timerRunning, timeControl,
    gameResult, gameCategory, onlineOpponentId,
    setGameResult, setOnlineOpponentId,
  } = useGameStore();

  const { pieceSets, pieceSetIndex } = useThemeStore();
  const { updateOnlineGameRating, myRatings, loadRatings } = useRatingStore();
  const { status: mmStatus, elapsedSeconds: mmElapsed,
          joinQueue, cancelQueue: cancelMatchmaking, reset: resetMatchmaking } = useMatchmakingStore();
  const { loadNotifications, subscribe: subscribeNotifs,
          unsubscribe: unsubscribeNotifs, unreadCount: notifUnread } = useNotificationStore();
  const { loadFriends, incoming: friendRequests } = useFriendStore();
  const imagePath = `./images/${pieceSets[pieceSetIndex].path}`;

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    initAuth();
    initGame();
  }, []);

  // ─── Load ratings, notifications, friends when user logs in ───────────────
  useEffect(() => {
    if (user?.id) {
      loadRatings(user.id);
      loadNotifications(user.id);
      subscribeNotifs(user.id);
      loadFriends(user.id);
    } else {
      unsubscribeNotifs();
    }
  }, [user?.id]); // eslint-disable-line

  // ─── Timer tick (single interval — prevents double-decrement from two Timer components) ──
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => useGameStore.getState().tickTimer(), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // ─── Computer AI (local for strength ≤6, Stockfish+fallback for ≥7) ───────
  useEffect(() => {
    if (!gameStarted || gameOver || !isComp || compThinking) return;
    const isCompTurn = (compColor === 'white' && activeColor === 'w') ||
                       (compColor === 'black' && activeColor === 'b');
    if (!isCompTurn) return;
    if (currentMoveIndex !== moveHistory.length - 1) return;

    const makeCompMove = async () => {
      if (!chessInstance) return;
      const fen = chessInstance.fen();
      setCompThinking(true);
      setDisableBoard(true);
      try {
        let bestMove;
        if ((compStrength || 4) <= 6) {
          // Local AI — instant, offline, handles low difficulty well
          bestMove = getLocalBestMove(fen, compStrength || 4);
        } else {
          // Stockfish for higher strengths, local AI as fallback
          try {
            bestMove = await getBestMove(fen);
          } catch {
            bestMove = getLocalBestMove(fen, compStrength || 8);
          }
        }
        if (!bestMove || bestMove === '(none)') return;
        const from = bestMove.slice(0, 2);
        const to   = bestMove.slice(2, 4);
        const promotion = bestMove.length === 5 ? bestMove[4] : undefined;
        useGameStore.getState().makeMove(
          { row: 8 - parseInt(from[1]), col: from.charCodeAt(0) - 97 },
          { row: 8 - parseInt(to[1]),   col: to.charCodeAt(0) - 97 },
          promotion
        );
      } catch (e) {
        console.error('Computer move failed:', e);
        setAlertMsg('Computer move error.');
      } finally {
        setCompThinking(false);
        setDisableBoard(false);
      }
    };

    const t = setTimeout(makeCompMove, 300);
    return () => clearTimeout(t);
  }, [activeColor, gameStarted, gameOver, isComp, compColor, compThinking, currentMoveIndex]);

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
    bcastMove(onlineChannelRef.current, { from, to, promotion, fen: currentFen });
    if (onlineRoom?.id) updateRoomFen(onlineRoom.id, currentFen).catch(() => {});

    // Disable board until opponent responds
    if (!state.gameOver) useGameStore.getState().setDisableBoard(true);
  }, [moveHistory.length]);

  // ─── Online: cleanup channel when game ends ───────────────────────────────
  useEffect(() => {
    if (gameOver && isOnline && onlineRoom) {
      endRoom(onlineRoom.id).catch(console.error);
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

    (async () => {
      try {
        const delta = await updateOnlineGameRating({
          userId: user.id,
          username: username || user.email,
          opponentId: oppId,
          score,
          category: cat || 'blitz',
        });
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
  }, [gameOver, isOnline]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const showAlert = (msg) => setAlertMsg(msg);

  const handleGetHint = () => {
    if (!chessInstance || gameOver) return;
    const s = getSuggestion(chessInstance.fen());
    if (s) showAlert(`Hint: ${s.from} → ${s.to}`);
    else   showAlert('No hint available.');
  };

  // ─── Online game handlers ─────────────────────────────────────────────────
  const onIncomingMove = (payload) => {
    const { from, to, promotion } = payload;
    const { col: fc, row: fr } = sqToRowCol(from);
    const { col: tc, row: tr } = sqToRowCol(to);
    useGameStore.getState().makeMove({ row: fr, col: fc }, { row: tr, col: tc }, promotion || null);
    useGameStore.getState().setDisableBoard(false);
  };

  const onIncomingChat = (payload) => {
    setChatMessages(msgs => [...msgs, payload]);
  };

  const onOpponentResign = () => {
    const myColor = useGameStore.getState().onlineColor;
    const winner  = myColor === 'white' ? 'White' : 'Black';
    useGameStore.setState({
      gameOver: true,
      gameOverMessage: `${winner} wins! Opponent resigned.`,
      timerRunning: false,
      disableBoard: true,
      gameResult: { winner: winner.toLowerCase(), reason: 'resign' },
    });
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

    const channel = subscribeToRoom(roomId, {
      onOpponentJoined: (payload) => {
        setWaitingForOpponent(false);
        setOnlineRoom(r => ({ ...r, guestName: payload.username, status: 'playing' }));
        setIsOnlineConnected(true);
        const store = useGameStore.getState();
        store.startOnlineGame(onlineTimeControl, 'white');
        store.setOppName(payload.username || 'Opponent');
        store.setOnlineOpponentId(payload.userId);
      },
      onMove:   onIncomingMove,
      onChat:   onIncomingChat,
      onResign: onOpponentResign,
    });
    onlineChannelRef.current = channel;
  };

  const handleJoinRoom = async (code) => {
    if (!user) { setShowLogin(true); return; }
    const room    = await joinRoom({ roomId: code, guestId: user.id, guestName: username || user.email });
    const myColor = room.host_color === 'white' ? 'black' : 'white';
    setOnlineRoom({ ...room, status: 'playing' });
    setIsOnlineConnected(true);
    broadcastedMoveRef.current = -1;
    setChatMessages([]);

    const channel = subscribeToRoom(code.toUpperCase(), {
      onMove:   onIncomingMove,
      onChat:   onIncomingChat,
      onResign: onOpponentResign,
    });
    onlineChannelRef.current = channel;

    const store = useGameStore.getState();
    store.startOnlineGame(room.time_control, myColor);
    store.setOppName(room.host_name || 'Opponent');
    store.setOnlineOpponentId(room.host_id);

    await broadcastJoin(channel, { userId: user.id, username: username || user.email });
  };

  const handleOnlineSendChat = (text) => {
    if (!onlineChannelRef.current) return;
    const myName = username || user?.email || 'You';
    const msg    = { text, sender: myName, ts: Date.now() };
    setChatMessages(msgs => [...msgs, msg]);
    broadcastChat(onlineChannelRef.current, { text, sender: myName });
  };

  const handleOnlineResign = async () => {
    if (!onlineChannelRef.current) return;
    await broadcastResign(onlineChannelRef.current, user.id);
    const myColor = useGameStore.getState().onlineColor;
    const winner  = myColor === 'white' ? 'Black' : 'White'; // I resigned
    useGameStore.setState({
      gameOver: true,
      gameOverMessage: `${winner} wins! You resigned.`,
      timerRunning: false,
      disableBoard: true,
      gameResult: { winner: winner.toLowerCase(), reason: 'resign' },
    });
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
    broadcastedMoveRef.current = -1;
    resetMatchmaking();
    initGame();
  };

  // ─── Matchmaking handlers ─────────────────────────────────────────────────
  const handleMatchFound = ({ roomId, opponentName, opponentId, yourColor, timeControl: matchedTC }) => {
    const tc = matchedTC || onlineTimeControl;
    setOnlineRoom({ id: roomId, status: 'playing', hostColor: yourColor === 'white' ? 'white' : 'black' });
    setIsOnlineConnected(true);
    broadcastedMoveRef.current = -1;
    setChatMessages([]);

    const channel = subscribeToRoom(roomId, {
      onMove:   onIncomingMove,
      onChat:   onIncomingChat,
      onResign: onOpponentResign,
    });
    onlineChannelRef.current = channel;

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
    // Account tab (5)
    if (index === 5) {
      if (!user) { setShowLogin(true); return; }
      if (gameStarted && !gameOver) {
        setConfirmMsg('End current game?');
        setConfirmAction(() => () => executeTabSwitch(index));
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
        setConfirmAction(() => () => {
          if (isOnline) leaveOnlineGame();
          executeTabSwitch(index);
        });
        setShowConfirm(true);
      } else {
        executeTabSwitch(index);
      }
      return;
    }

    if (gameStarted && !gameOver) {
      const msg = isOnline ? 'Leave online game? (You will forfeit)' : 'End current game?';
      setConfirmMsg(msg);
      setConfirmAction(() => () => {
        if (isOnline) leaveOnlineGame();
        executeTabSwitch(index);
      });
      setShowConfirm(true);
      return;
    }
    executeTabSwitch(index);
  };

  const executeTabSwitch = (index) => {
    setShowConfirm(false);
    setActiveTab(index);
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
      // Account screen
    }
  };

  const loadAnalysisGames = async () => {
    setAnalysisLoading(true);
    try {
      const games = await getGames(user?.id);
      setAnalysisGames(Array.isArray(games) ? games : []);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleStrengthSelect = (strength, color) => {
    setShowStrength(false);
    let compCol = color;
    if (color === 'random') compCol = Math.random() < 0.5 ? 'white' : 'black';
    initGame();
    startGame(pendingTimeControl, true, compCol, strength);
    setPendingTimeControl(null);
    setActiveTab(3);
  };

  const handleGameOverNewGame = () => {
    if (isOnline) leaveOnlineGame();
    initGame();
    setReviewResults(null);
    setRatingDelta(null);
    setActiveTab(0);
  };

  const handleReviewGame = async () => {
    const history = useGameStore.getState().moveHistory;
    if (!history.length) return;
    useGameStore.setState({ gameOver: false });
    setIsReviewing(true);
    setReviewResults(null);
    try {
      const results = await reviewGame(history, () => {});
      setReviewResults(results);
    } finally {
      setIsReviewing(false);
    }
  };

  // ─── Computed ─────────────────────────────────────────────────────────────
  const isOnlineGameActive = activeTab === 4 && isOnline && gameStarted;
  const isGameViewActive   = (activeTab === 1 || activeTab === 3 || isOnlineGameActive) && gameStarted;

  // Player panel data (top = opponent perspective, bottom = you)
  const _PVALS = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const _mat = (arr) => arr.reduce((s, p) => s + (_PVALS[p.type] || 0), 0);
  const whiteMat = _mat(capturedByWhite);
  const blackMat = _mat(capturedByBlack);
  const topColor    = flipped ? 'w' : 'b';
  const bottomColor = flipped ? 'b' : 'w';
  const topName     = flipped ? youName : oppName;
  const bottomName  = flipped ? oppName : youName;
  const topCaptured    = flipped ? capturedByWhite : capturedByBlack;
  const bottomCaptured = flipped ? capturedByBlack : capturedByWhite;
  const topAdv    = flipped ? (whiteMat - blackMat) : (blackMat - whiteMat);
  const bottomAdv = flipped ? (blackMat - whiteMat) : (whiteMat - blackMat);
  const topTime    = flipped ? whiteTime : blackTime;
  const bottomTime = flipped ? blackTime : whiteTime;
  const topActive    = activeColor === topColor;
  const bottomActive = activeColor === bottomColor;

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
        {/* Left sidebar — shown during local games only (not online) */}
        {isGameViewActive && !isOnline && <LeftSidebar onAlert={showAlert} />}

        {/* ── Tab 0: Home ── */}
        {activeTab === 0 && (
          <HomeScreen
            user={user}
            onStart={(mode, tc) => {
              if (mode === 'local') {
                initGame();
                startGame(tc, false, 'black', 4);
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
          <AnalysisBoard savedGames={analysisGames} gamesLoading={analysisLoading} />
        )}

        {/* ── Tab 3: Computer (no game yet) → show home ── */}
        {activeTab === 3 && !gameStarted && (
          <HomeScreen
            user={user}
            onStart={(mode, tc) => {
              if (mode === 'local') { initGame(); startGame(tc, false, 'black', 4); setActiveTab(1); }
              else if (mode === 'computer') { setPendingTimeControl(tc); setShowStrength(true); }
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

        {/* ── Tab 5: Account ── */}
        {activeTab === 5 && !user && (
          <div className="sign-in-prompt">
            <div className="sign-in-prompt-icon">♟</div>
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
                  <div className="online-actions">
                    <button className="online-btn hint-btn" onClick={handleGetHint}>Hint</button>
                    <button className="online-btn resign-btn" onClick={handleOnlineResign}>Resign</button>
                  </div>
                </div>
              )}

              {/* Top player panel */}
              <PlayerPanel
                name={topName} colorCode={topColor}
                time={topTime} timeActive={topActive} timerRunning={timerRunning}
                captured={topCaptured} materialAdv={topAdv}
                timeControl={timeControl} imagePath={imagePath}
              />

              <div className="board-area">
                <Board />
              </div>

              {/* Bottom player panel */}
              <PlayerPanel
                name={bottomName} colorCode={bottomColor}
                time={bottomTime} timeActive={bottomActive} timerRunning={timerRunning}
                captured={bottomCaptured} materialAdv={bottomAdv}
                timeControl={timeControl} imagePath={imagePath}
                showHint={!isOnline} onHint={handleGetHint}
              />
            </div>

            <RightSidebar onAlert={showAlert} reviewResults={reviewResults} isReviewing={isReviewing} />
          </div>
        )}
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
          onConfirm={() => { setShowConfirm(false); if (confirmAction) confirmAction(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {gameOver && gameOverMessage && (
        <GameOverModal
          message={gameOverMessage}
          ratingDelta={ratingDelta}
          onNewGame={handleGameOverNewGame}
          onCancel={() => { useGameStore.setState({ gameOver: false }); setRatingDelta(null); }}
          onAnalyse={() => { useGameStore.setState({ gameOver: false }); setRatingDelta(null); }}
          onReview={handleReviewGame}
        />
      )}

      {showStrength && (
        <StrengthModal
          onSelect={handleStrengthSelect}
          onCancel={() => { setShowStrength(false); if (activeTab === 3) setActiveTab(0); }}
        />
      )}

      {pawnPromotion && (
        <PromotionModal
          color={activeColor === 'w' ? 'white' : 'black'}
          imagePath={imagePath}
          onSelect={completePromotion}
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

// ─── Game Setup Panel ─────────────────────────────────────────────────────────
function GameSetupPanel({ mode, user, onStart, onCancel }) {
  const [selPreset, setSelPreset]     = useState(TC_PRESETS[4]); // 3+2 default
  const [useCustom, setUseCustom]     = useState(false);
  const [noTimer, setNoTimer]         = useState(false);
  const [customMins, setCustomMins]   = useState(5);
  const [customSecs, setCustomSecs]   = useState(0);
  const [delayType, setDelayType]     = useState('fischer');
  const [delayAmt, setDelayAmt]       = useState(2);
  const [activeCat, setActiveCat]     = useState('Blitz');

  const cats = [...new Set(TC_PRESETS.map(p => p.cat))];

  const buildTC = () => {
    if (noTimer) return null;
    if (useCustom) {
      const total = customMins * 60 + customSecs;
      if (total <= 0) return null;
      const inc = delayType === 'fischer' ? delayAmt : 0;
      return { display: `${customMins}:${String(customSecs).padStart(2,'0')}${inc ? '+'+inc : ''}`, total, incr: inc, delayType, delay: delayAmt };
    }
    if (!selPreset) return null;
    const inc = delayType === 'fischer' ? delayAmt : selPreset.incr;
    return { ...selPreset, incr: inc, delayType, delay: delayAmt };
  };

  const canStart = noTimer || useCustom || selPreset;
  const modeLabel = { computer: 'vs Computer', local: 'Pass & Play', online: 'Online' }[mode];

  return (
    <div className="gs-panel">
      <div className="gs-header">
        <span className="gs-title">{modeLabel} — Setup</span>
        <button className="gs-close" onClick={onCancel}>×</button>
      </div>

      <label className="gs-notimer-row">
        <input type="checkbox" checked={noTimer} onChange={e => setNoTimer(e.target.checked)} />
        <span>Untimed game</span>
      </label>

      {!noTimer && <>
        <div className="gs-cats">
          {cats.map(c => (
            <button key={c} className={`gs-cat ${activeCat === c ? 'gs-cat-active' : ''}`} onClick={() => { setActiveCat(c); setUseCustom(false); }}>
              {c}
            </button>
          ))}
          <button className={`gs-cat ${useCustom ? 'gs-cat-active' : ''}`} onClick={() => setUseCustom(true)}>Custom</button>
        </div>

        {!useCustom && (
          <div className="gs-presets">
            {TC_PRESETS.filter(p => p.cat === activeCat).map(p => (
              <button key={p.display}
                className={`gs-preset ${selPreset?.display === p.display ? 'gs-preset-active' : ''}`}
                onClick={() => setSelPreset(p)}
              >
                {p.display}
              </button>
            ))}
          </div>
        )}

        {useCustom && (
          <div className="gs-custom-row">
            <div className="gs-custom-field">
              <label>Minutes</label>
              <input type="number" min="0" max="180" value={customMins}
                onChange={e => setCustomMins(Math.max(0, parseInt(e.target.value)||0))}
                className="gs-num-input" />
            </div>
            <span className="gs-colon">:</span>
            <div className="gs-custom-field">
              <label>Seconds</label>
              <input type="number" min="0" max="59" value={customSecs}
                onChange={e => setCustomSecs(Math.min(59,Math.max(0,parseInt(e.target.value)||0)))}
                className="gs-num-input" />
            </div>
          </div>
        )}

        <div className="gs-section-label">Time Control Type</div>
        <div className="gs-delay-row">
          {DELAY_TYPES.map(d => (
            <button key={d.key} title={d.tip || ''}
              className={`gs-delay-btn ${delayType === d.key ? 'gs-delay-active' : ''}`}
              onClick={() => setDelayType(d.key)}>
              {d.label}
            </button>
          ))}
        </div>

        {delayType !== 'none' && (
          <div className="gs-delay-amt">
            <span>{delayType === 'fischer' ? 'Increment' : 'Delay'} (sec):</span>
            <input type="number" min="0" max="60" value={delayAmt}
              onChange={e => setDelayAmt(Math.max(0, parseInt(e.target.value)||0))}
              className="gs-num-input gs-num-small" />
          </div>
        )}
      </>}

      <button className="gs-start-btn" disabled={!canStart} onClick={() => canStart && onStart(buildTC())}>
        Start Game
      </button>
    </div>
  );
}

// ─── Home screen ─────────────────────────────────────────────────────────────

const QUICK_TCS = [
  { display: '1+0',   cat: 'Bullet',    total: 60,   incr: 0,  catKey: 'bullet'    },
  { display: '3+0',   cat: 'Blitz',     total: 180,  incr: 0,  catKey: 'blitz'     },
  { display: '5+0',   cat: 'Blitz',     total: 300,  incr: 0,  catKey: 'blitz'     },
  { display: '10+0',  cat: 'Rapid',     total: 600,  incr: 0,  catKey: 'rapid'     },
  { display: '15+10', cat: 'Rapid',     total: 900,  incr: 10, catKey: 'rapid'     },
  { display: '30+0',  cat: 'Classical', total: 1800, incr: 0,  catKey: 'classical' },
];

const FEATURE_CARDS = [
  { icon: '♟', title: 'vs Computer',  desc: '10 difficulty levels',       tab: 3,  accent: '#a78bfa' },
  { icon: '⚡', title: 'Puzzles',      desc: 'Train your tactics',         tab: 6,  accent: '#fbbf24' },
  { icon: '📊', title: 'Analysis',     desc: 'Review & explore games',     tab: 2,  accent: '#34d399' },
  { icon: '🏆', title: 'Tournaments',  desc: 'Swiss & arena events',       tab: 10, accent: '#f97316' },
  { icon: '🤝', title: 'Clubs',        desc: 'Join a chess community',     tab: 9,  accent: '#fb923c' },
  { icon: '👁', title: 'Watch',        desc: 'Live games in progress',     tab: 7,  accent: '#38bdf8' },
  { icon: '📈', title: 'Leaderboard',  desc: 'Top rated players',          tab: 11, accent: '#e879f9' },
  { icon: '🫂', title: 'Friends',      desc: 'Connect & challenge',        tab: 8,  accent: '#4ade80' },
];

function HomeScreen({ user, onStart, onPlayOnline, onTabClick, onQuickMatch }) {
  const [liveCount, setLiveCount] = useState(null);
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0];

  useEffect(() => {
    supabase
      .from('chess_rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'playing')
      .then(({ count }) => setLiveCount(count ?? 0));
  }, []);

  return (
    <div className="home-screen">
      <div className="home-body">

        {/* ── Hero ── */}
        <div className="home-hero-wrap">
          <div className="home-king-deco">♚</div>
          <h1 className="home-title">
            Play Chess.<br />
            <span className="home-title-accent">Free.</span>{' '}
            <span className="home-title-muted">No account needed.</span>
          </h1>
          <p className="home-tagline">
            No ads. No paywalls. Open to everyone.
            {liveCount !== null && (
              <span className="home-live-badge">
                <span className="home-live-dot" />
                {liveCount} game{liveCount !== 1 ? 's' : ''} in progress
              </span>
            )}
          </p>
          {user && (
            <p className="home-welcome">Welcome back, <strong>{displayName}</strong></p>
          )}
        </div>

        {/* ── Quick play ── */}
        <div className="home-section">
          <div className="home-section-label">
            Quick Play — Online Matchmaking
          </div>
          <div className="home-tc-grid">
            {QUICK_TCS.map(tc => (
              <button
                key={tc.display}
                className="home-tc-btn"
                onClick={() => onQuickMatch(tc)}
              >
                <span className="home-tc-time">{tc.display}</span>
                <span className="home-tc-cat">{tc.cat}</span>
              </button>
            ))}
            <button className="home-tc-btn home-tc-custom" onClick={onPlayOnline}>
              <span className="home-tc-time">Custom</span>
              <span className="home-tc-cat">All options</span>
            </button>
          </div>
          {!user && (
            <p className="home-login-hint">
              Account required for rated matchmaking.{' '}
              <button className="home-login-link" onClick={() => onTabClick(5)}>Sign in →</button>
            </p>
          )}
        </div>

        {/* ── Pass & Play (no account needed) ── */}
        <div className="home-section">
          <div className="home-section-label">Local Play — No account needed</div>
          <div className="home-local-row">
            <button className="home-local-btn" onClick={() => onStart('local', { initialTime: 300, increment: 0, noTimer: false })}>
              <span className="home-local-icon">♞</span>
              <div>
                <div className="home-local-title">Pass &amp; Play</div>
                <div className="home-local-desc">Two players, one device</div>
              </div>
            </button>
            <button className="home-local-btn" onClick={() => onTabClick(3)}>
              <span className="home-local-icon">♛</span>
              <div>
                <div className="home-local-title">vs Computer</div>
                <div className="home-local-desc">10 difficulty levels, offline</div>
              </div>
            </button>
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
                <span className="home-feat-icon">{f.icon}</span>
                <div className="home-feat-text">
                  <div className="home-feat-title">{f.title}</div>
                  <div className="home-feat-desc">{f.desc}</div>
                </div>
                <span className="home-feat-arrow">›</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer badge ── */}
        <div className="home-footer">
          <span className="home-footer-brand">♟ PG.Chess</span>
          <span className="home-footer-badge">Free · Open · No ads</span>
        </div>

      </div>
    </div>
  );
}

// ─── Player panel ─────────────────────────────────────────────────────────────
const PP_PIECE_MAP = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
function formatPPTime(s) {
  if (s <= 0) return '0:00';
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function PlayerPanel({ name, colorCode, time, timeActive, timerRunning, captured, materialAdv, timeControl, imagePath, showHint, onHint }) {
  const initial = (name || (colorCode === 'w' ? 'W' : 'B'))[0].toUpperCase();
  const isLow   = timeActive && timerRunning && time <= 30;
  const ticking = timeActive && timerRunning;

  return (
    <div className={`player-panel ${ticking ? 'player-panel-ticking' : ''}`}>
      <div className="pp-left">
        <div className={`pp-avatar pp-avatar-${colorCode}`}>{initial}</div>
        <div className="pp-meta">
          <span className="pp-name">{name || (colorCode === 'w' ? 'White' : 'Black')}</span>
          <div className="pp-captures">
            {captured.map((p, i) => (
              <img
                key={i}
                src={`${imagePath}${PP_PIECE_MAP[p.type]}-${p.color === 'w' ? 'white' : 'black'}.png`}
                className="pp-cap-img"
                alt={p.type}
              />
            ))}
            {materialAdv > 0 && <span className="pp-adv">+{materialAdv}</span>}
          </div>
        </div>
      </div>
      <div className="pp-right">
        {showHint && (
          <button className="pp-hint-btn" onClick={onHint} title="Get hint">Hint</button>
        )}
        {timeControl && (
          <div className={`pp-clock ${ticking ? 'pp-clock-active' : ''} ${isLow ? 'pp-clock-low' : ''}`}>
            {formatPPTime(time)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Account / Profile screen ────────────────────────────────────────────────
const RATING_CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical'];

function AccountScreen({ onAlert, onLoadGame }) {
  const { user, username, logout } = useAuthStore();
  const { pieceSets, pieceSetIndex, setPieceSet, themes, themeIndex, applyTheme } = useThemeStore();
  const { myRatings, loadRatings } = useRatingStore();
  const [games, setGames]           = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [activeTab, setActiveTab]   = useState('ratings');
  const [editName, setEditName]     = useState(username || '');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadRatings(user.id);
      getGames(user.id).then(g => { setGames(Array.isArray(g) ? g : []); setGamesLoading(false); });
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
        {['ratings','profile','appearance','games'].map(t => (
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

      {/* ── Appearance tab ── */}
      {activeTab === 'appearance' && (
        <div className="acct-section">
          <div className="acct-field">
            <label className="acct-label">Piece Set</label>
            <div className="acct-piece-sets">
              {pieceSets.map((ps, i) => (
                <button key={ps.name}
                  className={`acct-ps-btn ${pieceSetIndex === i ? 'acct-ps-active' : ''}`}
                  onClick={() => setPieceSet(i)}>
                  <img src={`./images/${ps.path}queen-white.png`} alt={ps.name} className="acct-ps-img" />
                  <span>{ps.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="acct-field">
            <label className="acct-label">Board Theme</label>
            <div className="acct-themes">
              {themes.map((th, i) => (
                <button key={th.name}
                  className={`acct-theme-btn ${themeIndex === i ? 'acct-theme-active' : ''}`}
                  onClick={() => applyTheme(i)}>
                  <div className="acct-theme-swatch">
                    <div style={{background:th.clr1, width:'50%', height:'100%'}}/>
                    <div style={{background:th.clr2, width:'50%', height:'100%'}}/>
                  </div>
                  <span>{th.name}</span>
                </button>
              ))}
            </div>
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
