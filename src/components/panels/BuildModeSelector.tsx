import React, { useEffect, useCallback, useRef } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectPlayerById, selectCanAfford } from '@/game/state/slices/playersSlice';
import { selectLocalPlayerId } from '@/game/state/slices/lobbySlice';
import { selectGameMode } from '@/game/state/slices/gameSlice';
import type { ResourceType, ResourceCounts } from '@/types';
import styles from './panels.module.css';

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

interface BuildModeSelectorProps {
  /** Whether the selector is open */
  isOpen: boolean;
  /** Callback when a building type is selected */
  onSelect: (type: BuildingType) => void;
  /** Callback to close the selector */
  onClose: () => void;
  /** Whether ships are available (Seafarers mode) */
  showShips?: boolean;
}

/**
 * Resource icons for cost display
 */
const RESOURCE_ICONS: Record<ResourceType, string> = {
  brick: '?',
  lumber: '?',
  ore: '?',
  grain: '?',
  wool: '?',
};

/**
 * Building icons and labels
 */
const BUILDING_CONFIG: Record<
  BuildingType,
  { icon: string; label: string; shortcut: string; description: string }
> = {
  road: {
    icon: '?',
    label: 'Road',
    shortcut: 'R',
    description: 'Connect your settlements and cities',
  },
  settlement: {
    icon: '?',
    label: 'Settlement',
    shortcut: 'S',
    description: 'Worth 1 VP, produces resources',
  },
  city: {
    icon: '?',
    label: 'City',
    shortcut: 'C',
    description: 'Upgrade a settlement, worth 2 VP',
  },
  ship: {
    icon: '?',
    label: 'Ship',
    shortcut: 'H',
    description: 'Navigate the seas (Seafarers)',
  },
};

/**
 * BuildModeSelector - Build options popup/dropdown
 *
 * Displays available building options with their costs.
 * Shows which buildings can be afforded.
 * Supports keyboard shortcuts for quick selection.
 */
export const BuildModeSelector: React.FC<BuildModeSelectorProps> = ({
  isOpen,
  onSelect,
  onClose,
  showShips = false,
}) => {
  const selectorRef = useRef<HTMLDivElement>(null);
  const localPlayerId = useAppSelector(selectLocalPlayerId);
  const gameMode = useAppSelector(selectGameMode);
  const player = useAppSelector((state) =>
    localPlayerId ? selectPlayerById(state, localPlayerId) : null
  );

  // Determine if ships should be shown based on game mode
  const displayShips = showShips || gameMode === 'seafarers';

  /**
   * Check if player can afford a building
   */
  const canAfford = useCallback(
    (type: BuildingType): boolean => {
      if (!player) return false;
      const cost = BUILDING_COSTS[type];
      return Object.entries(cost).every(
        ([resource, amount]) =>
          player.resources[resource as ResourceType] >= (amount || 0)
      );
    },
    [player]
  );

  /**
   * Check if player has pieces remaining
   */
  const hasPiecesRemaining = useCallback(
    (type: BuildingType): boolean => {
      if (!player) return false;
      switch (type) {
        case 'road':
          return player.roadsRemaining > 0;
        case 'settlement':
          return player.settlementsRemaining > 0;
        case 'city':
          return player.citiesRemaining > 0;
        case 'ship':
          return (player.shipsRemaining ?? 0) > 0;
        default:
          return false;
      }
    },
    [player]
  );

  /**
   * Get the reason why a building cannot be built
   */
  const getDisabledReason = useCallback(
    (type: BuildingType): string | null => {
      if (!player) return 'No player data';
      if (!canAfford(type)) return 'Cannot afford';
      if (!hasPiecesRemaining(type)) return 'No pieces left';
      return null;
    },
    [player, canAfford, hasPiecesRemaining]
  );

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      const key = event.key.toLowerCase();

      switch (key) {
        case 'r':
          if (canAfford('road') && hasPiecesRemaining('road')) {
            onSelect('road');
            onClose();
          }
          break;
        case 's':
          if (canAfford('settlement') && hasPiecesRemaining('settlement')) {
            onSelect('settlement');
            onClose();
          }
          break;
        case 'c':
          if (canAfford('city') && hasPiecesRemaining('city')) {
            onSelect('city');
            onClose();
          }
          break;
        case 'h':
          if (displayShips && canAfford('ship') && hasPiecesRemaining('ship')) {
            onSelect('ship');
            onClose();
          }
          break;
        case 'escape':
          onClose();
          break;
      }
    },
    [isOpen, canAfford, hasPiecesRemaining, displayShips, onSelect, onClose]
  );

  /**
   * Handle click outside to close
   */
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
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
      <span key={resource} className={styles.buildCostItem}>
        <span className={styles.buildCostIcon}>
          {RESOURCE_ICONS[resource as ResourceType]}
        </span>
        <span className={styles.buildCostAmount}>{amount}</span>
      </span>
    ));
  };

  const buildOptions: Array<{
    type: BuildingType;
    show: boolean;
  }> = [
    { type: 'road', show: true },
    { type: 'settlement', show: true },
    { type: 'city', show: true },
    { type: 'ship', show: displayShips },
  ];

  return (
    <div className={styles.buildModeSelectorOverlay}>
      <div className={styles.buildModeSelector} ref={selectorRef} role="menu">
        <div className={styles.buildSelectorHeader}>
          <h3 className={styles.buildSelectorTitle}>Build</h3>
          <button
            className={styles.buildSelectorClose}
            onClick={onClose}
            aria-label="Close build menu"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className={styles.buildOptions}>
          {buildOptions
            .filter((opt) => opt.show)
            .map(({ type }) => {
              const config = BUILDING_CONFIG[type];
              const cost = BUILDING_COSTS[type];
              const affordable = canAfford(type);
              const hasPieces = hasPiecesRemaining(type);
              const canBuild = affordable && hasPieces;
              const disabledReason = getDisabledReason(type);

              return (
                <button
                  key={type}
                  className={`${styles.buildOption} ${canBuild ? '' : styles.buildOptionDisabled}`}
                  onClick={() => {
                    if (canBuild) {
                      onSelect(type);
                      onClose();
                    }
                  }}
                  disabled={!canBuild}
                  role="menuitem"
                  title={disabledReason || config.description}
                >
                  <div className={styles.buildOptionMain}>
                    <span className={styles.buildOptionIcon}>{config.icon}</span>
                    <div className={styles.buildOptionInfo}>
                      <span className={styles.buildOptionLabel}>{config.label}</span>
                      <span className={styles.buildOptionDesc}>{config.description}</span>
                    </div>
                    <kbd className={styles.buildShortcut}>{config.shortcut}</kbd>
                  </div>

                  <div className={styles.buildOptionCost}>
                    <span className={styles.buildCostLabel}>Cost:</span>
                    {renderCost(cost)}
                  </div>

                  {!canBuild && disabledReason && (
                    <span className={styles.buildCantAfford}>{disabledReason}</span>
                  )}
                </button>
              );
            })}
        </div>

        <div className={styles.buildSelectorFooter}>
          <span className={styles.buildSelectorHint}>
            Press shortcut key or Esc to close
          </span>
        </div>
      </div>
    </div>
  );
};

export default BuildModeSelector;
