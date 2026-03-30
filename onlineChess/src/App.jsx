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
import useGameStore from './store/gameStore';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import { getBestMove } from './utils/stockfish';
import { postGame, getGames } from './utils/gameServer';
import { evaluatePosition, evalToWhitePct, formatEval } from './utils/evaluation';
import { getLocalBestMove, getSuggestion } from './utils/localAI';
import { reviewGame } from './utils/reviewEngine';
import {
  createRoom, joinRoom, subscribeToRoom,
  broadcastMove as bcastMove, broadcastChat, broadcastResign, broadcastJoin,
  endRoom, unsubscribe, sqToRowCol, rowColToSq,
} from './utils/multiplayerService';

// ─── Time control data ────────────────────────────────────────────────────────
const TIME_CONTROLS = [
  { category: 'Bullet', controls: [
    { display: '1 min', total: 60,  incr: 0 },
    { display: '1|1',   total: 60,  incr: 1 },
  ]},
  { category: 'Blitz', controls: [
    { display: '2|1',   total: 120, incr: 1 },
    { display: '3 min', total: 180, incr: 0 },
    { display: '3|2',   total: 180, incr: 2 },
  ]},
  { category: 'Rapid', controls: [
    { display: '5 min',  total: 300, incr: 0 },
    { display: '10 min', total: 600, incr: 0 },
    { display: '15|10',  total: 900, incr: 10 },
  ]},
  { category: 'Classical', controls: [
    { display: '30 min', total: 1800, incr: 0 },
  ]},
];

const ONLINE_TIME_CONTROLS = [
  { display: '1 min',  total: 60,  incr: 0 },
  { display: '3 min',  total: 180, incr: 0 },
  { display: '5 min',  total: 300, incr: 0 },
  { display: '10 min', total: 600, incr: 0 },
  { display: '15|10',  total: 900, incr: 10 },
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab]           = useState(0);
  const [selectedTime, setSelectedTime]     = useState(null);
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
  } = useGameStore();

  const { pieceSets, pieceSetIndex } = useThemeStore();
  const imagePath = `./images/${pieceSets[pieceSetIndex].path}`;

  // Eval bar
  const evalScore = evaluatePosition(boardState);
  const whitePct  = evalToWhitePct(evalScore);
  const evalLabel = formatEval(evalScore);

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    initAuth();
    initGame();
  }, []);

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

    bcastMove(onlineChannelRef.current, { from, to, promotion });

    // Disable board until opponent responds
    if (!state.gameOver) useGameStore.getState().setDisableBoard(true);
  }, [moveHistory.length]);

  // ─── Online: cleanup channel when game ends ───────────────────────────────
  useEffect(() => {
    if (gameOver && isOnline && onlineRoom) {
      endRoom(onlineRoom.id).catch(console.error);
    }
  }, [gameOver]);

  // ─── Save game on end ─────────────────────────────────────────────────────
  useEffect(() => {
    if (gameOver && user && moveHistory.length > 0 && !isOnline) {
      const pgn   = useGameStore.getState().getPgn();
      const color = isComp ? (compColor === 'white' ? 'black' : 'white') : 'white';
      postGame(token, { color, opponent: oppName, timerData, pgnStr: pgn, userId: user.id }).catch(console.error);
    }
  }, [gameOver]);

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
    const loser   = myColor === 'white' ? 'White' : 'Black';
    useGameStore.setState({
      gameOver: true,
      gameOverMessage: `${loser === 'White' ? 'Black' : 'White'} wins! You resigned.`,
      timerRunning: false,
      disableBoard: true,
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
    initGame();
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
      if (!selectedTime) { setActiveTab(0); showAlert('Please select a time control first'); return; }
      initGame();
      startGame(selectedTime, false, 'black', 4);
    } else if (index === 2) {
      initGame();
      loadAnalysisGames();
    } else if (index === 3) {
      if (!selectedTime) { setActiveTab(0); showAlert('Please select a time control first'); return; }
      setShowStrength(true);
    } else if (index === 4) {
      // Online tab — lobby shown by default, no initGame (don't reset mid-session)
    } else if (index === 5) {
      // Account screen
    }
  };

  const loadAnalysisGames = async () => {
    setAnalysisLoading(true);
    try {
      const games = await getGames(token);
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
    startGame(selectedTime, true, compCol, strength);
    setActiveTab(3);
  };

  const handleGameOverNewGame = () => {
    if (isOnline) leaveOnlineGame();
    initGame();
    setReviewResults(null);
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

  const handleAnalysisGameClick = (game) => {
    if (game.pgnStr) {
      const ok = importPgn(game.pgnStr);
      if (ok) { setActiveTab(1); showAlert('Game loaded for analysis'); }
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
      <LeftNav activeTab={activeTab} onTabClick={handleTabClick} />

      <div className="main-content">
        {/* Left sidebar — shown during local games only (not online) */}
        {isGameViewActive && !isOnline && <LeftSidebar onAlert={showAlert} />}

        {/* ── Tab 0: Home ── */}
        {activeTab === 0 && (
          <HomeScreen
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
            onPlayLocal={() => {
              if (!selectedTime) { showAlert('Pick a time control first'); return; }
              executeTabSwitch(1);
            }}
            onPlayComputer={() => {
              if (!selectedTime) { showAlert('Pick a time control first'); return; }
              setShowStrength(true);
            }}
            onPlayOnline={() => executeTabSwitch(4)}
            user={user}
          />
        )}

        {/* ── Tab 2: Analysis ── */}
        {activeTab === 2 && (
          <div className="analysis-screen">
            <h2>Game Analysis</h2>
            {analysisLoading && <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading games...</p>}
            {!analysisLoading && analysisGames.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No saved games. Play some to see them here.</p>
            )}
            {analysisGames.map((game, i) => (
              <div key={i} className="game-card" onClick={() => handleAnalysisGameClick(game)}>
                <div className="game-card-header">
                  <span className="game-card-players">
                    {game.color === 'white' ? 'You (W)' : 'You (B)'} vs {game.opponent || 'Opponent'}
                  </span>
                  <span className="game-card-meta">{game.color}</span>
                </div>
                <div className="game-card-pgn">{(game.pgnStr || '').slice(0, 80)}…</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab 3: Computer (no game yet) → show home ── */}
        {activeTab === 3 && !gameStarted && (
          <HomeScreen
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
            onPlayLocal={() => {
              if (!selectedTime) { showAlert('Pick a time control first'); return; }
              executeTabSwitch(1);
            }}
            onPlayComputer={() => {
              if (!selectedTime) { showAlert('Pick a time control first'); return; }
              setShowStrength(true);
            }}
            onPlayOnline={() => executeTabSwitch(4)}
            user={user}
            highlight="computer"
          />
        )}

        {/* ── Tab 4: Online lobby (no active game) ── */}
        {activeTab === 4 && !isOnline && (
          <OnlineLobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            roomId={onlineRoom?.id}
            waitingForOpponent={waitingForOpponent}
            onCancelWait={handleCancelWait}
            timeControls={ONLINE_TIME_CONTROLS}
            selectedTime={onlineTimeControl}
            onSelectTime={setOnlineTimeControl}
          />
        )}

        {/* ── Tab 5: Account ── */}
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
            {/* Eval bar */}
            <div className="eval-bar">
              <span className="eval-score eval-score-black">
                {evalScore < -15 ? formatEval(evalScore).replace('-', '') : ''}
              </span>
              <div className="eval-fill-black" style={{ height: `${flipped ? whitePct : 100 - whitePct}%` }} />
              <div className="eval-fill-white" style={{ height: `${flipped ? 100 - whitePct : whitePct}%` }} />
              <span className="eval-score eval-score-white">
                {evalScore > 15 ? evalLabel : ''}
              </span>
            </div>

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
          onNewGame={handleGameOverNewGame}
          onCancel={() => useGameStore.setState({ gameOver: false })}
          onAnalyse={() => useGameStore.setState({ gameOver: false })}
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

// ─── Home screen ─────────────────────────────────────────────────────────────
const MODE_CARDS = [
  {
    key: 'online',
    icon: '♟',
    iconBg: 'rgba(0,255,245,0.08)',
    title: 'Play Online',
    desc: 'Challenge players worldwide. Create a room or join with a code.',
    btnFn: 'onPlayOnline',
    btnLabel: (user) => user ? 'Play Online' : 'Login & Play',
  },
  {
    key: 'computer',
    icon: '♛',
    iconBg: 'rgba(180,120,255,0.1)',
    title: 'vs Computer',
    desc: 'Test your skills from beginner to Stockfish master (10 levels).',
    btnFn: 'onPlayComputer',
    btnLabel: () => 'Play Computer',
  },
  {
    key: 'local',
    icon: '♞',
    iconBg: 'rgba(255,180,0,0.08)',
    title: 'Pass & Play',
    desc: 'Two players, one device. Full timers, move history, and analysis.',
    btnFn: 'onPlayLocal',
    btnLabel: () => 'Play Local',
  },
];

function HomeScreen({ selectedTime, onSelectTime, onPlayLocal, onPlayComputer, onPlayOnline, user, highlight }) {
  const handlers = { onPlayOnline, onPlayComputer, onPlayLocal };
  return (
    <div className="home-screen">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-deco">♚</div>
        <h1 className="home-hero-title">Play <span>Chess</span></h1>
        <p className="home-hero-sub">
          {user ? `Welcome back, ${user.user_metadata?.full_name || user.email?.split('@')[0]}` : 'Pick a mode and start playing'}
        </p>
      </div>

      {/* Mode cards */}
      <div className="mode-grid">
        {MODE_CARDS.map(card => (
          <div
            key={card.key}
            className={`mode-card ${highlight === card.key ? 'mode-card-hl' : ''}`}
          >
            <div className="mode-card-icon-wrap" style={{ background: card.iconBg }}>
              <span className="mode-card-icon">{card.icon}</span>
            </div>
            <div className="mode-card-title">{card.title}</div>
            <div className="mode-card-desc">{card.desc}</div>
            <button className="mode-card-btn" onClick={handlers[card.btnFn]}>
              {card.btnLabel(user)}
            </button>
          </div>
        ))}
      </div>

      {/* Time control */}
      <div className="tc-section">
        <div className="tc-header">
          <span className="tc-header-label">Time Control</span>
          <div className="tc-header-line" />
          <span className="tc-selected-display">
            {selectedTime ? selectedTime.display : 'none selected'}
          </span>
        </div>
        <div className="tc-rows">
          {TIME_CONTROLS.map(cat => (
            <div className="tc-row" key={cat.category}>
              <span className="tc-cat">{cat.category}</span>
              <div className="tc-chips">
                {cat.controls.map(tc => (
                  <button
                    key={tc.display}
                    className={`tc-chip ${selectedTime?.display === tc.display ? 'tc-selected' : ''}`}
                    onClick={() => onSelectTime(tc)}
                  >
                    {tc.display}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
          {captured.length > 0 && (
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
          )}
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

// ─── Account screen ───────────────────────────────────────────────────────────
function AccountScreen({ onAlert, onLogout, onLoadGame }) {
  const { user, username, logout } = useAuthStore();
  const [games, setGames]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGames(user?.id).then(g => { setGames(Array.isArray(g) ? g : []); setLoading(false); });
  }, []);

  const wins   = games.filter(g => g.result === 'win').length;
  const losses = games.filter(g => g.result === 'loss').length;

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="account-screen">
      <div className="account-header">
        <div className="account-avatar">{(username || user?.email || '?')[0].toUpperCase()}</div>
        <div className="account-info">
          <div className="account-name">{username || user?.email}</div>
          <div className="account-email">{user?.email}</div>
        </div>
        <button className="account-logout-btn" onClick={async () => { await logout(); }}>Logout</button>
      </div>

      <div className="account-stats">
        <div className="stat-box">
          <div className="stat-value">{games.length}</div>
          <div className="stat-label">Games</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: '#aaffaa' }}>{wins}</div>
          <div className="stat-label">Wins</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: '#ff9999' }}>{losses}</div>
          <div className="stat-label">Losses</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: '#ffdd99' }}>{games.length - wins - losses}</div>
          <div className="stat-label">Draws</div>
        </div>
      </div>

      <div className="account-games-title">Recent Games</div>
      {loading && <p style={{ color: 'rgba(255,255,255,0.4)', padding: '0 20px' }}>Loading games…</p>}
      {!loading && games.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.4)', padding: '0 20px' }}>No games yet. Play some to see them here.</p>
      )}
      <div className="account-games-list">
        {games.map((game, i) => (
          <div key={i} className="account-game-row" onClick={() => onLoadGame(game)}>
            <div className="account-game-vs">
              <span className={`game-color-badge ${game.color}`}>{game.color === 'white' ? 'W' : 'B'}</span>
              vs {game.opponent || 'Unknown'}
            </div>
            <div className="account-game-meta">
              {game.result && <span className={`game-result ${game.result}`}>{game.result}</span>}
              <span className="game-date">{formatDate(game.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
