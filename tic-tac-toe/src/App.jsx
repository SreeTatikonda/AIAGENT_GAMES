import { useState } from 'react';
import { useGame } from './useGame';
import Board from './Board';
import ScoreBoard from './ScoreBoard';
import styles from './App.module.css';

export default function App() {
  const [difficulty, setDifficulty] = useState('hard');
  const { board, turn, result, isThinking, scores, status, play, reset } =
    useGame(difficulty);

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    reset();
  };

  const isGameOver = !!result;
  const statusColor = isGameOver
    ? result.winner === 'X'
      ? 'var(--accent-x)'
      : result.winner === 'O'
      ? 'var(--accent-o)'
      : 'var(--text-muted)'
    : 'var(--text-muted)';

  return (
    <main className={styles.main}>
      {/* Header */}
      <h1 className={styles.title}>Tic-tac-toe</h1>
      <p className={styles.subtitle}>You are X &nbsp;·&nbsp; AI is O</p>

      {/* Scores */}
      <ScoreBoard scores={scores} turn={turn} result={result} />

      {/* Difficulty picker */}
      <div className={styles.diffRow}>
        <span className={styles.diffLabel}>Difficulty</span>
        <select
          className={styles.select}
          value={difficulty}
          onChange={handleDifficultyChange}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard (unbeatable)</option>
        </select>
      </div>

      {/* Status */}
      <p className={styles.status} style={{ color: statusColor }}>
        {status}
      </p>

      {/* Board */}
      <Board
        board={board}
        winLine={result?.line ?? []}
        onPlay={play}
        disabled={isThinking || isGameOver}
      />

      {/* Reset button */}
      <button className={styles.resetBtn} onClick={reset}>
        New game
      </button>

      {/* Footer */}
      <p className={styles.footer}>
        Hard mode · minimax + alpha-beta pruning
      </p>
    </main>
  );
}
