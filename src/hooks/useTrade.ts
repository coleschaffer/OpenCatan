/**
 * useTrade Hook
 *
 * Comprehensive hook for all trading functionality in OpenCatan.
 * Handles both bank trading and player-to-player trading.
 *
 * Features:
 * - Bank trading with port rate calculation
 * - Player trade offers (send, accept, decline, counter)
 * - Resource validation
 * - Trade history tracking
 */

import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../game/state/store';
import type { ResourceType, ResourceCounts, Player } from '../types';
import { useTradeRates, type BankTradeRate } from './useTradeRates';
import { useGameActions } from '../network/hooks/useGameActions';
import {
  addToast,
  closeTradeModal,
  openTradeModal,
  closeModal,
} from '../game/state/slices/uiSlice';
import type { TradeOfferExtended } from '../game/state/slices/tradeSlice';

// ============================================================================
// Types
// ============================================================================

export interface TradeOfferInput {
  /** Target player ID (null for broadcast to all) */
  toPlayerId: string | null;
  /** Resources being offered */
  offering: Partial<ResourceCounts>;
  /** Resources being requested */
  requesting: Partial<ResourceCounts>;
}

export interface BankTradeInput {
  /** Resource to give to bank */
  giveResource: ResourceType;
  /** Amount to give */
  giveAmount: number;
  /** Resource to receive from bank */
  receiveResource: ResourceType;
}

export interface TradeValidation {
  /** Whether the trade is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
}

export interface UseTradeReturn {
  // State
  /** Whether trading is currently allowed */
  canTrade: boolean;
  /** Whether the trade modal is open */
  isTradeModalOpen: boolean;
  /** Current player's resources */
  myResources: ResourceCounts;
  /** Bank's resources */
  bankResources: ResourceCounts;
  /** Trade rates for each resource (based on ports) */
  tradeRates: Record<ResourceType, BankTradeRate>;
  /** Other players available for trading */
  tradablePlayers: Pick<Player, 'id' | 'name' | 'color' | 'isConnected'>[];
  /** Outgoing trade offers from this player */
  outgoingOffers: TradeOfferExtended[];
  /** Incoming trade offers to this player */
  incomingOffers: TradeOfferExtended[];
  /** Whether player has any port access */
  hasAnyPort: boolean;
  /** Whether player has a 3:1 generic port */
  hasGenericPort: boolean;

  // Bank Trading
  /** Validate a bank trade */
  validateBankTrade: (input: BankTradeInput) => TradeValidation;
  /** Calculate receive amount for bank trade */
  calculateBankReceive: (giveResource: ResourceType, giveAmount: number) => number;
  /** Execute a bank trade */
  executeBankTrade: (input: BankTradeInput) => boolean;
  /** Check if player can afford a bank trade for a resource */
  canAffordBankTrade: (resource: ResourceType) => boolean;

  // Player Trading
  /** Validate a player trade offer */
  validatePlayerTrade: (input: TradeOfferInput) => TradeValidation;
  /** Send a trade offer to player(s) */
  sendTradeOffer: (input: TradeOfferInput) => void;
  /** Accept an incoming trade offer */
  acceptTradeOffer: (offerId: string) => void;
  /** Decline an incoming trade offer */
  declineTradeOffer: (offerId: string) => void;
  /** Send a counter-offer */
  sendCounterOffer: (originalOfferId: string, counterOffer: TradeOfferInput) => void;
  /** Cancel an outgoing trade offer */
  cancelTradeOffer: (offerId: string) => void;

  // Modal Control
  /** Open the trade modal */
  openTrade: () => void;
  /** Close the trade modal */
  closeTrade: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if player has enough resources
 */
function hasEnoughResources(
  playerResources: ResourceCounts,
  required: Partial<ResourceCounts>
): boolean {
  for (const [resource, amount] of Object.entries(required)) {
    const res = resource as ResourceType;
    if ((amount || 0) > (playerResources[res] || 0)) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate total resources in a partial count
 */
function getTotalResources(resources: Partial<ResourceCounts>): number {
  return Object.values(resources).reduce((sum, val) => sum + (val || 0), 0);
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTrade(): UseTradeReturn {
  const dispatch = useDispatch<AppDispatch>();
  const gameActions = useGameActions();

  // Get trade rates from ports
  const { rates: tradeRates, hasAnyPort, hasGenericPort } = useTradeRates();

  // Redux state selectors
  const gamePhase = useSelector((state: RootState) => state.game.phase);
  const currentPlayerId = useSelector((state: RootState) => state.game.currentPlayerId);
  const localPlayerId = useSelector((state: RootState) => state.lobby.localPlayerId);
  const players = useSelector((state: RootState) => state.players.players);
  const bankResources = useSelector((state: RootState) => state.game.bank);
  const isTradeModalOpen = useSelector((state: RootState) => state.ui.tradeModalOpen);
  const outgoingOffers = useSelector((state: RootState) => state.trade.outgoingOffers);
  const incomingOffers = useSelector((state: RootState) => state.trade.incomingOffers);

  // Derived state
  const isMyTurn = currentPlayerId === localPlayerId;
  const canTrade = isMyTurn && gamePhase === 'main';

  // Get current player's resources
  const myResources = useMemo(() => {
    const player = players.find(p => p.id === localPlayerId);
    return player?.resources || {
      brick: 0,
      lumber: 0,
      ore: 0,
      grain: 0,
      wool: 0,
    };
  }, [players, localPlayerId]);

  // Get tradable players (all other connected players)
  const tradablePlayers = useMemo(() => {
    return players
      .filter(p => p.id !== localPlayerId && p.isConnected !== false)
      .map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isConnected: p.isConnected !== false,
      }));
  }, [players, localPlayerId]);

  // Filter offers for current player
  const myOutgoingOffers = useMemo(() => {
    return outgoingOffers.filter(o => o.fromPlayerId === localPlayerId && o.isActive);
  }, [outgoingOffers, localPlayerId]);

  const myIncomingOffers = useMemo(() => {
    return incomingOffers.filter(o => {
      if (!o.isActive) return false;
      // Offer is for me if I'm the target or it's a broadcast and I haven't declined
      if (o.toPlayerId === localPlayerId) return true;
      if (o.toPlayerId === null && !o.declinedBy.includes(localPlayerId || '')) return true;
      return false;
    });
  }, [incomingOffers, localPlayerId]);

  // ==========================================================================
  // Bank Trading
  // ==========================================================================

  const calculateBankReceive = useCallback((
    giveResource: ResourceType,
    giveAmount: number
  ): number => {
    const rate = tradeRates[giveResource];
    return Math.floor(giveAmount / rate);
  }, [tradeRates]);

  const canAffordBankTrade = useCallback((resource: ResourceType): boolean => {
    const rate = tradeRates[resource];
    return myResources[resource] >= rate;
  }, [tradeRates, myResources]);

  const validateBankTrade = useCallback((input: BankTradeInput): TradeValidation => {
    const { giveResource, giveAmount, receiveResource } = input;
    const rate = tradeRates[giveResource];
    const receiveAmount = Math.floor(giveAmount / rate);

    // Same resource check
    if (giveResource === receiveResource) {
      return { isValid: false, error: 'Cannot trade a resource for itself' };
    }

    // Check player has enough
    if (myResources[giveResource] < giveAmount) {
      return { isValid: false, error: `Not enough ${giveResource} to trade` };
    }

    // Check amount is valid
    if (giveAmount < rate) {
      return { isValid: false, error: `Need at least ${rate} ${giveResource} to trade` };
    }

    // Check amount is multiple of rate
    if (giveAmount % rate !== 0) {
      return { isValid: false, error: `Amount must be a multiple of ${rate}` };
    }

    // Check bank has enough
    if (bankResources[receiveResource] < receiveAmount) {
      return { isValid: false, error: `Bank does not have enough ${receiveResource}` };
    }

    return { isValid: true };
  }, [tradeRates, myResources, bankResources]);

  const executeBankTrade = useCallback((input: BankTradeInput): boolean => {
    if (!canTrade) {
      dispatch(addToast({
        message: 'You can only trade during your main phase',
        type: 'warning',
      }));
      return false;
    }

    const validation = validateBankTrade(input);
    if (!validation.isValid) {
      dispatch(addToast({
        message: validation.error || 'Invalid trade',
        type: 'error',
      }));
      return false;
    }

    const rate = tradeRates[input.giveResource];
    const receiveAmount = Math.floor(input.giveAmount / rate);

    // Execute the bank trade action
    gameActions.bankTrade(
      { resource: input.giveResource, amount: input.giveAmount },
      { resource: input.receiveResource, amount: receiveAmount }
    );

    dispatch(addToast({
      message: `Traded ${input.giveAmount} ${input.giveResource} for ${receiveAmount} ${input.receiveResource}`,
      type: 'success',
    }));

    return true;
  }, [canTrade, validateBankTrade, tradeRates, gameActions, dispatch]);

  // ==========================================================================
  // Player Trading
  // ==========================================================================

  const validatePlayerTrade = useCallback((input: TradeOfferInput): TradeValidation => {
    const { offering, requesting } = input;

    // Check offering is not empty
    if (getTotalResources(offering) === 0) {
      return { isValid: false, error: 'Must offer at least one resource' };
    }

    // Check requesting is not empty
    if (getTotalResources(requesting) === 0) {
      return { isValid: false, error: 'Must request at least one resource' };
    }

    // Check player has resources to offer
    if (!hasEnoughResources(myResources, offering)) {
      return { isValid: false, error: 'You do not have enough resources to offer' };
    }

    return { isValid: true };
  }, [myResources]);

  const sendTradeOffer = useCallback((input: TradeOfferInput) => {
    if (!canTrade) {
      dispatch(addToast({
        message: 'You can only trade during your main phase',
        type: 'warning',
      }));
      return;
    }

    const validation = validatePlayerTrade(input);
    if (!validation.isValid) {
      dispatch(addToast({
        message: validation.error || 'Invalid trade offer',
        type: 'error',
      }));
      return;
    }

    // Send the trade offer through game actions
    gameActions.sendTradeOffer({
      toPlayerId: input.toPlayerId,
      offering: input.offering,
      requesting: input.requesting,
    });

    dispatch(addToast({
      message: input.toPlayerId
        ? 'Trade offer sent'
        : 'Trade offer sent to all players',
      type: 'info',
    }));

    // Close the modal after sending
    dispatch(closeTradeModal());
  }, [canTrade, validatePlayerTrade, gameActions, dispatch]);

  const acceptTradeOffer = useCallback((offerId: string) => {
    const offer = myIncomingOffers.find(o => o.id === offerId);
    if (!offer) {
      dispatch(addToast({
        message: 'Trade offer not found',
        type: 'error',
      }));
      return;
    }

    // Check if we have the resources to fulfill the trade
    // We need to provide what the offerer is requesting
    if (!hasEnoughResources(myResources, offer.requesting)) {
      dispatch(addToast({
        message: 'You do not have enough resources to accept this trade',
        type: 'error',
      }));
      return;
    }

    gameActions.respondToTrade(offerId, 'accept');

    dispatch(addToast({
      message: 'Trade accepted!',
      type: 'success',
    }));
  }, [myIncomingOffers, myResources, gameActions, dispatch]);

  const declineTradeOffer = useCallback((offerId: string) => {
    gameActions.respondToTrade(offerId, 'decline');

    dispatch(addToast({
      message: 'Trade declined',
      type: 'info',
    }));
  }, [gameActions, dispatch]);

  const sendCounterOffer = useCallback((
    originalOfferId: string,
    counterOffer: TradeOfferInput
  ) => {
    const validation = validatePlayerTrade(counterOffer);
    if (!validation.isValid) {
      dispatch(addToast({
        message: validation.error || 'Invalid counter-offer',
        type: 'error',
      }));
      return;
    }

    gameActions.counterOffer(originalOfferId, {
      toPlayerId: counterOffer.toPlayerId,
      offering: counterOffer.offering,
      requesting: counterOffer.requesting,
    });

    dispatch(addToast({
      message: 'Counter-offer sent',
      type: 'info',
    }));

    dispatch(closeTradeModal());
  }, [validatePlayerTrade, gameActions, dispatch]);

  const cancelTradeOffer = useCallback((offerId: string) => {
    gameActions.cancelTrade(offerId);

    dispatch(addToast({
      message: 'Trade offer cancelled',
      type: 'info',
    }));
  }, [gameActions, dispatch]);

  // ==========================================================================
  // Modal Control
  // ==========================================================================

  const openTrade = useCallback(() => {
    dispatch(openTradeModal());
  }, [dispatch]);

  const closeTrade = useCallback(() => {
    dispatch(closeTradeModal());
  }, [dispatch]);

  // ==========================================================================
  // Return Value
  // ==========================================================================

  return useMemo(() => ({
    // State
    canTrade,
    isTradeModalOpen,
    myResources,
    bankResources,
    tradeRates,
    tradablePlayers,
    outgoingOffers: myOutgoingOffers,
    incomingOffers: myIncomingOffers,
    hasAnyPort,
    hasGenericPort,

    // Bank Trading
    validateBankTrade,
    calculateBankReceive,
    executeBankTrade,
    canAffordBankTrade,

    // Player Trading
    validatePlayerTrade,
    sendTradeOffer,
    acceptTradeOffer,
    declineTradeOffer,
    sendCounterOffer,
    cancelTradeOffer,

    // Modal Control
    openTrade,
    closeTrade,
  }), [
    canTrade,
    isTradeModalOpen,
    myResources,
    bankResources,
    tradeRates,
    tradablePlayers,
    myOutgoingOffers,
    myIncomingOffers,
    hasAnyPort,
    hasGenericPort,
    validateBankTrade,
    calculateBankReceive,
    executeBankTrade,
    canAffordBankTrade,
    validatePlayerTrade,
    sendTradeOffer,
    acceptTradeOffer,
    declineTradeOffer,
    sendCounterOffer,
    cancelTradeOffer,
    openTrade,
    closeTrade,
  ]);
}

export default useTrade;
