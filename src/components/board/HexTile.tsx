import React from 'react';
import type { HexCoord, TerrainType } from '../../types';
import { axialToPixel, getHexPolygonPoints } from '../../utils/hex';
import NumberToken from './NumberToken';
import styles from './HexTile.module.css';

interface HexTileProps {
  hex: HexCoord;
  terrain: TerrainType;
  number?: number; // 2-12, undefined for desert/water
  hasRobber: boolean;
  isValid?: boolean; // True if this is a valid placement location (e.g., for robber)
  onClick?: (hex: HexCoord) => void;
  size?: number;
}

/**
 * Map terrain types to their SVG image paths.
 */
const TERRAIN_IMAGES: Record<TerrainType, string> = {
  hills: '/assets/tiles/tile_brick.svg',
  forest: '/assets/tiles/tile_lumber.svg',
  mountains: '/assets/tiles/tile_ore.svg',
  fields: '/assets/tiles/tile_grain.svg',
  pasture: '/assets/tiles/tile_wool.svg',
  desert: '/assets/tiles/tile_desert.svg',
  water: '/assets/tiles/tile_sea.svg',
  gold: '/assets/tiles/tile_gold.svg',
  fog: '/assets/tiles/tile_fog.svg',
};

/**
 * Fallback colors if images don't load.
 */
const TERRAIN_COLORS: Record<TerrainType, string> = {
  hills: '#c67c4e',
  forest: '#2e7d32',
  mountains: '#78909c',
  fields: '#fdd835',
  pasture: '#8bc34a',
  desert: '#e8d4a8',
  water: '#1565c0',
  gold: '#ffc107',
  fog: '#90a4ae',
};

/**
 * HexTile - Renders a single hexagonal tile on the board.
 * Shows terrain, number token (if applicable), and robber overlay when present.
 */
export const HexTile: React.FC<HexTileProps> = ({
  hex,
  terrain,
  number,
  hasRobber,
  isValid = false,
  onClick,
  size = 50,
}) => {
  const center = axialToPixel(hex, size);
  const polygonPoints = getHexPolygonPoints(center, size);
  const fillColor = TERRAIN_COLORS[terrain];
  const imagePath = TERRAIN_IMAGES[terrain];
  const showNumber = number !== undefined && terrain !== 'desert' && terrain !== 'water';

  // Calculate hex dimensions for image placement
  // For pointy-top hex: width = sqrt(3) * size, height = 2 * size
  const hexWidth = Math.sqrt(3) * size;
  const hexHeight = 2 * size;

  const handleClick = () => {
    if (onClick) {
      onClick(hex);
    }
  };

  return (
    <g
      className={`${styles.hexTile} ${onClick ? styles.clickable : ''}`}
      onClick={handleClick}
      data-terrain={terrain}
    >
      {/* Define clip path for this hex */}
      <defs>
        <clipPath id={`hex-clip-${hex.q}-${hex.r}`}>
          <polygon points={polygonPoints} />
        </clipPath>
      </defs>

      {/* Fallback hex background color */}
      <polygon
        points={polygonPoints}
        fill={fillColor}
        stroke="none"
        strokeWidth={0}
        className={styles.hexPolygon}
      />

      {/* Terrain image clipped to hex shape */}
      <image
        href={imagePath}
        x={center.x - hexWidth / 2}
        y={center.y - hexHeight / 2}
        width={hexWidth}
        height={hexHeight}
        clipPath={`url(#hex-clip-${hex.q}-${hex.r})`}
        preserveAspectRatio="xMidYMid slice"
        className={styles.terrainImage}
      />

      {/* Hex border overlay - removed to eliminate black lines between tiles */}
      <polygon
        points={polygonPoints}
        fill="none"
        stroke="none"
        strokeWidth={0}
        className={styles.hexBorder}
      />

      {/* Number token for resource tiles - offset down slightly */}
      {showNumber && (
        <g transform={`translate(${center.x}, ${center.y + 12})`}>
          <NumberToken number={number!} />
        </g>
      )}

      {/* Robber overlay - darkens the tile */}
      {hasRobber && (
        <>
          <polygon
            points={polygonPoints}
            fill="rgba(0, 0, 0, 0.4)"
            className={styles.robberOverlay}
          />
          {/* Robber figure */}
          <g transform={`translate(${center.x}, ${center.y})`}>
            <circle r={12} fill="#2d2d2d" stroke="#111" strokeWidth={2} />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={16}
              fill="#fff"
            >
              🥷
            </text>
          </g>
        </>
      )}

      {/* Hover highlight */}
      {onClick && (
        <polygon
          points={polygonPoints}
          fill="transparent"
          stroke="transparent"
          strokeWidth={3}
          className={styles.hoverHighlight}
        />
      )}

      {/* Valid placement indicator - pulsing circle for robber placement */}
      {isValid && (
        <g transform={`translate(${center.x}, ${center.y})`}>
          <circle
            r={size * 0.4}
            fill="rgba(255, 100, 100, 0.3)"
            stroke="#ff4444"
            strokeWidth={3}
            className={styles.validPlacement}
          />
        </g>
      )}
    </g>
  );
};

export default HexTile;
