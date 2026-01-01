// @ts-nocheck
// TODO: Fix TypeScript errors in this file
/**
 * HostManager - Host-specific game logic for OpenCatan
 *
 * The host's browser runs the authoritative game logic.
 * This manager handles:
 * - Validating and processing game actions
 * - Broadcasting state to all peers
 * - Managing the game state
 */

import type { GameState, GameAction, GameSettings } from '@/types/game';
import type { HostMessage, LobbyState, LobbyPlayer } from '@/types/network';
import { partyClient } from './partyClient';
import { store, type RootState, type AppDispatch } from '@/game/state/store';
import {
  setPhase,
  nextTurn,
  setCurrentPlayer,
  setDiceRoll,
  updateSettings,
  startGame as startGameAction,
} from '@/game/state/slices/gameSlice';
import {
  validateAction,
  processActionAsHost,
  createHostState,
  createGameStateMessage,
  createLobbyStateMessage,
  type HostState,
  type ValidationResult,
  type ActionResult,
} from './host';

// ============================================================================
// Types
// ============================================================================

export interface HostManagerConfig {
  /** Debug mode */
  debug?: boolean;
  /** State broadcast interval in ms */
  broadcastInterval?: number;
}

// ============================================================================
// HostManager Class
// ============================================================================

/**
 * Manages host-specific game logic
 * Only active when this client is the host
 */
class HostManager {
  private _gameState: GameState | null = null;
  private hostState: HostState;
  private config: Required<HostManagerConfig>;
  private broadcastIntervalId: ReturnType<typeof setInterval> | null = null;
  private _isHost = false;

  constructor(config: HostManagerConfig = {}) {
    this.config = {
      debug: config.debug || false,
      broadcastInterval: config.broadcastInterval || 1000,
    };
    this.hostState = createHostState();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Initialize as host with initial game state
   */
  initializeAsHost(initialState: GameState): void {
    this._isHost = true;
    this._gameState = initialState;
    this.hostState.isHost = true;
    this.hostState.sequence = 0;

    partyClient.setIsHost(true);

    // Start periodic state broadcasts
    this.startBroadcasting();

    this.log('Initialized as host');
  }

  /**
   * Process an action from any player
   * Validates the action and applies it if valid
   */
  handleAction(
    playerId: string,
    action: GameAction
  ): { success: boolean; error?: string } {
    if (!this._isHost || !this._gameState) {
      return { success: false, error: 'Not host or game not initialized' };
    }

    // Get current Redux state
    const state = store.getState();
    const dispatch = store.dispatch;

    // Add playerId to action for validation
    const actionWithPlayer = { ...action, playerId };

    // Validate the action
    const validation = validateAction(actionWithPlayer, state);

    if (!validation.isValid) {
      this.log('Action rejected:', action.type, validation.error);

      // Send rejection message back to player
      this.sendToPlayer(playerId, {
        type: 'ACTION_RESULT',
        success: false,
        error: validation.error,
        actionType: action.type,
      });

      return { success: false, error: validation.error };
    }

    // Process the action (using actionWithPlayer which has playerId attached)
    const result = processActionAsHost(actionWithPlayer, state, dispatch);

    if (result.success) {
      this.log('Action processed:', action.type);

      // Send success message
      this.sendToPlayer(playerId, {
        type: 'ACTION_RESULT',
        success: true,
        actionType: action.type,
      });

      // Update internal game state
      this.updateStateFromRedux();

      // Broadcast updated state to all peers
      this.broadcastState();
    } else {
      this.log('Action failed:', action.type, result.error);

      // Send failure message
      this.sendToPlayer(playerId, {
        type: 'ACTION_RESULT',
        success: false,
        error: result.error,
        actionType: action.type,
      });
    }

    return result;
  }

  /**
   * Broadcast current state to all peers
   */
  broadcastState(): void {
    if (!this._isHost || !this._gameState) {
      return;
    }

    this.hostState.sequence++;

    const message: HostMessage = {
      type: 'GAME_STATE',
      state: this._gameState,
    };

    this.broadcast(message);
    this.log('Broadcasted state, sequence:', this.hostState.sequence);
  }

  /**
   * Get current authoritative state
   */
  getState(): GameState | null {
    return this._gameState;
  }

  /**
   * Update state (for local actions or state sync)
   */
  updateState(newState: GameState): void {
    this._gameState = newState;
  }

  /**
   * Update internal game state from Redux store
   */
  updateStateFromRedux(): void {
    const state = store.getState();
    this._gameState = this.extractGameStateFromRedux(state);
  }

  /**
   * Stop being host
   */
  stopHost(): void {
    this._isHost = false;
    this.hostState.isHost = false;
    this._gameState = null;

    this.stopBroadcasting();
    partyClient.setIsHost(false);

    this.log('Stopped being host');
  }

  /**
   * Check if this client is the host
   */
  get isHost(): boolean {
    return this._isHost;
  }

  // ==========================================================================
  // Lobby Management
  // ==========================================================================

  /**
   * Initialize lobby state when creating a room
   */
  initializeLobby(roomCode: string, hostPlayer: LobbyPlayer, settings: GameSettings): void {
    this.hostState.lobbyState = {
      roomCode,
      hostId: hostPlayer.id,
      players: [hostPlayer],
      settings,
      canStart: false,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.broadcastLobbyState();
  }

  /**
   * Broadcast lobby state to all players
   * NOTE: Lobby state is managed by the PartyKit server, not the host browser.
   * The server broadcasts LOBBY_STATE to all players when lobby actions happen.
   * This method is kept for local state tracking but doesn't send network messages.
   */
  broadcastLobbyState(): void {
    // Lobby state is managed by the PartyKit server
    // Don't broadcast from host - let server handle it
    this.log('Lobby state updated locally (server manages network sync)');
  }

  /**
   * Update lobby settings
   */
  updateLobbySettings(settings: Partial<GameSettings>): void {
    if (!this.hostState.lobbyState) {
      return;
    }

    this.hostState.lobbyState.settings = {
      ...this.hostState.lobbyState.settings,
      ...settings,
    };
    this.hostState.lobbyState.lastActivity = Date.now();

    this.broadcastLobbyState();
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private broadcast(message: HostMessage): void {
    try {
      partyClient.send({ type: 'GAME_ACTION', action: message as any });
    } catch (error) {
      this.log('Broadcast error:', error);
    }
  }

  private sendToPlayer(playerId: string, message: HostMessage): void {
    // In a full implementation, this would use PartyKit's targeted messaging
    // For now, broadcast to all (clients will filter by their own ID)
    try {
      partyClient.send({ type: 'GAME_ACTION', action: message as any });
    } catch (error) {
      this.log('Send to player error:', error);
    }
  }

  private startBroadcasting(): void {
    this.stopBroadcasting();

    this.broadcastIntervalId = setInterval(() => {
      if (this._isHost && this._gameState) {
        this.broadcastState();
      }
    }, this.config.broadcastInterval);
  }

  private stopBroadcasting(): void {
    if (this.broadcastIntervalId) {
      clearInterval(this.broadcastIntervalId);
      this.broadcastIntervalId = null;
    }
  }

  private extractGameStateFromRedux(state: RootState): GameState {
    // Combine Redux slices into a GameState object
    const { game, board, players, log } = state;

    return {
      roomCode: partyClient.roomCode || '',
      mode: game.mode,
      settings: game.settings,
      version: this.hostState.sequence,
      lastUpdated: Date.now(),
      phase: game.phase,
      turn: game.turn,
      currentPlayerId: game.currentPlayerId || '',
      turnTimeRemaining: game.turnTimeRemaining,
      turnStartedAt: game.turnStartedAt,
      tiles: board.tiles,
      buildings: board.buildings,
      roads: board.roads,
      ports: board.ports,
      knights: board.knights,
      players: players.players,
      turnOrder: players.turnOrder,
      playersNeedingToDiscard: game.pendingDiscard,
      discardAmounts: {},
      robberLocation: board.robberLocation,
      pirateLocation: board.pirateLocation,
      developmentDeck: [],
      developmentDeckCount: game.developmentDeckCount,
      bank: game.bank,
      longestRoad: game.longestRoad,
      largestArmy: game.largestArmy,
      activeOffers: [],
      lastRoll: game.lastRoll || undefined,
      roadBuildingRemaining: game.roadBuildingRemaining || undefined,
      yearOfPlentyRemaining: game.yearOfPlentyRemaining || undefined,
      setupPlayerIndex: game.setupPlayerIndex || undefined,
      setupDirection: game.setupDirection || undefined,
      log: log.log,
      chat: log.chat,
    };
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[HostManager]', ...args);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Singleton instance of HostManager
 */
export const hostManager = new HostManager({
  debug: process.env.NODE_ENV !== 'production',
});

export default hostManager;
