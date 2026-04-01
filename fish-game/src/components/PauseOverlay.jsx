import styles from './PauseOverlay.module.css'

export default function PauseOverlay({ onResume, onMenu }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>PAUSED</h2>
        <button className={styles.btn} onClick={onResume}>Resume</button>
        <button className={`${styles.btn} ${styles.secondary}`} onClick={onMenu}>Main Menu</button>
        <div className={styles.hint}>Space to resume · Esc for menu</div>
      </div>
    </div>
  )
}
