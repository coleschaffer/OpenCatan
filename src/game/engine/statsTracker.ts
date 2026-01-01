/**
 * Game Statistics Tracker for OpenCatan
 *
 * Provides functions for tracking game statistics throughout gameplay
 * and calculating victory point breakdowns.
 */

import type { GameState, ResourceType, ResourceCounts, Building, Player } from '../../types';
import type { StatsSliceState, TradeRecord, BuildRecord, DevCardRecord } from '../state/slices/statsSlice';

/**
 * Victory point breakdown showing where each VP came from
 */
export interface VPBreakdown {
  /** Victory points from settlements (1 each) */
  settlements: number;
  /** Number of settlements */
  settlementCount: number;
  /** Victory points from cities (2 each) */
  cities: number;
  /** Number of cities */
  cityCount: number;
  /** Victory points from longest road (2 if held) */
  longestRoad: number;
  /** Victory points from largest army (2 if held) */
  largestArmy: number;
  /** Victory points from VP development cards */
  victoryPointCards: number;
  /** Number of VP cards */
  vpCardCount: number;
  /** Victory points from metropolis (C&K, 2 each) */
  metropolis: number;
  /** Number of metropolises */
  metropolisCount: number;
  /** Total victory points */
  total: number;
}

/**
 * Aggregated game statistics
 */
export interface GameStats {
  /** Total turns played (dice rolls after setup) */
  totalTurns: number;
  /** Distribution of dice rolls (2-12) */
  diceRolls: Record<number, number>;
  /** Total resources collected (all players combined) */
  resourcesCollected: Record<string, number>;
  /** Total number of trades completed */
  tradesCompleted: number;
  /** Total development cards bought */
  developmentCardsBought: number;
  /** Total knights played */
  knightsPlayed: number;
  /** Longest road length achieved in the game */
  longestRoadLength: number;
  /** Number of times robber was moved */
  robberMoves: number;
  /** Game duration in seconds */
  gameDuration: number;
  /** Most common dice roll */
  mostCommonRoll: { value: number; count: number };
}

/**
 * Per-player statistics
 */
export interface PlayerStats {
  /** Player ID */
  playerId: string;
  /** Resources collected by type */
  resourcesCollected: Record<ResourceType, number>;
  /** Total resources collected */
  totalResourcesCollected: number;
  /** Number of trades made */
  tradesMade: number;
  /** Number of trades as initiator */
  tradesInitiated: number;
  /** Number of trades as receiver */
  tradesReceived: number;
  /** Roads built */
  roadsBuilt: number;
  /** Settlements built */
  settlementsBuilt: number;
  /** Cities built */
  citiesBuilt: number;
  /** Development cards bought */
  devCardsBought: number;
  /** Development cards played */
  devCardsPlayed: number;
  /** Knights played */
  knightsPlayed: number;
  /** Longest road achieved */
  longestRoadAchieved: number;
}

/**
 * Calculate victory point breakdown for a specific player
 */
export function calculateVPBreakdown(
  state: GameState,
  playerId: string
): VPBreakdown {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return {
      settlements: 0,
      settlementCount: 0,
      cities: 0,
      cityCount: 0,
      longestRoad: 0,
      largestArmy: 0,
      victoryPointCards: 0,
      vpCardCount: 0,
      metropolis: 0,
      metropolisCount: 0,
      total: 0,
    };
  }

  // Count settlements
  const settlements = state.buildings.filter(
    (b) => b.playerId === playerId && b.type === 'settlement'
  );
  const settlementCount = settlements.length;
  const settlementVP = settlementCount;

  // Count cities
  const cities = state.buildings.filter(
    (b) => b.playerId === playerId && b.type === 'city'
  );
  const cityCount = cities.length;
  const cityVP = cityCount * 2;

  // Longest road
  const longestRoadVP = state.longestRoad?.playerId === playerId ? 2 : 0;

  // Largest army
  const largestArmyVP = state.largestArmy?.playerId === playerId ? 2 : 0;

  // Victory point cards
  const vpCards = player.developmentCards.filter(
    (c) => c.type === 'victoryPoint' && !c.isPlayed
  );
  const vpCardCount = vpCards.length;
  const vpCardVP = vpCardCount;

  // Metropolis (Cities & Knights)
  const metropolises = cities.filter((c) => c.hasMetropolis);
  const metropolisCount = metropolises.length;
  const metropolisVP = metropolisCount * 2;

  const total =
    settlementVP + cityVP + longestRoadVP + largestArmyVP + vpCardVP + metropolisVP;

  return {
    settlements: settlementVP,
    settlementCount,
    cities: cityVP,
    cityCount,
    longestRoad: longestRoadVP,
    largestArmy: largestArmyVP,
    victoryPointCards: vpCardVP,
    vpCardCount,
    metropolis: metropolisVP,
    metropolisCount,
    total,
  };
}

/**
 * Calculate aggregated game statistics from stats state
 */
export function calculateGameStats(
  stats: StatsSliceState,
  state?: GameState
): GameStats {
  // Calculate most common roll
  let maxRoll = 7;
  let maxCount = 0;
  Object.entries(stats.rollCounts).forEach(([roll, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxRoll = parseInt(roll, 10);
    }
  });

  // Calculate total resources collected per type
  const resourceTotals: Record<string, number> = {
    brick: 0,
    lumber: 0,
    ore: 0,
    grain: 0,
    wool: 0,
  };

  Object.values(stats.resourcesCollected).forEach((playerResources) => {
    Object.entries(playerResources).forEach(([resource, count]) => {
      resourceTotals[resource] = (resourceTotals[resource] || 0) + count;
    });
  });

  // Calculate game duration
  const startTime = stats.gameStartTime;
  const endTime = stats.gameEndTime || Date.now();
  const gameDuration = startTime > 0 ? Math.floor((endTime - startTime) / 1000) : 0;

  // Calculate longest road length
  let longestRoadLength = 0;
  Object.values(stats.longestRoadAchieved).forEach((length) => {
    if (length > longestRoadLength) {
      longestRoadLength = length;
    }
  });

  // Alternative: get from game state if available
  if (state?.longestRoad) {
    longestRoadLength = state.longestRoad.count;
  }

  // Calculate total knights played
  const totalKnightsPlayed = Object.values(stats.knightsPlayed).reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    totalTurns: stats.diceRolls.length,
    diceRolls: { ...stats.rollCounts },
    resourcesCollected: resourceTotals,
    tradesCompleted: stats.trades.length,
    developmentCardsBought: stats.devCardActions.filter((a) => a.action === 'buy').length,
    knightsPlayed: totalKnightsPlayed,
    longestRoadLength,
    robberMoves: stats.robberMoves,
    gameDuration,
    mostCommonRoll: { value: maxRoll, count: maxCount },
  };
}

/**
 * Calculate per-player statistics
 */
export function calculatePlayerStats(
  stats: StatsSliceState,
  playerId: string
): PlayerStats {
  const resourcesCollected = stats.resourcesCollected[playerId] || {
    brick: 0,
    lumber: 0,
    ore: 0,
    grain: 0,
    wool: 0,
  };

  const totalResourcesCollected = Object.values(resourcesCollected).reduce(
    (sum, count) => sum + count,
    0
  );

  // Count trades
  const playerTrades = stats.trades.filter(
    (t) => t.fromPlayerId === playerId || t.toPlayerId === playerId
  );
  const tradesInitiated = stats.trades.filter(
    (t) => t.fromPlayerId === playerId
  ).length;
  const tradesReceived = stats.trades.filter(
    (t) => t.toPlayerId === playerId && t.toPlayerId !== 'bank'
  ).length;

  // Count builds
  const playerBuilds = stats.builds.filter((b) => b.playerId === playerId);
  const roadsBuilt = playerBuilds.filter((b) => b.type === 'road' || b.type === 'ship').length;
  const settlementsBuilt = playerBuilds.filter((b) => b.type === 'settlement').length;
  const citiesBuilt = playerBuilds.filter((b) => b.type === 'city').length;

  // Count dev card actions
  const playerDevCards = stats.devCardActions.filter((a) => a.playerId === playerId);
  const devCardsBought = playerDevCards.filter((a) => a.action === 'buy').length;
  const devCardsPlayed = playerDevCards.filter((a) => a.action === 'play').length;

  // Knights played
  const knightsPlayed = stats.knightsPlayed[playerId] || 0;

  // Longest road achieved
  const longestRoadAchieved = stats.longestRoadAchieved[playerId] || 0;

  return {
    playerId,
    resourcesCollected: resourcesCollected as Record<ResourceType, number>,
    totalResourcesCollected,
    tradesMade: playerTrades.length,
    tradesInitiated,
    tradesReceived,
    roadsBuilt,
    settlementsBuilt,
    citiesBuilt,
    devCardsBought,
    devCardsPlayed,
    knightsPlayed,
    longestRoadAchieved,
  };
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${hours}h`;
}

/**
 * Calculate expected dice roll distribution for comparison
 */
export function getExpectedDiceDistribution(totalRolls: number): Record<number, number> {
  // Probability of each roll with two dice
  const probabilities: Record<number, number> = {
    2: 1 / 36,
    3: 2 / 36,
    4: 3 / 36,
    5: 4 / 36,
    6: 5 / 36,
    7: 6 / 36,
    8: 5 / 36,
    9: 4 / 36,
    10: 3 / 36,
    11: 2 / 36,
    12: 1 / 36,
  };

  const expected: Record<number, number> = {};
  Object.entries(probabilities).forEach(([roll, prob]) => {
    expected[parseInt(roll, 10)] = Math.round(prob * totalRolls);
  });

  return expected;
}

/**
 * Find notable dice roll streaks
 */
export function findDiceStreaks(rolls: number[]): {
  longestSameRoll: { roll: number; length: number };
  longestWithout7: number;
  sevensInARow: number;
} {
  let longestSameRoll = { roll: 0, length: 0 };
  let longestWithout7 = 0;
  let currentWithout7 = 0;
  let sevensInARow = 0;
  let currentSevensInARow = 0;
  let currentStreak = { roll: 0, length: 0 };

  rolls.forEach((roll, index) => {
    // Track same roll streaks
    if (roll === currentStreak.roll) {
      currentStreak.length += 1;
    } else {
      if (currentStreak.length > longestSameRoll.length) {
        longestSameRoll = { ...currentStreak };
      }
      currentStreak = { roll, length: 1 };
    }

    // Track without 7
    if (roll === 7) {
      if (currentWithout7 > longestWithout7) {
        longestWithout7 = currentWithout7;
      }
      currentWithout7 = 0;
      currentSevensInARow += 1;
      if (currentSevensInARow > sevensInARow) {
        sevensInARow = currentSevensInARow;
      }
    } else {
      currentWithout7 += 1;
      currentSevensInARow = 0;
    }
  });

  // Check final streaks
  if (currentStreak.length > longestSameRoll.length) {
    longestSameRoll = { ...currentStreak };
  }
  if (currentWithout7 > longestWithout7) {
    longestWithout7 = currentWithout7;
  }

  return {
    longestSameRoll,
    longestWithout7,
    sevensInARow,
  };
}

/**
 * Create empty stats state for initialization
 */
export function createEmptyStats(): StatsSliceState {
  return {
    diceRolls: [],
    rollCounts: {
      2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
      7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0,
    },
    resourcesCollected: {},
    trades: [],
    builds: [],
    devCardActions: [],
    robberMoves: 0,
    gameStartTime: 0,
    gameEndTime: null,
    knightsPlayed: {},
    longestRoadAchieved: {},
  };
}
