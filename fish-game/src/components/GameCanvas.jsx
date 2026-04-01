import { useEffect } from 'react'
import styles from './GameCanvas.module.css'

export default function GameCanvas({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [canvasRef])

  return <canvas ref={canvasRef} className={styles.canvas} />
}
