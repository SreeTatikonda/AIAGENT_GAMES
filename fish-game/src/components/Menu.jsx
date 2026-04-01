import { useState } from 'react'
import styles from './Menu.module.css'

const DIFF_LABELS = {
  easy:   { label: 'Easy',   desc: '4 AI fish · 3 lives · 500pts to win' },
  medium: { label: 'Medium', desc: '8 AI fish · 3 lives · 1000pts to win' },
  hard:   { label: 'Hard',   desc: '14 AI fish · 2 lives · 2000pts to win' },
}

export default function Menu({ onStart, highScore }) {
  const [difficulty, setDifficulty] = useState('medium')

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h1 className={styles.title}>DEEP DIVE</h1>
        <p className={styles.subtitle}>Eat or be eaten</p>

        {highScore > 0 && (
          <div className={styles.highScore}>
            Best: <span>{highScore}</span>
          </div>
        )}

        <div className={styles.diffGroup}>
          {Object.entries(DIFF_LABELS).map(([key, { label, desc }]) => (
            <label key={key} className={`${styles.diffOption} ${difficulty === key ? styles.active : ''}`}>
              <input
                type="radio"
                name="difficulty"
                value={key}
                checked={difficulty === key}
                onChange={() => setDifficulty(key)}
              />
              <span className={styles.diffLabel}>{label}</span>
              <span className={styles.diffDesc}>{desc}</span>
            </label>
          ))}
        </div>

        <button className={styles.playBtn} onClick={() => onStart(difficulty)}>
          DIVE IN
        </button>

        <div className={styles.controls}>
          <span>Mouse — steer</span>
          <span>Space — pause</span>
          <span>Esc — menu</span>
        </div>
      </div>
    </div>
  )
}
