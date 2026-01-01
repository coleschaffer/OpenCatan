/**
 * TradeResponses Component
 *
 * Shows responses to your trade offer from other players.
 * Displays each player's status (pending/accepted/declined/countered).
 * First accept auto-completes the trade.
 */

import React, { useCallback } from 'react';
import { ResourceDisplay } from '../cards/ResourceDisplay';
import type { ResourceCounts, PlayerColor, TradeOffer } from '../../types';
import styles from './TradeResponses.module.css';

export type ResponseStatus = 'pending' | 'accepted' | 'declined' | 'countered';

export interface PlayerResponse {
  playerId: string;
  playerName: string;
  playerColor: PlayerColor;
  status: ResponseStatus;
  counterOffer?: {
    offering: Partial<ResourceCounts>;
    requesting: Partial<ResourceCounts>;
  };
}

export interface TradeResponsesProps {
  /** Your original trade offer */
  offer: TradeOffer;
  /** Responses from other players */
  responses: PlayerResponse[];
  /** Called to cancel your offer */
  onCancel: () => void;
  /** Called when you accept a counter-offer */
  onAcceptCounter?: (playerId: string) => void;
  /** Called when you decline a counter-offer */
  onDeclineCounter?: (playerId: string) => void;
  /** Whether the trade is completed */
  isCompleted?: boolean;
  /** Player who accepted (if completed) */
  acceptedBy?: string;
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
 * Status icon component
 */
interface StatusIconProps {
  status: ResponseStatus;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  switch (status) {
    case 'accepted':
      return (
        <svg className={`${styles.statusIcon} ${styles.accepted}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'declined':
      return (
        <svg className={`${styles.statusIcon} ${styles.declined}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'countered':
      return (
        <svg className={`${styles.statusIcon} ${styles.countered}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 16V4M7 4L3 8M7 4L11 8" />
          <path d="M17 8V20M17 20L21 16M17 20L13 16" />
        </svg>
      );
    case 'pending':
    default:
      return (
        <div className={`${styles.statusIcon} ${styles.pending}`}>
          <div className={styles.pendingDot} />
        </div>
      );
  }
};

/**
 * Status text
 */
const STATUS_TEXT: Record<ResponseStatus, string> = {
  pending: 'Waiting...',
  accepted: 'Accepted!',
  declined: 'Declined',
  countered: 'Counter-offered',
};

/**
 * Single player response row
 */
interface ResponseRowProps {
  response: PlayerResponse;
  onAcceptCounter?: (playerId: string) => void;
  onDeclineCounter?: (playerId: string) => void;
}

const ResponseRow: React.FC<ResponseRowProps> = ({
  response,
  onAcceptCounter,
  onDeclineCounter,
}) => {
  const playerColorHex = getPlayerColorHex(response.playerColor);

  const handleAcceptCounter = useCallback(() => {
    onAcceptCounter?.(response.playerId);
  }, [response.playerId, onAcceptCounter]);

  const handleDeclineCounter = useCallback(() => {
    onDeclineCounter?.(response.playerId);
  }, [response.playerId, onDeclineCounter]);

  return (
    <div
      className={`${styles.responseRow} ${styles[response.status]}`}
      style={{ '--player-color': playerColorHex } as React.CSSProperties}
    >
      <div className={styles.playerInfo}>
        <span
          className={styles.playerDot}
          style={{ backgroundColor: playerColorHex }}
        />
        <span className={styles.playerName}>{response.playerName}</span>
      </div>

      <div className={styles.statusSection}>
        <StatusIcon status={response.status} />
        <span className={styles.statusText}>{STATUS_TEXT[response.status]}</span>
      </div>

      {/* Counter Offer Details */}
      {response.status === 'countered' && response.counterOffer && (
        <div className={styles.counterOfferDetails}>
          <div className={styles.counterOfferResources}>
            <span className={styles.counterLabel}>They offer:</span>
            <ResourceDisplay resources={response.counterOffer.offering} size="small" compact />
            <span className={styles.counterArrow}>for</span>
            <ResourceDisplay resources={response.counterOffer.requesting} size="small" compact />
          </div>
          {onAcceptCounter && onDeclineCounter && (
            <div className={styles.counterActions}>
              <button
                type="button"
                className={styles.counterDeclineButton}
                onClick={handleDeclineCounter}
              >
                Decline
              </button>
              <button
                type="button"
                className={styles.counterAcceptButton}
                onClick={handleAcceptCounter}
              >
                Accept
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * TradeResponses main component
 */
export const TradeResponses: React.FC<TradeResponsesProps> = ({
  offer,
  responses,
  onCancel,
  onAcceptCounter,
  onDeclineCounter,
  isCompleted = false,
  acceptedBy,
}) => {
  const pendingCount = responses.filter(r => r.status === 'pending').length;
  const acceptedPlayer = acceptedBy
    ? responses.find(r => r.playerId === acceptedBy)
    : responses.find(r => r.status === 'accepted');

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Your Trade Offer</h3>
        {!isCompleted && pendingCount > 0 && (
          <span className={styles.pendingBadge}>
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Your Offer Summary */}
      <div className={styles.offerSummary}>
        <ResourceDisplay resources={offer.offering} size="small" colored />
        <span className={styles.forLabel}>for</span>
        <ResourceDisplay resources={offer.requesting} size="small" colored />
      </div>

      {/* Completed Message */}
      {isCompleted && acceptedPlayer && (
        <div className={styles.completedMessage}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>
            Trade completed with{' '}
            <strong style={{ color: getPlayerColorHex(acceptedPlayer.playerColor) }}>
              {acceptedPlayer.playerName}
            </strong>
          </span>
        </div>
      )}

      {/* Responses List */}
      <div className={styles.responsesList}>
        {responses.map(response => (
          <ResponseRow
            key={response.playerId}
            response={response}
            onAcceptCounter={response.status === 'countered' ? onAcceptCounter : undefined}
            onDeclineCounter={response.status === 'countered' ? onDeclineCounter : undefined}
          />
        ))}
      </div>

      {/* Cancel Button */}
      {!isCompleted && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel Offer
          </button>
        </div>
      )}
    </div>
  );
};

export default TradeResponses;
