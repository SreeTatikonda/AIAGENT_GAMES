import { createFish } from './fish.js'

const HI_SCORE_KEY = 'fishGame_highScore'

export const DIFFICULTY_CONFIGS = {
  easy: {
    aiCount: 4,
    aiSpeedMult: 0.7,
    aiAggression: 0.6,
    aiTurnMult: 0.8,
    powerupFreq: 5000,
    powerupDuration: 8000,
    lives: 3,
    winScore: 500,
    aiRespawnDelay: 3000,
    scoreMult: 1.0,
  },
  medium: {
    aiCount: 8,
    aiSpeedMult: 1.0,
    aiAggression: 1.0,
    aiTurnMult: 1.0,
    powerupFreq: 8000,
    powerupDuration: 6000,
    lives: 3,
    winScore: 1000,
    aiRespawnDelay: 2000,
    scoreMult: 1.5,
  },
  hard: {
    aiCount: 14,
    aiSpeedMult: 1.35,
    aiAggression: 1.5,
    aiTurnMult: 1.3,
    powerupFreq: 12000,
    powerupDuration: 4000,
    lives: 2,
    winScore: 2000,
    aiRespawnDelay: 1000,
    scoreMult: 2.0,
  },
}

export function getHighScore() {
  return parseInt(localStorage.getItem(HI_SCORE_KEY) ?? '0', 10)
}

export function saveHighScore(score) {
  const current = getHighScore()
  if (score > current) localStorage.setItem(HI_SCORE_KEY, String(score))
}

export function createGameState(difficulty, canvasW, canvasH) {
  const config = DIFFICULTY_CONFIGS[difficulty]
  const player = createFish({
    isPlayer: true,
    x: canvasW / 2,
    y: canvasH / 2,
    radius: 12,
    color: 'hsl(0, 85%, 60%)',
    speed: 180,
  })

  const aiFish = spawnAiFish(config.aiCount, player, config, canvasW, canvasH)

  return {
    phase: 'playing',
    difficulty,
    diffConfig: config,
    player,
    aiFish,
    particles: [],
    powerups: [],
    bubbles: createBubbles(40, canvasW, canvasH),
    score: 0,
    lives: config.lives,
    highScore: getHighScore(),
    elapsed: 0,
    lastPowerupSpawn: 0,
    canvasW,
    canvasH,
    mouseX: canvasW / 2,
    mouseY: canvasH / 2,
    bgHueShift: 0,
  }
}

export function spawnAiFish(count, player, config, canvasW, canvasH) {
  const fish = []
  for (let i = 0; i < count; i++) {
    fish.push(spawnOneFish(player, config, canvasW, canvasH))
  }
  return fish
}

export function spawnOneFish(player, config, canvasW, canvasH) {
  const radius = 8 + Math.random() * 40
  let x, y
  // Spawn away from player
  do {
    x = radius + Math.random() * (canvasW - radius * 2)
    y = radius + Math.random() * (canvasH - radius * 2)
  } while (dist(x, y, player.x, player.y) < 150)

  const baseSpeeds = [110, 95, 80, 65]
  const stageGuess = radius < 18 ? 0 : radius < 28 ? 1 : radius < 42 ? 2 : 3
  const speed = (baseSpeeds[stageGuess] + Math.random() * 30) * config.aiSpeedMult

  return createFish({ x, y, radius, speed })
}

function dist(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

function createBubbles(count, canvasW, canvasH) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
    vy: -(15 + Math.random() * 30),
    swayAmp: 5 + Math.random() * 15,
    swayPhase: Math.random() * Math.PI * 2,
    swayFreq: 0.5 + Math.random() * 1.0,
    radius: 1.5 + Math.random() * 3.5,
    alpha: 0.04 + Math.random() * 0.12,
    t: Math.random() * 100,
  }))
}

export function extractUiSnapshot(gs) {
  return {
    phase: gs.phase,
    score: gs.score,
    lives: gs.lives,
    highScore: gs.highScore,
    stage: gs.player.stage,
    activePowerup: gs.player.shielded
      ? 'shield'
      : gs.player.speedBoost
      ? 'speed'
      : gs.player.shrunk
      ? null
      : gs.powerups.find(p => p.alive)?.type ?? null,
    powerupTimer: gs.player.shielded
      ? gs.player.shieldTimer
      : gs.player.speedBoost
      ? gs.player.speedTimer
      : 0,
    winScore: gs.diffConfig.winScore,
  }
}
