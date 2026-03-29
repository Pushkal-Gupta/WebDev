import { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar/Navbar';
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
import useGameStore from './store/gameStore';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import { getBestMove } from './utils/stockfish';
import { postGame, getGames } from './utils/gameServer';

// Time control data
const TIME_CONTROLS = [
  { category: 'Bullet', controls: [
    { display: '1 min', total: 60, incr: 0 },
    { display: '1|1', total: 60, incr: 1 },
  ]},
  { category: 'Blitz', controls: [
    { display: '2|1', total: 120, incr: 1 },
    { display: '3 min', total: 180, incr: 0 },
    { display: '3|2', total: 180, incr: 2 },
  ]},
  { category: 'Rapid', controls: [
    { display: '5 min', total: 300, incr: 0 },
    { display: '10 min', total: 600, incr: 0 },
    { display: '15|10', total: 900, incr: 10 },
  ]},
  { category: 'Classical', controls: [
    { display: '30 min', total: 1800, incr: 0 },
  ]},
];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');
  const [analysisGames, setAnalysisGames] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const { user, token, init: initAuth } = useAuthStore();
  const {
    gameStarted, gameOver, gameOverMessage,
    startGame, init: initGame,
    pawnPromotion, completePromotion,
    isComp, compColor, compThinking,
    setCompThinking, setDisableBoard,
    chessInstance, activeColor,
    timerData, oppName,
    moveHistory, currentMoveIndex,
    importPgn,
  } = useGameStore();
  const { pieceSets, pieceSetIndex } = useThemeStore();
  const imagePath = `/images/${pieceSets[pieceSetIndex].path}`;

  // Init auth on load
  useEffect(() => {
    initAuth();
    initGame();
  }, []);

  // Handle computer moves
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
        const bestMove = await getBestMove(fen);
        if (!bestMove || bestMove === '(none)') return;
        const from = bestMove.slice(0, 2);
        const to = bestMove.slice(2, 4);
        const promotion = bestMove.length === 5 ? bestMove[4] : undefined;
        const fromRow = 8 - parseInt(from[1]);
        const fromCol = from.charCodeAt(0) - 'a'.charCodeAt(0);
        const toRow = 8 - parseInt(to[1]);
        const toCol = to.charCodeAt(0) - 'a'.charCodeAt(0);
        useGameStore.getState().makeMove(
          { row: fromRow, col: fromCol },
          { row: toRow, col: toCol },
          promotion
        );
      } catch (e) {
        console.error('Computer move failed:', e);
        setAlertMsg('Computer move failed. Check connection.');
      } finally {
        setCompThinking(false);
        setDisableBoard(false);
      }
    };

    const timeout = setTimeout(makeCompMove, 300);
    return () => clearTimeout(timeout);
  }, [activeColor, gameStarted, gameOver, isComp, compColor, compThinking, currentMoveIndex]);

  // Post game when game ends
  useEffect(() => {
    if (gameOver && token && moveHistory.length > 0) {
      const pgn = useGameStore.getState().getPgn();
      const color = isComp ? (compColor === 'white' ? 'black' : 'white') : 'white';
      postGame(token, {
        color,
        opponent: oppName,
        timerData,
        pgnStr: pgn,
      }).catch(console.error);
    }
  }, [gameOver]);

  const showAlert = (msg) => setAlertMsg(msg);

  const handleTabClick = (index) => {
    if (index === 4) {
      if (user) setShowLogout(true);
      else setShowLogin(true);
      return;
    }

    if (gameStarted && !gameOver) {
      setConfirmMsg('End current game?');
      setConfirmAction(() => () => executeTabSwitch(index));
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
      if (!selectedTime) {
        setActiveTab(0);
        showAlert('Please select a time control first');
        return;
      }
      initGame();
      startGame(selectedTime, false, 'black', 4);
    } else if (index === 2) {
      if (!token) {
        showAlert('Please login first');
        setActiveTab(0);
        return;
      }
      initGame();
      loadAnalysisGames();
    } else if (index === 3) {
      if (!selectedTime) {
        setActiveTab(0);
        showAlert('Please select a time control first');
        return;
      }
      setShowStrength(true);
    }
  };

  const loadAnalysisGames = async () => {
    if (!token) return;
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
    initGame();
    setActiveTab(0);
  };

  const handleAnalysisGameClick = (game) => {
    if (game.pgnStr) {
      const success = importPgn(game.pgnStr);
      if (success) {
        setActiveTab(1);
        showAlert('Game loaded for analysis');
      }
    }
  };

  const isGameViewActive = (activeTab === 1 || activeTab === 3) && gameStarted;

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} onTabClick={handleTabClick} />

      <div className="main-content">
        {/* Left sidebar shown when game is active */}
        {isGameViewActive && <LeftSidebar onAlert={showAlert} />}

        {/* Time limit selection */}
        {activeTab === 0 && (
          <TimeScreen
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
            onPlay={() => {
              if (!selectedTime) { showAlert('Please select a time control'); return; }
              executeTabSwitch(1);
            }}
          />
        )}

        {/* Analysis screen */}
        {activeTab === 2 && (
          <div className="analysis-screen">
            <h2>Game Analysis</h2>
            {analysisLoading && <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading games...</p>}
            {!analysisLoading && analysisGames.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No games found. Play some games to see them here.</p>
            )}
            {analysisGames.map((game, i) => (
              <div key={i} className="game-card" onClick={() => handleAnalysisGameClick(game)}>
                <div className="game-card-header">
                  <span className="game-card-players">
                    {game.color === 'white' ? 'You (W)' : 'You (B)'} vs {game.opponent || 'Opponent'}
                  </span>
                  <span className="game-card-meta">{game.color}</span>
                </div>
                <div className="game-card-pgn">{(game.pgnStr || '').slice(0, 80)}...</div>
              </div>
            ))}
          </div>
        )}

        {/* Game view (new game or computer) */}
        {isGameViewActive && (
          <div className="game-layout">
            <div className="board-area">
              <Board />
            </div>
            <RightSidebar onAlert={showAlert} />
          </div>
        )}

        {/* Computer tab but no game yet */}
        {activeTab === 3 && !gameStarted && (
          <div className="time-screen">
            <h2>Play vs Computer</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Select a time control, then configure computer settings.</p>
            <TimeScreen
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
              onPlay={() => {
                if (!selectedTime) { showAlert('Please select a time control'); return; }
                setShowStrength(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {alertMsg && <CustomAlert message={alertMsg} onDone={() => setAlertMsg('')} />}

      {showConfirm && (
        <ConfirmModal
          message={confirmMsg}
          onConfirm={() => {
            setShowConfirm(false);
            if (confirmAction) confirmAction();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {gameOver && gameOverMessage && (
        <GameOverModal
          message={gameOverMessage}
          onNewGame={handleGameOverNewGame}
          onCancel={() => useGameStore.setState({ gameOver: false })}
          onAnalyse={() => useGameStore.setState({ gameOver: false })}
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

      {showLogout && (
        <LogoutModal onClose={() => setShowLogout(false)} />
      )}
    </div>
  );
}

// Time selection screen component
function TimeScreen({ selectedTime, onSelectTime, onPlay }) {
  return (
    <div className="time-screen">
      <h2>Select Time Control</h2>
      <div className="time-selected-btn">
        {selectedTime ? `Selected: ${selectedTime.display}` : 'No time selected'}
      </div>
      {TIME_CONTROLS.map((cat) => (
        <div key={cat.category} className="time-category">
          <div className="time-category-label">{cat.category}</div>
          <div className="time-grid">
            {cat.controls.map((tc) => (
              <button
                key={tc.display}
                className={`time-btn ${selectedTime?.display === tc.display ? 'selected' : ''}`}
                onClick={() => onSelectTime(tc)}
              >
                {tc.display}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="play-btn" onClick={onPlay} disabled={!selectedTime}>
        Play Game
      </button>
    </div>
  );
}

export { TimeScreen };
