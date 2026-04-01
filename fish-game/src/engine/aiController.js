const TURN_RATE_BASE = Math.PI * 1.8 // rad/s

function angleDiff(a, b) {
  let d = ((b - a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI
  return d
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

export function updateAI(fish, allFish, player, dt, config) {
  if (!fish.alive) return

  const dtMs = dt * 1000
  const agg = config.aiAggression
  const turnRate = TURN_RATE_BASE * config.aiTurnMult

  const detectionR = fish.radius * 5 * agg
  const threatR    = fish.radius * 7
  const abandonR   = fish.radius * 12
  const safeR      = fish.radius * 10

  const candidates = [...allFish, player].filter(f => f.alive && f.id !== fish.id)

  // Find nearest predator (bigger by >10%)
  let nearestPredator = null
  let nearestPredDist = Infinity
  // Find nearest prey (smaller)
  let nearestPrey = null
  let nearestPreyDist = Infinity

  for (const other of candidates) {
    const dx = other.x - fish.x
    const dy = other.y - fish.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    if (other.radius > fish.radius * 1.1 && d < nearestPredDist) {
      nearestPredator = other
      nearestPredDist = d
    }
    if (other.radius < fish.radius * 0.9 && d < nearestPreyDist) {
      nearestPrey = other
      nearestPreyDist = d
    }
  }

  // State transitions
  if (nearestPredator && nearestPredDist < threatR) {
    fish.aiState = 'flee'
    fish.targetId = nearestPredator.id
  } else if (fish.aiState === 'flee') {
    if (!nearestPredator || nearestPredDist > safeR) {
      fish.aiState = 'wander'
      fish.targetId = null
    }
  }

  if (fish.aiState !== 'flee') {
    if (nearestPrey && nearestPreyDist < detectionR) {
      fish.aiState = 'hunt'
      fish.targetId = nearestPrey.id
    } else if (fish.aiState === 'hunt') {
      if (!nearestPrey || nearestPreyDist > abandonR) {
        fish.aiState = 'wander'
        fish.targetId = null
      }
    }
  }

  // State behaviors
  let desiredAngle = fish.angle
  let speedMult = 1.0

  if (fish.aiState === 'wander') {
    fish.wanderTimer -= dtMs
    if (fish.wanderTimer <= 0) {
      fish.wanderAngle += (Math.random() - 0.5) * Math.PI * 1.2
      fish.wanderTimer = 800 + Math.random() * 1800
    }
    desiredAngle = fish.wanderAngle
    speedMult = 0.8

  } else if (fish.aiState === 'hunt') {
    const target = candidates.find(f => f.id === fish.targetId) ?? nearestPrey
    if (target) {
      desiredAngle = Math.atan2(target.y - fish.y, target.x - fish.x)
      fish.targetId = target.id
    } else {
      fish.aiState = 'wander'
    }
    speedMult = 1.2

  } else if (fish.aiState === 'flee') {
    const target = candidates.find(f => f.id === fish.targetId) ?? nearestPredator
    if (target) {
      desiredAngle = Math.atan2(fish.y - target.y, fish.x - target.x)
      fish.targetId = target.id
    } else {
      fish.aiState = 'wander'
    }
    speedMult = 1.4
  }

  // Steer toward desired angle
  const delta = angleDiff(fish.angle, desiredAngle)
  fish.angle += clamp(delta, -turnRate * dt, turnRate * dt)

  const effectiveSpeed = fish.speed * speedMult * (fish.speedBoost ? 1.8 : 1.0)
  fish.vx = Math.cos(fish.angle) * effectiveSpeed
  fish.vy = Math.sin(fish.angle) * effectiveSpeed
}
