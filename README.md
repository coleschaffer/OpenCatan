# OpenCatan

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![PartyKit](https://img.shields.io/badge/PartyKit-WebSocket-green)
![Vite](https://img.shields.io/badge/Vite-7-646cff)

A free, open-source web implementation of Settlers of Catan with real-time multiplayer.

## Overview

OpenCatan brings the classic board game to your browser. Play with 2-4 friends in real-time using shareable room codes. Features complete base game rules, trading systems, development cards, and all the mechanics you know from the tabletop version.

Built with a host-authority architecture where one player's browser validates all game actions, reducing server complexity while maintaining game integrity.

## Features

### Gameplay
- **Full Catan Rules** - Complete base game implementation
- **Real-time Multiplayer** - 2-4 players via room codes
- **Trading System** - Player-to-player and bank/port trading
- **Development Cards** - Knight, Road Building, Year of Plenty, Monopoly, Victory Point
- **Robber Mechanics** - Move on 7s, steal resources, block tiles
- **Victory Tracking** - Longest Road, Largest Army, 10 points to win

### Experience
- **12 Player Colors** - Red, blue, orange, white, green, purple, and more
- **Sound Effects** - Immersive audio for dice, trades, and events
- **Game Statistics** - Dice distribution, trade history
- **Configurable Settings** - Victory points, turn timer, friendly robber

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| State | Redux Toolkit 2.5 |
| Networking | PartyKit (WebSocket) |
| Styling | CSS Modules |
| Testing | Vitest, React Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/coleschaffer/OpenCatan.git
cd OpenCatan

# Install dependencies
npm install
```

### Development

```bash
# Terminal 1: Start frontend
npm run dev
# Opens http://localhost:5173

# Terminal 2: Start PartyKit server
npm run party:dev
```

### Deployment

```bash
# Build and deploy everything
npm run deploy
```

## Project Structure

```
OpenCatan/
├── src/
│   ├── components/
│   │   ├── board/          # Hex grid, tiles, buildings
│   │   ├── cards/          # Resource & dev cards
│   │   ├── game/           # Game container
│   │   ├── lobby/          # Room creation, settings
│   │   ├── overlays/       # Trade, robber modals
│   │   ├── panels/         # Hand, build menu, log
│   │   └── ui/             # Reusable components
│   ├── game/
│   │   ├── engine/         # Core game logic
│   │   ├── rules/          # Rule validation
│   │   └── state/          # Redux slices
│   ├── network/            # PartyKit connection
│   ├── audio/              # Sound system (46+ effects)
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   └── utils/              # Hex math, helpers
├── party/                  # PartyKit server
│   └── index.ts            # WebSocket handler
├── public/                 # Assets, sounds
└── tests/                  # Test suites
```

## Game Rules

### Setup Phase
Players take turns placing 2 settlements and 2 roads.

### Turn Structure
1. Roll dice
2. Collect resources
3. Trade with players or bank
4. Build (roads, settlements, cities, dev cards)

### Building Costs
| Building | Cost |
|----------|------|
| Road | 1 Brick + 1 Lumber |
| Settlement | 1 Brick + 1 Lumber + 1 Wheat + 1 Sheep |
| City | 2 Wheat + 3 Ore |
| Dev Card | 1 Sheep + 1 Wheat + 1 Ore |

### Victory
First player to reach 10 victory points wins.

## Configuration

### Game Settings
- **Victory Points**: 8-15 (default: 10)
- **Turn Timer**: 30-300 seconds or disabled (default: 90s)
- **Discard Limit**: Cards before discarding on 7 (default: 7)
- **Friendly Robber**: Can't target players with ≤2 points

### Server Settings
- Reconnection timeout: 30 seconds
- Room expiration: 30 minutes inactive

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run test` | Run tests |
| `npm run party:dev` | Start PartyKit locally |
| `npm run party:deploy` | Deploy PartyKit |
| `npm run deploy` | Full deployment |

## Architecture

### Host-Authority Model
- One player's browser (host) validates all game actions
- PartyKit server only relays messages
- Automatic host migration if host disconnects
- Optimistic updates with rollback on rejection

## License

MIT License

*Settlers of Catan is a trademark of Catan GmbH. This is a fan-made project not affiliated with or endorsed by Catan GmbH.*
