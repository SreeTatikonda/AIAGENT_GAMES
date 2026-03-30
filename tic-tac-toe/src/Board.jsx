import styles from './Board.module.css';

/**
 * The 3×3 game board.
 * @param {{ board: Array, winLine: number[], onPlay: Function, disabled: boolean }} props
 */
export default function Board({ board, winLine = [], onPlay, disabled }) {
  return (
    <div className={styles.grid}>
      {board.map((cell, i) => {
        const isWin = winLine.includes(i);
        const isEmpty = !cell;
        return (
          <button
            key={i}
            className={[
              styles.cell,
              cell === 'X' ? styles.x : '',
              cell === 'O' ? styles.o : '',
              isWin ? styles.win : '',
              isEmpty && !disabled ? styles.clickable : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onPlay(i)}
            disabled={!isEmpty || disabled}
            aria-label={cell ? `${cell} played` : `Cell ${i + 1}, empty`}
          >
            {cell}
          </button>
        );
      })}
    </div>
  );
}
