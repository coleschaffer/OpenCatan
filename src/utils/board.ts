/**
 * Board generation utilities for Catan.
 * Handles creating hex grids, tile distribution, number token placement,
 * and validation rules like the 6/8 separation rule.
 *
 * @module board
 */

import type { HexCoord } from './hex';
import {
  getHexNeighbors,
  getHexesInRadius,
  hexToString,
  generateStandardBoard,
} from './hex';

// Re-export generateStandardBoard for convenience
export { generateStandardBoard };

// TODO: Import TerrainType from /src/types when types module is created
/**
 * Terrain types for hex tiles.
 */
export type TerrainType =
  | 'hills'     // Produces brick
  | 'forest'    // Produces lumber
  | 'mountains' // Produces ore
  | 'fields'    // Produces grain
  | 'pasture'   // Produces wool
  | 'desert'    // Produces nothing, starts with robber
  | 'water'     // Ocean tiles (Seafarers)
  | 'gold'      // Produces any resource (Seafarers)
  | 'fog';      // Unrevealed tiles (Seafarers)

/**
 * Represents a tile on the game board.
 */
export interface BoardTile {
  coord: HexCoord;
  terrain: TerrainType;
  number?: number;  // 2-12, undefined for desert/water
  hasRobber: boolean;
  hasPirate?: boolean;
  isFog?: boolean;
}

/**
 * Standard tile distribution for base game (19 hexes).
 */
export interface TileDistribution {
  hills: number;     // 3
  forest: number;    // 4
  mountains: number; // 3
  fields: number;    // 4
  pasture: number;   // 4
  desert: number;    // 1
}

/**
 * Standard number token distribution for base game (18 tokens, one per non-desert hex).
 */
export interface NumberDistribution {
  2: number;   // 1
  3: number;   // 2
  4: number;   // 2
  5: number;   // 2
  6: number;   // 2
  8: number;   // 2
  9: number;   // 2
  10: number;  // 2
  11: number;  // 2
  12: number;  // 1
}

/**
 * Generates hex coordinates for a board with the specified number of rings.
 * Ring 0 = center hex only (1 hex)
 * Ring 1 = center + 6 surrounding hexes (7 hexes)
 * Ring 2 = standard Catan board (19 hexes)
 *
 * @param rings - Number of rings around the center (0-based)
 * @returns Array of hex coordinates for the board
 *
 * @example
 * ```ts
 * const standardBoard = generateHexGrid(2);  // 19 hexes for standard Catan
 * const smallBoard = generateHexGrid(1);     // 7 hexes
 * ```
 */
export function generateHexGrid(rings: number): HexCoord[] {
  return getHexesInRadius({ q: 0, r: 0 }, rings);
}

/**
 * Returns the standard tile distribution for base Catan (19 tiles).
 *
 * @returns Object with count of each terrain type
 *
 * @example
 * ```ts
 * const dist = getStandardTileDistribution();
 * // Returns { hills: 3, forest: 4, mountains: 3, fields: 4, pasture: 4, desert: 1 }
 * ```
 */
export function getStandardTileDistribution(): TileDistribution {
  return {
    hills: 3,      // Brick
    forest: 4,     // Lumber
    mountains: 3,  // Ore
    fields: 4,     // Grain
    pasture: 4,    // Wool
    desert: 1,     // No production
  };
}

/**
 * Returns the expanded tile distribution for 5-6 player game (30 tiles).
 *
 * @returns Object with count of each terrain type
 */
export function getExpandedTileDistribution(): TileDistribution {
  return {
    hills: 5,
    forest: 6,
    mountains: 5,
    fields: 6,
    pasture: 6,
    desert: 2,
  };
}

/**
 * Returns the standard number token distribution (18 tokens for 18 non-desert hexes).
 *
 * @returns Object with count of each number token
 */
export function getStandardNumberDistribution(): NumberDistribution {
  return {
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
}

/**
 * Creates an array of terrain types based on the distribution.
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
 * Creates an array of number tokens based on the distribution.
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

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 * Uses crypto-random for true randomness.
 *
 * @param array - The array to shuffle (modified in place)
 * @returns The same array, now shuffled
 *
 * @example
 * ```ts
 * const tiles = ['hills', 'forest', 'mountains'];
 * shuffleTiles(tiles);
 * // tiles is now randomly reordered
 * ```
 */
export function shuffleTiles<T>(array: T[]): T[] {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    // Use crypto for better randomness if available
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

/**
 * Checks if a number placement is valid according to the 6/8 rule.
 * 6 and 8 are the most frequently rolled numbers and cannot be adjacent.
 *
 * @param tiles - Array of board tiles with assigned numbers
 * @returns True if no 6 is adjacent to an 8
 *
 * @example
 * ```ts
 * const valid = isValidNumberPlacement(tiles);
 * if (!valid) {
 *   // Re-shuffle and try again
 * }
 * ```
 */
export function isValidNumberPlacement(tiles: BoardTile[]): boolean {
  // Build a map from coordinate to tile for quick lookup
  const tileMap = new Map<string, BoardTile>();
  for (const tile of tiles) {
    tileMap.set(hexToString(tile.coord), tile);
  }

  // Check each tile with a 6 or 8
  for (const tile of tiles) {
    if (tile.number !== 6 && tile.number !== 8) {
      continue;
    }

    // Get neighbors
    const neighbors = getHexNeighbors(tile.coord);
    for (const neighborCoord of neighbors) {
      const neighbor = tileMap.get(hexToString(neighborCoord));
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
 * Assigns number tokens to tiles, ensuring 6 and 8 are not adjacent.
 * Will attempt multiple shuffles if needed to find a valid configuration.
 *
 * @param tiles - Array of board tiles (modified in place to add numbers)
 * @param maxAttempts - Maximum shuffle attempts before giving up (default: 100)
 * @returns True if a valid assignment was found
 *
 * @example
 * ```ts
 * const tiles = createBoardTiles(hexes, terrains);
 * const success = assignNumberTokens(tiles);
 * if (!success) {
 *   console.error('Could not find valid number placement');
 * }
 * ```
 */
export function assignNumberTokens(tiles: BoardTile[], maxAttempts: number = 100): boolean {
  // Get non-desert tiles that need numbers
  const tilesNeedingNumbers = tiles.filter(t => t.terrain !== 'desert' && t.terrain !== 'water');

  // Create number array
  const numberDist = getStandardNumberDistribution();
  const numbers = createNumberArray(numberDist);

  // Ensure we have the right number of tokens
  if (numbers.length !== tilesNeedingNumbers.length) {
    console.warn(
      `Number count (${numbers.length}) doesn't match tile count (${tilesNeedingNumbers.length})`
    );
    // Adjust if needed - this shouldn't happen with standard distribution
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Shuffle numbers
    shuffleTiles(numbers);

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

/**
 * Creates board tiles from hex coordinates and terrain types.
 *
 * @param hexes - Array of hex coordinates
 * @param terrains - Array of terrain types (should match hexes length)
 * @returns Array of BoardTile objects
 */
export function createBoardTiles(hexes: HexCoord[], terrains: TerrainType[]): BoardTile[] {
  if (hexes.length !== terrains.length) {
    throw new Error(
      `Hex count (${hexes.length}) doesn't match terrain count (${terrains.length})`
    );
  }

  return hexes.map((coord, i) => ({
    coord,
    terrain: terrains[i],
    number: undefined, // Assigned later
    hasRobber: terrains[i] === 'desert', // Robber starts on desert
    hasPirate: false,
    isFog: terrains[i] === 'fog',
  }));
}

/**
 * Generates a complete random board with valid number placement.
 *
 * @param rings - Number of rings (2 for standard board)
 * @returns Array of fully configured BoardTiles, or null if generation failed
 *
 * @example
 * ```ts
 * const board = generateRandomBoard(2);
 * if (board) {
 *   // Board is ready to use
 * }
 * ```
 */
export function generateRandomBoard(rings: number = 2): BoardTile[] | null {
  // Generate hex coordinates
  const hexes = generateHexGrid(rings);

  // Get appropriate distribution
  const distribution = rings === 2
    ? getStandardTileDistribution()
    : getExpandedTileDistribution();

  // Create and shuffle terrains
  const terrains = createTerrainArray(distribution);
  shuffleTiles(terrains);

  // Ensure terrain count matches hex count
  if (terrains.length !== hexes.length) {
    console.error(
      `Terrain count (${terrains.length}) doesn't match hex count (${hexes.length})`
    );
    return null;
  }

  // Create tiles
  const tiles = createBoardTiles(hexes, terrains);

  // Assign number tokens
  const success = assignNumberTokens(tiles);
  if (!success) {
    console.error('Failed to find valid number placement');
    return null;
  }

  return tiles;
}

/**
 * Gets the probability dots for a number token.
 * More dots = higher probability of being rolled.
 *
 * @param num - The number on the token (2-12, excluding 7)
 * @returns Number of probability dots (1-5)
 */
export function getNumberDots(num: number): number {
  // Probability based on dice combinations:
  // 2: 1/36, 3: 2/36, 4: 3/36, 5: 4/36, 6: 5/36
  // 8: 5/36, 9: 4/36, 10: 3/36, 11: 2/36, 12: 1/36
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
 * These are displayed in red on the board because they're most likely to be rolled.
 *
 * @param num - The number to check
 * @returns True if the number is 6 or 8
 */
export function isRedNumber(num: number): boolean {
  return num === 6 || num === 8;
}

/**
 * Gets the expected production value for a hex based on its number token.
 * Higher values mean more frequent resource production.
 *
 * @param num - The number on the token (2-12)
 * @returns Expected production value (0-5)
 */
export function getProductionValue(num: number | undefined): number {
  if (num === undefined) return 0;
  return getNumberDots(num);
}

/**
 * Calculates the total production value for a vertex (settlement position).
 * This is useful for AI or suggesting good settlement locations.
 *
 * @param tiles - Array of tiles adjacent to the vertex
 * @returns Total production value from all adjacent tiles
 */
export function calculateVertexProductionValue(tiles: BoardTile[]): number {
  return tiles.reduce((sum, tile) => sum + getProductionValue(tile.number), 0);
}

/**
 * Gets tiles adjacent to a specific hex coordinate from a board.
 *
 * @param coord - The hex coordinate to find neighbors for
 * @param tiles - Array of all board tiles
 * @returns Array of adjacent tiles (may be fewer than 6 for edge hexes)
 */
export function getAdjacentTiles(coord: HexCoord, tiles: BoardTile[]): BoardTile[] {
  const tileMap = new Map<string, BoardTile>();
  for (const tile of tiles) {
    tileMap.set(hexToString(tile.coord), tile);
  }

  const neighbors = getHexNeighbors(coord);
  return neighbors
    .map(n => tileMap.get(hexToString(n)))
    .filter((t): t is BoardTile => t !== undefined);
}

/**
 * Gets all tiles with a specific terrain type.
 *
 * @param tiles - Array of board tiles
 * @param terrain - The terrain type to filter by
 * @returns Array of tiles matching the terrain type
 */
export function getTilesByTerrain(tiles: BoardTile[], terrain: TerrainType): BoardTile[] {
  return tiles.filter(t => t.terrain === terrain);
}

/**
 * Gets all tiles with a specific number token.
 *
 * @param tiles - Array of board tiles
 * @param num - The number to filter by
 * @returns Array of tiles with that number
 */
export function getTilesByNumber(tiles: BoardTile[], num: number): BoardTile[] {
  return tiles.filter(t => t.number === num);
}

/**
 * Finds the tile containing the robber.
 *
 * @param tiles - Array of board tiles
 * @returns The tile with the robber, or undefined if not found
 */
export function getRobberTile(tiles: BoardTile[]): BoardTile | undefined {
  return tiles.find(t => t.hasRobber);
}

/**
 * Moves the robber to a new tile.
 *
 * @param tiles - Array of board tiles
 * @param newCoord - The coordinate to move the robber to
 * @returns True if the robber was successfully moved
 */
export function moveRobber(tiles: BoardTile[], newCoord: HexCoord): boolean {
  const targetKey = hexToString(newCoord);
  const targetTile = tiles.find(t => hexToString(t.coord) === targetKey);

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
 * Port types for trading.
 */
export type PortType = '3:1' | 'brick' | 'lumber' | 'ore' | 'grain' | 'wool';

/**
 * Represents a port on the board edge.
 */
export interface Port {
  type: PortType;
  edge: { hex: HexCoord; direction: 'NE' | 'E' | 'SE' };
}

/**
 * Standard port distribution for base game.
 * - 4 generic 3:1 ports
 * - 5 resource-specific 2:1 ports (one per resource)
 */
export function getStandardPortDistribution(): PortType[] {
  return [
    '3:1', '3:1', '3:1', '3:1',
    'brick', 'lumber', 'ore', 'grain', 'wool',
  ];
}
