import React, { useEffect, useCallback, useRef } from 'react';
import styles from './BuildMenu.module.css';
import { ResourceType } from './ResourceHand';

/**
 * Building types available in the game
 */
export type BuildingType = 'road' | 'settlement' | 'city' | 'ship';

/**
 * Building cost definition
 */
export type BuildingCost = Partial<Record<ResourceType, number>>;

/**
 * Standard building costs for base game
 */
export const BUILDING_COSTS: Record<BuildingType, BuildingCost> = {
  road: { brick: 1, lumber: 1 },
  settlement: { brick: 1, lumber: 1, grain: 1, wool: 1 },
  city: { ore: 3, grain: 2 },
  ship: { lumber: 1, wool: 1 },
};

interface BuildMenuProps {
  /** Whether the player can afford a road */
  canBuildRoad: boolean;
  /** Whether the player can afford a settlement */
  canBuildSettlement: boolean;
  /** Whether the player can afford a city */
  canBuildCity: boolean;
  /** Whether the player can afford a ship (Seafarers) */
  canBuildShip?: boolean;
  /** Whether ships are available (Seafarers mode) */
  showShips?: boolean;
  /** Building costs (for display) */
  costs?: Record<BuildingType, BuildingCost>;
  /** Callback when a building type is selected */
  onSelect: (type: BuildingType) => void;
  /** Callback to close the menu */
  onClose: () => void;
  /** Whether the menu is open */
  isOpen: boolean;
}

/**
 * Resource icons for cost display
 */
const resourceIcons: Record<ResourceType, string> = {
  brick: '🧱',
  lumber: '🪵',
  ore: '⛰️',
  grain: '🌾',
  wool: '🐑',
};

/**
 * Building icons and labels
 */
const buildingConfig: Record<
  BuildingType,
  { icon: string; label: string; shortcut: string }
> = {
  road: { icon: '🛤️', label: 'Road', shortcut: 'R' },
  settlement: { icon: '🏠', label: 'Settlement', shortcut: 'S' },
  city: { icon: '🏰', label: 'City', shortcut: 'C' },
  ship: { icon: '⛵', label: 'Ship', shortcut: 'H' },
};

/**
 * BuildMenu - Building options dropdown
 *
 * Displays available building options with their costs.
 * Disables options the player cannot afford.
 * Supports keyboard shortcuts for quick selection.
 *
 * @param canBuildRoad - Whether road is affordable
 * @param canBuildSettlement - Whether settlement is affordable
 * @param canBuildCity - Whether city is affordable
 * @param canBuildShip - Whether ship is affordable
 * @param showShips - Whether to show ship option
 * @param costs - Building costs for display
 * @param onSelect - Selection callback
 * @param onClose - Close callback
 * @param isOpen - Whether menu is open
 */
export const BuildMenu: React.FC<BuildMenuProps> = ({
  canBuildRoad,
  canBuildSettlement,
  canBuildCity,
  canBuildShip = false,
  showShips = false,
  costs = BUILDING_COSTS,
  onSelect,
  onClose,
  isOpen,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key.toLowerCase()) {
        case 'r':
          if (canBuildRoad) {
            onSelect('road');
            onClose();
          }
          break;
        case 's':
          if (canBuildSettlement) {
            onSelect('settlement');
            onClose();
          }
          break;
        case 'c':
          if (canBuildCity) {
            onSelect('city');
            onClose();
          }
          break;
        case 'h':
          if (showShips && canBuildShip) {
            onSelect('ship');
            onClose();
          }
          break;
        case 'escape':
          onClose();
          break;
      }
    },
    [isOpen, canBuildRoad, canBuildSettlement, canBuildCity, canBuildShip, showShips, onSelect, onClose]
  );

  /**
   * Handle click outside to close
   */
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  if (!isOpen) return null;

  /**
   * Render cost display
   */
  const renderCost = (cost: BuildingCost) => {
    return Object.entries(cost).map(([resource, amount]) => (
      <span key={resource} className={styles.costItem}>
        <span className={styles.costIcon}>{resourceIcons[resource as ResourceType]}</span>
        <span className={styles.costAmount}>{amount}</span>
      </span>
    ));
  };

  const buildOptions: {
    type: BuildingType;
    canBuild: boolean;
    show: boolean;
  }[] = [
    { type: 'road', canBuild: canBuildRoad, show: true },
    { type: 'settlement', canBuild: canBuildSettlement, show: true },
    { type: 'city', canBuild: canBuildCity, show: true },
    { type: 'ship', canBuild: canBuildShip, show: showShips },
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.buildMenu} ref={menuRef} role="menu">
        <div className={styles.header}>
          <h3 className={styles.title}>Build</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close build menu"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className={styles.options}>
          {buildOptions
            .filter((opt) => opt.show)
            .map(({ type, canBuild }) => {
              const config = buildingConfig[type];
              const cost = costs[type];

              return (
                <button
                  key={type}
                  className={`${styles.option} ${canBuild ? '' : styles.disabled}`}
                  onClick={() => {
                    if (canBuild) {
                      onSelect(type);
                      onClose();
                    }
                  }}
                  disabled={!canBuild}
                  role="menuitem"
                >
                  <div className={styles.optionMain}>
                    <span className={styles.optionIcon}>{config.icon}</span>
                    <span className={styles.optionLabel}>{config.label}</span>
                    <kbd className={styles.shortcut}>{config.shortcut}</kbd>
                  </div>
                  <div className={styles.optionCost}>
                    {renderCost(cost)}
                  </div>
                  {!canBuild && (
                    <span className={styles.cantAfford}>Cannot afford</span>
                  )}
                </button>
              );
            })}
        </div>

        <div className={styles.footer}>
          <span className={styles.hint}>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};

export default BuildMenu;
