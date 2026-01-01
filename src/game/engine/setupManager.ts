/**
 * Setup Phase Manager for OpenCatan
 *
 * Handles all setup phase logic including:
 * - Snake draft turn order (P1->P2->P3->P4->P4->P3->P2->P1)
 * - Settlement and road placement during setup
 * - Starting resource distribution for second settlements
 * - Validation of setup placements
 * - Transition to main game
 */

import type {
  HexCoord,
  VertexCoord,
  EdgeCoord,
  Player,
  ResourceCounts,
  Building,
  Road,
  GamePhase,
} from '../../types';
import {
  vertexToKey,
  edgeToKey,
  hexToKey,
} from '../../types';
import {
  getValidSetupSettlementSpots,
  getValidSetupRoadSpots,
  isVertexOnLand,
  satisfiesDistanceRule,
  getBuildingAtVertex,
  getRoadAtEdge,
  getEdgesAdjacentToVertex,
  placeSettlement as placeSettlementBase,
  placeRoad as placeRoadBase,
} from './building';
import {
  getHexesAdjacentToVertex,
  takeFromBank,
} from './resources';
import { TERRAIN_RESOURCE_MAP } from '../../types/common';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Setup state tracked during setup phase
 */
export interface SetupState {
  /** Current placement index (0-7 for 4 players, 0-11 for 6 players) */
  currentPlacementIndex: number;
  /** Last placed settlement vertex (for road placement constraint) */
  lastPlacedSettlement: VertexCoord | null;
  /** Whether all setup placements are complete */
  placementsComplete: boolean;
  /** Track which placements have been made per player */
  playerPlacements: Record<string, {
    settlement1: VertexCoord | null;
    road1: EdgeCoord | null;
    settlement2: VertexCoord | null;
    road2: EdgeCoord | null;
  }>;
}

/**
 * Game state interface (subset for type safety)
 */
interface GameState {
  phase: GamePhase;
  players: Player[];
  tiles: Array<{ coord: HexCoord; terrain: string; number?: number; hasRobber: boolean }>;
  buildings: Building[];
  roads: Road[];
  bank: ResourceCounts;
  currentPlayerId: string | null;
  setupState?: SetupState | null;
}

// ============================================================================
// TURN ORDER
// ============================================================================

/**
 * Generate the snake draft turn order for setup phase.
 * For N players: [P1, P2, ..., PN, PN, ..., P2, P1]
 *
 * Each player places twice: once going forward, once going backward.
 * This creates the snake pattern: 1->2->3->4->4->3->2->1
 *
 * @param players - Array of players in their seat order
 * @returns Array of player IDs in setup turn order
 */
export function getSetupTurnOrder(players: Player[]): string[] {
  const playerIds = players.map((p) => p.id);
  // Forward pass + reverse pass for snake draft
  return [...playerIds, ...playerIds.slice().reverse()];
}

/**
 * Get the player ID for a specific setup placement index.
 *
 * @param players - Array of players
 * @param placementIndex - The current placement index (0-based)
 * @returns Player ID for this placement
 */
export function getSetupPlayerAtIndex(
  players: Player[],
  placementIndex: number
): string {
  const turnOrder = getSetupTurnOrder(players);
  // Each player makes 2 placements (settlement + road) per turn
  const turnIndex = Math.floor(placementIndex / 2);
  return turnOrder[turnIndex] || players[0].id;
}

/**
 * Get the current setup placement index based on buildings and roads placed.
 *
 * @param state - Current game state
 * @returns Current placement index
 */
export function getSetupPlacementIndex(state: GameState): number {
  return state.setupState?.currentPlacementIndex ?? 0;
}

// ============================================================================
// PLACEMENT TYPE
// ============================================================================

/**
 * Determine what needs to be placed next during setup.
 * Alternates between settlement and road.
 *
 * @param state - Current game state
 * @returns 'settlement' or 'road'
 */
export function getSetupPlacementType(
  state: GameState
): 'settlement' | 'road' {
  const index = getSetupPlacementIndex(state);
  // Even indices = settlement, odd indices = road
  return index % 2 === 0 ? 'settlement' : 'road';
}

/**
 * Check if the current placement is for a second settlement.
 * Second settlements grant starting resources.
 *
 * @param state - Current game state
 * @returns True if this is a second settlement placement
 */
export function isSecondSettlement(state: GameState): boolean {
  const index = getSetupPlacementIndex(state);
  const playerCount = state.players.length;
  // Second settlement placements start at index playerCount * 2
  // (after first round of settlement + road for all players)
  const secondRoundStart = playerCount * 2;
  return index >= secondRoundStart && getSetupPlacementType(state) === 'settlement';
}

/**
 * Get which setup round we're in (1 or 2).
 *
 * @param state - Current game state
 * @returns 1 for first round, 2 for second round
 */
export function getSetupRound(state: GameState): 1 | 2 {
  const index = getSetupPlacementIndex(state);
  const playerCount = state.players.length;
  return index < playerCount * 2 ? 1 : 2;
}

// ============================================================================
// STARTING RESOURCES
// ============================================================================

/**
 * Calculate starting resources for a second settlement placement.
 * Player receives one resource for each terrain type adjacent to the settlement.
 *
 * @param state - Current game state
 * @param vertex - Vertex where second settlement is placed
 * @returns Resource counts to give to the player
 */
export function getStartingResources(
  state: GameState,
  vertex: VertexCoord
): Partial<ResourceCounts> {
  const resources: Partial<ResourceCounts> = {};
  const adjacentHexes = getHexesAdjacentToVertex(vertex);

  for (const hexCoord of adjacentHexes) {
    // Find the tile at this hex
    const tile = state.tiles.find(
      (t) => hexToKey(t.coord) === hexToKey(hexCoord)
    );

    if (tile) {
      const terrainType = tile.terrain as keyof typeof TERRAIN_RESOURCE_MAP;
      const resource = TERRAIN_RESOURCE_MAP[terrainType];
      if (resource) {
        resources[resource] = (resources[resource] || 0) + 1;
      }
    }
  }

  return resources;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate if a settlement can be placed at a vertex during setup.
 * Setup settlements don't need road connections.
 *
 * @param state - Current game state
 * @param vertex - Vertex to check
 * @returns True if placement is valid
 */
export function isValidSetupSettlementPlacement(
  state: GameState,
  vertex: VertexCoord
): boolean {
  // Must be on land
  if (!isVertexOnLand(state as any, vertex)) {
    return false;
  }

  // Must not have a building
  if (getBuildingAtVertex(state as any, vertex)) {
    return false;
  }

  // Must satisfy distance rule
  if (!satisfiesDistanceRule(state as any, vertex)) {
    return false;
  }

  return true;
}

/**
 * Validate if a road can be placed at an edge during setup.
 * Setup roads must connect to the just-placed settlement.
 *
 * @param state - Current game state
 * @param edge - Edge to check
 * @param lastSettlement - Vertex of the just-placed settlement
 * @returns True if placement is valid
 */
export function isValidSetupRoadPlacement(
  state: GameState,
  edge: EdgeCoord,
  lastSettlement: VertexCoord
): boolean {
  // Must not have a road
  if (getRoadAtEdge(state as any, edge)) {
    return false;
  }

  // Must connect to the last placed settlement
  const adjacentEdges = getEdgesAdjacentToVertex(lastSettlement);
  const isAdjacent = adjacentEdges.some(
    (e) => edgeToKey(e) === edgeToKey(edge)
  );

  return isAdjacent;
}

// ============================================================================
// VALID PLACEMENTS
// ============================================================================

/**
 * Get all valid settlement placements for setup phase.
 *
 * @param state - Current game state
 * @returns Array of valid vertex coordinates
 */
export function getValidSetupSettlementPlacements(
  state: GameState
): VertexCoord[] {
  return getValidSetupSettlementSpots(state as any);
}

/**
 * Get all valid road placements for setup phase.
 * During setup, roads must connect to the just-placed settlement.
 *
 * @param state - Current game state
 * @returns Array of valid edge coordinates
 */
export function getValidSetupRoadPlacements(state: GameState): EdgeCoord[] {
  const lastSettlement = state.setupState?.lastPlacedSettlement;
  if (!lastSettlement) {
    return [];
  }
  return getValidSetupRoadSpots(state as any, lastSettlement);
}

// ============================================================================
// PLACEMENT ACTIONS
// ============================================================================

/**
 * Place a settlement during setup phase.
 * Does not deduct resources.
 *
 * @param state - Current game state
 * @param playerId - ID of the player placing
 * @param vertex - Vertex to place settlement
 * @returns New game state with settlement placed
 */
export function placeSetupSettlement(
  state: GameState,
  playerId: string,
  vertex: VertexCoord
): GameState {
  // Use the base building function with isSetup=true
  let newState = placeSettlementBase(state as any, playerId, vertex, true);

  // Update setup state
  const currentIndex = getSetupPlacementIndex(state);
  const isSecond = isSecondSettlement(state);

  // Initialize setup state if needed
  const setupState: SetupState = {
    ...(state.setupState || {
      currentPlacementIndex: 0,
      lastPlacedSettlement: null,
      placementsComplete: false,
      playerPlacements: {},
    }),
    currentPlacementIndex: currentIndex + 1,
    lastPlacedSettlement: vertex,
  };

  // Track player placements
  if (!setupState.playerPlacements[playerId]) {
    setupState.playerPlacements[playerId] = {
      settlement1: null,
      road1: null,
      settlement2: null,
      road2: null,
    };
  }

  if (isSecond) {
    setupState.playerPlacements[playerId].settlement2 = vertex;
  } else {
    setupState.playerPlacements[playerId].settlement1 = vertex;
  }

  // If this is a second settlement, grant starting resources
  if (isSecond) {
    const startingResources = getStartingResources(state, vertex);
    newState = takeFromBank(newState as any, playerId, startingResources);
  }

  return {
    ...newState,
    setupState,
  } as GameState;
}

/**
 * Place a road during setup phase.
 * Does not deduct resources.
 *
 * @param state - Current game state
 * @param playerId - ID of the player placing
 * @param edge - Edge to place road
 * @returns New game state with road placed
 */
export function placeSetupRoad(
  state: GameState,
  playerId: string,
  edge: EdgeCoord
): GameState {
  // Use the base building function with isFree=true
  let newState = placeRoadBase(state as any, playerId, edge, true);

  // Update setup state
  const currentIndex = getSetupPlacementIndex(state);
  const isSecondRoad = getSetupRound(state) === 2;

  const setupState: SetupState = {
    ...(state.setupState || {
      currentPlacementIndex: 0,
      lastPlacedSettlement: null,
      placementsComplete: false,
      playerPlacements: {},
    }),
    currentPlacementIndex: currentIndex + 1,
    lastPlacedSettlement: null, // Clear after road is placed
  };

  // Track player placements
  if (!setupState.playerPlacements[playerId]) {
    setupState.playerPlacements[playerId] = {
      settlement1: null,
      road1: null,
      settlement2: null,
      road2: null,
    };
  }

  if (isSecondRoad) {
    setupState.playerPlacements[playerId].road2 = edge;
  } else {
    setupState.playerPlacements[playerId].road1 = edge;
  }

  return {
    ...newState,
    setupState,
  } as GameState;
}

// ============================================================================
// PHASE MANAGEMENT
// ============================================================================

/**
 * Advance the setup phase to the next player/placement.
 * Updates the game phase based on current setup progress.
 *
 * @param state - Current game state
 * @returns New game state with updated phase
 */
export function advanceSetupPhase(state: GameState): GameState {
  const currentIndex = getSetupPlacementIndex(state);
  const placementType = getSetupPlacementType(state);
  const playerCount = state.players.length;
  const totalPlacements = playerCount * 4; // 2 settlements + 2 roads per player

  // Determine next phase based on what was just placed
  let nextPhase: GamePhase = state.phase;

  if (currentIndex >= totalPlacements) {
    // Setup is complete, transition to main game
    nextPhase = 'roll';
  } else if (placementType === 'settlement') {
    // After settlement, need to place road
    if (getSetupRound(state) === 1) {
      nextPhase = 'setup-road-1';
    } else {
      nextPhase = 'setup-road-2';
    }
  } else {
    // After road, next player places settlement
    const nextRound = getSetupRound({ ...state, setupState: { ...state.setupState!, currentPlacementIndex: currentIndex } });
    if (nextRound === 1) {
      nextPhase = 'setup-settlement-1';
    } else {
      nextPhase = 'setup-settlement-2';
    }
  }

  // Determine next player
  const turnOrder = getSetupTurnOrder(state.players);
  const nextTurnIndex = Math.floor(currentIndex / 2);
  const nextPlayerId = turnOrder[nextTurnIndex] || state.players[0].id;

  return {
    ...state,
    phase: nextPhase,
    currentPlayerId: nextPlayerId,
  };
}

/**
 * Check if setup phase is complete.
 *
 * @param state - Current game state
 * @returns True if all setup placements are done
 */
export function isSetupComplete(state: GameState): boolean {
  const currentIndex = getSetupPlacementIndex(state);
  const playerCount = state.players.length;
  const totalPlacements = playerCount * 4;
  return currentIndex >= totalPlacements;
}

/**
 * Transition from setup to main game.
 * Sets up the first turn of the main game.
 *
 * @param state - Current game state
 * @returns New game state ready for main game
 */
export function startMainGame(state: GameState): GameState {
  // First player in turn order goes first in main game
  const firstPlayerId = state.players[0].id;

  return {
    ...state,
    phase: 'roll',
    currentPlayerId: firstPlayerId,
    setupState: null, // Clear setup state
  };
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Get total number of setup placements needed.
 *
 * @param playerCount - Number of players
 * @returns Total placements (settlements + roads)
 */
export function getTotalSetupPlacements(playerCount: number): number {
  return playerCount * 4; // 2 settlements + 2 roads per player
}

/**
 * Initialize setup state for a new game.
 *
 * @param players - Array of players
 * @returns Initial setup state
 */
export function createInitialSetupState(players: Player[]): SetupState {
  const playerPlacements: SetupState['playerPlacements'] = {};
  for (const player of players) {
    playerPlacements[player.id] = {
      settlement1: null,
      road1: null,
      settlement2: null,
      road2: null,
    };
  }

  return {
    currentPlacementIndex: 0,
    lastPlacedSettlement: null,
    placementsComplete: false,
    playerPlacements,
  };
}

/**
 * Get setup timer duration (shorter than main game turns).
 *
 * @returns Timer duration in seconds
 */
export function getSetupTimerDuration(): number {
  return 45; // 45 seconds for setup placements
}
