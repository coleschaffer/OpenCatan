/**
 * Building Manager Module
 *
 * This module handles building placement and validation in OpenCatan:
 * - Getting valid placement locations for roads, settlements, and cities
 * - Placing buildings on the board
 * - Validating placement rules (distance rule, connectivity, etc.)
 *
 * This module provides the public API and wraps/extends the core
 * building functions from building.ts.
 *
 * All functions are pure and return new state objects without mutations.
 */

import {
  GameState,
  Player,
  VertexCoord,
  EdgeCoord,
  Building,
  Road,
  ResourceCounts,
  vertexToKey,
  edgeToKey,
  hexToKey,
} from '../../types';

// Re-export utilities from building.ts
export {
  getEdgesAdjacentToVertex,
  getVerticesOfEdge,
  getAdjacentVerticesFromVertex,
  getAdjacentEdges,
  isVertexOnLand,
  isEdgeOnLand,
  satisfiesDistanceRule,
  getBuildingAtVertex,
  getRoadAtEdge,
  hasConnectionToEdge,
  hasRoadToVertex,
} from './building';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Building costs for the base game
 */
export const BUILDING_COSTS = {
  road: { brick: 1, lumber: 1 },
  settlement: { brick: 1, lumber: 1, grain: 1, wool: 1 },
  city: { ore: 3, grain: 2 },
  developmentCard: { ore: 1, grain: 1, wool: 1 },
  ship: { wool: 1, lumber: 1 }, // Seafarers
} as const;

// ============================================================================
// VALID PLACEMENT FUNCTIONS
// ============================================================================

/**
 * Gets all valid edges where a player can place a road.
 *
 * Roads must:
 * - Be on land (adjacent to at least one land tile)
 * - Not already have a road
 * - Be connected to the player's road network or settlement
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Array of valid edge coordinates
 */
export function getValidRoadPlacements(
  state: GameState,
  playerId: string
): EdgeCoord[] {
  // Import the function from building.ts
  const { getValidRoadSpots } = require('./building');
  return getValidRoadSpots(state, playerId);
}

/**
 * Gets all valid vertices where a player can place a settlement.
 *
 * Settlements must:
 * - Be on land (adjacent to at least one land tile)
 * - Not already have a building
 * - Satisfy the distance rule (no adjacent buildings)
 * - Be connected to the player's road network (unless setup phase)
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param isSetup - Whether this is during setup phase (skips road connection check)
 * @returns Array of valid vertex coordinates
 */
export function getValidSettlementPlacements(
  state: GameState,
  playerId: string,
  isSetup: boolean = false
): VertexCoord[] {
  const { getValidSetupSettlementSpots, getValidSettlementSpots } = require('./building');

  if (isSetup) {
    return getValidSetupSettlementSpots(state);
  }
  return getValidSettlementSpots(state, playerId);
}

/**
 * Gets all valid vertices where a player can upgrade a settlement to a city.
 *
 * Cities can only be built on the player's existing settlements.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Array of valid vertex coordinates
 */
export function getValidCityPlacements(
  state: GameState,
  playerId: string
): VertexCoord[] {
  const { getValidCitySpots } = require('./building');
  return getValidCitySpots(state, playerId);
}

// ============================================================================
// PLACEMENT VALIDATION
// ============================================================================

/**
 * Checks if a road placement is valid.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param edge - Edge to check
 * @returns True if the placement is valid
 */
export function isValidRoadPlacement(
  state: GameState,
  playerId: string,
  edge: EdgeCoord
): boolean {
  const validSpots = getValidRoadPlacements(state, playerId);
  return validSpots.some(
    e => e.hex.q === edge.hex.q &&
         e.hex.r === edge.hex.r &&
         e.direction === edge.direction
  );
}

/**
 * Checks if a settlement placement is valid.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param vertex - Vertex to check
 * @param isSetup - Whether this is during setup phase
 * @returns True if the placement is valid
 */
export function isValidSettlementPlacement(
  state: GameState,
  playerId: string,
  vertex: VertexCoord,
  isSetup: boolean = false
): boolean {
  const validSpots = getValidSettlementPlacements(state, playerId, isSetup);
  return validSpots.some(
    v => v.hex.q === vertex.hex.q &&
         v.hex.r === vertex.hex.r &&
         v.direction === vertex.direction
  );
}

/**
 * Checks if a city placement is valid.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param vertex - Vertex to check
 * @returns True if the placement is valid
 */
export function isValidCityPlacement(
  state: GameState,
  playerId: string,
  vertex: VertexCoord
): boolean {
  const validSpots = getValidCityPlacements(state, playerId);
  return validSpots.some(
    v => v.hex.q === vertex.hex.q &&
         v.hex.r === vertex.hex.r &&
         v.direction === vertex.direction
  );
}

// ============================================================================
// BUILDING PLACEMENT
// ============================================================================

/**
 * Places a road for a player.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param edge - Edge to place the road
 * @param isFree - Whether this is a free placement (setup, Road Building card)
 * @returns New game state with the road placed
 */
export function placeRoad(
  state: GameState,
  playerId: string,
  edge: EdgeCoord,
  isFree: boolean = false
): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  // Create new road
  const road: Road = {
    id: `road-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'road',
    playerId,
    playerColor: player.color,
    edge,
  };

  // Update player's remaining pieces and resources
  const newPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;

    const newResources = isFree
      ? p.resources
      : {
          ...p.resources,
          brick: p.resources.brick - BUILDING_COSTS.road.brick,
          lumber: p.resources.lumber - BUILDING_COSTS.road.lumber,
        };

    return {
      ...p,
      resources: newResources,
      roadsRemaining: p.roadsRemaining - 1,
    };
  });

  // Update bank if not free
  let newBank = state.bank;
  if (!isFree) {
    newBank = {
      ...state.bank,
      brick: state.bank.brick + BUILDING_COSTS.road.brick,
      lumber: state.bank.lumber + BUILDING_COSTS.road.lumber,
    };
  }

  return {
    ...state,
    roads: [...state.roads, road],
    players: newPlayers,
    bank: newBank,
  };
}

/**
 * Places a settlement for a player.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param vertex - Vertex to place the settlement
 * @param isSetup - Whether this is a setup placement (no resources deducted)
 * @returns New game state with the settlement placed
 */
export function placeSettlement(
  state: GameState,
  playerId: string,
  vertex: VertexCoord,
  isSetup: boolean = false
): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  // Create new building
  const building: Building = {
    id: `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'settlement',
    playerId,
    playerColor: player.color,
    vertex,
    hasWall: false,
  };

  // Update player's remaining pieces and resources
  const newPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;

    const newResources = isSetup
      ? p.resources
      : {
          ...p.resources,
          brick: p.resources.brick - BUILDING_COSTS.settlement.brick,
          lumber: p.resources.lumber - BUILDING_COSTS.settlement.lumber,
          grain: p.resources.grain - BUILDING_COSTS.settlement.grain,
          wool: p.resources.wool - BUILDING_COSTS.settlement.wool,
        };

    return {
      ...p,
      resources: newResources,
      settlementsRemaining: p.settlementsRemaining - 1,
    };
  });

  // Update bank if not setup
  let newBank = state.bank;
  if (!isSetup) {
    newBank = {
      ...state.bank,
      brick: state.bank.brick + BUILDING_COSTS.settlement.brick,
      lumber: state.bank.lumber + BUILDING_COSTS.settlement.lumber,
      grain: state.bank.grain + BUILDING_COSTS.settlement.grain,
      wool: state.bank.wool + BUILDING_COSTS.settlement.wool,
    };
  }

  // If this is the second settlement during setup, give starting resources
  let finalState: GameState = {
    ...state,
    buildings: [...state.buildings, building],
    players: newPlayers,
    bank: newBank,
  };

  if (isSetup && state.phase === 'setup-settlement-2') {
    finalState = giveStartingResources(finalState, playerId, vertex);
  }

  return finalState;
}

/**
 * Places a city for a player (upgrades a settlement).
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param vertex - Vertex of the settlement to upgrade
 * @returns New game state with the city placed
 */
export function placeCity(
  state: GameState,
  playerId: string,
  vertex: VertexCoord
): GameState {
  const vKey = vertexToKey(vertex);

  // Update the building
  const newBuildings = state.buildings.map(building => {
    if (vertexToKey(building.vertex) === vKey && building.playerId === playerId) {
      return {
        ...building,
        type: 'city' as const,
      };
    }
    return building;
  });

  // Update player's pieces and resources
  const newPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;

    return {
      ...p,
      resources: {
        ...p.resources,
        ore: p.resources.ore - BUILDING_COSTS.city.ore,
        grain: p.resources.grain - BUILDING_COSTS.city.grain,
      },
      settlementsRemaining: p.settlementsRemaining + 1, // Get settlement back
      citiesRemaining: p.citiesRemaining - 1,
    };
  });

  // Add resources to bank
  const newBank = {
    ...state.bank,
    ore: state.bank.ore + BUILDING_COSTS.city.ore,
    grain: state.bank.grain + BUILDING_COSTS.city.grain,
  };

  return {
    ...state,
    buildings: newBuildings,
    players: newPlayers,
    bank: newBank,
  };
}

// ============================================================================
// SETUP HELPERS
// ============================================================================

/**
 * Gets all hexes adjacent to a vertex (for starting resource distribution).
 */
function getHexesAdjacentToVertex(vertex: VertexCoord): Array<{ q: number; r: number }> {
  const { q, r } = vertex.hex;

  if (vertex.direction === 'N') {
    return [
      { q, r },
      { q: q - 1, r },
      { q, r: r - 1 },
    ];
  } else {
    return [
      { q, r },
      { q: q - 1, r: r + 1 },
      { q, r: r + 1 },
    ];
  }
}

/**
 * Gives starting resources to a player based on their second settlement.
 * Each terrain type adjacent to the settlement gives one resource.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param vertex - Location of the second settlement
 * @returns New game state with starting resources distributed
 */
function giveStartingResources(
  state: GameState,
  playerId: string,
  vertex: VertexCoord
): GameState {
  const adjacentHexes = getHexesAdjacentToVertex(vertex);
  const resources: Partial<ResourceCounts> = {};

  for (const hexCoord of adjacentHexes) {
    const tile = state.tiles.find(
      t => hexToKey(t.coord) === hexToKey(hexCoord)
    );

    if (tile) {
      const { TERRAIN_RESOURCE_MAP } = require('../../types');
      const resource = TERRAIN_RESOURCE_MAP[tile.terrain];
      if (resource && state.bank[resource] > 0) {
        resources[resource] = (resources[resource] || 0) + 1;
      }
    }
  }

  // Add resources to player and deduct from bank
  const newPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;

    return {
      ...p,
      resources: {
        brick: p.resources.brick + (resources.brick || 0),
        lumber: p.resources.lumber + (resources.lumber || 0),
        ore: p.resources.ore + (resources.ore || 0),
        grain: p.resources.grain + (resources.grain || 0),
        wool: p.resources.wool + (resources.wool || 0),
      },
    };
  });

  const newBank = {
    brick: state.bank.brick - (resources.brick || 0),
    lumber: state.bank.lumber - (resources.lumber || 0),
    ore: state.bank.ore - (resources.ore || 0),
    grain: state.bank.grain - (resources.grain || 0),
    wool: state.bank.wool - (resources.wool || 0),
  };

  return {
    ...state,
    players: newPlayers,
    bank: newBank,
  };
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Gets all buildings owned by a player.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Array of buildings owned by the player
 */
export function getPlayerBuildings(state: GameState, playerId: string): Building[] {
  return state.buildings.filter(b => b.playerId === playerId);
}

/**
 * Gets all roads owned by a player.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Array of roads owned by the player
 */
export function getPlayerRoads(state: GameState, playerId: string): Road[] {
  return state.roads.filter(r => r.playerId === playerId);
}

/**
 * Counts the number of settlements a player has.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Number of settlements
 */
export function countSettlements(state: GameState, playerId: string): number {
  return state.buildings.filter(
    b => b.playerId === playerId && b.type === 'settlement'
  ).length;
}

/**
 * Counts the number of cities a player has.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Number of cities
 */
export function countCities(state: GameState, playerId: string): number {
  return state.buildings.filter(
    b => b.playerId === playerId && b.type === 'city'
  ).length;
}

/**
 * Counts the number of roads a player has placed.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Number of roads
 */
export function countRoads(state: GameState, playerId: string): number {
  return state.roads.filter(r => r.playerId === playerId).length;
}
