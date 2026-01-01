/**
 * Redux Store Configuration for OpenCatan
 *
 * Configures the Redux store with all game slices and middleware.
 *
 * Store structure:
 * - game: Core game state (phase, turn, settings)
 * - board: Board state (tiles, buildings, roads, robber)
 * - players: Player state (resources, cards, achievements)
 * - lobby: Pre-game lobby state
 * - ui: UI state (modals, selections, audio settings)
 * - log: Game log and chat messages
 */

import { configureStore } from '@reduxjs/toolkit';

// Import reducers
import gameReducer from './slices/gameSlice';
import boardReducer from './slices/boardSlice';
import playersReducer from './slices/playersSlice';
import lobbyReducer from './slices/lobbySlice';
import uiReducer from './slices/uiSlice';
import logReducer from './slices/logSlice';
import statsReducer from './slices/statsSlice';
import tradeReducer from './slices/tradeSlice';

// Import network middleware
import { networkMiddleware } from '@/network/networkMiddleware';

/**
 * Configure and create the Redux store
 */
export const store = configureStore({
  reducer: {
    game: gameReducer,
    board: boardReducer,
    players: playersReducer,
    lobby: lobbyReducer,
    ui: uiReducer,
    log: logReducer,
    stats: statsReducer,
    trade: tradeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Enable serializable check in development
      serializableCheck: {
        // Ignore these action types (e.g., for non-serializable data)
        ignoredActions: ['log/addLogEntry', 'log/addChatMessage'],
        // Ignore these paths in the state
        ignoredPaths: ['log.log', 'log.chat'],
      },
      // Enable immutability check in development
      immutableCheck: true,
    }).concat(networkMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

/**
 * Infer the `RootState` type from the store itself
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Infer the `AppDispatch` type from the store itself
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Type for thunk actions
 */
export type AppThunk<ReturnType = void> = (
  dispatch: AppDispatch,
  getState: () => RootState
) => ReturnType;

export default store;
