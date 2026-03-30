# Tic-Tac-Toe · AI

A clean React tic-tac-toe app with an unbeatable AI opponent built using the **minimax algorithm with alpha-beta pruning**.

![preview](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![preview](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=flat-square)

## Features

- **Three difficulty levels** — Easy (random), Medium (60% optimal), Hard (unbeatable minimax)
- **AI opponent** — full minimax with alpha-beta pruning, plays a perfect game on Hard
- **Scoreboard** — persists across rounds in the same session
- **Win highlight** — winning cells animate on game end
- **Responsive** — works on mobile and desktop
- **CSS Modules** — scoped styles, no conflicts

## Project Structure

```
src/
├── ai.js               # Minimax AI + win detection (pure logic, no React)
├── useGame.js          # Custom hook — all game state and turn management
├── App.jsx             # Root layout, difficulty picker
├── App.module.css
├── Board.jsx           # 3×3 grid of cells
├── Board.module.css
├── ScoreBoard.jsx      # Score display with active player highlight
├── ScoreBoard.module.css
├── index.css           # Global reset + CSS variables
└── main.jsx            # Entry point
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## How the AI Works

The AI uses **minimax** — a recursive algorithm that simulates every possible game state and picks the move that maximises the AI's outcome while minimising the human's.

**Alpha-beta pruning** cuts branches that can't affect the final decision, making it faster.

- `+10` for AI win (minus depth = prefer faster wins)  
- `-10` for human win (plus depth = delay losses as long as possible)  
- `0` for draw

On **Hard** mode, the AI never loses — best you can do is draw.

## Tech Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- CSS Modules
- Zero external runtime dependencies
