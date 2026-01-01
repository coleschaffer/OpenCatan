// @ts-nocheck
/**
 * Bank - Displays the resource bank and development card deck
 *
 * Shows:
 * - Stack of each resource type remaining in bank
 * - Development card deck with count
 * - Visual card stacking effect
 */

import React from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectBank, selectDevDeckCount } from '@/game/state/slices/gameSlice';
import type { ResourceType } from '@/types';
import styles from './panels.module.css';

interface BankProps {
  /** Optional className for additional styling */
  className?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Whether to hide actual counts (show question marks instead) */
  hideCards?: boolean;
}

/**
 * Resource display configuration with SVG cards
 */
const RESOURCE_CONFIG: Record<
  ResourceType,
  { label: string; image: string }
> = {
  brick: { label: 'Brick', image: '/assets/cards/card_brick.svg' },
  lumber: { label: 'Wood', image: '/assets/cards/card_lumber.svg' },
  ore: { label: 'Ore', image: '/assets/cards/card_ore.svg' },
  grain: { label: 'Wheat', image: '/assets/cards/card_grain.svg' },
  wool: { label: 'Sheep', image: '/assets/cards/card_wool.svg' },
};

const RESOURCE_ORDER: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];

/**
 * Bank component - Shows resource bank and dev card deck
 */
export const Bank: React.FC<BankProps> = ({ className, compact = false, hideCards = false }) => {
  const bank = useAppSelector(selectBank);
  const devDeckCount = useAppSelector(selectDevDeckCount);

  return (
    <div className={`${styles.bank} ${compact ? styles.bankCompact : ''} ${className || ''}`}>
      {/* Bank icon */}
      <img
        src="/assets/ui/bank.svg"
        alt="Bank"
        className={styles.bankIcon}
      />
      {/* All cards on one line: resources + dev card */}
      <div className={styles.bankResources}>
        {RESOURCE_ORDER.map((type) => {
          const config = RESOURCE_CONFIG[type];
          const count = bank?.[type] ?? 0;
          // Show visual stack (max 3 cards for compact view)
          const visualCount = Math.min(count > 0 ? Math.min(count, 3) : 0, 3);

          return (
            <div
              key={type}
              className={styles.bankResourceStack}
              title={`${config.label}: ${count}`}
            >
              {/* Render stacked cards */}
              {visualCount > 0 ? (
                Array.from({ length: visualCount }).map((_, i) => (
                  <div
                    key={i}
                    className={styles.bankCard}
                    style={{
                      top: `${i * -3}px`,
                      zIndex: i,
                    } as React.CSSProperties}
                  >
                    <img
                      src={config.image}
                      alt={config.label}
                      className={styles.bankCardImage}
                    />
                  </div>
                ))
              ) : (
                <div className={styles.bankCardEmpty}>0</div>
              )}
              {/* Count badge - show ? if hidden */}
              <div className={styles.bankCount}>{hideCards ? '?' : count}</div>
            </div>
          );
        })}

        {/* Development card deck - inline with resources */}
        <div
          className={styles.bankResourceStack}
          title={`Development Cards: ${devDeckCount}`}
        >
          {devDeckCount > 0 ? (
            Array.from({ length: Math.min(devDeckCount, 3) }).map((_, i) => (
              <div
                key={i}
                className={styles.bankCard}
                style={{
                  top: `${i * -3}px`,
                  zIndex: i,
                } as React.CSSProperties}
              >
                <img
                  src="/assets/cards/card_devcardback.svg"
                  alt="Development Card"
                  className={styles.bankCardImage}
                />
              </div>
            ))
          ) : (
            <div className={styles.bankCardEmpty}>0</div>
          )}
          <div className={styles.bankCount}>{hideCards ? '?' : devDeckCount}</div>
        </div>
      </div>
    </div>
  );
};

export default Bank;
