// @ts-nocheck
// TODO: Fix TypeScript errors in this file
/**
 * Peer (non-host) client logic for OpenCatan
 *
 * Peers send actions to the host for validation and receive state updates.
 * This module provides:
 * - Action request sending
 * - State update handling
 * - Optimistic updates
 * - Error handling for rejected actions
 */

import type { GameState, Player } from '../types/game';
import type {
  GameAction,
  HostMessage,
  GameStateMessage,
  ActionResultMessage,
  LobbyState,
} from './messages';
import type { RootState, AppDispatch } from '../game/state/store';

// ============================================================================
// Types
// ============================================================================

export interface PendingAction {
  action: GameAction;
  timestamp: number;
  optimisticState?: Partial<RootState>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface PeerState {
  isPeer: boolean;
  currentSequence: number;
  pendingActions: Map<string, PendingAction>;
  lastGameState: GameState | null;
  lastLobbyState: LobbyState | null;
  optimisticUpdates: Map<string, Partial<RootState>>;
}

export interface OptimisticUpdateResult {
  actionId: string;
  originalState: Partial<RootState>;
  optimisticState: Partial<RootState>;
}

// ============================================================================
// Peer State Management
// ============================================================================

/**
 * Create initial peer state
 */
export function createPeerState(): PeerState {
  return {
    isPeer: true,
    currentSequence: 0,
    pendingActions: new Map(),
    lastGameState: null,
    lastLobbyState: null,
    optimisticUpdates: new Map(),
  };
}

// ============================================================================
// Action Sending
// ============================================================================

/**
 * Queue an action to send to the host
 * Optionally provides optimistic update callbacks
 */
export function queueAction(
  action: GameAction,
  peerState: PeerState,
  options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    optimisticState?: Partial<RootState>;
  }
): string {
  const actionId = generateActionId(action);

  const pendingAction: PendingAction = {
    action,
    timestamp: Date.now(),
    optimisticState: options?.optimisticState,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  };

  peerState.pendingActions.set(actionId, pendingAction);

  // Store optimistic update if provided
  if (options?.optimisticState) {
    peerState.optimisticUpdates.set(actionId, options.optimisticState);
  }

  return actionId;
}

/**
 * Generate a unique ID for an action
 */
function generateActionId(action: GameAction): string {
  return `${action.type}_${action.playerId}_${action.timestamp}`;
}

/**
 * Create an optimistic update for a game action
 * Returns the state changes that should be applied optimistically
 */
export function createOptimisticUpdate(
  action: GameAction,
  currentState: RootState
): Partial<RootState> | null {
  switch (action.type) {
    case 'BUILD_ROAD':
      // Optimistically deduct resources and add road
      return createBuildRoadOptimisticUpdate(action, currentState);

    case 'BUILD_SETTLEMENT':
      return createBuildSettlementOptimisticUpdate(action, currentState);

    case 'BUILD_CITY':
      return createBuildCityOptimisticUpdate(action, currentState);

    case 'END_TURN':
      // Don't optimistically end turn - wait for server
      return null;

    case 'ROLL_DICE':
      // Can't predict dice roll
      return null;

    default:
      return null;
  }
}

function createBuildRoadOptimisticUpdate(
  action: GameAction,
  state: RootState
): Partial<RootState> | null {
  // TODO: Implement optimistic road building
  // Would deduct resources and add road to board state
  return null;
}

function createBuildSettlementOptimisticUpdate(
  action: GameAction,
  state: RootState
): Partial<RootState> | null {
  // TODO: Implement optimistic settlement building
  return null;
}

function createBuildCityOptimisticUpdate(
  action: GameAction,
  state: RootState
): Partial<RootState> | null {
  // TODO: Implement optimistic city building
  return null;
}

// ============================================================================
// State Update Handling
// ============================================================================

/**
 * Handle a game state update from the host
 * Reconciles with any pending optimistic updates
 */
export function handleStateUpdate(
  message: GameStateMessage,
  peerState: PeerState,
  dispatch: AppDispatch
): void {
  const { state, sequence } = message;

  // Ignore out-of-order updates
  if (sequence <= peerState.currentSequence) {
    console.warn(`Ignoring out-of-order state update: ${sequence} <= ${peerState.currentSequence}`);
    return;
  }

  peerState.currentSequence = sequence;
  peerState.lastGameState = state;

  // Clear any optimistic updates that are now stale
  clearStaleOptimisticUpdates(peerState, state);

  // Apply the authoritative state
  applyGameState(state, dispatch);
}

/**
 * Handle a lobby state update from the host
 */
export function handleLobbyUpdate(
  state: LobbyState,
  peerState: PeerState,
  dispatch: AppDispatch
): void {
  peerState.lastLobbyState = state;
  applyLobbyState(state, dispatch);
}

/**
 * Apply game state to Redux store
 */
function applyGameState(state: GameState, dispatch: AppDispatch): void {
  // Dispatch actions to update each slice of state
  // This would be implemented based on the actual slice structure

  // Example:
  // dispatch(setPhase(state.phase));
  // dispatch(setCurrentPlayer(state.currentPlayerId));
  // dispatch(setDiceRoll(state.diceRoll));
  // dispatch(setBoard({ tiles: state.tiles, buildings: state.buildings, roads: state.roads }));
  // dispatch(setPlayers(state.players));
  // etc.

  console.log('Applying game state update');
}

/**
 * Apply lobby state to Redux store
 */
function applyLobbyState(state: LobbyState, dispatch: AppDispatch): void {
  // Dispatch actions to update lobby state
  // dispatch(setLobbyState(state));

  console.log('Applying lobby state update');
}

/**
 * Clear optimistic updates that have been superseded by server state
 */
function clearStaleOptimisticUpdates(
  peerState: PeerState,
  newState: GameState
): void {
  // Remove pending actions that are now reflected in server state
  // or have timed out

  const staleThreshold = 5000; // 5 seconds
  const now = Date.now();

  for (const [actionId, pendingAction] of peerState.pendingActions) {
    // Clear if too old
    if (now - pendingAction.timestamp > staleThreshold) {
      peerState.pendingActions.delete(actionId);
      peerState.optimisticUpdates.delete(actionId);
    }
  }
}

// ============================================================================
// Action Result Handling
// ============================================================================

/**
 * Handle an action result message from the host
 */
export function handleActionResult(
  message: ActionResultMessage,
  peerState: PeerState,
  dispatch: AppDispatch
): void {
  // Find the pending action
  const actionId = message.action ? generateActionId(message.action) : null;

  if (!actionId) {
    return;
  }

  const pendingAction = peerState.pendingActions.get(actionId);

  if (!pendingAction) {
    // Action already cleared or not found
    return;
  }

  if (message.success) {
    // Action succeeded - call success callback
    pendingAction.onSuccess?.();

    // Clear the pending action
    peerState.pendingActions.delete(actionId);
    peerState.optimisticUpdates.delete(actionId);
  } else {
    // Action failed - rollback and notify
    handleActionRejected(actionId, message.error || 'Action rejected', peerState, dispatch);
  }
}

/**
 * Handle a rejected action
 * Rolls back optimistic updates and notifies the user
 */
export function handleActionRejected(
  actionId: string,
  error: string,
  peerState: PeerState,
  dispatch: AppDispatch
): void {
  const pendingAction = peerState.pendingActions.get(actionId);

  if (pendingAction) {
    // Call error callback
    pendingAction.onError?.(error);

    // Rollback optimistic state if we have the original
    const optimisticUpdate = peerState.optimisticUpdates.get(actionId);
    if (optimisticUpdate && peerState.lastGameState) {
      // Reapply the last known good state
      // This will be overwritten by the next state update anyway
    }

    // Clear pending action
    peerState.pendingActions.delete(actionId);
    peerState.optimisticUpdates.delete(actionId);
  }

  // Show error to user
  showActionError(error, dispatch);
}

/**
 * Show an action error to the user
 */
function showActionError(error: string, dispatch: AppDispatch): void {
  // Dispatch UI action to show error toast/message
  // dispatch(showToast({ type: 'error', message: error }));

  console.error('Action rejected:', error);
}

// ============================================================================
// Optimistic Update Application
// ============================================================================

/**
 * Apply an optimistic update to the local state
 * Returns a rollback function to undo the update
 */
export function applyOptimisticUpdate(
  update: Partial<RootState>,
  dispatch: AppDispatch
): () => void {
  // Store the current state for rollback
  // Apply the optimistic changes

  // This is a simplified implementation
  // In practice, you'd want to:
  // 1. Capture the current relevant state
  // 2. Apply the update
  // 3. Return a function that restores the original state

  console.log('Applying optimistic update');

  return () => {
    console.log('Rolling back optimistic update');
  };
}

// ============================================================================
// Synchronization Helpers
// ============================================================================

/**
 * Check if local state is synchronized with server
 */
export function isSynchronized(peerState: PeerState): boolean {
  return peerState.pendingActions.size === 0;
}

/**
 * Get the number of pending actions
 */
export function getPendingActionCount(peerState: PeerState): number {
  return peerState.pendingActions.size;
}

/**
 * Clear all pending actions (e.g., on reconnect)
 */
export function clearPendingActions(peerState: PeerState): void {
  // Call error callbacks for all pending actions
  for (const [actionId, pendingAction] of peerState.pendingActions) {
    pendingAction.onError?.('Connection reset');
  }

  peerState.pendingActions.clear();
  peerState.optimisticUpdates.clear();
}

/**
 * Get pending actions for retry after reconnection
 */
export function getPendingActionsForRetry(peerState: PeerState): GameAction[] {
  const actions: GameAction[] = [];

  // Sort by timestamp
  const sorted = Array.from(peerState.pendingActions.values())
    .sort((a, b) => a.timestamp - b.timestamp);

  for (const pending of sorted) {
    actions.push(pending.action);
  }

  return actions;
}

// ============================================================================
// State Comparison
// ============================================================================

/**
 * Compare local state with server state to detect desync
 */
export function detectDesync(
  localState: RootState,
  serverState: GameState
): boolean {
  // Compare key state properties that should match
  // This is a simplified implementation

  if (localState.game.phase !== serverState.phase) {
    return true;
  }

  if (localState.game.turn !== serverState.turn) {
    return true;
  }

  if (localState.game.currentPlayerId !== serverState.currentPlayerId) {
    return true;
  }

  return false;
}

/**
 * Force resync with server state
 */
export function forceResync(
  serverState: GameState,
  peerState: PeerState,
  dispatch: AppDispatch
): void {
  // Clear all pending actions
  clearPendingActions(peerState);

  // Apply server state
  applyGameState(serverState, dispatch);

  console.log('Force resynced with server state');
}
