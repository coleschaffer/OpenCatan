import React, { useMemo } from 'react';
import type { HexCoord, TerrainType, HexTile as HexTileType } from '../../types';
import { axialToPixel, getHexPolygonPoints, getHexNeighbors, hexToString } from '../../utils/hex';
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
  allTiles?: HexTileType[]; // All tiles for neighbor checking (used for shore rendering)
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
 * Shore tile patterns and their SVG files.
 * Pattern string uses 's' for shore (land neighbor) and 'w' for water (no land neighbor).
 * Directions are: E, NE, NW, W, SW, SE (clockwise from East).
 * The available SVG files and their patterns (with rotations needed):
 */
interface ShorePattern {
  file: string;
  rotation: number; // degrees to rotate the SVG
}

/**
 * Get the shore SVG file and rotation for a given pattern.
 * Pattern is 6 chars: s=shore/land neighbor, w=water neighbor
 * Order: E, NE, NW, W, SW, SE (matching HEX_DIRECTIONS order)
 */
function getShorePattern(pattern: string): ShorePattern | null {
  const shoreCount = (pattern.match(/s/g) || []).length;

  if (shoreCount === 0) {
    // Pure water, no shore
    return null;
  }

  if (shoreCount === 6) {
    return { file: '/assets/tiles/tile_shore_6.svg', rotation: 0 };
  }

  if (shoreCount === 5) {
    // Find the single 'w' position and rotate accordingly
    const wIndex = pattern.indexOf('w');
    // tile_shore_5 has pattern "sssssw" (water at position 5 = SE)
    // Each position needs 60 degrees rotation
    const rotation = ((wIndex - 5 + 6) % 6) * 60;
    return { file: '/assets/tiles/tile_shore_5.svg', rotation };
  }

  if (shoreCount === 4) {
    // Available: ssssww, ssswsw, sswssw
    // Normalize pattern to find matching variant
    const normalized = normalizePattern(pattern);

    if (normalized.pattern === 'ssssww') {
      return { file: '/assets/tiles/tile_shore_4_ssssww.svg', rotation: normalized.rotation };
    }
    if (normalized.pattern === 'ssswsw') {
      return { file: '/assets/tiles/tile_shore_4_ssswsw.svg', rotation: normalized.rotation };
    }
    if (normalized.pattern === 'sswssw') {
      return { file: '/assets/tiles/tile_shore_4_sswssw.svg', rotation: normalized.rotation };
    }
  }

  if (shoreCount === 3) {
    // Available: ssswww, sswsww, sswwsw, swswsw
    const normalized = normalizePattern(pattern);

    if (normalized.pattern === 'ssswww') {
      return { file: '/assets/tiles/tile_shore_3_ssswww.svg', rotation: normalized.rotation };
    }
    if (normalized.pattern === 'sswsww') {
      return { file: '/assets/tiles/tile_shore_3_sswsww.svg', rotation: normalized.rotation };
    }
    if (normalized.pattern === 'sswwsw') {
      return { file: '/assets/tiles/tile_shore_3_sswwsw.svg', rotation: normalized.rotation };
    }
    if (normalized.pattern === 'swswsw') {
      return { file: '/assets/tiles/tile_shore_3_swswsw.svg', rotation: normalized.rotation };
    }
  }

  if (shoreCount === 2) {
    // Available: sswwww, swswww, swwsww
    const normalized = normalizePattern(pattern);

    if (normalized.pattern === 'sswwww') {
      return { file: '/assets/tiles/tile_shore_2_sswwww.svg', rotation: normalized.rotation };
    }
    if (normalized.pattern === 'swswww') {
      return { file: '/assets/tiles/tile_shore_2_swswww.svg', rotation: normalized.rotation };
    }
    if (normalized.pattern === 'swwsww') {
      return { file: '/assets/tiles/tile_shore_2_swwsww.svg', rotation: normalized.rotation };
    }
  }

  if (shoreCount === 1) {
    // tile_shore_1 has pattern "swwwww" (shore at position 0 = E)
    const sIndex = pattern.indexOf('s');
    const rotation = sIndex * 60;
    return { file: '/assets/tiles/tile_shore_1.svg', rotation };
  }

  return null;
}

/**
 * Normalize a pattern by rotating to find the canonical form.
 * Returns the canonical pattern and the rotation needed.
 */
function normalizePattern(pattern: string): { pattern: string; rotation: number } {
  const shoreCount = (pattern.match(/s/g) || []).length;

  // Define canonical patterns for each shore count
  const canonicalPatterns: Record<number, string[]> = {
    4: ['ssssww', 'ssswsw', 'sswssw'],
    3: ['ssswww', 'sswsww', 'sswwsw', 'swswsw'],
    2: ['sswwww', 'swswww', 'swwsww'],
  };

  const candidates = canonicalPatterns[shoreCount] || [];

  // Try each rotation (0, 60, 120, 180, 240, 300 degrees = 0-5 positions)
  for (let rot = 0; rot < 6; rot++) {
    const rotated = rotatePattern(pattern, rot);
    for (const canonical of candidates) {
      if (rotated === canonical) {
        return { pattern: canonical, rotation: rot * 60 };
      }
    }
  }

  // Fallback: return first canonical that matches shore count
  return { pattern: candidates[0] || pattern, rotation: 0 };
}

/**
 * Rotate a pattern string by n positions.
 */
function rotatePattern(pattern: string, n: number): string {
  const arr = pattern.split('');
  const len = arr.length;
  const rotated = new Array(len);
  for (let i = 0; i < len; i++) {
    rotated[i] = arr[(i + n) % len];
  }
  return rotated.join('');
}

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
  allTiles,
}) => {
  const center = axialToPixel(hex, size);
  const polygonPoints = getHexPolygonPoints(center, size);
  const fillColor = TERRAIN_COLORS[terrain];
  const showNumber = number !== undefined && terrain !== 'desert' && terrain !== 'water';

  // Calculate hex dimensions for image placement
  // For pointy-top hex: width = sqrt(3) * size, height = 2 * size
  const hexWidth = Math.sqrt(3) * size;
  const hexHeight = 2 * size;

  // Calculate shore pattern for water tiles
  const shoreInfo = useMemo(() => {
    if (terrain !== 'water' || !allTiles) {
      return null;
    }

    // Create a map for quick lookup
    const tileMap = new Map<string, HexTileType>();
    for (const tile of allTiles) {
      tileMap.set(hexToString(tile.coord), tile);
    }

    // Get neighbors in order: E, NE, NW, W, SW, SE
    const neighbors = getHexNeighbors(hex);
    let pattern = '';

    for (const neighbor of neighbors) {
      const neighborTile = tileMap.get(hexToString(neighbor));
      // 's' if neighbor is land (exists and not water), 'w' if water or doesn't exist
      if (neighborTile && neighborTile.terrain !== 'water') {
        pattern += 's';
      } else {
        pattern += 'w';
      }
    }

    return getShorePattern(pattern);
  }, [terrain, hex, allTiles]);

  // Determine which image to use
  const imagePath = shoreInfo ? shoreInfo.file : TERRAIN_IMAGES[terrain];
  const imageRotation = shoreInfo ? shoreInfo.rotation : 0;

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
        transform={imageRotation !== 0 ? `rotate(${imageRotation}, ${center.x}, ${center.y})` : undefined}
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
