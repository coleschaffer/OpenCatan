/**
 * Stats Slice - Game statistics tracking for OpenCatan
 *
 * Manages:
 * - Dice roll history and distribution
 * - Resources collected per player
 * - Trade records
 * - Build records
 * - Development card actions
 * - Robber movements
 * - Game timing
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ResourceType, ResourceCounts } from '@/types';

/**
 * Record of a completed trade
 */
export interface TradeRecord {
  id: string;
  timestamp: number;
  fromPlayerId: string;
  toPlayerId: string; // 'bank' for bank/port trades
  offered: Partial<ResourceCounts>;
  received: Partial<ResourceCounts>;
  tradeType: 'player' | 'bank' | 'port';
}

/**
 * Record of a building placement
 */
export interface BuildRecord {
  id: string;
  timestamp: number;
  playerId: string;
  type: 'road' | 'settlement' | 'city' | 'ship';
  turn: number;
}

/**
 * Record of a development card action
 */
export interface DevCardRecord {
  id: string;
  timestamp: number;
  playerId: string;
  action: 'buy' | 'play';
  cardType?: string;
  turn: number;
}

/**
 * Stats slice state
 */
export interface StatsSliceState {
  /** All dice rolls in order */
  diceRolls: number[];

  /** Count of each dice roll (2-12) */
  rollCounts: Record<number, number>;

  /** Resources collected per player per resource type */
  resourcesCollected: Record<string, Record<ResourceType, number>>;

  /** All completed trades */
  trades: TradeRecord[];

  /** All build actions */
  builds: BuildRecord[];

  /** All development card actions */
  devCardActions: DevCardRecord[];

  /** Number of times robber was moved */
  robberMoves: number;

  /** Timestamp when game started (first turn after setup) */
  gameStartTime: number;

  /** Timestamp when game ended */
  gameEndTime: number | null;

  /** Knights played per player */
  knightsPlayed: Record<string, number>;

  /** Longest road achieved per player */
  longestRoadAchieved: Record<string, number>;
}

const initialState: StatsSliceState = {
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

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    /**
     * Record a dice roll
     */
    recordDiceRoll: (state, action: PayloadAction<number>) => {
      const roll = action.payload;
      state.diceRolls.push(roll);
      if (roll >= 2 && roll <= 12) {
        state.rollCounts[roll] = (state.rollCounts[roll] || 0) + 1;
      }
    },

    /**
     * Record resources gained by a player
     */
    recordResourceGain: (
      state,
      action: PayloadAction<{ playerId: string; resources: Partial<ResourceCounts> }>
    ) => {
      const { playerId, resources } = action.payload;

      if (!state.resourcesCollected[playerId]) {
        state.resourcesCollected[playerId] = {
          brick: 0, lumber: 0, ore: 0, grain: 0, wool: 0,
        };
      }

      Object.entries(resources).forEach(([resource, amount]) => {
        if (amount !== undefined && amount > 0) {
          state.resourcesCollected[playerId][resource as ResourceType] += amount;
        }
      });
    },

    /**
     * Record a completed trade
     */
    recordTrade: (state, action: PayloadAction<Omit<TradeRecord, 'id' | 'timestamp'>>) => {
      const trade: TradeRecord = {
        ...action.payload,
        id: `trade-${Date.now()}-${state.trades.length}`,
        timestamp: Date.now(),
      };
      state.trades.push(trade);
    },

    /**
     * Record a build action
     */
    recordBuild: (state, action: PayloadAction<Omit<BuildRecord, 'id' | 'timestamp'>>) => {
      const build: BuildRecord = {
        ...action.payload,
        id: `build-${Date.now()}-${state.builds.length}`,
        timestamp: Date.now(),
      };
      state.builds.push(build);
    },

    /**
     * Record a development card action (buy or play)
     */
    recordDevCardAction: (
      state,
      action: PayloadAction<Omit<DevCardRecord, 'id' | 'timestamp'>>
    ) => {
      const record: DevCardRecord = {
        ...action.payload,
        id: `devcard-${Date.now()}-${state.devCardActions.length}`,
        timestamp: Date.now(),
      };
      state.devCardActions.push(record);
    },

    /**
     * Record a robber move
     */
    recordRobberMove: (state) => {
      state.robberMoves += 1;
    },

    /**
     * Record a knight being played
     */
    recordKnightPlayed: (state, action: PayloadAction<string>) => {
      const playerId = action.payload;
      state.knightsPlayed[playerId] = (state.knightsPlayed[playerId] || 0) + 1;
    },

    /**
     * Update longest road achieved for a player
     */
    updateLongestRoadAchieved: (
      state,
      action: PayloadAction<{ playerId: string; length: number }>
    ) => {
      const { playerId, length } = action.payload;
      const current = state.longestRoadAchieved[playerId] || 0;
      if (length > current) {
        state.longestRoadAchieved[playerId] = length;
      }
    },

    /**
     * Set game start time (called when setup phase ends)
     */
    setGameStartTime: (state, action: PayloadAction<number>) => {
      state.gameStartTime = action.payload;
    },

    /**
     * Set game end time (called when game ends)
     */
    setGameEndTime: (state, action: PayloadAction<number>) => {
      state.gameEndTime = action.payload;
    },

    /**
     * Initialize player stats tracking
     */
    initializePlayerStats: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((playerId) => {
        if (!state.resourcesCollected[playerId]) {
          state.resourcesCollected[playerId] = {
            brick: 0, lumber: 0, ore: 0, grain: 0, wool: 0,
          };
        }
        if (state.knightsPlayed[playerId] === undefined) {
          state.knightsPlayed[playerId] = 0;
        }
        if (state.longestRoadAchieved[playerId] === undefined) {
          state.longestRoadAchieved[playerId] = 0;
        }
      });
    },

    /**
     * Sync stats state (from host)
     */
    syncStats: (state, action: PayloadAction<StatsSliceState>) => {
      return action.payload;
    },

    /**
     * Reset stats state
     */
    resetStats: () => initialState,
  },
});

// Export actions
export const {
  recordDiceRoll,
  recordResourceGain,
  recordTrade,
  recordBuild,
  recordDevCardAction,
  recordRobberMove,
  recordKnightPlayed,
  updateLongestRoadAchieved,
  setGameStartTime,
  setGameEndTime,
  initializePlayerStats,
  syncStats,
  resetStats,
} = statsSlice.actions;

// Selectors
export const selectDiceRolls = (state: RootState) => state.stats.diceRolls;
export const selectRollCounts = (state: RootState) => state.stats.rollCounts;
export const selectResourcesCollected = (state: RootState) => state.stats.resourcesCollected;
export const selectTrades = (state: RootState) => state.stats.trades;
export const selectBuilds = (state: RootState) => state.stats.builds;
export const selectDevCardActions = (state: RootState) => state.stats.devCardActions;
export const selectRobberMoves = (state: RootState) => state.stats.robberMoves;
export const selectGameStartTime = (state: RootState) => state.stats.gameStartTime;
export const selectGameEndTime = (state: RootState) => state.stats.gameEndTime;
export const selectKnightsPlayed = (state: RootState) => state.stats.knightsPlayed;
export const selectLongestRoadAchieved = (state: RootState) => state.stats.longestRoadAchieved;

/**
 * Get total turns played (number of dice rolls)
 */
export const selectTotalTurns = (state: RootState) => state.stats.diceRolls.length;

/**
 * Get the most common dice roll
 */
export const selectMostCommonRoll = (state: RootState) => {
  const counts = state.stats.rollCounts;
  let maxRoll = 7;
  let maxCount = 0;

  Object.entries(counts).forEach(([roll, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxRoll = parseInt(roll, 10);
    }
  });

  return { value: maxRoll, count: maxCount };
};

/**
 * Get game duration in seconds
 */
export const selectGameDuration = (state: RootState) => {
  const start = state.stats.gameStartTime;
  const end = state.stats.gameEndTime || Date.now();

  if (start === 0) return 0;
  return Math.floor((end - start) / 1000);
};

/**
 * Get total resources collected across all players
 */
export const selectTotalResourcesCollected = (state: RootState) => {
  let total = 0;
  Object.values(state.stats.resourcesCollected).forEach((playerResources) => {
    Object.values(playerResources).forEach((count) => {
      total += count;
    });
  });
  return total;
};

/**
 * Get total trades completed
 */
export const selectTotalTradesCompleted = (state: RootState) => state.stats.trades.length;

/**
 * Get total development cards bought
 */
export const selectTotalDevCardsBought = (state: RootState) =>
  state.stats.devCardActions.filter((a) => a.action === 'buy').length;

/**
 * Get resources collected by a specific player
 */
export const selectPlayerResourcesCollected = (state: RootState, playerId: string) =>
  state.stats.resourcesCollected[playerId] || {
    brick: 0, lumber: 0, ore: 0, grain: 0, wool: 0,
  };

/**
 * Get total resources collected by a specific player
 */
export const selectPlayerTotalResourcesCollected = (state: RootState, playerId: string) => {
  const resources = state.stats.resourcesCollected[playerId];
  if (!resources) return 0;
  return Object.values(resources).reduce((sum, count) => sum + count, 0);
};

/**
 * Get trades made by a specific player
 */
export const selectPlayerTrades = (state: RootState, playerId: string) =>
  state.stats.trades.filter(
    (t) => t.fromPlayerId === playerId || t.toPlayerId === playerId
  );

/**
 * Get builds by a specific player
 */
export const selectPlayerBuilds = (state: RootState, playerId: string) =>
  state.stats.builds.filter((b) => b.playerId === playerId);

/**
 * Get player build counts by type
 */
export const selectPlayerBuildCounts = (state: RootState, playerId: string) => {
  const builds = state.stats.builds.filter((b) => b.playerId === playerId);
  return {
    roads: builds.filter((b) => b.type === 'road').length,
    settlements: builds.filter((b) => b.type === 'settlement').length,
    cities: builds.filter((b) => b.type === 'city').length,
    ships: builds.filter((b) => b.type === 'ship').length,
  };
};

export default statsSlice.reducer;
