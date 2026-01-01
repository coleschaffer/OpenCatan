import React, { useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import {
  selectPlayerById,
  selectLocalPlayerId,
  selectPhase,
  selectCurrentPlayerId,
  selectBuildings,
  selectRoads,
  selectDevDeckCount,
  selectBuildMode,
  setBuildMode,
  clearSelectedAction,
  openModal,
} from '@/game/state';
import { BUILDING_COSTS } from '@/game/engine/buildingManager';
import type { ResourceType } from '@/types';
import type { BuildMode } from '@/game/state/slices/uiSlice';
import styles from './BuildingToolbar.module.css';

/**
 * Building types available in the toolbar
 */
type BuildingType = 'road' | 'settlement' | 'city' | 'devCard';

/**
 * Props for BuildingToolbar
 */
interface BuildingToolbarProps {
  /** Whether the player can currently build (main phase, their turn) */
  canBuild: boolean;
  /** Whether the player can buy a dev card */
  canBuyDevCard: boolean;
  /** Callback when a building action is executed */
  onBuildingAction?: (type: BuildingType) => void;
}

/**
 * Building cost type with resources
 */
type BuildingCost = Partial<Record<ResourceType, number>>;

/**
 * Resource icons for display
 */
const RESOURCE_ICONS: Record<ResourceType, string> = {
  brick: 'B',
  lumber: 'L',
  ore: 'O',
  grain: 'G',
  wool: 'W',
};

/**
 * Resource colors for display
 */
const RESOURCE_COLORS: Record<ResourceType, string> = {
  brick: '#c45c2c',
  lumber: '#5a8f4a',
  ore: '#6b7b8a',
  grain: '#d4a634',
  wool: '#9fcc60',
};

/**
 * BuildingToolbar - Inline building icons for quick access
 *
 * Displays icon buttons for each building type:
 * - Road (grayed out if cannot afford or no valid placements)
 * - Settlement (house icon)
 * - City (castle icon)
 * - Development Card (card icon)
 *
 * Icons are highlighted when available and grayed when unavailable.
 * Clicking an available icon enters placement mode.
 */
export const BuildingToolbar: React.FC<BuildingToolbarProps> = ({
  canBuild,
  canBuyDevCard,
  onBuildingAction,
}) => {
  const dispatch = useAppDispatch();

  // Get player and game state
  const localPlayerId = useAppSelector(selectLocalPlayerId);
  const phase = useAppSelector(selectPhase);
  const currentPlayerId = useAppSelector(selectCurrentPlayerId);
  const buildMode = useAppSelector(selectBuildMode);
  const devDeckCount = useAppSelector(selectDevDeckCount);
  const player = useAppSelector((state) =>
    localPlayerId ? selectPlayerById(state, localPlayerId) : null
  );

  // Get full game state for placement calculations (we'll simplify this)
  const buildings = useAppSelector(selectBuildings);
  const roads = useAppSelector(selectRoads);

  // Check if it's the player's turn and main phase
  const isMyTurn = currentPlayerId === localPlayerId;
  const isMainPhase = phase === 'main';
  const canBuildNow = isMyTurn && isMainPhase && canBuild;

  /**
   * Check if player can afford a building
   */
  const canAfford = useCallback(
    (type: BuildingType): boolean => {
      if (!player) return false;

      let cost: BuildingCost;
      if (type === 'devCard') {
        cost = BUILDING_COSTS.developmentCard;
      } else {
        cost = BUILDING_COSTS[type];
      }

      if (!cost) return false;

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
        case 'devCard':
          return devDeckCount > 0;
        default:
          return false;
      }
    },
    [player, devDeckCount]
  );

  /**
   * Check if there are valid placements for a building type
   * This is a simplified check - the actual placement validation happens in useGameBoard
   */
  const hasValidPlacements = useCallback(
    (type: BuildingType): boolean => {
      if (!player || !localPlayerId) return false;

      switch (type) {
        case 'road':
          // Check if player has any connected roads/buildings to build from
          const playerRoads = roads.filter(r => r.playerId === localPlayerId);
          const playerBuildings = buildings.filter(b => b.playerId === localPlayerId);
          return playerBuildings.length > 0 || playerRoads.length > 0;
        case 'settlement':
          // Check if player has roads to connect to
          const myRoads = roads.filter(r => r.playerId === localPlayerId);
          return myRoads.length > 0;
        case 'city':
          // Check if player has any settlements to upgrade
          const settlements = buildings.filter(
            b => b.playerId === localPlayerId && b.type === 'settlement'
          );
          return settlements.length > 0;
        case 'devCard':
          // Always can buy if deck has cards (no placement needed)
          return true;
        default:
          return false;
      }
    },
    [player, localPlayerId, roads, buildings]
  );

  /**
   * Get the overall availability status for a building type
   */
  const getBuildingStatus = useCallback(
    (type: BuildingType): { available: boolean; reason: string } => {
      if (!canBuildNow) {
        return { available: false, reason: 'Not your turn or not main phase' };
      }
      if (!canAfford(type)) {
        return { available: false, reason: 'Cannot afford' };
      }
      if (!hasPiecesRemaining(type)) {
        return { available: false, reason: type === 'devCard' ? 'No cards left' : 'No pieces left' };
      }
      if (type !== 'devCard' && !hasValidPlacements(type)) {
        return { available: false, reason: 'No valid placements' };
      }
      return { available: true, reason: '' };
    },
    [canBuildNow, canAfford, hasPiecesRemaining, hasValidPlacements]
  );

  /**
   * Handle building button click
   */
  const handleBuildingClick = useCallback(
    (type: BuildingType) => {
      const status = getBuildingStatus(type);
      if (!status.available) return;

      if (type === 'devCard') {
        // Open dev card buy confirmation modal
        dispatch(openModal({ type: 'development-card' }));
      } else {
        // Enter build mode for the selected type
        dispatch(setBuildMode(type as BuildMode));
      }

      onBuildingAction?.(type);
    },
    [getBuildingStatus, dispatch, onBuildingAction]
  );

  /**
   * Cancel current build mode
   */
  const handleCancelBuild = useCallback(() => {
    dispatch(clearSelectedAction());
  }, [dispatch]);

  // Check if in build mode (defined early for useEffect)
  const isInBuildMode = buildMode !== 'none';

  /**
   * Keyboard shortcuts for building
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts if typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape cancels build mode
      if (event.key === 'Escape' && isInBuildMode) {
        handleCancelBuild();
        return;
      }

      // Only process shortcuts when can build
      if (!canBuildNow) return;

      const key = event.key.toLowerCase();

      switch (key) {
        case 'r':
          if (getBuildingStatus('road').available) {
            handleBuildingClick('road');
          }
          break;
        case 's':
          if (getBuildingStatus('settlement').available) {
            handleBuildingClick('settlement');
          }
          break;
        case 'c':
          if (getBuildingStatus('city').available) {
            handleBuildingClick('city');
          }
          break;
        case 'd':
          if (getBuildingStatus('devCard').available) {
            handleBuildingClick('devCard');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canBuildNow, getBuildingStatus, handleBuildingClick, handleCancelBuild, isInBuildMode]);

  /**
   * Render cost tooltip content
   */
  const renderCostTooltip = (type: BuildingType): string => {
    let cost: BuildingCost;
    if (type === 'devCard') {
      cost = BUILDING_COSTS.developmentCard;
    } else {
      cost = BUILDING_COSTS[type];
    }

    if (!cost) return '';

    return Object.entries(cost)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(', ');
  };

  // Get status for each building type
  const roadStatus = getBuildingStatus('road');
  const settlementStatus = getBuildingStatus('settlement');
  const cityStatus = getBuildingStatus('city');
  const devCardStatus = getBuildingStatus('devCard');

  // Don't render the toolbar if it's not the player's turn during main phase
  // This is a defensive check - the parent should also not render this component
  // during roll phase or other non-main phases
  if (!isMainPhase || !isMyTurn) {
    return null;
  }

  return (
    <div className={styles.buildingToolbar}>
      {/* Cancel button when in build mode */}
      {isInBuildMode && (
        <button
          className={`${styles.buildingButton} ${styles.cancelButton}`}
          onClick={handleCancelBuild}
          title="Cancel (Esc)"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      )}

      {/* Road button */}
      <button
        className={`${styles.buildingButton} ${roadStatus.available ? styles.available : styles.unavailable} ${buildMode === 'road' ? styles.active : ''}`}
        onClick={() => handleBuildingClick('road')}
        disabled={!roadStatus.available}
        title={roadStatus.available ? `Build Road (${renderCostTooltip('road')})` : roadStatus.reason}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={styles.buildingIcon}>
          <path d="M4 15V13H20V15H4ZM4 11V9H20V11H4Z" />
        </svg>
        <span className={styles.buildingLabel}>Road</span>
        <div className={styles.costBadge}>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.brick }}>1B</span>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.lumber }}>1L</span>
        </div>
      </button>

      {/* Settlement button */}
      <button
        className={`${styles.buildingButton} ${settlementStatus.available ? styles.available : styles.unavailable} ${buildMode === 'settlement' ? styles.active : ''}`}
        onClick={() => handleBuildingClick('settlement')}
        disabled={!settlementStatus.available}
        title={settlementStatus.available ? `Build Settlement (${renderCostTooltip('settlement')})` : settlementStatus.reason}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={styles.buildingIcon}>
          <path d="M12 3L2 12H5V20H19V12H22L12 3ZM12 7.7L16 11.2V18H14V14H10V18H8V11.2L12 7.7Z" />
        </svg>
        <span className={styles.buildingLabel}>Settlement</span>
        <div className={styles.costBadge}>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.brick }}>1B</span>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.lumber }}>1L</span>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.grain }}>1G</span>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.wool }}>1W</span>
        </div>
      </button>

      {/* City button */}
      <button
        className={`${styles.buildingButton} ${cityStatus.available ? styles.available : styles.unavailable} ${buildMode === 'city' ? styles.active : ''}`}
        onClick={() => handleBuildingClick('city')}
        disabled={!cityStatus.available}
        title={cityStatus.available ? `Upgrade to City (${renderCostTooltip('city')})` : cityStatus.reason}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={styles.buildingIcon}>
          <path d="M12 2L4 7V10H6V20H18V10H20V7L12 2ZM10 18V14H14V18H10ZM16 12H8V9H16V12ZM17 8H7L12 4.5L17 8Z" />
        </svg>
        <span className={styles.buildingLabel}>City</span>
        <div className={styles.costBadge}>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.ore }}>3O</span>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.grain }}>2G</span>
        </div>
      </button>

      {/* Dev Card button */}
      <button
        className={`${styles.buildingButton} ${devCardStatus.available ? styles.available : styles.unavailable}`}
        onClick={() => handleBuildingClick('devCard')}
        disabled={!devCardStatus.available}
        title={devCardStatus.available ? `Buy Dev Card (${renderCostTooltip('devCard')}) - ${devDeckCount} left` : devCardStatus.reason}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={styles.buildingIcon}>
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM12 6C9.79 6 8 7.79 8 10C8 11.18 8.55 12.24 9.4 12.95L12 16L14.6 12.95C15.45 12.24 16 11.18 16 10C16 7.79 14.21 6 12 6ZM12 11.5C11.17 11.5 10.5 10.83 10.5 10C10.5 9.17 11.17 8.5 12 8.5C12.83 8.5 13.5 9.17 13.5 10C13.5 10.83 12.83 11.5 12 11.5Z" />
        </svg>
        <span className={styles.buildingLabel}>Dev Card</span>
        <div className={styles.costBadge}>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.ore }}>1O</span>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.grain }}>1G</span>
          <span className={styles.costItem} style={{ color: RESOURCE_COLORS.wool }}>1W</span>
        </div>
        {devDeckCount > 0 && (
          <span className={styles.deckCount}>{devDeckCount}</span>
        )}
      </button>

      {/* Build mode indicator */}
      {isInBuildMode && (
        <div className={styles.buildModeIndicator}>
          <span className={styles.buildModeText}>
            Place {buildMode === 'city' ? 'City' : buildMode}
          </span>
        </div>
      )}
    </div>
  );
};

export default BuildingToolbar;
