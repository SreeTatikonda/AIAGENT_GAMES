# Deep Dive - Fish Game

A canvas-based "eat or be eaten" ocean survival game built with React + Vite.
Steer your fish with the mouse, eat smaller fish to grow, and avoid predators.

---

## How to Play

| Action         | Control     |
|----------------|-------------|
| Steer fish     | Move mouse  |
| Pause / Resume | `Space`     |
| Back to menu   | `Escape`    |

**Goal:** Eat smaller fish to grow and reach the score target before losing all your lives.

- If a fish **bigger than you** touches you -> you lose a life
- If a fish **smaller than you** touches you -> you eat it and grow
- Reach the **win score** for your difficulty to win the round

---

## Growth Stages

Your fish grows continuously as you eat. Each stage unlocks new visuals:

| Stage | Name   | Radius  | Visual                       |
|-------|--------|---------|------------------------------|
| 0     | Tiny   | 10-18px | Basic fish body              |
| 1     | Small  | 18-28px | Basic fish body              |
| 2     | Medium | 28-42px | + Dorsal fin                 |
| 3     | Large  | 42-60px | + Crown spikes on dorsal fin |

---

## Power-Ups

Power-ups spawn randomly on the map and expire after 8 seconds if uncollected.

| Label | Name   | Effect                                          | Duration |
|-------|--------|-------------------------------------------------|----------|
| SPD   | Speed  | Your fish moves 1.8x faster                    | 4-8s     |
| SLD   | Shield | You are invincible - larger fish can't kill you | 4-8s     |
| SHK   | Shrink | All opponent fish near your size shrink by 50%  | 4-8s     |

Power-up duration shortens on harder difficulties.

---

## Difficulty Levels

| Setting             | Easy     | Medium   | Hard     |
|---------------------|----------|----------|----------|
| Fish opponents      | 4        | 8        | 14       |
| Opponent speed      | 0.7x     | 1.0x     | 1.35x    |
| Opponent aggression | 0.6x     | 1.0x     | 1.5x     |
| Power-up frequency  | every 5s | every 8s | every 12s|
| Lives               | 3        | 3        | 2        |
| Win score           | 500 pts  | 1000 pts | 2000 pts |
| Score multiplier    | 1x       | 1.5x     | 2x       |

---

## Tech Stack

| Technology              | Version | Purpose                              |
|-------------------------|---------|--------------------------------------|
| React                   | 18.2    | UI components (HUD, menus, overlays) |
| Vite                    | 5.0     | Dev server and production bundler    |
| HTML5 Canvas            | -       | All game rendering at 60fps          |
| CSS Modules             | -       | Scoped styling, no class conflicts   |
| Google Fonts - DM Mono  | -       | Monospace font throughout            |
| localStorage            | -       | Persistent high score                |

No external game libraries - everything (physics, movement, rendering, particles) is written from scratch in plain JavaScript.

---

## Movement System

Every opponent fish runs an independent state machine updated 60 times per second.
Each fish decides whether to wander, pursue prey, or flee from larger fish.

### States

```
PRIORITY ORDER:  FLEE  >  HUNT  >  WANDER

         +-----------+
         |  WANDER   | <-- default state
         +-----+-----+
               |
               | smaller fish detected within range
               v
         +-----------+       larger fish detected
         |   HUNT    | -----------------------------> +-----------+
         +-----+-----+                               |   FLEE    |
               |                                     +-----------+
               | prey escapes or no prey left
               +-------------------------------------------->  WANDER
```

### State Behaviors

**WANDER**
- Changes heading by +/-60 degrees at random intervals (800ms-2800ms)
- Wraps around canvas edges
- Speed: 80% of base speed
- Transitions to HUNT when a smaller fish enters detection radius
- Transitions to FLEE (highest priority) when a larger fish enters threat radius

**HUNT**
- Steers directly toward the nearest smaller fish
- Speed: 120% of base speed (pursuit burst)
- Re-evaluates the best target every 500ms
- Exits to WANDER if prey escapes beyond abandon radius
- Immediately exits to FLEE if a predator enters threat radius

**FLEE**
- Steers directly away from the nearest larger fish
- Speed: 140% of base speed (panic burst)
- Exits to WANDER once the predator is far enough away

### Steering Algorithm

All states use smooth angular interpolation - fish never snap to a heading, they curve through turns:

```
desiredAngle = atan2(targetY - fish.y, targetX - fish.x)
angleDelta   = shortestAnglePath(fish.angle, desiredAngle)
fish.angle  += clamp(angleDelta, -turnRate * dt, +turnRate * dt)
fish.vx      = cos(fish.angle) * speed
fish.vy      = sin(fish.angle) * speed
```

### Detection Radii

| Radius Name      | Multiplier        | Purpose                          |
|------------------|-------------------|----------------------------------|
| Detection radius | fish.r * 5 * agg  | When to start hunting prey       |
| Threat radius    | fish.r * 7        | When to start fleeing a predator |
| Abandon radius   | fish.r * 12       | When to give up on chasing prey  |
| Safe radius      | fish.r * 10       | When to stop fleeing             |

On Hard difficulty, agg = 1.5x so opponents detect prey from further away.

---

## Project Structure

```
fish-game/
  index.html
  vite.config.js
  package.json
  src/
    main.jsx              Entry point
    App.jsx               Game phase router (menu/playing/paused/gameover/win)
    index.css             CSS variables - ocean colour palette
    App.module.css

    engine/               Pure JavaScript - zero React dependencies
      fish.js             Fish class, createFish(), updateFishPosition()
      gameState.js        Game state factory, difficulty configs, localStorage
      aiController.js     Wander / Hunt / Flee state machine per opponent fish
      collision.js        Circle-circle detection, eat resolution, death check
      powerups.js         Power-up spawning, collection, effect application
      renderer.js         Canvas draw calls - background, fish, particles

    hooks/
      useGameLoop.js      requestAnimationFrame loop with delta-time cap
      useFishGame.js      Main hook - bridges engine and React state

    components/
      GameCanvas.jsx      canvas element + resize handler
      HUD.jsx             Score, lives, stage badge, power-up timer
      Menu.jsx            Start screen with difficulty picker
      GameOver.jsx        Win / lose screen with high score
      PauseOverlay.jsx    Pause card with resume / menu buttons
      *.module.css        One scoped CSS file per component
```

### Key Architectural Decision

Game state lives in a mutable `useRef` (not `useState`) so fish positions, velocities, and states update 60 times per second without triggering 60 React re-renders per second. Only a thin UI snapshot (score, lives, phase, active power-up) is pushed to React state once per frame.

---

## Running Locally

```bash
cd fish-game
npm install
npm run dev
# open http://localhost:5173
```

```bash
npm run build    # production build -> dist/
npm run preview  # preview production build
```

---

## Scoring

```
Points per eat = (prey stage + 1) * 10 * difficulty multiplier
                 * 1.5 if speed boost is active

  Stage 0 prey  ->  10 pts  (x1.5 on Medium, x2 on Hard)
  Stage 1 prey  ->  20 pts
  Stage 2 prey  ->  30 pts
  Stage 3 prey  ->  40 pts
```

High score is saved automatically to `localStorage` and shown on the menu and game over screens.
