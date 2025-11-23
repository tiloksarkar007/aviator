# Aviator Crash Prototype

A real-time crash game prototype built with React, TypeScript, and Pixi.js. Players place bets and cash out before the plane crashes to win multipliers.

## Features

- Real-time multiplier visualization with Pixi.js graphics
- Betting system with cashout functionality
- Game statistics tracking
- Responsive design with modern UI
- Smooth animations and visual effects

## Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+

## Installation

1. Install dependencies:
   ```bash
   bun install
   ```

## Development

Run the development server:
```bash
bun run dev
```

The app will be available at `http://localhost:3000`

## Build

Build for production:
```bash
bun run build
```

Preview production build:
```bash
bun run preview
```

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Pixi.js** - 2D WebGL rendering engine

## Project Structure

```
├── components/          # React UI components
├── game/               # Game engine and Pixi.js scene
│   ├── animation/      # Animation controllers
│   ├── components/     # Pixi.js visual components
│   ├── core/           # Core game systems
│   ├── effects/        # Visual effects
│   └── systems/        # Game systems (physics, particles, etc.)
├── services/           # Game engine services
└── types.ts           # TypeScript type definitions
```
