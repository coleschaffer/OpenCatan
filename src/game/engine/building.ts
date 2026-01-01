/**
 * Building Placement Module
 *
 * This module handles all building-related operations in OpenCatan:
 * - Placing settlements during setup and normal play
 * - Upgrading settlements to cities
 * - Placing roads and ships
 * - Determining valid placement locations
 *
 * All functions are pure and return new state objects without mutations.
 */

import {
  GameState,
  VertexCoord,
  EdgeCoord,
  Building,
  Road,
  Player,
  vertexKey,
  edgeKey,
  hexKey,
  HexCoord,
  BUILDING_COSTS,
} from '../../types';
import {
  payToBank,
  subtractResources,
  getAdjacentVertices,
} from './resources';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a building placement operation.
 */
export interface PlacementResult {
  /** Whether the placement was successful */
  success: boolean;
  /** New game state after placement */
  state?: GameState;
  /** Error message if placement failed */
  error?: string;
}

// ============================================================================
// COORDINATE UTILITIES
// ============================================================================

/**
 * Gets all edges adjacent to a vertex.
 * Each vertex connects to 3 edges.
 *
 * @param vertex - The vertex coordinate
 * @returns Array of edge coordinates adjacent to this vertex
 */
export function getEdgesAdjacentToVertex(vertex: VertexCoord): EdgeCoord[] {
  const { q, r } = vertex.hex;

  if (vertex.direction === 'N') {
    // North vertex connects to:
    // - NE edge of this hex
    // - E edge of hex to upper-left (q-1, r)
    // - SE edge of hex above (q, r-1) - which equals E edge of (q-1, r)
    return [
      { hex: { q, r }, direction: 'NE' as const },
      { hex: { q: q - 1, r }, direction: 'E' as const },
      { hex: { q, r: r - 1 }, direction: 'SE' as const },
    ];
  } else {
    // South vertex connects to:
    // - SE edge of this hex
    // - E edge of this hex
    // - NE edge of hex below (q, r+1)
    return [
      { hex: { q, r }, direction: 'SE' as const },
      { hex: { q, r }, direction: 'E' as const },
      { hex: { q, r: r + 1 }, direction: 'NE' as const },
    ];
  }
}

/**
 * Gets the two vertices at the ends of an edge.
 *
 * @param edge - The edge coordinate
 * @returns Array of two vertex coordinates
 */
export function getVerticesOfEdge(edge: EdgeCoord): [VertexCoord, VertexCoord] {
  const { q, r } = edge.hex;

  switch (edge.direction) {
    case 'NE':
      // NE edge connects N vertex of this hex to S vertex of (q+1, r-1)
      return [
        { hex: { q, r }, direction: 'N' as const },
        { hex: { q: q + 1, r: r - 1 }, direction: 'S' as const },
      ];
    case 'E':
      // E edge connects S vertex of (q+1, r-1) to N vertex of (q+1, r)
      return [
        { hex: { q: q + 1, r: r - 1 }, direction: 'S' as const },
        { hex: { q: q + 1, r }, direction: 'N' as const },
      ];
    case 'SE':
      // SE edge connects S vertex of this hex to N vertex of (q+1, r)
      return [
        { hex: { q, r }, direction: 'S' as const },
        { hex: { q: q + 1, r }, direction: 'N' as const },
      ];
  }
}

/**
 * Gets all vertices adjacent to a given vertex (distance rule check).
 * Each vertex has 2-3 adjacent vertices that must remain empty.
 *
 * @param vertex - The vertex coordinate
 * @returns Array of adjacent vertex coordinates
 */
export function getAdjacentVerticesFromVertex(vertex: VertexCoord): VertexCoord[] {
  // Get all edges connected to this vertex
  const edges = getEdgesAdjacentToVertex(vertex);

  // For each edge, get the other vertex
  const adjacentVertices: VertexCoord[] = [];
  const thisKey = vertexKey(vertex);

  for (const edge of edges) {
    const [v1, v2] = getVerticesOfEdge(edge);
    if (vertexKey(v1) !== thisKey) {
      adjacentVertices.push(v1);
    } else if (vertexKey(v2) !== thisKey) {
      adjacentVertices.push(v2);
    }
  }

  return adjacentVertices;
}

/**
 * Gets all edges adjacent to an edge (sharing a vertex).
 *
 * @param edge - The edge coordinate
 * @returns Array of adjacent edge coordinates
 */
export function getAdjacentEdges(edge: EdgeCoord): EdgeCoord[] {
  const [v1, v2] = getVerticesOfEdge(edge);

  // Get all edges connected to both vertices
  const edges1 = getEdgesAdjacentToVertex(v1);
  const edges2 = getEdgesAdjacentToVertex(v2);

  const thisKey = edgeKey(edge);
  const adjacentEdges: EdgeCoord[] = [];

  // Add edges from v1, excluding this edge
  for (const e of edges1) {
    if (edgeKey(e) !== thisKey) {
      adjacentEdges.push(e);
    }
  }

  // Add edges from v2, excluding this edge
  for (const e of edges2) {
    if (edgeKey(e) !== thisKey) {
      adjacentEdges.push(e);
    }
  }

  return adjacentEdges;
}

/**
 * Normalizes a vertex coordinate to a canonical form.
 * Since the same vertex can be represented multiple ways (from different hexes),
 * we need a way to normalize them for comparison.
 *
 * The canonical form always uses the hex with the smallest (q, r) when sorted
 * lexicographically.
 *
 * @param vertex - The vertex to normalize
 * @returns Normalized vertex coordinate
 */
export function normalizeVertex(vertex: VertexCoord): VertexCoord {
  // For now, we use a simple approach: vertices are identified by
  // the hex and direction they were created with.
  // A more sophisticated normalization would map equivalent vertices.
  return vertex;
}

/**
 * Normalizes an edge coordinate to a canonical form.
 *
 * @param edge - The edge to normalize
 * @returns Normalized edge coordinate
 */
export function normalizeEdge(edge: EdgeCoord): EdgeCoord {
  return edge;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Checks if a vertex is on land (adjacent to at least one non-water hex).
 *
 * @param state - Current game state
 * @param vertex - Vertex to check
 * @returns True if vertex is on land
 */
export function isVertexOnLand(state: GameState, vertex: VertexCoord): boolean {
  // Get hexes adjacent to this vertex and check if any are land
  const adjacentHexes = getHexesAdjacentToVertexFromBuilding(vertex);

  for (const hexCoord of adjacentHexes) {
    const tile = state.tiles.find((t) => hexKey(t.coord) === hexKey(hexCoord));
    if (tile && tile.terrain !== 'water') {
      return true;
    }
  }

  return false;
}

/**
 * Gets all hexes adjacent to a vertex (for building placement).
 *
 * @param vertex - The vertex coordinate
 * @returns Array of hex coordinates
 */
function getHexesAdjacentToVertexFromBuilding(vertex: VertexCoord): HexCoord[] {
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
 * Checks if an edge is on land (at least one adjacent hex is land).
 *
 * @param state - Current game state
 * @param edge - Edge to check
 * @returns True if edge is on land
 */
export function isEdgeOnLand(state: GameState, edge: EdgeCoord): boolean {
  const [v1, v2] = getVerticesOfEdge(edge);
  return isVertexOnLand(state, v1) || isVertexOnLand(state, v2);
}

/**
 * Checks if a vertex satisfies the distance rule (no adjacent buildings).
 *
 * @param state - Current game state
 * @param vertex - Vertex to check
 * @returns True if no buildings on adjacent vertices
 */
export function satisfiesDistanceRule(
  state: GameState,
  vertex: VertexCoord
): boolean {
  const adjacentVertices = getAdjacentVerticesFromVertex(vertex);

  for (const adjVertex of adjacentVertices) {
    const adjKey = vertexKey(adjVertex);
    const hasBuilding = state.buildings.some(
      (b) => vertexKey(b.vertex) === adjKey
    );
    if (hasBuilding) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a vertex already has a building.
 *
 * @param state - Current game state
 * @param vertex - Vertex to check
 * @returns The building at this vertex, or undefined
 */
export function getBuildingAtVertex(
  state: GameState,
  vertex: VertexCoord
): Building | undefined {
  const vKey = vertexKey(vertex);
  return state.buildings.find((b) => vertexKey(b.vertex) === vKey);
}

/**
 * Checks if an edge already has a road.
 *
 * @param state - Current game state
 * @param edge - Edge to check
 * @returns The road at this edge, or undefined
 */
export function getRoadAtEdge(
  state: GameState,
  edge: EdgeCoord
): Road | undefined {
  const eKey = edgeKey(edge);
  return state.roads.find((r) => edgeKey(r.edge) === eKey);
}

/**
 * Checks if a player has a road or building connected to an edge.
 *
 * @param state - Current game state
 * @param playerId - Player ID to check
 * @param edge - Edge to check connection for
 * @returns True if player has a connected road or building
 */
export function hasConnectionToEdge(
  state: GameState,
  playerId: string,
  edge: EdgeCoord
): boolean {
  const [v1, v2] = getVerticesOfEdge(edge);

  // Check if player has a building at either vertex
  const v1Key = vertexKey(v1);
  const v2Key = vertexKey(v2);

  const hasBuilding = state.buildings.some(
    (b) =>
      b.playerId === playerId &&
      (vertexKey(b.vertex) === v1Key || vertexKey(b.vertex) === v2Key)
  );

  if (hasBuilding) {
    return true;
  }

  // Check if player has a road connected to either vertex
  const adjacentEdges = getAdjacentEdges(edge);

  for (const adjEdge of adjacentEdges) {
    const adjKey = edgeKey(adjEdge);
    const hasRoad = state.roads.some(
      (r) => r.playerId === playerId && edgeKey(r.edge) === adjKey
    );

    if (hasRoad) {
      // Make sure the connection isn't blocked by another player's settlement
      // at the shared vertex
      const [adjV1, adjV2] = getVerticesOfEdge(adjEdge);
      const sharedVertex =
        vertexKey(adjV1) === v1Key || vertexKey(adjV1) === v2Key
          ? adjV1
          : adjV2;
      const sharedKey = vertexKey(sharedVertex);

      const blockingBuilding = state.buildings.find(
        (b) => b.playerId !== playerId && vertexKey(b.vertex) === sharedKey
      );

      if (!blockingBuilding) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if a player has a road connected to a vertex.
 *
 * @param state - Current game state
 * @param playerId - Player ID to check
 * @param vertex - Vertex to check connection for
 * @returns True if player has a road connected to this vertex
 */
export function hasRoadToVertex(
  state: GameState,
  playerId: string,
  vertex: VertexCoord
): boolean {
  const edges = getEdgesAdjacentToVertex(vertex);

  for (const edge of edges) {
    const eKey = edgeKey(edge);
    const hasRoad = state.roads.some(
      (r) => r.playerId === playerId && edgeKey(r.edge) === eKey
    );

    if (hasRoad) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// VALID PLACEMENT FUNCTIONS
// ============================================================================

/**
 * Gets all valid vertices where a player can place a settlement during setup.
 * During setup, settlements don't need to be connected to roads.
 *
 * @param state - Current game state
 * @returns Array of valid vertex coordinates
 */
export function getValidSetupSettlementSpots(
  state: GameState
): VertexCoord[] {
  const validSpots: VertexCoord[] = [];
  const checkedVertices = new Set<string>();

  // Check all vertices adjacent to all tiles
  for (const tile of state.tiles) {
    const vertices = getAdjacentVertices(tile.coord);

    for (const vertex of vertices) {
      const vKey = vertexKey(vertex);

      // Skip if already checked
      if (checkedVertices.has(vKey)) continue;
      checkedVertices.add(vKey);

      // Must be on land
      if (!isVertexOnLand(state, vertex)) continue;

      // Must not have a building
      if (getBuildingAtVertex(state, vertex)) continue;

      // Must satisfy distance rule
      if (!satisfiesDistanceRule(state, vertex)) continue;

      validSpots.push(vertex);
    }
  }

  return validSpots;
}

/**
 * Gets all valid vertices where a player can place a settlement during normal play.
 * Settlements must be connected to the player's roads during normal play.
 *
 * @param state - Current game state
 * @param playerId - ID of the player placing the settlement
 * @returns Array of valid vertex coordinates
 */
export function getValidSettlementSpots(
  state: GameState,
  playerId: string
): VertexCoord[] {
  const validSpots: VertexCoord[] = [];
  const checkedVertices = new Set<string>();

  // Check all vertices adjacent to all tiles
  for (const tile of state.tiles) {
    const vertices = getAdjacentVertices(tile.coord);

    for (const vertex of vertices) {
      const vKey = vertexKey(vertex);

      // Skip if already checked
      if (checkedVertices.has(vKey)) continue;
      checkedVertices.add(vKey);

      // Must be on land
      if (!isVertexOnLand(state, vertex)) continue;

      // Must not have a building
      if (getBuildingAtVertex(state, vertex)) continue;

      // Must satisfy distance rule
      if (!satisfiesDistanceRule(state, vertex)) continue;

      // Must be connected to player's road network
      if (!hasRoadToVertex(state, playerId, vertex)) continue;

      validSpots.push(vertex);
    }
  }

  return validSpots;
}

/**
 * Gets all valid edges where a player can place a road.
 *
 * @param state - Current game state
 * @param playerId - ID of the player placing the road
 * @returns Array of valid edge coordinates
 */
export function getValidRoadSpots(
  state: GameState,
  playerId: string
): EdgeCoord[] {
  const validSpots: EdgeCoord[] = [];
  const checkedEdges = new Set<string>();

  // Get all player's buildings and roads to find connection points
  const playerBuildings = state.buildings.filter((b) => b.playerId === playerId);
  const playerRoads = state.roads.filter((r) => r.playerId === playerId);

  // From each building, check adjacent edges
  for (const building of playerBuildings) {
    const edges = getEdgesAdjacentToVertex(building.vertex);

    for (const edge of edges) {
      const eKey = edgeKey(edge);
      if (checkedEdges.has(eKey)) continue;
      checkedEdges.add(eKey);

      // Must be on land
      if (!isEdgeOnLand(state, edge)) continue;

      // Must not have a road
      if (getRoadAtEdge(state, edge)) continue;

      validSpots.push(edge);
    }
  }

  // From each road, check adjacent edges (following connections)
  for (const road of playerRoads) {
    const adjacentEdges = getAdjacentEdges(road.edge);

    for (const edge of adjacentEdges) {
      const eKey = edgeKey(edge);
      if (checkedEdges.has(eKey)) continue;
      checkedEdges.add(eKey);

      // Must be on land
      if (!isEdgeOnLand(state, edge)) continue;

      // Must not have a road
      if (getRoadAtEdge(state, edge)) continue;

      // Check if connection is valid (not blocked by opponent's settlement)
      if (!hasConnectionToEdge(state, playerId, edge)) continue;

      validSpots.push(edge);
    }
  }

  return validSpots;
}

/**
 * Gets all valid edges where a player can place a road during setup.
 * During setup, roads must connect to the just-placed settlement.
 *
 * @param state - Current game state
 * @param settlementVertex - Vertex where the settlement was just placed
 * @returns Array of valid edge coordinates
 */
export function getValidSetupRoadSpots(
  state: GameState,
  settlementVertex: VertexCoord
): EdgeCoord[] {
  const validSpots: EdgeCoord[] = [];
  const edges = getEdgesAdjacentToVertex(settlementVertex);

  for (const edge of edges) {
    // Must be on land
    if (!isEdgeOnLand(state, edge)) continue;

    // Must not have a road
    if (getRoadAtEdge(state, edge)) continue;

    validSpots.push(edge);
  }

  return validSpots;
}

/**
 * Gets all valid vertices where a player can upgrade a settlement to a city.
 *
 * @param state - Current game state
 * @param playerId - ID of the player upgrading
 * @returns Array of valid vertex coordinates (with player's settlements)
 */
export function getValidCitySpots(
  state: GameState,
  playerId: string
): VertexCoord[] {
  return state.buildings
    .filter((b) => b.playerId === playerId && b.type === 'settlement')
    .map((b) => b.vertex);
}

// ============================================================================
// PLACEMENT FUNCTIONS
// ============================================================================

/**
 * Places a settlement for a player.
 * Does NOT validate resources or placement - use validation module.
 * During setup, set isSetup=true to skip resource deduction.
 *
 * @param state - Current game state
 * @param playerId - ID of the player placing
 * @param vertex - Vertex to place settlement
 * @param isSetup - Whether this is a setup placement (no resources deducted)
 * @returns New game state with the settlement placed
 */
export function placeSettlement(
  state: GameState,
  playerId: string,
  vertex: VertexCoord,
  isSetup: boolean = false
): GameState {
  // Create new building
  const building: Building = {
    type: 'settlement',
    playerId,
    vertex,
  };

  // Update player's remaining pieces
  const newPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;

    let newResources = player.resources;
    if (!isSetup) {
      // Deduct resources during normal play
      newResources = subtractResources(player.resources, BUILDING_COSTS.settlement);
    }

    return {
      ...player,
      resources: newResources,
      settlementsRemaining: player.settlementsRemaining - 1,
    };
  });

  // Add to bank if not setup
  let newBank = state.bank;
  if (!isSetup) {
    newBank = {
      brick: state.bank.brick + 1,
      lumber: state.bank.lumber + 1,
      grain: state.bank.grain + 1,
      wool: state.bank.wool + 1,
      ore: state.bank.ore,
    };
  }

  return {
    ...state,
    buildings: [...state.buildings, building],
    players: newPlayers,
    bank: newBank,
  };
}

/**
 * Upgrades a settlement to a city.
 * Does NOT validate resources or ownership - use validation module.
 *
 * @param state - Current game state
 * @param playerId - ID of the player upgrading
 * @param vertex - Vertex of the settlement to upgrade
 * @returns New game state with the city in place
 */
export function upgradeToCity(
  state: GameState,
  playerId: string,
  vertex: VertexCoord
): GameState {
  const vKey = vertexKey(vertex);

  // Update the building
  const newBuildings = state.buildings.map((building) => {
    if (vertexKey(building.vertex) === vKey && building.playerId === playerId) {
      return {
        ...building,
        type: 'city' as const,
      };
    }
    return building;
  });

  // Update player's pieces and resources
  const newPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;

    return {
      ...player,
      resources: subtractResources(player.resources, BUILDING_COSTS.city),
      settlementsRemaining: player.settlementsRemaining + 1, // Get settlement back
      citiesRemaining: player.citiesRemaining - 1,
    };
  });

  // Add resources to bank
  const newBank = {
    ...state.bank,
    ore: state.bank.ore + 3,
    grain: state.bank.grain + 2,
  };

  return {
    ...state,
    buildings: newBuildings,
    players: newPlayers,
    bank: newBank,
  };
}

/**
 * Places a road for a player.
 * Does NOT validate resources or placement - use validation module.
 *
 * @param state - Current game state
 * @param playerId - ID of the player placing
 * @param edge - Edge to place road
 * @param isFree - Whether this is a free placement (Road Building card, setup)
 * @returns New game state with the road placed
 */
export function placeRoad(
  state: GameState,
  playerId: string,
  edge: EdgeCoord,
  isFree: boolean = false
): GameState {
  // Create new road
  const road: Road = {
    type: 'road',
    playerId,
    edge,
  };

  // Update player's remaining pieces and resources
  const newPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;

    let newResources = player.resources;
    if (!isFree) {
      newResources = subtractResources(player.resources, BUILDING_COSTS.road);
    }

    return {
      ...player,
      resources: newResources,
      roadsRemaining: player.roadsRemaining - 1,
    };
  });

  // Add to bank if not free
  let newBank = state.bank;
  if (!isFree) {
    newBank = {
      ...state.bank,
      brick: state.bank.brick + 1,
      lumber: state.bank.lumber + 1,
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
 * Places a ship for a player (Seafarers).
 * Does NOT validate resources or placement - use validation module.
 *
 * @param state - Current game state
 * @param playerId - ID of the player placing
 * @param edge - Edge to place ship
 * @param isFree - Whether this is a free placement (Road Building card)
 * @returns New game state with the ship placed
 */
export function placeShip(
  state: GameState,
  playerId: string,
  edge: EdgeCoord,
  isFree: boolean = false
): GameState {
  // Create new ship
  const ship: Road = {
    type: 'ship',
    playerId,
    edge,
  };

  // Update player's remaining pieces and resources
  const newPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;

    let newResources = player.resources;
    if (!isFree) {
      newResources = subtractResources(player.resources, BUILDING_COSTS.ship);
    }

    return {
      ...player,
      resources: newResources,
      shipsRemaining: (player.shipsRemaining || 0) - 1,
    };
  });

  // Add to bank if not free
  let newBank = state.bank;
  if (!isFree) {
    newBank = {
      ...state.bank,
      lumber: state.bank.lumber + 1,
      wool: state.bank.wool + 1,
    };
  }

  return {
    ...state,
    roads: [...state.roads, ship],
    players: newPlayers,
    bank: newBank,
  };
}
