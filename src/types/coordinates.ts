/**
 * Hex coordinate system types for the game board
 *
 * Uses axial coordinate system (q, r) for hex grid positioning.
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

/**
 * Axial hex coordinates
 * q = column (increases going right/northeast)
 * r = row (increases going down/southeast)
 */
export interface HexCoord {
  q: number;
  r: number;
}

/**
 * Direction from hex center to vertex (intersection point)
 * 'N' = North vertex (top of hex in pointy-top orientation)
 * 'S' = South vertex (bottom of hex in pointy-top orientation)
 * Additional directions for vertex rendering
 */
export type VertexDirection = 'N' | 'S' | 'NE' | 'NW' | 'SE' | 'SW';

/**
 * Vertex coordinate - identifies an intersection point where buildings can be placed
 * Each vertex is identified by a hex and a direction from that hex's center
 */
export interface VertexCoord {
  hex: HexCoord;
  direction: VertexDirection;
}

/**
 * Direction from hex center to edge
 * For pointy-top hexagons:
 * 'NE' = Northeast edge
 * 'E'  = East edge
 * 'SE' = Southeast edge
 * Additional directions for edge rendering
 */
export type EdgeDirection = 'NE' | 'E' | 'SE' | 'NW' | 'W' | 'SW';

/**
 * Edge coordinate - identifies an edge where roads/ships can be placed
 * Each edge is identified by a hex and a direction from that hex's center
 */
export interface EdgeCoord {
  hex: HexCoord;
  direction: EdgeDirection;
}

/**
 * Utility type for coordinate serialization (used as map keys)
 */
export type HexCoordKey = `${number},${number}`;
export type VertexCoordKey = `${number},${number},${VertexDirection}`;
export type EdgeCoordKey = `${number},${number},${EdgeDirection}`;

/**
 * Convert HexCoord to string key for use in Maps/Sets
 */
export function hexToKey(coord: HexCoord): HexCoordKey {
  return `${coord.q},${coord.r}`;
}

/**
 * Convert VertexCoord to string key for use in Maps/Sets
 */
export function vertexToKey(coord: VertexCoord): VertexCoordKey {
  return `${coord.hex.q},${coord.hex.r},${coord.direction}`;
}

/**
 * Convert EdgeCoord to string key for use in Maps/Sets
 */
export function edgeToKey(coord: EdgeCoord): EdgeCoordKey {
  return `${coord.hex.q},${coord.hex.r},${coord.direction}`;
}

/**
 * Parse a HexCoordKey back to HexCoord
 */
export function keyToHex(key: HexCoordKey): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/**
 * Parse a VertexCoordKey back to VertexCoord
 */
export function keyToVertex(key: VertexCoordKey): VertexCoord {
  const parts = key.split(',');
  return {
    hex: { q: Number(parts[0]), r: Number(parts[1]) },
    direction: parts[2] as VertexDirection,
  };
}

/**
 * Parse an EdgeCoordKey back to EdgeCoord
 */
export function keyToEdge(key: EdgeCoordKey): EdgeCoord {
  const parts = key.split(',');
  return {
    hex: { q: Number(parts[0]), r: Number(parts[1]) },
    direction: parts[2] as EdgeDirection,
  };
}

/**
 * Calculates the cubic s coordinate from axial coordinates
 * In cube coordinates: q + r + s = 0
 */
export function getHexS(coord: HexCoord): number {
  return -coord.q - coord.r;
}

/**
 * Checks if two hex coordinates are equal
 */
export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/**
 * Checks if two vertex coordinates are equal
 */
export function vertexEquals(a: VertexCoord, b: VertexCoord): boolean {
  return hexEquals(a.hex, b.hex) && a.direction === b.direction;
}

/**
 * Checks if two edge coordinates are equal
 */
export function edgeEquals(a: EdgeCoord, b: EdgeCoord): boolean {
  return hexEquals(a.hex, b.hex) && a.direction === b.direction;
}

/**
 * Gets the 6 neighboring hex coordinates
 */
export function getHexNeighbors(coord: HexCoord): HexCoord[] {
  const directions: [number, number][] = [
    [1, 0],   // East
    [1, -1],  // Northeast
    [0, -1],  // Northwest
    [-1, 0],  // West
    [-1, 1],  // Southwest
    [0, 1],   // Southeast
  ];

  return directions.map(([dq, dr]) => ({
    q: coord.q + dq,
    r: coord.r + dr,
  }));
}

/**
 * Calculates distance between two hex coordinates
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}
