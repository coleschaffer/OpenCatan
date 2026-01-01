/**
 * TradePanel Component
 *
 * A compact panel for managing trades during gameplay.
 * Shows trade button, active offers, and incoming offer notifications.
 */

import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../game/state/store';
import { useTrade } from '../../hooks/useTrade';
import { openModal } from '../../game/state/slices/uiSlice';
import type { TradeOfferExtended } from '../../game/state/slices/tradeSlice';
import type { ResourceType, PlayerColor } from '../../types';
import styles from './TradePanel.module.css';

// ============================================================================
// Types
// ============================================================================

export interface TradePanelProps {
  /** Compact mode for smaller displays */
  compact?: boolean;
}

// ============================================================================
// Helper Components
// ============================================================================

interface ResourceBadgeProps {
  resource: ResourceType;
  amount: number;
  size?: 'small' | 'medium';
}

const ResourceBadge: React.FC<ResourceBadgeProps> = ({ resource, amount, size = 'small' }) => {
  if (amount <= 0) return null;

  const RESOURCE_COLORS: Record<ResourceType, string> = {
    brick: '#c0392b',
    lumber: '#27ae60',
    ore: '#7f8c8d',
    grain: '#f39c12',
    wool: '#a8d5a2',
  };

  return (
    <span
      className={`${styles.resourceBadge} ${styles[size]}`}
      style={{ backgroundColor: RESOURCE_COLORS[resource] }}
      title={`${amount} ${resource}`}
    >
      {amount}
    </span>
  );
};

interface ResourceListProps {
  resources: Partial<Record<ResourceType, number>>;
  size?: 'small' | 'medium';
}

const ResourceList: React.FC<ResourceListProps> = ({ resources, size = 'small' }) => {
  const entries = Object.entries(resources).filter(([, amount]) => (amount || 0) > 0);

  if (entries.length === 0) return <span className={styles.noResources}>Nothing</span>;

  return (
    <span className={styles.resourceList}>
      {entries.map(([resource, amount], index) => (
        <React.Fragment key={resource}>
          <ResourceBadge resource={resource as ResourceType} amount={amount || 0} size={size} />
          {index < entries.length - 1 && <span className={styles.resourceSeparator}>+</span>}
        </React.Fragment>
      ))}
    </span>
  );
};

interface PlayerColorDotProps {
  color: PlayerColor;
}

const PlayerColorDot: React.FC<PlayerColorDotProps> = ({ color }) => {
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

  return (
    <span
      className={styles.playerDot}
      style={{ backgroundColor: PLAYER_COLORS[color] }}
    />
  );
};

// ============================================================================
// Incoming Offer Card
// ============================================================================

interface IncomingOfferCardProps {
  offer: TradeOfferExtended;
  senderName: string;
  senderColor: PlayerColor;
  onAccept: () => void;
  onDecline: () => void;
  onCounter: () => void;
  canAccept: boolean;
}

const IncomingOfferCard: React.FC<IncomingOfferCardProps> = ({
  offer,
  senderName,
  senderColor,
  onAccept,
  onDecline,
  onCounter,
  canAccept,
}) => {
  return (
    <div className={styles.incomingOffer}>
      <div className={styles.offerHeader}>
        <PlayerColorDot color={senderColor} />
        <span className={styles.senderName}>{senderName}</span>
        <span className={styles.offerLabel}>offers:</span>
      </div>

      <div className={styles.offerDetails}>
        <div className={styles.offerSide}>
          <span className={styles.offerDirection}>You get:</span>
          <ResourceList resources={offer.offering} size="medium" />
        </div>
        <div className={styles.offerArrow}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16L12 21L17 16" />
            <path d="M7 8L12 3L17 8" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
        </div>
        <div className={styles.offerSide}>
          <span className={styles.offerDirection}>They get:</span>
          <ResourceList resources={offer.requesting} size="medium" />
        </div>
      </div>

      <div className={styles.offerActions}>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.acceptButton}`}
          onClick={onAccept}
          disabled={!canAccept}
          title={canAccept ? 'Accept trade' : 'You do not have enough resources'}
        >
          Accept
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.counterButton}`}
          onClick={onCounter}
          title="Make a counter-offer"
        >
          Counter
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.declineButton}`}
          onClick={onDecline}
          title="Decline trade"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Outgoing Offer Card
// ============================================================================

interface OutgoingOfferCardProps {
  offer: TradeOfferExtended;
  onCancel: () => void;
}

const OutgoingOfferCard: React.FC<OutgoingOfferCardProps> = ({ offer, onCancel }) => {
  const declineCount = offer.declinedBy.length;
  const counterCount = Object.keys(offer.counterOffers).length;

  return (
    <div className={styles.outgoingOffer}>
      <div className={styles.offerContent}>
        <ResourceList resources={offer.offering} />
        <span className={styles.forLabel}>for</span>
        <ResourceList resources={offer.requesting} />
      </div>
      <div className={styles.offerStatus}>
        {declineCount > 0 && (
          <span className={styles.declineCount}>{declineCount} declined</span>
        )}
        {counterCount > 0 && (
          <span className={styles.counterCount}>{counterCount} countered</span>
        )}
      </div>
      <button
        type="button"
        className={styles.cancelOfferButton}
        onClick={onCancel}
        title="Cancel offer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

// ============================================================================
// Main TradePanel Component
// ============================================================================

export const TradePanel: React.FC<TradePanelProps> = ({ compact = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const players = useSelector((state: RootState) => state.players.players);
  const localPlayerId = useSelector((state: RootState) => state.lobby.localPlayerId);

  const {
    canTrade,
    openTrade,
    outgoingOffers,
    incomingOffers,
    myResources,
    acceptTradeOffer,
    declineTradeOffer,
    cancelTradeOffer,
    tradeRates,
    hasAnyPort,
  } = useTrade();

  // Get player info helper
  const getPlayerInfo = useCallback((playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return {
      name: player?.name || 'Unknown',
      color: player?.color || 'white' as PlayerColor,
    };
  }, [players]);

  // Check if player can accept an offer
  const canAcceptOffer = useCallback((offer: TradeOfferExtended): boolean => {
    // Player needs to have the resources the offerer is requesting
    for (const [resource, amount] of Object.entries(offer.requesting)) {
      if ((amount || 0) > (myResources[resource as ResourceType] || 0)) {
        return false;
      }
    }
    return true;
  }, [myResources]);

  // Handle counter-offer - opens trade modal with pre-filled data
  const handleCounter = useCallback((offer: TradeOfferExtended) => {
    // Dispatch to set up counter-offer data and open trade modal
    dispatch(openModal({
      type: 'trade',
      data: {
        counterOfferData: {
          originalOfferId: offer.id,
          toPlayerId: offer.fromPlayerId,
          // Swap offering and requesting for counter-offer
          offering: offer.requesting,
          requesting: offer.offering,
        },
      },
    }));
  }, [dispatch]);

  // Determine best port rate for display
  const bestRate = useMemo(() => {
    const rates = Object.values(tradeRates);
    return Math.min(...rates);
  }, [tradeRates]);

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* Trade Button */}
      <div className={styles.tradeButtonSection}>
        <button
          type="button"
          className={styles.tradeButton}
          onClick={openTrade}
          disabled={!canTrade}
          title={canTrade ? 'Open trade menu' : 'You can only trade during your main phase'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 16l-4-4 4-4" />
            <path d="M17 8l4 4-4 4" />
            <path d="M3 12h18" />
          </svg>
          Trade
        </button>

        {/* Port indicator */}
        {hasAnyPort && (
          <span className={styles.portIndicator} title="You have port access">
            {bestRate}:1
          </span>
        )}

        {/* Incoming offers badge */}
        {incomingOffers.length > 0 && (
          <span className={styles.incomingBadge}>
            {incomingOffers.length}
          </span>
        )}
      </div>

      {/* Outgoing Offers */}
      {outgoingOffers.length > 0 && (
        <div className={styles.outgoingSection}>
          <h4 className={styles.sectionTitle}>Your Offers</h4>
          <div className={styles.offersList}>
            {outgoingOffers.map(offer => (
              <OutgoingOfferCard
                key={offer.id}
                offer={offer}
                onCancel={() => cancelTradeOffer(offer.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Incoming Offers */}
      {incomingOffers.length > 0 && (
        <div className={styles.incomingSection}>
          <h4 className={styles.sectionTitle}>
            Incoming Offers
            <span className={styles.offerCount}>({incomingOffers.length})</span>
          </h4>
          <div className={styles.offersList}>
            {incomingOffers.map(offer => {
              const senderInfo = getPlayerInfo(offer.fromPlayerId);
              return (
                <IncomingOfferCard
                  key={offer.id}
                  offer={offer}
                  senderName={senderInfo.name}
                  senderColor={senderInfo.color}
                  onAccept={() => acceptTradeOffer(offer.id)}
                  onDecline={() => declineTradeOffer(offer.id)}
                  onCounter={() => handleCounter(offer)}
                  canAccept={canAcceptOffer(offer)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {outgoingOffers.length === 0 && incomingOffers.length === 0 && !compact && (
        <div className={styles.emptyState}>
          <p>No active trades</p>
          {canTrade && <p className={styles.hint}>Click Trade to start</p>}
        </div>
      )}
    </div>
  );
};

export default TradePanel;
