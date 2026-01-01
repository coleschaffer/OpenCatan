/**
 * Edge (road) utilities for Catan board.
 * Edges are where roads and ships are placed.
 *
 * This module provides additional edge utilities beyond those in hex.ts.
 * For basic edge operations, see hex.ts which exports:
 * - EdgeCoord type
 * - edgeToPixel()
 * - edgeKey()
 * - getHexEdges()
 * - getEdgeVertices()
 * - getEdgeRotation()
 * - edgeEquals()
 *
 * @module edge
 */

import type { HexCoord, EdgeCoord, VertexCoord, PixelCoord } from './hex';
import {
  edgeToPixel,
  edgeKey,
  getEdgeVertices,
  getEdgeRotation,
  edgeEquals,
  getVertexEdges,
  getHexEdges,
} from './hex';

// Re-export types and common functions for convenience
export type { EdgeCoord, VertexCoord, HexCoord, PixelCoord };
export { edgeToPixel, edgeKey, getEdgeVertices, getEdgeRotation, edgeEquals, getHexEdges, getVertexEdges };
// Aliases for backward compatibility
export const getEdgesForHex = getHexEdges;
export const getEdgesFromVertex = getVertexEdges;

/**
 * Edge direction type.
 */
export type EdgeDirection = 'NE' | 'E' | 'SE';

/**
 * Gets the pixel position of an edge center for rendering.
 * Alias for edgeToPixel from hex.ts.
 *
 * @param edge - The edge coordinate
 * @param hexSize - The size (radius) of hexes from center to corner
 * @returns The pixel coordinates of the edge center
 *
 * @example
 * ```ts
 * const pos = getEdgePixelPosition({ hex: { q: 0, r: 0 }, direction: 'NE' }, 50);
 * // Returns pixel position of the NE edge of the origin hex
 * ```
 */
export function getEdgePixelPosition(edge: EdgeCoord, hexSize: number): PixelCoord {
  return edgeToPixel(edge, hexSize);
}

/**
 * Gets the 2 vertices (endpoints) at the ends of this edge.
 * Alias for getEdgeVertices from hex.ts.
 *
 * @param edge - The edge coordinate
 * @returns Tuple of 2 vertex coordinates at the edge endpoints
 *
 * @example
 * ```ts
 * const [v1, v2] = getEdgeEndpoints({ hex: { q: 0, r: 0 }, direction: 'NE' });
 * // Returns the two vertices at the ends of the NE edge
 * ```
 */
export function getEdgeEndpoints(edge: EdgeCoord): [VertexCoord, VertexCoord] {
  return getEdgeVertices(edge);
}

/**
 * Gets the 4 edges adjacent to this edge (sharing an endpoint).
 * Each edge has 2 endpoints, and each endpoint connects to 2 other edges.
 *
 * @param edge - The edge coordinate
 * @returns Array of 4 adjacent edge coordinates
 *
 * @example
 * ```ts
 * const adjacent = getAdjacentEdges({ hex: { q: 0, r: 0 }, direction: 'NE' });
 * // Returns the 4 edges connected to the NE edge of (0,0)
 * ```
 */
export function getAdjacentEdges(edge: EdgeCoord): EdgeCoord[] {
  const [v1, v2] = getEdgeEndpoints(edge);

  // Get all edges from both endpoints
  const edgesFromV1 = getVertexEdges(v1);
  const edgesFromV2 = getVertexEdges(v2);

  // Combine and filter out the original edge
  const adjacentEdges: EdgeCoord[] = [];
  const edgeKeyStr = edgeKey(edge);

  for (const e of [...edgesFromV1, ...edgesFromV2]) {
    if (edgeKey(e) !== edgeKeyStr) {
      // Check if we already have this edge
      const eKey = edgeKey(e);
      if (!adjacentEdges.some(ae => edgeKey(ae) === eKey)) {
        adjacentEdges.push(e);
      }
    }
  }

  return adjacentEdges;
}

/**
 * Gets the 2 hexes that share this edge.
 * An edge is always on the boundary between exactly 2 hexes.
 *
 * @param edge - The edge coordinate
 * @returns Array of 2 hex coordinates sharing this edge
 *
 * @example
 * ```ts
 * const hexes = getAdjacentHexes({ hex: { q: 0, r: 0 }, direction: 'NE' });
 * // Returns the 2 hexes on either side of the NE edge
 * ```
 */
export function getAdjacentHexes(edge: EdgeCoord): HexCoord[] {
  const { hex, direction } = edge;

  // Each edge direction defines which two hexes share that edge
  switch (direction) {
    case 'NE':
      // NE edge is shared by the hex and its NE neighbor
      return [
        hex,
        { q: hex.q + 1, r: hex.r - 1 }, // NE neighbor
      ];
    case 'E':
      // E edge is shared by the hex and its E neighbor
      return [
        hex,
        { q: hex.q + 1, r: hex.r }, // E neighbor
      ];
    case 'SE':
      // SE edge is shared by the hex and its SE neighbor
      return [
        hex,
        { q: hex.q, r: hex.r + 1 }, // SE neighbor
      ];
    default:
      return [hex];
  }
}

/**
 * Converts an edge coordinate to a unique string key.
 * Useful for using edge coordinates as Map/Set keys.
 *
 * @param edge - The edge coordinate
 * @returns A string representation like "0,0:NE"
 *
 * @example
 * ```ts
 * const key = edgeToString({ hex: { q: 0, r: 0 }, direction: 'NE' });
 * // Returns "0,0:NE"
 * ```
 */
export function edgeToString(edge: EdgeCoord): string {
  return `${edge.hex.q},${edge.hex.r}:${edge.direction}`;
}

/**
 * Parses a string key back to an edge coordinate.
 * Inverse of edgeToString.
 *
 * @param str - String in format "q,r:direction"
 * @returns The parsed edge coordinate
 * @throws Error if the string format is invalid
 *
 * @example
 * ```ts
 * const edge = stringToEdge("0,0:NE");
 * // Returns { hex: { q: 0, r: 0 }, direction: 'NE' }
 * ```
 */
export function stringToEdge(str: string): EdgeCoord {
  const [hexPart, direction] = str.split(':');
  if (!hexPart || !direction) {
    throw new Error(`Invalid edge string format: "${str}". Expected "q,r:direction".`);
  }

  const [qStr, rStr] = hexPart.split(',');
  const q = parseInt(qStr, 10);
  const r = parseInt(rStr, 10);

  if (isNaN(q) || isNaN(r)) {
    throw new Error(`Invalid hex coordinates in edge string: "${str}".`);
  }

  if (direction !== 'NE' && direction !== 'E' && direction !== 'SE') {
    throw new Error(`Invalid edge direction: "${direction}". Must be 'NE', 'E', or 'SE'.`);
  }

  return {
    hex: { q, r },
    direction: direction as EdgeDirection,
  };
}

/**
 * Checks if two edge coordinates are equal.
 *
 * @param a - First edge coordinate
 * @param b - Second edge coordinate
 * @returns True if both coordinates are exactly equal
 */
export function edgesEqual(a: EdgeCoord, b: EdgeCoord): boolean {
  return a.hex.q === b.hex.q && a.hex.r === b.hex.r && a.direction === b.direction;
}

/**
 * Normalizes an edge coordinate to a canonical form.
 * Each physical edge can be represented by either of the two hexes it borders.
 * This function picks a consistent representation.
 *
 * Convention: We prefer the representation with the smaller (q, r) values,
 * with q taking priority over r.
 *
 * @param edge - The edge coordinate (may be any valid representation)
 * @returns The canonical representation of the edge
 */
export function normalizeEdge(edge: EdgeCoord): EdgeCoord {
  const adjacentHexes = getAdjacentHexes(edge);

  // For each hex, determine which direction would give the same physical edge
  const representations: EdgeCoord[] = [edge];

  // The opposite representation comes from the other adjacent hex
  const otherHex = adjacentHexes[1];
  let oppositeDirection: EdgeDirection;

  switch (edge.direction) {
    case 'NE':
      // NE edge of hex = SW edge of NE neighbor (which is NE edge of SW of that hex)
      // Actually, the NE edge of hex (q,r) is the same as... we need the opposite direction
      // NE neighbor's view: it sees this as its SW edge
      // But we only have NE, E, SE. SW edge would be NE edge of... the hex to the SW
      // From otherHex (q+1, r-1): this edge is to its SW, which is owned by hex (q,r)
      // So the only representation is the original. We need to find if there's an equivalent.
      // Actually each edge is uniquely owned by one hex with our NE/E/SE system.
      // The "opposite" hex doesn't own this edge, it owns the other half of edges.
      break;
    case 'E':
      // Similar logic
      break;
    case 'SE':
      // Similar logic
      break;
  }

  // With our edge ownership model (each hex owns NE, E, SE edges),
  // each physical edge has exactly one representation. No normalization needed.
  return edge;
}

/**
 * Gets all unique edges on a board given a set of hex coordinates.
 * Useful for finding all road locations on a game board.
 *
 * @param hexes - Array of hex coordinates forming the board
 * @returns Array of unique edge coordinates
 */
export function getAllBoardEdges(hexes: HexCoord[]): EdgeCoord[] {
  const edgeSet = new Set<string>();
  const edges: EdgeCoord[] = [];

  // Create a set of valid hex keys for quick lookup
  const hexSet = new Set<string>(hexes.map(h => `${h.q},${h.r}`));

  for (const hex of hexes) {
    // Each hex owns 3 edges: NE, E, SE
    const hexEdges: EdgeCoord[] = [
      { hex, direction: 'NE' },
      { hex, direction: 'E' },
      { hex, direction: 'SE' },
    ];

    for (const edge of hexEdges) {
      const key = edgeToString(edge);
      if (!edgeSet.has(key)) {
        // Check if this edge is on the board (at least one adjacent hex is on the board)
        const adjacentHexes = getAdjacentHexes(edge);
        const hasAdjacentOnBoard = adjacentHexes.some(h => hexSet.has(`${h.q},${h.r}`));

        if (hasAdjacentOnBoard) {
          edgeSet.add(key);
          edges.push(edge);
        }
      }
    }
  }

  return edges;
}

/**
 * Checks if an edge is on the perimeter of the board.
 * An edge is on the perimeter if only one of its adjacent hexes is on the board.
 *
 * @param edge - The edge to check
 * @param boardHexes - Set of hex coordinate strings that are on the board
 * @returns True if the edge is on the board perimeter
 */
export function isEdgeOnBoardPerimeter(edge: EdgeCoord, boardHexes: Set<string>): boolean {
  const adjacentHexes = getAdjacentHexes(edge);
  let adjacentCount = 0;

  for (const hex of adjacentHexes) {
    const key = `${hex.q},${hex.r}`;
    if (boardHexes.has(key)) {
      adjacentCount++;
    }
  }

  return adjacentCount === 1;
}

/**
 * Gets the edges that form the perimeter of a board.
 *
 * @param hexes - Array of hex coordinates forming the board
 * @returns Array of edges forming the board's outer boundary
 */
export function getBoardPerimeterEdges(hexes: HexCoord[]): EdgeCoord[] {
  const hexSet = new Set<string>(hexes.map(h => `${h.q},${h.r}`));
  const allEdges = getAllBoardEdges(hexes);

  return allEdges.filter(edge => isEdgeOnBoardPerimeter(edge, hexSet));
}

/**
 * Checks if an edge connects to a specific vertex.
 *
 * @param edge - The edge to check
 * @param vertex - The vertex to check for
 * @returns True if the edge has the vertex as an endpoint
 */
export function edgeConnectsToVertex(edge: EdgeCoord, vertex: VertexCoord): boolean {
  const [v1, v2] = getEdgeEndpoints(edge);

  const vertexMatches = (a: VertexCoord, b: VertexCoord) =>
    a.hex.q === b.hex.q && a.hex.r === b.hex.r && a.direction === b.direction;

  return vertexMatches(v1, vertex) || vertexMatches(v2, vertex);
}

/**
 * Checks if two edges share a common vertex (are connected).
 *
 * @param a - First edge
 * @param b - Second edge
 * @returns True if the edges share at least one endpoint
 */
export function edgesAreConnected(a: EdgeCoord, b: EdgeCoord): boolean {
  const [a1, a2] = getEdgeEndpoints(a);
  const [b1, b2] = getEdgeEndpoints(b);

  const vertexMatches = (v1: VertexCoord, v2: VertexCoord) =>
    v1.hex.q === v2.hex.q && v1.hex.r === v2.hex.r && v1.direction === v2.direction;

  return (
    vertexMatches(a1, b1) ||
    vertexMatches(a1, b2) ||
    vertexMatches(a2, b1) ||
    vertexMatches(a2, b2)
  );
}

/**
 * Gets the shared vertex between two connected edges.
 *
 * @param a - First edge
 * @param b - Second edge
 * @returns The shared vertex, or null if edges are not connected
 */
export function getSharedVertex(a: EdgeCoord, b: EdgeCoord): VertexCoord | null {
  const [a1, a2] = getEdgeEndpoints(a);
  const [b1, b2] = getEdgeEndpoints(b);

  const vertexMatches = (v1: VertexCoord, v2: VertexCoord) =>
    v1.hex.q === v2.hex.q && v1.hex.r === v2.hex.r && v1.direction === v2.direction;

  if (vertexMatches(a1, b1) || vertexMatches(a1, b2)) {
    return a1;
  }
  if (vertexMatches(a2, b1) || vertexMatches(a2, b2)) {
    return a2;
  }

  return null;
}

/**
 * Calculates the length of a path of connected edges.
 * This is used for calculating longest road.
 *
 * @param edges - Array of edge coordinates (must form a connected path)
 * @returns The number of edges in the path
 */
export function getPathLength(edges: EdgeCoord[]): number {
  return edges.length;
}

/**
 * Checks if a set of edges forms a valid connected path.
 *
 * @param edges - Array of edge coordinates to check
 * @returns True if the edges form a single connected path (no branches)
 */
export function isValidPath(edges: EdgeCoord[]): boolean {
  if (edges.length === 0) return true;
  if (edges.length === 1) return true;

  // Build adjacency map
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    const key = edgeToString(edge);
    if (!adjacency.has(key)) {
      adjacency.set(key, []);
    }

    for (const other of edges) {
      if (edge === other) continue;
      const otherKey = edgeToString(other);
      if (edgesAreConnected(edge, other)) {
        adjacency.get(key)!.push(otherKey);
      }
    }
  }

  // Check that it forms a valid path (at most 2 connections per edge)
  // and is fully connected
  let endpoints = 0;
  for (const [key, neighbors] of adjacency) {
    if (neighbors.length > 2) {
      return false; // Branch detected
    }
    if (neighbors.length === 1) {
      endpoints++;
    }
  }

  // A valid path has exactly 2 endpoints (or 0 if it's a cycle)
  if (endpoints !== 2 && endpoints !== 0) {
    return false;
  }

  // Check connectivity using BFS
  const visited = new Set<string>();
  const queue = [edges[0]];
  visited.add(edgeToString(edges[0]));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = edgeToString(current);
    const neighbors = adjacency.get(currentKey) || [];

    for (const neighborKey of neighbors) {
      if (!visited.has(neighborKey)) {
        visited.add(neighborKey);
        queue.push(stringToEdge(neighborKey));
      }
    }
  }

  return visited.size === edges.length;
}
