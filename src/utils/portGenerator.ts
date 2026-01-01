/**
 * Port Generation Utilities for OpenCatan
 *
 * Generates port positions for the game board based on standard Catan rules.
 */

import type { Port, PortType, VertexCoord, EdgeCoord, HexCoord } from '../types';
import { hexToPixel, HEX_SIZE } from './hexMath';

/**
 * Port position with visual rendering information
 */
export interface PortPosition {
  id: string;
  type: PortType;
  ratio: 2 | 3;
  /** The two vertices players can build on to access this port */
  vertices: [VertexCoord, VertexCoord];
  /** Pixel position for rendering the port icon */
  x: number;
  y: number;
  /** Rotation angle for the port icon */
  rotation: number;
}

/**
 * Standard port configuration for base Catan
 * 4 generic (3:1) ports and 5 specialized (2:1) ports
 */
const STANDARD_PORT_TYPES: PortType[] = [
  'generic',    // 3:1
  'grain',      // 2:1
  'ore',        // 2:1
  'generic',    // 3:1
  'wool',       // 2:1
  'generic',    // 3:1
  'generic',    // 3:1
  'brick',      // 2:1
  'lumber',     // 2:1
];

/**
 * Port positions around the standard 19-hex board.
 * Each entry defines a port location with the adjacent hex and direction
 * for positioning the port icon.
 */
const STANDARD_PORT_POSITIONS: Array<{
  hex: HexCoord;
  direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  vertices: [VertexCoord, VertexCoord];
}> = [
  // Top edge ports (row r=-2)
  {
    hex: { q: 0, r: -2 },
    direction: 'NW',
    vertices: [
      { hex: { q: 0, r: -2 }, direction: 'N' },
      { hex: { q: -1, r: -1 }, direction: 'N' },
    ],
  },
  {
    hex: { q: 1, r: -2 },
    direction: 'N',
    vertices: [
      { hex: { q: 1, r: -2 }, direction: 'N' },
      { hex: { q: 2, r: -3 }, direction: 'S' },
    ],
  },
  {
    hex: { q: 2, r: -2 },
    direction: 'NE',
    vertices: [
      { hex: { q: 2, r: -2 }, direction: 'N' },
      { hex: { q: 3, r: -3 }, direction: 'S' },
    ],
  },
  // Right edge ports
  {
    hex: { q: 2, r: -1 },
    direction: 'E',
    vertices: [
      { hex: { q: 3, r: -2 }, direction: 'S' },
      { hex: { q: 3, r: -1 }, direction: 'N' },
    ],
  },
  {
    hex: { q: 2, r: 0 },
    direction: 'SE',
    vertices: [
      { hex: { q: 3, r: 0 }, direction: 'N' },
      { hex: { q: 2, r: 0 }, direction: 'S' },
    ],
  },
  // Bottom right ports
  {
    hex: { q: 1, r: 1 },
    direction: 'SE',
    vertices: [
      { hex: { q: 2, r: 1 }, direction: 'N' },
      { hex: { q: 1, r: 1 }, direction: 'S' },
    ],
  },
  // Bottom edge ports
  {
    hex: { q: -1, r: 2 },
    direction: 'S',
    vertices: [
      { hex: { q: -1, r: 2 }, direction: 'S' },
      { hex: { q: -2, r: 3 }, direction: 'N' },
    ],
  },
  // Bottom left ports
  {
    hex: { q: -2, r: 2 },
    direction: 'SW',
    vertices: [
      { hex: { q: -2, r: 2 }, direction: 'S' },
      { hex: { q: -3, r: 3 }, direction: 'N' },
    ],
  },
  // Left edge ports
  {
    hex: { q: -2, r: 1 },
    direction: 'W',
    vertices: [
      { hex: { q: -2, r: 1 }, direction: 'N' },
      { hex: { q: -3, r: 2 }, direction: 'N' },
    ],
  },
];

/**
 * Get the offset for a port icon based on its direction from the hex
 */
function getPortOffset(
  direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW',
  size: number
): { dx: number; dy: number; rotation: number } {
  const offset = size * 1.3; // Distance from hex center to port icon

  switch (direction) {
    case 'N':
      return { dx: 0, dy: -offset, rotation: 180 };
    case 'NE':
      return { dx: offset * 0.866, dy: -offset * 0.5, rotation: -120 };
    case 'E':
      return { dx: offset, dy: 0, rotation: -90 };
    case 'SE':
      return { dx: offset * 0.866, dy: offset * 0.5, rotation: -60 };
    case 'S':
      return { dx: 0, dy: offset, rotation: 0 };
    case 'SW':
      return { dx: -offset * 0.866, dy: offset * 0.5, rotation: 60 };
    case 'W':
      return { dx: -offset, dy: 0, rotation: 90 };
    case 'NW':
      return { dx: -offset * 0.866, dy: -offset * 0.5, rotation: 120 };
    default:
      return { dx: 0, dy: -offset, rotation: 0 };
  }
}

/**
 * Generates the standard 9 ports for a base Catan board
 */
export function generateStandardPorts(hexSize: number = HEX_SIZE): PortPosition[] {
  const ports: PortPosition[] = [];

  for (let i = 0; i < STANDARD_PORT_POSITIONS.length && i < STANDARD_PORT_TYPES.length; i++) {
    const posConfig = STANDARD_PORT_POSITIONS[i];
    const portType = STANDARD_PORT_TYPES[i];
    const ratio = portType === 'generic' ? 3 : 2;

    const hexCenter = hexToPixel(posConfig.hex.q, posConfig.hex.r, hexSize);
    const offset = getPortOffset(posConfig.direction, hexSize);

    ports.push({
      id: `port-${i}`,
      type: portType,
      ratio: ratio as 2 | 3,
      vertices: posConfig.vertices,
      x: hexCenter.x + offset.dx,
      y: hexCenter.y + offset.dy,
      rotation: offset.rotation,
    });
  }

  return ports;
}

/**
 * Convert PortPosition objects to Port type for Redux store
 */
export function portPositionsToStoreFormat(positions: PortPosition[]): Port[] {
  return positions.map((pos) => ({
    id: pos.id,
    edge: { hex: { q: 0, r: 0 }, direction: 'E' as const }, // Placeholder edge
    type: pos.type,
    ratio: pos.ratio,
    vertices: pos.vertices,
    position: {
      x: pos.x,
      y: pos.y,
      rotation: pos.rotation,
    },
  }));
}

export default generateStandardPorts;
