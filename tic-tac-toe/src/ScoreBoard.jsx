import styles from './ScoreBoard.module.css';

/**
 * Displays scores for X (human), draw, and O (AI).
 * Highlights the currently active player's card.
 */
export default function ScoreBoard({ scores, turn, result }) {
  const activeX = !result && turn === 'X';
  const activeO = !result && turn === 'O';

  return (
    <div className={styles.row}>
      <div className={[styles.card, activeX ? styles.activeX : ''].join(' ')}>
        <span className={`${styles.label} ${styles.labelX}`}>You (X)</span>
        <span className={styles.value}>{scores.X}</span>
      </div>

      <div className={[styles.card, result?.winner === 'draw' ? styles.activeDraw : ''].join(' ')}>
        <span className={styles.label}>Draw</span>
        <span className={styles.value}>{scores.draw}</span>
      </div>

      <div className={[styles.card, activeO ? styles.activeO : ''].join(' ')}>
        <span className={`${styles.label} ${styles.labelO}`}>AI (O)</span>
        <span className={styles.value}>{scores.O}</span>
      </div>
    </div>
  );
}
