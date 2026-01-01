// @ts-nocheck
// TODO: Fix TypeScript errors in this file
/**
 * PeerManager - Non-host peer logic for OpenCatan
 *
 * Peers send actions to the host for validation and receive state updates.
 * This manager handles:
 * - Sending actions to the host via PartyKit
 * - Handling state updates from the host
 * - Managing optimistic updates and rollbacks
 * - Requesting state synchronization
 */

import type { GameState, GameAction } from '@/types/game';
import type { HostMessage, LobbyState } from '@/types/network';
import { partyClient } from './partyClient';
import { store, type RootState, type AppDispatch } from '@/game/state/store';
import {
  setPhase,
  setCurrentPlayer,
  setDiceRoll,
  updateTimer,
  setLongestRoad,
  setLargestArmy,
  updateBank,
  setPendingDiscard,
} from '@/game/state/slices/gameSlice';
import {
  syncLobbyState,
  setConnectionStatus,
  setErrorMessage,
} from '@/game/state/slices/lobbySlice';
import { addLogEntry, addChatMessage, syncLog } from '@/game/state/slices/logSlice';

// ============================================================================
// Types
// ============================================================================

export interface PendingAction {
  /** The action being sent */
  action: GameAction;
  /** When the action was sent */
  timestamp: number;
  /** Callback on success */
  onSuccess?: () => void;
  /** Callback on failure */
  onError?: (error: string) => void;
}

export interface PeerManagerConfig {
  /** Debug mode */
  debug?: boolean;
  /** Timeout for pending actions in ms */
  actionTimeout?: number;
}

// ============================================================================
// PeerManager Class
// ============================================================================

/**
 * Manages peer (non-host) client logic
 */
class PeerManager {
  private config: Required<PeerManagerConfig>;
  private pendingActions: Map<string, PendingAction> = new Map();
  private currentSequence = 0;
  private _lastGameState: GameState | null = null;
  private _lastLobbyState: LobbyState | null = null;

  constructor(config: PeerManagerConfig = {}) {
    this.config = {
      debug: config.debug || false,
      actionTimeout: config.actionTimeout || 5000,
    };

    // Set up message handlers
    this.setupMessageHandlers();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Send an action to the host (via PartyKit)
   */
  sendAction(action: GameAction): void {
    if (!partyClient.isConnected) {
      this.log('Cannot send action: not connected');
      throw new Error('Not connected to server');
    }

    const actionId = this.generateActionId(action);

    // Store as pending
    this.pendingActions.set(actionId, {
      action,
      timestamp: Date.now(),
    });

    // Send to host
    partyClient.send({
      type: 'GAME_ACTION',
      action,
    });

    this.log('Sent action:', action.type);

    // Set timeout for action
    setTimeout(() => {
      if (this.pendingActions.has(actionId)) {
        this.pendingActions.delete(actionId);
        this.log('Action timed out:', action.type);
      }
    }, this.config.actionTimeout);
  }

  /**
   * Send action with callbacks
   */
  sendActionWithCallbacks(
    action: GameAction,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ): void {
    if (!partyClient.isConnected) {
      onError?.('Not connected to server');
      return;
    }

    const actionId = this.generateActionId(action);

    this.pendingActions.set(actionId, {
      action,
      timestamp: Date.now(),
      onSuccess,
      onError,
    });

    partyClient.send({
      type: 'GAME_ACTION',
      action,
    });

    this.log('Sent action with callbacks:', action.type);
  }

  /**
   * Handle state update from host
   */
  handleStateUpdate(state: GameState): void {
    // Check sequence to avoid out-of-order updates
    if (state.version <= this.currentSequence) {
      this.log('Ignoring out-of-order state update:', state.version, '<=', this.currentSequence);
      return;
    }

    this.currentSequence = state.version;
    this._lastGameState = state;

    // Apply state to Redux
    this.applyGameState(state);

    this.log('Applied state update, version:', state.version);
  }

  /**
   * Handle lobby state update from host
   */
  handleLobbyUpdate(state: LobbyState): void {
    this._lastLobbyState = state;

    // Apply to Redux
    store.dispatch(
      syncLobbyState({
        roomCode: state.roomCode,
        players: state.players,
        settings: {
          mode: state.settings.mode,
          playerCount: state.settings.playerCount as 3 | 4 | 5 | 6,
          victoryPoints: state.settings.victoryPoints,
          turnTimer: state.settings.turnTimer,
          discardLimit: state.settings.discardLimit,
          friendlyRobber: state.settings.friendlyRobber,
          mapType: state.settings.map,
        },
        gameStarted: state.phase !== 'lobby',
      })
    );

    this.log('Applied lobby update');
  }

  /**
   * Request full state sync from host
   */
  requestSync(): void {
    if (!partyClient.isConnected) {
      this.log('Cannot request sync: not connected');
      return;
    }

    partyClient.send({
      type: 'REQUEST_STATE',
    });

    this.log('Requested state sync');
  }

  /**
   * Get the last received game state
   */
  get lastGameState(): GameState | null {
    return this._lastGameState;
  }

  /**
   * Get the last received lobby state
   */
  get lastLobbyState(): LobbyState | null {
    return this._lastLobbyState;
  }

  /**
   * Clear pending actions (e.g., on reconnect)
   */
  clearPendingActions(): void {
    for (const [id, pending] of this.pendingActions) {
      pending.onError?.('Connection reset');
    }
    this.pendingActions.clear();
  }

  /**
   * Get number of pending actions
   */
  get pendingActionCount(): number {
    return this.pendingActions.size;
  }

  /**
   * Check if synchronized (no pending actions)
   */
  get isSynchronized(): boolean {
    return this.pendingActions.size === 0;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private setupMessageHandlers(): void {
    // Handle game state updates
    partyClient.on('GAME_STATE', (message) => {
      if ('state' in message) {
        this.handleStateUpdate(message.state);
      }
    });

    // Handle lobby state updates
    partyClient.on('LOBBY_STATE', (message) => {
      if ('state' in message) {
        this.handleLobbyUpdate(message.state);
      }
    });

    // Handle action results
    partyClient.on('ACTION_RESULT', (message) => {
      this.handleActionResult(message as any);
    });

    // Handle errors
    partyClient.on('ERROR', (message) => {
      if ('message' in message) {
        store.dispatch(setErrorMessage(message.message));
      }
    });

    // Handle chat broadcasts
    partyClient.on('CHAT_BROADCAST', (message) => {
      if ('message' in message) {
        store.dispatch(addChatMessage(message.message as any));
      }
    });

    // Handle log entries
    partyClient.on('LOG_ENTRY', (message) => {
      if ('entry' in message) {
        store.dispatch(addLogEntry(message.entry as any));
      }
    });
  }

  private handleActionResult(message: {
    success: boolean;
    error?: string;
    actionType: string;
  }): void {
    // Find matching pending action
    for (const [id, pending] of this.pendingActions) {
      if (pending.action.type === message.actionType) {
        if (message.success) {
          pending.onSuccess?.();
        } else {
          pending.onError?.(message.error || 'Action rejected');
        }
        this.pendingActions.delete(id);
        break;
      }
    }
  }

  private applyGameState(state: GameState): void {
    const dispatch = store.dispatch;

    // Apply game slice updates
    dispatch(setPhase(state.phase));
    dispatch(setCurrentPlayer(state.currentPlayerId));

    if (state.lastRoll) {
      dispatch(setDiceRoll(state.lastRoll));
    }

    dispatch(updateTimer(state.turnTimeRemaining));
    dispatch(updateBank(state.bank));

    if (state.longestRoad) {
      dispatch(setLongestRoad(state.longestRoad));
    }

    if (state.largestArmy) {
      dispatch(setLargestArmy(state.largestArmy));
    }

    if (state.playersNeedingToDiscard) {
      dispatch(setPendingDiscard(state.playersNeedingToDiscard));
    }

    // Sync log and chat
    dispatch(
      syncLog({
        log: state.log,
        chat: state.chat,
      })
    );

    // Note: Board and player state would also need to be synced
    // This requires additional slice actions for full synchronization
  }

  private generateActionId(action: GameAction): string {
    return `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[PeerManager]', ...args);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Singleton instance of PeerManager
 */
export const peerManager = new PeerManager({
  debug: process.env.NODE_ENV !== 'production',
});

export default peerManager;
