import { useState, useEffect, useCallback } from 'react';
import { checkWinner, getBestMove } from './ai';

const EMPTY_BOARD = Array(9).fill(null);

/**
 * Custom hook encapsulating all game state and logic.
 * Separates logic from presentation completely.
 */
export function useGame(difficulty) {
  const [board, setBoard] = useState([...EMPTY_BOARD]);
  const [turn, setTurn] = useState('X');           // 'X' = human, 'O' = AI
  const [result, setResult] = useState(null);       // { winner, line }
  const [isThinking, setIsThinking] = useState(false);
  const [scores, setScores] = useState({ X: 0, draw: 0, O: 0 });

  // ── Finish the game ──────────────────────────────────────────────────────
  const finalise = useCallback((res) => {
    setResult(res);
    setScores((prev) => {
      if (res.winner === 'draw') return { ...prev, draw: prev.draw + 1 };
      return { ...prev, [res.winner]: prev[res.winner] + 1 };
    });
  }, []);

  // ── AI move (runs after human plays) ────────────────────────────────────
  useEffect(() => {
    if (turn !== 'O' || result || !isThinking) return;

    const timeout = setTimeout(() => {
      setBoard((prev) => {
        const move = getBestMove([...prev], difficulty);
        if (move === -1) return prev;

        const next = [...prev];
        next[move] = 'O';

        const res = checkWinner(next);
        if (res) finalise(res);
        else setTurn('X');

        setIsThinking(false);
        return next;
      });
    }, 420); // slight delay so it feels natural

    return () => clearTimeout(timeout);
  }, [turn, result, isThinking, difficulty, finalise]);

  // ── Human plays a cell ───────────────────────────────────────────────────
  const play = useCallback(
    (index) => {
      if (board[index] || result || isThinking || turn !== 'X') return;

      const next = [...board];
      next[index] = 'X';
      setBoard(next);

      const res = checkWinner(next);
      if (res) {
        finalise(res);
      } else {
        setTurn('O');
        setIsThinking(true);
      }
    },
    [board, result, isThinking, turn, finalise]
  );

  // ── Reset without clearing scores ────────────────────────────────────────
  const reset = useCallback(() => {
    setBoard([...EMPTY_BOARD]);
    setTurn('X');
    setResult(null);
    setIsThinking(false);
  }, []);

  // ── Status message ───────────────────────────────────────────────────────
  let status = 'Your turn';
  if (isThinking) status = 'AI thinking…';
  else if (result?.winner === 'draw') status = 'Draw';
  else if (result?.winner === 'X') status = 'You win';
  else if (result?.winner === 'O') status = 'AI wins';

  return {
    board,
    turn,
    result,
    isThinking,
    scores,
    status,
    play,
    reset,
  };
}
