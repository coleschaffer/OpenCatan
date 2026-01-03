/**
 * PortIcon - Visual port indicator for the game board
 *
 * Displays port icons around the edge of the board showing:
 * - 3:1 generic ports (any resource)
 * - 2:1 specialized ports (specific resource)
 * - Pier/dock connections to adjacent vertices
 */

import React from 'react';
import type { PortType, ResourceType, VertexCoord } from '../../types';
import { vertexToPixel } from '../../utils/hexMath';

interface PortIconProps {
  /** Port type - generic or specific resource */
  type: PortType;
  /** Trade ratio (2 or 3) */
  ratio: 2 | 3;
  /** X position in SVG coordinates */
  x: number;
  /** Y position in SVG coordinates */
  y: number;
  /** Rotation angle in degrees */
  rotation?: number;
  /** Size of the port icon */
  size?: number;
  /** The two vertices this port connects to */
  vertices?: [VertexCoord, VertexCoord];
  /** Hex size for vertex positioning */
  hexSize?: number;
}

/**
 * Get the SVG image path for a port type
 */
function getPortImagePath(type: PortType): string {
  if (type === 'generic') {
    return '/assets/ports/port.svg';
  }
  // Resource-specific ports
  const paths: Record<ResourceType, string> = {
    brick: '/assets/ports/port_brick.svg',
    lumber: '/assets/ports/port_lumber.svg',
    ore: '/assets/ports/port_ore.svg',
    grain: '/assets/ports/port_grain.svg',
    wool: '/assets/ports/port_wool.svg',
  };
  return paths[type as ResourceType];
}

/**
 * PortIcon component for displaying trade ports on the board
 */
export const PortIcon: React.FC<PortIconProps> = ({
  type,
  ratio,
  x,
  y,
  rotation = 0,
  size = 24,
}) => {
  const isGeneric = type === 'generic';
  const imagePath = getPortImagePath(type);
  // Port images are roughly square, scale to be smaller
  const imageSize = size * 1.2;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'default' }}
    >
      {/* Port SVG image - keep upright (no rotation) */}
      <image
        href={imagePath}
        x={-imageSize / 2}
        y={-imageSize / 2}
        width={imageSize}
        height={imageSize}
        className="port-image"
      />

      {/* Tooltip */}
      <title>
        {isGeneric
          ? `Generic Port - Trade any ${ratio} of the same resource for 1 of any other`
          : `${type.charAt(0).toUpperCase() + type.slice(1)} Port - Trade ${ratio} ${type} for 1 of any resource`}
      </title>
    </g>
  );
};

export default PortIcon;
