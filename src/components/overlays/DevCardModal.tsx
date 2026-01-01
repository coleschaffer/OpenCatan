/**
 * DevCardModal Component
 *
 * Modal for viewing and playing development cards from the player's hand.
 * Shows all dev cards owned, their descriptions, and play restrictions.
 * Cards bought this turn are shown but disabled.
 * Only one non-VP card can be played per turn.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Modal } from './Modal';
import type { DevelopmentCardType, DevelopmentCard } from '../../types/cards';
import {
  DEVELOPMENT_CARD_NAMES,
  DEVELOPMENT_CARD_DESCRIPTIONS,
} from '../../types/cards';
import styles from './DevCardModal.module.css';

export interface DevCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Development cards in hand */
  cards: DevelopmentCard[];
  /** Current turn number */
  currentTurn: number;
  /** Whether a dev card has already been played this turn */
  hasPlayedThisTurn: boolean;
  /** Called when a card is played */
  onPlayCard: (cardType: DevelopmentCardType, cardId: string) => void;
  /** Whether it's currently the player's turn */
  isPlayerTurn: boolean;
}

/**
 * Get the icon for a development card type
 */
function getCardIcon(type: DevelopmentCardType): React.ReactNode {
  switch (type) {
    case 'knight':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L8 6v4l-4 4v4l4 4h8l4-4v-4l-4-4V6l-4-4z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      );
    case 'victoryPoint':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'roadBuilding':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19h16M4 19l3-3M4 19l3 3" />
          <path d="M20 5H4M20 5l-3-3M20 5l-3 3" />
          <line x1="12" y1="5" x2="12" y2="19" />
        </svg>
      );
    case 'yearOfPlenty':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case 'monopoly':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12M6 12h12" />
          <path d="M9 9h6M9 15h6" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Get card color based on type
 */
function getCardColor(type: DevelopmentCardType): string {
  switch (type) {
    case 'knight':
      return '#ef4444'; // Red
    case 'victoryPoint':
      return '#fbbf24'; // Yellow
    case 'roadBuilding':
      return '#3b82f6'; // Blue
    case 'yearOfPlenty':
      return '#4caf50'; // Green
    case 'monopoly':
      return '#a855f7'; // Purple
    default:
      return '#888888';
  }
}

/**
 * DevCardModal component for playing development cards
 */
export const DevCardModal: React.FC<DevCardModalProps> = ({
  isOpen,
  onClose,
  cards,
  currentTurn,
  hasPlayedThisTurn,
  onPlayCard,
  isPlayerTurn,
}) => {
  const [selectedCard, setSelectedCard] = useState<DevelopmentCard | null>(null);

  // Reset selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedCard(null);
    }
  }, [isOpen]);

  // Group cards by type
  const cardsByType = useMemo(() => {
    const grouped: Record<DevelopmentCardType, DevelopmentCard[]> = {
      knight: [],
      victoryPoint: [],
      roadBuilding: [],
      yearOfPlenty: [],
      monopoly: [],
    };

    (cards || []).forEach((card) => {
      if (!card.isPlayed) {
        grouped[card.type].push(card);
      }
    });

    return grouped;
  }, [cards]);

  // Check if a card can be played
  const canPlayCard = useCallback(
    (card: DevelopmentCard): boolean => {
      // Can't play if not player's turn
      if (!isPlayerTurn) return false;

      // Can't play cards bought this turn
      if (card.turnBought === currentTurn) return false;

      // Can't play VP cards (they reveal automatically at game end)
      if (card.type === 'victoryPoint') return false;

      // Can't play if already played a non-VP card this turn
      if (hasPlayedThisTurn) return false;

      return true;
    },
    [isPlayerTurn, currentTurn, hasPlayedThisTurn]
  );

  // Get reason why card cannot be played
  const getDisabledReason = useCallback(
    (card: DevelopmentCard): string | null => {
      if (!isPlayerTurn) return 'Not your turn';
      if (card.turnBought === currentTurn) return 'Bought this turn';
      if (card.type === 'victoryPoint') return 'Reveals at game end';
      if (hasPlayedThisTurn) return 'Already played a card this turn';
      return null;
    },
    [isPlayerTurn, currentTurn, hasPlayedThisTurn]
  );

  const handleCardClick = useCallback((card: DevelopmentCard) => {
    setSelectedCard((prev) => (prev?.id === card.id ? null : card));
  }, []);

  const handlePlay = useCallback(() => {
    if (selectedCard && canPlayCard(selectedCard)) {
      onPlayCard(selectedCard.type, selectedCard.id);
    }
  }, [selectedCard, canPlayCard, onPlayCard]);

  // Count total cards by type
  const cardCounts = useMemo(() => {
    const counts: Record<DevelopmentCardType, number> = {
      knight: 0,
      victoryPoint: 0,
      roadBuilding: 0,
      yearOfPlenty: 0,
      monopoly: 0,
    };

    (cards || []).forEach((card) => {
      if (!card.isPlayed) {
        counts[card.type]++;
      }
    });

    return counts;
  }, [cards]);

  const totalCards = (cards || []).filter((c) => !c.isPlayed).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Development Cards"
      size="medium"
    >
      <div className={styles.container}>
        {/* Stats Header */}
        <div className={styles.statsHeader}>
          <span className={styles.totalCards}>
            {totalCards} card{totalCards !== 1 ? 's' : ''} in hand
          </span>
          {hasPlayedThisTurn && isPlayerTurn && (
            <span className={styles.playedBadge}>
              Card played this turn
            </span>
          )}
        </div>

        {/* Cards Grid */}
        {totalCards === 0 ? (
          <div className={styles.emptyState}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#666666"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <p>No development cards in hand.</p>
            <p className={styles.emptyHint}>
              Buy development cards during your turn to add them here.
            </p>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {(Object.keys(cardsByType) as DevelopmentCardType[]).map((type) => {
              const typeCards = cardsByType[type];
              if (typeCards.length === 0) return null;

              return (
                <div key={type} className={styles.cardTypeGroup}>
                  {typeCards.map((card) => {
                    const isSelected = selectedCard?.id === card.id;
                    const isPlayable = canPlayCard(card);
                    const disabledReason = getDisabledReason(card);
                    const cardColor = getCardColor(card.type);
                    const isBoughtThisTurn = card.turnBought === currentTurn;

                    return (
                      <button
                        key={card.id}
                        type="button"
                        className={`
                          ${styles.cardButton}
                          ${isSelected ? styles.cardButtonSelected : ''}
                          ${!isPlayable ? styles.cardButtonDisabled : ''}
                          ${isBoughtThisTurn ? styles.cardButtonNew : ''}
                        `}
                        onClick={() => handleCardClick(card)}
                        style={{
                          '--card-color': cardColor,
                          borderColor: isSelected ? cardColor : undefined,
                        } as React.CSSProperties}
                      >
                        <div className={styles.cardIcon} style={{ color: cardColor }}>
                          {getCardIcon(card.type)}
                        </div>
                        <div className={styles.cardInfo}>
                          <span className={styles.cardName}>
                            {DEVELOPMENT_CARD_NAMES[card.type]}
                          </span>
                          {isBoughtThisTurn && (
                            <span className={styles.newBadge}>NEW</span>
                          )}
                        </div>
                        {disabledReason && (
                          <span className={styles.disabledReason}>
                            {disabledReason}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Card Detail */}
        {selectedCard && (
          <div
            className={styles.selectedDetail}
            style={{
              '--card-color': getCardColor(selectedCard.type),
            } as React.CSSProperties}
          >
            <div className={styles.detailHeader}>
              <span className={styles.detailName}>
                {DEVELOPMENT_CARD_NAMES[selectedCard.type]}
              </span>
            </div>
            <p className={styles.detailDescription}>
              {DEVELOPMENT_CARD_DESCRIPTIONS[selectedCard.type]}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className={styles.playButton}
            onClick={handlePlay}
            disabled={!selectedCard || !canPlayCard(selectedCard)}
          >
            {selectedCard
              ? canPlayCard(selectedCard)
                ? `Play ${DEVELOPMENT_CARD_NAMES[selectedCard.type]}`
                : 'Cannot Play'
              : 'Select a Card'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DevCardModal;
