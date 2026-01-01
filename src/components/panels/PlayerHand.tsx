// @ts-nocheck
// TODO: Fix TypeScript errors in this file
import React, { useCallback, useMemo, useState } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectPlayerById, selectCanPlayDevCard } from '@/game/state/slices/playersSlice';
import { selectLocalPlayerId } from '@/game/state/slices/lobbySlice';
import { selectPhase, selectDevCardPlayedThisTurn } from '@/game/state/slices/gameSlice';
import type { ResourceType, DevelopmentCard, DevelopmentCardType, PlayerColor } from '@/types';
import styles from './panels.module.css';

interface PlayerHandProps {
  /** Callback when a development card is clicked to play it */
  onPlayDevCard?: (cardId: string, cardType: DevelopmentCardType) => void;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Resource display configuration with SVG cards
 */
const RESOURCE_CONFIG: Record<
  ResourceType,
  { label: string; image: string; color: string }
> = {
  brick: { label: 'Brick', image: '/assets/cards/card_brick.svg', color: '#d84315' },
  lumber: { label: 'Wood', image: '/assets/cards/card_lumber.svg', color: '#5d4037' },
  ore: { label: 'Ore', image: '/assets/cards/card_ore.svg', color: '#78909c' },
  grain: { label: 'Wheat', image: '/assets/cards/card_grain.svg', color: '#fbc02d' },
  wool: { label: 'Sheep', image: '/assets/cards/card_wool.svg', color: '#81c784' },
};

/**
 * Development card display configuration with SVG images
 */
const DEV_CARD_CONFIG: Record<
  DevelopmentCardType,
  { label: string; color: string; image: string; description: string }
> = {
  knight: {
    label: 'Knight',
    color: '#7b1fa2',
    image: '/assets/cards/card_knight.svg',
    description: 'Move the robber and steal a resource',
  },
  victoryPoint: {
    label: 'Victory Point',
    color: '#ffd700',
    image: '/assets/cards/card_victorypoint.svg',
    description: 'Worth 1 VP (revealed at game end)',
  },
  roadBuilding: {
    label: 'Road Building',
    color: '#1565c0',
    image: '/assets/cards/card_roadbuilding.svg',
    description: 'Build 2 roads for free',
  },
  yearOfPlenty: {
    label: 'Year of Plenty',
    color: '#2e7d32',
    image: '/assets/cards/card_yearofplenty.svg',
    description: 'Take any 2 resources from the bank',
  },
  monopoly: {
    label: 'Monopoly',
    color: '#e65100',
    image: '/assets/cards/card_monopoly.svg',
    description: 'Take all of one resource type from all players',
  },
};

/**
 * Purchase item configuration with costs and building assets
 */
type PurchaseType = 'road' | 'settlement' | 'city' | 'devCard';

interface PurchaseCost {
  brick?: number;
  lumber?: number;
  ore?: number;
  grain?: number;
  wool?: number;
}

interface PurchaseConfig {
  label: string;
  costs: PurchaseCost;
  getBuildingImage: (color: PlayerColor) => string;
}

const PURCHASE_CONFIG: Record<PurchaseType, PurchaseConfig> = {
  road: {
    label: 'Road',
    costs: { brick: 1, lumber: 1 },
    getBuildingImage: (color: PlayerColor) => `/assets/buildings/road_${color}.svg`,
  },
  settlement: {
    label: 'Settlement',
    costs: { brick: 1, lumber: 1, wool: 1, grain: 1 },
    getBuildingImage: (color: PlayerColor) => `/assets/buildings/settlement_${color}.svg`,
  },
  city: {
    label: 'City',
    costs: { ore: 3, grain: 2 },
    getBuildingImage: (color: PlayerColor) => `/assets/pieces/city_${color}.svg`,
  },
  devCard: {
    label: 'Dev Card',
    costs: { ore: 1, wool: 1, grain: 1 },
    getBuildingImage: () => '/assets/cards/card_devcardback.svg',
  },
};

/**
 * PlayerHand - Current player's resource and development cards display
 *
 * Displays:
 * - Resource cards with counts (brick, lumber, ore, grain, wool)
 * - Development cards (show types you own)
 * - Click dev card to play it
 * - Visual styling matching Colonist
 */
export const PlayerHand: React.FC<PlayerHandProps> = ({
  onPlayDevCard,
  className,
}) => {
  const localPlayerId = useAppSelector(selectLocalPlayerId);
  const player = useAppSelector((state) =>
    localPlayerId ? selectPlayerById(state, localPlayerId) : null
  );
  const phase = useAppSelector(selectPhase);
  const devCardPlayedThisTurn = useAppSelector(selectDevCardPlayedThisTurn);
  const canPlayDevCards = useAppSelector((state) =>
    localPlayerId ? selectCanPlayDevCard(state, localPlayerId) : false
  );

  const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];

  /**
   * Check if a dev card can be played right now
   */
  const isDevCardPlayable = useCallback(
    (card: DevelopmentCard): boolean => {
      // Can't play if already played
      if (card.isPlayed) return false;
      // Can't play VP cards - they reveal at game end
      if (card.type === 'victoryPoint') return false;
      // Can't play if purchased this turn
      if (player?.devCardsBoughtThisTurn.includes(card.id)) return false;
      // Can't play if already played a dev card this turn
      if (devCardPlayedThisTurn) return false;
      // Can only play during main phase (or before rolling for knight)
      if (phase !== 'main' && !(phase === 'roll' && card.type === 'knight')) {
        return false;
      }
      return true;
    },
    [player, devCardPlayedThisTurn, phase]
  );

  /**
   * Handle dev card click
   */
  const handleDevCardClick = useCallback(
    (card: DevelopmentCard) => {
      if (isDevCardPlayable(card) && onPlayDevCard) {
        onPlayDevCard(card.id, card.type);
      }
    },
    [isDevCardPlayable, onPlayDevCard]
  );

  /**
   * Calculate total resources
   */
  const totalResources = useMemo(() => {
    if (!player) return 0;
    return Object.values(player.resources).reduce((sum, count) => sum + count, 0);
  }, [player]);

  /**
   * Group dev cards by type for display
   */
  const groupedDevCards = useMemo(() => {
    if (!player) return {};
    const groups: Record<DevelopmentCardType, DevelopmentCard[]> = {} as any;
    (player.developmentCards || []).forEach((card) => {
      if (!groups[card.type]) {
        groups[card.type] = [];
      }
      groups[card.type].push(card);
    });
    return groups;
  }, [player]);

  // Track which purchase button is being hovered for tooltip
  const [hoveredPurchase, setHoveredPurchase] = useState<PurchaseType | null>(null);

  /**
   * Check if player can afford a purchase
   */
  const canAfford = useCallback(
    (costs: PurchaseCost): boolean => {
      if (!player) return false;
      return Object.entries(costs).every(
        ([resource, amount]) => player.resources[resource as ResourceType] >= (amount || 0)
      );
    },
    [player]
  );

  /**
   * Check if player has at least one of a resource
   */
  const hasResource = useCallback(
    (resource: ResourceType): boolean => {
      if (!player) return false;
      return player.resources[resource] > 0;
    },
    [player]
  );

  if (!player) {
    return null;
  }

  // Get resources that have cards (count > 0)
  const activeResources = resourceTypes.filter(type => player.resources[type] > 0);

  // Purchase types to display
  const purchaseTypes: PurchaseType[] = ['road', 'settlement', 'city', 'devCard'];

  return (
    <div className={`${styles.playerHand} ${className || ''}`}>
      {/* Resource cards section - stacking card design with SVG images */}
      <div className={styles.resourceStacks}>
        {activeResources.map((type) => {
            const config = RESOURCE_CONFIG[type];
            const count = player.resources[type];
            // Limit visual stack to 5 cards max for performance
            const visualCount = Math.min(count, 5);
            const cardOffset = 8; // pixels between stacked cards

            return (
              <div
                key={type}
                className={styles.resourceStack}
                title={`${config.label}: ${count}`}
                style={{
                  width: `${48 + (visualCount - 1) * cardOffset}px`,
                }}
              >
                {/* Render stacked cards */}
                {Array.from({ length: visualCount }).map((_, i) => (
                  <div
                    key={i}
                    className={styles.stackedCard}
                    style={{
                      left: `${i * cardOffset}px`,
                      zIndex: i,
                    } as React.CSSProperties}
                  >
                    <img
                      src={config.image}
                      alt={config.label}
                      className={styles.cardImage}
                    />
                  </div>
                ))}
                {/* Count badge */}
                <div className={styles.stackCount}>{count}</div>
              </div>
            );
          })}
      </div>

      {/* Purchase buttons section */}
      <div className={styles.purchaseButtons}>
        {purchaseTypes.map((purchaseType) => {
          const config = PURCHASE_CONFIG[purchaseType];
          const affordable = canAfford(config.costs);

          return (
            <div
              key={purchaseType}
              className={styles.purchaseButtonWrapper}
              onMouseEnter={() => setHoveredPurchase(purchaseType)}
              onMouseLeave={() => setHoveredPurchase(null)}
            >
              <button
                className={`${styles.purchaseButton} ${affordable ? styles.purchaseButtonAffordable : ''}`}
                disabled={!affordable}
              >
                <img
                  src={config.getBuildingImage(player.color as PlayerColor)}
                  alt={config.label}
                  className={styles.purchaseButtonImage}
                />
              </button>

              {/* Cost tooltip on hover */}
              {hoveredPurchase === purchaseType && (
                <div className={styles.purchaseCostTooltip}>
                  <div className={styles.purchaseCostTitle}>{config.label} Cost:</div>
                  <div className={styles.purchaseCostResources}>
                    {Object.entries(config.costs).map(([resource, amount]) => {
                      const resourceConfig = RESOURCE_CONFIG[resource as ResourceType];
                      const owned = hasResource(resource as ResourceType);
                      return (
                        <div
                          key={resource}
                          className={`${styles.purchaseCostItem} ${owned ? styles.purchaseCostOwned : ''}`}
                        >
                          <img
                            src={resourceConfig.image}
                            alt={resourceConfig.label}
                            className={styles.purchaseCostImage}
                          />
                          <span className={styles.purchaseCostAmount}>x{amount}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Development cards section - compact inline with SVG images */}
      {(player.developmentCards || []).length > 0 && (
        <div className={styles.devCardStacks}>
          {Object.entries(groupedDevCards).map(([type, cards]) => {
            const config = DEV_CARD_CONFIG[type as DevelopmentCardType];
            const playableCards = cards.filter(isDevCardPlayable);
            const hasPlayable = playableCards.length > 0;

            return (
              <button
                key={type}
                className={`${styles.devCardStack} ${hasPlayable ? styles.devCardStackPlayable : ''}`}
                onClick={() => {
                  if (hasPlayable && playableCards[0]) {
                    handleDevCardClick(playableCards[0]);
                  }
                }}
                disabled={!hasPlayable}
                title={hasPlayable ? `Play: ${config.description}` : config.description}
              >
                <img
                  src={config.image}
                  alt={config.label}
                  className={styles.devCardImage}
                  onError={(e) => {
                    // Fallback to dev card back if specific image not found
                    (e.target as HTMLImageElement).src = '/assets/cards/card_devcardback.svg';
                  }}
                />
                <span className={styles.devStackCount}>{cards.length}</span>
                {hasPlayable && <span className={styles.devStackPlayable}>!</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayerHand;
