export const STAGE_THRESHOLDS = [18, 28, 42, 60]
export const STAGE_NAMES = ['Tiny', 'Small', 'Medium', 'Large']

let _idCounter = 0
function nextId() { return `fish_${++_idCounter}` }

export function createFish({
  isPlayer = false,
  x = 0,
  y = 0,
  radius = 12,
  color = null,
  speed = null,
}) {
  const stage = computeStage(radius)
  return {
    id: nextId(),
    isPlayer,

    x, y,
    vx: 0, vy: 0,
    angle: Math.random() * Math.PI * 2,
    speed: speed ?? (isPlayer ? 180 : 100 + Math.random() * 60),

    radius,
    mass: radius * radius,
    stage,

    color: color ?? randomFishColor(),
    alive: true,
    score: 0,
    fishEaten: 0,

    // Power-up state
    shielded: false,
    shieldTimer: 0,
    speedBoost: false,
    speedTimer: 0,
    shrunk: false,
    shrinkTimer: 0,
    originalRadius: radius,

    // Growth pulse animation
    growPulse: 0,

    // AI only
    aiState: 'wander',
    targetId: null,
    wanderAngle: Math.random() * Math.PI * 2,
    wanderTimer: 1000 + Math.random() * 2000,
    respawnTimer: 0,
  }
}

export function computeStage(radius) {
  if (radius < STAGE_THRESHOLDS[0]) return 0
  if (radius < STAGE_THRESHOLDS[1]) return 1
  if (radius < STAGE_THRESHOLDS[2]) return 2
  if (radius < STAGE_THRESHOLDS[3]) return 3
  return 3
}

export function updateFishPosition(fish, dt, canvasW, canvasH) {
  fish.x += fish.vx * dt
  fish.y += fish.vy * dt

  // Wrap around canvas edges
  const margin = fish.radius
  if (fish.x < -margin)      fish.x = canvasW + margin
  if (fish.x > canvasW + margin) fish.x = -margin
  if (fish.y < -margin)      fish.y = canvasH + margin
  if (fish.y > canvasH + margin) fish.y = -margin
}

export function updatePowerupTimers(fish, dt) {
  const dtMs = dt * 1000
  if (fish.shielded) {
    fish.shieldTimer -= dtMs
    if (fish.shieldTimer <= 0) {
      fish.shielded = false
      fish.shieldTimer = 0
    }
  }
  if (fish.speedBoost) {
    fish.speedTimer -= dtMs
    if (fish.speedTimer <= 0) {
      fish.speedBoost = false
      fish.speedTimer = 0
    }
  }
  if (fish.shrunk) {
    fish.shrinkTimer -= dtMs
    if (fish.shrinkTimer <= 0) {
      fish.shrunk = false
      fish.shrinkTimer = 0
      fish.radius = fish.originalRadius
      fish.mass = fish.radius * fish.radius
    }
  }
  if (fish.growPulse > 0) {
    fish.growPulse = Math.max(0, fish.growPulse - dt * 2.5)
  }
}

// Red hues (340-20) are reserved for the player — excluded here
function randomFishColor() {
  const hues = [200, 160, 280, 30, 50, 100, 240, 60, 190, 260]
  const h = hues[Math.floor(Math.random() * hues.length)] + (Math.random() * 20 - 10)
  const s = 50 + Math.random() * 30
  const l = 50 + Math.random() * 20
  return `hsl(${h},${s}%,${l}%)`
}
