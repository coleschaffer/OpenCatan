/**
 * PortIndicator Component
 *
 * Displays the ports owned by a player and their trade rates.
 * Used in the trade modal to show available rates.
 */

import React from 'react';
import type { ResourceType, Port, PortType } from '../../types';
import styles from './PortIndicator.module.css';

// Resource icon paths
const RESOURCE_ICONS: Record<ResourceType, string> = {
  brick: '/assets/cards/card_resource_brick.svg',
  lumber: '/assets/cards/card_resource_lumber.svg',
  ore: '/assets/cards/card_resource_ore.svg',
  grain: '/assets/cards/card_resource_grain.svg',
  wool: '/assets/cards/card_resource_wool.svg',
};

// Resource display names
const RESOURCE_LABELS: Record<ResourceType, string> = {
  brick: 'Brick',
  lumber: 'Lumber',
  ore: 'Ore',
  grain: 'Grain',
  wool: 'Wool',
};

// Resource colors
const RESOURCE_COLORS: Record<ResourceType, string> = {
  brick: '#c45c3d',
  lumber: '#5d8c3e',
  ore: '#6b7b8c',
  grain: '#d4a642',
  wool: '#a8c686',
};

// Resource order
const RESOURCE_ORDER: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];

export interface PortIndicatorProps {
  /** Trade rates for each resource (from getBankRates) */
  rates: Record<ResourceType, 2 | 3 | 4>;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Show only resources with better than 4:1 rate */
  showOnlyBetterRates?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * PortIndicator component showing trade rates
 */
export const PortIndicator: React.FC<PortIndicatorProps> = ({
  rates,
  direction = 'horizontal',
  showOnlyBetterRates = false,
  compact = false,
  className = '',
}) => {
  // Determine which resources to show
  const resourcesToShow = showOnlyBetterRates
    ? RESOURCE_ORDER.filter(r => rates[r] < 4)
    : RESOURCE_ORDER;

  // Check if player has any port benefits
  const hasPorts = RESOURCE_ORDER.some(r => rates[r] < 4);

  if (showOnlyBetterRates && !hasPorts) {
    return (
      <div className={`${styles.container} ${styles.empty} ${className}`}>
        <span className={styles.emptyMessage}>No port benefits (4:1 default)</span>
      </div>
    );
  }

  return (
    <div
      className={`
        ${styles.container}
        ${styles[direction]}
        ${compact ? styles.compact : ''}
        ${className}
      `}
    >
      {resourcesToShow.map(resource => {
        const rate = rates[resource];
        const isBetterRate = rate < 4;

        return (
          <div
            key={resource}
            className={`${styles.rateItem} ${isBetterRate ? styles.hasPort : ''}`}
            style={{ '--resource-color': RESOURCE_COLORS[resource] } as React.CSSProperties}
            title={`${RESOURCE_LABELS[resource]}: ${rate}:1 trade rate`}
          >
            <img
              src={RESOURCE_ICONS[resource]}
              alt={RESOURCE_LABELS[resource]}
              className={styles.icon}
            />
            <span className={styles.rate}>
              {rate}:1
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Single port badge showing a specific rate
 */
export interface PortBadgeProps {
  portType: PortType;
  ratio: 2 | 3;
  size?: 'small' | 'medium' | 'large';
}

export const PortBadge: React.FC<PortBadgeProps> = ({
  portType,
  ratio,
  size = 'medium',
}) => {
  const isGeneric = portType === 'generic';

  return (
    <div
      className={`${styles.portBadge} ${styles[size]} ${isGeneric ? styles.generic : ''}`}
      style={!isGeneric ? { '--resource-color': RESOURCE_COLORS[portType as ResourceType] } as React.CSSProperties : undefined}
      title={isGeneric ? `Generic ${ratio}:1 port` : `${RESOURCE_LABELS[portType as ResourceType]} ${ratio}:1 port`}
    >
      {!isGeneric && (
        <img
          src={RESOURCE_ICONS[portType as ResourceType]}
          alt={RESOURCE_LABELS[portType as ResourceType]}
          className={styles.badgeIcon}
        />
      )}
      {isGeneric && (
        <span className={styles.genericIcon}>?</span>
      )}
      <span className={styles.badgeRate}>{ratio}:1</span>
    </div>
  );
};

/**
 * Trade rate summary line for compact display
 */
export interface TradeRateSummaryProps {
  rates: Record<ResourceType, 2 | 3 | 4>;
  className?: string;
}

export const TradeRateSummary: React.FC<TradeRateSummaryProps> = ({
  rates,
  className = '',
}) => {
  // Group by rate
  const twoToOne = RESOURCE_ORDER.filter(r => rates[r] === 2);
  const threeToOne = RESOURCE_ORDER.filter(r => rates[r] === 3);
  const hasPorts = twoToOne.length > 0 || threeToOne.length > 0;

  if (!hasPorts) {
    return (
      <div className={`${styles.summary} ${className}`}>
        <span className={styles.summaryText}>Default 4:1 trades</span>
      </div>
    );
  }

  return (
    <div className={`${styles.summary} ${className}`}>
      {twoToOne.length > 0 && (
        <div className={styles.summaryGroup}>
          <span className={styles.summaryRate}>2:1</span>
          <div className={styles.summaryIcons}>
            {twoToOne.map(resource => (
              <img
                key={resource}
                src={RESOURCE_ICONS[resource]}
                alt={RESOURCE_LABELS[resource]}
                className={styles.summaryIcon}
                title={RESOURCE_LABELS[resource]}
              />
            ))}
          </div>
        </div>
      )}
      {threeToOne.length > 0 && (
        <div className={styles.summaryGroup}>
          <span className={styles.summaryRate}>3:1</span>
          <div className={styles.summaryIcons}>
            {threeToOne.map(resource => (
              <img
                key={resource}
                src={RESOURCE_ICONS[resource]}
                alt={RESOURCE_LABELS[resource]}
                className={styles.summaryIcon}
                title={RESOURCE_LABELS[resource]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortIndicator;
