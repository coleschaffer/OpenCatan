import React from 'react';
import type { ResourceType } from '../../types';
import styles from './BuildingCostReference.module.css';

export interface BuildingCostReferenceProps {
  /** Whether the reference card is visible */
  isOpen: boolean;
  /** Toggle visibility */
  onToggle: () => void;
  /** Whether Cities & Knights expansion is enabled */
  isCitiesAndKnights?: boolean;
}

interface BuildingCost {
  name: string;
  icon: React.ReactNode;
  resources: Partial<Record<ResourceType, number>>;
  commodities?: Partial<Record<'cloth' | 'coin' | 'paper', number>>;
  description?: string;
}

const RESOURCE_ICONS: Record<ResourceType, string> = {
  brick: '/assets/cards/card_resource_brick.svg',
  lumber: '/assets/cards/card_resource_lumber.svg',
  ore: '/assets/cards/card_resource_ore.svg',
  grain: '/assets/cards/card_resource_grain.svg',
  wool: '/assets/cards/card_resource_wool.svg',
};

const BASE_BUILDINGS: BuildingCost[] = [
  {
    name: 'Road',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#666" stroke="none">
        <rect x="2" y="10" width="20" height="4" rx="1" />
      </svg>
    ),
    resources: { brick: 1, lumber: 1 },
  },
  {
    name: 'Settlement',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#666" stroke="none">
        <path d="M12 3L4 10v11h16V10L12 3z" />
      </svg>
    ),
    resources: { brick: 1, lumber: 1, grain: 1, wool: 1 },
  },
  {
    name: 'City',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#666" stroke="none">
        <path d="M12 2L6 8v14h12V8L12 2z" />
        <rect x="9" y="12" width="2" height="4" fill="#333" />
        <rect x="13" y="12" width="2" height="4" fill="#333" />
      </svg>
    ),
    resources: { ore: 3, grain: 2 },
    description: 'Upgrades a Settlement',
  },
  {
    name: 'Development Card',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
    resources: { ore: 1, grain: 1, wool: 1 },
  },
];

const CK_BUILDINGS: BuildingCost[] = [
  {
    name: 'City Wall',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#666" stroke="none">
        <rect x="3" y="6" width="18" height="14" />
        <rect x="5" y="8" width="3" height="4" fill="#333" />
        <rect x="10" y="8" width="3" height="4" fill="#333" />
        <rect x="15" y="8" width="3" height="4" fill="#333" />
      </svg>
    ),
    resources: { brick: 2 },
    description: '+2 hand limit',
  },
  {
    name: 'Knight (Activate)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#666" stroke="none">
        <circle cx="12" cy="8" r="4" />
        <path d="M8 14h8l2 8H6l2-8z" />
      </svg>
    ),
    resources: { grain: 1 },
    description: 'Activates a Knight',
  },
  {
    name: 'Knight (Upgrade)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M12 14v6" />
        <path d="M9 17l3 3 3-3" />
      </svg>
    ),
    resources: { ore: 1, wool: 1 },
    description: 'Upgrades Knight level',
  },
];

interface ResourceBadgeProps {
  resource: ResourceType;
  count: number;
}

const ResourceBadge: React.FC<ResourceBadgeProps> = ({ resource, count }) => (
  <div className={styles.resourceBadge}>
    <img
      src={RESOURCE_ICONS[resource]}
      alt={resource}
      className={styles.resourceIcon}
    />
    {count > 1 && <span className={styles.resourceCount}>x{count}</span>}
  </div>
);

interface BuildingRowProps {
  building: BuildingCost;
}

const BuildingRow: React.FC<BuildingRowProps> = ({ building }) => {
  const resources = Object.entries(building.resources) as [ResourceType, number][];

  return (
    <div className={styles.buildingRow}>
      <div className={styles.buildingIcon}>{building.icon}</div>
      <div className={styles.buildingInfo}>
        <span className={styles.buildingName}>{building.name}</span>
        {building.description && (
          <span className={styles.buildingDescription}>{building.description}</span>
        )}
      </div>
      <div className={styles.costList}>
        {resources.map(([resource, count]) => (
          <ResourceBadge key={resource} resource={resource} count={count} />
        ))}
      </div>
    </div>
  );
};

/**
 * BuildingCostReference component shows a toggleable overlay with
 * building costs for roads, settlements, cities, dev cards, and C&K items.
 */
export const BuildingCostReference: React.FC<BuildingCostReferenceProps> = ({
  isOpen,
  onToggle,
  isCitiesAndKnights = false,
}) => {
  return (
    <>
      {/* Toggle Button */}
      <button
        type="button"
        className={`${styles.toggleButton} ${isOpen ? styles.toggleButtonActive : ''}`}
        onClick={onToggle}
        aria-label="Toggle building costs reference"
        aria-expanded={isOpen}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {/* Reference Card */}
      {isOpen && (
        <div className={styles.referenceCard}>
          <div className={styles.header}>
            <h3 className={styles.title}>Building Costs</h3>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onToggle}
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className={styles.content}>
            {/* Base Buildings */}
            <div className={styles.section}>
              {BASE_BUILDINGS.map((building) => (
                <BuildingRow key={building.name} building={building} />
              ))}
            </div>

            {/* C&K Buildings */}
            {isCitiesAndKnights && (
              <>
                <div className={styles.divider}>
                  <span>Cities & Knights</span>
                </div>
                <div className={styles.section}>
                  {CK_BUILDINGS.map((building) => (
                    <BuildingRow key={building.name} building={building} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <span className={styles.legendLabel}>Resources:</span>
            {(['brick', 'lumber', 'ore', 'grain', 'wool'] as ResourceType[]).map((resource) => (
              <div key={resource} className={styles.legendItem}>
                <img
                  src={RESOURCE_ICONS[resource]}
                  alt={resource}
                  className={styles.legendIcon}
                />
                <span className={styles.legendName}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default BuildingCostReference;
