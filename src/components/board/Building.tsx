import React from 'react';
import type { PlayerColor } from '../../types';
import styles from './Building.module.css';

interface BuildingProps {
  type: 'settlement' | 'city';
  color: PlayerColor;
  position: { x: number; y: number };
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
 * Building sizes for image display - sized for visibility on board
 */
const BUILDING_SIZES = {
  settlement: { width: 38, height: 38 },
  city: { width: 46, height: 46 },
};

/**
 * Building - Renders a settlement or city piece at a vertex position.
 * Uses SVG image assets from /assets/buildings/
 */
export const Building: React.FC<BuildingProps> = ({ type, color, position }) => {
  const colorSuffix = COLOR_TO_FILE[color];
  const imagePath = `/assets/buildings/${type}_${colorSuffix}.svg`;
  const size = BUILDING_SIZES[type];

  return (
    <g
      className={`${styles.building} ${styles[type]}`}
      transform={`translate(${position.x}, ${position.y})`}
    >
      {/* Building image - no drop shadow for cleaner look */}
      <image
        href={imagePath}
        x={-size.width / 2}
        y={-size.height / 2}
        width={size.width}
        height={size.height}
        className={styles.buildingImage}
      />
    </g>
  );
};

export default Building;
