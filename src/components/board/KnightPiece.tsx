import React from 'react';
import type { PlayerColor } from '../../types';
import styles from './KnightPiece.module.css';

interface KnightPieceProps {
  /** Knight level (1, 2, or 3) */
  level: 1 | 2 | 3;
  /** Whether the knight is active */
  isActive: boolean;
  /** Player color */
  color: PlayerColor;
  /** Position on the board */
  position: { x: number; y: number };
  /** Click handler */
  onClick?: () => void;
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
 * Knight piece sizes based on level
 */
const KNIGHT_SIZES = {
  1: { width: 24, height: 24 },
  2: { width: 28, height: 28 },
  3: { width: 32, height: 32 },
};

/**
 * KnightPiece - Renders a knight piece on the board.
 * Uses SVG image assets from /assets/knights/
 * Knights have 3 levels and can be active or inactive.
 */
export const KnightPiece: React.FC<KnightPieceProps> = ({
  level,
  isActive,
  color,
  position,
  onClick,
}) => {
  const colorSuffix = COLOR_TO_FILE[color];
  const activeState = isActive ? 'active' : 'inactive';
  const imagePath = `/assets/knights/knight_level${level}_${activeState}_${colorSuffix}.svg`;
  const size = KNIGHT_SIZES[level];

  return (
    <g
      className={`${styles.knight} ${isActive ? styles.active : styles.inactive} ${onClick ? styles.clickable : ''}`}
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
    >
      {/* Drop shadow */}
      <ellipse
        cx={0}
        cy={size.height / 2 - 2}
        rx={size.width / 3}
        ry={4}
        fill="rgba(0,0,0,0.3)"
        className={styles.shadow}
      />
      {/* Knight image */}
      <image
        href={imagePath}
        x={-size.width / 2}
        y={-size.height / 2}
        width={size.width}
        height={size.height}
        className={styles.knightImage}
      />
      {/* Level indicator badge */}
      {level > 1 && (
        <g className={styles.levelBadge}>
          <circle
            cx={size.width / 2 - 4}
            cy={-size.height / 2 + 4}
            r={6}
            fill="#1a1a1a"
            stroke={isActive ? '#ffd700' : '#666'}
            strokeWidth={1}
          />
          <text
            x={size.width / 2 - 4}
            y={-size.height / 2 + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            fontWeight="bold"
            fill={isActive ? '#ffd700' : '#888'}
          >
            {level}
          </text>
        </g>
      )}
    </g>
  );
};

export default KnightPiece;
