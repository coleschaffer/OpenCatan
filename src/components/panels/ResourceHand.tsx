import React from 'react';
import styles from './ResourceHand.module.css';

/**
 * Resource types in the game
 */
export type ResourceType = 'brick' | 'lumber' | 'ore' | 'grain' | 'wool';

/**
 * Development card types
 */
export type DevCardType =
  | 'knight'
  | 'victoryPoint'
  | 'roadBuilding'
  | 'yearOfPlenty'
  | 'monopoly';

/**
 * Development card data
 */
export interface DevCard {
  id: string;
  type: DevCardType;
  /** Whether the card was purchased this turn (can't play yet) */
  purchasedThisTurn: boolean;
  /** Whether the card has been played */
  played: boolean;
}

/**
 * Resource amounts by type
 */
export type Resources = Record<ResourceType, number>;

interface ResourceHandProps {
  /** Current resource counts */
  resources: Resources;
  /** Development cards in hand */
  devCards: DevCard[];
  /** Callback when a card is clicked */
  onCardClick?: (type: 'resource' | 'devCard', id: string) => void;
  /** Whether any dev card has been played this turn (can only play one) */
  devCardPlayedThisTurn?: boolean;
  /** Current game phase - affects which cards are playable */
  phase?: string;
}

/**
 * Resource display configuration
 */
const resourceConfig: Record<
  ResourceType,
  { label: string; color: string; icon: string }
> = {
  brick: { label: 'Brick', color: '#c62828', icon: '🧱' },
  lumber: { label: 'Lumber', color: '#4e342e', icon: '🪵' },
  ore: { label: 'Ore', color: '#546e7a', icon: '⛰️' },
  grain: { label: 'Grain', color: '#f9a825', icon: '🌾' },
  wool: { label: 'Wool', color: '#66bb6a', icon: '🐑' },
};

/**
 * Development card display configuration
 */
const devCardConfig: Record<
  DevCardType,
  { label: string; color: string; description: string }
> = {
  knight: {
    label: 'Knight',
    color: '#7b1fa2',
    description: 'Move the robber and steal a resource',
  },
  victoryPoint: {
    label: 'Victory Point',
    color: '#ffd700',
    description: 'Worth 1 VP (revealed at game end)',
  },
  roadBuilding: {
    label: 'Road Building',
    color: '#1565c0',
    description: 'Build 2 roads for free',
  },
  yearOfPlenty: {
    label: 'Year of Plenty',
    color: '#2e7d32',
    description: 'Take any 2 resources from the bank',
  },
  monopoly: {
    label: 'Monopoly',
    color: '#e65100',
    description: 'Take all of one resource type from all players',
  },
};

/**
 * ResourceHand - Current player's cards display
 *
 * Displays the local player's resource cards with counts and
 * development cards (face up). Highlights playable dev cards
 * and handles click events for playing/selecting cards.
 *
 * @param resources - Resource counts
 * @param devCards - Development cards in hand
 * @param onCardClick - Click handler
 * @param devCardPlayedThisTurn - Whether a dev card was played this turn
 * @param phase - Current game phase
 */
export const ResourceHand: React.FC<ResourceHandProps> = ({
  resources,
  devCards,
  onCardClick,
  devCardPlayedThisTurn = false,
  phase = 'main',
}) => {
  const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];
  const totalResources = Object.values(resources).reduce((sum, count) => sum + count, 0);

  /**
   * Check if a dev card can be played right now
   */
  const isDevCardPlayable = (card: DevCard): boolean => {
    // Can't play if already played
    if (card.played) return false;
    // Can't play VP cards
    if (card.type === 'victoryPoint') return false;
    // Can't play if purchased this turn
    if (card.purchasedThisTurn) return false;
    // Can't play if already played a dev card this turn
    if (devCardPlayedThisTurn) return false;
    // Can only play during main phase
    if (phase !== 'main') return false;
    return true;
  };

  const handleResourceClick = (type: ResourceType) => {
    if (onCardClick && resources[type] > 0) {
      onCardClick('resource', type);
    }
  };

  const handleDevCardClick = (card: DevCard) => {
    if (onCardClick) {
      onCardClick('devCard', card.id);
    }
  };

  return (
    <div className={styles.resourceHand}>
      {/* Resource cards section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Resources</h3>
          <span className={styles.totalCount}>{totalResources} cards</span>
        </div>

        <div className={styles.resourceGrid}>
          {resourceTypes.map((type) => {
            const config = resourceConfig[type];
            const count = resources[type];

            return (
              <button
                key={type}
                className={`${styles.resourceCard} ${count === 0 ? styles.empty : ''}`}
                onClick={() => handleResourceClick(type)}
                disabled={count === 0}
                style={{ '--resource-color': config.color } as React.CSSProperties}
                title={config.label}
              >
                <span className={styles.resourceIcon}>{config.icon}</span>
                <span className={styles.resourceCount}>{count}</span>
                <span className={styles.resourceLabel}>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Development cards section */}
      {devCards.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Development Cards</h3>
            <span className={styles.totalCount}>{devCards.length} cards</span>
          </div>

          <div className={styles.devCardList}>
            {devCards.map((card) => {
              const config = devCardConfig[card.type];
              const playable = isDevCardPlayable(card);

              return (
                <button
                  key={card.id}
                  className={`${styles.devCard} ${playable ? styles.playable : ''} ${card.purchasedThisTurn ? styles.newCard : ''}`}
                  onClick={() => handleDevCardClick(card)}
                  style={{ '--card-color': config.color } as React.CSSProperties}
                  title={playable ? `Play: ${config.description}` : config.description}
                  disabled={card.played}
                >
                  <div className={styles.devCardContent}>
                    <span className={styles.devCardName}>{config.label}</span>
                    {card.purchasedThisTurn && (
                      <span className={styles.newBadge}>New</span>
                    )}
                  </div>
                  {playable && (
                    <span className={styles.playHint}>Click to play</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty dev cards message */}
      {devCards.length === 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Development Cards</h3>
          </div>
          <p className={styles.emptyMessage}>No development cards yet</p>
        </div>
      )}
    </div>
  );
};

export default ResourceHand;
