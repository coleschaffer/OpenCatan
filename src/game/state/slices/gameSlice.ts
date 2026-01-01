/**
 * Game Slice - Core game state management for OpenCatan
 *
 * Manages:
 * - Game phase and turn tracking
 * - Dice rolls and event die (C&K)
 * - Barbarian position (C&K)
 * - Development/progress deck counts
 * - Game settings
 * - Bank resources
 * - Achievement tracking (longest road, largest army)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  GamePhase,
  GameMode,
  GameSettings,
  DiceRoll,
  AchievementState,
  VertexCoord,
  EdgeCoord,
} from '@/types';
import type { ResourceType, ResourceHand } from '@/types';
import type { ProgressCardCategory } from '@/types';
import { INITIAL_BANK_RESOURCES, TOTAL_DEVELOPMENT_CARDS } from '@/types';

/**
 * Setup state tracked during setup phase
 */
export interface SetupStateData {
  /** Current placement index (0-7 for 4 players, 0-11 for 6 players) */
  currentPlacementIndex: number;
  /** Last placed settlement vertex (for road placement constraint) */
  lastPlacedSettlement: VertexCoord | null;
  /** Whether all setup placements are complete */
  placementsComplete: boolean;
  /** Track which placements have been made per player */
  playerPlacements: Record<string, {
    settlement1: VertexCoord | null;
    road1: EdgeCoord | null;
    settlement2: VertexCoord | null;
    road2: EdgeCoord | null;
  }>;
}

/**
 * Core game slice state
 */
export interface GameSliceState {
  /** Current game phase */
  phase: GamePhase;

  /** Current turn number (0 during setup, 1+ during game) */
  turn: number;

  /** ID of the player whose turn it is */
  currentPlayerId: string | null;

  /** Seconds remaining in current turn */
  turnTimeRemaining: number;

  /** Timestamp when current turn started */
  turnStartedAt: number;

  /** Game mode (base, cities-knights, seafarers) */
  mode: GameMode;

  /** Game configuration settings */
  settings: GameSettings;

  /** Last dice roll result */
  lastRoll: DiceRoll | null;

  /** Longest road achievement holder */
  longestRoad: AchievementState | null;

  /** Largest army achievement holder */
  largestArmy: AchievementState | null;

  /** Number of development cards remaining in deck */
  developmentDeckCount: number;

  /** Bank resource supply */
  bank: ResourceHand;

  /** Player IDs who need to discard (during discard phase) */
  pendingDiscard: string[];

  /** Whether a dev card has been played this turn */
  devCardPlayedThisTurn: boolean;

  /** C&K: Progress card deck counts */
  progressDecks: Record<ProgressCardCategory, number> | null;

  /** C&K: Barbarian track position (0-7, attack at 7) */
  barbarianPosition: number;

  /** C&K: Barbarian strength (number of cities) */
  barbarianStrength: number;

  /** C&K: Total knight strength of all active knights */
  totalKnightStrength: number;

  /** ID of the winning player (set when game ends) */
  winnerId: string | null;

  /** Final scores when game ends */
  finalScores: Record<string, number> | null;

  /** Setup phase: current player index */
  setupPlayerIndex: number;

  /** Setup phase: direction (forward/backward for snake draft) */
  setupDirection: 'forward' | 'backward';

  /** Roads remaining to place (Road Building card) */
  roadBuildingRemaining: number;

  /** Resources remaining to select (Year of Plenty) */
  yearOfPlentyRemaining: number;

  /** Setup phase state (null when not in setup) */
  setupState: SetupStateData | null;

  /** Cross-slice convenience properties for backward compatibility */
  /** All players (aliased from playersSlice) */
  players?: unknown[];
  /** Players needing to discard (aliased from pendingDiscard) */
  playersNeedingToDiscard?: string[];
  /** Discard amounts per player */
  discardAmounts?: Record<string, number>;
}

const defaultSettings: GameSettings = {
  mode: 'base',
  playerCount: 4,
  victoryPoints: 10,
  turnTimer: 90,
  discardLimit: 7,
  map: 'random',
  friendlyRobber: false,
  hideBankCards: false,
};

const initialState: GameSliceState = {
  phase: 'lobby',
  turn: 0,
  currentPlayerId: null,
  turnTimeRemaining: 90,
  turnStartedAt: 0,
  mode: 'base',
  settings: defaultSettings,
  lastRoll: null,
  longestRoad: null,
  largestArmy: null,
  developmentDeckCount: TOTAL_DEVELOPMENT_CARDS,
  bank: { ...INITIAL_BANK_RESOURCES },
  pendingDiscard: [],
  devCardPlayedThisTurn: false,
  progressDecks: null,
  barbarianPosition: 0,
  barbarianStrength: 0,
  totalKnightStrength: 0,
  winnerId: null,
  finalScores: null,
  setupPlayerIndex: 0,
  setupDirection: 'forward',
  roadBuildingRemaining: 0,
  yearOfPlentyRemaining: 0,
  setupState: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    /**
     * Set the current game phase
     */
    setPhase: (state, action: PayloadAction<GamePhase>) => {
      state.phase = action.payload;
    },

    /**
     * Advance to the next turn
     */
    nextTurn: (state) => {
      state.turn += 1;
      state.turnTimeRemaining = state.settings.turnTimer || 0;
      state.turnStartedAt = Date.now();
      state.lastRoll = null;
      state.devCardPlayedThisTurn = false;
    },

    /**
     * Set the current player
     */
    setCurrentPlayer: (state, action: PayloadAction<string>) => {
      state.currentPlayerId = action.payload;
    },

    /**
     * Update the turn timer
     */
    updateTimer: (state, action: PayloadAction<number>) => {
      state.turnTimeRemaining = action.payload;
    },

    /**
     * Decrement timer by 1 second
     */
    tickTimer: (state) => {
      if (state.turnTimeRemaining > 0) {
        state.turnTimeRemaining -= 1;
      }
    },

    /**
     * Start the game with given settings
     */
    startGame: (
      state,
      action: PayloadAction<{ settings: GameSettings; firstPlayerId: string }>
    ) => {
      state.settings = action.payload.settings;
      state.mode = action.payload.settings.mode;
      state.phase = 'setup-settlement-1';
      state.turn = 0;
      state.currentPlayerId = action.payload.firstPlayerId;
      state.turnTimeRemaining = action.payload.settings.turnTimer || 0;
      state.turnStartedAt = Date.now();
      state.bank = { ...INITIAL_BANK_RESOURCES };
      state.setupPlayerIndex = 0;
      state.setupDirection = 'forward';

      // Initialize C&K specific state
      if (
        action.payload.settings.mode === 'cities-knights' ||
        action.payload.settings.mode === 'cities-knights-5-6'
      ) {
        state.progressDecks = {
          trade: 36,
          politics: 36,
          science: 36,
        };
        state.barbarianPosition = 0;
        state.barbarianStrength = 0;
        state.totalKnightStrength = 0;
      }
    },

    /**
     * Set dice roll result
     */
    setDiceRoll: (state, action: PayloadAction<DiceRoll>) => {
      state.lastRoll = action.payload;
    },

    /**
     * Set longest road holder
     */
    setLongestRoad: (state, action: PayloadAction<AchievementState | null>) => {
      state.longestRoad = action.payload;
    },

    /**
     * Set largest army holder
     */
    setLargestArmy: (state, action: PayloadAction<AchievementState | null>) => {
      state.largestArmy = action.payload;
    },

    /**
     * Update bank resources
     */
    updateBank: (state, action: PayloadAction<Partial<ResourceHand>>) => {
      Object.entries(action.payload).forEach(([resource, amount]) => {
        if (amount !== undefined) {
          state.bank[resource as ResourceType] = amount;
        }
      });
    },

    /**
     * Add resources to bank
     */
    addToBank: (state, action: PayloadAction<Partial<ResourceHand>>) => {
      Object.entries(action.payload).forEach(([resource, amount]) => {
        if (amount !== undefined) {
          state.bank[resource as ResourceType] += amount;
        }
      });
    },

    /**
     * Remove resources from bank
     */
    removeFromBank: (state, action: PayloadAction<Partial<ResourceHand>>) => {
      Object.entries(action.payload).forEach(([resource, amount]) => {
        if (amount !== undefined) {
          state.bank[resource as ResourceType] = Math.max(
            0,
            state.bank[resource as ResourceType] - amount
          );
        }
      });
    },

    /**
     * Set players who need to discard
     */
    setPendingDiscard: (state, action: PayloadAction<string[]>) => {
      state.pendingDiscard = action.payload;
    },

    /**
     * Remove a player from pending discard list
     */
    removePendingDiscard: (state, action: PayloadAction<string>) => {
      state.pendingDiscard = state.pendingDiscard.filter(
        (id) => id !== action.payload
      );
    },

    /**
     * Mark that a dev card was played this turn
     */
    setDevCardPlayedThisTurn: (state, action: PayloadAction<boolean>) => {
      state.devCardPlayedThisTurn = action.payload;
    },

    /**
     * Decrement development deck count
     */
    decrementDevDeck: (state) => {
      if (state.developmentDeckCount > 0) {
        state.developmentDeckCount -= 1;
      }
    },

    /**
     * Decrement a progress deck count (C&K)
     */
    decrementProgressDeck: (
      state,
      action: PayloadAction<ProgressCardCategory>
    ) => {
      if (state.progressDecks && state.progressDecks[action.payload] > 0) {
        state.progressDecks[action.payload] -= 1;
      }
    },

    /**
     * Advance barbarian position (C&K)
     */
    advanceBarbarian: (state) => {
      state.barbarianPosition += 1;
    },

    /**
     * Reset barbarian after attack (C&K)
     */
    resetBarbarian: (state) => {
      state.barbarianPosition = 0;
    },

    /**
     * Set barbarian strength (C&K)
     */
    setBarbarianStrength: (state, action: PayloadAction<number>) => {
      state.barbarianStrength = action.payload;
    },

    /**
     * Set total knight strength (C&K)
     */
    setTotalKnightStrength: (state, action: PayloadAction<number>) => {
      state.totalKnightStrength = action.payload;
    },

    /**
     * Set the game winner
     */
    setWinner: (
      state,
      action: PayloadAction<{ winnerId: string; finalScores: Record<string, number> }>
    ) => {
      state.winnerId = action.payload.winnerId;
      state.finalScores = action.payload.finalScores;
      state.phase = 'ended';
    },

    /**
     * Update game settings (during lobby)
     */
    updateSettings: (state, action: PayloadAction<Partial<GameSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    /**
     * Update setup phase tracking
     */
    updateSetupPhase: (
      state,
      action: PayloadAction<{ playerIndex: number; direction: 'forward' | 'backward' }>
    ) => {
      state.setupPlayerIndex = action.payload.playerIndex;
      state.setupDirection = action.payload.direction;
    },

    /**
     * Set road building remaining (Road Building card)
     */
    setRoadBuildingRemaining: (state, action: PayloadAction<number>) => {
      state.roadBuildingRemaining = action.payload;
    },

    /**
     * Set year of plenty remaining
     */
    setYearOfPlentyRemaining: (state, action: PayloadAction<number>) => {
      state.yearOfPlentyRemaining = action.payload;
    },

    /**
     * Reset game state to initial
     */
    resetGame: () => initialState,

    /**
     * Set the setup state
     */
    setSetupState: (state, action: PayloadAction<SetupStateData | null>) => {
      state.setupState = action.payload;
    },

    /**
     * Update setup state partially
     */
    updateSetupState: (
      state,
      action: PayloadAction<Partial<SetupStateData>>
    ) => {
      if (state.setupState) {
        state.setupState = { ...state.setupState, ...action.payload };
      }
    },

    /**
     * Set the last placed settlement during setup
     */
    setLastPlacedSettlement: (
      state,
      action: PayloadAction<VertexCoord | null>
    ) => {
      if (state.setupState) {
        state.setupState.lastPlacedSettlement = action.payload;
      }
    },

    /**
     * Increment setup placement index
     */
    incrementSetupPlacementIndex: (state) => {
      if (state.setupState) {
        state.setupState.currentPlacementIndex += 1;
      }
    },

    /**
     * Update player placements during setup
     */
    updatePlayerSetupPlacements: (
      state,
      action: PayloadAction<{
        playerId: string;
        placements: Partial<{
          settlement1: VertexCoord | null;
          road1: EdgeCoord | null;
          settlement2: VertexCoord | null;
          road2: EdgeCoord | null;
        }>;
      }>
    ) => {
      if (state.setupState) {
        const { playerId, placements } = action.payload;
        if (!state.setupState.playerPlacements[playerId]) {
          state.setupState.playerPlacements[playerId] = {
            settlement1: null,
            road1: null,
            settlement2: null,
            road2: null,
          };
        }
        Object.assign(
          state.setupState.playerPlacements[playerId],
          placements
        );
      }
    },

    /**
     * Mark setup as complete
     */
    completeSetup: (state) => {
      if (state.setupState) {
        state.setupState.placementsComplete = true;
      }
      state.phase = 'roll';
      state.setupState = null;
    },
  },
});

// Export actions
export const {
  setPhase,
  nextTurn,
  setCurrentPlayer,
  updateTimer,
  tickTimer,
  startGame,
  setDiceRoll,
  setLongestRoad,
  setLargestArmy,
  updateBank,
  addToBank,
  removeFromBank,
  setPendingDiscard,
  removePendingDiscard,
  setDevCardPlayedThisTurn,
  decrementDevDeck,
  decrementProgressDeck,
  advanceBarbarian,
  resetBarbarian,
  setBarbarianStrength,
  setTotalKnightStrength,
  setWinner,
  updateSettings,
  updateSetupPhase,
  setRoadBuildingRemaining,
  setYearOfPlentyRemaining,
  resetGame,
  setSetupState,
  updateSetupState,
  setLastPlacedSettlement,
  incrementSetupPlacementIndex,
  updatePlayerSetupPlacements,
  completeSetup,
} = gameSlice.actions;

// Selectors
export const selectPhase = (state: RootState) => state.game.phase;
export const selectTurn = (state: RootState) => state.game.turn;
export const selectCurrentPlayerId = (state: RootState) =>
  state.game.currentPlayerId;
export const selectTurnTimeRemaining = (state: RootState) =>
  state.game.turnTimeRemaining;
export const selectTurnStartedAt = (state: RootState) =>
  state.game.turnStartedAt;
export const selectGameMode = (state: RootState) => state.game.mode;
export const selectGameSettings = (state: RootState) => state.game.settings;
export const selectLastRoll = (state: RootState) => state.game.lastRoll;
export const selectDiceTotal = (state: RootState) =>
  state.game.lastRoll ? state.game.lastRoll.total : null;
export const selectLongestRoad = (state: RootState) => state.game.longestRoad;
export const selectLargestArmy = (state: RootState) => state.game.largestArmy;
export const selectDevDeckCount = (state: RootState) =>
  state.game.developmentDeckCount;
export const selectBank = (state: RootState) => state.game.bank;
export const selectPendingDiscard = (state: RootState) =>
  state.game.pendingDiscard;
export const selectDevCardPlayedThisTurn = (state: RootState) =>
  state.game.devCardPlayedThisTurn;
export const selectProgressDecks = (state: RootState) =>
  state.game.progressDecks;
export const selectBarbarianPosition = (state: RootState) =>
  state.game.barbarianPosition;
export const selectBarbarianStrength = (state: RootState) =>
  state.game.barbarianStrength;
export const selectTotalKnightStrength = (state: RootState) =>
  state.game.totalKnightStrength;
export const selectWinnerId = (state: RootState) => state.game.winnerId;
export const selectFinalScores = (state: RootState) => state.game.finalScores;
export const selectIsGameOver = (state: RootState) =>
  state.game.phase === 'ended';
export const selectSetupPhase = (state: RootState) => ({
  playerIndex: state.game.setupPlayerIndex,
  direction: state.game.setupDirection,
});
export const selectRoadBuildingRemaining = (state: RootState) =>
  state.game.roadBuildingRemaining;
export const selectYearOfPlentyRemaining = (state: RootState) =>
  state.game.yearOfPlentyRemaining;
export const selectSetupState = (state: RootState) =>
  state.game.setupState;

/**
 * Check if it's the setup phase
 */
export const selectIsSetupPhase = (state: RootState) =>
  state.game.phase.startsWith('setup-');

/**
 * Get the current setup placement index
 */
export const selectSetupPlacementIndex = (state: RootState) =>
  state.game.setupState?.currentPlacementIndex ?? 0;

/**
 * Get the last placed settlement during setup
 */
export const selectLastPlacedSettlement = (state: RootState) =>
  state.game.setupState?.lastPlacedSettlement ?? null;

/**
 * Get player placements during setup
 */
export const selectSetupPlayerPlacements = (state: RootState) =>
  state.game.setupState?.playerPlacements ?? {};

/**
 * Check if setup is complete
 */
export const selectIsSetupComplete = (state: RootState) =>
  state.game.setupState?.placementsComplete ?? false;

/**
 * Check if barbarians are about to attack
 */
export const selectBarbarianNearAttack = (state: RootState) =>
  state.game.barbarianPosition >= 6;

/**
 * Get available resources in bank
 */
export const selectBankResource = (state: RootState, resource: ResourceType) =>
  state.game.bank[resource];

export default gameSlice.reducer;
