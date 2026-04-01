import styles from './GameOver.module.css'

export default function GameOver({ phase, score, highScore, onRestart, onMenu }) {
  const isWin = phase === 'win'
  const isNewBest = score >= highScore && score > 0

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={`${styles.icon} ${isWin ? styles.win : styles.lose}`}>{isWin ? 'WIN' : 'END'}</div>
        <h2 className={`${styles.title} ${isWin ? styles.win : styles.lose}`}>
          {isWin ? 'YOU WIN!' : 'GAME OVER'}
        </h2>

        <div className={styles.scoreBlock}>
          <div className={styles.scoreLabel}>Score</div>
          <div className={styles.scoreVal}>{score}</div>
        </div>

        {isNewBest && (
          <div className={styles.newBest}>-- new best --</div>
        )}

        {!isNewBest && highScore > 0 && (
          <div className={styles.prevBest}>Best: {highScore}</div>
        )}

        <div className={styles.btnGroup}>
          <button className={styles.btn} onClick={onRestart}>
            Play Again
          </button>
          <button className={`${styles.btn} ${styles.secondary}`} onClick={onMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}
