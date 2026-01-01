/**
 * useGameStats Hook - Access game statistics from Redux store
 *
 * Provides computed statistics and helper functions for displaying
 * game statistics throughout the application.
 */

import { useMemo, useCallback } from 'react';
import { useAppSelector } from './useAppSelector';
import {
  selectDiceRolls,
  selectRollCounts,
  selectResourcesCollected,
  selectTrades,
  selectBuilds,
  selectDevCardActions,
  selectRobberMoves,
  selectGameStartTime,
  selectGameEndTime,
  selectKnightsPlayed,
  selectLongestRoadAchieved,
  selectTotalTurns,
  selectMostCommonRoll,
  selectGameDuration,
  selectTotalResourcesCollected,
  selectTotalTradesCompleted,
  selectTotalDevCardsBought,
  selectPlayerResourcesCollected,
  selectPlayerTotalResourcesCollected,
  selectPlayerTrades,
  selectPlayerBuilds,
  selectPlayerBuildCounts,
} from '../game/state/slices/statsSlice';
import {
  selectLongestRoad,
  selectLargestArmy,
} from '../game/state/slices/gameSlice';
import type { RootState } from '../game/state/store';
import type { ResourceType } from '../types';
import type { GameStats, PlayerStats } from '../game/engine/statsTracker';
import { calculateGameStats, calculatePlayerStats, formatDuration } from '../game/engine/statsTracker';

/**
 * Return type for useGameStats hook
 */
export interface UseGameStatsReturn {
  /** Total turns played */
  totalTurns: number;
  /** Most common dice roll */
  mostCommonRoll: { value: number; count: number };
  /** Game duration in seconds */
  gameDuration: number;
  /** Formatted game duration string */
  formattedDuration: string;
  /** Total resources collected across all players */
  totalResourcesCollected: number;
  /** Total trades completed */
  totalTradesCompleted: number;
  /** Total dev cards bought */
  totalDevCardsBought: number;
  /** Dice roll counts by value */
  diceRollCounts: Record<number, number>;
  /** All dice rolls in order */
  diceRolls: number[];
  /** Number of robber moves */
  robberMoves: number;
  /** Get statistics for a specific player */
  getPlayerStats: (playerId: string) => PlayerStats;
  /** Get total resources collected by a player */
  getPlayerResourceTotal: (playerId: string) => number;
  /** Get resources collected by a player */
  getPlayerResources: (playerId: string) => Record<ResourceType, number>;
  /** Get build counts for a player */
  getPlayerBuildCounts: (playerId: string) => {
    roads: number;
    settlements: number;
    cities: number;
    ships: number;
  };
  /** Full game stats object */
  gameStats: GameStats;
}

/**
 * Hook for accessing game statistics
 *
 * @returns Object containing statistics and helper functions
 */
export function useGameStats(): UseGameStatsReturn {
  // Select raw stats from Redux
  const diceRolls = useAppSelector(selectDiceRolls);
  const rollCounts = useAppSelector(selectRollCounts);
  const resourcesCollected = useAppSelector(selectResourcesCollected);
  const trades = useAppSelector(selectTrades);
  const builds = useAppSelector(selectBuilds);
  const devCardActions = useAppSelector(selectDevCardActions);
  const robberMoves = useAppSelector(selectRobberMoves);
  const gameStartTime = useAppSelector(selectGameStartTime);
  const gameEndTime = useAppSelector(selectGameEndTime);
  const knightsPlayed = useAppSelector(selectKnightsPlayed);
  const longestRoadAchieved = useAppSelector(selectLongestRoadAchieved);
  const longestRoad = useAppSelector(selectLongestRoad);

  // Computed values
  const totalTurns = diceRolls.length;

  const mostCommonRoll = useMemo(() => {
    let maxRoll = 7;
    let maxCount = 0;
    Object.entries(rollCounts).forEach(([roll, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxRoll = parseInt(roll, 10);
      }
    });
    return { value: maxRoll, count: maxCount };
  }, [rollCounts]);

  const gameDuration = useMemo(() => {
    const start = gameStartTime;
    const end = gameEndTime || Date.now();
    if (start === 0) return 0;
    return Math.floor((end - start) / 1000);
  }, [gameStartTime, gameEndTime]);

  const formattedDuration = useMemo(
    () => formatDuration(gameDuration),
    [gameDuration]
  );

  const totalResourcesCollected = useMemo(() => {
    let total = 0;
    Object.values(resourcesCollected).forEach((playerResources) => {
      Object.values(playerResources).forEach((count) => {
        total += count;
      });
    });
    return total;
  }, [resourcesCollected]);

  const totalTradesCompleted = trades.length;

  const totalDevCardsBought = useMemo(
    () => devCardActions.filter((a) => a.action === 'buy').length,
    [devCardActions]
  );

  // Player stats helper
  const getPlayerStats = useCallback(
    (playerId: string): PlayerStats => {
      const playerResources = resourcesCollected[playerId] || {
        brick: 0,
        lumber: 0,
        ore: 0,
        grain: 0,
        wool: 0,
      };

      const playerTotalResources = Object.values(playerResources).reduce(
        (sum, count) => sum + count,
        0
      );

      const playerTrades = trades.filter(
        (t) => t.fromPlayerId === playerId || t.toPlayerId === playerId
      );
      const tradesInitiated = trades.filter(
        (t) => t.fromPlayerId === playerId
      ).length;
      const tradesReceived = trades.filter(
        (t) => t.toPlayerId === playerId && t.toPlayerId !== 'bank'
      ).length;

      const playerBuilds = builds.filter((b) => b.playerId === playerId);
      const roadsBuilt = playerBuilds.filter(
        (b) => b.type === 'road' || b.type === 'ship'
      ).length;
      const settlementsBuilt = playerBuilds.filter(
        (b) => b.type === 'settlement'
      ).length;
      const citiesBuilt = playerBuilds.filter((b) => b.type === 'city').length;

      const playerDevCards = devCardActions.filter(
        (a) => a.playerId === playerId
      );
      const devCardsBought = playerDevCards.filter(
        (a) => a.action === 'buy'
      ).length;
      const devCardsPlayed = playerDevCards.filter(
        (a) => a.action === 'play'
      ).length;

      return {
        playerId,
        resourcesCollected: playerResources as Record<ResourceType, number>,
        totalResourcesCollected: playerTotalResources,
        tradesMade: playerTrades.length,
        tradesInitiated,
        tradesReceived,
        roadsBuilt,
        settlementsBuilt,
        citiesBuilt,
        devCardsBought,
        devCardsPlayed,
        knightsPlayed: knightsPlayed[playerId] || 0,
        longestRoadAchieved: longestRoadAchieved[playerId] || 0,
      };
    },
    [resourcesCollected, trades, builds, devCardActions, knightsPlayed, longestRoadAchieved]
  );

  const getPlayerResourceTotal = useCallback(
    (playerId: string): number => {
      const resources = resourcesCollected[playerId];
      if (!resources) return 0;
      return Object.values(resources).reduce((sum, count) => sum + count, 0);
    },
    [resourcesCollected]
  );

  const getPlayerResources = useCallback(
    (playerId: string): Record<ResourceType, number> => {
      return (
        resourcesCollected[playerId] || {
          brick: 0,
          lumber: 0,
          ore: 0,
          grain: 0,
          wool: 0,
        }
      );
    },
    [resourcesCollected]
  );

  const getPlayerBuildCounts = useCallback(
    (playerId: string) => {
      const playerBuilds = builds.filter((b) => b.playerId === playerId);
      return {
        roads: playerBuilds.filter((b) => b.type === 'road').length,
        settlements: playerBuilds.filter((b) => b.type === 'settlement').length,
        cities: playerBuilds.filter((b) => b.type === 'city').length,
        ships: playerBuilds.filter((b) => b.type === 'ship').length,
      };
    },
    [builds]
  );

  // Full game stats object
  const gameStats: GameStats = useMemo(() => {
    const resourceTotals: Record<string, number> = {
      brick: 0,
      lumber: 0,
      ore: 0,
      grain: 0,
      wool: 0,
    };

    Object.values(resourcesCollected).forEach((playerResources) => {
      Object.entries(playerResources).forEach(([resource, count]) => {
        resourceTotals[resource] = (resourceTotals[resource] || 0) + count;
      });
    });

    const totalKnightsPlayed = Object.values(knightsPlayed).reduce(
      (sum, count) => sum + count,
      0
    );

    let longestRoadLength = 0;
    Object.values(longestRoadAchieved).forEach((length) => {
      if (length > longestRoadLength) {
        longestRoadLength = length;
      }
    });
    if (longestRoad) {
      longestRoadLength = Math.max(longestRoadLength, longestRoad.count);
    }

    return {
      totalTurns,
      diceRolls: { ...rollCounts },
      resourcesCollected: resourceTotals,
      tradesCompleted: totalTradesCompleted,
      developmentCardsBought: totalDevCardsBought,
      knightsPlayed: totalKnightsPlayed,
      longestRoadLength,
      robberMoves,
      gameDuration,
      mostCommonRoll,
    };
  }, [
    totalTurns,
    rollCounts,
    resourcesCollected,
    totalTradesCompleted,
    totalDevCardsBought,
    knightsPlayed,
    longestRoadAchieved,
    longestRoad,
    robberMoves,
    gameDuration,
    mostCommonRoll,
  ]);

  return {
    totalTurns,
    mostCommonRoll,
    gameDuration,
    formattedDuration,
    totalResourcesCollected,
    totalTradesCompleted,
    totalDevCardsBought,
    diceRollCounts: rollCounts,
    diceRolls,
    robberMoves,
    getPlayerStats,
    getPlayerResourceTotal,
    getPlayerResources,
    getPlayerBuildCounts,
    gameStats,
  };
}

export default useGameStats;
