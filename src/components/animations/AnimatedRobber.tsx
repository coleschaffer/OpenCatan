import React, { useEffect, useRef, useState } from 'react';

interface AnimatedRobberProps {
  position: { x: number; y: number };
  onClick?: () => void;
}

/**
 * AnimatedRobber - Renders the robber piece with smooth movement animation.
 * When the position changes, the robber glides to the new location.
 */
export const AnimatedRobber: React.FC<AnimatedRobberProps> = ({ position, onClick }) => {
  const [currentPos, setCurrentPos] = useState(position);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevPosRef = useRef(position);

  useEffect(() => {
    // Check if position has changed
    if (prevPosRef.current.x !== position.x || prevPosRef.current.y !== position.y) {
      setIsAnimating(true);

      // Animate to new position
      const startPos = { ...currentPos };
      const endPos = { ...position };
      const duration = 600; // ms
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        setCurrentPos({
          x: startPos.x + (endPos.x - startPos.x) * eased,
          y: startPos.y + (endPos.y - startPos.y) * eased,
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          prevPosRef.current = position;
        }
      };

      requestAnimationFrame(animate);
    }
  }, [position.x, position.y]);

  // Update ref on mount
  useEffect(() => {
    prevPosRef.current = position;
    setCurrentPos(position);
  }, []);

  return (
    <g
      className="robber"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        filter: isAnimating ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' : undefined,
      }}
      onClick={onClick}
    >
      {/* Animated group */}
      <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
        {/* Shadow during animation */}
        {isAnimating && (
          <ellipse
            cx={0}
            cy={20}
            rx={14}
            ry={6}
            fill="rgba(0, 0, 0, 0.3)"
            style={{ opacity: 0.5 }}
          />
        )}

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

        {/* Glow effect - stronger during animation */}
        <ellipse
          cx={0}
          cy={8}
          rx={12}
          ry={8}
          fill="none"
          stroke={isAnimating ? 'rgba(255, 100, 0, 0.6)' : 'rgba(255, 0, 0, 0.3)'}
          strokeWidth={isAnimating ? 3 : 2}
          className="robber-glow"
        >
          <animate
            attributeName="opacity"
            values={isAnimating ? '0.6;1;0.6' : '0.3;0.6;0.3'}
            dur={isAnimating ? '0.3s' : '2s'}
            repeatCount="indefinite"
          />
        </ellipse>
      </g>
    </g>
  );
};

export default AnimatedRobber;
