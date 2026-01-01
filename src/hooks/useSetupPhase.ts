/**
 * useSetupPhase - React hook for managing setup phase state and actions
 *
 * Provides:
 * - Current setup state (round, placement type, whose turn)
 * - Valid placement locations
 * - Actions for placing settlements and roads
 * - Progress tracking
 */

import { useMemo, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from './index';
import type { VertexCoord, EdgeCoord, Player } from '../types';
import {
  selectPhase,
  selectCurrentPlayerId,
  selectTurnTimeRemaining,
  selectSetupState,
} from '../game/state/slices/gameSlice';
import {
  selectPlayers,
  selectTurnOrder,
} from '../game/state/slices/playersSlice';
import {
  selectTiles,
  selectBuildings,
  selectRoads,
  selectPorts,
} from '../game/state/slices/boardSlice';
import {
  getSetupPlacementType,
  getSetupRound,
  isSecondSettlement,
  getValidSetupSettlementPlacements,
  getValidSetupRoadPlacements,
  getSetupTurnOrder,
  getTotalSetupPlacements,
  getSetupTimerDuration,
} from '../game/engine/setupManager';

// ============================================================================
// Types
// ============================================================================

export interface UseSetupPhaseResult {
  /** Whether we're currently in setup phase */
  isSetupPhase: boolean;
  /** Current setup round (1 or 2) */
  setupRound: 1 | 2;
  /** Current placement type */
  currentPlacementType: 'settlement' | 'road';
  /** Whether it's the local player's turn */
  isMyTurn: boolean;
  /** The current player whose turn it is */
  currentPlayer: Player | undefined;
  /** Valid settlement placements (when placing settlement) */
  validSettlements: VertexCoord[];
  /** Valid road placements (when placing road) */
  validRoads: EdgeCoord[];
  /** Whether this is a second settlement (grants resources) */
  isSecondSettlement: boolean;
  /** Number of placements made so far */
  placementsMade: number;
  /** Total placements needed */
  totalPlacements: number;
  /** Time remaining for this placement */
  timeRemaining: number;
  /** Setup timer duration */
  setupTimerDuration: number;
  /** All players in the game */
  players: Player[];
  /** Setup turn order (player IDs) */
  turnOrder: string[];
  /** Completed placements per player */
  completedPlacements: Record<string, {
    settlement1: VertexCoord | null;
    road1: EdgeCoord | null;
    settlement2: VertexCoord | null;
    road2: EdgeCoord | null;
  }>;
  /** Place a settlement at a vertex */
  placeSettlement: (vertex: VertexCoord) => void;
  /** Place a road at an edge */
  placeRoad: (edge: EdgeCoord) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to manage setup phase state and actions.
 *
 * @param localPlayerId - The local player's ID
 * @returns Setup phase state and actions
 */
export function useSetupPhase(localPlayerId?: string): UseSetupPhaseResult {
  const dispatch = useAppDispatch();

  // Select state from Redux
  const phase = useAppSelector(selectPhase);
  const currentPlayerId = useAppSelector(selectCurrentPlayerId);
  const timeRemaining = useAppSelector(selectTurnTimeRemaining);
  const setupState = useAppSelector(selectSetupState);
  const players = useAppSelector(selectPlayers);
  const turnOrder = useAppSelector(selectTurnOrder);
  const tiles = useAppSelector(selectTiles);
  const buildings = useAppSelector(selectBuildings);
  const roads = useAppSelector(selectRoads);
  const ports = useAppSelector(selectPorts);

  // Check if we're in setup phase
  const isSetupPhase = phase.startsWith('setup-');

  // Build a game state object for the setup manager functions
  const gameStateForSetup = useMemo(() => {
    return {
      phase,
      players,
      tiles,
      buildings,
      roads,
      ports,
      bank: {
        brick: 19,
        lumber: 19,
        ore: 19,
        grain: 19,
        wool: 19,
      },
      currentPlayerId,
      setupState: setupState || {
        currentPlacementIndex: 0,
        lastPlacedSettlement: null,
        placementsComplete: false,
        playerPlacements: {},
      },
    };
  }, [phase, players, tiles, buildings, roads, ports, currentPlayerId, setupState]);

  // Calculate setup-specific values
  const setupRound = useMemo(() => {
    if (!isSetupPhase) return 1;
    return getSetupRound(gameStateForSetup as any);
  }, [isSetupPhase, gameStateForSetup]);

  const currentPlacementType = useMemo(() => {
    if (!isSetupPhase) return 'settlement';
    return getSetupPlacementType(gameStateForSetup as any);
  }, [isSetupPhase, gameStateForSetup]);

  const isSecondSettlementPlacement = useMemo(() => {
    if (!isSetupPhase) return false;
    return isSecondSettlement(gameStateForSetup as any);
  }, [isSetupPhase, gameStateForSetup]);

  // Get current player
  const currentPlayer = useMemo(() => {
    return players.find((p) => p.id === currentPlayerId);
  }, [players, currentPlayerId]);

  // Check if it's the local player's turn
  const isMyTurn = useMemo(() => {
    return localPlayerId === currentPlayerId;
  }, [localPlayerId, currentPlayerId]);

  // Get valid placements
  const validSettlements = useMemo(() => {
    if (!isSetupPhase || currentPlacementType !== 'settlement') return [];
    return getValidSetupSettlementPlacements(gameStateForSetup as any);
  }, [isSetupPhase, currentPlacementType, gameStateForSetup]);

  const validRoads = useMemo(() => {
    if (!isSetupPhase || currentPlacementType !== 'road') return [];
    return getValidSetupRoadPlacements(gameStateForSetup as any);
  }, [isSetupPhase, currentPlacementType, gameStateForSetup]);

  // Progress tracking
  const placementsMade = useMemo(() => {
    return setupState?.currentPlacementIndex ?? 0;
  }, [setupState]);

  const totalPlacements = useMemo(() => {
    return getTotalSetupPlacements(players.length);
  }, [players.length]);

  // Turn order for display
  const setupTurnOrder = useMemo(() => {
    return getSetupTurnOrder(players);
  }, [players]);

  // Get completed placements from setup state
  const completedPlacements = useMemo(() => {
    return setupState?.playerPlacements ?? {};
  }, [setupState]);

  // Action: Place settlement
  const placeSettlement = useCallback(
    (vertex: VertexCoord) => {
      if (!isMyTurn || currentPlacementType !== 'settlement') return;

      // Dispatch action to place settlement
      // This would typically dispatch to a thunk or action that handles:
      // 1. Updating board state (add building)
      // 2. Updating player state (decrement settlements)
      // 3. Updating setup state (increment index, set lastPlacedSettlement)
      // 4. If second settlement, distributing starting resources
      // 5. Advancing setup phase

      // For now, we'll create a placeholder dispatch
      // The actual implementation would depend on your network layer
      dispatch({
        type: 'game/placeSetupSettlement',
        payload: {
          playerId: localPlayerId,
          vertex,
          isSecondSettlement: isSecondSettlementPlacement,
        },
      });
    },
    [dispatch, isMyTurn, currentPlacementType, localPlayerId, isSecondSettlementPlacement]
  );

  // Action: Place road
  const placeRoad = useCallback(
    (edge: EdgeCoord) => {
      if (!isMyTurn || currentPlacementType !== 'road') return;

      // Dispatch action to place road
      dispatch({
        type: 'game/placeSetupRoad',
        payload: {
          playerId: localPlayerId,
          edge,
        },
      });
    },
    [dispatch, isMyTurn, currentPlacementType, localPlayerId]
  );

  return {
    isSetupPhase,
    setupRound,
    currentPlacementType,
    isMyTurn,
    currentPlayer,
    validSettlements,
    validRoads,
    isSecondSettlement: isSecondSettlementPlacement,
    placementsMade,
    totalPlacements,
    timeRemaining,
    setupTimerDuration: getSetupTimerDuration(),
    players,
    turnOrder: setupTurnOrder,
    completedPlacements,
    placeSettlement,
    placeRoad,
  };
}

export default useSetupPhase;
