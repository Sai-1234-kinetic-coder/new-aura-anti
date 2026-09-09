/**
 * AuraFit Cognitive Chess Engine
 * Integrated with chess.js for rules, FEN generation, and legal moves.
 * Includes Minimax AI (Levels 1-5) and Tactical Puzzle Database.
 */
import { Chess } from 'chess.js';

// Piece point values for heuristic evaluation
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Positional Piece-Square Tables (PST) for mid-game positional quality
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

/**
 * Evaluate board state for AI
 * Positive = White advantage, Negative = Black advantage
 */
export function evaluateBoard(game) {
  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        let val = PIECE_VALUES[piece.type] || 0;
        const squareIndex = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;
        
        if (piece.type === 'p') val += PAWN_TABLE[squareIndex] || 0;
        if (piece.type === 'n') val += KNIGHT_TABLE[squareIndex] || 0;

        score += piece.color === 'w' ? val : -val;
      }
    }
  }
  return score;
}

/**
 * Minimax algorithm with Alpha-Beta Pruning
 */
function minimax(game, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = game.moves();
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Get AI move based on selected difficulty level (1 to 5)
 */
export function getAIMove(game, level = 3) {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Level 1: Novice (Random move with occasional capture)
  if (level === 1) {
    const captures = moves.filter(m => m.captured);
    if (captures.length > 0 && Math.random() < 0.4) {
      return captures[Math.floor(Math.random() * captures.length)].san;
    }
    return moves[Math.floor(Math.random() * moves.length)].san;
  }

  // Level 2: Casual (1-ply greedy capture)
  if (level === 2) {
    let bestMove = moves[0];
    let bestVal = game.turn() === 'w' ? -Infinity : Infinity;

    for (const move of moves) {
      game.move(move.san);
      const val = evaluateBoard(game);
      game.undo();

      if (game.turn() === 'b') {
        if (val < bestVal) {
          bestVal = val;
          bestMove = move;
        }
      } else {
        if (val > bestVal) {
          bestVal = val;
          bestMove = move;
        }
      }
    }
    return bestMove.san;
  }

  // Level 3 to 5: Minimax with Alpha-Beta
  const depth = level === 3 ? 1 : level === 4 ? 2 : 3;
  const isMaximizing = game.turn() === 'w';
  let bestMove = moves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;

  // Shuffle moves to add subtle variety across identical evaluations
  const shuffled = [...moves].sort(() => Math.random() - 0.5);

  for (const move of shuffled) {
    game.move(move.san);
    const score = minimax(game, depth, -Infinity, Infinity, !isMaximizing);
    game.undo();

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove.san;
}

/**
 * Curated Tactical Puzzles Database
 */
export const CHESS_PUZZLES = [
  {
    id: 'p1',
    title: 'Scholar’s Mate Defense & Queen Strike',
    theme: 'Mate in 1 (Queen Infiltration)',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    turn: 'w',
    solution: ['Qxf7#'],
    description: 'White has aligned the Queen and Bishop towards the vulnerable f7 square. Deliver checkmate in 1 move.',
    xpReward: 35
  },
  {
    id: 'p2',
    title: 'Back-Rank Smother & Corridor Mate',
    theme: 'Mate in 1 (Rook Corridor)',
    fen: '6k1/5ppp/8/8/8/8/4rPPP/R5K1 w - - 0 1',
    turn: 'w',
    solution: ['Ra8+'],
    description: 'The black King is trapped behind its own pawns on the back rank. Exploit the corridor.',
    xpReward: 30
  },
  {
    id: 'p3',
    title: 'Royal Knight Fork',
    theme: 'Knight Fork (King & Queen)',
    fen: 'r3k2r/ppp2ppp/2n5/3q4/3P4/5N2/PP1N1PPP/R2QKB1R b KQkq - 0 8',
    turn: 'b',
    solution: ['Nxd4'],
    description: 'Central tactical strike capturing the unprotected center pawn and exerting royal pressure.',
    xpReward: 40
  },
  {
    id: 'p4',
    title: 'Anastasia’s Mate Net',
    theme: 'Mate in 1 (Knight & Rook Lock)',
    fen: '5rk1/1p3Npp/8/8/8/8/5PPP/1R4K1 w - - 0 1',
    turn: 'w',
    solution: ['Rb8'],
    description: 'Pin and overload the defending black pieces on the 8th rank.',
    xpReward: 35
  },
  {
    id: 'p5',
    title: 'Smothered Mate Classical',
    theme: 'Mate in 1 (Smothered King)',
    fen: '6nk/5Npp/8/8/8/8/8/6K1 w - - 0 1',
    turn: 'w',
    solution: ['Nf7#'],
    description: 'The King is completely walled in by his own pieces. The Knight leaps in for an aesthetic smothered checkmate.',
    xpReward: 45
  }
];

/**
 * Dynamic Elo Rating Calculator
 * @param {number} userElo Current user rating
 * @param {number} opponentElo Opponent rating
 * @param {number} actualScore 1 for win, 0.5 for draw, 0 for loss
 * @param {number} K K-factor (default 32)
 */
export function calculateNewElo(userElo, opponentElo, actualScore, K = 32) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - userElo) / 400));
  const newElo = Math.round(userElo + K * (actualScore - expectedScore));
  return Math.max(800, newElo);
}
