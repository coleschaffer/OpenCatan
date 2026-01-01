/**
 * Dice Roller Module
 *
 * This module handles dice rolling and resource production lookup:
 * - Rolling two dice using cryptographically secure randomness
 * - Determining which tiles produce resources for a given roll
 * - Calculating resources each player receives from a roll
 *
 * All functions are pure and return new values without mutations.
 */

import {
  GameState,
  HexTile,
  ResourceType,
  ResourceCounts,
  DiceRoll,
  VertexCoord,
  vertexToKey,
  TERRAIN_RESOURCE_MAP,
} from '../../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a dice roll
 */
export interface DiceRollResult {
  /** Value of the first die (1-6) */
  die1: number;
  /** Value of the second die (1-6) */
  die2: number;
  /** Sum of both dice (2-12) */
  total: number;
}

/**
 * Resources produced for a specific player from a dice roll
 */
export interface PlayerProduction {
  playerId: string;
  resources: Partial<ResourceCounts>;
}

// ============================================================================
// DICE ROLLING
// ============================================================================

/**
 * Rolls two dice using cryptographically secure random numbers.
 *
 * Uses Web Crypto API when available for true randomness,
 * falls back to Math.random() otherwise.
 *
 * @returns Dice roll result with individual die values and total
 */
export function rollDice(): DiceRollResult {
  let die1: number;
  let die2: number;

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use crypto for true randomness
    const randomArray = new Uint32Array(2);
    crypto.getRandomValues(randomArray);
    die1 = (randomArray[0] % 6) + 1;
    die2 = (randomArray[1] % 6) + 1;
  } else {
    // Fallback to Math.random
    die1 = Math.floor(Math.random() * 6) + 1;
    die2 = Math.floor(Math.random() * 6) + 1;
  }

  return {
    die1,
    die2,
    total: die1 + die2,
  };
}

/**
 * Rolls dice with a specific seed for testing purposes.
 * Uses a simple seeded random number generator.
 *
 * @param seed - Seed value for reproducible results
 * @returns Dice roll result
 */
export function rollDiceSeeded(seed: number): DiceRollResult {
  // Simple seeded RNG (mulberry32)
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const random1 = ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  t = seed + 0x6d2b79f5 + 1;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const random2 = ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  const die1 = Math.floor(random1 * 6) + 1;
  const die2 = Math.floor(random2 * 6) + 1;

  return {
    die1,
    die2,
    total: die1 + die2,
  };
}

// ============================================================================
// RESOURCE PRODUCTION
// ============================================================================

/**
 * Gets all tiles that produce resources for a given dice roll.
 *
 * @param state - Current game state
 * @param roll - The dice roll total (2-12)
 * @returns Array of tiles that produce on this roll
 */
export function getProducingTiles(state: GameState, roll: number): HexTile[] {
  return state.tiles.filter(tile => {
    // Tile must have the matching number
    if (tile.number !== roll) return false;

    // Robber blocks production
    if (tile.hasRobber) return false;

    // Must be a producing terrain type
    const resource = TERRAIN_RESOURCE_MAP[tile.terrain];
    if (!resource) return false;

    return true;
  });
}

/**
 * Gets the vertices adjacent to a hex tile.
 *
 * @param hex - The hex coordinate
 * @returns Array of vertex coordinates adjacent to this hex
 */
function getAdjacentVertices(hex: { q: number; r: number }): VertexCoord[] {
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
 * Gets the resources produced by a dice roll for each player.
 *
 * Calculates which players receive which resources based on their
 * buildings adjacent to producing tiles. Settlements produce 1 resource,
 * cities produce 2 resources.
 *
 * @param state - Current game state
 * @param roll - The dice roll total (2-12)
 * @returns Record mapping player IDs to their produced resources
 */
export function getResourcesForRoll(
  state: GameState,
  roll: number
): Record<string, ResourceCounts> {
  const production: Record<string, ResourceCounts> = {};

  // Initialize empty production for all players
  for (const player of state.players) {
    production[player.id] = {
      brick: 0,
      lumber: 0,
      ore: 0,
      grain: 0,
      wool: 0,
    };
  }

  // Get producing tiles
  const producingTiles = getProducingTiles(state, roll);

  // For each producing tile, find adjacent buildings
  for (const tile of producingTiles) {
    const resource = TERRAIN_RESOURCE_MAP[tile.terrain];
    if (!resource) continue;

    const adjacentVertices = getAdjacentVertices(tile.coord);

    for (const vertex of adjacentVertices) {
      const vKey = vertexToKey(vertex);

      // Find building at this vertex
      const building = state.buildings.find(
        b => vertexToKey(b.vertex) === vKey
      );

      if (building) {
        // Determine amount based on building type
        const amount = building.type === 'city' ? 2 : 1;
        production[building.playerId][resource] += amount;
      }
    }
  }

  return production;
}

/**
 * Calculates the probability of rolling a specific number.
 * Used for displaying odds on number tokens.
 *
 * @param number - The dice roll total (2-12)
 * @returns Probability as a fraction (e.g., 1/36 for 2 or 12)
 */
export function getRollProbability(number: number): number {
  // Number of ways to roll each total with 2d6
  const ways: Record<number, number> = {
    2: 1,   // 1+1
    3: 2,   // 1+2, 2+1
    4: 3,   // 1+3, 2+2, 3+1
    5: 4,   // 1+4, 2+3, 3+2, 4+1
    6: 5,   // 1+5, 2+4, 3+3, 4+2, 5+1
    7: 6,   // 1+6, 2+5, 3+4, 4+3, 5+2, 6+1
    8: 5,   // 2+6, 3+5, 4+4, 5+3, 6+2
    9: 4,   // 3+6, 4+5, 5+4, 6+3
    10: 3,  // 4+6, 5+5, 6+4
    11: 2,  // 5+6, 6+5
    12: 1,  // 6+6
  };

  return (ways[number] || 0) / 36;
}

/**
 * Gets the dot count for a number token (represents probability).
 * Standard Catan uses dots under numbers to show odds.
 *
 * @param number - The dice roll total (2-12)
 * @returns Number of dots (1-5)
 */
export function getNumberDots(number: number): number {
  const dots: Record<number, number> = {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 0, // No 7 tokens in base game
    8: 5,
    9: 4,
    10: 3,
    11: 2,
    12: 1,
  };

  return dots[number] || 0;
}

/**
 * Checks if a number is considered "high value" (6 or 8).
 * These numbers have special red coloring in the game.
 *
 * @param number - The dice roll total
 * @returns True if the number is 6 or 8
 */
export function isHighValueNumber(number: number): boolean {
  return number === 6 || number === 8;
}

/**
 * Converts a dice roll result to a DiceRoll type for the game state.
 *
 * @param result - The dice roll result
 * @returns DiceRoll object for state storage
 */
export function toDiceRoll(result: DiceRollResult): DiceRoll {
  return {
    die1: result.die1,
    die2: result.die2,
    total: result.total,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getAdjacentVertices,
};
