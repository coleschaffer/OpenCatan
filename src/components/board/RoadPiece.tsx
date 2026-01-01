import React from 'react';
import type { PlayerColor } from '../../types';

interface RoadPieceProps {
  color: PlayerColor;
  position: { x: number; y: number };
  rotation: number;
  hexSize?: number; // Hex size for scaling the road
}

/**
 * Map player colors to their SVG asset filename suffix.
 */
const COLOR_TO_FILE: Record<PlayerColor, string> = {
  red: 'red',
  blue: 'blue',
  orange: 'orange',
  white: 'white',
  green: 'green',
  purple: 'purple',
  black: 'black',
  bronze: 'bronze',
  gold: 'gold',
  silver: 'silver',
  pink: 'pink',
  mysticblue: 'mysticblue',
};

/**
 * Default road dimensions - scaled by hex size
 * Road length should be approximately the distance between hex vertices
 */
const DEFAULT_HEX_SIZE = 50;

/**
 * RoadPiece - Renders a colored road segment.
 * Uses SVG image assets from /assets/buildings/
 * Scales road size based on hex size to properly fit between vertices
 */
export const RoadPiece: React.FC<RoadPieceProps> = ({ color, position, rotation, hexSize = DEFAULT_HEX_SIZE }) => {
  const colorSuffix = COLOR_TO_FILE[color];
  const imagePath = `/assets/buildings/road_${colorSuffix}.svg`;

  // Road SVG is naturally vertical (tall and thin)
  // We keep it vertical and let the rotation align it to the edge
  // Road length should match edge length (hexSize)
  const roadLength = hexSize * 1.0;
  const roadThickness = hexSize * 0.75;

  return (
    <g
      className="road-piece"
      transform={`translate(${position.x}, ${position.y}) rotate(${rotation})`}
    >
      {/* Road image - rendered vertical, then rotated to align with edge */}
      <image
        href={imagePath}
        x={-roadThickness / 2}
        y={-roadLength / 2}
        width={roadThickness}
        height={roadLength}
        preserveAspectRatio="none"
        className="road-image"
      />
    </g>
  );
};

export default RoadPiece;
