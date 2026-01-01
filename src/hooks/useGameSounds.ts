/**
 * useGameSounds - Auto-play sounds based on game events
 *
 * This hook monitors game state changes and plays appropriate sound effects.
 * It tracks previous state to detect changes and trigger sounds.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from './index';
import { useSound } from './useSound';
import {
  selectPhase,
  selectLastRoll,
  selectCurrentPlayerId,
  selectLongestRoad,
  selectLargestArmy,
  selectWinnerId,
  selectBarbarianPosition,
} from '@/game/state/slices/gameSlice';
import {
  selectBuildings,
  selectRoads,
  selectKnights,
  selectRobberLocation,
} from '@/game/state/slices/boardSlice';
import { selectLocalPlayerId } from '@/game/state/slices/lobbySlice';
import { selectIncomingTradeOffers } from '@/game/state/slices/uiSlice';
import { selectChat } from '@/game/state/slices/logSlice';
import type { GamePhase } from '@/types';

/**
 * Previous state reference for comparison
 */
interface PrevState {
  phase: GamePhase | null;
  lastRollTotal: number | null;
  currentPlayerId: string | null;
  buildingCount: number;
  roadCount: number;
  knightCount: number;
  robberQ: number;
  robberR: number;
  longestRoadHolder: string | null;
  largestArmyHolder: string | null;
  winnerId: string | null;
  barbarianPosition: number;
  incomingTradeCount: number;
  chatMessageCount: number;
}

/**
 * Hook to automatically play sounds based on game events
 */
export function useGameSounds(): void {
  const { playSound, soundEnabled } = useSound();

  // Game state selectors
  const phase = useAppSelector(selectPhase);
  const lastRoll = useAppSelector(selectLastRoll);
  const currentPlayerId = useAppSelector(selectCurrentPlayerId);
  const localPlayerId = useAppSelector(selectLocalPlayerId);
  const buildings = useAppSelector(selectBuildings);
  const roads = useAppSelector(selectRoads);
  const knights = useAppSelector(selectKnights);
  const robberLocation = useAppSelector(selectRobberLocation);
  const longestRoad = useAppSelector(selectLongestRoad);
  const largestArmy = useAppSelector(selectLargestArmy);
  const winnerId = useAppSelector(selectWinnerId);
  const barbarianPosition = useAppSelector(selectBarbarianPosition);
  const incomingTradeOffers = useAppSelector(selectIncomingTradeOffers);
  const chatMessages = useAppSelector(selectChat);

  // Track previous state
  const prevState = useRef<PrevState>({
    phase: null,
    lastRollTotal: null,
    currentPlayerId: null,
    buildingCount: 0,
    roadCount: 0,
    knightCount: 0,
    robberQ: 0,
    robberR: 0,
    longestRoadHolder: null,
    largestArmyHolder: null,
    winnerId: null,
    barbarianPosition: 0,
    incomingTradeCount: 0,
    chatMessageCount: 0,
  });

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  /**
   * Check if it's the local player's turn
   */
  const isMyTurn = currentPlayerId === localPlayerId;

  /**
   * Play dice roll sound when dice are rolled
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const newRollTotal = lastRoll?.total ?? null;
    if (
      newRollTotal !== null &&
      newRollTotal !== prevState.current.lastRollTotal
    ) {
      playSound('dice_roll');
    }
    prevState.current.lastRollTotal = newRollTotal;
  }, [lastRoll, playSound, soundEnabled]);

  /**
   * Play "your turn" sound when it becomes the local player's turn
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevPlayerId = prevState.current.currentPlayerId;
    const wasMyTurn = prevPlayerId === localPlayerId;

    if (isMyTurn && !wasMyTurn && phase === 'roll') {
      playSound('your_turn');
    }

    prevState.current.currentPlayerId = currentPlayerId;
  }, [currentPlayerId, isMyTurn, localPlayerId, phase, playSound, soundEnabled]);

  /**
   * Play building sounds when buildings are placed
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevCount = prevState.current.buildingCount;
    const newCount = buildings.length;

    if (newCount > prevCount) {
      // Determine the type of the new building
      const newBuilding = buildings[buildings.length - 1];
      if (newBuilding) {
        if (newBuilding.type === 'settlement') {
          playSound('settlement_place');
        } else if (newBuilding.type === 'city') {
          playSound('city_place');
        }
      }
    }

    prevState.current.buildingCount = newCount;
  }, [buildings, playSound, soundEnabled]);

  /**
   * Play road sound when roads are placed
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevCount = prevState.current.roadCount;
    const newCount = roads.length;

    if (newCount > prevCount) {
      const newRoad = roads[roads.length - 1];
      if (newRoad) {
        if (newRoad.type === 'ship') {
          playSound('ship_place');
        } else {
          playSound('road_place');
        }
      }
    }

    prevState.current.roadCount = newCount;
  }, [roads, playSound, soundEnabled]);

  /**
   * Play knight sounds when knights are placed/upgraded
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevCount = prevState.current.knightCount;
    const newCount = knights.length;

    if (newCount > prevCount) {
      playSound('knight_activate');
    }

    prevState.current.knightCount = newCount;
  }, [knights, playSound, soundEnabled]);

  /**
   * Play robber sound when robber moves
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevQ = prevState.current.robberQ;
    const prevR = prevState.current.robberR;

    if (
      robberLocation.q !== prevQ ||
      robberLocation.r !== prevR
    ) {
      playSound('robber_place');
    }

    prevState.current.robberQ = robberLocation.q;
    prevState.current.robberR = robberLocation.r;
  }, [robberLocation, playSound, soundEnabled]);

  /**
   * Play achievement sounds for longest road/largest army
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const newHolder = longestRoad?.playerId ?? null;
    const prevHolder = prevState.current.longestRoadHolder;

    if (newHolder !== null && newHolder !== prevHolder) {
      if (newHolder === localPlayerId) {
        playSound('longest_road');
      } else {
        playSound('achievement');
      }
    }

    prevState.current.longestRoadHolder = newHolder;
  }, [longestRoad, localPlayerId, playSound, soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const newHolder = largestArmy?.playerId ?? null;
    const prevHolder = prevState.current.largestArmyHolder;

    if (newHolder !== null && newHolder !== prevHolder) {
      if (newHolder === localPlayerId) {
        playSound('largest_army');
      } else {
        playSound('achievement');
      }
    }

    prevState.current.largestArmyHolder = newHolder;
  }, [largestArmy, localPlayerId, playSound, soundEnabled]);

  /**
   * Play victory sound when game ends
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    if (winnerId !== null && winnerId !== prevState.current.winnerId) {
      if (winnerId === localPlayerId) {
        playSound('victory');
      } else {
        playSound('notification');
      }
    }

    prevState.current.winnerId = winnerId;
  }, [winnerId, localPlayerId, playSound, soundEnabled]);

  /**
   * Play barbarian advance sound (Cities & Knights)
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevPosition = prevState.current.barbarianPosition;

    if (barbarianPosition > prevPosition) {
      if (barbarianPosition >= 7) {
        playSound('barbarian_attack');
      } else {
        playSound('barbarian_advance');
      }
    }

    prevState.current.barbarianPosition = barbarianPosition;
  }, [barbarianPosition, playSound, soundEnabled]);

  /**
   * Play notification for incoming trade offers
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevCount = prevState.current.incomingTradeCount;
    const newCount = incomingTradeOffers.length;

    if (newCount > prevCount) {
      playSound('trade_proposed');
    }

    prevState.current.incomingTradeCount = newCount;
  }, [incomingTradeOffers, playSound, soundEnabled]);

  /**
   * Play notification for new chat messages from other players
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevCount = prevState.current.chatMessageCount;
    const newCount = chatMessages.length;

    if (newCount > prevCount) {
      // Check if the new message is from another player
      const newMessages = chatMessages.slice(prevCount);
      const hasOtherPlayerMessage = newMessages.some(
        (msg) => msg.playerId !== localPlayerId
      );

      if (hasOtherPlayerMessage) {
        playSound('chat_message');
      }
    }

    prevState.current.chatMessageCount = newCount;
  }, [chatMessages, localPlayerId, playSound, soundEnabled]);

  /**
   * Play phase-specific sounds
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevPhase = prevState.current.phase;

    // Phase transition sounds
    if (phase !== prevPhase) {
      switch (phase) {
        case 'discard':
          playSound('discard');
          break;
        case 'ended':
          // Victory sound is handled separately
          break;
      }
    }

    prevState.current.phase = phase;
  }, [phase, playSound, soundEnabled]);

  /**
   * Mark initial mount as complete after first render
   */
  useEffect(() => {
    // Initialize prev state
    prevState.current = {
      phase,
      lastRollTotal: lastRoll?.total ?? null,
      currentPlayerId,
      buildingCount: buildings.length,
      roadCount: roads.length,
      knightCount: knights.length,
      robberQ: robberLocation.q,
      robberR: robberLocation.r,
      longestRoadHolder: longestRoad?.playerId ?? null,
      largestArmyHolder: largestArmy?.playerId ?? null,
      winnerId,
      barbarianPosition,
      incomingTradeCount: incomingTradeOffers.length,
      chatMessageCount: chatMessages.length,
    };

    // Mark initial mount as complete
    isInitialMount.current = false;
  }, []); // Only run once on mount
}

export default useGameSounds;
