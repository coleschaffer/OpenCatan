/**
 * Lobby Type Definitions for OpenCatan
 *
 * Defines types for the game lobby, player slots, and pre-game configuration.
 */

import type { PlayerColor } from './common';
import type { GameSettings } from './game';

/**
 * A player slot in the lobby
 */
export interface LobbySlot {
  /** Unique slot index (0-5) */
  index: number;

  /** Player ID if occupied, null if empty */
  playerId: string | null;

  /** Player name if occupied */
  playerName: string | null;

  /** Player's chosen color */
  color: PlayerColor | null;

  /** Whether the player is ready to start */
  isReady: boolean;

  /** Whether this slot is the host */
  isHost: boolean;

  /** Whether the player is connected */
  isConnected: boolean;
}

/**
 * Complete lobby state
 */
export interface LobbyState {
  /** Room code for this lobby */
  roomCode: string;

  /** Current game settings */
  settings: GameSettings;

  /** All player slots (up to 6) */
  slots: LobbySlot[];

  /** Host player ID */
  hostId: string;

  /** Whether the game can start (all players ready, min players met) */
  canStart: boolean;

  /** Minimum players required to start */
  minPlayers: number;

  /** Maximum players allowed */
  maxPlayers: number;

  /** Timestamp when lobby was created */
  createdAt: number;
}

/**
 * Lobby player info (simplified view)
 */
export interface LobbyPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  isReady: boolean;
  isHost: boolean;
  isConnected: boolean;
}

/**
 * Create an empty lobby slot
 */
export function createEmptySlot(index: number): LobbySlot {
  return {
    index,
    playerId: null,
    playerName: null,
    color: null,
    isReady: false,
    isHost: false,
    isConnected: false,
  };
}

/**
 * Default colors for player slots
 */
export const DEFAULT_SLOT_COLORS: PlayerColor[] = [
  'red',
  'blue',
  'orange',
  'white',
  'green',
  'purple',
];

/**
 * Get available colors in the lobby
 */
export function getAvailableColors(slots: LobbySlot[]): PlayerColor[] {
  const usedColors = new Set(
    slots.filter(s => s.color !== null).map(s => s.color as PlayerColor)
  );
  return DEFAULT_SLOT_COLORS.filter(c => !usedColors.has(c));
}
