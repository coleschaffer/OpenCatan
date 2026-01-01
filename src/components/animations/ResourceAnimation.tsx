import React, { useEffect, useState } from 'react';
import type { ResourceType } from '../../types/common';
import styles from './ResourceAnimation.module.css';

// Resource card images
const RESOURCE_IMAGES: Record<ResourceType, string> = {
  brick: '/assets/cards/card_brick.svg',
  lumber: '/assets/cards/card_lumber.svg',
  ore: '/assets/cards/card_ore.svg',
  grain: '/assets/cards/card_grain.svg',
  wool: '/assets/cards/card_wool.svg',
};

export interface ResourceAnimationData {
  id: string;
  resource: ResourceType;
  playerId: string;
  playerColor: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  delay?: number;
}

interface AnimatedCardProps {
  animation: ResourceAnimationData;
  onComplete: (id: string) => void;
}

/**
 * Single animated card that flies from source to destination
 */
const AnimatedCard: React.FC<AnimatedCardProps> = ({ animation, onComplete }) => {
  const [phase, setPhase] = useState<'waiting' | 'animating' | 'done'>('waiting');
  const [position, setPosition] = useState(animation.fromPosition);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    // Wait for delay before starting
    const delayTimer = setTimeout(() => {
      setPhase('animating');
      setOpacity(1);
      setScale(1);

      const duration = 500; // ms
      const startTime = performance.now();
      const startPos = { ...animation.fromPosition };
      const endPos = { ...animation.toPosition };

      // Add some arc to the motion
      const controlPoint = {
        x: (startPos.x + endPos.x) / 2,
        y: Math.min(startPos.y, endPos.y) - 60, // Arc upward
      };

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        // Quadratic bezier curve
        const t = eased;
        const x = Math.pow(1 - t, 2) * startPos.x + 2 * (1 - t) * t * controlPoint.x + Math.pow(t, 2) * endPos.x;
        const y = Math.pow(1 - t, 2) * startPos.y + 2 * (1 - t) * t * controlPoint.y + Math.pow(t, 2) * endPos.y;

        setPosition({ x, y });

        // Scale down slightly at the end
        if (progress > 0.7) {
          setScale(1 - (progress - 0.7) * 0.5);
        }

        // Fade out at the end
        if (progress > 0.8) {
          setOpacity(1 - (progress - 0.8) * 5);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setPhase('done');
          onComplete(animation.id);
        }
      };

      requestAnimationFrame(animate);
    }, animation.delay || 0);

    return () => clearTimeout(delayTimer);
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={styles.animatedCard}
      style={{
        left: position.x,
        top: position.y,
        opacity,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${(position.x - animation.fromPosition.x) * 0.1}deg)`,
        borderColor: animation.playerColor,
      }}
    >
      <img
        src={RESOURCE_IMAGES[animation.resource]}
        alt={animation.resource}
        className={styles.cardImage}
      />
    </div>
  );
};

interface ResourceAnimationContainerProps {
  animations: ResourceAnimationData[];
  onAnimationComplete: (id: string) => void;
}

/**
 * Container for all active resource animations
 */
export const ResourceAnimationContainer: React.FC<ResourceAnimationContainerProps> = ({
  animations,
  onAnimationComplete,
}) => {
  if (animations.length === 0) return null;

  return (
    <div className={styles.animationContainer}>
      {animations.map((anim) => (
        <AnimatedCard
          key={anim.id}
          animation={anim}
          onComplete={onAnimationComplete}
        />
      ))}
    </div>
  );
};

export default ResourceAnimationContainer;
