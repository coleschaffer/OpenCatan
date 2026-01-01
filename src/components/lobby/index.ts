/**
 * Lobby Components
 * Export all lobby-related components for OpenCatan
 */

// Main pages
export { LandingPage } from './LandingPage';
export { CreateRoom } from './CreateRoom';
export { JoinRoom } from './JoinRoom';
export { GameLobby } from './GameLobby';

// Core components
export { RoomCode } from './RoomCode';
export { PlayerList, type LobbyPlayerInfo } from './PlayerList';
export { ColorPicker } from './ColorPicker';
export { GameSettings, type LobbyGameSettings } from './GameSettings';
export { ReadyButton } from './ReadyButton';
export { StartGameButton } from './StartGameButton';

// Re-export types from @/types for convenience
export type {
  PlayerColor,
  GameMode,
  MapType,
  TurnTimerOption,
  VictoryPointTarget,
  DiscardLimit,
} from '@/types';

export {
  PLAYER_COLORS,
  COLOR_CONFIG,
  DEFAULT_GAME_SETTINGS,
} from '@/types';
