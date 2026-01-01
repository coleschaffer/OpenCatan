/**
 * Resource Distribution Module
 *
 * This module handles all resource-related operations in OpenCatan:
 * - Distributing resources when dice are rolled
 * - Determining which tiles produce based on dice roll
 * - Managing the robber's effect on production
 * - Transferring resources between players and the bank
 *
 * All functions are pure and return new state objects without mutations.
 */

import {
  GameState,
  HexCoord,
  ResourceType,
  ResourceCounts,
  Player,
  hexKey,
  terrainToResource,
  createEmptyResources,
  VertexCoord,
  vertexKey,
} from '../../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents resources distributed to a single player from a dice roll.
 */
export interface ResourceDistribution {
  playerId: string;
  resources: Partial<ResourceCounts>;
}

/**
 * Result of a resource distribution operation.
 */
export interface DistributionResult {
  /** New game state after distribution */
  state: GameState;
  /** Resources distributed to each player */
  distributions: ResourceDistribution[];
  /** Whether bank ran out of any resources */
  bankShortages: Partial<ResourceCounts>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets all vertices adjacent to a hex tile.
 *
 * Each hex has 6 vertices, but we use a simplified representation where
 * each vertex is identified by one of its adjacent hexes and a direction (N or S).
 *
 * @param hex - The hex coordinate
 * @returns Array of vertex coordinates adjacent to this hex
 */
export function getAdjacentVertices(hex: HexCoord): VertexCoord[] {
  // In our coordinate system, each hex has 6 vertices
  // We identify them by the hex and direction N/S for the top and bottom vertices
  // The other 4 vertices are the N/S vertices of adjacent hexes

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

/**
 * Gets all unique vertex keys for the entire board.
 * This helps avoid counting the same vertex multiple times when
 * it's adjacent to multiple hexes.
 */
export function getAllVertexKeys(state: GameState): Set<string> {
  const vertices = new Set<string>();
  for (const tile of state.tiles) {
    for (const vertex of getAdjacentVertices(tile.coord)) {
      vertices.add(vertexKey(vertex));
    }
  }
  return vertices;
}

/**
 * Adds resources to a player's resource counts.
 *
 * @param current - Current resource counts
 * @param toAdd - Resources to add
 * @returns New resource counts with added resources
 */
export function addResources(
  current: ResourceCounts,
  toAdd: Partial<ResourceCounts>
): ResourceCounts {
  return {
    brick: current.brick + (toAdd.brick || 0),
    lumber: current.lumber + (toAdd.lumber || 0),
    ore: current.ore + (toAdd.ore || 0),
    grain: current.grain + (toAdd.grain || 0),
    wool: current.wool + (toAdd.wool || 0),
  };
}

/**
 * Subtracts resources from a player's resource counts.
 * Does NOT validate if player has enough - use validation module for that.
 *
 * @param current - Current resource counts
 * @param toRemove - Resources to remove
 * @returns New resource counts with removed resources
 */
export function subtractResources(
  current: ResourceCounts,
  toRemove: Partial<ResourceCounts>
): ResourceCounts {
  return {
    brick: current.brick - (toRemove.brick || 0),
    lumber: current.lumber - (toRemove.lumber || 0),
    ore: current.ore - (toRemove.ore || 0),
    grain: current.grain - (toRemove.grain || 0),
    wool: current.wool - (toRemove.wool || 0),
  };
}

/**
 * Checks if a player has at least the specified resources.
 *
 * @param current - Current resource counts
 * @param required - Required resources
 * @returns True if player has enough of each resource
 */
export function hasResources(
  current: ResourceCounts,
  required: Partial<ResourceCounts>
): boolean {
  return (
    current.brick >= (required.brick || 0) &&
    current.lumber >= (required.lumber || 0) &&
    current.ore >= (required.ore || 0) &&
    current.grain >= (required.grain || 0) &&
    current.wool >= (required.wool || 0)
  );
}

/**
 * Counts total number of resources a player has.
 *
 * @param resources - Resource counts
 * @returns Total number of resource cards
 */
export function countTotalResources(resources: ResourceCounts): number {
  return (
    resources.brick +
    resources.lumber +
    resources.ore +
    resources.grain +
    resources.wool
  );
}

// ============================================================================
// PRODUCTION FUNCTIONS
// ============================================================================

/**
 * Gets all tiles that produce resources for a given dice roll.
 * Excludes tiles with the robber and tiles that don't produce (desert, water).
 *
 * @param state - Current game state
 * @param roll - Dice roll value (2-12)
 * @returns Array of tiles that produce on this roll
 */
export function getProductionForRoll(
  state: GameState,
  roll: number
): { tile: typeof state.tiles[0]; resource: ResourceType }[] {
  const producingTiles: { tile: typeof state.tiles[0]; resource: ResourceType }[] = [];

  for (const tile of state.tiles) {
    // Skip if tile doesn't have this number
    if (tile.number !== roll) continue;

    // Skip if robber is on this tile
    if (tile.hasRobber) continue;

    // Get the resource type for this terrain
    const resource = terrainToResource[tile.terrain];
    if (!resource) continue; // Desert, water, etc. don't produce

    producingTiles.push({ tile, resource });
  }

  return producingTiles;
}

/**
 * Calculates how many resources each player should receive from a dice roll.
 * Takes into account:
 * - Settlements (1 resource each)
 * - Cities (2 resources each)
 * - Robber blocking production
 *
 * @param state - Current game state
 * @param roll - Dice roll value (2-12)
 * @returns Map of player IDs to their resource distributions
 */
export function calculateDistribution(
  state: GameState,
  roll: number
): Map<string, Partial<ResourceCounts>> {
  const distributions = new Map<string, Partial<ResourceCounts>>();

  // Initialize distributions for all players
  for (const player of state.players) {
    distributions.set(player.id, {});
  }

  // Get all producing tiles for this roll
  const producingTiles = getProductionForRoll(state, roll);

  // For each producing tile, find adjacent settlements and cities
  for (const { tile, resource } of producingTiles) {
    const adjacentVertices = getAdjacentVertices(tile.coord);

    for (const vertex of adjacentVertices) {
      const vKey = vertexKey(vertex);

      // Find building at this vertex
      const building = state.buildings.find(
        (b) => vertexKey(b.vertex) === vKey
      );

      if (building) {
        // Get current distribution for this player
        const playerDist = distributions.get(building.playerId) || {};

        // Add resources based on building type
        const amount = building.type === 'city' ? 2 : 1;
        playerDist[resource] = (playerDist[resource] || 0) + amount;

        distributions.set(building.playerId, playerDist);
      }
    }
  }

  return distributions;
}

/**
 * Distributes resources to all players based on a dice roll.
 * Handles bank shortages by distributing proportionally or not at all
 * depending on the resource type and game rules.
 *
 * When the bank doesn't have enough of a resource:
 * - If only ONE player would receive that resource, they get what's available
 * - If MULTIPLE players would receive it, nobody gets any (Catan rules)
 *
 * @param state - Current game state
 * @param roll - Dice roll value (2-12)
 * @returns Distribution result with new state and distribution details
 */
export function distributeResources(
  state: GameState,
  roll: number
): DistributionResult {
  const distributions = calculateDistribution(state, roll);
  const bankShortages: Partial<ResourceCounts> = {};
  const finalDistributions: ResourceDistribution[] = [];

  // Track what we'll actually distribute
  const actualDistributions = new Map<string, Partial<ResourceCounts>>();

  // Initialize with empty distributions
  for (const player of state.players) {
    actualDistributions.set(player.id, {});
  }

  // For each resource type, check if bank has enough
  const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];

  for (const resource of resourceTypes) {
    // Calculate total needed for this resource
    let totalNeeded = 0;
    const playersReceiving: { playerId: string; amount: number }[] = [];

    for (const [playerId, dist] of distributions) {
      const amount = dist[resource] || 0;
      if (amount > 0) {
        totalNeeded += amount;
        playersReceiving.push({ playerId, amount });
      }
    }

    // Check if bank has enough
    if (totalNeeded <= state.bank[resource]) {
      // Bank has enough - distribute normally
      for (const { playerId, amount } of playersReceiving) {
        const playerDist = actualDistributions.get(playerId)!;
        playerDist[resource] = amount;
      }
    } else if (playersReceiving.length === 1) {
      // Only one player - they get what's available
      const { playerId } = playersReceiving[0];
      const available = state.bank[resource];
      if (available > 0) {
        const playerDist = actualDistributions.get(playerId)!;
        playerDist[resource] = available;
      }
      bankShortages[resource] = totalNeeded - available;
    } else if (playersReceiving.length > 1) {
      // Multiple players - nobody gets any (Catan shortage rule)
      bankShortages[resource] = totalNeeded;
    }
  }

  // Apply distributions to create new state
  let newBank = { ...state.bank };
  const newPlayers = state.players.map((player) => {
    const dist = actualDistributions.get(player.id)!;
    const hasAnyResources = Object.values(dist).some((v) => v && v > 0);

    if (hasAnyResources) {
      finalDistributions.push({
        playerId: player.id,
        resources: dist,
      });

      // Subtract from bank
      for (const resource of resourceTypes) {
        const amount = dist[resource] || 0;
        newBank[resource] -= amount;
      }

      // Add to player
      return {
        ...player,
        resources: addResources(player.resources, dist),
      };
    }

    return player;
  });

  const newState: GameState = {
    ...state,
    players: newPlayers,
    bank: newBank,
  };

  return {
    state: newState,
    distributions: finalDistributions,
    bankShortages,
  };
}

// ============================================================================
// ROBBER FUNCTIONS
// ============================================================================

/**
 * Applies the robber to a hex, blocking its production.
 * This is used when the robber is moved (on 7 or knight).
 *
 * @param state - Current game state
 * @param hex - Hex coordinate to place robber
 * @returns New game state with robber at new location
 */
export function applyRobber(state: GameState, hex: HexCoord): GameState {
  // Update tiles to move robber
  const newTiles = state.tiles.map((tile) => {
    if (hexKey(tile.coord) === hexKey(state.robberLocation)) {
      // Remove robber from old location
      return { ...tile, hasRobber: false };
    } else if (hexKey(tile.coord) === hexKey(hex)) {
      // Add robber to new location
      return { ...tile, hasRobber: true };
    }
    return tile;
  });

  return {
    ...state,
    tiles: newTiles,
    robberLocation: hex,
  };
}

// ============================================================================
// TRANSFER FUNCTIONS
// ============================================================================

/**
 * Transfers resources from one player to another.
 * Used for trades, robber steals, etc.
 * Does NOT validate if source has enough resources.
 *
 * @param state - Current game state
 * @param fromPlayerId - ID of player giving resources
 * @param toPlayerId - ID of player receiving resources
 * @param resources - Resources to transfer
 * @returns New game state after transfer
 */
export function transferResources(
  state: GameState,
  fromPlayerId: string,
  toPlayerId: string,
  resources: Partial<ResourceCounts>
): GameState {
  const newPlayers = state.players.map((player) => {
    if (player.id === fromPlayerId) {
      return {
        ...player,
        resources: subtractResources(player.resources, resources),
      };
    } else if (player.id === toPlayerId) {
      return {
        ...player,
        resources: addResources(player.resources, resources),
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
 * Transfers resources from a player to the bank.
 * Used for building costs, discarding, etc.
 *
 * @param state - Current game state
 * @param playerId - ID of player paying resources
 * @param resources - Resources to pay
 * @returns New game state after payment
 */
export function payToBank(
  state: GameState,
  playerId: string,
  resources: Partial<ResourceCounts>
): GameState {
  const newPlayers = state.players.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        resources: subtractResources(player.resources, resources),
      };
    }
    return player;
  });

  const newBank: ResourceCounts = {
    brick: state.bank.brick + (resources.brick || 0),
    lumber: state.bank.lumber + (resources.lumber || 0),
    ore: state.bank.ore + (resources.ore || 0),
    grain: state.bank.grain + (resources.grain || 0),
    wool: state.bank.wool + (resources.wool || 0),
  };

  return {
    ...state,
    players: newPlayers,
    bank: newBank,
  };
}

/**
 * Transfers resources from the bank to a player.
 * Used for Year of Plenty, gold tiles, etc.
 *
 * @param state - Current game state
 * @param playerId - ID of player receiving resources
 * @param resources - Resources to give
 * @returns New game state after giving resources
 */
export function takeFromBank(
  state: GameState,
  playerId: string,
  resources: Partial<ResourceCounts>
): GameState {
  const newPlayers = state.players.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        resources: addResources(player.resources, resources),
      };
    }
    return player;
  });

  const newBank: ResourceCounts = {
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

/**
 * Gives starting resources to a player based on their second settlement placement.
 * Each terrain type adjacent to the settlement gives one resource.
 *
 * @param state - Current game state
 * @param playerId - ID of player receiving resources
 * @param settlementVertex - Location of the second settlement
 * @returns New game state with starting resources distributed
 */
export function giveStartingResources(
  state: GameState,
  playerId: string,
  settlementVertex: VertexCoord
): GameState {
  // Find all hexes adjacent to this vertex
  const adjacentHexes = getHexesAdjacentToVertex(settlementVertex);
  const resources: Partial<ResourceCounts> = {};

  for (const hexCoord of adjacentHexes) {
    // Find the tile at this hex
    const tile = state.tiles.find(
      (t) => hexKey(t.coord) === hexKey(hexCoord)
    );

    if (tile) {
      const resource = terrainToResource[tile.terrain];
      if (resource && state.bank[resource] > 0) {
        resources[resource] = (resources[resource] || 0) + 1;
      }
    }
  }

  return takeFromBank(state, playerId, resources);
}

/**
 * Gets all hexes adjacent to a vertex.
 * Each vertex is adjacent to 3 hexes.
 *
 * @param vertex - The vertex coordinate
 * @returns Array of hex coordinates adjacent to this vertex
 */
export function getHexesAdjacentToVertex(vertex: VertexCoord): HexCoord[] {
  const { q, r } = vertex.hex;

  if (vertex.direction === 'N') {
    // North vertex is adjacent to:
    // - This hex
    // - Hex to the upper-left (q-1, r)
    // - Hex to the upper-right (q, r-1)
    return [
      { q, r },
      { q: q - 1, r },
      { q, r: r - 1 },
    ];
  } else {
    // South vertex is adjacent to:
    // - This hex
    // - Hex to the lower-left (q-1, r+1)
    // - Hex to the lower-right (q, r+1)
    return [
      { q, r },
      { q: q - 1, r: r + 1 },
      { q, r: r + 1 },
    ];
  }
}

/**
 * Executes a bank trade for a player.
 * The player gives resources at the applicable rate (4:1, 3:1, or 2:1)
 * and receives one resource of their choice.
 *
 * @param state - Current game state
 * @param playerId - ID of player making the trade
 * @param giveResource - Resource type to give
 * @param giveAmount - Amount to give (must match their trade rate)
 * @param receiveResource - Resource type to receive
 * @returns New game state after the trade
 */
export function executeBankTrade(
  state: GameState,
  playerId: string,
  giveResource: ResourceType,
  giveAmount: number,
  receiveResource: ResourceType
): GameState {
  // Give resources to bank
  const afterPaying = payToBank(state, playerId, { [giveResource]: giveAmount });

  // Take resource from bank
  return takeFromBank(afterPaying, playerId, { [receiveResource]: 1 });
}

/**
 * Gets the best trade rate a player has for a specific resource.
 * Checks ports and returns 4 (default), 3 (generic port), or 2 (resource port).
 *
 * @param state - Current game state
 * @param playerId - ID of player to check
 * @param resource - Resource type to check rate for
 * @returns Best trade rate (2, 3, or 4)
 */
export function getTradeRate(
  state: GameState,
  playerId: string,
  resource: ResourceType
): 2 | 3 | 4 {
  // Find all vertices the player has buildings on
  const playerBuildings = state.buildings.filter(
    (b) => b.playerId === playerId
  );
  const playerVertices = new Set(
    playerBuildings.map((b) => vertexKey(b.vertex))
  );

  let bestRate: 2 | 3 | 4 = 4;

  // Check each port
  for (const port of state.ports) {
    // Check if player has a building at any of the port's vertices
    const hasAccess = port.vertices.some((v) =>
      playerVertices.has(vertexKey(v))
    );

    if (hasAccess) {
      if (port.type === resource && port.ratio === 2) {
        // Resource-specific 2:1 port - best possible
        return 2;
      } else if (port.type === 'generic' && port.ratio === 3 && bestRate > 3) {
        // Generic 3:1 port
        bestRate = 3;
      }
    }
  }

  return bestRate;
}
