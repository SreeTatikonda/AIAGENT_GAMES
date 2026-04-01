import styles from './HUD.module.css'
import { STAGE_NAMES } from '../engine/fish.js'

const STAGE_COLORS = ['#e87a7a', '#e8a87a', '#e8d87a', '#e8e8a0']
const POWERUP_INFO = {
  speed:  { icon: 'SPD', color: '#7ae8c8', label: 'SPEED' },
  shield: { icon: 'SLD', color: '#e8c87a', label: 'SHIELD' },
  shrink: { icon: 'SHK', color: '#c87ae8', label: 'SHRINK' },
}

export default function HUD({ uiState, onPause }) {
  const { score, lives, highScore, stage, activePowerup, powerupTimer, winScore } = uiState
  const progress = Math.min(score / winScore, 1)
  const pu = activePowerup ? POWERUP_INFO[activePowerup] : null

  return (
    <div className={styles.hud}>
      {/* Top left: score */}
      <div className={styles.topLeft}>
        <div className={styles.scoreLabel}>score</div>
        <div className={styles.scoreVal}>{score}</div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={styles.scoreGoal}>{score} / {winScore}</div>
      </div>

      {/* Top right: lives + stage */}
      <div className={styles.topRight}>
        <div className={styles.lives}>
          {Array.from({ length: lives }, (_, i) => (
            <span key={i} className={styles.lifeIcon}>[+]</span>
          ))}
        </div>
        <div className={styles.stageBadge} style={{ color: STAGE_COLORS[stage] }}>
          {STAGE_NAMES[stage]}
        </div>
      </div>

      {/* Bottom right: high score + pause */}
      <div className={styles.bottomRight}>
        {highScore > 0 && (
          <div className={styles.hiScore}>best {highScore}</div>
        )}
        <button className={styles.pauseBtn} onClick={onPause}>
          ||
        </button>
      </div>

      {/* Bottom center: active power-up */}
      {pu && (
        <div className={styles.powerupBar}>
          <span className={styles.puIcon}>{pu.icon}</span>
          <span className={styles.puLabel} style={{ color: pu.color }}>{pu.label}</span>
          <div className={styles.puTrack}>
            <div
              className={styles.puFill}
              style={{
                width: `${Math.min(powerupTimer / 8000, 1) * 100}%`,
                background: pu.color,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
