let _puId = 0

const POWERUP_COLORS = {
  speed:  '#7ae8c8',
  shield: '#e8c87a',
  shrink: '#c87ae8',
}

const POWERUP_LABELS = {
  speed:  'SPD',
  shield: 'SLD',
  shrink: 'SHK',
}

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

export function createPowerup(type, x, y) {
  return {
    id: `pu_${++_puId}`,
    type,
    x, y,
    radius: 14,
    bobOffset: Math.random() * Math.PI * 2,
    alive: true,
    spawnTime: performance.now(),
    color: POWERUP_COLORS[type],
    label: POWERUP_LABELS[type],
    glowPulse: Math.random() * Math.PI * 2,
    expiring: false,
  }
}

export function maybeSpawnPowerup(gs) {
  const now = performance.now()
  const active = gs.powerups.filter(p => p.alive)
  if (now - gs.lastPowerupSpawn < gs.diffConfig.powerupFreq) return
  if (active.length >= 3) return

  const type = weightedRandom(['speed', 'shield', 'shrink'], [0.4, 0.35, 0.25])
  const margin = 80
  const x = margin + Math.random() * (gs.canvasW - margin * 2)
  const y = margin + Math.random() * (gs.canvasH - margin * 2)
  gs.powerups.push(createPowerup(type, x, y))
  gs.lastPowerupSpawn = now
}

export function updatePowerups(gs, dt) {
  const now = performance.now()
  const EXPIRE_MS = 8000
  const WARN_MS   = 2000

  for (const pu of gs.powerups) {
    if (!pu.alive) continue
    const age = now - pu.spawnTime
    if (age > EXPIRE_MS) {
      pu.alive = false
      continue
    }
    pu.expiring = age > EXPIRE_MS - WARN_MS
    pu.glowPulse += dt * 3
  }

  // Remove dead ones occasionally to prevent memory growth
  if (gs.powerups.length > 20) {
    gs.powerups = gs.powerups.filter(p => p.alive)
  }
}

export function checkPowerupCollision(gs) {
  const player = gs.player
  for (const pu of gs.powerups) {
    if (!pu.alive) continue
    const dx = pu.x - player.x
    const dy = pu.y - player.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    if (d < player.radius + pu.radius) {
      applyPowerup(player, pu, gs)
      pu.alive = false

      // Collect burst
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2
        const spd   = 60 + Math.random() * 80
        gs.particles.push({
          x: pu.x, y: pu.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 1.0,
          decay: 1.5 + Math.random(),
          radius: 2 + Math.random() * 4,
          color: pu.color,
          type: 'burst',
          text: null,
        })
      }
    }
  }
}

function applyPowerup(player, pu, gs) {
  const dur = gs.diffConfig.powerupDuration

  if (pu.type === 'speed') {
    player.speedBoost = true
    player.speedTimer = dur
  } else if (pu.type === 'shield') {
    player.shielded = true
    player.shieldTimer = dur
  } else if (pu.type === 'shrink') {
    // Shrink all AI fish that are >= player size
    for (const fish of gs.aiFish) {
      if (!fish.alive) continue
      if (fish.radius >= player.radius * 0.8) {
        fish.shrunk = true
        fish.shrinkTimer = dur
        fish.originalRadius = fish.radius
        fish.radius = Math.max(8, fish.radius * 0.5)
        fish.mass = fish.radius * fish.radius
      }
    }
  }
}
