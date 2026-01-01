/**
 * Hex Grid Math Utilities for OpenCatan
 *
 * This module provides all the mathematical functions needed for working with
 * a hexagonal grid using axial coordinates (q, r) with pointy-top orientation.
 *
 * Based on: https://www.redblobgames.com/grids/hexagons/
 *
 * @module hexMath
 */

// ============================================================
// Constants
// ============================================================

/** Default hex size in pixels from center to corner */
export const HEX_SIZE = 60;

/** Square root of 3 - frequently used in hex calculations */
const SQRT3 = Math.sqrt(3);

// ============================================================
// Type Definitions
// ============================================================

/**
 * Axial coordinate for a hex tile.
 * q = column (increases going right/northeast)
 * r = row (increases going down/south)
 */
export interface HexCoord {
  q: number;
  r: number;
}

/**
 * Pixel position on screen.
 */
export interface PixelCoord {
  x: number;
  y: number;
}

/**
 * Vertex coordinate - intersection point where buildings can be placed.
 * Each vertex is identified by a hex and a direction (N or S for pointy-top hexes).
 */
export interface VertexCoord {
  hex: HexCoord;
  direction: 'N' | 'S';
}

/**
 * Edge coordinate - edge where roads/ships can be placed.
 * Each edge is identified by a hex and a direction (NE, E, or SE for pointy-top hexes).
 */
export interface EdgeCoord {
  hex: HexCoord;
  direction: 'NE' | 'E' | 'SE';
}

// ============================================================
// Hex to Pixel Conversion
// ============================================================

/**
 * Converts axial hex coordinates to pixel coordinates for rendering.
 * Uses pointy-top hex orientation.
 *
 * @param q - The q (column) coordinate
 * @param r - The r (row) coordinate
 * @param size - The hex size (default: HEX_SIZE)
 * @returns The pixel coordinates of the hex center
 *
 * @example
 * ```ts
 * const { x, y } = hexToPixel(0, 0);
 * // Returns { x: 0, y: 0 } for the origin hex
 * ```
 */
export function hexToPixel(q: number, r: number, size: number = HEX_SIZE): { x: number; y: number } {
  // For pointy-top hexes:
  // x = size * sqrt(3) * (q + r/2)
  // y = size * 3/2 * r
  const x = size * SQRT3 * (q + r / 2);
  const y = size * (3 / 2) * r;
  return { x, y };
}

/**
 * Converts axial hex coordinates to pixel coordinates using a HexCoord object.
 *
 * @param coord - The hex coordinate object
 * @param size - The hex size (default: HEX_SIZE)
 * @returns The pixel coordinates of the hex center
 */
export function hexCoordToPixel(coord: HexCoord, size: number = HEX_SIZE): PixelCoord {
  return hexToPixel(coord.q, coord.r, size);
}

// ============================================================
// Pixel to Hex Conversion
// ============================================================

/**
 * Converts pixel coordinates to the nearest axial hex coordinate.
 * Uses pointy-top hex orientation with cube coordinate rounding.
 *
 * @param x - The x pixel coordinate
 * @param y - The y pixel coordinate
 * @param size - The hex size (default: HEX_SIZE)
 * @returns The axial hex coordinate containing or nearest to the pixel
 *
 * @example
 * ```ts
 * const { q, r } = pixelToHex(100, 50);
 * // Returns the hex coordinate at that pixel position
 * ```
 */
export function pixelToHex(x: number, y: number, size: number = HEX_SIZE): { q: number; r: number } {
  // Convert pixel to fractional axial coordinates
  const q = (SQRT3 / 3 * x - 1 / 3 * y) / size;
  const r = (2 / 3 * y) / size;

  // Round to nearest hex using cube coordinates
  return roundAxial(q, r);
}

/**
 * Rounds fractional axial coordinates to the nearest integer hex.
 * Converts to cube coordinates, rounds, then converts back to axial.
 *
 * @param q - Fractional q coordinate
 * @param r - Fractional r coordinate
 * @returns Rounded integer hex coordinates
 */
function roundAxial(q: number, r: number): HexCoord {
  // Convert to cube coordinates (x, y, z) where x + y + z = 0
  const cubeX = q;
  const cubeZ = r;
  const cubeY = -cubeX - cubeZ;

  // Round each coordinate
  let rx = Math.round(cubeX);
  let ry = Math.round(cubeY);
  let rz = Math.round(cubeZ);

  // Fix rounding errors by resetting the component with largest diff
  const xDiff = Math.abs(rx - cubeX);
  const yDiff = Math.abs(ry - cubeY);
  const zDiff = Math.abs(rz - cubeZ);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  // Convert back to axial (q = x, r = z)
  return { q: rx, r: rz };
}

// ============================================================
// Hex Corner Points
// ============================================================

/**
 * Gets the 6 corner points of a hex for SVG polygon rendering.
 * Returns a string suitable for the `points` attribute of an SVG polygon.
 *
 * @param centerX - X coordinate of hex center
 * @param centerY - Y coordinate of hex center
 * @param size - The hex size (default: HEX_SIZE)
 * @returns SVG polygon points string like "x1,y1 x2,y2 x3,y3..."
 *
 * @example
 * ```ts
 * const points = getHexCorners(100, 100, 60);
 * // Returns "100,40 151.96,70 151.96,130 100,160 48.04,130 48.04,70"
 * ```
 */
export function getHexCorners(centerX: number, centerY: number, size: number = HEX_SIZE): string {
  const corners: string[] = [];

  for (let i = 0; i < 6; i++) {
    // For pointy-top, start at -90 degrees (top) and go clockwise
    const angleDeg = 60 * i - 90;
    const angleRad = (Math.PI / 180) * angleDeg;
    const x = centerX + size * Math.cos(angleRad);
    const y = centerY + size * Math.sin(angleRad);
    corners.push(`${x},${y}`);
  }

  return corners.join(' ');
}

/**
 * Gets the 6 corner points of a hex as an array of coordinate objects.
 *
 * @param centerX - X coordinate of hex center
 * @param centerY - Y coordinate of hex center
 * @param size - The hex size (default: HEX_SIZE)
 * @returns Array of 6 corner coordinate objects
 */
export function getHexCornersArray(
  centerX: number,
  centerY: number,
  size: number = HEX_SIZE
): PixelCoord[] {
  const corners: PixelCoord[] = [];

  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 90;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: centerX + size * Math.cos(angleRad),
      y: centerY + size * Math.sin(angleRad),
    });
  }

  return corners;
}

// ============================================================
// Vertex Positions
// ============================================================

/**
 * Gets the pixel position of a vertex (intersection point).
 * For pointy-top hexes:
 * - N (North) vertex is at the top corner
 * - S (South) vertex is at the bottom corner
 *
 * @param hex - The reference hex coordinate
 * @param direction - Which vertex of the hex ('N' or 'S')
 * @param size - The hex size (default: HEX_SIZE)
 * @returns The pixel coordinates of the vertex
 */
export function getVertexPosition(
  hex: HexCoord,
  direction: 'N' | 'S',
  size: number = HEX_SIZE
): { x: number; y: number } {
  const center = hexToPixel(hex.q, hex.r, size);

  if (direction === 'N') {
    // North vertex - top of pointy-top hex
    return {
      x: center.x,
      y: center.y - size,
    };
  } else {
    // South vertex - bottom of pointy-top hex
    return {
      x: center.x,
      y: center.y + size,
    };
  }
}

/**
 * Gets the pixel position of a vertex using a VertexCoord object.
 *
 * @param vertex - The vertex coordinate object
 * @param size - The hex size (default: HEX_SIZE)
 * @returns The pixel coordinates of the vertex
 */
export function vertexToPixel(vertex: VertexCoord, size: number = HEX_SIZE): PixelCoord {
  return getVertexPosition(vertex.hex, vertex.direction, size);
}

// ============================================================
// Edge Positions
// ============================================================

/**
 * Gets the pixel position and rotation angle of an edge center.
 * For pointy-top hexes:
 * - NE edge goes from N vertex toward the northeast
 * - E edge goes horizontally east from the right side
 * - SE edge goes from S vertex toward the southeast
 *
 * @param hex - The reference hex coordinate
 * @param direction - Which edge of the hex ('NE', 'E', or 'SE')
 * @param size - The hex size (default: HEX_SIZE)
 * @returns The center position and rotation angle (in degrees) of the edge
 */
export function getEdgePosition(
  hex: HexCoord,
  direction: 'NE' | 'E' | 'SE',
  size: number = HEX_SIZE
): { x: number; y: number; angle: number } {
  const center = hexToPixel(hex.q, hex.r, size);
  const halfWidth = size * SQRT3 / 2;

  switch (direction) {
    case 'NE':
      return {
        x: center.x + halfWidth / 2,
        y: center.y - size * 0.75,
        angle: -60,
      };
    case 'E':
      return {
        x: center.x + halfWidth,
        y: center.y,
        angle: 0,
      };
    case 'SE':
      return {
        x: center.x + halfWidth / 2,
        y: center.y + size * 0.75,
        angle: 60,
      };
    default:
      return { x: center.x, y: center.y, angle: 0 };
  }
}

/**
 * Gets the pixel position of an edge center using an EdgeCoord object.
 *
 * @param edge - The edge coordinate object
 * @param size - The hex size (default: HEX_SIZE)
 * @returns The center position of the edge
 */
export function edgeToPixel(edge: EdgeCoord, size: number = HEX_SIZE): PixelCoord {
  const pos = getEdgePosition(edge.hex, edge.direction, size);
  return { x: pos.x, y: pos.y };
}

/**
 * Gets the rotation angle for an edge in degrees.
 *
 * @param direction - The edge direction
 * @returns Rotation angle in degrees
 */
export function getEdgeRotation(direction: 'NE' | 'E' | 'SE'): number {
  switch (direction) {
    case 'NE': return -60;
    case 'E': return 0;
    case 'SE': return 60;
    default: return 0;
  }
}

// ============================================================
// Neighbor Functions
// ============================================================

/** Direction offsets for the 6 hex neighbors in axial coordinates */
const HEX_DIRECTION_OFFSETS: readonly [number, number][] = [
  [1, 0],   // East
  [1, -1],  // Northeast
  [0, -1],  // Northwest
  [-1, 0],  // West
  [-1, 1],  // Southwest
  [0, 1],   // Southeast
];

/**
 * Gets all 6 neighboring hex coordinates.
 * Neighbors are returned in clockwise order starting from East.
 *
 * @param q - The q coordinate
 * @param r - The r coordinate
 * @returns Array of 6 neighboring hex coordinates
 */
export function getNeighbors(q: number, r: number): HexCoord[] {
  return HEX_DIRECTION_OFFSETS.map(([dq, dr]) => ({
    q: q + dq,
    r: r + dr,
  }));
}

/**
 * Gets all 6 neighboring hex coordinates using a HexCoord object.
 *
 * @param coord - The hex coordinate
 * @returns Array of 6 neighboring hex coordinates
 */
export function getHexNeighbors(coord: HexCoord): HexCoord[] {
  return getNeighbors(coord.q, coord.r);
}

/**
 * Gets a specific neighbor by direction index.
 * Direction indices: 0=E, 1=NE, 2=NW, 3=W, 4=SW, 5=SE
 *
 * @param coord - The hex coordinate
 * @param direction - Direction index (0-5)
 * @returns The neighboring hex coordinate
 */
export function getNeighborInDirection(coord: HexCoord, direction: number): HexCoord {
  const [dq, dr] = HEX_DIRECTION_OFFSETS[((direction % 6) + 6) % 6];
  return {
    q: coord.q + dq,
    r: coord.r + dr,
  };
}

// ============================================================
// Adjacent Vertices
// ============================================================

/**
 * Gets the 3 vertices adjacent to a given vertex (connected by edges).
 * These are the vertices where roads can connect.
 *
 * @param vertex - The vertex coordinate
 * @returns Array of 3 adjacent vertex coordinates
 */
export function getAdjacentVertices(vertex: VertexCoord): VertexCoord[] {
  const { hex, direction } = vertex;

  if (direction === 'N') {
    // From N vertex (top point), edges go to:
    // - Upper-right: S vertex of NE neighbor
    // - Upper-left: S vertex of NW neighbor
    // - Below: S vertex of this hex
    return [
      { hex: { q: hex.q + 1, r: hex.r - 1 }, direction: 'S' },
      { hex: { q: hex.q, r: hex.r - 1 }, direction: 'S' },
      { hex, direction: 'S' },
    ];
  } else {
    // From S vertex (bottom point), edges go to:
    // - Lower-right: N vertex of SE neighbor
    // - Lower-left: N vertex of SW neighbor
    // - Above: N vertex of this hex
    return [
      { hex: { q: hex.q, r: hex.r + 1 }, direction: 'N' },
      { hex: { q: hex.q - 1, r: hex.r + 1 }, direction: 'N' },
      { hex, direction: 'N' },
    ];
  }
}

// ============================================================
// Vertex Edges
// ============================================================

/**
 * Gets the 3 edges connected to a vertex.
 *
 * @param vertex - The vertex coordinate
 * @returns Array of 3 edge coordinates connected to this vertex
 */
export function getVertexEdges(vertex: VertexCoord): EdgeCoord[] {
  const { hex, direction } = vertex;

  if (direction === 'N') {
    return [
      { hex, direction: 'NE' },
      { hex: { q: hex.q - 1, r: hex.r }, direction: 'E' },
      { hex: { q: hex.q, r: hex.r - 1 }, direction: 'SE' },
    ];
  } else {
    return [
      { hex, direction: 'SE' },
      { hex: { q: hex.q - 1, r: hex.r + 1 }, direction: 'NE' },
      { hex: { q: hex.q - 1, r: hex.r + 1 }, direction: 'E' },
    ];
  }
}

// ============================================================
// Distance Calculations
// ============================================================

/**
 * Calculates the Manhattan distance between two hexes.
 * This is the minimum number of hex steps to travel between them.
 *
 * @param a - First hex coordinate
 * @param b - Second hex coordinate
 * @returns The distance in hex steps
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = (-a.q - a.r) - (-b.q - b.r);
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}

// ============================================================
// Coordinate Keys
// ============================================================

/**
 * Creates a unique string key for a hex coordinate.
 *
 * @param coord - The hex coordinate
 * @returns A string like "0,0"
 */
export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

/**
 * Creates a unique string key for a vertex coordinate.
 *
 * @param vertex - The vertex coordinate
 * @returns A string like "0,0:N"
 */
export function vertexKey(vertex: VertexCoord): string {
  return `${vertex.hex.q},${vertex.hex.r}:${vertex.direction}`;
}

/**
 * Creates a unique string key for an edge coordinate.
 *
 * @param edge - The edge coordinate
 * @returns A string like "0,0:NE"
 */
export function edgeKey(edge: EdgeCoord): string {
  return `${edge.hex.q},${edge.hex.r}:${edge.direction}`;
}

// ============================================================
// Equality Checks
// ============================================================

/**
 * Checks if two hex coordinates are equal.
 */
export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/**
 * Checks if two vertex coordinates are equal.
 */
export function vertexEquals(a: VertexCoord, b: VertexCoord): boolean {
  return a.hex.q === b.hex.q && a.hex.r === b.hex.r && a.direction === b.direction;
}

/**
 * Checks if two edge coordinates are equal.
 */
export function edgeEquals(a: EdgeCoord, b: EdgeCoord): boolean {
  return a.hex.q === b.hex.q && a.hex.r === b.hex.r && a.direction === b.direction;
}

// ============================================================
// Board Generation Helpers
// ============================================================

/**
 * Generates hex coordinates for all hexes within a given radius.
 * This creates a hexagonal-shaped board.
 *
 * @param radius - The radius in hexes (0 = just center)
 * @returns Array of hex coordinates
 */
export function getHexesInRadius(radius: number): HexCoord[] {
  const hexes: HexCoord[] = [];

  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      hexes.push({ q, r });
    }
  }

  return hexes;
}

/**
 * Generates hex coordinates for a standard 19-hex Catan board.
 * This creates the classic 5-row board pattern.
 *
 * @returns Array of 19 hex coordinates
 */
export function generateStandardBoardHexes(): HexCoord[] {
  // Standard Catan board layout (19 hexes)
  const rows = [
    { r: -2, qStart: 0, qEnd: 2 },   // 3 hexes
    { r: -1, qStart: -1, qEnd: 2 },  // 4 hexes
    { r: 0, qStart: -2, qEnd: 2 },   // 5 hexes
    { r: 1, qStart: -2, qEnd: 1 },   // 4 hexes
    { r: 2, qStart: -2, qEnd: 0 },   // 3 hexes
  ];

  const hexes: HexCoord[] = [];

  for (const row of rows) {
    for (let q = row.qStart; q <= row.qEnd; q++) {
      hexes.push({ q, r: row.r });
    }
  }

  return hexes;
}

/**
 * Generates hex coordinates for a 5-6 player expanded board (30 hexes).
 *
 * @returns Array of 30 hex coordinates
 */
export function generateExpandedBoardHexes(): HexCoord[] {
  // 5-6 player expansion layout
  const rows = [
    { r: -3, qStart: 1, qEnd: 3 },    // 3 hexes
    { r: -2, qStart: 0, qEnd: 3 },    // 4 hexes
    { r: -1, qStart: -1, qEnd: 3 },   // 5 hexes
    { r: 0, qStart: -2, qEnd: 3 },    // 6 hexes
    { r: 1, qStart: -3, qEnd: 2 },    // 6 hexes
    { r: 2, qStart: -3, qEnd: 1 },    // 5 hexes
    { r: 3, qStart: -3, qEnd: 0 },    // 4 hexes (adjusted)
  ];

  const hexes: HexCoord[] = [];

  for (const row of rows) {
    for (let q = row.qStart; q <= row.qEnd; q++) {
      hexes.push({ q, r: row.r });
    }
  }

  return hexes;
}

// ============================================================
// Vertex Collection
// ============================================================

/**
 * Gets all 6 vertices of a hex.
 * Returns vertices in clockwise order starting from N.
 *
 * @param hex - The hex coordinate
 * @returns Array of 6 vertex coordinates
 */
export function getHexVertices(hex: HexCoord): VertexCoord[] {
  return [
    { hex, direction: 'N' },
    { hex: { q: hex.q + 1, r: hex.r - 1 }, direction: 'S' },
    { hex: { q: hex.q + 1, r: hex.r }, direction: 'N' },
    { hex, direction: 'S' },
    { hex: { q: hex.q, r: hex.r + 1 }, direction: 'N' },
    { hex: { q: hex.q - 1, r: hex.r + 1 }, direction: 'N' },
  ];
}

/**
 * Gets all 6 edges of a hex.
 * Returns edges in clockwise order starting from NE.
 *
 * @param hex - The hex coordinate
 * @returns Array of 6 edge coordinates
 */
export function getHexEdges(hex: HexCoord): EdgeCoord[] {
  return [
    { hex, direction: 'NE' },
    { hex, direction: 'E' },
    { hex, direction: 'SE' },
    { hex: { q: hex.q - 1, r: hex.r + 1 }, direction: 'NE' },
    { hex: { q: hex.q - 1, r: hex.r }, direction: 'E' },
    { hex: { q: hex.q, r: hex.r - 1 }, direction: 'SE' },
  ];
}

/**
 * Collects all unique vertices from a set of hexes.
 *
 * @param hexes - Array of hex coordinates
 * @returns Array of unique vertex coordinates
 */
export function collectAllVertices(hexes: HexCoord[]): VertexCoord[] {
  const vertexSet = new Set<string>();
  const vertices: VertexCoord[] = [];

  for (const hex of hexes) {
    const hexVertices = getHexVertices(hex);
    for (const v of hexVertices) {
      const key = vertexKey(v);
      if (!vertexSet.has(key)) {
        vertexSet.add(key);
        vertices.push(v);
      }
    }
  }

  return vertices;
}

/**
 * Collects all unique edges from a set of hexes.
 *
 * @param hexes - Array of hex coordinates
 * @returns Array of unique edge coordinates
 */
export function collectAllEdges(hexes: HexCoord[]): EdgeCoord[] {
  const edgeSet = new Set<string>();
  const edges: EdgeCoord[] = [];

  for (const hex of hexes) {
    const hexEdges = getHexEdges(hex);
    for (const e of hexEdges) {
      const key = edgeKey(e);
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push(e);
      }
    }
  }

  return edges;
}

// ============================================================
// Board Bounds Calculation
// ============================================================

/**
 * Calculates the bounding box of a set of hexes in pixel coordinates.
 *
 * @param hexes - Array of hex coordinates
 * @param size - The hex size (default: HEX_SIZE)
 * @param padding - Extra padding around the bounds
 * @returns Bounding box with minX, maxX, minY, maxY
 */
export function calculateBoardBounds(
  hexes: HexCoord[],
  size: number = HEX_SIZE,
  padding: number = 0
): { minX: number; maxX: number; minY: number; maxY: number } {
  if (hexes.length === 0) {
    return { minX: -200, maxX: 200, minY: -200, maxY: 200 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const hexWidth = size * SQRT3;
  const hexHeight = size * 2;

  for (const hex of hexes) {
    const center = hexToPixel(hex.q, hex.r, size);
    minX = Math.min(minX, center.x - hexWidth / 2);
    maxX = Math.max(maxX, center.x + hexWidth / 2);
    minY = Math.min(minY, center.y - hexHeight / 2);
    maxY = Math.max(maxY, center.y + hexHeight / 2);
  }

  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  };
}
