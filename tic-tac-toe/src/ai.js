// ─── Win detection ───────────────────────────────────────────────────────────

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

/**
 * Check the board for a winner or draw.
 * @param {Array<string|null>} board - 9-cell array ('X', 'O', or null)
 * @returns {{ winner: string, line: number[] } | null}
 */
export function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (board.every((v) => v !== null)) return { winner: 'draw', line: [] };
  return null;
}

// ─── Minimax with alpha-beta pruning ────────────────────────────────────────

/**
 * Minimax algorithm with alpha-beta pruning.
 * AI is maximising player ('O'), human is minimising ('X').
 */
function minimax(board, isMaximising, depth, alpha, beta) {
  const result = checkWinner(board);
  if (result) {
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    return 0; // draw
  }

  if (isMaximising) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, false, depth + 1, alpha, beta));
        board[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break; // prune
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, true, depth + 1, alpha, beta));
        board[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break; // prune
      }
    }
    return best;
  }
}

// ─── Public: get AI move ─────────────────────────────────────────────────────

/**
 * Returns the index the AI will play.
 * @param {Array<string|null>} board
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {number} cell index (0-8)
 */
export function getBestMove(board, difficulty) {
  const empty = board
    .map((v, i) => (v === null ? i : null))
    .filter((v) => v !== null);

  if (empty.length === 0) return -1;

  // Easy: fully random
  if (difficulty === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Medium: 40% random, 60% optimal
  if (difficulty === 'medium' && Math.random() < 0.4) {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Hard: full minimax
  let bestScore = -Infinity;
  let bestMove = empty[0];

  for (const i of empty) {
    const boardCopy = [...board];
    boardCopy[i] = 'O';
    const score = minimax(boardCopy, false, 0, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }

  return bestMove;
}
