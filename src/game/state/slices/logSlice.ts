/**
 * Log Slice - Game log and chat state management for OpenCatan
 *
 * Manages:
 * - Game action log with visibility rules
 * - Chat messages
 * - Dice roll history
 * - Trade history
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  LogEntry,
  LogEntryType,
  LogVisibility,
  ChatMessage,
  PlayerColor,
  ResourceType,
  CommodityType,
} from '@/types';

/**
 * Log slice state
 */
export interface LogSliceState {
  /** Game log entries */
  log: LogEntry[];

  /** Chat messages */
  chat: ChatMessage[];

  /** Maximum log entries to keep */
  maxLogEntries: number;

  /** Maximum chat messages to keep */
  maxChatMessages: number;
}

const initialState: LogSliceState = {
  log: [],
  chat: [],
  maxLogEntries: 500,
  maxChatMessages: 200,
};

const logSlice = createSlice({
  name: 'log',
  initialState,
  reducers: {
    /**
     * Add a log entry
     */
    addLogEntry: (state, action: PayloadAction<LogEntry>) => {
      state.log.push(action.payload);
      // Trim old entries if over limit
      if (state.log.length > state.maxLogEntries) {
        state.log = state.log.slice(-state.maxLogEntries);
      }
    },

    /**
     * Add multiple log entries at once
     */
    addLogEntries: (state, action: PayloadAction<LogEntry[]>) => {
      state.log.push(...action.payload);
      if (state.log.length > state.maxLogEntries) {
        state.log = state.log.slice(-state.maxLogEntries);
      }
    },

    /**
     * Add a chat message
     */
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chat.push(action.payload);
      // Trim old messages if over limit
      if (state.chat.length > state.maxChatMessages) {
        state.chat = state.chat.slice(-state.maxChatMessages);
      }
    },

    /**
     * Clear all log entries
     */
    clearLog: (state) => {
      state.log = [];
    },

    /**
     * Clear all chat messages
     */
    clearChat: (state) => {
      state.chat = [];
    },

    /**
     * Sync log state (from host on reconnect)
     */
    syncLog: (
      state,
      action: PayloadAction<{ log: LogEntry[]; chat: ChatMessage[] }>
    ) => {
      state.log = action.payload.log;
      state.chat = action.payload.chat;
    },

    /**
     * Reset log state
     */
    resetLog: () => initialState,
  },
});

// Export actions
export const {
  addLogEntry,
  addLogEntries,
  addChatMessage,
  clearLog,
  clearChat,
  syncLog,
  resetLog,
} = logSlice.actions;

/**
 * Helper function to create a log entry
 */
export const createLogEntry = (
  type: LogEntryType,
  turn: number,
  message: string,
  options: {
    playerId?: string;
    playerName?: string;
    playerColor?: PlayerColor;
    visibility?: LogVisibility;
    data?: LogEntry['data'];
  } = {}
): LogEntry => ({
  id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: Date.now(),
  turn,
  playerId: options.playerId ?? null,
  playerName: options.playerName,
  playerColor: options.playerColor,
  visibility: options.visibility ?? 'all',
  message,
  data: options.data,
});

/**
 * Helper function to create a chat message
 */
export const createChatMessage = (
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  message: string
): ChatMessage => ({
  id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  playerId,
  playerName,
  playerColor,
  message,
  timestamp: Date.now(),
});

// Selectors
export const selectLog = (state: RootState) => state.log.log;
export const selectChat = (state: RootState) => state.log.chat;

/**
 * Get log entries visible to a specific player
 */
export const selectVisibleLog = (state: RootState, playerId: string) =>
  state.log.log.filter((entry) => {
    if (entry.visibility === 'all') return true;
    if (entry.visibility === 'self') return entry.playerId === playerId;
    if (entry.visibility === 'involved') {
      // For involved visibility, check if player is part of the action
      return (
        entry.playerId === playerId ||
        entry.data?.victimId === playerId ||
        entry.data?.tradePartnerId === playerId
      );
    }
    if (Array.isArray(entry.visibility)) {
      return entry.visibility.includes(playerId);
    }
    return false;
  });

/**
 * Get recent log entries (last N entries visible to player)
 */
export const selectRecentLog = (
  state: RootState,
  playerId: string,
  count: number = 20
) => {
  const visibleLog = selectVisibleLog(state, playerId);
  return visibleLog.slice(-count);
};

/**
 * Get log entries for a specific turn
 */
export const selectLogForTurn = (state: RootState, turn: number) =>
  state.log.log.filter((entry) => entry.turn === turn);

/**
 * Get log entries of a specific type
 */
export const selectLogByType = (state: RootState, type: LogEntryType) =>
  state.log.log.filter((entry) => entry.type === type);

/**
 * Get recent chat messages
 */
export const selectRecentChat = (state: RootState, count: number = 50) =>
  state.log.chat.slice(-count);

/**
 * Get dice roll history for statistics
 */
export const selectDiceHistory = (state: RootState) =>
  state.log.log
    .filter((entry) => entry.type === 'dice-roll' && entry.data?.diceValues)
    .map((entry) => ({
      values: entry.data!.diceValues as [number, number],
      total: entry.data!.diceTotal as number,
      turn: entry.turn,
    }));

/**
 * Get dice roll statistics
 */
export const selectDiceStats = (state: RootState) => {
  const history = selectDiceHistory(state);
  const counts: Record<number, number> = {
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
  };

  history.forEach(({ total }) => {
    if (total >= 2 && total <= 12) {
      counts[total]++;
    }
  });

  return {
    counts,
    total: history.length,
    mostCommon:
      history.length > 0
        ? Object.entries(counts).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
        : null,
  };
};

/**
 * Get trade history
 */
export const selectTradeHistory = (state: RootState) =>
  state.log.log.filter(
    (entry) => entry.type === 'trade-accept' || entry.type === 'bank-trade'
  );

/**
 * Get log entries for a specific player
 */
export const selectLogForPlayer = (state: RootState, playerId: string) =>
  state.log.log.filter((entry) => entry.playerId === playerId);

/**
 * Get resource gains log
 */
export const selectResourceGainsLog = (state: RootState) =>
  state.log.log.filter((entry) => entry.type === 'resource-gain');

/**
 * Get robber activity log
 */
export const selectRobberLog = (state: RootState) =>
  state.log.log.filter(
    (entry) =>
      entry.type === 'robber-move' ||
      entry.type === 'robber-steal' ||
      entry.type === 'pirate-move' ||
      entry.type === 'pirate-steal'
  );

export default logSlice.reducer;
