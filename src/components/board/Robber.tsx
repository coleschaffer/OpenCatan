import React from 'react';

interface RobberProps {
  position: { x: number; y: number };
  onClick?: () => void;
}

/**
 * Robber - Renders the robber piece at a hex center.
 * The robber is a dark pawn-like figure that can be clicked to move.
 */
export const Robber: React.FC<RobberProps> = ({ position, onClick }) => {
  return (
    <g
      className="robber"
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Robber body - pawn shape */}
      <ellipse
        cx={0}
        cy={8}
        rx={10}
        ry={6}
        fill="#1a1a1a"
        stroke="#000"
        strokeWidth={1}
      />
      <ellipse
        cx={0}
        cy={-2}
        rx={7}
        ry={10}
        fill="#2d2d2d"
        stroke="#000"
        strokeWidth={1}
      />
      <circle
        cx={0}
        cy={-14}
        r={7}
        fill="#3d3d3d"
        stroke="#000"
        strokeWidth={1}
      />

      {/* Eyes - gives it a menacing look */}
      <circle cx={-2.5} cy={-14} r={1.5} fill="#ff4444" />
      <circle cx={2.5} cy={-14} r={1.5} fill="#ff4444" />
    </g>
  );
};

export default Robber;
