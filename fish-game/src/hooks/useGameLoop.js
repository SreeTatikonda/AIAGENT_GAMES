import { useEffect, useRef } from 'react'

export function useGameLoop(updateFn, renderFn, isPaused) {
  const rafRef  = useRef(null)
  const lastRef = useRef(null)

  useEffect(() => {
    if (isPaused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastRef.current = null
      return
    }

    const tick = (timestamp) => {
      const dt = Math.min(
        (timestamp - (lastRef.current ?? timestamp)) / 1000,
        0.05  // cap at 50ms to prevent spiral of death
      )
      lastRef.current = timestamp

      updateFn(dt)
      renderFn()

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPaused, updateFn, renderFn])
}
