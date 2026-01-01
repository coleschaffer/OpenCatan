/**
 * Board Generation Utilities for OpenCatan
 *
 * This module handles creating game boards with proper terrain and number
 * token distribution, following official Catan rules.
 *
 * @module boardGenerator
 */

import {
  type HexCoord,
  hexKey,
  getHexNeighbors,
  generateStandardBoardHexes,
  generateExpandedBoardHexes,
} from './hexMath';

// ============================================================
// Types
// ============================================================

/**
 * Terrain types for hex tiles
 */
export type TerrainType =
  | 'hills'      // Produces brick
  | 'forest'     // Produces lumber
  | 'mountains'  // Produces ore
  | 'fields'     // Produces grain
  | 'pasture'    // Produces wool
  | 'desert'     // No production, robber starts here
  | 'water'      // Ocean tiles (Seafarers)
  | 'gold'       // Gold hex - player chooses resource (Seafarers)
  | 'fog';       // Hidden tile until revealed (Seafarers)

/**
 * A hex tile on the game board
 */
export interface BoardHexTile {
  /** Unique identifier for this tile */
  id: string;

  /** Axial coordinates of this hex */
  coord: HexCoord;

  /** Terrain type determining resource production */
  terrain: TerrainType;

  /** Number token on this tile (2-12), undefined for desert/water */
  number?: number;

  /** Whether the robber is currently on this tile */
  hasRobber: boolean;
}

/**
 * Tile distribution configuration
 */
export interface TileDistribution {
  hills: number;
  forest: number;
  mountains: number;
  fields: number;
  pasture: number;
  desert: number;
}

/**
 * Number token distribution configuration
 */
export interface NumberDistribution {
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  8: number;
  9: number;
  10: number;
  11: number;
  12: number;
}

// ============================================================
// Distributions
// ============================================================

/**
 * Standard tile distribution for base 4-player game (19 tiles)
 */
export const STANDARD_TILE_DISTRIBUTION: TileDistribution = {
  hills: 3,      // Brick
  forest: 4,     // Lumber
  mountains: 3,  // Ore
  fields: 4,     // Grain
  pasture: 4,    // Wool
  desert: 1,     // No production
};

/**
 * Expanded tile distribution for 5-6 player game (30 tiles)
 */
export const EXPANDED_TILE_DISTRIBUTION: TileDistribution = {
  hills: 5,
  forest: 6,
  mountains: 5,
  fields: 6,
  pasture: 6,
  desert: 2,
};

/**
 * Standard number token distribution (18 tokens)
 */
export const STANDARD_NUMBER_DISTRIBUTION: NumberDistribution = {
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
 * Expanded number token distribution for 5-6 player (28 tokens)
 */
export const EXPANDED_NUMBER_DISTRIBUTION: NumberDistribution = {
  2: 2,
  3: 3,
  4: 3,
  5: 3,
  6: 3,
  8: 3,
  9: 3,
  10: 3,
  11: 3,
  12: 2,
};

// ============================================================
// Probability Helpers
// ============================================================

/**
 * Gets the probability dots (pips) for a number token.
 * More dots = higher probability of being rolled.
 *
 * @param num - The number on the token (2-12, excluding 7)
 * @returns Number of probability dots (1-5)
 */
export function getNumberDots(num: number): number {
  const dots: Record<number, number> = {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    8: 5,
    9: 4,
    10: 3,
    11: 2,
    12: 1,
  };
  return dots[num] || 0;
}

/**
 * Checks if a number is a "red" number (6 or 8).
 * These are most likely to be rolled and displayed in red.
 *
 * @param num - The number to check
 * @returns True if the number is 6 or 8
 */
export function isRedNumber(num: number): boolean {
  return num === 6 || num === 8;
}

// ============================================================
// Array Generation
// ============================================================

/**
 * Creates an array of terrain types based on distribution.
 *
 * @param distribution - The tile distribution to use
 * @returns Array of terrain types (unshuffled)
 */
export function createTerrainArray(distribution: TileDistribution): TerrainType[] {
  const terrains: TerrainType[] = [];

  for (let i = 0; i < distribution.hills; i++) terrains.push('hills');
  for (let i = 0; i < distribution.forest; i++) terrains.push('forest');
  for (let i = 0; i < distribution.mountains; i++) terrains.push('mountains');
  for (let i = 0; i < distribution.fields; i++) terrains.push('fields');
  for (let i = 0; i < distribution.pasture; i++) terrains.push('pasture');
  for (let i = 0; i < distribution.desert; i++) terrains.push('desert');

  return terrains;
}

/**
 * Creates an array of number tokens based on distribution.
 *
 * @param distribution - The number distribution to use
 * @returns Array of numbers (unshuffled)
 */
export function createNumberArray(distribution: NumberDistribution): number[] {
  const numbers: number[] = [];

  for (let i = 0; i < distribution[2]; i++) numbers.push(2);
  for (let i = 0; i < distribution[3]; i++) numbers.push(3);
  for (let i = 0; i < distribution[4]; i++) numbers.push(4);
  for (let i = 0; i < distribution[5]; i++) numbers.push(5);
  for (let i = 0; i < distribution[6]; i++) numbers.push(6);
  for (let i = 0; i < distribution[8]; i++) numbers.push(8);
  for (let i = 0; i < distribution[9]; i++) numbers.push(9);
  for (let i = 0; i < distribution[10]; i++) numbers.push(10);
  for (let i = 0; i < distribution[11]; i++) numbers.push(11);
  for (let i = 0; i < distribution[12]; i++) numbers.push(12);

  return numbers;
}

// ============================================================
// Shuffling
// ============================================================

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 * Uses crypto-random for better randomness when available.
 *
 * @param array - The array to shuffle (modified in place)
 * @returns The same array, now shuffled
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    let j: number;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      j = randomArray[0] % (i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ============================================================
// Validation
// ============================================================

/**
 * Checks if a number placement is valid according to the 6/8 adjacency rule.
 * 6 and 8 are the most frequently rolled numbers and cannot be adjacent.
 *
 * @param tiles - Array of board tiles with assigned numbers
 * @returns True if no 6 is adjacent to an 8
 */
export function isValidNumberPlacement(tiles: BoardHexTile[]): boolean {
  // Build a map from coordinate to tile for quick lookup
  const tileMap = new Map<string, BoardHexTile>();
  for (const tile of tiles) {
    tileMap.set(hexKey(tile.coord), tile);
  }

  // Check each tile with a 6 or 8
  for (const tile of tiles) {
    if (tile.number !== 6 && tile.number !== 8) {
      continue;
    }

    // Get neighbors
    const neighbors = getHexNeighbors(tile.coord);
    for (const neighborCoord of neighbors) {
      const neighbor = tileMap.get(hexKey(neighborCoord));
      if (!neighbor) continue;

      // Check if neighbor has the "opposite" high-probability number
      if (tile.number === 6 && neighbor.number === 8) {
        return false;
      }
      if (tile.number === 8 && neighbor.number === 6) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Additional validation: Check that same numbers aren't adjacent.
 * This is a softer rule but makes for more balanced gameplay.
 *
 * @param tiles - Array of board tiles with assigned numbers
 * @returns True if no same numbers are adjacent
 */
export function hasNoAdjacentSameNumbers(tiles: BoardHexTile[]): boolean {
  const tileMap = new Map<string, BoardHexTile>();
  for (const tile of tiles) {
    tileMap.set(hexKey(tile.coord), tile);
  }

  for (const tile of tiles) {
    if (tile.number === undefined) continue;

    const neighbors = getHexNeighbors(tile.coord);
    for (const neighborCoord of neighbors) {
      const neighbor = tileMap.get(hexKey(neighborCoord));
      if (neighbor && neighbor.number === tile.number) {
        return false;
      }
    }
  }

  return true;
}

// ============================================================
// Number Token Placement
// ============================================================

/**
 * Assigns number tokens to tiles, ensuring 6 and 8 are not adjacent.
 * Will attempt multiple shuffles if needed to find a valid configuration.
 *
 * @param tiles - Array of board tiles (modified in place to add numbers)
 * @param distribution - Number distribution to use
 * @param maxAttempts - Maximum shuffle attempts before giving up
 * @returns True if a valid assignment was found
 */
export function placeNumberTokens(
  tiles: BoardHexTile[],
  distribution: NumberDistribution = STANDARD_NUMBER_DISTRIBUTION,
  maxAttempts: number = 100
): boolean {
  // Get non-desert tiles that need numbers
  const tilesNeedingNumbers = tiles.filter(
    t => t.terrain !== 'desert' && t.terrain !== 'water'
  );

  // Create number array
  const numbers = createNumberArray(distribution);

  // Adjust if counts don't match
  while (numbers.length > tilesNeedingNumbers.length) {
    numbers.pop();
  }
  while (numbers.length < tilesNeedingNumbers.length) {
    // Add more numbers if needed (shouldn't happen with standard distributions)
    const addNum = [3, 4, 5, 9, 10, 11][Math.floor(Math.random() * 6)];
    numbers.push(addNum);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Shuffle numbers
    shuffle(numbers);

    // Assign to tiles
    for (let i = 0; i < tilesNeedingNumbers.length; i++) {
      tilesNeedingNumbers[i].number = numbers[i];
    }

    // Check validity
    if (isValidNumberPlacement(tiles)) {
      return true;
    }
  }

  return false;
}

// ============================================================
// Board Generation
// ============================================================

/**
 * Creates board tiles from hex coordinates and terrain types.
 *
 * @param hexes - Array of hex coordinates
 * @param terrains - Array of terrain types (should match hexes length)
 * @returns Array of BoardHexTile objects
 */
export function createBoardTiles(hexes: HexCoord[], terrains: TerrainType[]): BoardHexTile[] {
  if (hexes.length !== terrains.length) {
    throw new Error(
      `Hex count (${hexes.length}) doesn't match terrain count (${terrains.length})`
    );
  }

  return hexes.map((coord, i) => ({
    id: hexKey(coord),
    coord,
    terrain: terrains[i],
    number: undefined,
    hasRobber: terrains[i] === 'desert',
  }));
}

/**
 * Generates a standard 19-hex base game board.
 * Tiles are randomly distributed with valid number placement.
 *
 * @returns Array of configured BoardHexTiles, or null if generation failed
 */
export function generateBaseBoard(): BoardHexTile[] | null {
  // Generate hex coordinates
  const hexes = generateStandardBoardHexes();

  // Create and shuffle terrains
  const terrains = createTerrainArray(STANDARD_TILE_DISTRIBUTION);
  shuffle(terrains);

  // Create tiles
  const tiles = createBoardTiles(hexes, terrains);

  // Assign number tokens
  const success = placeNumberTokens(tiles, STANDARD_NUMBER_DISTRIBUTION);
  if (!success) {
    console.error('Failed to find valid number placement');
    return null;
  }

  return tiles;
}

/**
 * Generates an expanded 30-hex board for 5-6 players.
 *
 * @returns Array of configured BoardHexTiles, or null if generation failed
 */
export function generateExpandedBoard(): BoardHexTile[] | null {
  // Generate hex coordinates
  const hexes = generateExpandedBoardHexes();

  // Create and shuffle terrains
  const terrains = createTerrainArray(EXPANDED_TILE_DISTRIBUTION);
  shuffle(terrains);

  // Adjust terrain count to match hex count
  while (terrains.length > hexes.length) {
    terrains.pop();
  }
  while (terrains.length < hexes.length) {
    // Add more terrains if needed
    const addTerrain: TerrainType = ['forest', 'pasture', 'fields', 'hills', 'mountains'][
      Math.floor(Math.random() * 5)
    ] as TerrainType;
    terrains.push(addTerrain);
  }

  // Create tiles
  const tiles = createBoardTiles(hexes, terrains);

  // Assign number tokens
  const success = placeNumberTokens(tiles, EXPANDED_NUMBER_DISTRIBUTION);
  if (!success) {
    console.error('Failed to find valid number placement');
    return null;
  }

  return tiles;
}

/**
 * Generates a board with a specific number of rings.
 *
 * @param rings - Number of rings (2 for standard, 3 for expanded)
 * @returns Array of configured BoardHexTiles, or null if generation failed
 */
export function generateBoard(rings: number = 2): BoardHexTile[] | null {
  if (rings <= 2) {
    return generateBaseBoard();
  } else {
    return generateExpandedBoard();
  }
}

// ============================================================
// Preset Boards
// ============================================================

/**
 * Standard beginner board layout (fixed terrain and numbers).
 * This matches the recommended setup for new players.
 *
 * @returns Array of configured BoardHexTiles
 */
export function generateBeginnerBoard(): BoardHexTile[] {
  const hexes = generateStandardBoardHexes();

  // Fixed beginner layout (spiral pattern from official rules)
  const beginnerLayout: { terrain: TerrainType; number?: number }[] = [
    // Row 1 (r = -2): 3 hexes
    { terrain: 'mountains', number: 10 },
    { terrain: 'pasture', number: 2 },
    { terrain: 'forest', number: 9 },

    // Row 2 (r = -1): 4 hexes
    { terrain: 'fields', number: 12 },
    { terrain: 'hills', number: 6 },
    { terrain: 'pasture', number: 4 },
    { terrain: 'hills', number: 10 },

    // Row 3 (r = 0): 5 hexes
    { terrain: 'fields', number: 9 },
    { terrain: 'forest', number: 11 },
    { terrain: 'desert' },
    { terrain: 'forest', number: 3 },
    { terrain: 'mountains', number: 8 },

    // Row 4 (r = 1): 4 hexes
    { terrain: 'forest', number: 8 },
    { terrain: 'mountains', number: 3 },
    { terrain: 'fields', number: 4 },
    { terrain: 'pasture', number: 5 },

    // Row 5 (r = 2): 3 hexes
    { terrain: 'hills', number: 5 },
    { terrain: 'fields', number: 6 },
    { terrain: 'pasture', number: 11 },
  ];

  const tiles: BoardHexTile[] = hexes.map((coord, i) => ({
    id: hexKey(coord),
    coord,
    terrain: beginnerLayout[i].terrain,
    number: beginnerLayout[i].number,
    hasRobber: beginnerLayout[i].terrain === 'desert',
  }));

  return tiles;
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Gets the resource type produced by a terrain.
 *
 * @param terrain - The terrain type
 * @returns The resource type, or null for non-producing terrains
 */
export function getTerrainResource(terrain: TerrainType): string | null {
  const resources: Record<TerrainType, string | null> = {
    hills: 'brick',
    forest: 'lumber',
    mountains: 'ore',
    fields: 'grain',
    pasture: 'wool',
    desert: null,
    water: null,
    gold: 'gold', // Player chooses
    fog: null,
  };
  return resources[terrain];
}

/**
 * Gets the color associated with a terrain type.
 *
 * @param terrain - The terrain type
 * @returns CSS color string
 */
export function getTerrainColor(terrain: TerrainType): string {
  const colors: Record<TerrainType, string> = {
    hills: '#c67c4e',      // Brownish-red for brick
    forest: '#2e7d32',     // Dark green for lumber
    mountains: '#78909c',  // Gray for ore
    fields: '#fdd835',     // Golden yellow for grain
    pasture: '#8bc34a',    // Light green for wool
    desert: '#e8d4a8',     // Sand color
    water: '#1565c0',      // Blue
    gold: '#ffc107',       // Bright gold
    fog: '#90a4ae',        // Gray-blue
  };
  return colors[terrain];
}

/**
 * Finds the desert tile(s) on a board.
 *
 * @param tiles - Array of board tiles
 * @returns Array of desert tiles
 */
export function findDesertTiles(tiles: BoardHexTile[]): BoardHexTile[] {
  return tiles.filter(t => t.terrain === 'desert');
}

/**
 * Finds the tile containing the robber.
 *
 * @param tiles - Array of board tiles
 * @returns The tile with the robber, or undefined
 */
export function findRobberTile(tiles: BoardHexTile[]): BoardHexTile | undefined {
  return tiles.find(t => t.hasRobber);
}

/**
 * Moves the robber to a new tile.
 *
 * @param tiles - Array of board tiles
 * @param newCoord - The coordinate to move the robber to
 * @returns True if successful
 */
export function moveRobber(tiles: BoardHexTile[], newCoord: HexCoord): boolean {
  const targetKey = hexKey(newCoord);
  const targetTile = tiles.find(t => t.id === targetKey);

  if (!targetTile) {
    return false;
  }

  // Remove robber from current location
  for (const tile of tiles) {
    tile.hasRobber = false;
  }

  // Place robber on new tile
  targetTile.hasRobber = true;
  return true;
}

/**
 * Gets all tiles that would produce resources on a given dice roll.
 *
 * @param tiles - Array of board tiles
 * @param diceRoll - The dice roll total (2-12)
 * @returns Array of tiles matching that number
 */
export function getTilesForRoll(tiles: BoardHexTile[], diceRoll: number): BoardHexTile[] {
  return tiles.filter(t => t.number === diceRoll && !t.hasRobber);
}

/**
 * Calculates the production value of a tile based on its number.
 * Higher values mean the number is more likely to be rolled.
 *
 * @param tile - The board tile
 * @returns Production value (0-5)
 */
export function getTileProductionValue(tile: BoardHexTile): number {
  if (tile.number === undefined) return 0;
  return getNumberDots(tile.number);
}
