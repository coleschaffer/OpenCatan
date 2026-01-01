/**
 * Robber Manager Module
 *
 * This module handles all robber-related operations in OpenCatan:
 * - Getting valid robber placements
 * - Moving the robber
 * - Determining steal targets
 * - Stealing random cards from players
 *
 * Friendly Robber Rule: When enabled, the robber cannot be placed
 * on hexes where only players with less than 3 VP have buildings.
 *
 * All functions are pure and return new state objects without mutations.
 */

import {
  GameState,
  HexCoord,
  VertexCoord,
  Player,
  ResourceType,
  ResourceCounts,
  hexToKey,
  vertexToKey,
} from '../../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a steal action
 */
export interface StealResult {
  /** New game state after stealing */
  state: GameState;
  /** The resource that was stolen (null if victim had no resources) */
  stolenResource: ResourceType | null;
}

// ============================================================================
// VERTEX UTILITIES
// ============================================================================

/**
 * Gets all vertices adjacent to a hex tile.
 *
 * @param hex - The hex coordinate
 * @returns Array of vertex coordinates adjacent to this hex
 */
function getAdjacentVertices(hex: HexCoord): VertexCoord[] {
  const { q, r } = hex;

  return [
    // Top and bottom vertices of this hex
    { hex: { q, r }, direction: 'N' as const },
    { hex: { q, r }, direction: 'S' as const },
    // Top vertex of the hex below-left
    { hex: { q: q - 1, r: r + 1 }, direction: 'N' as const },
    // Top vertex of the hex below-right
    { hex: { q, r: r + 1 }, direction: 'N' as const },
    // Bottom vertex of the hex above-left
    { hex: { q, r: r - 1 }, direction: 'S' as const },
    // Bottom vertex of the hex above-right
    { hex: { q: q + 1, r: r - 1 }, direction: 'S' as const },
  ];
}

// ============================================================================
// VALID PLACEMENTS
// ============================================================================

/**
 * Gets all valid locations where the robber can be placed.
 *
 * Valid locations:
 * - Must be a land tile (not water)
 * - Must not be the current robber location
 * - If friendly robber is enabled, cannot be placed on hexes where only
 *   players with less than 3 VP have buildings
 *
 * @param state - Current game state
 * @param friendlyRobber - Whether the friendly robber rule is enabled
 * @returns Array of valid hex coordinates
 */
export function getValidRobberPlacements(
  state: GameState,
  friendlyRobber: boolean = false
): HexCoord[] {
  const validPlacements: HexCoord[] = [];

  for (const tile of state.tiles) {
    // Skip water tiles
    if (tile.terrain === 'water') continue;

    // Skip current robber location
    if (hexToKey(tile.coord) === hexToKey(state.robberLocation)) continue;

    // Skip fog tiles
    if (tile.isFog) continue;

    // Check friendly robber rule
    if (friendlyRobber) {
      const playersOnHex = getPlayersOnHex(state, tile.coord);

      // Skip if any player on this hex (besides the current player) has < 3 VP
      // and ALL players on this hex have < 3 VP
      const currentPlayerId = state.currentPlayerId;
      const otherPlayers = playersOnHex.filter(p => p.id !== currentPlayerId);

      if (otherPlayers.length > 0) {
        const allLowVP = otherPlayers.every(p => {
          const vp = calculateSimpleVP(state, p.id);
          return vp < 3;
        });

        if (allLowVP) continue;
      }
    }

    validPlacements.push(tile.coord);
  }

  return validPlacements;
}

/**
 * Gets all players who have buildings adjacent to a hex.
 *
 * @param state - Current game state
 * @param hex - The hex coordinate
 * @returns Array of players with buildings on this hex
 */
function getPlayersOnHex(state: GameState, hex: HexCoord): Player[] {
  const adjacentVertices = getAdjacentVertices(hex);
  const adjacentKeys = adjacentVertices.map(v => vertexToKey(v));

  const playerIds = new Set<string>();

  for (const building of state.buildings) {
    if (adjacentKeys.includes(vertexToKey(building.vertex))) {
      playerIds.add(building.playerId);
    }
  }

  return state.players.filter(p => playerIds.has(p.id));
}

/**
 * Calculates a simple VP count for friendly robber check.
 * Only counts settlements (1 VP) and cities (2 VP).
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Estimated victory points
 */
function calculateSimpleVP(state: GameState, playerId: string): number {
  let vp = 0;

  for (const building of state.buildings) {
    if (building.playerId === playerId) {
      vp += building.type === 'city' ? 2 : 1;
    }
  }

  return vp;
}

// ============================================================================
// ROBBER MOVEMENT
// ============================================================================

/**
 * Moves the robber to a new location.
 *
 * @param state - Current game state
 * @param newLocation - The hex to move the robber to
 * @returns New game state with robber at new location
 */
export function moveRobber(state: GameState, newLocation: HexCoord): GameState {
  // Update tiles to move robber
  const newTiles = state.tiles.map(tile => {
    if (hexToKey(tile.coord) === hexToKey(state.robberLocation)) {
      // Remove robber from old location
      return { ...tile, hasRobber: false };
    } else if (hexToKey(tile.coord) === hexToKey(newLocation)) {
      // Add robber to new location
      return { ...tile, hasRobber: true };
    }
    return tile;
  });

  return {
    ...state,
    tiles: newTiles,
    robberLocation: newLocation,
  };
}

// ============================================================================
// STEALING
// ============================================================================

/**
 * Gets all players who can be stolen from at the robber's current location.
 *
 * A player can be stolen from if:
 * - They have a building adjacent to the robber's hex
 * - They are not the player doing the stealing
 * - They have at least one resource card
 *
 * @param state - Current game state
 * @param hex - The hex where the robber is (or will be)
 * @param stealerId - ID of the player doing the stealing
 * @returns Array of player IDs who can be stolen from
 */
export function getStealTargets(
  state: GameState,
  hex: HexCoord,
  stealerId: string
): string[] {
  const adjacentVertices = getAdjacentVertices(hex);
  const adjacentKeys = adjacentVertices.map(v => vertexToKey(v));

  const targetIds = new Set<string>();

  for (const building of state.buildings) {
    if (adjacentKeys.includes(vertexToKey(building.vertex))) {
      // Can't steal from yourself
      if (building.playerId === stealerId) continue;

      // Check if player has resources
      const player = state.players.find(p => p.id === building.playerId);
      if (player && getTotalResources(player.resources) > 0) {
        targetIds.add(building.playerId);
      }
    }
  }

  return Array.from(targetIds);
}

/**
 * Gets the total number of resources a player has.
 */
function getTotalResources(resources: ResourceCounts): number {
  return (
    resources.brick +
    resources.lumber +
    resources.ore +
    resources.grain +
    resources.wool
  );
}

/**
 * Steals a random resource card from one player and gives it to another.
 *
 * Uses cryptographically secure randomness to select the resource.
 *
 * @param state - Current game state
 * @param fromPlayerId - ID of the player being stolen from
 * @param toPlayerId - ID of the player receiving the stolen card
 * @returns New game state with the card transferred
 */
export function stealCard(
  state: GameState,
  fromPlayerId: string,
  toPlayerId: string
): GameState {
  const victim = state.players.find(p => p.id === fromPlayerId);
  const thief = state.players.find(p => p.id === toPlayerId);

  if (!victim || !thief) {
    throw new Error('Player not found');
  }

  // Build array of resource cards the victim has
  const victimCards: ResourceType[] = [];
  const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];

  for (const resource of resourceTypes) {
    for (let i = 0; i < victim.resources[resource]; i++) {
      victimCards.push(resource);
    }
  }

  if (victimCards.length === 0) {
    // No cards to steal
    return state;
  }

  // Select a random card
  let randomIndex: number;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    randomIndex = randomArray[0] % victimCards.length;
  } else {
    randomIndex = Math.floor(Math.random() * victimCards.length);
  }

  const stolenResource = victimCards[randomIndex];

  // Transfer the resource
  const newPlayers = state.players.map(player => {
    if (player.id === fromPlayerId) {
      return {
        ...player,
        resources: {
          ...player.resources,
          [stolenResource]: player.resources[stolenResource] - 1,
        },
        timesWasRobbed: player.timesWasRobbed + 1,
      };
    } else if (player.id === toPlayerId) {
      return {
        ...player,
        resources: {
          ...player.resources,
          [stolenResource]: player.resources[stolenResource] + 1,
        },
        timesRobbed: player.timesRobbed + 1,
      };
    }
    return player;
  });

  return {
    ...state,
    players: newPlayers,
  };
}

/**
 * Checks if a hex has the robber on it.
 *
 * @param state - Current game state
 * @param hex - The hex to check
 * @returns True if the robber is on this hex
 */
export function hasRobber(state: GameState, hex: HexCoord): boolean {
  return hexToKey(state.robberLocation) === hexToKey(hex);
}

/**
 * Gets the hex where the robber is currently located.
 *
 * @param state - Current game state
 * @returns The robber's current hex coordinate
 */
export function getRobberLocation(state: GameState): HexCoord {
  return state.robberLocation;
}

// ============================================================================
// PIRATE (SEAFARERS)
// ============================================================================

/**
 * Gets all valid locations where the pirate can be placed (Seafarers expansion).
 *
 * Valid locations:
 * - Must be a water tile
 * - Must not be the current pirate location
 *
 * @param state - Current game state
 * @returns Array of valid hex coordinates
 */
export function getValidPiratePlacements(state: GameState): HexCoord[] {
  if (!state.pirateLocation) {
    return [];
  }

  const validPlacements: HexCoord[] = [];

  for (const tile of state.tiles) {
    // Must be water tile
    if (tile.terrain !== 'water') continue;

    // Skip current pirate location
    if (hexToKey(tile.coord) === hexToKey(state.pirateLocation)) continue;

    validPlacements.push(tile.coord);
  }

  return validPlacements;
}

/**
 * Moves the pirate to a new location (Seafarers expansion).
 *
 * @param state - Current game state
 * @param newLocation - The hex to move the pirate to
 * @returns New game state with pirate at new location
 */
export function movePirate(state: GameState, newLocation: HexCoord): GameState {
  if (!state.pirateLocation) {
    return state;
  }

  // Update tiles to move pirate
  const newTiles = state.tiles.map(tile => {
    if (hexToKey(tile.coord) === hexToKey(state.pirateLocation!)) {
      // Remove pirate from old location
      return { ...tile, hasPirate: false };
    } else if (hexToKey(tile.coord) === hexToKey(newLocation)) {
      // Add pirate to new location
      return { ...tile, hasPirate: true };
    }
    return tile;
  });

  return {
    ...state,
    tiles: newTiles,
    pirateLocation: newLocation,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getAdjacentVertices,
  getPlayersOnHex,
};
