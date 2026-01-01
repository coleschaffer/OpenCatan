/**
 * Vertex (intersection) utilities for Catan board.
 * Vertices are where settlements and cities are placed.
 *
 * This module provides additional vertex utilities beyond those in hex.ts.
 * For basic vertex operations, see hex.ts which exports:
 * - VertexCoord type
 * - vertexToPixel()
 * - vertexKey()
 * - getHexVertices()
 * - getVertexEdges()
 * - vertexEquals()
 *
 * @module vertex
 */

import type { HexCoord, VertexCoord, EdgeCoord, PixelCoord } from './hex';
import {
  vertexToPixel,
  vertexKey,
  getHexVertices,
  getVertexEdges as getVertexEdgesFromHex,
} from './hex';

// Re-export types and common functions for convenience
export type { VertexCoord, EdgeCoord, HexCoord, PixelCoord };
export { vertexToPixel, vertexKey, getHexVertices };
// Alias for getHexVertices for backward compatibility
export const getVerticesForHex = getHexVertices;

/**
 * Vertex direction type.
 */
export type VertexDirection = 'N' | 'S';

/**
 * Gets the pixel position of a vertex for rendering.
 * Alias for vertexToPixel from hex.ts.
 *
 * @param vertex - The vertex coordinate
 * @param hexSize - The size (radius) of hexes from center to corner
 * @returns The pixel coordinates of the vertex
 *
 * @example
 * ```ts
 * const pos = getVertexPixelPosition({ hex: { q: 0, r: 0 }, direction: 'N' }, 50);
 * // Returns pixel position of the north vertex of the origin hex
 * ```
 */
export function getVertexPixelPosition(vertex: VertexCoord, hexSize: number): PixelCoord {
  return vertexToPixel(vertex, hexSize);
}

/**
 * Gets the 3 hexes that touch this vertex.
 * Every vertex is at the corner of exactly 3 hexes (on an infinite grid).
 *
 * @param vertex - The vertex coordinate
 * @returns Array of 3 hex coordinates touching this vertex
 *
 * @example
 * ```ts
 * const hexes = getAdjacentHexes({ hex: { q: 0, r: 0 }, direction: 'N' });
 * // Returns the 3 hexes sharing the north vertex of (0,0)
 * ```
 */
export function getAdjacentHexes(vertex: VertexCoord): HexCoord[] {
  const { hex, direction } = vertex;

  if (direction === 'N') {
    // North vertex (top point) is touched by:
    // - The reference hex itself
    // - The hex to the northwest (direction 2 = (q, r-1))
    // - The hex to the northeast (direction 1 = (q+1, r-1))
    return [
      hex,
      { q: hex.q, r: hex.r - 1 },      // NW neighbor
      { q: hex.q + 1, r: hex.r - 1 },  // NE neighbor
    ];
  } else {
    // South vertex (bottom point) is touched by:
    // - The reference hex itself
    // - The hex to the southwest (direction 4 = (q-1, r+1))
    // - The hex to the southeast (direction 5 = (q, r+1))
    return [
      hex,
      { q: hex.q - 1, r: hex.r + 1 },  // SW neighbor
      { q: hex.q, r: hex.r + 1 },      // SE neighbor
    ];
  }
}

/**
 * Gets the 3 vertices adjacent to this vertex (connected by edges).
 * These are the vertices where roads can connect.
 *
 * For a pointy-top hex:
 * - From an N (top) vertex, adjacent vertices are at the 2, 10, and 6 o'clock positions
 * - From an S (bottom) vertex, adjacent vertices are at the 4, 8, and 12 o'clock positions
 *
 * @param vertex - The vertex coordinate
 * @returns Array of 3 adjacent vertex coordinates
 *
 * @example
 * ```ts
 * const adjacent = getAdjacentVertices({ hex: { q: 0, r: 0 }, direction: 'N' });
 * // Returns the 3 vertices connected to the north vertex of (0,0)
 * ```
 */
export function getAdjacentVertices(vertex: VertexCoord): VertexCoord[] {
  const { hex, direction } = vertex;

  if (direction === 'N') {
    // From N vertex (top point), edges go to:
    // - Upper-right (2 o'clock): S vertex of NE neighbor
    // - Upper-left (10 o'clock): S vertex of NW neighbor
    // - Below on same hex: S vertex of this hex
    return [
      { hex: { q: hex.q + 1, r: hex.r - 1 }, direction: 'S' }, // NE neighbor's S
      { hex: { q: hex.q, r: hex.r - 1 }, direction: 'S' },     // NW neighbor's S
      { hex, direction: 'S' },                                  // This hex's S
    ];
  } else {
    // From S vertex (bottom point), edges go to:
    // - Lower-right (4 o'clock): N vertex of SE neighbor
    // - Lower-left (8 o'clock): N vertex of SW neighbor
    // - Above on same hex: N vertex of this hex
    return [
      { hex: { q: hex.q, r: hex.r + 1 }, direction: 'N' },     // SE neighbor's N
      { hex: { q: hex.q - 1, r: hex.r + 1 }, direction: 'N' }, // SW neighbor's N
      { hex, direction: 'N' },                                  // This hex's N
    ];
  }
}

/**
 * Gets the 3 edges connected to this vertex.
 * These are the edges where roads can be built from this vertex.
 *
 * @param vertex - The vertex coordinate
 * @returns Array of 3 edge coordinates connected to this vertex
 *
 * @example
 * ```ts
 * const edges = getAdjacentEdges({ hex: { q: 0, r: 0 }, direction: 'N' });
 * // Returns the 3 edges connected to the north vertex of (0,0)
 * ```
 */
export function getAdjacentEdges(vertex: VertexCoord): EdgeCoord[] {
  const { hex, direction } = vertex;

  if (direction === 'N') {
    // From N vertex:
    // - NE edge of this hex (goes to S of NE neighbor)
    // - E edge of NW neighbor (goes to S of NW neighbor)
    // - SE edge of NW neighbor (goes down to S of this hex)
    return [
      { hex, direction: 'NE' },
      { hex: { q: hex.q - 1, r: hex.r }, direction: 'E' },
      { hex: { q: hex.q, r: hex.r - 1 }, direction: 'SE' },
    ];
  } else {
    // From S vertex:
    // - SE edge of this hex (goes to N of SE neighbor)
    // - NE edge of SW neighbor (goes to N of SW neighbor)
    // - E edge of SW neighbor (goes to N of this hex)
    return [
      { hex, direction: 'SE' },
      { hex: { q: hex.q - 1, r: hex.r + 1 }, direction: 'NE' },
      { hex: { q: hex.q - 1, r: hex.r + 1 }, direction: 'E' },
    ];
  }
}

/**
 * Converts a vertex coordinate to a unique string key.
 * Useful for using vertex coordinates as Map/Set keys.
 *
 * @param vertex - The vertex coordinate
 * @returns A string representation like "0,0:N"
 *
 * @example
 * ```ts
 * const key = vertexToString({ hex: { q: 0, r: 0 }, direction: 'N' });
 * // Returns "0,0:N"
 * ```
 */
export function vertexToString(vertex: VertexCoord): string {
  return `${vertex.hex.q},${vertex.hex.r}:${vertex.direction}`;
}

/**
 * Parses a string key back to a vertex coordinate.
 * Inverse of vertexToString.
 *
 * @param str - String in format "q,r:direction"
 * @returns The parsed vertex coordinate
 * @throws Error if the string format is invalid
 *
 * @example
 * ```ts
 * const vertex = stringToVertex("0,0:N");
 * // Returns { hex: { q: 0, r: 0 }, direction: 'N' }
 * ```
 */
export function stringToVertex(str: string): VertexCoord {
  const [hexPart, direction] = str.split(':');
  if (!hexPart || !direction) {
    throw new Error(`Invalid vertex string format: "${str}". Expected "q,r:direction".`);
  }

  const [qStr, rStr] = hexPart.split(',');
  const q = parseInt(qStr, 10);
  const r = parseInt(rStr, 10);

  if (isNaN(q) || isNaN(r)) {
    throw new Error(`Invalid hex coordinates in vertex string: "${str}".`);
  }

  if (direction !== 'N' && direction !== 'S') {
    throw new Error(`Invalid vertex direction: "${direction}". Must be 'N' or 'S'.`);
  }

  return {
    hex: { q, r },
    direction: direction as VertexDirection,
  };
}

/**
 * Checks if two vertex coordinates refer to the same physical vertex.
 * This performs an exact coordinate match - use normalizeVertex first
 * if you need to compare vertices that may have different representations.
 *
 * @param a - First vertex coordinate
 * @param b - Second vertex coordinate
 * @returns True if both coordinates are exactly equal
 */
export function verticesEqual(a: VertexCoord, b: VertexCoord): boolean {
  return a.hex.q === b.hex.q && a.hex.r === b.hex.r && a.direction === b.direction;
}

/**
 * Normalizes a vertex coordinate to a canonical form.
 * This ensures the same physical vertex always has the same representation.
 *
 * For N vertices on hexes where q + r >= 0, we use the current form.
 * Otherwise, we convert to an equivalent S vertex on an adjacent hex.
 *
 * @param vertex - The vertex coordinate (may be any valid representation)
 * @returns The canonical representation of the vertex
 */
export function normalizeVertex(vertex: VertexCoord): VertexCoord {
  // Simple normalization: prefer representations where q is minimized,
  // then r is minimized, then N over S
  const representations: VertexCoord[] = [];

  // Get all possible representations of this vertex
  const adjacentHexes = getAdjacentHexes(vertex);

  for (const hex of adjacentHexes) {
    // Check both N and S for each adjacent hex
    const nPos = vertexToPixel({ hex, direction: 'N' }, 1);
    const sPos = vertexToPixel({ hex, direction: 'S' }, 1);
    const targetPos = vertexToPixel(vertex, 1);

    const epsilon = 0.0001;
    if (Math.abs(nPos.x - targetPos.x) < epsilon && Math.abs(nPos.y - targetPos.y) < epsilon) {
      representations.push({ hex, direction: 'N' });
    }
    if (Math.abs(sPos.x - targetPos.x) < epsilon && Math.abs(sPos.y - targetPos.y) < epsilon) {
      representations.push({ hex, direction: 'S' });
    }
  }

  if (representations.length === 0) {
    return vertex; // Fallback to original
  }

  // Sort by q, then r, then direction (N before S)
  representations.sort((a, b) => {
    if (a.hex.q !== b.hex.q) return a.hex.q - b.hex.q;
    if (a.hex.r !== b.hex.r) return a.hex.r - b.hex.r;
    return a.direction === 'N' ? -1 : 1;
  });

  return representations[0];
}

/**
 * Gets all unique vertices on a board given a set of hex coordinates.
 * Useful for finding all settlement locations on a game board.
 *
 * @param hexes - Array of hex coordinates forming the board
 * @returns Array of unique vertex coordinates (normalized)
 */
export function getAllBoardVertices(hexes: HexCoord[]): VertexCoord[] {
  const vertexSet = new Set<string>();
  const vertices: VertexCoord[] = [];

  for (const hex of hexes) {
    // Each hex contributes its N and S vertices
    const nVertex: VertexCoord = { hex, direction: 'N' };
    const sVertex: VertexCoord = { hex, direction: 'S' };

    const nKey = vertexToString(normalizeVertex(nVertex));
    const sKey = vertexToString(normalizeVertex(sVertex));

    if (!vertexSet.has(nKey)) {
      vertexSet.add(nKey);
      vertices.push(normalizeVertex(nVertex));
    }
    if (!vertexSet.has(sKey)) {
      vertexSet.add(sKey);
      vertices.push(normalizeVertex(sVertex));
    }
  }

  return vertices;
}

/**
 * Checks if a vertex is on the edge of the board (has fewer than 3 adjacent hexes on the board).
 *
 * @param vertex - The vertex to check
 * @param boardHexes - Set of hex coordinate strings that are on the board
 * @returns True if the vertex is on the board edge
 */
export function isVertexOnBoardEdge(vertex: VertexCoord, boardHexes: Set<string>): boolean {
  const adjacentHexes = getAdjacentHexes(vertex);
  let adjacentCount = 0;

  for (const hex of adjacentHexes) {
    const key = `${hex.q},${hex.r}`;
    if (boardHexes.has(key)) {
      adjacentCount++;
    }
  }

  return adjacentCount < 3;
}

/**
 * Gets the distance between two vertices in terms of edges (roads).
 * This is useful for checking the distance rule for settlements.
 *
 * @param a - First vertex
 * @param b - Second vertex
 * @returns The minimum number of edges between the vertices, or -1 if not connected
 */
export function getVertexDistance(a: VertexCoord, b: VertexCoord): number {
  // BFS to find shortest path
  const visited = new Set<string>();
  const queue: Array<{ vertex: VertexCoord; distance: number }> = [{ vertex: a, distance: 0 }];

  visited.add(vertexToString(a));

  // Limit search depth to prevent infinite loops on invalid boards
  const maxDistance = 100;

  while (queue.length > 0) {
    const { vertex, distance } = queue.shift()!;

    if (verticesEqual(vertex, b)) {
      return distance;
    }

    if (distance >= maxDistance) {
      continue;
    }

    const adjacent = getAdjacentVertices(vertex);
    for (const adj of adjacent) {
      const key = vertexToString(adj);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ vertex: adj, distance: distance + 1 });
      }
    }
  }

  return -1; // Not connected
}

/**
 * Checks if two vertices are within the minimum distance required for settlements.
 * In Catan, settlements must be at least 2 edges apart.
 *
 * @param a - First vertex
 * @param b - Second vertex
 * @returns True if the vertices are too close (distance < 2)
 */
export function areVerticesTooClose(a: VertexCoord, b: VertexCoord): boolean {
  if (verticesEqual(a, b)) {
    return true; // Same vertex
  }

  // Check if b is adjacent to a (distance = 1)
  const adjacent = getAdjacentVertices(a);
  for (const adj of adjacent) {
    if (verticesEqual(adj, b)) {
      return true;
    }
  }

  return false;
}
