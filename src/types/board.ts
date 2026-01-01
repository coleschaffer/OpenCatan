/**
 * Board element types for the game board representation
 */

import type { HexCoord, VertexCoord, EdgeCoord } from './coordinates';
import type { TerrainType, ResourceType, PlayerColor } from './common';

/**
 * Represents a hex tile on the game board
 */
export interface HexTile {
  /** Unique identifier for this hex */
  id: string;
  /** Axial coordinates of this hex */
  coord: HexCoord;
  /** Terrain type determining resource production */
  terrain: TerrainType;
  /** Number token (2-12, undefined for desert/water) */
  number?: number;
  /** Whether the robber is currently on this hex */
  hasRobber: boolean;
  /** Whether the pirate is currently on this hex (Seafarers) */
  hasPirate: boolean;
  /** Whether this tile is hidden as fog (Explorers scenario) */
  isFog: boolean;
  /** Harbor on this hex if any (for water tiles) */
  harbor?: Harbor;
  /** Revealed terrain when fog is cleared */
  revealedTerrain?: TerrainType;
  /** Revealed number when fog is cleared */
  revealedNumber?: number;
}

/**
 * Building types that can be placed at vertices
 */
export type BuildingType = 'settlement' | 'city';

/**
 * Metropolis types for Cities & Knights expansion
 */
export type MetropolisType = 'trade' | 'politics' | 'science';

/**
 * Represents a building (settlement or city) on the board
 */
export interface Building {
  /** Unique identifier for this building */
  id?: string;
  /** Type of building */
  type: BuildingType;
  /** ID of the player who owns this building */
  playerId: string;
  /** Color of the player (for rendering) */
  playerColor?: PlayerColor;
  /** Location of the building */
  vertex: VertexCoord;
  /** Whether this city has a city wall (C&K) */
  hasWall?: boolean;
  /** Metropolis type if this city has one (C&K) */
  hasMetropolis?: MetropolisType;
}

/**
 * Road/ship type for edge pieces
 */
export type RoadType = 'road' | 'ship';

/**
 * Represents a road or ship on the board
 */
export interface Road {
  /** Unique identifier for this road */
  id?: string;
  /** Type of path (road on land, ship on water) */
  type: RoadType;
  /** ID of the player who owns this road/ship */
  playerId: string;
  /** Color of the player (for rendering) */
  playerColor?: PlayerColor;
  /** Location of the road/ship */
  edge: EdgeCoord;
  /** Whether this ship is at the end of the route (can be moved) - Seafarers */
  isOpen?: boolean;
}

/**
 * Knight levels for Cities & Knights expansion
 */
export type KnightLevel = 1 | 2 | 3;

/**
 * Represents a knight piece (Cities & Knights expansion)
 */
export interface Knight {
  /** Unique identifier for this knight */
  id: string;
  /** ID of the player who owns this knight */
  playerId: string;
  /** Knight strength level (1=basic, 2=strong, 3=mighty) */
  level: KnightLevel;
  /** Whether the knight is active (can perform actions) */
  isActive: boolean;
  /** Location of the knight on the board */
  vertex: VertexCoord;
  /** Whether this knight has been activated this turn */
  wasActivatedThisTurn?: boolean;
  /** Whether this knight has performed an action this turn */
  hasActedThisTurn?: boolean;
}

/**
 * Port type - either generic (3:1) or specific resource (2:1)
 */
export type PortType = 'generic' | ResourceType;

/**
 * Represents a port/harbor on the board
 */
export interface Port {
  /** Unique identifier for this port */
  id: string;
  /** Edge where ships can dock to access this port */
  edge: EdgeCoord;
  /** Type of port - generic or specific resource */
  type: PortType;
  /** Trade ratio (3 for generic, 2 for specific resource ports) */
  ratio: 2 | 3;
  /** The two vertices this port connects to */
  vertices?: [VertexCoord, VertexCoord];
  /** Visual position for rendering the port icon */
  position?: {
    x: number;
    y: number;
    rotation: number;
  };
}

/**
 * Harbor type (alias for Port, used on water tiles)
 */
export type Harbor = Port;

/**
 * The robber piece location
 */
export interface RobberState {
  /** Current hex where the robber is located */
  position: HexCoord;
}

/**
 * The pirate piece location (Seafarers expansion)
 */
export interface PirateState {
  /** Current hex where the pirate is located (water tile) */
  position: HexCoord;
}

/**
 * Complete board state
 */
export interface BoardState {
  /** All hex tiles on the board */
  hexes: HexTile[];
  /** All buildings placed on the board */
  buildings: Building[];
  /** All roads and ships placed on the board */
  roads: Road[];
  /** All ports/harbors on the board */
  ports: Port[];
  /** All knights on the board (C&K) */
  knights: Knight[];
  /** Current robber position */
  robber: RobberState;
  /** Current pirate position (Seafarers) */
  pirate?: PirateState;
}

/**
 * Preset map configuration
 */
export interface MapPreset {
  /** Display name of this map */
  name: string;
  /** Description of the map layout */
  description: string;
  /** Supported player counts */
  playerCounts: number[];
  /** Whether this is a Seafarers map */
  isSeafarers: boolean;
  /** Predefined tile placements */
  tiles: Array<{
    coord: HexCoord;
    terrain: TerrainType;
    number?: number;
  }>;
  /** Predefined port placements */
  ports: Array<{
    type: PortType;
    edge: EdgeCoord;
    vertices: [VertexCoord, VertexCoord];
  }>;
}

/**
 * Mapping of port types to their trade ratios
 */
export const PORT_RATIOS: Record<PortType, number> = {
  generic: 3,
  brick: 2,
  lumber: 2,
  ore: 2,
  grain: 2,
  wool: 2,
};

/**
 * Standard tile distribution for base 4-player game
 */
export const STANDARD_TILE_DISTRIBUTION: Record<TerrainType, number> = {
  hills: 3,
  forest: 4,
  mountains: 3,
  fields: 4,
  pasture: 4,
  desert: 1,
  water: 0,
  gold: 0,
  fog: 0,
};

/**
 * Number token distribution for base game
 * Index is the number (2-12), value is count
 */
export const NUMBER_TOKEN_DISTRIBUTION: Record<number, number> = {
  2: 1,
  3: 2,
  4: 2,
  5: 2,
  6: 2,
  8: 2,
  9: 2,
  10: 2,
  11: 2,
  12: 1,
};

/**
 * Knight level names for display
 */
export const KNIGHT_LEVEL_NAMES: Record<KnightLevel, string> = {
  1: 'Basic',
  2: 'Strong',
  3: 'Mighty',
};

/**
 * Knight strength by level (used for barbarian defense calculation)
 */
export const KNIGHT_STRENGTH: Record<KnightLevel, number> = {
  1: 1,
  2: 2,
  3: 3,
};
