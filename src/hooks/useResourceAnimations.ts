import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../game/state/store';
import type { ResourceType, ResourceCounts } from '../types/common';
import type { ResourceAnimationData } from '../components/animations/ResourceAnimation';

// Player color to CSS color mapping
const PLAYER_COLORS: Record<string, string> = {
  red: '#e53935',
  blue: '#1e88e5',
  white: '#f5f5f5',
  orange: '#fb8c00',
  green: '#43a047',
  brown: '#795548',
};

/**
 * Hook for managing resource card animations
 * Detects when players receive resources and triggers animations
 */
export function useResourceAnimations() {
  const [animations, setAnimations] = useState<ResourceAnimationData[]>([]);
  const players = useSelector((state: RootState) => state.players.players) || [];
  const localPlayerId = useSelector((state: RootState) => state.lobby.localPlayerId);

  // Track previous resource counts to detect changes
  const prevResourcesRef = useRef<Record<string, ResourceCounts>>({});

  // Bank position (top-right area typically)
  const getBankPosition = useCallback(() => {
    // Position in the top-right area of the screen
    return { x: window.innerWidth - 100, y: 80 };
  }, []);

  // Get player hand position (bottom center for local player)
  const getPlayerPosition = useCallback((playerId: string) => {
    if (playerId === localPlayerId) {
      // Local player's hand is at the bottom
      return { x: window.innerWidth / 2, y: window.innerHeight - 100 };
    }
    // Other players - position varies based on index
    const playerIndex = players.findIndex((p) => p.id === playerId);
    const x = window.innerWidth - 180;
    const y = 150 + playerIndex * 100;
    return { x, y };
  }, [localPlayerId, players]);

  // Trigger animations for resource gains
  const triggerResourceAnimation = useCallback((
    playerId: string,
    resources: Partial<ResourceCounts>,
    playerColor: string
  ) => {
    const bankPos = getBankPosition();
    const playerPos = getPlayerPosition(playerId);

    const newAnimations: ResourceAnimationData[] = [];
    let delay = 0;

    // Create an animation for each resource card
    for (const [resource, count] of Object.entries(resources)) {
      if (count && count > 0) {
        for (let i = 0; i < count; i++) {
          newAnimations.push({
            id: `${playerId}-${resource}-${Date.now()}-${delay}`,
            resource: resource as ResourceType,
            playerId,
            playerColor: PLAYER_COLORS[playerColor] || playerColor,
            fromPosition: {
              x: bankPos.x + (Math.random() - 0.5) * 40,
              y: bankPos.y + (Math.random() - 0.5) * 20,
            },
            toPosition: {
              x: playerPos.x + (Math.random() - 0.5) * 60,
              y: playerPos.y + (Math.random() - 0.5) * 20,
            },
            delay,
          });
          delay += 80; // Stagger animations
        }
      }
    }

    if (newAnimations.length > 0) {
      setAnimations((prev) => [...prev, ...newAnimations]);
    }
  }, [getBankPosition, getPlayerPosition]);

  // Handle animation completion
  const handleAnimationComplete = useCallback((id: string) => {
    setAnimations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Detect resource changes and trigger animations
  useEffect(() => {
    for (const player of players) {
      const prevResources = prevResourcesRef.current[player.id];
      const currentResources = player.resources;

      if (prevResources && currentResources) {
        // Calculate gained resources
        const gained: Partial<ResourceCounts> = {};
        let hasGains = false;

        for (const resource of ['brick', 'lumber', 'ore', 'grain', 'wool'] as ResourceType[]) {
          const prev = prevResources[resource] || 0;
          const current = currentResources[resource] || 0;
          const diff = current - prev;

          if (diff > 0) {
            gained[resource] = diff;
            hasGains = true;
          }
        }

        // Trigger animation for gains
        if (hasGains) {
          triggerResourceAnimation(player.id, gained, player.color);
        }
      }

      // Update ref
      prevResourcesRef.current[player.id] = { ...currentResources };
    }
  }, [players, triggerResourceAnimation]);

  // Initialize refs on mount
  useEffect(() => {
    for (const player of players) {
      prevResourcesRef.current[player.id] = { ...player.resources };
    }
  }, []);

  return {
    animations,
    handleAnimationComplete,
    triggerResourceAnimation,
  };
}

export default useResourceAnimations;
