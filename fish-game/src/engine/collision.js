import { computeStage, STAGE_THRESHOLDS } from './fish.js'

export function circlesOverlap(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const distSq = dx * dx + dy * dy
  const minDist = a.radius + b.radius
  return distSq < minDist * minDist
}

export function resolveEat(eater, eaten, gs) {
  eaten.alive = false

  // Score
  const basePoints = (eaten.stage + 1) * 10
  const points = Math.round(
    basePoints
    * gs.diffConfig.scoreMult
    * (eater.speedBoost ? 1.5 : 1.0)
  )

  if (eater.isPlayer) {
    gs.score += points

    // Emit score popup particle
    emitScoreParticle(gs.particles, eaten.x, eaten.y, `+${points}`)
  }

  // Grow eater
  const prevRadius = eater.radius
  eater.radius = Math.min(eater.radius + eaten.radius * 0.28, 80)
  eater.mass = eater.radius * eater.radius

  const prevStage = eater.stage
  eater.stage = computeStage(eater.radius)
  eater.fishEaten++

  // Stage-up pulse
  if (eater.stage > prevStage) {
    eater.growPulse = 1.0
    emitBurst(gs.particles, eater.x, eater.y, 30, eater.color, 60, 1.0)
  } else {
    emitBurst(gs.particles, eaten.x, eaten.y, 12, eaten.color, 100, 1.5)
  }
}

export function checkPlayerDeath(player, aiFish, gs) {
  if (player.shielded) return false
  for (const fish of aiFish) {
    if (!fish.alive) continue
    if (fish.radius > player.radius * 1.05 && circlesOverlap(fish, player)) {
      return true
    }
  }
  return false
}

// ── Particle helpers ──────────────────────────────────────────────────────────

function emitBurst(particles, x, y, count, color, speed, decay) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const spd   = speed * (0.5 + Math.random())
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1.0,
      decay: decay * (0.8 + Math.random() * 0.4),
      radius: 2 + Math.random() * 4,
      color,
      type: 'burst',
      text: null,
    })
  }
}

function emitScoreParticle(particles, x, y, text) {
  particles.push({
    x, y,
    vx: (Math.random() - 0.5) * 20,
    vy: -60,
    life: 1.0,
    decay: 0.6,
    radius: 6,
    color: '#e8e8a0',
    type: 'score',
    text,
  })
}

export function emitDeathBurst(particles, x, y) {
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2
    const spd   = 80 + Math.random() * 120
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1.0,
      decay: 1.0 + Math.random() * 0.8,
      radius: 3 + Math.random() * 5,
      color: '#e87a7a',
      type: 'burst',
      text: null,
    })
  }
}
