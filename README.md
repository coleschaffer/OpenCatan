# OpenCatan

A free, open-source web implementation of the classic Settlers of Catan board game. Play with friends in real-time multiplayer directly in your browser.

## Features

### Gameplay
- **Full Catan Rules**: Complete implementation of the base game mechanics
- **Real-time Multiplayer**: Play with 2-4 players using room codes
- **Trading System**: Player-to-player and bank/port trading
- **Development Cards**: Knight, Road Building, Year of Plenty, Monopoly, and Victory Point cards
- **Robber Mechanics**: Move the robber, steal resources, discard on 7s
- **Victory Tracking**: Longest Road, Largest Army, and victory point calculation
- **Turn Timer**: Optional configurable turn timer

### User Experience
- **Game Lobby**: Create or join rooms with shareable codes
- **Player Customization**: Choose from 12 player colors
- **Sound Effects**: Immersive audio for dice rolls, trades, and game events
- **Responsive Design**: Works on desktop and tablet browsers
- **Game Statistics**: Track dice distribution, trades, and more

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **State Management**: Redux Toolkit
- **Real-time Sync**: PartyKit (WebSocket-based)
- **Styling**: CSS Modules
- **Testing**: Vitest + React Testing Library

## Project Structure

```
src/
├── components/
│   ├── board/       # Hex grid, tiles, roads, settlements, cities
│   ├── cards/       # Resource cards, development cards
│   ├── game/        # Game container, loading screens
│   ├── lobby/       # Room creation, player list, settings
│   ├── overlays/    # Modals for trading, robber, dev cards
│   ├── panels/      # Player hand, build menu, game log
│   └── ui/          # Reusable UI components
├── game/
│   ├── engine/      # Core game logic
│   ├── rules/       # Game rule validation
│   └── state/       # Redux slices
├── network/         # PartyKit connection & hooks
├── audio/           # Sound effect system
├── pages/           # Route pages (Landing, Lobby, Game)
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

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
# Start the frontend dev server
npm run dev

# Start the PartyKit server (in a separate terminal)
npm run party:dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Build frontend and deploy PartyKit
npm run deploy
```

## Game Rules

OpenCatan follows the standard Settlers of Catan rules:

1. **Setup Phase**: Players take turns placing 2 settlements and 2 roads
2. **Turn Structure**: Roll dice → Collect resources → Trade → Build
3. **Building Costs**:
   - Road: 1 Brick + 1 Lumber
   - Settlement: 1 Brick + 1 Lumber + 1 Wheat + 1 Sheep
   - City: 2 Wheat + 3 Ore
   - Development Card: 1 Sheep + 1 Wheat + 1 Ore
4. **Victory**: First player to reach 10 victory points wins

## Configuration

Game settings can be configured when creating a room:
- **Victory Points**: 8-15 points to win
- **Turn Timer**: 30-300 seconds (or disabled)
- **Discard Limit**: Cards before discarding on 7
- **Friendly Robber**: Robber can't target players with 2 or fewer points

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is open source. Settlers of Catan is a trademark of Catan GmbH. This is a fan-made project and is not affiliated with or endorsed by Catan GmbH.

## Acknowledgments

- Original game design by Klaus Teuber
- Built with React, Redux, PartyKit, and Vite
