import { useRef, useCallback } from 'react'
import styles from './App.module.css'
import { useFishGame } from './hooks/useFishGame.js'
import GameCanvas from './components/GameCanvas.jsx'
import HUD from './components/HUD.jsx'
import Menu from './components/Menu.jsx'
import PauseOverlay from './components/PauseOverlay.jsx'
import GameOver from './components/GameOver.jsx'

export default function App() {
  const canvasRef = useRef(null)
  const { uiState, startGame, pauseGame, resumeGame, goToMenu } = useFishGame(canvasRef)
  const { phase, score, highScore } = uiState

  const handleRestart = useCallback(() => {
    startGame(uiState.difficulty || 'medium')
  }, [startGame, uiState.difficulty])

  return (
    <div className={styles.root}>
      <GameCanvas canvasRef={canvasRef} />

      {phase === 'menu' && (
        <Menu onStart={startGame} highScore={highScore} />
      )}

      {(phase === 'playing' || phase === 'paused') && (
        <HUD uiState={uiState} onPause={pauseGame} />
      )}

      {phase === 'paused' && (
        <PauseOverlay onResume={resumeGame} onMenu={goToMenu} />
      )}

      {(phase === 'gameover' || phase === 'win') && (
        <GameOver
          phase={phase}
          score={score}
          highScore={highScore}
          onRestart={handleRestart}
          onMenu={goToMenu}
        />
      )}
    </div>
  )
}
