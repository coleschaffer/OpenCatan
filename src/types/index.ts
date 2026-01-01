/**
 * OpenCatan Type Definitions
 *
 * Central export file for all game types.
 * Import from '@/types' or './types' to access all types.
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type {
  PlayerColor,
  ResourceType,
  CommodityType,
  TerrainType,
  ResourceCounts,
  CommodityCounts,
  ColorInfo,
} from './common';

export {
  PLAYER_COLORS,
  PLAYER_COLOR_NAMES,
  PLAYER_COLOR_HEX,
  COLOR_CONFIG,
  RESOURCE_TYPES,
  COMMODITY_TYPES,
  TERRAIN_RESOURCE_MAP,
} from './common';

// ============================================================================
// COORDINATES
// ============================================================================

export type {
  HexCoord,
  VertexDirection,
  VertexCoord,
  EdgeDirection,
  EdgeCoord,
  HexCoordKey,
  VertexCoordKey,
  EdgeCoordKey,
} from './coordinates';

export {
  hexToKey,
  vertexToKey,
  edgeToKey,
  keyToHex,
  keyToVertex,
  keyToEdge,
  getHexS,
  hexEquals,
  vertexEquals,
  edgeEquals,
  getHexNeighbors,
  hexDistance,
  // Aliases for backward compatibility
  hexToKey as hexKey,
  vertexToKey as vertexKey,
  edgeToKey as edgeKey,
} from './coordinates';

// ============================================================================
// BOARD
// ============================================================================

export type {
  HexTile,
  BuildingType,
  MetropolisType,
  Building,
  RoadType,
  Road,
  KnightLevel,
  Knight,
  PortType,
  Port,
  Harbor,
  RobberState,
  PirateState,
  BoardState,
  MapPreset,
} from './board';

export {
  PORT_RATIOS,
  STANDARD_TILE_DISTRIBUTION,
  NUMBER_TOKEN_DISTRIBUTION,
  KNIGHT_LEVEL_NAMES,
  KNIGHT_STRENGTH,
} from './board';

// ============================================================================
// PLAYER
// ============================================================================

export type {
  CityImprovements,
  PlayerSettings,
  Player,
} from './player';

export {
  DEFAULT_PLAYER_SETTINGS,
  PLAYER_PIECE_LIMITS,
  INITIAL_BANK_RESOURCES,
  createPlayer,
  getVisibleVictoryPoints,
  createEmptyResources,
  createEmptyCommodities,
  getTotalResources,
  getTotalCommodities,
} from './player';

// ============================================================================
// CARDS
// ============================================================================

export type {
  DevelopmentCardType,
  DevelopmentCard,
  ProgressCardCategory,
  TradeProgressCardType,
  PoliticsProgressCardType,
  ScienceProgressCardType,
  ProgressCardType,
  ProgressCard,
} from './cards';

export {
  DEVELOPMENT_CARD_COUNTS,
  DEVELOPMENT_CARD_NAMES,
  DEVELOPMENT_CARD_DESCRIPTIONS,
  PROGRESS_CARD_COUNTS,
  PROGRESS_CARD_NAMES,
  PROGRESS_CARD_DESCRIPTIONS,
  TOTAL_DEVELOPMENT_CARDS,
  getProgressCardCategory,
  createDevelopmentDeck,
  createProgressDeck,
} from './cards';

// ============================================================================
// GAME
// ============================================================================

export type {
  GamePhase,
  GameMode,
  TurnTimerOption,
  VictoryPointTarget,
  DiscardLimit,
  MapType,
  GameSettings,
  DiceRoll,
  EventDieResult,
  TradeResponseStatus,
  TradeOfferStatus,
  TradeCounterOffer,
  TradeOffer,
  MerchantState,
  AchievementState,
  LogEntry,
  ChatMessage,
  GameState,
  GameAction,
  ActionResult,
  GameEventType,
  GameEvent,
} from './game';

export { DEFAULT_GAME_SETTINGS } from './game';

// ============================================================================
// NETWORK
// ============================================================================

export type {
  LobbyState,
  LobbyPlayer,
  LogEntryType,
  LogVisibility,
  NetworkLogEntry,
  NetworkChatMessage,
  ClientMessage,
  HostMessage,
  ServerMessage,
  ErrorCode,
  ConnectionState,
  ConnectionInfo,
  CreateRoomOptions,
  JoinRoomOptions,
} from './network';

export { ROOM_CODE_CONFIG } from './network';

// ============================================================================
// LOBBY
// ============================================================================

export type {
  LobbySlot,
  LobbyState as LobbyPageState,
  LobbyPlayer as LobbyPagePlayer,
} from './lobby';

export {
  createEmptySlot,
  DEFAULT_SLOT_COLORS,
  getAvailableColors,
} from './lobby';

// ============================================================================
// BUILDING COSTS
// ============================================================================

import type { ResourceCounts } from './common';

/**
 * Standard building costs for base game
 */
export const BUILDING_COSTS: Record<string, Partial<ResourceCounts>> = {
  road: { brick: 1, lumber: 1 },
  settlement: { brick: 1, lumber: 1, grain: 1, wool: 1 },
  city: { ore: 3, grain: 2 },
  ship: { lumber: 1, wool: 1 },
  developmentCard: { ore: 1, grain: 1, wool: 1 },
};

/**
 * Get resource produced by terrain type
 */
export function terrainToResource(terrain: string): string | null {
  const map: Record<string, string> = {
    hills: 'brick',
    forest: 'lumber',
    mountains: 'ore',
    fields: 'grain',
    pasture: 'wool',
  };
  return map[terrain] ?? null;
}

// Type aliases for backward compatibility with existing code
export type ResourceHand = ResourceCounts;
export type CommodityHand = import('./common').CommodityCounts;

// Aliases for function names
export { createEmptyResources as createEmptyResourceHand } from './player';
export { createEmptyCommodities as createEmptyCommodityHand } from './player';
