/**
 * Players Slice - Player state management for OpenCatan
 *
 * Manages:
 * - Player resources and commodities
 * - Development and progress cards
 * - Piece counts (roads, settlements, cities, etc.)
 * - Victory points and achievements
 * - Turn order
 * - City improvements (C&K)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  Player,
  PlayerColor,
  ResourceType,
  ResourceHand,
  CommodityType,
  CommodityHand,
  DevelopmentCard,
  ProgressCard,
  CityImprovements,
  PortType,
  createEmptyResourceHand,
  createEmptyCommodityHand,
} from '@/types';

/**
 * Players slice state
 */
export interface PlayersSliceState {
  /** All players in the game */
  players: Player[];

  /** Turn order (array of player IDs) */
  turnOrder: string[];
}

const initialState: PlayersSliceState = {
  players: [],
  turnOrder: [],
};

const playersSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    /**
     * Set all players (from game start or sync)
     */
    setPlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
    },

    /**
     * Add a new player to the game
     */
    addPlayer: (state, action: PayloadAction<Player>) => {
      state.players.push(action.payload);
    },

    /**
     * Remove a player from the game
     */
    removePlayer: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter((p) => p.id !== action.payload);
      state.turnOrder = state.turnOrder.filter((id) => id !== action.payload);
    },

    /**
     * Update player properties
     */
    updatePlayer: (
      state,
      action: PayloadAction<{ playerId: string; updates: Partial<Player> }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        Object.assign(player, action.payload.updates);
      }
    },

    /**
     * Set player connection status
     */
    setPlayerConnected: (
      state,
      action: PayloadAction<{ playerId: string; isConnected: boolean }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        player.isConnected = action.payload.isConnected;
      }
    },

    /**
     * Set the turn order (randomized at game start)
     */
    setTurnOrder: (state, action: PayloadAction<string[]>) => {
      state.turnOrder = action.payload;
    },

    /**
     * Update resources for a player (set exact values)
     */
    updatePlayerResources: (
      state,
      action: PayloadAction<{ playerId: string; resources: Partial<ResourceHand> }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        Object.entries(action.payload.resources).forEach(([resource, amount]) => {
          if (amount !== undefined) {
            player.resources[resource as ResourceType] = amount;
          }
        });
      }
    },

    /**
     * Add resources to a player
     */
    addResources: (
      state,
      action: PayloadAction<{ playerId: string; resources: Partial<ResourceHand> }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        Object.entries(action.payload.resources).forEach(([resource, amount]) => {
          if (amount !== undefined) {
            player.resources[resource as ResourceType] += amount;
            player.totalResourcesCollected += amount;
          }
        });
      }
    },

    /**
     * Remove resources from a player
     */
    removeResources: (
      state,
      action: PayloadAction<{ playerId: string; resources: Partial<ResourceHand> }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        Object.entries(action.payload.resources).forEach(([resource, amount]) => {
          if (amount !== undefined) {
            player.resources[resource as ResourceType] = Math.max(
              0,
              player.resources[resource as ResourceType] - amount
            );
          }
        });
      }
    },

    /**
     * Update commodities for a player (C&K)
     */
    updateCommodities: (
      state,
      action: PayloadAction<{
        playerId: string;
        commodities: Partial<CommodityHand>;
      }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player && player.commodities) {
        Object.entries(action.payload.commodities).forEach(
          ([commodity, amount]) => {
            if (amount !== undefined) {
              player.commodities![commodity as CommodityType] = amount;
            }
          }
        );
      }
    },

    /**
     * Add commodities to a player (C&K)
     */
    addCommodities: (
      state,
      action: PayloadAction<{
        playerId: string;
        commodities: Partial<CommodityHand>;
      }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player && player.commodities) {
        Object.entries(action.payload.commodities).forEach(
          ([commodity, amount]) => {
            if (amount !== undefined) {
              player.commodities![commodity as CommodityType] += amount;
            }
          }
        );
      }
    },

    /**
     * Add a development card to player's hand
     */
    addCard: (
      state,
      action: PayloadAction<{ playerId: string; card: DevelopmentCard }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        player.developmentCards.push(action.payload.card);
        player.devCardsBoughtThisTurn.push(action.payload.card.id);
      }
    },

    /**
     * Remove a development card from player's hand
     */
    removeCard: (
      state,
      action: PayloadAction<{ playerId: string; cardId: string }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        player.developmentCards = player.developmentCards.filter(
          (c) => c.id !== action.payload.cardId
        );
      }
    },

    /**
     * Mark a development card as played
     */
    markCardPlayed: (
      state,
      action: PayloadAction<{ playerId: string; cardId: string }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        const card = player.developmentCards.find(
          (c) => c.id === action.payload.cardId
        );
        if (card) {
          card.isPlayed = true;
        }
        player.hasPlayedDevCard = true;
      }
    },

    /**
     * Add a progress card to player's hand (C&K)
     */
    addProgressCard: (
      state,
      action: PayloadAction<{ playerId: string; card: ProgressCard }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player && player.progressCards) {
        player.progressCards.push(action.payload.card);
      }
    },

    /**
     * Remove a progress card from player's hand (C&K)
     */
    removeProgressCard: (
      state,
      action: PayloadAction<{ playerId: string; cardId: string }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player && player.progressCards) {
        player.progressCards = player.progressCards.filter(
          (c) => c.id !== action.payload.cardId
        );
      }
    },

    /**
     * Update city improvements for a player (C&K)
     */
    updateCityImprovements: (
      state,
      action: PayloadAction<{
        playerId: string;
        improvements: Partial<CityImprovements>;
      }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player && player.cityImprovements) {
        Object.assign(player.cityImprovements, action.payload.improvements);
      }
    },

    /**
     * Upgrade a city improvement by 1 level (C&K)
     */
    upgradeCityImprovement: (
      state,
      action: PayloadAction<{
        playerId: string;
        type: keyof CityImprovements;
      }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player && player.cityImprovements) {
        const current = player.cityImprovements[action.payload.type];
        if (current < 5) {
          player.cityImprovements[action.payload.type] = current + 1;
        }
      }
    },

    /**
     * Update a player's piece count (decrement on place, increment on return)
     */
    updatePieceCount: (
      state,
      action: PayloadAction<{
        playerId: string;
        piece: 'roads' | 'settlements' | 'cities' | 'ships' | 'cityWalls';
        delta: number;
      }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        const key = `${action.payload.piece}Remaining` as keyof Player;
        const current = player[key] as number;
        (player[key] as number) = Math.max(0, current + action.payload.delta);
      }
    },

    /**
     * Update player's longest road length
     */
    updateLongestRoadLength: (
      state,
      action: PayloadAction<{ playerId: string; length: number }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) {
        player.longestRoadLength = action.payload.length;
      }
    },

    /**
     * Increment player's army size by 1
     */
    incrementArmySize: (state, action: PayloadAction<string>) => {
      const player = state.players.find((p) => p.id === action.payload);
      if (player) {
        player.armySize += 1;
      }
    },

    /**
     * Increment player robbed count
     */
    incrementTimesRobbed: (state, action: PayloadAction<string>) => {
      const player = state.players.find((p) => p.id === action.payload);
      if (player) {
        player.timesRobbed += 1;
      }
    },

    /**
     * Increment player was robbed count
     */
    incrementTimesWasRobbed: (state, action: PayloadAction<string>) => {
      const player = state.players.find((p) => p.id === action.payload);
      if (player) {
        player.timesWasRobbed += 1;
      }
    },

    /**
     * Increment player trades count
     */
    incrementTradesMade: (state, action: PayloadAction<string>) => {
      const player = state.players.find((p) => p.id === action.payload);
      if (player) {
        player.totalTradesMade += 1;
      }
    },

    /**
     * Reset dev card flags for new turn
     */
    resetTurnFlags: (state, action: PayloadAction<string>) => {
      const player = state.players.find((p) => p.id === action.payload);
      if (player) {
        player.hasPlayedDevCard = false;
        player.devCardsBoughtThisTurn = [];
      }
    },

    /**
     * Transfer host to another player
     */
    transferHost: (state, action: PayloadAction<string>) => {
      state.players.forEach((p) => {
        p.isHost = p.id === action.payload;
      });
    },

    /**
     * Sync players state (from host)
     */
    syncPlayers: (state, action: PayloadAction<PlayersSliceState>) => {
      return action.payload;
    },

    /**
     * Reset players state
     */
    resetPlayers: () => initialState,
  },
});

// Export actions
export const {
  setPlayers,
  addPlayer,
  removePlayer,
  updatePlayer,
  setPlayerConnected,
  setTurnOrder,
  updatePlayerResources,
  addResources,
  removeResources,
  updateCommodities,
  addCommodities,
  addCard,
  removeCard,
  markCardPlayed,
  addProgressCard,
  removeProgressCard,
  updateCityImprovements,
  upgradeCityImprovement,
  updatePieceCount,
  updateLongestRoadLength,
  incrementArmySize,
  incrementTimesRobbed,
  incrementTimesWasRobbed,
  incrementTradesMade,
  resetTurnFlags,
  transferHost,
  syncPlayers,
  resetPlayers,
} = playersSlice.actions;

// Selectors
export const selectPlayers = (state: RootState) => state.players.players;
export const selectTurnOrder = (state: RootState) => state.players.turnOrder;

/**
 * Get the current player based on game state
 */
export const selectCurrentPlayer = (state: RootState) => {
  const currentPlayerId = state.game.currentPlayerId;
  return state.players.players.find((p) => p.id === currentPlayerId);
};

/**
 * Get a player by ID
 */
export const selectPlayerById = (state: RootState, playerId: string) =>
  state.players.players.find((p) => p.id === playerId);

/**
 * Get a player's resources
 */
export const selectPlayerResources = (state: RootState, playerId: string) => {
  const player = state.players.players.find((p) => p.id === playerId);
  return player?.resources;
};

/**
 * Get a player's commodities (C&K)
 */
export const selectPlayerCommodities = (state: RootState, playerId: string) => {
  const player = state.players.players.find((p) => p.id === playerId);
  return player?.commodities;
};

/**
 * Get a player's development cards
 */
export const selectPlayerDevCards = (state: RootState, playerId: string) => {
  const player = state.players.players.find((p) => p.id === playerId);
  return player?.developmentCards ?? [];
};

/**
 * Get a player's progress cards (C&K)
 */
export const selectPlayerProgressCards = (state: RootState, playerId: string) => {
  const player = state.players.players.find((p) => p.id === playerId);
  return player?.progressCards ?? [];
};

/**
 * Get a player's total card count (for display to others)
 */
export const selectPlayerCardCount = (state: RootState, playerId: string) => {
  const player = state.players.players.find((p) => p.id === playerId);
  if (!player) return 0;
  const devCards = player.developmentCards.length;
  const progressCards = player.progressCards?.length ?? 0;
  return devCards + progressCards;
};

/**
 * Get a player's total resource count
 */
export const selectPlayerResourceCount = (state: RootState, playerId: string) => {
  const player = state.players.players.find((p) => p.id === playerId);
  if (!player) return 0;
  return Object.values(player.resources).reduce((sum, count) => sum + count, 0);
};

/**
 * Get a player's total commodity count (C&K)
 */
export const selectPlayerCommodityCount = (
  state: RootState,
  playerId: string
) => {
  const player = state.players.players.find((p) => p.id === playerId);
  if (!player || !player.commodities) return 0;
  return Object.values(player.commodities).reduce(
    (sum, count) => sum + count,
    0
  );
};

/**
 * Get a player's total hand size (resources + commodities)
 */
export const selectPlayerHandSize = (state: RootState, playerId: string) => {
  return (
    selectPlayerResourceCount(state, playerId) +
    selectPlayerCommodityCount(state, playerId)
  );
};

/**
 * Get the host player
 */
export const selectHostPlayer = (state: RootState) =>
  state.players.players.find((p) => p.isHost);

/**
 * Get all connected players
 */
export const selectConnectedPlayers = (state: RootState) =>
  state.players.players.filter((p) => p.isConnected);

/**
 * Check if a player can afford a cost
 */
export const selectCanAfford = (
  state: RootState,
  playerId: string,
  cost: Partial<ResourceHand>
) => {
  const player = state.players.players.find((p) => p.id === playerId);
  if (!player) return false;
  return Object.entries(cost).every(
    ([resource, amount]) =>
      player.resources[resource as ResourceType] >= (amount || 0)
  );
};

/**
 * Get player's best trade ratio for a resource
 */
export const selectTradeRatio = (
  state: RootState,
  playerId: string,
  resource: ResourceType
) => {
  // Get ports from board state
  const playerBuildings = state.board.buildings.filter(
    (b) => b.playerId === playerId
  );

  // Check each port
  for (const port of state.board.ports) {
    const hasAccess = port.vertices.some((portVertex) =>
      playerBuildings.some(
        (building) =>
          building.vertex.hex.q === portVertex.hex.q &&
          building.vertex.hex.r === portVertex.hex.r &&
          building.vertex.direction === portVertex.direction
      )
    );

    if (hasAccess) {
      // Check if this port gives 2:1 for the specific resource
      if (port.type === resource) return 2;
      // Check for generic 3:1
      if (port.type === 'generic') return 3;
    }
  }

  // Default 4:1 ratio
  return 4;
};

/**
 * Get playable dev cards (bought before this turn, not yet played)
 */
export const selectPlayableDevCards = (state: RootState, playerId: string) => {
  const player = state.players.players.find((p) => p.id === playerId);
  if (!player) return [];

  return player.developmentCards.filter(
    (card) =>
      !card.isPlayed &&
      !player.devCardsBoughtThisTurn.includes(card.id) &&
      card.type !== 'victoryPoint'
  );
};

/**
 * Check if player can play a dev card this turn
 */
export const selectCanPlayDevCard = (state: RootState, playerId: string) => {
  const player = state.players.players.find((p) => p.id === playerId);
  if (!player) return false;
  return !player.hasPlayedDevCard && selectPlayableDevCards(state, playerId).length > 0;
};

export default playersSlice.reducer;
