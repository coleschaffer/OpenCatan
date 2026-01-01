/**
 * IncomingTradeNotification Component
 *
 * A floating notification that appears when a trade offer is received.
 * Allows quick accept/decline without opening the full trade panel.
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../game/state/store';
import { useTrade } from '../../hooks/useTrade';
import { openModal } from '../../game/state/slices/uiSlice';
import type { TradeOfferExtended } from '../../game/state/slices/tradeSlice';
import type { ResourceType, PlayerColor, ResourceCounts } from '../../types';
import styles from './IncomingTradeNotification.module.css';

// ============================================================================
// Types
// ============================================================================

export interface IncomingTradeNotificationProps {
  /** Position on screen */
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  /** Maximum notifications to show */
  maxVisible?: number;
}

// ============================================================================
// Helper Components
// ============================================================================

const RESOURCE_COLORS: Record<ResourceType, string> = {
  brick: '#c0392b',
  lumber: '#27ae60',
  ore: '#7f8c8d',
  grain: '#f39c12',
  wool: '#a8d5a2',
};

const RESOURCE_ICONS: Record<ResourceType, string> = {
  brick: 'B',
  lumber: 'L',
  ore: 'O',
  grain: 'G',
  wool: 'W',
};

const PLAYER_COLORS: Record<PlayerColor, string> = {
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

interface ResourceChipProps {
  resource: ResourceType;
  amount: number;
}

const ResourceChip: React.FC<ResourceChipProps> = ({ resource, amount }) => {
  if (amount <= 0) return null;

  return (
    <span
      className={styles.resourceChip}
      style={{ backgroundColor: RESOURCE_COLORS[resource] }}
      title={`${amount} ${resource}`}
    >
      <span className={styles.resourceIcon}>{RESOURCE_ICONS[resource]}</span>
      <span className={styles.resourceAmount}>{amount}</span>
    </span>
  );
};

interface ResourcesDisplayProps {
  resources: Partial<ResourceCounts>;
}

const ResourcesDisplay: React.FC<ResourcesDisplayProps> = ({ resources }) => {
  const entries = Object.entries(resources).filter(([, amount]) => (amount || 0) > 0);

  if (entries.length === 0) {
    return <span className={styles.nothing}>Nothing</span>;
  }

  return (
    <div className={styles.resourcesRow}>
      {entries.map(([resource, amount]) => (
        <ResourceChip key={resource} resource={resource as ResourceType} amount={amount || 0} />
      ))}
    </div>
  );
};

// ============================================================================
// Single Notification Card
// ============================================================================

interface NotificationCardProps {
  offer: TradeOfferExtended;
  senderName: string;
  senderColor: PlayerColor;
  onAccept: () => void;
  onDecline: () => void;
  onCounter: () => void;
  canAccept: boolean;
  timeRemaining: number;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  offer,
  senderName,
  senderColor,
  onAccept,
  onDecline,
  onCounter,
  canAccept,
  timeRemaining,
}) => {
  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / offer.timeoutMs) * 100));

  return (
    <div className={styles.notificationCard}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header */}
      <div className={styles.header}>
        <span
          className={styles.playerDot}
          style={{ backgroundColor: PLAYER_COLORS[senderColor] }}
        />
        <span className={styles.senderName}>{senderName}</span>
        <span className={styles.wantsTrade}>wants to trade</span>
      </div>

      {/* Trade Details */}
      <div className={styles.tradeDetails}>
        <div className={styles.tradeRow}>
          <span className={styles.tradeLabel}>You get:</span>
          <ResourcesDisplay resources={offer.offering} />
        </div>
        <div className={styles.tradeRow}>
          <span className={styles.tradeLabel}>They get:</span>
          <ResourcesDisplay resources={offer.requesting} />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.acceptBtn}`}
          onClick={onAccept}
          disabled={!canAccept}
          title={canAccept ? 'Accept this trade' : 'Not enough resources'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.counterBtn}`}
          onClick={onCounter}
          title="Make a counter-offer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16l-4-4 4-4" />
            <path d="M17 8l4 4-4 4" />
            <path d="M3 12h18" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.declineBtn}`}
          onClick={onDecline}
          title="Decline this trade"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const IncomingTradeNotification: React.FC<IncomingTradeNotificationProps> = ({
  position = 'top-right',
  maxVisible = 3,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const players = useSelector((state: RootState) => state.players.players);

  const {
    incomingOffers,
    myResources,
    acceptTradeOffer,
    declineTradeOffer,
  } = useTrade();

  // Track time remaining for each offer
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  // Update time remaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimes: Record<string, number> = {};

      incomingOffers.forEach(offer => {
        if (offer.timeoutMs > 0) {
          const elapsed = now - offer.createdAt;
          newTimes[offer.id] = Math.max(0, offer.timeoutMs - elapsed);
        } else {
          newTimes[offer.id] = Infinity;
        }
      });

      setTimeRemaining(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingOffers]);

  // Get player info
  const getPlayerInfo = useCallback((playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return {
      name: player?.name || 'Unknown',
      color: player?.color || 'white' as PlayerColor,
    };
  }, [players]);

  // Check if player can accept an offer
  const canAcceptOffer = useCallback((offer: TradeOfferExtended): boolean => {
    for (const [resource, amount] of Object.entries(offer.requesting)) {
      if ((amount || 0) > (myResources[resource as ResourceType] || 0)) {
        return false;
      }
    }
    return true;
  }, [myResources]);

  // Handle counter-offer
  const handleCounter = useCallback((offer: TradeOfferExtended) => {
    dispatch(openModal({
      type: 'trade',
      data: {
        counterOfferData: {
          originalOfferId: offer.id,
          toPlayerId: offer.fromPlayerId,
          offering: offer.requesting,
          requesting: offer.offering,
        },
      },
    }));
  }, [dispatch]);

  // Limit visible offers
  const visibleOffers = useMemo(() => {
    return incomingOffers.slice(0, maxVisible);
  }, [incomingOffers, maxVisible]);

  // Don't render if no offers
  if (visibleOffers.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.container} ${styles[position]}`}>
      {visibleOffers.map(offer => {
        const senderInfo = getPlayerInfo(offer.fromPlayerId);
        return (
          <NotificationCard
            key={offer.id}
            offer={offer}
            senderName={senderInfo.name}
            senderColor={senderInfo.color}
            onAccept={() => acceptTradeOffer(offer.id)}
            onDecline={() => declineTradeOffer(offer.id)}
            onCounter={() => handleCounter(offer)}
            canAccept={canAcceptOffer(offer)}
            timeRemaining={timeRemaining[offer.id] || offer.timeoutMs}
          />
        );
      })}

      {/* Overflow indicator */}
      {incomingOffers.length > maxVisible && (
        <div className={styles.overflowIndicator}>
          +{incomingOffers.length - maxVisible} more offer{incomingOffers.length - maxVisible > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default IncomingTradeNotification;
