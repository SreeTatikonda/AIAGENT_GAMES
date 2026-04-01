import { useRef, useState, useCallback, useEffect } from 'react'
import { createGameState, extractUiSnapshot, saveHighScore, spawnOneFish } from '../engine/gameState.js'
import { updateFishPosition, updatePowerupTimers, computeStage } from '../engine/fish.js'
import { updateAI } from '../engine/aiController.js'
import { circlesOverlap, resolveEat, checkPlayerDeath, emitDeathBurst } from '../engine/collision.js'
import { maybeSpawnPowerup, updatePowerups, checkPowerupCollision } from '../engine/powerups.js'
import { renderFrame } from '../engine/renderer.js'
import { useGameLoop } from './useGameLoop.js'

const INITIAL_UI = {
  phase: 'menu',
  score: 0,
  lives: 3,
  highScore: 0,
  stage: 0,
  activePowerup: null,
  powerupTimer: 0,
  winScore: 1000,
  difficulty: 'medium',
}

export function useFishGame(canvasRef) {
  const gsRef = useRef(null)
  const [uiState, setUiState] = useState(INITIAL_UI)

  // ── Player steering via mouse ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      if (gsRef.current) {
        gsRef.current.mouseX = e.clientX - rect.left
        gsRef.current.mouseY = e.clientY - rect.top
      }
    }

    const onTouchMove = (e) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const t = e.touches[0]
      if (gsRef.current) {
        gsRef.current.mouseX = t.clientX - rect.left
        gsRef.current.mouseY = t.clientY - rect.top
      }
    }

    const onKey = (e) => {
      const gs = gsRef.current
      if (!gs) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (gs.phase === 'playing') {
          gs.phase = 'paused'
          setUiState(s => ({ ...s, phase: 'paused' }))
        } else if (gs.phase === 'paused') {
          gs.phase = 'playing'
          setUiState(s => ({ ...s, phase: 'playing' }))
        }
      }
      if (e.code === 'Escape' && gs.phase === 'paused') {
        gs.phase = 'menu'
        setUiState(s => ({ ...s, phase: 'menu' }))
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [canvasRef])

  // ── Update (called 60fps by useGameLoop) ─────────────────────────────────
  const update = useCallback((dt) => {
    const gs = gsRef.current
    if (!gs || gs.phase !== 'playing') return

    gs.elapsed += dt
    gs.bgHueShift = (gs.bgHueShift + dt * 2) % 360

    const { player, aiFish, diffConfig } = gs

    // ── Player movement (steer toward mouse) ────────────────────────────
    const tx = gs.mouseX - player.x
    const ty = gs.mouseY - player.y
    const distToMouse = Math.sqrt(tx * tx + ty * ty)

    if (distToMouse > 5) {
      const desiredAngle = Math.atan2(ty, tx)
      const delta = angleDiff(player.angle, desiredAngle)
      const turnRate = Math.PI * 2.5
      player.angle += Math.max(-turnRate * dt, Math.min(turnRate * dt, delta))
      const effectiveSpeed = player.speed * (player.speedBoost ? 1.8 : 1.0)
      const speedFactor = Math.min(distToMouse / 60, 1.0)
      player.vx = Math.cos(player.angle) * effectiveSpeed * speedFactor
      player.vy = Math.sin(player.angle) * effectiveSpeed * speedFactor
    } else {
      player.vx *= 0.85
      player.vy *= 0.85
    }

    updateFishPosition(player, dt, gs.canvasW, gs.canvasH)
    updatePowerupTimers(player, dt)

    // ── AI fish ─────────────────────────────────────────────────────────
    for (const fish of aiFish) {
      if (!fish.alive) {
        // Respawn timer
        fish.respawnTimer -= dt * 1000
        if (fish.respawnTimer <= 0) {
          const newFish = spawnOneFish(player, diffConfig, gs.canvasW, gs.canvasH)
          Object.assign(fish, newFish)
        }
        continue
      }
      updateAI(fish, aiFish, player, dt, diffConfig)
      updateFishPosition(fish, dt, gs.canvasW, gs.canvasH)
      updatePowerupTimers(fish, dt)
    }

    // ── Collisions: player eats AI ───────────────────────────────────────
    for (const fish of aiFish) {
      if (!fish.alive) continue
      if (player.radius > fish.radius * 1.05 && circlesOverlap(player, fish)) {
        resolveEat(player, fish, gs)
        fish.respawnTimer = diffConfig.aiRespawnDelay
        player.stage = computeStage(player.radius)
      }
    }

    // ── Collisions: AI eats AI ───────────────────────────────────────────
    for (let i = 0; i < aiFish.length; i++) {
      for (let j = i + 1; j < aiFish.length; j++) {
        const a = aiFish[i], b = aiFish[j]
        if (!a.alive || !b.alive) continue
        if (circlesOverlap(a, b)) {
          if (a.radius > b.radius * 1.05) {
            resolveEat(a, b, gs)
            b.respawnTimer = diffConfig.aiRespawnDelay
          } else if (b.radius > a.radius * 1.05) {
            resolveEat(b, a, gs)
            a.respawnTimer = diffConfig.aiRespawnDelay
          }
        }
      }
    }

    // ── Player death ─────────────────────────────────────────────────────
    if (checkPlayerDeath(player, aiFish, gs)) {
      emitDeathBurst(gs.particles, player.x, player.y)
      gs.lives--
      if (gs.lives <= 0) {
        saveHighScore(gs.score)
        gs.highScore = Math.max(gs.highScore, gs.score)
        gs.phase = 'gameover'
      } else {
        // Reset player position
        player.x = gs.canvasW / 2
        player.y = gs.canvasH / 2
        player.vx = 0
        player.vy = 0
        player.shielded = true
        player.shieldTimer = 2000 // 2s grace shield
      }
    }

    // ── Win condition ────────────────────────────────────────────────────
    if (gs.score >= diffConfig.winScore) {
      saveHighScore(gs.score)
      gs.highScore = Math.max(gs.highScore, gs.score)
      gs.phase = 'win'
    }

    // ── Powerups ─────────────────────────────────────────────────────────
    maybeSpawnPowerup(gs)
    updatePowerups(gs, dt)
    checkPowerupCollision(gs)

    // ── Particles ────────────────────────────────────────────────────────
    updateParticles(gs.particles, dt)

    // ── Bubbles ──────────────────────────────────────────────────────────
    updateBubbles(gs.bubbles, dt, gs.canvasW, gs.canvasH)

    // ── Push UI snapshot ─────────────────────────────────────────────────
    setUiState(extractUiSnapshot(gs))
  }, [])

  // ── Render (called 60fps) ────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const gs = gsRef.current
    if (!canvas || !gs) return
    const ctx = canvas.getContext('2d')
    renderFrame(ctx, gs)
  }, [canvasRef])

  const isPaused = uiState.phase === 'paused' || uiState.phase === 'menu' || uiState.phase === 'gameover' || uiState.phase === 'win'
  useGameLoop(update, render, isPaused)

  // ── Public API ───────────────────────────────────────────────────────────
  const startGame = useCallback((difficulty) => {
    const canvas = canvasRef.current
    if (!canvas) return
    gsRef.current = createGameState(difficulty, canvas.width, canvas.height)
    setUiState({ ...extractUiSnapshot(gsRef.current), difficulty })
  }, [canvasRef])

  const pauseGame = useCallback(() => {
    if (!gsRef.current) return
    gsRef.current.phase = 'paused'
    setUiState(s => ({ ...s, phase: 'paused' }))
  }, [])

  const resumeGame = useCallback(() => {
    if (!gsRef.current) return
    gsRef.current.phase = 'playing'
    setUiState(s => ({ ...s, phase: 'playing' }))
  }, [])

  const goToMenu = useCallback(() => {
    if (gsRef.current) gsRef.current.phase = 'menu'
    setUiState(s => ({ ...s, phase: 'menu' }))
  }, [])

  return { uiState, startGame, pauseGame, resumeGame, goToMenu }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function angleDiff(a, b) {
  return ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI
}

function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life -= p.decay * dt
    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy -= 25 * dt // buoyancy
  }
}

function updateBubbles(bubbles, dt, canvasW, canvasH) {
  for (const b of bubbles) {
    b.t += dt
    b.y += b.vy * dt
    b.x += Math.sin(b.t * b.swayFreq + b.swayPhase) * b.swayAmp * dt
    if (b.y < -b.radius) {
      b.y = canvasH + b.radius
      b.x = Math.random() * canvasW
    }
  }
}
