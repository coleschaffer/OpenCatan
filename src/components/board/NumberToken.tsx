import React from 'react';

interface NumberTokenProps {
  number: number; // 2-12
  size?: number; // Token size (width and height)
}

/**
 * NumberToken - Renders the number chit displayed on resource tiles.
 * Uses SVG images from /assets/numbers/prob_*.svg
 */
export const NumberToken: React.FC<NumberTokenProps> = ({ number, size = 36 }) => {
  // Skip invalid numbers (7 is never on a token, handled by robber)
  if (number < 2 || number > 12 || number === 7) {
    return null;
  }

  const imagePath = `/assets/numbers/prob_${number}.svg`;
  const halfSize = size / 2;

  return (
    <g className="number-token">
      <image
        href={imagePath}
        x={-halfSize}
        y={-halfSize}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
};

export default NumberToken;
