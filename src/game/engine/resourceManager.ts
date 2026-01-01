/**
 * Resource Manager Module
 *
 * This module handles all resource-related operations in OpenCatan:
 * - Distributing resources for dice rolls
 * - Checking if players can afford costs
 * - Adding and deducting resources
 * - Managing the discard phase (on rolling 7)
 *
 * This module provides the public API and wraps/extends the core
 * resource functions from resources.ts.
 *
 * All functions are pure and return new state objects without mutations.
 */

import {
  GameState,
  Player,
  ResourceType,
  ResourceCounts,
  VertexCoord,
  vertexToKey,
  TERRAIN_RESOURCE_MAP,
  createEmptyResources,
} from '../../types';

import { getResourcesForRoll } from './diceRoller';

// Re-export core resource utilities from resources.ts
export {
  addResources as addResourceCounts,
  subtractResources as subtractResourceCounts,
  hasResources as hasResourceCounts,
  countTotalResources,
  getTradeRate,
  payToBank,
  takeFromBank,
  transferResources,
  giveStartingResources,
  executeBankTrade,
} from './resources';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a resource distribution operation
 */
export interface DistributionResult {
  /** New game state after distribution */
  state: GameState;
  /** Resources distributed to each player */
  distributions: Record<string, Partial<ResourceCounts>>;
  /** Whether any bank shortages occurred */
  hadShortage: boolean;
}

// ============================================================================
// RESOURCE DISTRIBUTION
// ============================================================================

/**
 * Distributes resources to all players based on a dice roll.
 *
 * Handles the complete distribution process including:
 * - Finding producing tiles
 * - Calculating resources per player based on buildings
 * - Applying bank shortage rules
 * - Updating player and bank resource counts
 *
 * @param state - Current game state
 * @param roll - The dice roll total (2-12)
 * @returns New game state with resources distributed
 */
export function distributeResources(state: GameState, roll: number): GameState {
  // Get resources each player should receive
  const production = getResourcesForRoll(state, roll);

  // Check for bank shortages
  const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];
  const actualDistribution: Record<string, ResourceCounts> = {};

  // Initialize actual distribution for all players
  for (const player of state.players) {
    actualDistribution[player.id] = createEmptyResources();
  }

  // Process each resource type
  for (const resource of resourceTypes) {
    // Calculate total needed for this resource
    let totalNeeded = 0;
    const playersReceiving: { playerId: string; amount: number }[] = [];

    for (const [playerId, resources] of Object.entries(production)) {
      const amount = resources[resource] || 0;
      if (amount > 0) {
        totalNeeded += amount;
        playersReceiving.push({ playerId, amount });
      }
    }

    // Check bank availability
    const bankAvailable = state.bank[resource];

    if (totalNeeded <= bankAvailable) {
      // Bank has enough - distribute normally
      for (const { playerId, amount } of playersReceiving) {
        actualDistribution[playerId][resource] = amount;
      }
    } else if (playersReceiving.length === 1) {
      // Only one player - they get what's available
      const { playerId } = playersReceiving[0];
      actualDistribution[playerId][resource] = Math.min(
        playersReceiving[0].amount,
        bankAvailable
      );
    }
    // If multiple players and not enough, nobody gets any (Catan shortage rule)
  }

  // Apply distributions to game state
  let newBank = { ...state.bank };
  const newPlayers = state.players.map(player => {
    const dist = actualDistribution[player.id];
    const totalAdded = Object.values(dist).reduce((sum, n) => sum + n, 0);

    if (totalAdded > 0) {
      // Subtract from bank
      for (const resource of resourceTypes) {
        newBank[resource] -= dist[resource];
      }

      // Add to player
      return {
        ...player,
        resources: {
          brick: player.resources.brick + dist.brick,
          lumber: player.resources.lumber + dist.lumber,
          ore: player.resources.ore + dist.ore,
          grain: player.resources.grain + dist.grain,
          wool: player.resources.wool + dist.wool,
        },
        totalResourcesCollected: player.totalResourcesCollected + totalAdded,
      };
    }

    return player;
  });

  return {
    ...state,
    players: newPlayers,
    bank: newBank,
  };
}

// ============================================================================
// AFFORDABILITY CHECKS
// ============================================================================

/**
 * Checks if a player can afford a given cost.
 *
 * @param player - The player to check
 * @param cost - The resource cost
 * @returns True if the player has enough resources
 */
export function canAfford(player: Player, cost: Partial<ResourceCounts>): boolean {
  return (
    player.resources.brick >= (cost.brick || 0) &&
    player.resources.lumber >= (cost.lumber || 0) &&
    player.resources.ore >= (cost.ore || 0) &&
    player.resources.grain >= (cost.grain || 0) &&
    player.resources.wool >= (cost.wool || 0)
  );
}

// ============================================================================
// RESOURCE MODIFICATION
// ============================================================================

/**
 * Deducts resources from a player.
 *
 * @param state - Current game state
 * @param playerId - ID of the player to deduct from
 * @param cost - Resources to deduct
 * @returns New game state with updated player resources
 */
export function deductResources(
  state: GameState,
  playerId: string,
  cost: Partial<ResourceCounts>
): GameState {
  const newPlayers = state.players.map(player => {
    if (player.id !== playerId) return player;

    return {
      ...player,
      resources: {
        brick: player.resources.brick - (cost.brick || 0),
        lumber: player.resources.lumber - (cost.lumber || 0),
        ore: player.resources.ore - (cost.ore || 0),
        grain: player.resources.grain - (cost.grain || 0),
        wool: player.resources.wool - (cost.wool || 0),
      },
    };
  });

  // Add deducted resources to bank
  const newBank = {
    brick: state.bank.brick + (cost.brick || 0),
    lumber: state.bank.lumber + (cost.lumber || 0),
    ore: state.bank.ore + (cost.ore || 0),
    grain: state.bank.grain + (cost.grain || 0),
    wool: state.bank.wool + (cost.wool || 0),
  };

  return {
    ...state,
    players: newPlayers,
    bank: newBank,
  };
}

/**
 * Adds resources to a player.
 *
 * @param state - Current game state
 * @param playerId - ID of the player to add to
 * @param resources - Resources to add
 * @returns New game state with updated player resources
 */
export function addResources(
  state: GameState,
  playerId: string,
  resources: Partial<ResourceCounts>
): GameState {
  const newPlayers = state.players.map(player => {
    if (player.id !== playerId) return player;

    return {
      ...player,
      resources: {
        brick: player.resources.brick + (resources.brick || 0),
        lumber: player.resources.lumber + (resources.lumber || 0),
        ore: player.resources.ore + (resources.ore || 0),
        grain: player.resources.grain + (resources.grain || 0),
        wool: player.resources.wool + (resources.wool || 0),
      },
    };
  });

  // Deduct from bank
  const newBank = {
    brick: state.bank.brick - (resources.brick || 0),
    lumber: state.bank.lumber - (resources.lumber || 0),
    ore: state.bank.ore - (resources.ore || 0),
    grain: state.bank.grain - (resources.grain || 0),
    wool: state.bank.wool - (resources.wool || 0),
  };

  return {
    ...state,
    players: newPlayers,
    bank: newBank,
  };
}

// ============================================================================
// DISCARD PHASE
// ============================================================================

/**
 * Gets the list of players who must discard when a 7 is rolled.
 *
 * Players with more than the discard limit (default 7) must discard
 * half their cards (rounded down).
 *
 * @param state - Current game state
 * @returns Array of player IDs who must discard
 */
export function getPlayersWhoMustDiscard(state: GameState): string[] {
  const discardLimit = state.settings.discardLimit || 7;

  return state.players
    .filter(player => {
      const totalCards = getTotalResourceCount(player.resources);
      return totalCards > discardLimit;
    })
    .map(player => player.id);
}

/**
 * Gets the number of cards a player must discard.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Number of cards to discard (half, rounded down)
 */
export function getDiscardAmount(state: GameState, playerId: string): number {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return 0;

  const totalCards = getTotalResourceCount(player.resources);
  return Math.floor(totalCards / 2);
}

/**
 * Processes a discard action from a player.
 *
 * @param state - Current game state
 * @param playerId - ID of the player discarding
 * @param discarded - Resources being discarded
 * @returns New game state with discarded resources
 */
export function processDiscard(
  state: GameState,
  playerId: string,
  discarded: Partial<ResourceCounts>
): GameState {
  // Validate discard amount
  const requiredDiscard = getDiscardAmount(state, playerId);
  const discardedTotal = Object.values(discarded).reduce((sum, n) => sum + (n || 0), 0);

  if (discardedTotal !== requiredDiscard) {
    throw new Error(`Must discard exactly ${requiredDiscard} cards`);
  }

  // Deduct resources and add to bank
  let newState = deductResources(state, playerId, discarded);

  // Remove player from discard list
  const newPlayersNeeding = newState.playersNeedingToDiscard.filter(
    id => id !== playerId
  );

  return {
    ...newState,
    playersNeedingToDiscard: newPlayersNeeding,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets the total number of resource cards a player has.
 *
 * @param resources - The resource counts
 * @returns Total number of cards
 */
export function getTotalResourceCount(resources: ResourceCounts): number {
  return (
    resources.brick +
    resources.lumber +
    resources.ore +
    resources.grain +
    resources.wool
  );
}

/**
 * Creates a partial resource count for a single resource type.
 *
 * @param resource - The resource type
 * @param amount - The amount
 * @returns Partial resource counts object
 */
export function singleResource(
  resource: ResourceType,
  amount: number = 1
): Partial<ResourceCounts> {
  return { [resource]: amount };
}

/**
 * Merges multiple partial resource counts together.
 *
 * @param counts - Array of partial resource counts
 * @returns Combined resource counts
 */
export function mergeResourceCounts(
  ...counts: Partial<ResourceCounts>[]
): ResourceCounts {
  const result = createEmptyResources();

  for (const count of counts) {
    result.brick += count.brick || 0;
    result.lumber += count.lumber || 0;
    result.ore += count.ore || 0;
    result.grain += count.grain || 0;
    result.wool += count.wool || 0;
  }

  return result;
}

/**
 * Checks if resources are empty (all zero).
 *
 * @param resources - The resource counts to check
 * @returns True if all resources are zero
 */
export function isResourcesEmpty(resources: Partial<ResourceCounts>): boolean {
  return (
    (resources.brick || 0) === 0 &&
    (resources.lumber || 0) === 0 &&
    (resources.ore || 0) === 0 &&
    (resources.grain || 0) === 0 &&
    (resources.wool || 0) === 0
  );
}
