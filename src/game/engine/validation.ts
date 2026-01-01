/**
 * Action Validation Module
 *
 * This module handles all action validation in OpenCatan:
 * - Checking if players can build settlements, cities, roads
 * - Checking if players can buy or play development cards
 * - Checking if trades are valid
 * - Validating game phase and turn requirements
 *
 * All functions return a validation result indicating success or failure with reason.
 * These functions do NOT modify state - they only check if actions are valid.
 */

import {
  GameState,
  VertexCoord,
  EdgeCoord,
  HexCoord,
  ResourceType,
  ResourceCounts,
  DevelopmentCard,
  DevelopmentCardType,
  TradeOffer,
  GamePhase,
  BUILDING_COSTS,
  vertexKey,
  edgeKey,
  hexKey,
} from '../../types';
import {
  hasResources,
  countTotalResources,
  getTradeRate,
} from './resources';
import {
  getBuildingAtVertex,
  getRoadAtEdge,
  satisfiesDistanceRule,
  isVertexOnLand,
  isEdgeOnLand,
  hasConnectionToEdge,
  hasRoadToVertex,
  getValidSettlementSpots,
  getValidRoadSpots,
  getValidCitySpots,
} from './building';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a validation check.
 */
export interface ValidationResult {
  /** Whether the action is valid */
  valid: boolean;
  /** Reason for rejection if invalid */
  reason?: string;
}

/**
 * Creates a successful validation result.
 */
const valid = (): ValidationResult => ({ valid: true });

/**
 * Creates a failed validation result with a reason.
 */
const invalid = (reason: string): ValidationResult => ({ valid: false, reason });

// ============================================================================
// TURN & PHASE VALIDATION
// ============================================================================

/**
 * Checks if it's the specified player's turn.
 *
 * @param state - Current game state
 * @param playerId - ID of the player to check
 * @returns Validation result
 */
export function isPlayersTurn(
  state: GameState,
  playerId: string
): ValidationResult {
  if (state.currentPlayerId !== playerId) {
    return invalid('It is not your turn');
  }
  return valid();
}

/**
 * Checks if the game is in one of the specified phases.
 *
 * @param state - Current game state
 * @param allowedPhases - Array of phases where this action is allowed
 * @returns Validation result
 */
export function isInPhase(
  state: GameState,
  allowedPhases: GamePhase[]
): ValidationResult {
  if (!allowedPhases.includes(state.phase)) {
    return invalid(`Cannot perform this action during ${state.phase} phase`);
  }
  return valid();
}

/**
 * Checks if a player is connected to the game.
 *
 * @param state - Current game state
 * @param playerId - ID of the player to check
 * @returns Validation result
 */
export function isPlayerConnected(
  state: GameState,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }
  if (!player.isConnected) {
    return invalid('Player is disconnected');
  }
  return valid();
}

// ============================================================================
// SETTLEMENT VALIDATION
// ============================================================================

/**
 * Validates if a player can build a settlement at a specific vertex.
 *
 * Checks:
 * 1. Player has enough resources (brick, lumber, grain, wool)
 * 2. Player has settlements remaining
 * 3. Vertex is on land
 * 4. Vertex is empty (no existing building)
 * 5. Satisfies distance rule (no adjacent buildings)
 * 6. Connected to player's road network (during normal play)
 *
 * @param state - Current game state
 * @param playerId - ID of the player building
 * @param vertex - Vertex to build on
 * @param isSetup - Whether this is during setup phase (skips road connection check)
 * @returns Validation result
 */
export function canBuildSettlement(
  state: GameState,
  playerId: string,
  vertex: VertexCoord,
  isSetup: boolean = false
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Check if player has settlements remaining
  if (player.settlementsRemaining <= 0) {
    return invalid('No settlements remaining');
  }

  // Check resources (skip during setup)
  if (!isSetup && !hasResources(player.resources, BUILDING_COSTS.settlement)) {
    return invalid('Not enough resources to build settlement');
  }

  // Check if vertex is on land
  if (!isVertexOnLand(state, vertex)) {
    return invalid('Cannot build on water');
  }

  // Check if vertex is empty
  if (getBuildingAtVertex(state, vertex)) {
    return invalid('There is already a building here');
  }

  // Check distance rule
  if (!satisfiesDistanceRule(state, vertex)) {
    return invalid('Too close to another settlement or city');
  }

  // Check road connection (not during setup)
  if (!isSetup && !hasRoadToVertex(state, playerId, vertex)) {
    return invalid('Must build on your road network');
  }

  return valid();
}

/**
 * Validates if a player can build a settlement during setup.
 * Simplified version that doesn't check resources or road connections.
 *
 * @param state - Current game state
 * @param playerId - ID of the player building
 * @param vertex - Vertex to build on
 * @returns Validation result
 */
export function canBuildSetupSettlement(
  state: GameState,
  playerId: string,
  vertex: VertexCoord
): ValidationResult {
  return canBuildSettlement(state, playerId, vertex, true);
}

// ============================================================================
// CITY VALIDATION
// ============================================================================

/**
 * Validates if a player can build a city at a specific vertex.
 *
 * Checks:
 * 1. Player has enough resources (3 ore, 2 grain)
 * 2. Player has cities remaining
 * 3. Player has a settlement at this vertex
 *
 * @param state - Current game state
 * @param playerId - ID of the player building
 * @param vertex - Vertex to upgrade
 * @returns Validation result
 */
export function canBuildCity(
  state: GameState,
  playerId: string,
  vertex: VertexCoord
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Check if player has cities remaining
  if (player.citiesRemaining <= 0) {
    return invalid('No cities remaining');
  }

  // Check resources
  if (!hasResources(player.resources, BUILDING_COSTS.city)) {
    return invalid('Not enough resources to build city');
  }

  // Check if player has a settlement at this vertex
  const building = getBuildingAtVertex(state, vertex);
  if (!building) {
    return invalid('No settlement here to upgrade');
  }
  if (building.playerId !== playerId) {
    return invalid('You do not own this settlement');
  }
  if (building.type !== 'settlement') {
    return invalid('This is already a city');
  }

  return valid();
}

// ============================================================================
// ROAD VALIDATION
// ============================================================================

/**
 * Validates if a player can build a road at a specific edge.
 *
 * Checks:
 * 1. Player has enough resources (brick, lumber)
 * 2. Player has roads remaining
 * 3. Edge is on land
 * 4. Edge is empty (no existing road)
 * 5. Connected to player's road network or settlement
 *
 * @param state - Current game state
 * @param playerId - ID of the player building
 * @param edge - Edge to build on
 * @param isFree - Whether this is a free road (Road Building card, setup)
 * @returns Validation result
 */
export function canBuildRoad(
  state: GameState,
  playerId: string,
  edge: EdgeCoord,
  isFree: boolean = false
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Check if player has roads remaining
  if (player.roadsRemaining <= 0) {
    return invalid('No roads remaining');
  }

  // Check resources (skip if free)
  if (!isFree && !hasResources(player.resources, BUILDING_COSTS.road)) {
    return invalid('Not enough resources to build road');
  }

  // Check if edge is on land
  if (!isEdgeOnLand(state, edge)) {
    return invalid('Cannot build road on water');
  }

  // Check if edge is empty
  if (getRoadAtEdge(state, edge)) {
    return invalid('There is already a road here');
  }

  // Check connection to player's network
  if (!hasConnectionToEdge(state, playerId, edge)) {
    return invalid('Road must connect to your existing roads or settlements');
  }

  return valid();
}

/**
 * Validates if a player can build a road during setup.
 * During setup, the road must connect to the just-placed settlement.
 *
 * @param state - Current game state
 * @param playerId - ID of the player building
 * @param edge - Edge to build on
 * @param settlementVertex - Vertex of the just-placed settlement
 * @returns Validation result
 */
export function canBuildSetupRoad(
  state: GameState,
  playerId: string,
  edge: EdgeCoord,
  settlementVertex: VertexCoord
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Check if player has roads remaining
  if (player.roadsRemaining <= 0) {
    return invalid('No roads remaining');
  }

  // Check if edge is on land
  if (!isEdgeOnLand(state, edge)) {
    return invalid('Cannot build road on water');
  }

  // Check if edge is empty
  if (getRoadAtEdge(state, edge)) {
    return invalid('There is already a road here');
  }

  // During setup, road must connect to the just-placed settlement
  // Get edges adjacent to the settlement vertex
  const { getEdgesAdjacentToVertex } = require('./building');
  const adjacentEdges = getEdgesAdjacentToVertex(settlementVertex);
  const edgeKeys = adjacentEdges.map((e: EdgeCoord) => edgeKey(e));

  if (!edgeKeys.includes(edgeKey(edge))) {
    return invalid('Road must connect to your settlement');
  }

  return valid();
}

// ============================================================================
// DEVELOPMENT CARD VALIDATION
// ============================================================================

/**
 * Validates if a player can buy a development card.
 *
 * Checks:
 * 1. Player has enough resources (ore, grain, wool)
 * 2. Development card deck is not empty
 * 3. It's the player's turn
 * 4. Game is in main phase
 *
 * @param state - Current game state
 * @param playerId - ID of the player buying
 * @returns Validation result
 */
export function canBuyDevCard(
  state: GameState,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Check turn
  const turnCheck = isPlayersTurn(state, playerId);
  if (!turnCheck.valid) return turnCheck;

  // Check phase
  const phaseCheck = isInPhase(state, ['main']);
  if (!phaseCheck.valid) return phaseCheck;

  // Check resources
  if (!hasResources(player.resources, BUILDING_COSTS.devCard)) {
    return invalid('Not enough resources to buy development card');
  }

  // Check deck has cards
  if (state.developmentDeck.length === 0) {
    return invalid('No development cards remaining');
  }

  return valid();
}

/**
 * Validates if a player can play a specific development card.
 *
 * Checks:
 * 1. Player owns the card
 * 2. Card was not bought this turn (except Victory Point)
 * 3. Player has not played a development card this turn
 * 4. It's the player's turn
 * 5. Game is in main phase (or roll phase for some cards)
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param cardType - Type of card to play
 * @returns Validation result
 */
export function canPlayDevCard(
  state: GameState,
  playerId: string,
  cardType: DevelopmentCardType
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Check turn
  const turnCheck = isPlayersTurn(state, playerId);
  if (!turnCheck.valid) return turnCheck;

  // Victory point cards are revealed automatically when winning,
  // they don't need to be "played"
  if (cardType === 'victoryPoint') {
    return invalid('Victory point cards are revealed automatically');
  }

  // Check phase - Knight can be played before rolling, others during main
  if (cardType === 'knight') {
    const phaseCheck = isInPhase(state, ['roll', 'main']);
    if (!phaseCheck.valid) return phaseCheck;
  } else {
    const phaseCheck = isInPhase(state, ['main']);
    if (!phaseCheck.valid) return phaseCheck;
  }

  // Check if player has already played a dev card this turn
  if (player.hasPlayedDevCardThisTurn) {
    return invalid('You can only play one development card per turn');
  }

  // Find the card in player's hand
  const card = player.developmentCards.find(
    (c) => c.type === cardType && !c.played
  );
  if (!card) {
    return invalid('You do not have this card');
  }

  // Check if card was bought this turn
  if (card.purchasedTurn === state.turn) {
    return invalid('Cannot play a card on the same turn it was bought');
  }

  return valid();
}

// ============================================================================
// TRADE VALIDATION
// ============================================================================

/**
 * Validates if a player can make a trade offer.
 *
 * Checks:
 * 1. It's the player's turn
 * 2. Game is in main phase
 * 3. Player has the resources they're offering
 * 4. Offer is not empty (something must be offered and requested)
 *
 * @param state - Current game state
 * @param playerId - ID of the player making the offer
 * @param offering - Resources being offered
 * @param requesting - Resources being requested
 * @returns Validation result
 */
export function canMakeTradeOffer(
  state: GameState,
  playerId: string,
  offering: Partial<ResourceCounts>,
  requesting: Partial<ResourceCounts>
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Check turn
  const turnCheck = isPlayersTurn(state, playerId);
  if (!turnCheck.valid) return turnCheck;

  // Check phase
  const phaseCheck = isInPhase(state, ['main']);
  if (!phaseCheck.valid) return phaseCheck;

  // Check player has resources being offered
  if (!hasResources(player.resources, offering)) {
    return invalid('You do not have the resources you are offering');
  }

  // Check offer is not empty
  const offeringTotal = Object.values(offering).reduce((sum, n) => sum + (n || 0), 0);
  const requestingTotal = Object.values(requesting).reduce((sum, n) => sum + (n || 0), 0);

  if (offeringTotal === 0) {
    return invalid('You must offer at least one resource');
  }
  if (requestingTotal === 0) {
    return invalid('You must request at least one resource');
  }

  return valid();
}

/**
 * Validates if a player can accept a trade offer.
 *
 * Checks:
 * 1. Trade offer exists and is active
 * 2. Player is not the one who made the offer
 * 3. Player has the resources being requested
 * 4. Player has not already declined
 *
 * @param state - Current game state
 * @param playerId - ID of the player accepting
 * @param offerId - ID of the trade offer
 * @returns Validation result
 */
export function canAcceptTradeOffer(
  state: GameState,
  playerId: string,
  offerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Find the offer
  const offer = state.pendingTradeOffers.find((o) => o.id === offerId);
  if (!offer) {
    return invalid('Trade offer not found');
  }

  // Check offer is still active
  if (!offer.isActive) {
    return invalid('Trade offer is no longer active');
  }

  // Check player is not the offerer
  if (offer.fromPlayerId === playerId) {
    return invalid('Cannot accept your own trade offer');
  }

  // Check if player was targeted (if specific targets)
  if (
    offer.targetPlayerIds.length > 0 &&
    !offer.targetPlayerIds.includes(playerId)
  ) {
    return invalid('This trade offer was not made to you');
  }

  // Check player has not declined
  if (offer.declinedBy.includes(playerId)) {
    return invalid('You have already declined this offer');
  }

  // Check player has the requested resources
  if (!hasResources(player.resources, offer.requesting)) {
    return invalid('You do not have the requested resources');
  }

  return valid();
}

/**
 * Validates if a player can do a bank trade.
 *
 * Checks:
 * 1. It's the player's turn
 * 2. Game is in main phase
 * 3. Player has enough of the give resource (at their rate)
 * 4. Bank has the receive resource
 * 5. Give amount matches player's trade rate
 *
 * @param state - Current game state
 * @param playerId - ID of the player trading
 * @param giveResource - Resource to give to bank
 * @param giveAmount - Amount to give (must match trade rate)
 * @param receiveResource - Resource to receive from bank
 * @returns Validation result
 */
export function canBankTrade(
  state: GameState,
  playerId: string,
  giveResource: ResourceType,
  giveAmount: number,
  receiveResource: ResourceType
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Check turn
  const turnCheck = isPlayersTurn(state, playerId);
  if (!turnCheck.valid) return turnCheck;

  // Check phase
  const phaseCheck = isInPhase(state, ['main']);
  if (!phaseCheck.valid) return phaseCheck;

  // Get player's trade rate for this resource
  const rate = getTradeRate(state, playerId, giveResource);

  // Check give amount matches rate
  if (giveAmount !== rate) {
    return invalid(`Your trade rate for ${giveResource} is ${rate}:1`);
  }

  // Check player has enough of give resource
  if (player.resources[giveResource] < giveAmount) {
    return invalid(`You don't have enough ${giveResource}`);
  }

  // Check bank has receive resource
  if (state.bank[receiveResource] < 1) {
    return invalid(`Bank is out of ${receiveResource}`);
  }

  // Cannot trade same resource type
  if (giveResource === receiveResource) {
    return invalid('Cannot trade a resource for itself');
  }

  return valid();
}

// ============================================================================
// ROBBER VALIDATION
// ============================================================================

/**
 * Validates if a player can move the robber to a specific hex.
 *
 * Checks:
 * 1. It's the player's turn
 * 2. Game is in robber-move phase
 * 3. Hex is different from current robber location
 * 4. Hex is a valid land hex (not water, not fog)
 * 5. If friendly robber enabled: hex must have player with 3+ VP
 *
 * @param state - Current game state
 * @param playerId - ID of the player moving robber
 * @param targetHex - Hex to move robber to
 * @returns Validation result
 */
export function canMoveRobber(
  state: GameState,
  playerId: string,
  targetHex: HexCoord
): ValidationResult {
  // Check turn
  const turnCheck = isPlayersTurn(state, playerId);
  if (!turnCheck.valid) return turnCheck;

  // Check phase
  const phaseCheck = isInPhase(state, ['robber-move']);
  if (!phaseCheck.valid) return phaseCheck;

  // Find target tile
  const tile = state.tiles.find(
    (t) => hexKey(t.coord) === hexKey(targetHex)
  );
  if (!tile) {
    return invalid('Invalid hex location');
  }

  // Check not water
  if (tile.terrain === 'water') {
    return invalid('Cannot place robber on water');
  }

  // Check not fog (Seafarers)
  if (tile.terrain === 'fog' || tile.isFog) {
    return invalid('Cannot place robber on unrevealed tiles');
  }

  // Check different from current location
  if (hexKey(state.robberLocation) === hexKey(targetHex)) {
    return invalid('Must move robber to a different hex');
  }

  // Check friendly robber rule if enabled
  if (state.settings.friendlyRobber) {
    // Get players with settlements/cities on this hex
    const { getAdjacentVertices } = require('./resources');
    const adjacentVertices = getAdjacentVertices(targetHex);
    const adjacentKeys = adjacentVertices.map((v: VertexCoord) => vertexKey(v));

    const playersOnHex = new Set<string>();
    for (const building of state.buildings) {
      if (adjacentKeys.includes(vertexKey(building.vertex))) {
        playersOnHex.add(building.playerId);
      }
    }

    // Check if all players on this hex have less than 3 VP
    // This requires calculating VP which we'll import from victory module
    // For now, we'll do a simple check based on buildings
    let allPlayersLowVP = true;
    for (const pid of playersOnHex) {
      // Skip the active player (can always place on own hexes)
      if (pid === playerId) continue;

      const p = state.players.find((player) => player.id === pid);
      if (p) {
        // Simple VP calculation: settlements + cities * 2
        const settlements = state.buildings.filter(
          (b) => b.playerId === pid && b.type === 'settlement'
        ).length;
        const cities = state.buildings.filter(
          (b) => b.playerId === pid && b.type === 'city'
        ).length;
        const estimatedVP = settlements + cities * 2;

        if (estimatedVP >= 3) {
          allPlayersLowVP = false;
          break;
        }
      }
    }

    if (allPlayersLowVP && playersOnHex.size > 0) {
      // Check if there's any other player besides the active player
      const hasOtherPlayers = [...playersOnHex].some((pid) => pid !== playerId);
      if (hasOtherPlayers) {
        return invalid(
          'Friendly Robber: Cannot rob players with less than 3 victory points'
        );
      }
    }
  }

  return valid();
}

/**
 * Validates if a player can steal from a specific victim.
 *
 * Checks:
 * 1. It's the player's turn
 * 2. Game is in robber-steal phase
 * 3. Victim has a settlement or city adjacent to robber
 * 4. Victim has at least one resource
 * 5. Victim is not the thief
 *
 * @param state - Current game state
 * @param thiefId - ID of the player stealing
 * @param victimId - ID of the player being stolen from
 * @returns Validation result
 */
export function canStealFrom(
  state: GameState,
  thiefId: string,
  victimId: string
): ValidationResult {
  // Check turn
  const turnCheck = isPlayersTurn(state, thiefId);
  if (!turnCheck.valid) return turnCheck;

  // Check phase
  const phaseCheck = isInPhase(state, ['robber-steal']);
  if (!phaseCheck.valid) return phaseCheck;

  // Cannot steal from self
  if (thiefId === victimId) {
    return invalid('Cannot steal from yourself');
  }

  // Get victim
  const victim = state.players.find((p) => p.id === victimId);
  if (!victim) {
    return invalid('Victim not found');
  }

  // Check victim has resources
  if (countTotalResources(victim.resources) === 0) {
    return invalid('This player has no resources');
  }

  // Check victim has building adjacent to robber
  const { getAdjacentVertices } = require('./resources');
  const adjacentVertices = getAdjacentVertices(state.robberLocation);
  const adjacentKeys = adjacentVertices.map((v: VertexCoord) => vertexKey(v));

  const hasAdjacentBuilding = state.buildings.some(
    (b) =>
      b.playerId === victimId && adjacentKeys.includes(vertexKey(b.vertex))
  );

  if (!hasAdjacentBuilding) {
    return invalid('This player does not have a building adjacent to the robber');
  }

  return valid();
}

// ============================================================================
// DISCARD VALIDATION
// ============================================================================

/**
 * Validates if a player can discard the specified cards.
 *
 * Checks:
 * 1. Player needs to discard (has more than limit)
 * 2. Player is discarding exactly half (rounded down)
 * 3. Player has all the cards being discarded
 *
 * @param state - Current game state
 * @param playerId - ID of the player discarding
 * @param cards - Cards to discard
 * @returns Validation result
 */
export function canDiscard(
  state: GameState,
  playerId: string,
  cards: Partial<ResourceCounts>
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return invalid('Player not found');
  }

  // Check phase
  const phaseCheck = isInPhase(state, ['discard']);
  if (!phaseCheck.valid) return phaseCheck;

  // Check player needs to discard
  if (!state.playersNeedingToDiscard?.includes(playerId)) {
    return invalid('You do not need to discard');
  }

  const totalCards = countTotalResources(player.resources);
  const requiredDiscard = Math.floor(totalCards / 2);

  // Calculate total being discarded
  const discardTotal = Object.values(cards).reduce(
    (sum, n) => sum + (n || 0),
    0
  );

  // Check discarding exactly the right amount
  if (discardTotal !== requiredDiscard) {
    return invalid(`You must discard exactly ${requiredDiscard} cards`);
  }

  // Check player has all cards being discarded
  if (!hasResources(player.resources, cards)) {
    return invalid('You do not have all of these cards');
  }

  return valid();
}

// ============================================================================
// DICE ROLL VALIDATION
// ============================================================================

/**
 * Validates if a player can roll the dice.
 *
 * @param state - Current game state
 * @param playerId - ID of the player rolling
 * @returns Validation result
 */
export function canRollDice(
  state: GameState,
  playerId: string
): ValidationResult {
  // Check turn
  const turnCheck = isPlayersTurn(state, playerId);
  if (!turnCheck.valid) return turnCheck;

  // Check phase
  const phaseCheck = isInPhase(state, ['roll']);
  if (!phaseCheck.valid) return phaseCheck;

  return valid();
}

/**
 * Validates if a player can end their turn.
 *
 * @param state - Current game state
 * @param playerId - ID of the player ending turn
 * @returns Validation result
 */
export function canEndTurn(
  state: GameState,
  playerId: string
): ValidationResult {
  // Check turn
  const turnCheck = isPlayersTurn(state, playerId);
  if (!turnCheck.valid) return turnCheck;

  // Check phase - can only end turn during main phase
  const phaseCheck = isInPhase(state, ['main']);
  if (!phaseCheck.valid) {
    return invalid('Cannot end turn during this phase');
  }

  return valid();
}
