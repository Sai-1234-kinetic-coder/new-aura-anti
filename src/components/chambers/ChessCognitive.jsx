import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import confetti from 'canvas-confetti';
import { 
  Brain, 
  Trophy, 
  RotateCcw, 
  Play, 
  Swords, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Flag,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { getAIMove, CHESS_PUZZLES, calculateNewElo } from '../../lib/chessEngine';
import { audioSynth } from '../../lib/audioSynth';

const PIECE_SYMBOLS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};

export default function ChessCognitive({ onPointsEarned }) {
  const [activeMode, setActiveMode] = useState('bot'); // 'bot' | 'puzzles' | 'pvp'

  // Chess Instance State
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(() => game.fen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStatus, setGameStatus] = useState('Game in progress');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // AI Difficulty Level (1 to 5)
  const [aiLevel, setAiLevel] = useState(3);

  // Cognitive Profile & Elo State
  const [chessProfile, setChessProfile] = useState(() => {
    const saved = localStorage.getItem('aurafit_chess_profile');
    return saved ? JSON.parse(saved) : {
      elo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      puzzlesSolved: 0,
      enduranceIndex: 78
    };
  });

  // Puzzle State
  const [activePuzzleIndex, setActivePuzzleIndex] = useState(0);
  const currentPuzzle = CHESS_PUZZLES[activePuzzleIndex];
  const [puzzleState, setPuzzleState] = useState('unsolved'); // 'unsolved' | 'correct' | 'wrong'

  // Save profile changes
  useEffect(() => {
    localStorage.setItem('aurafit_chess_profile', JSON.stringify(chessProfile));
  }, [chessProfile]);

  // Sync board representation from FEN
  const board = game.board();

  // Reset or initialize mode
  const initBotGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setMoveHistory([]);
    setIsGameOver(false);
    setGameStatus('White to move. Good luck!');
  }, []);

  const loadPuzzle = useCallback((puzzle) => {
    const pGame = new Chess(puzzle.fen);
    setGame(pGame);
    setFen(pGame.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setMoveHistory([]);
    setIsGameOver(false);
    setPuzzleState('unsolved');
    setGameStatus(`${puzzle.turn === 'w' ? 'White' : 'Black'} to move — ${puzzle.theme}`);
  }, []);

  useEffect(() => {
    if (activeMode === 'puzzles') {
      loadPuzzle(currentPuzzle);
    } else {
      initBotGame();
    }
  }, [activeMode, currentPuzzle, initBotGame, loadPuzzle]);

  // Make Move Handler
  const makeAMove = useCallback((moveObj) => {
    try {
      const result = game.move(moveObj);
      if (!result) return false;

      // Update state
      setFen(game.fen());
      setMoveHistory(prev => [...prev, result.san]);
      setSelectedSquare(null);
      setValidMoves([]);

      // Audio cues
      if (result.captured) {
        audioSynth.playHydrationChime(); // capture chime
      } else {
        audioSynth.playBeep(true); // move tick
      }

      // Check for Game Over
      if (game.isGameOver()) {
        setIsGameOver(true);
        if (game.isCheckmate()) {
          const winner = game.turn() === 'w' ? 'Black' : 'White';
          setGameStatus(`Checkmate! ${winner} is victorious 🏆`);
          audioSynth.playFanfare();
          confetti({ particleCount: 80, spread: 70 });

          // Update Elo
          if (activeMode === 'bot') {
            const userWon = winner === 'White';
            const botElo = 800 + aiLevel * 200;
            const newElo = calculateNewElo(chessProfile.elo, botElo, userWon ? 1 : 0);

            setChessProfile(prev => ({
              ...prev,
              elo: newElo,
              wins: userWon ? prev.wins + 1 : prev.wins,
              losses: !userWon ? prev.losses + 1 : prev.losses,
              enduranceIndex: Math.min(99, prev.enduranceIndex + (userWon ? 2 : -1))
            }));

            if (userWon && onPointsEarned) {
              onPointsEarned(50 + aiLevel * 10, 0);
            }
          }
        } else if (game.isDraw()) {
          setGameStatus('Game drawn (Stalemate / Insufficient Material).');
          setChessProfile(prev => ({ ...prev, draws: prev.draws + 1 }));
        }
        return true;
      }

      if (game.inCheck()) {
        setGameStatus('Check! Guard your King.');
        audioSynth.playBeep(false);
      } else {
        setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'} to move`);
      }

      return true;
    } catch (err) {
      return false;
    }
  }, [game, activeMode, aiLevel, chessProfile.elo, onPointsEarned]);

  // AI Response Trigger
  useEffect(() => {
    if (activeMode === 'bot' && !isGameOver && game.turn() === 'b') {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiSan = getAIMove(game, aiLevel);
        if (aiSan) {
          makeAMove(aiSan);
        }
        setIsAiThinking(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [fen, activeMode, isGameOver, game, aiLevel, makeAMove]);

  // Square Click Handler
  const handleSquareClick = (squareKey) => {
    if (isGameOver || isAiThinking) return;

    // In Puzzle mode, verify user move
    if (activeMode === 'puzzles') {
      if (selectedSquare) {
        // Attempt move
        const moveAttempt = { from: selectedSquare, to: squareKey, promotion: 'q' };
        const valid = game.move(moveAttempt);
        if (valid) {
          game.undo(); // undo so makeAMove can apply cleanly
          const expectedSan = currentPuzzle.solution[0];
          const actualSan = valid.san;

          if (actualSan === expectedSan || actualSan.replace('+', '') === expectedSan.replace('+', '')) {
            makeAMove(moveAttempt);
            setPuzzleState('correct');
            setGameStatus('✅ Excellent foresight! Tactical solution solved.');
            audioSynth.playFanfare();
            confetti({ particleCount: 70 });
            setChessProfile(prev => ({
              ...prev,
              elo: prev.elo + 15,
              puzzlesSolved: prev.puzzlesSolved + 1,
              enduranceIndex: Math.min(99, prev.enduranceIndex + 3)
            }));
            if (onPointsEarned) onPointsEarned(currentPuzzle.xpReward, 0);
          } else {
            setPuzzleState('wrong');
            setGameStatus('❌ Suboptimal tactic. Reset and analyze the board again.');
            audioSynth.playBeep(false);
            setSelectedSquare(null);
            setValidMoves([]);
          }
        } else {
          // Select new piece if legal
          const piece = game.get(squareKey);
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(squareKey);
            const legal = game.moves({ square: squareKey, verbose: true }).map(m => m.to);
            setValidMoves(legal);
          } else {
            setSelectedSquare(null);
            setValidMoves([]);
          }
        }
      } else {
        const piece = game.get(squareKey);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(squareKey);
          const legal = game.moves({ square: squareKey, verbose: true }).map(m => m.to);
          setValidMoves(legal);
        }
      }
      return;
    }

    // BOT & PVP MODES
    if (selectedSquare) {
      if (validMoves.includes(squareKey)) {
        makeAMove({ from: selectedSquare, to: squareKey, promotion: 'q' });
      } else {
        const piece = game.get(squareKey);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(squareKey);
          const legal = game.moves({ square: squareKey, verbose: true }).map(m => m.to);
          setValidMoves(legal);
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      const piece = game.get(squareKey);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(squareKey);
        const legal = game.moves({ square: squareKey, verbose: true }).map(m => m.to);
        setValidMoves(legal);
      }
    }
  };

  const handleResign = () => {
    if (isGameOver) return;
    setIsGameOver(true);
    setGameStatus('White resigned. Game Over.');
    setChessProfile(prev => ({
      ...prev,
      elo: Math.max(800, prev.elo - 16),
      losses: prev.losses + 1
    }));
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        borderLeft: '4px solid #38bdf8',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(56, 189, 248, 0.08))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 18px rgba(56, 189, 248, 0.4)'
          }}>
            <Brain size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                Chess & Cognitive Fitness Chamber
              </h1>
              <span className="badge badge-dept" style={{ fontSize: '10px' }}>Chamber 6</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Brain training to sharpen foresight, memory, tactical accuracy, and composure under pressure.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveMode('bot')}
            className={`btn ${activeMode === 'bot' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Zap size={14} />
            Play vs AI Bot
          </button>
          <button
            onClick={() => setActiveMode('puzzles')}
            className={`btn ${activeMode === 'puzzles' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Trophy size={14} />
            Daily Puzzles
          </button>
          <button
            onClick={() => setActiveMode('pvp')}
            className={`btn ${activeMode === 'pvp' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Swords size={14} />
            Pass & Play
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Chessboard on Left, Cognitive Dashboard & Controls on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* LEFT: INTERACTIVE CHESSBOARD */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Status Header */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{
                background: isGameOver ? 'rgba(244, 63, 94, 0.2)' : isAiThinking ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isGameOver ? '#fb7185' : isAiThinking ? '#f59e0b' : '#10b981',
                border: `1px solid ${isGameOver ? '#fb7185' : isAiThinking ? '#f59e0b' : '#10b981'}44`
              }}>
                {isAiThinking ? 'AI Thinking...' : gameStatus}
              </span>
            </div>

            {activeMode === 'bot' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Bot:</span>
                <select
                  value={aiLevel}
                  onChange={(e) => setAiLevel(Number(e.target.value))}
                  className="form-select"
                  style={{ padding: '2px 8px', fontSize: '11px', width: 'auto' }}
                  disabled={moveHistory.length > 0}
                >
                  <option value={1}>Lvl 1 - Novice (1000)</option>
                  <option value={2}>Lvl 2 - Casual (1200)</option>
                  <option value={3}>Lvl 3 - Intermediate (1400)</option>
                  <option value={4}>Lvl 4 - Advanced (1650)</option>
                  <option value={5}>Lvl 5 - Master (1900)</option>
                </select>
              </div>
            )}
          </div>

          {/* 8x8 Board Container */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            width: '100%',
            maxWidth: '440px',
            aspectRatio: '1 / 1',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            border: '2px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.8)'
          }}>
            {board.map((row, rIdx) => 
              row.map((piece, cIdx) => {
                const squareKey = `${files[cIdx]}${8 - rIdx}`;
                const isDark = (rIdx + cIdx) % 2 === 1;
                const isSelected = selectedSquare === squareKey;
                const isValidMove = validMoves.includes(squareKey);

                return (
                  <div
                    key={squareKey}
                    onClick={() => handleSquareClick(squareKey)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected 
                        ? 'rgba(16, 185, 129, 0.5)' 
                        : isDark 
                        ? '#161f30' 
                        : '#1e293b',
                      cursor: 'pointer',
                      position: 'relative',
                      userSelect: 'none',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Piece Symbol */}
                    {piece && (
                      <span style={{
                        fontSize: 'clamp(26px, 5vw, 40px)',
                        lineHeight: '1',
                        color: piece.color === 'w' ? '#f8fafc' : '#38bdf8',
                        textShadow: piece.color === 'w' 
                          ? '0 0 10px rgba(255, 255, 255, 0.4)' 
                          : '0 0 10px rgba(56, 189, 248, 0.6)',
                        zIndex: 2
                      }}>
                        {PIECE_SYMBOLS[piece.color][piece.type]}
                      </span>
                    )}

                    {/* Valid Destination Dot */}
                    {isValidMove && !piece && (
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.7)',
                        boxShadow: '0 0 8px rgba(56, 189, 248, 0.9)'
                      }} />
                    )}

                    {/* Valid Capture Ring */}
                    {isValidMove && piece && (
                      <div style={{
                        position: 'absolute',
                        inset: '2px',
                        borderRadius: '4px',
                        border: '2px solid #f43f5e',
                        pointerEvents: 'none'
                      }} />
                    )}

                    {/* Coordinate Indicators on Edges */}
                    {cIdx === 0 && (
                      <span style={{ position: 'absolute', top: '2px', left: '3px', fontSize: '9px', color: 'rgba(255, 255, 255, 0.3)', fontWeight: '700' }}>
                        {8 - rIdx}
                      </span>
                    )}
                    {rIdx === 7 && (
                      <span style={{ position: 'absolute', bottom: '2px', right: '3px', fontSize: '9px', color: 'rgba(255, 255, 255, 0.3)', fontWeight: '700' }}>
                        {files[cIdx]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action Bar */}
          <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (activeMode === 'puzzles') loadPuzzle(currentPuzzle);
                  else initBotGame();
                }}
                className="btn btn-secondary"
                style={{ padding: '7px 12px', fontSize: '12px' }}
              >
                <RotateCcw size={14} /> New Game
              </button>

              {activeMode === 'bot' && !isGameOver && (
                <button
                  onClick={handleResign}
                  className="btn btn-danger"
                  style={{ padding: '7px 12px', fontSize: '12px' }}
                >
                  <Flag size={14} /> Resign
                </button>
              )}
            </div>

            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Turn: <strong style={{ color: game.turn() === 'w' ? '#f8fafc' : '#38bdf8' }}>{game.turn() === 'w' ? 'White' : 'Black'}</strong>
            </span>
          </div>

        </div>

        {/* RIGHT: COGNITIVE STATS & TACTICAL PUZZLE SUITE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Cognitive Rating & Endurance Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Dynamic Chess Elo Rating
                </span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {chessProfile.elo}
                  <span className="badge badge-dept" style={{ fontSize: '11px' }}>Active</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cognitive Endurance</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                  {chessProfile.enduranceIndex}/100
                </div>
              </div>
            </div>

            {/* Stats Breakdown Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#0b0f19', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Victories</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>{chessProfile.wins}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Losses</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fb7185' }}>{chessProfile.losses}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Puzzles Solved</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24' }}>{chessProfile.puzzlesSolved}</div>
              </div>
            </div>
          </div>

          {/* Tactical Puzzles Module */}
          {activeMode === 'puzzles' && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={16} color="#fbbf24" />
                  Tactical Challenge: {currentPuzzle.title}
                </h3>
                <span className="badge badge-xp" style={{ fontSize: '10px' }}>+{currentPuzzle.xpReward} XP</span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                {currentPuzzle.description}
              </p>

              {/* Puzzle Selector Navigation */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {CHESS_PUZZLES.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePuzzleIndex(idx)}
                    className={`btn ${activePuzzleIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    Puzzle #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Algebraic Move Notation Feed */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Live Move History ({moveHistory.length} plies)
            </h4>

            <div style={{
              background: '#0b0f19',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              maxHeight: '130px',
              overflowY: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              {moveHistory.length === 0 ? (
                <span style={{ color: 'var(--text-muted)' }}>Moves will appear here as pieces advance...</span>
              ) : (
                moveHistory.map((m, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.06)' : 'rgba(56, 189, 248, 0.1)',
                      color: idx % 2 === 0 ? '#f8fafc' : '#38bdf8',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}. ` : ''}{m}
                  </span>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
