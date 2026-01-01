/**
 * ResourceDisplay Component
 *
 * A compact display of resource counts with icons.
 * Used in trade offers, player panels, and cost displays.
 */

import React from 'react';
import type { ResourceType, ResourceCounts } from '../../types';
import styles from './ResourceDisplay.module.css';

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

// Resource order for consistent display
const RESOURCE_ORDER: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];

export interface ResourceDisplayProps {
  /** Resources to display */
  resources: Partial<ResourceCounts>;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Show zeros (false by default - only show non-zero) */
  showZeros?: boolean;
  /** Show labels next to icons */
  showLabels?: boolean;
  /** Compact mode (smaller spacing) */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** Show colored backgrounds */
  colored?: boolean;
  /** Message to show when empty */
  emptyMessage?: string;
}

/**
 * ResourceDisplay component for showing resource counts
 */
export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({
  resources,
  size = 'medium',
  direction = 'horizontal',
  showZeros = false,
  showLabels = false,
  compact = false,
  className = '',
  colored = false,
  emptyMessage = 'Nothing',
}) => {
  // Filter resources to display
  const resourcesToShow = RESOURCE_ORDER.filter(
    resource => showZeros || (resources[resource] ?? 0) > 0
  );

  // Check if empty
  if (resourcesToShow.length === 0) {
    return (
      <div className={`${styles.container} ${styles.empty} ${className}`}>
        <span className={styles.emptyMessage}>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div
      className={`
        ${styles.container}
        ${styles[size]}
        ${styles[direction]}
        ${compact ? styles.compact : ''}
        ${className}
      `}
    >
      {resourcesToShow.map(resource => {
        const count = resources[resource] ?? 0;
        return (
          <div
            key={resource}
            className={`${styles.resourceItem} ${colored ? styles.colored : ''}`}
            style={{ '--resource-color': RESOURCE_COLORS[resource] } as React.CSSProperties}
            title={`${RESOURCE_LABELS[resource]}: ${count}`}
          >
            <img
              src={RESOURCE_ICONS[resource]}
              alt={RESOURCE_LABELS[resource]}
              className={styles.icon}
            />
            {showLabels && (
              <span className={styles.label}>{RESOURCE_LABELS[resource]}</span>
            )}
            <span className={styles.count}>x{count}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Simple resource badge for inline display
 */
export interface ResourceBadgeProps {
  resource: ResourceType;
  count: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const ResourceBadge: React.FC<ResourceBadgeProps> = ({
  resource,
  count,
  size = 'medium',
  showLabel = false,
}) => {
  return (
    <div
      className={`${styles.badge} ${styles[size]}`}
      style={{ '--resource-color': RESOURCE_COLORS[resource] } as React.CSSProperties}
      title={`${RESOURCE_LABELS[resource]}: ${count}`}
    >
      <img
        src={RESOURCE_ICONS[resource]}
        alt={RESOURCE_LABELS[resource]}
        className={styles.badgeIcon}
      />
      {showLabel && (
        <span className={styles.badgeLabel}>{RESOURCE_LABELS[resource]}</span>
      )}
      <span className={styles.badgeCount}>{count}</span>
    </div>
  );
};

/**
 * Trade arrow display component
 */
export interface TradeArrowProps {
  offering: Partial<ResourceCounts>;
  requesting: Partial<ResourceCounts>;
  size?: 'small' | 'medium' | 'large';
}

export const TradeArrow: React.FC<TradeArrowProps> = ({
  offering,
  requesting,
  size = 'medium',
}) => {
  return (
    <div className={`${styles.tradeArrow} ${styles[size]}`}>
      <ResourceDisplay resources={offering} size={size} compact />
      <div className={styles.arrow}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      <ResourceDisplay resources={requesting} size={size} compact />
    </div>
  );
};

export default ResourceDisplay;
