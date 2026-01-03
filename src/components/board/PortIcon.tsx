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
  vertices,
  hexSize = 50,
}) => {
  const isGeneric = type === 'generic';
  const imagePath = getPortImagePath(type);
  // Port images are roughly square, scale to be smaller
  const imageSize = size * 1.2;

  // Calculate vertex positions for pier connections
  const vertex1Pos = vertices ? vertexToPixel(vertices[0], hexSize) : null;
  const vertex2Pos = vertices ? vertexToPixel(vertices[1], hexSize) : null;

  return (
    <g style={{ cursor: 'default' }}>
      {/* Pier connections to vertices */}
      {vertex1Pos && (
        <g>
          <line
            x1={x}
            y1={y}
            x2={vertex1Pos.x}
            y2={vertex1Pos.y}
            stroke="#8B6F47"
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.8}
          />
          {/* Pier planks */}
          {Array.from({ length: 3 }).map((_, i) => {
            const t = (i + 1) / 4;
            const px = x + (vertex1Pos.x - x) * t;
            const py = y + (vertex1Pos.y - y) * t;
            const angle = Math.atan2(vertex1Pos.y - y, vertex1Pos.x - x) * (180 / Math.PI);
            return (
              <line
                key={`plank1-${i}`}
                x1={px}
                y1={py}
                x2={px}
                y2={py}
                stroke="#654321"
                strokeWidth={6}
                strokeLinecap="round"
                transform={`rotate(${angle + 90}, ${px}, ${py})`}
                opacity={0.6}
              />
            );
          })}
        </g>
      )}
      {vertex2Pos && (
        <g>
          <line
            x1={x}
            y1={y}
            x2={vertex2Pos.x}
            y2={vertex2Pos.y}
            stroke="#8B6F47"
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.8}
          />
          {/* Pier planks */}
          {Array.from({ length: 3 }).map((_, i) => {
            const t = (i + 1) / 4;
            const px = x + (vertex2Pos.x - x) * t;
            const py = y + (vertex2Pos.y - y) * t;
            const angle = Math.atan2(vertex2Pos.y - y, vertex2Pos.x - x) * (180 / Math.PI);
            return (
              <line
                key={`plank2-${i}`}
                x1={px}
                y1={py}
                x2={px}
                y2={py}
                stroke="#654321"
                strokeWidth={6}
                strokeLinecap="round"
                transform={`rotate(${angle + 90}, ${px}, ${py})`}
                opacity={0.6}
              />
            );
          })}
        </g>
      )}

      {/* Port SVG image - keep upright (no rotation) */}
      <g transform={`translate(${x}, ${y})`}>
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
    </g>
  );
};

export default PortIcon;
