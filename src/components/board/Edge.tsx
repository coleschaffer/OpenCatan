import React from 'react';
import type { EdgeCoord, Road as RoadType, PlayerColor } from '../../types';
import { edgeToPixel, getEdgeRotation, edgeKey } from '../../utils/hex';
import RoadPiece from './RoadPiece';

interface EdgeProps {
  coord: EdgeCoord;
  road?: RoadType;
  isValid?: boolean;
  isHighlighted?: boolean;
  onClick?: (coord: EdgeCoord) => void;
  size?: number;
  playerColor?: PlayerColor; // For showing valid placement preview
}

/**
 * Edge - Renders an edge where roads/ships can be placed.
 * Shows a line between vertices, and if a road exists, renders it.
 */
export const Edge: React.FC<EdgeProps> = ({
  coord,
  road,
  isValid = false,
  isHighlighted = false,
  onClick,
  size = 50,
  playerColor,
}) => {
  const position = edgeToPixel(coord, size);
  const rotation = getEdgeRotation(coord.direction);
  const key = edgeKey(coord);

  const handleClick = () => {
    if (onClick && (isValid || road)) {
      onClick(coord);
    }
  };

  // Determine the visual state
  const showPlacementIndicator = isValid && !road;
  const showHighlight = isHighlighted && !road;

  // Road dimensions - vertical orientation to match RoadPiece
  const roadLength = size * 1.0;
  const roadThickness = size * 0.25;

  return (
    <g
      className="edge"
      data-edge-key={key}
      onClick={handleClick}
      style={{ cursor: onClick && (isValid || road) ? 'pointer' : 'default' }}
    >
      {/* Valid placement indicator - vertical rect rotated to align with edge */}
      {showPlacementIndicator && (
        <g transform={`translate(${position.x}, ${position.y}) rotate(${rotation})`}>
          <rect
            x={-roadThickness / 2}
            y={-roadLength / 2}
            width={roadThickness}
            height={roadLength}
            fill={playerColor ? getPlayerColorValue(playerColor) : '#4caf50'}
            fillOpacity={0.5}
            stroke={playerColor ? getPlayerColorValue(playerColor) : '#4caf50'}
            strokeWidth={1.5}
            rx={3}
            ry={3}
            className="valid-placement"
          >
            <animate
              attributeName="fill-opacity"
              values="0.3;0.6;0.3"
              dur="1s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
      )}

      {/* Hover highlight */}
      {showHighlight && (
        <g transform={`translate(${position.x}, ${position.y}) rotate(${rotation})`}>
          <rect
            x={-roadThickness / 2 - 2}
            y={-roadLength / 2 - 2}
            width={roadThickness + 4}
            height={roadLength + 4}
            fill="rgba(255, 255, 255, 0.3)"
            stroke="#fff"
            strokeWidth={1}
            rx={3}
            ry={3}
          />
        </g>
      )}

      {/* Road piece */}
      {road && (
        <RoadPiece
          color={road.playerColor}
          position={position}
          rotation={rotation}
          hexSize={size}
        />
      )}

      {/* Debug/development: thin line showing edge position - vertical then rotated */}
      {!road && !showPlacementIndicator && (
        <g transform={`translate(${position.x}, ${position.y}) rotate(${rotation})`}>
          <line
            x1={0}
            y1={-roadLength / 2}
            x2={0}
            y2={roadLength / 2}
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth={1}
            className="edge-line"
          />
        </g>
      )}
    </g>
  );
};

/**
 * Helper to get player color hex value
 */
function getPlayerColorValue(color: PlayerColor): string {
  const colors: Record<PlayerColor, string> = {
    red: '#e53935',
    blue: '#1e88e5',
    orange: '#fb8c00',
    white: '#f5f5f5',
    green: '#43a047',
    purple: '#8e24aa',
    black: '#424242',
    bronze: '#cd7f32',
    gold: '#ffd700',
    silver: '#c0c0c0',
    pink: '#f48fb1',
    mysticblue: '#4fc3f7',
  };
  return colors[color];
}

export default Edge;
