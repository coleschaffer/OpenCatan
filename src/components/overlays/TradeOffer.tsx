/**
 * TradeOffer Component
 *
 * Displays an incoming trade offer from another player.
 * Shows what they're offering, what they want, and action buttons.
 */

import React, { useCallback, useMemo } from 'react';
import { ResourceDisplay } from '../cards/ResourceDisplay';
import type { ResourceCounts, PlayerColor, TradeOffer as TradeOfferType } from '../../types';
import styles from './TradeOffer.module.css';

export interface TradeOfferProps {
  /** The trade offer */
  offer: TradeOfferType;
  /** Player who made the offer */
  from: {
    id: string;
    name: string;
    color: PlayerColor;
  };
  /** Current player's resources (to check if can afford) */
  myResources: ResourceCounts;
  /** Called when accepting the trade */
  onAccept: () => void;
  /** Called when declining the trade */
  onDecline: () => void;
  /** Called when wanting to counter-offer */
  onCounter: () => void;
  /** Whether this offer is targeted at you specifically */
  isTargeted?: boolean;
  /** Whether buttons should be disabled */
  disabled?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

/**
 * Get hex color for player color
 */
function getPlayerColorHex(color: PlayerColor): string {
  const colors: Record<PlayerColor, string> = {
    red: '#e53935',
    blue: '#1e88e5',
    orange: '#fb8c00',
    white: '#f5f5f5',
    green: '#43a047',
    purple: '#8e24aa',
    black: '#424242',
    bronze: '#a1887f',
    gold: '#ffd700',
    silver: '#b0bec5',
    pink: '#ec407a',
    mysticblue: '#4fc3f7',
  };
  return colors[color] || '#888888';
}

/**
 * Check if player can afford the requested resources
 */
function canAfford(
  myResources: ResourceCounts,
  requesting: Partial<ResourceCounts>
): boolean {
  return Object.entries(requesting).every(([resource, amount]) => {
    if (!amount) return true;
    return myResources[resource as keyof ResourceCounts] >= amount;
  });
}

/**
 * TradeOffer component
 */
export const TradeOffer: React.FC<TradeOfferProps> = ({
  offer,
  from,
  myResources,
  onAccept,
  onDecline,
  onCounter,
  isTargeted = false,
  disabled = false,
  compact = false,
}) => {
  const playerColorHex = getPlayerColorHex(from.color);

  const canAffordTrade = useMemo(
    () => canAfford(myResources, offer.requesting),
    [myResources, offer.requesting]
  );

  const handleAccept = useCallback(() => {
    if (!disabled && canAffordTrade) {
      onAccept();
    }
  }, [disabled, canAffordTrade, onAccept]);

  const handleDecline = useCallback(() => {
    if (!disabled) {
      onDecline();
    }
  }, [disabled, onDecline]);

  const handleCounter = useCallback(() => {
    if (!disabled) {
      onCounter();
    }
  }, [disabled, onCounter]);

  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''} ${isTargeted ? styles.targeted : ''}`}
      style={{ '--player-color': playerColorHex } as React.CSSProperties}
    >
      {/* Header */}
      <div className={styles.header}>
        <span
          className={styles.playerColorDot}
          style={{ backgroundColor: playerColorHex }}
        />
        <span className={styles.playerName} style={{ color: playerColorHex }}>
          {from.name}
        </span>
        <span className={styles.headerText}>
          {isTargeted ? 'wants to trade with you' : 'offers a trade'}
        </span>
      </div>

      {/* Trade Details */}
      <div className={styles.tradeDetails}>
        <div className={styles.tradeSection}>
          <span className={styles.sectionLabel}>They Offer</span>
          <ResourceDisplay
            resources={offer.offering}
            size={compact ? 'small' : 'medium'}
            colored
          />
        </div>

        <div className={styles.tradeDivider}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 16V4M7 4L3 8M7 4L11 8" />
            <path d="M17 8V20M17 20L21 16M17 20L13 16" />
          </svg>
        </div>

        <div className={styles.tradeSection}>
          <span className={styles.sectionLabel}>They Want</span>
          <ResourceDisplay
            resources={offer.requesting}
            size={compact ? 'small' : 'medium'}
            colored
          />
        </div>
      </div>

      {/* Affordability Notice */}
      {!canAffordTrade && (
        <div className={styles.cannotAfford}>
          You don't have enough resources to accept this trade
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.declineButton}
          onClick={handleDecline}
          disabled={disabled}
        >
          Decline
        </button>
        <button
          type="button"
          className={styles.counterButton}
          onClick={handleCounter}
          disabled={disabled}
        >
          Counter
        </button>
        <button
          type="button"
          className={styles.acceptButton}
          onClick={handleAccept}
          disabled={disabled || !canAffordTrade}
        >
          Accept
        </button>
      </div>
    </div>
  );
};

/**
 * Mini trade offer display for notification/list views
 */
export interface MiniTradeOfferProps {
  offer: TradeOfferType;
  from: {
    name: string;
    color: PlayerColor;
  };
  onClick?: () => void;
}

export const MiniTradeOffer: React.FC<MiniTradeOfferProps> = ({
  offer,
  from,
  onClick,
}) => {
  const playerColorHex = getPlayerColorHex(from.color);

  return (
    <button
      type="button"
      className={styles.miniOffer}
      onClick={onClick}
      style={{ '--player-color': playerColorHex } as React.CSSProperties}
    >
      <span
        className={styles.miniPlayerDot}
        style={{ backgroundColor: playerColorHex }}
      />
      <span className={styles.miniPlayerName}>{from.name}</span>
      <span className={styles.miniArrow}>:</span>
      <ResourceDisplay resources={offer.offering} size="small" compact />
      <span className={styles.miniFor}>for</span>
      <ResourceDisplay resources={offer.requesting} size="small" compact />
    </button>
  );
};

export default TradeOffer;
