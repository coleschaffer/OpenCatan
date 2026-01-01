/**
 * Trade Slice - Trade state management for OpenCatan
 *
 * Manages:
 * - Active trade offers (outgoing)
 * - Incoming trade offers
 * - Counter-offers
 * - Trade timeouts
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ResourceCounts, TradeOffer, TradeCounterOffer } from '@/types';

/**
 * Trade offer status (extended from base TradeOfferStatus with additional states)
 */
export type TradeOfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'cancelled' | 'expired' | 'completed';

/**
 * Extended trade offer with tracking info
 * Note: We use Omit to exclude the base 'status' property and redefine it with our extended type
 */
export interface TradeOfferExtended extends Omit<TradeOffer, 'status'> {
  /** Timestamp when the offer was created */
  createdAt: number;
  /** Timeout duration in milliseconds (0 = no timeout) */
  timeoutMs: number;
  /** Counter-offers received keyed by player ID */
  counterOffers: Record<string, TradeCounterOffer>;
  /** Players who have responded */
  respondedBy: string[];
  /** Status of the trade (extended with additional states) */
  status: TradeOfferStatus;
  /** If this is a counter-offer, the original offer ID */
  originalOfferId?: string;
}

/**
 * Trade slice state
 */
export interface TradeSliceState {
  /** Trade offers created by the local player */
  outgoingOffers: TradeOfferExtended[];

  /** Trade offers received from other players */
  incomingOffers: TradeOfferExtended[];

  /** Currently selected counter-offer (for TradeModal pre-fill) */
  activeCounterOffer: {
    originalOfferId: string;
    fromPlayerId: string;
    offering: Partial<ResourceCounts>;
    requesting: Partial<ResourceCounts>;
  } | null;

  /** Default trade timeout in milliseconds (30 seconds) */
  defaultTimeout: number;
}

const initialState: TradeSliceState = {
  outgoingOffers: [],
  incomingOffers: [],
  activeCounterOffer: null,
  defaultTimeout: 30000, // 30 seconds
};

const tradeSlice = createSlice({
  name: 'trade',
  initialState,
  reducers: {
    /**
     * Add a new outgoing trade offer (created by local player)
     */
    addOutgoingOffer: (state, action: PayloadAction<TradeOfferExtended>) => {
      state.outgoingOffers.push(action.payload);
    },

    /**
     * Add a new incoming trade offer (from another player)
     */
    addIncomingOffer: (state, action: PayloadAction<TradeOfferExtended>) => {
      // Check if offer already exists
      const existingIndex = state.incomingOffers.findIndex(o => o.id === action.payload.id);
      if (existingIndex >= 0) {
        state.incomingOffers[existingIndex] = action.payload;
      } else {
        state.incomingOffers.push(action.payload);
      }
    },

    /**
     * Update an outgoing offer's status
     */
    updateOutgoingOfferStatus: (
      state,
      action: PayloadAction<{ offerId: string; status: TradeOfferStatus }>
    ) => {
      const offer = state.outgoingOffers.find(o => o.id === action.payload.offerId);
      if (offer) {
        offer.status = action.payload.status;
        offer.isActive = action.payload.status === 'pending';
      }
    },

    /**
     * Update an incoming offer's status
     */
    updateIncomingOfferStatus: (
      state,
      action: PayloadAction<{ offerId: string; status: TradeOfferStatus }>
    ) => {
      const offer = state.incomingOffers.find(o => o.id === action.payload.offerId);
      if (offer) {
        offer.status = action.payload.status;
        offer.isActive = action.payload.status === 'pending';
      }
    },

    /**
     * Mark a player as having declined an offer
     */
    addDeclinedBy: (
      state,
      action: PayloadAction<{ offerId: string; playerId: string }>
    ) => {
      const offer = state.outgoingOffers.find(o => o.id === action.payload.offerId);
      if (offer && !offer.declinedBy.includes(action.payload.playerId)) {
        offer.declinedBy.push(action.payload.playerId);
        offer.respondedBy.push(action.payload.playerId);
      }
    },

    /**
     * Add a counter-offer to an outgoing offer
     */
    addCounterOffer: (
      state,
      action: PayloadAction<{
        offerId: string;
        playerId: string;
        counterOffer: TradeCounterOffer;
      }>
    ) => {
      const offer = state.outgoingOffers.find(o => o.id === action.payload.offerId);
      if (offer) {
        offer.counterOffers[action.payload.playerId] = action.payload.counterOffer;
        if (!offer.respondedBy.includes(action.payload.playerId)) {
          offer.respondedBy.push(action.payload.playerId);
        }
      }
    },

    /**
     * Remove an outgoing offer
     */
    removeOutgoingOffer: (state, action: PayloadAction<string>) => {
      state.outgoingOffers = state.outgoingOffers.filter(o => o.id !== action.payload);
    },

    /**
     * Remove an incoming offer
     */
    removeIncomingOffer: (state, action: PayloadAction<string>) => {
      state.incomingOffers = state.incomingOffers.filter(o => o.id !== action.payload);
    },

    /**
     * Set the active counter-offer for pre-filling the trade modal
     */
    setActiveCounterOffer: (
      state,
      action: PayloadAction<{
        originalOfferId: string;
        fromPlayerId: string;
        offering: Partial<ResourceCounts>;
        requesting: Partial<ResourceCounts>;
      } | null>
    ) => {
      state.activeCounterOffer = action.payload;
    },

    /**
     * Clear the active counter-offer
     */
    clearActiveCounterOffer: (state) => {
      state.activeCounterOffer = null;
    },

    /**
     * Clear all offers from a specific player (e.g., when they end turn)
     */
    clearOffersFromPlayer: (state, action: PayloadAction<string>) => {
      // Mark outgoing offers from this player as cancelled
      state.outgoingOffers = state.outgoingOffers.filter(
        o => o.fromPlayerId !== action.payload
      );

      // Remove incoming offers from this player
      state.incomingOffers = state.incomingOffers.filter(
        o => o.fromPlayerId !== action.payload
      );
    },

    /**
     * Expire old offers based on timeout
     */
    expireOldOffers: (state) => {
      const now = Date.now();

      // Expire outgoing offers
      state.outgoingOffers.forEach(offer => {
        if (offer.timeoutMs > 0 && offer.status === 'pending') {
          if (now - offer.createdAt > offer.timeoutMs) {
            offer.status = 'expired';
            offer.isActive = false;
          }
        }
      });

      // Expire incoming offers
      state.incomingOffers.forEach(offer => {
        if (offer.timeoutMs > 0 && offer.status === 'pending') {
          if (now - offer.createdAt > offer.timeoutMs) {
            offer.status = 'expired';
            offer.isActive = false;
          }
        }
      });
    },

    /**
     * Clear all trade state (e.g., on turn end or game end)
     */
    clearAllOffers: (state) => {
      state.outgoingOffers = [];
      state.incomingOffers = [];
      state.activeCounterOffer = null;
    },

    /**
     * Reset trade slice to initial state
     */
    resetTrade: () => initialState,
  },
});

// Export actions
export const {
  addOutgoingOffer,
  addIncomingOffer,
  updateOutgoingOfferStatus,
  updateIncomingOfferStatus,
  addDeclinedBy,
  addCounterOffer,
  removeOutgoingOffer,
  removeIncomingOffer,
  setActiveCounterOffer,
  clearActiveCounterOffer,
  clearOffersFromPlayer,
  expireOldOffers,
  clearAllOffers,
  resetTrade,
} = tradeSlice.actions;

// Selectors
export const selectOutgoingOffers = (state: RootState) => state.trade.outgoingOffers;
export const selectIncomingOffers = (state: RootState) => state.trade.incomingOffers;
export const selectActiveCounterOffer = (state: RootState) => state.trade.activeCounterOffer;
export const selectDefaultTimeout = (state: RootState) => state.trade.defaultTimeout;

/**
 * Get all active outgoing offers
 */
export const selectActiveOutgoingOffers = (state: RootState) =>
  state.trade.outgoingOffers.filter(o => o.status === 'pending');

/**
 * Get all active incoming offers
 */
export const selectActiveIncomingOffers = (state: RootState) =>
  state.trade.incomingOffers.filter(o => o.status === 'pending');

/**
 * Get pending incoming offers for display
 */
export const selectPendingIncomingOffers = (state: RootState) =>
  state.trade.incomingOffers.filter(o => o.isActive && o.status === 'pending');

/**
 * Get counter-offers received for an outgoing offer
 */
export const selectCounterOffersForOffer = (state: RootState, offerId: string) => {
  const offer = state.trade.outgoingOffers.find(o => o.id === offerId);
  return offer?.counterOffers ?? {};
};

/**
 * Check if there are any pending incoming offers
 */
export const selectHasPendingIncomingOffers = (state: RootState) =>
  state.trade.incomingOffers.some(o => o.isActive && o.status === 'pending');

/**
 * Get count of pending incoming offers
 */
export const selectPendingIncomingOffersCount = (state: RootState) =>
  state.trade.incomingOffers.filter(o => o.isActive && o.status === 'pending').length;

export default tradeSlice.reducer;
