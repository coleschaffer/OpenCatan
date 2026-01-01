/**
 * ResourceSelector Component
 *
 * A widget for selecting resource quantities with +/- buttons.
 * Used in trade modals for selecting resources to offer/request.
 */

import React, { useCallback } from 'react';
import type { ResourceType, ResourceCounts } from '../../types';
import styles from './ResourceSelector.module.css';

// Resource icon paths
const RESOURCE_ICONS: Record<ResourceType, string> = {
  brick: '/assets/cards/card_brick.svg',
  lumber: '/assets/cards/card_lumber.svg',
  ore: '/assets/cards/card_ore.svg',
  grain: '/assets/cards/card_grain.svg',
  wool: '/assets/cards/card_wool.svg',
};

// Resource display names
const RESOURCE_LABELS: Record<ResourceType, string> = {
  brick: 'Brick',
  lumber: 'Lumber',
  ore: 'Ore',
  grain: 'Grain',
  wool: 'Wool',
};

// Resource colors for visual distinction
const RESOURCE_COLORS: Record<ResourceType, string> = {
  brick: '#c45c3d',
  lumber: '#5d8c3e',
  ore: '#6b7b8c',
  grain: '#d4a642',
  wool: '#a8c686',
};

// Resource order
const RESOURCE_ORDER: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];

export interface ResourceSelectorProps {
  /** Current selected amounts */
  selected: Partial<ResourceCounts>;
  /** Called when selection changes */
  onChange: (selected: Partial<ResourceCounts>) => void;
  /** Player's available resources (max for each type) */
  resources?: ResourceCounts;
  /** Maximum total resources that can be selected */
  maxTotal?: number;
  /** Whether to disable all inputs */
  disabled?: boolean;
  /** Show only resources with non-zero counts in hand */
  showOnlyAvailable?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Label for the section */
  label?: string;
  /** Show resource icons */
  showIcons?: boolean;
}

/**
 * Single resource row with increment/decrement controls
 */
interface ResourceRowProps {
  resource: ResourceType;
  value: number;
  max?: number;
  disabled: boolean;
  canIncrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  compact?: boolean;
  showIcon?: boolean;
}

const ResourceRow: React.FC<ResourceRowProps> = ({
  resource,
  value,
  max,
  disabled,
  canIncrement,
  onIncrement,
  onDecrement,
  compact = false,
  showIcon = true,
}) => {
  const canDecrement = value > 0;
  const atMax = max !== undefined && value >= max;

  return (
    <div
      className={`${styles.resourceRow} ${compact ? styles.compact : ''}`}
      style={{ '--resource-color': RESOURCE_COLORS[resource] } as React.CSSProperties}
    >
      {showIcon && (
        <img
          src={RESOURCE_ICONS[resource]}
          alt={RESOURCE_LABELS[resource]}
          className={styles.resourceIcon}
        />
      )}
      <span className={styles.resourceLabel}>{RESOURCE_LABELS[resource]}</span>
      {max !== undefined && (
        <span className={styles.available}>({max})</span>
      )}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={onDecrement}
          disabled={disabled || !canDecrement}
          aria-label={`Decrease ${RESOURCE_LABELS[resource]}`}
        >
          -
        </button>
        <span className={`${styles.value} ${value > 0 ? styles.hasValue : ''}`}>
          {value}
        </span>
        <button
          type="button"
          className={styles.controlButton}
          onClick={onIncrement}
          disabled={disabled || !canIncrement || atMax}
          aria-label={`Increase ${RESOURCE_LABELS[resource]}`}
        >
          +
        </button>
      </div>
    </div>
  );
};

/**
 * ResourceSelector component for selecting multiple resource quantities
 */
export const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  selected,
  onChange,
  resources,
  maxTotal,
  disabled = false,
  showOnlyAvailable = false,
  compact = false,
  label,
  showIcons = true,
}) => {
  // Calculate current total selected
  const currentTotal = Object.values(selected).reduce(
    (sum, count) => sum + (count ?? 0),
    0
  );

  // Check if we can add more (respecting maxTotal)
  const canAddMore = maxTotal === undefined || currentTotal < maxTotal;

  // Handle increment for a resource
  const handleIncrement = useCallback(
    (resource: ResourceType) => {
      const current = selected[resource] ?? 0;
      const max = resources?.[resource];

      // Check if we can increment
      if (max !== undefined && current >= max) return;
      if (!canAddMore) return;

      onChange({
        ...selected,
        [resource]: current + 1,
      });
    },
    [selected, resources, canAddMore, onChange]
  );

  // Handle decrement for a resource
  const handleDecrement = useCallback(
    (resource: ResourceType) => {
      const current = selected[resource] ?? 0;
      if (current <= 0) return;

      const newSelected = { ...selected, [resource]: current - 1 };

      // Clean up zeros
      if (newSelected[resource] === 0) {
        delete newSelected[resource];
      }

      onChange(newSelected);
    },
    [selected, onChange]
  );

  // Determine which resources to show
  const resourcesToShow = showOnlyAvailable && resources
    ? RESOURCE_ORDER.filter(r => resources[r] > 0)
    : RESOURCE_ORDER;

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.resourceList}>
        {resourcesToShow.map(resource => (
          <ResourceRow
            key={resource}
            resource={resource}
            value={selected[resource] ?? 0}
            max={resources?.[resource]}
            disabled={disabled}
            canIncrement={canAddMore}
            onIncrement={() => handleIncrement(resource)}
            onDecrement={() => handleDecrement(resource)}
            compact={compact}
            showIcon={showIcons}
          />
        ))}
      </div>
      {maxTotal !== undefined && (
        <div className={styles.totalCounter}>
          {currentTotal} / {maxTotal} selected
        </div>
      )}
    </div>
  );
};

export default ResourceSelector;
