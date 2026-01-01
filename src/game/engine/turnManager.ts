/**
 * Turn Manager Module
 *
 * This module handles turn and phase management in OpenCatan:
 * - Getting valid actions for the current phase
 * - Advancing through game phases
 * - Managing turn transitions
 * - Handling setup phase (snake draft)
 *
 * All functions are pure and return new state objects without mutations.
 */

import {
  GameState,
  GameAction,
  GamePhase,
  Player,
  VertexCoord,
  EdgeCoord,
  ResourceType,
} from '../../types';

import {
  getValidRoadPlacements,
  getValidSettlementPlacements,
  getValidCityPlacements,
} from './buildingManager';
import { getValidRobberPlacements, getStealTargets } from './robberManager';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a valid action that can be performed
 */
export type ValidAction = GameAction;

// ============================================================================
// SETUP PHASE MANAGEMENT
// ============================================================================

/**
 * Gets the setup order for snake draft placement.
 * First round: 0, 1, 2, 3 (or however many players)
 * Second round: 3, 2, 1, 0 (reverse order)
 *
 * @param playerCount - Number of players in the game
 * @returns Array of player indices in setup order
 */
export function getSetupOrder(playerCount: number): number[] {
  const firstRound = Array.from({ length: playerCount }, (_, i) => i);
  const secondRound = [...firstRound].reverse();
  return [...firstRound, ...secondRound];
}

/**
 * Advances the setup phase to the next player/phase.
 * Handles the snake draft order where players place in order 0,1,2,3,3,2,1,0.
 *
 * @param state - Current game state
 * @returns New game state with updated phase and current player
 */
export function advanceSetup(state: GameState): GameState {
  const playerCount = state.players.length;
  const setupOrder = getSetupOrder(playerCount);
  const currentIndex = state.setupPlayerIndex || 0;

  // Determine next setup index
  const nextIndex = currentIndex + 1;
  const totalSetupTurns = playerCount * 2; // 2 settlements per player

  // Check if setup is complete
  if (nextIndex >= totalSetupTurns) {
    // Setup complete, move to first player's roll phase
    return {
      ...state,
      phase: 'roll',
      turn: 1,
      currentPlayerId: state.turnOrder[0],
      setupPlayerIndex: undefined,
      setupDirection: undefined,
    };
  }

  // Determine next phase
  let nextPhase: GamePhase;
  if (nextIndex < playerCount) {
    // First round of settlements
    nextPhase = 'setup-settlement-1';
  } else {
    // Second round of settlements
    nextPhase = 'setup-settlement-2';
  }

  // Get next player from setup order
  const nextPlayerIndex = setupOrder[nextIndex];
  const nextPlayerId = state.turnOrder[nextPlayerIndex];

  return {
    ...state,
    phase: nextPhase,
    currentPlayerId: nextPlayerId,
    setupPlayerIndex: nextIndex,
    setupDirection: nextIndex >= playerCount ? 'backward' : 'forward',
  };
}

// ============================================================================
// TURN MANAGEMENT
// ============================================================================

/**
 * Advances to the next player's turn.
 *
 * @param state - Current game state
 * @returns New game state with next player's turn
 */
export function nextTurn(state: GameState): GameState {
  // Find current player index in turn order
  const currentIndex = state.turnOrder.indexOf(state.currentPlayerId);
  const nextIndex = (currentIndex + 1) % state.turnOrder.length;
  const nextPlayerId = state.turnOrder[nextIndex];

  // Reset turn-specific state for previous player
  const newPlayers = state.players.map(player => {
    if (player.id === state.currentPlayerId) {
      return {
        ...player,
        hasPlayedDevCard: false,
        devCardsBoughtThisTurn: [],
      };
    }
    return player;
  });

  return {
    ...state,
    players: newPlayers,
    phase: 'roll',
    turn: state.turn + 1,
    currentPlayerId: nextPlayerId,
    turnTimeRemaining: state.settings.turnTimer,
    turnStartedAt: Date.now(),
    lastRoll: undefined,
    roadBuildingRemaining: undefined,
    yearOfPlentyRemaining: undefined,
  };
}

/**
 * Advances to the next phase within a turn.
 * This is used for automatic phase transitions.
 *
 * @param state - Current game state
 * @returns New game state with next phase
 */
export function advancePhase(state: GameState): GameState {
  switch (state.phase) {
    case 'roll':
      return { ...state, phase: 'main' };

    case 'discard':
      if (state.playersNeedingToDiscard.length === 0) {
        return { ...state, phase: 'robber-move' };
      }
      return state;

    case 'robber-move':
      return { ...state, phase: 'robber-steal' };

    case 'robber-steal':
      return { ...state, phase: 'main' };

    case 'road-building':
      if ((state.roadBuildingRemaining || 0) <= 0) {
        return { ...state, phase: 'main', roadBuildingRemaining: undefined };
      }
      return state;

    case 'year-of-plenty':
      if ((state.yearOfPlentyRemaining || 0) <= 0) {
        return { ...state, phase: 'main', yearOfPlentyRemaining: undefined };
      }
      return state;

    case 'monopoly':
      return { ...state, phase: 'main' };

    default:
      return state;
  }
}

// ============================================================================
// VALID ACTIONS
// ============================================================================

/**
 * Gets all valid actions for a player in the current phase.
 *
 * @param state - Current game state
 * @param playerId - ID of the player to get actions for
 * @returns Array of valid actions the player can perform
 */
export function getValidActions(state: GameState, playerId: string): GameAction[] {
  const actions: GameAction[] = [];
  const isCurrentPlayer = state.currentPlayerId === playerId;
  const player = state.players.find(p => p.id === playerId);

  if (!player) return actions;

  switch (state.phase) {
    // ==================== SETUP PHASES ====================
    case 'setup-settlement-1':
    case 'setup-settlement-2': {
      if (!isCurrentPlayer) return actions;

      const validSpots = getValidSettlementPlacements(state, playerId, true);
      for (const vertex of validSpots) {
        actions.push({ type: 'PLACE_SETTLEMENT', vertex });
      }
      break;
    }

    case 'setup-road-1':
    case 'setup-road-2': {
      if (!isCurrentPlayer) return actions;

      const validRoadSpots = getValidRoadPlacements(state, playerId);
      for (const edge of validRoadSpots) {
        actions.push({ type: 'PLACE_ROAD', edge });
      }
      break;
    }

    // ==================== ROLL PHASE ====================
    case 'roll': {
      if (!isCurrentPlayer) return actions;

      actions.push({ type: 'ROLL_DICE' });

      // Can play knight before rolling
      if (canPlayDevCard(state, player, 'knight')) {
        actions.push({
          type: 'PLAY_KNIGHT',
          hex: state.robberLocation, // Placeholder, actual hex chosen later
        });
      }
      break;
    }

    // ==================== DISCARD PHASE ====================
    case 'discard': {
      if (state.playersNeedingToDiscard.includes(playerId)) {
        // Player needs to choose resources to discard
        // We return a template action; actual resources are chosen by player
        actions.push({
          type: 'DISCARD_RESOURCES',
          resources: {}, // Placeholder, actual selection by player
        });
      }
      break;
    }

    // ==================== ROBBER PHASES ====================
    case 'robber-move': {
      if (!isCurrentPlayer) return actions;

      const validPlacements = getValidRobberPlacements(state, state.settings.friendlyRobber);
      for (const hex of validPlacements) {
        actions.push({ type: 'MOVE_ROBBER', hex });
      }
      break;
    }

    case 'robber-steal': {
      if (!isCurrentPlayer) return actions;

      const stealTargets = getStealTargets(state, state.robberLocation, playerId);
      for (const victimId of stealTargets) {
        actions.push({ type: 'STEAL_RESOURCE', victimId });
      }

      if (stealTargets.length === 0) {
        actions.push({ type: 'SKIP_STEAL' });
      }
      break;
    }

    // ==================== MAIN PHASE ====================
    case 'main': {
      if (!isCurrentPlayer) return actions;

      // Build Road
      if (player.roadsRemaining > 0 && hasResources(player, { brick: 1, lumber: 1 })) {
        const validRoadSpots = getValidRoadPlacements(state, playerId);
        for (const edge of validRoadSpots) {
          actions.push({ type: 'BUILD_ROAD', edge });
        }
      }

      // Build Settlement
      if (player.settlementsRemaining > 0 && hasResources(player, { brick: 1, lumber: 1, grain: 1, wool: 1 })) {
        const validSettlementSpots = getValidSettlementPlacements(state, playerId, false);
        for (const vertex of validSettlementSpots) {
          actions.push({ type: 'BUILD_SETTLEMENT', vertex });
        }
      }

      // Build City
      if (player.citiesRemaining > 0 && hasResources(player, { ore: 3, grain: 2 })) {
        const validCitySpots = getValidCityPlacements(state, playerId);
        for (const vertex of validCitySpots) {
          actions.push({ type: 'BUILD_CITY', vertex });
        }
      }

      // Buy Development Card
      if (state.developmentDeck.length > 0 && hasResources(player, { ore: 1, grain: 1, wool: 1 })) {
        actions.push({ type: 'BUY_DEVELOPMENT_CARD' });
      }

      // Play Development Cards
      if (!player.hasPlayedDevCard) {
        if (canPlayDevCard(state, player, 'knight')) {
          actions.push({ type: 'PLAY_KNIGHT', hex: state.robberLocation });
        }
        if (canPlayDevCard(state, player, 'roadBuilding')) {
          actions.push({ type: 'PLAY_ROAD_BUILDING' });
        }
        if (canPlayDevCard(state, player, 'yearOfPlenty')) {
          // Placeholder resources - actual selection by player
          actions.push({ type: 'PLAY_YEAR_OF_PLENTY', resources: ['brick', 'brick'] });
        }
        if (canPlayDevCard(state, player, 'monopoly')) {
          // Placeholder resource - actual selection by player
          actions.push({ type: 'PLAY_MONOPOLY', resource: 'brick' });
        }
      }

      // End Turn
      actions.push({ type: 'END_TURN' });
      break;
    }

    // ==================== ROAD BUILDING PHASE ====================
    case 'road-building': {
      if (!isCurrentPlayer) return actions;

      const remaining = state.roadBuildingRemaining || 0;
      if (remaining > 0 && player.roadsRemaining > 0) {
        const validRoadSpots = getValidRoadPlacements(state, playerId);
        for (const edge of validRoadSpots) {
          actions.push({ type: 'BUILD_ROAD', edge });
        }
      }

      // Can complete early if no valid spots
      if (remaining <= 0 || getValidRoadPlacements(state, playerId).length === 0) {
        actions.push({ type: 'COMPLETE_ROAD_BUILDING' });
      }
      break;
    }

    // ==================== YEAR OF PLENTY PHASE ====================
    case 'year-of-plenty': {
      if (!isCurrentPlayer) return actions;

      // Player chooses 2 resources
      const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];
      for (const r1 of resourceTypes) {
        for (const r2 of resourceTypes) {
          if (state.bank[r1] > 0 && (r1 === r2 ? state.bank[r1] > 1 : state.bank[r2] > 0)) {
            actions.push({ type: 'PLAY_YEAR_OF_PLENTY', resources: [r1, r2] });
          }
        }
      }
      break;
    }

    // ==================== MONOPOLY PHASE ====================
    case 'monopoly': {
      if (!isCurrentPlayer) return actions;

      const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];
      for (const resource of resourceTypes) {
        actions.push({ type: 'PLAY_MONOPOLY', resource });
      }
      break;
    }

    default:
      break;
  }

  return actions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if a player has the required resources
 */
function hasResources(
  player: Player,
  required: Partial<Record<ResourceType, number>>
): boolean {
  for (const [resource, amount] of Object.entries(required)) {
    if ((player.resources[resource as ResourceType] || 0) < (amount || 0)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if a player can play a specific development card
 */
function canPlayDevCard(
  state: GameState,
  player: Player,
  cardType: 'knight' | 'roadBuilding' | 'yearOfPlenty' | 'monopoly'
): boolean {
  if (player.hasPlayedDevCard) return false;

  const card = player.developmentCards.find(
    c => c.type === cardType &&
         !c.isPlayed &&
         c.turnBought !== state.turn
  );

  return card !== undefined;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  hasResources,
  canPlayDevCard,
};
