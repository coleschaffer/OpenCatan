import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import type { ResourceType, PlayerColor, ResourceCounts } from '../../types';
import styles from './TradeOfferReceived.module.css';

export interface IncomingTradeOffer {
  id: string;
  offering: ResourceCounts;
  requesting: ResourceCounts;
}

export interface TradeOfferReceivedProps {
  isOpen: boolean;
  onClose: () => void;
  /** The trade offer received */
  offer: IncomingTradeOffer;
  /** Player who made the offer */
  from: {
    id: string;
    name: string;
    color: PlayerColor;
  };
  /** Called when accepting the trade */
  onAccept: () => void;
  /** Called when declining the trade */
  onDecline: () => void;
  /** Called when wanting to counter-offer */
  onCounter: () => void;
  /** Optional timer in seconds (if applicable) */
  timeRemaining?: number;
}

const RESOURCE_ICONS: Record<ResourceType, string> = {
  brick: '/assets/cards/card_resource_brick.svg',
  lumber: '/assets/cards/card_resource_lumber.svg',
  ore: '/assets/cards/card_resource_ore.svg',
  grain: '/assets/cards/card_resource_grain.svg',
  wool: '/assets/cards/card_resource_wool.svg',
};

const RESOURCE_LABELS: Record<ResourceType, string> = {
  brick: 'Brick',
  lumber: 'Lumber',
  ore: 'Ore',
  grain: 'Grain',
  wool: 'Wool',
};

interface ResourceDisplayProps {
  resources: ResourceCounts;
}

const ResourceDisplay: React.FC<ResourceDisplayProps> = ({ resources }) => {
  const entries = Object.entries(resources).filter(([, count]) => count > 0) as [
    ResourceType,
    number
  ][];

  if (entries.length === 0) {
    return <span className={styles.noResources}>Nothing</span>;
  }

  return (
    <div className={styles.resourceGrid}>
      {entries.map(([resource, count]) => (
        <div key={resource} className={styles.resourceItem}>
          <img
            src={RESOURCE_ICONS[resource]}
            alt={RESOURCE_LABELS[resource]}
            className={styles.resourceIcon}
          />
          <span className={styles.resourceCount}>x{count}</span>
        </div>
      ))}
    </div>
  );
};

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
 * TradeOfferReceived component displays an incoming trade offer
 * with options to accept, decline, or counter-offer.
 */
export const TradeOfferReceived: React.FC<TradeOfferReceivedProps> = ({
  isOpen,
  onClose,
  offer,
  from,
  onAccept,
  onDecline,
  onCounter,
  timeRemaining,
}) => {
  const [localTime, setLocalTime] = useState(timeRemaining);

  // Update local time when prop changes
  useEffect(() => {
    setLocalTime(timeRemaining);
  }, [timeRemaining]);

  // Countdown timer
  useEffect(() => {
    if (localTime === undefined || localTime <= 0) return;

    const timer = setInterval(() => {
      setLocalTime((prev) => {
        if (prev === undefined || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [localTime]);

  const isExpired = localTime !== undefined && localTime <= 0;

  const timerDisplay = useMemo(() => {
    if (localTime === undefined) return null;
    const minutes = Math.floor(localTime / 60);
    const seconds = localTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [localTime]);

  const playerColorHex = getPlayerColorHex(from.color);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trade Offer"
      size="medium"
      closeOnBackdropClick={false}
    >
      <div className={styles.container}>
        {/* From Player */}
        <div className={styles.fromSection}>
          <span
            className={styles.playerColorDot}
            style={{ backgroundColor: playerColorHex }}
          />
          <span className={styles.fromPlayer} style={{ color: playerColorHex }}>
            {from.name}
          </span>
          <span className={styles.fromText}>wants to trade with you</span>
        </div>

        {/* Timer */}
        {timerDisplay && (
          <div
            className={`${styles.timer} ${localTime !== undefined && localTime <= 10 ? styles.timerWarning : ''}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{timerDisplay}</span>
          </div>
        )}

        {/* Trade Details */}
        <div className={styles.tradeDetails}>
          <div className={styles.tradeSection}>
            <h4 className={styles.sectionTitle}>They Offer</h4>
            <ResourceDisplay resources={offer.offering} />
          </div>

          <div className={styles.tradeDivider}>
            <svg
              width="24"
              height="24"
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
            <h4 className={styles.sectionTitle}>They Want</h4>
            <ResourceDisplay resources={offer.requesting} />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.declineButton}
            onClick={onDecline}
            disabled={isExpired}
          >
            Decline
          </button>
          <button
            type="button"
            className={styles.counterButton}
            onClick={onCounter}
            disabled={isExpired}
          >
            Counter
          </button>
          <button
            type="button"
            className={styles.acceptButton}
            onClick={onAccept}
            disabled={isExpired}
          >
            Accept
          </button>
        </div>

        {isExpired && (
          <div className={styles.expiredMessage}>This offer has expired</div>
        )}
      </div>
    </Modal>
  );
};

export default TradeOfferReceived;
