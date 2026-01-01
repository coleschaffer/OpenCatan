/**
 * useLobbySounds - Auto-play sounds based on lobby events
 *
 * This hook monitors lobby state changes and plays appropriate sound effects.
 * It handles:
 * - Player joined
 * - Player left
 * - Ready status change
 * - Game starting
 */

import { useEffect, useRef } from 'react';
import { useAppSelector } from './index';
import { useSound } from './useSound';
import {
  selectLobbyPlayers,
  selectLocalPlayerId,
  selectGameStarted,
} from '@/game/state';

/**
 * Previous state reference for comparison
 */
interface PrevLobbyState {
  playerCount: number;
  readyCount: number;
  gameStarted: boolean;
}

/**
 * Hook to automatically play sounds based on lobby events
 */
export function useLobbySounds(): void {
  const { playSound, soundEnabled } = useSound();

  // Lobby state selectors
  const players = useAppSelector(selectLobbyPlayers);
  const localPlayerId = useAppSelector(selectLocalPlayerId);
  const gameStarted = useAppSelector(selectGameStarted);

  // Track previous state
  const prevState = useRef<PrevLobbyState>({
    playerCount: 0,
    readyCount: 0,
    gameStarted: false,
  });

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  /**
   * Play sound when player joins or leaves
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const prevCount = prevState.current.playerCount;
    const newCount = players.length;

    if (newCount > prevCount) {
      // Player joined
      playSound('player_joined');
    } else if (newCount < prevCount) {
      // Player left
      playSound('player_left');
    }

    prevState.current.playerCount = newCount;
  }, [players.length, playSound, soundEnabled]);

  /**
   * Play sound when game starts
   */
  useEffect(() => {
    if (!soundEnabled) return;
    if (isInitialMount.current) return;

    const wasStarted = prevState.current.gameStarted;

    if (gameStarted && !wasStarted) {
      playSound('game_start');
    }

    prevState.current.gameStarted = gameStarted;
  }, [gameStarted, playSound, soundEnabled]);

  /**
   * Mark initial mount as complete after first render
   */
  useEffect(() => {
    // Initialize prev state
    prevState.current = {
      playerCount: players.length,
      readyCount: players.filter((p) => p.isReady).length,
      gameStarted,
    };

    // Mark initial mount as complete
    isInitialMount.current = false;
  }, []); // Only run once on mount
}

export default useLobbySounds;
