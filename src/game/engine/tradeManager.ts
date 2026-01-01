/**
 * Trade Manager Module
 *
 * Handles all trading operations in OpenCatan:
 * - Bank trades with port rate calculations
 * - Player-to-player trade offers
 * - Trade acceptance, rejection, and counter-offers
 *
 * All functions are pure and return new state objects without mutations.
 */

import type {
  GameState,
  ResourceType,
  ResourceCounts,
  TradeOffer,
  Player,
  Port,
  PortType,
} from '../../types';
import { vertexToKey } from '../../types';
import { hasResources, addResources, subtractResources } from './resources';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Trade response status for each player
 */
export type TradeResponseStatus = 'pending' | 'accepted' | 'declined' | 'countered';

/**
 * Extended trade offer with response tracking
 */
export interface ExtendedTradeOffer extends TradeOffer {
  responses: Record<string, TradeResponseStatus>;
  counterOffers: Record<string, { offering: ResourceCounts; requesting: ResourceCounts }>;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
}

/**
 * Bank trade rate for a resource
 */
export type BankTradeRate = 2 | 3 | 4;

/**
 * Result of a trade validation
 */
export interface TradeValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Result of executing a trade
 */
export interface TradeResult {
  success: boolean;
  newState: GameState;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates empty resource counts object
 */
function createEmptyResourceCounts(): ResourceCounts {
  return {
    brick: 0,
    lumber: 0,
    ore: 0,
    grain: 0,
    wool: 0,
  };
}

/**
 * Converts partial resource counts to full counts
 */
function toFullResourceCounts(partial: Partial<ResourceCounts>): ResourceCounts {
  return {
    brick: partial.brick ?? 0,
    lumber: partial.lumber ?? 0,
    ore: partial.ore ?? 0,
    grain: partial.grain ?? 0,
    wool: partial.wool ?? 0,
  };
}

/**
 * Counts total resources in a resource counts object
 */
function countResources(resources: Partial<ResourceCounts>): number {
  return Object.values(resources).reduce((sum, count) => sum + (count ?? 0), 0);
}

/**
 * Checks if resources are non-zero (trade has something)
 */
function hasAnyResources(resources: Partial<ResourceCounts>): boolean {
  return countResources(resources) > 0;
}

/**
 * Gets a player by ID from game state
 */
function getPlayer(state: GameState, playerId: string): Player | undefined {
  return state.players.find(p => p.id === playerId);
}

/**
 * Generates a unique trade offer ID
 */
function generateTradeId(): string {
  return `trade-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// BANK TRADE FUNCTIONS
// ============================================================================

/**
 * Gets the best bank trade rate a player has for each resource.
 * Checks ports the player has access to.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Record of resource types to their best trade rates
 */
export function getBankRates(
  state: GameState,
  playerId: string
): Record<ResourceType, BankTradeRate> {
  const rates: Record<ResourceType, BankTradeRate> = {
    brick: 4,
    lumber: 4,
    ore: 4,
    grain: 4,
    wool: 4,
  };

  // Find all vertices the player has buildings on
  const playerBuildings = state.buildings.filter(b => b.playerId === playerId);
  const playerVertexKeys = new Set(
    playerBuildings.map(b => vertexToKey(b.vertex))
  );

  // Check each port for access
  for (const port of state.ports) {
    // Check if player has a building at any of the port's vertices
    const hasAccess = port.vertices?.some(v =>
      playerVertexKeys.has(vertexToKey(v))
    );

    if (hasAccess) {
      if (port.type === 'generic') {
        // Generic 3:1 port - applies to all resources
        const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];
        for (const resource of resourceTypes) {
          if (rates[resource] > 3) {
            rates[resource] = 3;
          }
        }
      } else {
        // Specific 2:1 port
        const resourceType = port.type as ResourceType;
        if (rates[resourceType] > 2) {
          rates[resourceType] = 2;
        }
      }
    }
  }

  return rates;
}

/**
 * Gets the best trade rate for a specific resource
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param resource - Resource type to check
 * @returns Best trade rate (2, 3, or 4)
 */
export function getBankRateForResource(
  state: GameState,
  playerId: string,
  resource: ResourceType
): BankTradeRate {
  const rates = getBankRates(state, playerId);
  return rates[resource];
}

/**
 * Validates if a bank trade is possible
 *
 * @param state - Current game state
 * @param playerId - ID of the player attempting the trade
 * @param give - Resources the player wants to give
 * @param receive - Resources the player wants to receive
 * @returns Validation result
 */
export function canBankTrade(
  state: GameState,
  playerId: string,
  give: Partial<ResourceCounts>,
  receive: Partial<ResourceCounts>
): TradeValidationResult {
  const player = getPlayer(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if it's the player's turn and they can trade
  if (state.currentPlayerId !== playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Check if in main phase (can trade)
  if (state.phase !== 'main') {
    return { valid: false, error: 'Cannot trade in current phase' };
  }

  // Check that player is giving something
  if (!hasAnyResources(give)) {
    return { valid: false, error: 'Must give at least one resource' };
  }

  // Check that player is receiving something
  if (!hasAnyResources(receive)) {
    return { valid: false, error: 'Must receive at least one resource' };
  }

  // Check that player has the resources to give
  const fullGive = toFullResourceCounts(give);
  if (!hasResources(player.resources, fullGive)) {
    return { valid: false, error: 'Not enough resources' };
  }

  // Check bank has the resources to give
  const fullReceive = toFullResourceCounts(receive);
  if (!hasResources(state.bank, fullReceive)) {
    return { valid: false, error: 'Bank does not have enough resources' };
  }

  // Validate trade rates
  const rates = getBankRates(state, playerId);
  const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];

  // Count total resources being given
  let totalGiving = 0;
  for (const resource of resourceTypes) {
    totalGiving += fullGive[resource];
  }

  // Count total resources being received
  let totalReceiving = 0;
  for (const resource of resourceTypes) {
    totalReceiving += fullReceive[resource];
  }

  // For bank trades, validate that for each resource received,
  // we're giving the correct ratio of a single resource type
  // (standard Catan rule: trade X of one resource for 1 of another)

  // Find which resource(s) we're giving
  const givingResources = resourceTypes.filter(r => fullGive[r] > 0);

  if (givingResources.length !== 1) {
    // For simplicity, we require giving only one type of resource
    // This matches standard Catan bank trade rules
    return { valid: false, error: 'Bank trades must give only one resource type' };
  }

  const givingResource = givingResources[0];
  const rate = rates[givingResource];
  const amountGiving = fullGive[givingResource];
  const expectedReceive = Math.floor(amountGiving / rate);

  if (totalReceiving !== expectedReceive) {
    return {
      valid: false,
      error: `With ${rate}:1 rate, giving ${amountGiving} ${givingResource} should receive ${expectedReceive} resources`
    };
  }

  // Cannot trade for the same resource
  if (fullReceive[givingResource] > 0) {
    return { valid: false, error: 'Cannot trade a resource for itself' };
  }

  return { valid: true };
}

/**
 * Executes a bank trade
 *
 * @param state - Current game state
 * @param playerId - ID of the player making the trade
 * @param give - Resources to give to the bank
 * @param receive - Resources to receive from the bank
 * @returns New game state or error
 */
export function executeBankTrade(
  state: GameState,
  playerId: string,
  give: Partial<ResourceCounts>,
  receive: Partial<ResourceCounts>
): TradeResult {
  const validation = canBankTrade(state, playerId, give, receive);
  if (!validation.valid) {
    return { success: false, newState: state, error: validation.error };
  }

  const fullGive = toFullResourceCounts(give);
  const fullReceive = toFullResourceCounts(receive);

  // Update player resources
  const newPlayers = state.players.map(player => {
    if (player.id === playerId) {
      return {
        ...player,
        resources: addResources(
          subtractResources(player.resources, fullGive),
          fullReceive
        ),
        totalTradesMade: player.totalTradesMade + 1,
      };
    }
    return player;
  });

  // Update bank
  const newBank: ResourceCounts = {
    brick: state.bank.brick + fullGive.brick - fullReceive.brick,
    lumber: state.bank.lumber + fullGive.lumber - fullReceive.lumber,
    ore: state.bank.ore + fullGive.ore - fullReceive.ore,
    grain: state.bank.grain + fullGive.grain - fullReceive.grain,
    wool: state.bank.wool + fullGive.wool - fullReceive.wool,
  };

  return {
    success: true,
    newState: {
      ...state,
      players: newPlayers,
      bank: newBank,
    },
  };
}

// ============================================================================
// PLAYER TRADE FUNCTIONS
// ============================================================================

/**
 * Validates if a trade offer is valid
 *
 * @param state - Current game state
 * @param fromPlayerId - ID of the player making the offer
 * @param offer - The trade offer
 * @returns Validation result
 */
export function isValidTradeOffer(
  state: GameState,
  fromPlayerId: string,
  offer: { offering: Partial<ResourceCounts>; requesting: Partial<ResourceCounts> }
): TradeValidationResult {
  const player = getPlayer(state, fromPlayerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if it's the player's turn
  if (state.currentPlayerId !== fromPlayerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Check if in main phase
  if (state.phase !== 'main') {
    return { valid: false, error: 'Cannot trade in current phase' };
  }

  // Check that player is offering something
  if (!hasAnyResources(offer.offering)) {
    return { valid: false, error: 'Must offer at least one resource' };
  }

  // Check that player is requesting something
  if (!hasAnyResources(offer.requesting)) {
    return { valid: false, error: 'Must request at least one resource' };
  }

  // Check that player has the resources they're offering
  const fullOffering = toFullResourceCounts(offer.offering);
  if (!hasResources(player.resources, fullOffering)) {
    return { valid: false, error: 'Not enough resources to offer' };
  }

  return { valid: true };
}

/**
 * Creates a new trade offer
 *
 * @param state - Current game state
 * @param fromPlayerId - ID of the player making the offer
 * @param offering - Resources being offered
 * @param requesting - Resources being requested
 * @returns New game state with the trade offer added
 */
export function createTradeOffer(
  state: GameState,
  fromPlayerId: string,
  offering: Partial<ResourceCounts>,
  requesting: Partial<ResourceCounts>
): TradeResult {
  const validation = isValidTradeOffer(state, fromPlayerId, { offering, requesting });
  if (!validation.valid) {
    return { success: false, newState: state, error: validation.error };
  }

  const newOffer: TradeOffer = {
    id: generateTradeId(),
    fromPlayerId,
    toPlayerId: null, // Broadcast to all
    offering: toFullResourceCounts(offering),
    requesting: toFullResourceCounts(requesting),
    declinedBy: [],
    isActive: true,
    createdAt: Date.now(),
  };

  return {
    success: true,
    newState: {
      ...state,
      activeOffers: [...state.activeOffers, newOffer],
    },
  };
}

/**
 * Validates if a player can accept a trade offer
 */
function canAcceptTrade(
  state: GameState,
  offerId: string,
  acceptingPlayerId: string
): TradeValidationResult {
  const offer = state.activeOffers.find(o => o.id === offerId);
  if (!offer) {
    return { valid: false, error: 'Trade offer not found' };
  }

  if (!offer.isActive) {
    return { valid: false, error: 'Trade offer is no longer active' };
  }

  if (offer.fromPlayerId === acceptingPlayerId) {
    return { valid: false, error: 'Cannot accept your own trade offer' };
  }

  // Check if targeted offer and this player is the target
  if (offer.toPlayerId !== null && offer.toPlayerId !== acceptingPlayerId) {
    return { valid: false, error: 'This offer is not for you' };
  }

  // Check if already declined
  if (offer.declinedBy.includes(acceptingPlayerId)) {
    return { valid: false, error: 'You have already declined this offer' };
  }

  // Check if accepting player has the requested resources
  const acceptingPlayer = getPlayer(state, acceptingPlayerId);
  if (!acceptingPlayer) {
    return { valid: false, error: 'Player not found' };
  }

  const fullRequesting = toFullResourceCounts(offer.requesting);
  if (!hasResources(acceptingPlayer.resources, fullRequesting)) {
    return { valid: false, error: 'Not enough resources to accept this trade' };
  }

  // Check if offering player still has the offered resources
  const offeringPlayer = getPlayer(state, offer.fromPlayerId);
  if (!offeringPlayer) {
    return { valid: false, error: 'Offering player not found' };
  }

  const fullOffering = toFullResourceCounts(offer.offering);
  if (!hasResources(offeringPlayer.resources, fullOffering)) {
    return { valid: false, error: 'Offering player no longer has the resources' };
  }

  return { valid: true };
}

/**
 * Accepts a trade offer (first accept wins)
 *
 * @param state - Current game state
 * @param offerId - ID of the trade offer to accept
 * @param acceptingPlayerId - ID of the player accepting the trade
 * @returns New game state with the trade executed
 */
export function acceptTrade(
  state: GameState,
  offerId: string,
  acceptingPlayerId: string
): TradeResult {
  const validation = canAcceptTrade(state, offerId, acceptingPlayerId);
  if (!validation.valid) {
    return { success: false, newState: state, error: validation.error };
  }

  const offer = state.activeOffers.find(o => o.id === offerId)!;
  const fullOffering = toFullResourceCounts(offer.offering);
  const fullRequesting = toFullResourceCounts(offer.requesting);

  // Execute the trade
  const newPlayers = state.players.map(player => {
    if (player.id === offer.fromPlayerId) {
      // Offerer gives offering, receives requesting
      return {
        ...player,
        resources: addResources(
          subtractResources(player.resources, fullOffering),
          fullRequesting
        ),
        totalTradesMade: player.totalTradesMade + 1,
      };
    } else if (player.id === acceptingPlayerId) {
      // Accepter gives requesting, receives offering
      return {
        ...player,
        resources: addResources(
          subtractResources(player.resources, fullRequesting),
          fullOffering
        ),
        totalTradesMade: player.totalTradesMade + 1,
      };
    }
    return player;
  });

  // Remove the completed offer and mark it inactive
  const newActiveOffers = state.activeOffers.map(o => {
    if (o.id === offerId) {
      return { ...o, isActive: false };
    }
    return o;
  });

  return {
    success: true,
    newState: {
      ...state,
      players: newPlayers,
      activeOffers: newActiveOffers,
    },
  };
}

/**
 * Declines a trade offer
 *
 * @param state - Current game state
 * @param offerId - ID of the trade offer to decline
 * @param decliningPlayerId - ID of the player declining the trade
 * @returns New game state with the decline recorded
 */
export function declineTrade(
  state: GameState,
  offerId: string,
  decliningPlayerId: string
): TradeResult {
  const offer = state.activeOffers.find(o => o.id === offerId);
  if (!offer) {
    return { success: false, newState: state, error: 'Trade offer not found' };
  }

  if (!offer.isActive) {
    return { success: false, newState: state, error: 'Trade offer is no longer active' };
  }

  if (offer.fromPlayerId === decliningPlayerId) {
    return { success: false, newState: state, error: 'Cannot decline your own trade offer' };
  }

  if (offer.declinedBy.includes(decliningPlayerId)) {
    return { success: false, newState: state, error: 'Already declined this offer' };
  }

  const newActiveOffers = state.activeOffers.map(o => {
    if (o.id === offerId) {
      const newDeclinedBy = [...o.declinedBy, decliningPlayerId];

      // Check if all other players have declined
      const otherPlayers = state.players.filter(p => p.id !== offer.fromPlayerId);
      const allDeclined = otherPlayers.every(p => newDeclinedBy.includes(p.id));

      return {
        ...o,
        declinedBy: newDeclinedBy,
        isActive: !allDeclined,
      };
    }
    return o;
  });

  return {
    success: true,
    newState: {
      ...state,
      activeOffers: newActiveOffers,
    },
  };
}

/**
 * Cancels a trade offer (by the offerer)
 *
 * @param state - Current game state
 * @param offerId - ID of the trade offer to cancel
 * @returns New game state with the offer cancelled
 */
export function cancelTrade(
  state: GameState,
  offerId: string
): TradeResult {
  const offer = state.activeOffers.find(o => o.id === offerId);
  if (!offer) {
    return { success: false, newState: state, error: 'Trade offer not found' };
  }

  // Only the offerer can cancel
  if (offer.fromPlayerId !== state.currentPlayerId) {
    return { success: false, newState: state, error: 'Only the offerer can cancel the trade' };
  }

  if (!offer.isActive) {
    return { success: false, newState: state, error: 'Trade offer is already inactive' };
  }

  const newActiveOffers = state.activeOffers.map(o => {
    if (o.id === offerId) {
      return { ...o, isActive: false };
    }
    return o;
  });

  return {
    success: true,
    newState: {
      ...state,
      activeOffers: newActiveOffers,
    },
  };
}

/**
 * Creates a counter-offer to an existing trade
 *
 * @param state - Current game state
 * @param originalOfferId - ID of the original trade offer
 * @param counteringPlayerId - ID of the player making the counter-offer
 * @param newOffering - What the countering player is offering
 * @param newRequesting - What the countering player is requesting
 * @returns New game state with the counter-offer added
 */
export function counterOffer(
  state: GameState,
  originalOfferId: string,
  counteringPlayerId: string,
  newOffering: Partial<ResourceCounts>,
  newRequesting: Partial<ResourceCounts>
): TradeResult {
  const originalOffer = state.activeOffers.find(o => o.id === originalOfferId);
  if (!originalOffer) {
    return { success: false, newState: state, error: 'Original trade offer not found' };
  }

  if (!originalOffer.isActive) {
    return { success: false, newState: state, error: 'Original trade offer is no longer active' };
  }

  if (originalOffer.fromPlayerId === counteringPlayerId) {
    return { success: false, newState: state, error: 'Cannot counter your own trade offer' };
  }

  // Validate the counter-offer (countering player must have the resources)
  const counteringPlayer = getPlayer(state, counteringPlayerId);
  if (!counteringPlayer) {
    return { success: false, newState: state, error: 'Player not found' };
  }

  if (!hasAnyResources(newOffering)) {
    return { success: false, newState: state, error: 'Must offer at least one resource' };
  }

  if (!hasAnyResources(newRequesting)) {
    return { success: false, newState: state, error: 'Must request at least one resource' };
  }

  const fullNewOffering = toFullResourceCounts(newOffering);
  if (!hasResources(counteringPlayer.resources, fullNewOffering)) {
    return { success: false, newState: state, error: 'Not enough resources for counter-offer' };
  }

  // Create a new trade offer from the countering player to the original offerer
  const counterOfferTrade: TradeOffer = {
    id: generateTradeId(),
    fromPlayerId: counteringPlayerId,
    toPlayerId: originalOffer.fromPlayerId, // Targeted to original offerer
    offering: fullNewOffering,
    requesting: toFullResourceCounts(newRequesting),
    declinedBy: [],
    isActive: true,
    createdAt: Date.now(),
  };

  return {
    success: true,
    newState: {
      ...state,
      activeOffers: [...state.activeOffers, counterOfferTrade],
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets all active trade offers for a player to respond to
 */
export function getActiveOffersForPlayer(
  state: GameState,
  playerId: string
): TradeOffer[] {
  return state.activeOffers.filter(offer =>
    offer.isActive &&
    offer.fromPlayerId !== playerId &&
    !offer.declinedBy.includes(playerId) &&
    (offer.toPlayerId === null || offer.toPlayerId === playerId)
  );
}

/**
 * Gets all active trade offers made by a player
 */
export function getPlayerActiveOffers(
  state: GameState,
  playerId: string
): TradeOffer[] {
  return state.activeOffers.filter(offer =>
    offer.isActive && offer.fromPlayerId === playerId
  );
}

/**
 * Clears all trade offers (typically called at end of turn)
 */
export function clearAllOffers(state: GameState): GameState {
  return {
    ...state,
    activeOffers: state.activeOffers.map(o => ({ ...o, isActive: false })),
  };
}

/**
 * Gets ports owned by a player
 */
export function getPlayerPorts(state: GameState, playerId: string): Port[] {
  const playerBuildings = state.buildings.filter(b => b.playerId === playerId);
  const playerVertexKeys = new Set(
    playerBuildings.map(b => vertexToKey(b.vertex))
  );

  return state.ports.filter(port =>
    port.vertices?.some(v => playerVertexKeys.has(vertexToKey(v)))
  );
}

/**
 * Checks if a player can afford to accept a trade offer
 */
export function canAffordTrade(
  state: GameState,
  playerId: string,
  requesting: Partial<ResourceCounts>
): boolean {
  const player = getPlayer(state, playerId);
  if (!player) return false;
  return hasResources(player.resources, toFullResourceCounts(requesting));
}
