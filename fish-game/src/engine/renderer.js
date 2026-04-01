const TAU = Math.PI * 2

export function renderFrame(ctx, gs) {
  if (!gs) return
  const { canvasW: W, canvasH: H } = gs

  ctx.clearRect(0, 0, W, H)

  // Layer 0: Ocean background
  drawBackground(ctx, W, H, gs.bgHueShift)

  // Layer 1: Bubbles
  drawBubbles(ctx, gs.bubbles)

  // Layer 2: Power-ups
  drawPowerups(ctx, gs.powerups)

  // Layer 3: AI fish (back-to-front by radius so bigger appear behind)
  const sorted = [...gs.aiFish].filter(f => f.alive).sort((a, b) => b.radius - a.radius)
  for (const fish of sorted) drawFish(ctx, fish)

  // Layer 4: Player
  drawFish(ctx, gs.player)
  if (gs.player.shielded) drawShield(ctx, gs.player)

  // Layer 5: Particles
  drawParticles(ctx, gs.particles)

  // Layer 6: Vignette
  drawVignette(ctx, W, H)
}

// ── Background ────────────────────────────────────────────────────────────────

function drawBackground(ctx, W, H, hueShift) {
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  const hue1 = (210 + hueShift * 0.05) % 360
  const hue2 = (230 + hueShift * 0.03) % 360
  grad.addColorStop(0, `hsl(${hue1}, 85%, 5%)`)
  grad.addColorStop(1, `hsl(${hue2}, 80%, 8%)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Subtle caustic lines
  ctx.globalAlpha = 0.025
  ctx.strokeStyle = '#7ad4e8'
  ctx.lineWidth = 1
  for (let i = 0; i < 6; i++) {
    const x = (W * i) / 5 + Math.sin(hueShift * 0.03 + i) * 40
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.bezierCurveTo(x + 60, H * 0.3, x - 40, H * 0.7, x + 20, H)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// ── Bubbles ───────────────────────────────────────────────────────────────────

function drawBubbles(ctx, bubbles) {
  for (const b of bubbles) {
    ctx.globalAlpha = b.alpha
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.radius, 0, TAU)
    ctx.strokeStyle = '#a8d8f0'
    ctx.lineWidth = 0.8
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// ── Power-ups ─────────────────────────────────────────────────────────────────

function drawPowerups(ctx, powerups) {
  const now = performance.now()
  for (const pu of powerups) {
    if (!pu.alive) continue

    // Bob up and down
    const bobY = Math.sin(now * 0.002 + pu.bobOffset) * 6
    const x = pu.x
    const y = pu.y + bobY

    // Flicker when expiring
    if (pu.expiring && Math.floor(now / 150) % 2 === 0) continue

    // Outer glow ring
    const pulse = (Math.sin(pu.glowPulse) + 1) / 2
    const glowR = pu.radius + 4 + pulse * 6
    const grd = ctx.createRadialGradient(x, y, pu.radius * 0.5, x, y, glowR)
    grd.addColorStop(0, pu.color + 'aa')
    grd.addColorStop(1, pu.color + '00')
    ctx.beginPath()
    ctx.arc(x, y, glowR, 0, TAU)
    ctx.fillStyle = grd
    ctx.fill()

    // Circle body
    ctx.beginPath()
    ctx.arc(x, y, pu.radius, 0, TAU)
    ctx.fillStyle = pu.color + '33'
    ctx.fill()
    ctx.strokeStyle = pu.color
    ctx.lineWidth = 2
    ctx.stroke()

    // Label (short text)
    ctx.globalAlpha = 0.9
    ctx.font = `500 ${Math.round(pu.radius * 0.7)}px 'DM Mono', monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = pu.color
    ctx.fillText(pu.label, x, y)
    ctx.globalAlpha = 1
  }
}

// ── Fish ──────────────────────────────────────────────────────────────────────

function drawFish(ctx, fish) {
  const { x, y, angle, radius, color, stage, growPulse, shrunk } = fish

  ctx.save()
  ctx.translate(x, y)

  // Grow pulse scale
  const scale = 1 + (growPulse > 0 ? Math.sin(growPulse * Math.PI) * 0.3 : 0)
  ctx.scale(scale, scale)

  // Flip horizontally when swimming left
  const facingLeft = Math.cos(angle) < 0
  ctx.rotate(facingLeft ? angle + Math.PI : angle)
  if (facingLeft) ctx.scale(-1, 1)

  // Shrunk tint
  if (shrunk) {
    ctx.globalAlpha = 0.7
  }

  // Tail
  const tailLen = radius * 1.5
  ctx.beginPath()
  ctx.moveTo(-radius * 0.7, 0)
  ctx.lineTo(-tailLen, -radius * 0.55)
  ctx.lineTo(-tailLen, radius * 0.55)
  ctx.closePath()
  ctx.fillStyle = darken(color, 0.2)
  ctx.fill()

  // Body ellipse
  ctx.beginPath()
  ctx.ellipse(0, 0, radius, radius * 0.58, 0, 0, TAU)
  ctx.fillStyle = color
  ctx.fill()

  // Belly highlight
  ctx.beginPath()
  ctx.ellipse(radius * 0.05, radius * 0.1, radius * 0.55, radius * 0.3, 0, 0, TAU)
  ctx.fillStyle = lighten(color, 0.25)
  ctx.fill()

  // Dorsal fin (stage 2+)
  if (stage >= 2) {
    ctx.beginPath()
    ctx.moveTo(-radius * 0.1, -radius * 0.55)
    ctx.lineTo(radius * 0.35, -radius * 1.1)
    ctx.lineTo(radius * 0.6, -radius * 0.55)
    ctx.closePath()
    ctx.fillStyle = darken(color, 0.15)
    ctx.fill()
  }

  // Crown spikes (stage 3)
  if (stage >= 3) {
    for (let i = 0; i < 3; i++) {
      const sx = -radius * 0.15 + (i - 1) * radius * 0.35
      ctx.beginPath()
      ctx.moveTo(sx - radius * 0.12, -radius * 0.55)
      ctx.lineTo(sx, -radius * (1.2 + i * 0.1))
      ctx.lineTo(sx + radius * 0.12, -radius * 0.55)
      ctx.closePath()
      ctx.fillStyle = darken(color, 0.05)
      ctx.fill()
    }
  }

  // Eye white
  ctx.beginPath()
  ctx.arc(radius * 0.42, -radius * 0.18, radius * 0.2, 0, TAU)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  // Eye pupil
  ctx.beginPath()
  ctx.arc(radius * 0.47, -radius * 0.18, radius * 0.11, 0, TAU)
  ctx.fillStyle = '#111122'
  ctx.fill()

  ctx.globalAlpha = 1
  ctx.restore()
}

function drawShield(ctx, fish) {
  const now = performance.now()
  const pulse = (Math.sin(now * 0.004) + 1) / 2
  const r = fish.radius + 8 + pulse * 4

  const grd = ctx.createRadialGradient(fish.x, fish.y, fish.radius, fish.x, fish.y, r)
  grd.addColorStop(0, `rgba(232, 200, 122, ${0.3 + pulse * 0.2})`)
  grd.addColorStop(1, 'rgba(232, 200, 122, 0)')

  ctx.beginPath()
  ctx.arc(fish.x, fish.y, r, 0, TAU)
  ctx.fillStyle = grd
  ctx.fill()

  ctx.beginPath()
  ctx.arc(fish.x, fish.y, r - 2, 0, TAU)
  ctx.strokeStyle = `rgba(232, 200, 122, ${0.6 + pulse * 0.3})`
  ctx.lineWidth = 2
  ctx.stroke()
}

// ── Particles ─────────────────────────────────────────────────────────────────

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life)
    if (p.type === 'score') {
      ctx.fillStyle = p.color
      ctx.font = `bold ${12 + p.radius}px 'DM Mono', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(p.text, p.x, p.y)
    } else {
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius * p.life), 0, TAU)
      ctx.fillStyle = p.color
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

// ── Vignette ──────────────────────────────────────────────────────────────────

function drawVignette(ctx, W, H) {
  const cx = W / 2, cy = H / 2
  const r  = Math.max(W, H) * 0.72
  const grd = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r)
  grd.addColorStop(0, 'rgba(0,0,0,0)')
  grd.addColorStop(1, 'rgba(0,0,12,0.55)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)
}

// ── Color utils ───────────────────────────────────────────────────────────────

// Parse hsl(H,S%,L%) or hsl(H, S%, L%) and return modified version
function adjustHsl(color, lDelta) {
  const m = color.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/)
  if (!m) return color
  const h = m[1], s = m[2]
  const l = Math.max(5, Math.min(95, parseFloat(m[3]) + lDelta))
  return `hsl(${h},${s}%,${l}%)`
}

function darken(color, amount) {
  return adjustHsl(color, -(amount * 100))
}

function lighten(color, amount) {
  return adjustHsl(color, amount * 100)
}
