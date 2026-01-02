import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../game/state/store';
import type { ResourceType, ResourceCounts } from '../types/common';
import type { HexCoord } from '../types';
import type { ResourceAnimationData } from '../components/animations/ResourceAnimation';
import { TERRAIN_RESOURCE_MAP } from '../types';
import { hexToPixel, HEX_SIZE } from '../utils/hexMath';

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
 * Get the screen position of a hex tile relative to the board container
 */
function getHexScreenPosition(hexCoord: HexCoord, hexSize: number = HEX_SIZE): { x: number; y: number } {
  // Get the board container element
  const boardContainer = document.querySelector('[class*="boardContainer"]');
  if (!boardContainer) {
    // Fallback to center of screen
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  const rect = boardContainer.getBoundingClientRect();

  // Convert hex coord to pixel position in SVG space
  const hexPixel = hexToPixel(hexCoord.q, hexCoord.r, hexSize);

  // The SVG viewBox centers at 0,0 and the board is centered in the container
  // So we need to map from SVG coordinates to screen coordinates
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Scale factor: estimate based on typical viewBox vs container size
  // The viewBox is typically around 600 units wide for a standard board
  const scale = Math.min(rect.width, rect.height) / 600;

  return {
    x: centerX + hexPixel.x * scale,
    y: centerY + hexPixel.y * scale,
  };
}

/**
 * Hook for managing resource card animations
 * Detects when players receive resources and triggers animations
 * Animates cards from the producing tiles on the board
 */
export function useResourceAnimations() {
  const [animations, setAnimations] = useState<ResourceAnimationData[]>([]);
  const players = useSelector((state: RootState) => state.players.players) || [];
  const localPlayerId = useSelector((state: RootState) => state.lobby.localPlayerId);
  const tiles = useSelector((state: RootState) => state.board.tiles) || [];
  const buildings = useSelector((state: RootState) => state.board.buildings) || [];
  const lastRoll = useSelector((state: RootState) => state.game.lastRoll);

  // Track previous resource counts to detect changes
  const prevResourcesRef = useRef<Record<string, ResourceCounts>>({});
  const prevRollRef = useRef<number | null>(null);

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

  /**
   * Find producing tiles for a player based on their buildings and the dice roll
   */
  const getProducingTilesForPlayer = useCallback((
    playerId: string,
    roll: number,
    resourceType: ResourceType
  ): HexCoord[] => {
    const producingHexes: HexCoord[] = [];

    // Find tiles that match the roll and produce this resource
    for (const tile of tiles) {
      if (tile.number !== roll) continue;
      if (tile.hasRobber) continue;

      const tileResource = TERRAIN_RESOURCE_MAP[tile.terrain];
      if (tileResource !== resourceType) continue;

      // Check if player has a building adjacent to this tile
      const playerBuildings = buildings.filter(b => b.playerId === playerId);
      for (const building of playerBuildings) {
        // Check if this building is adjacent to the tile
        // Buildings are on vertices, tiles are hexes
        // A vertex touches a hex if the vertex's hex coord matches or is adjacent
        const bHex = building.vertex.hex;
        const tHex = tile.coord;

        // Check if vertex is on this hex (simplified check)
        const isAdjacent =
          (bHex.q === tHex.q && bHex.r === tHex.r) ||
          (bHex.q === tHex.q + 1 && bHex.r === tHex.r - 1) ||
          (bHex.q === tHex.q && bHex.r === tHex.r - 1) ||
          (bHex.q === tHex.q - 1 && bHex.r === tHex.r) ||
          (bHex.q === tHex.q - 1 && bHex.r === tHex.r + 1) ||
          (bHex.q === tHex.q && bHex.r === tHex.r + 1);

        if (isAdjacent && !producingHexes.some(h => h.q === tHex.q && h.r === tHex.r)) {
          producingHexes.push(tHex);
        }
      }
    }

    return producingHexes;
  }, [tiles, buildings]);

  // Trigger animations for resource gains
  const triggerResourceAnimation = useCallback((
    playerId: string,
    resources: Partial<ResourceCounts>,
    playerColor: string,
    diceRoll: number | null
  ) => {
    const playerPos = getPlayerPosition(playerId);

    const newAnimations: ResourceAnimationData[] = [];
    let delay = 0;

    // Create an animation for each resource card
    for (const [resource, count] of Object.entries(resources)) {
      if (count && count > 0) {
        // Find the producing tiles for this resource
        const producingTiles = diceRoll
          ? getProducingTilesForPlayer(playerId, diceRoll, resource as ResourceType)
          : [];

        for (let i = 0; i < count; i++) {
          // Get the source position - from a producing tile if available
          let fromPos: { x: number; y: number };

          if (producingTiles.length > 0) {
            // Pick a producing tile (cycle through if multiple)
            const tileIndex = i % producingTiles.length;
            const tile = producingTiles[tileIndex];
            fromPos = getHexScreenPosition(tile);
            // Add some randomness
            fromPos.x += (Math.random() - 0.5) * 30;
            fromPos.y += (Math.random() - 0.5) * 30;
          } else {
            // Fallback: animate from center of board
            const boardContainer = document.querySelector('[class*="boardContainer"]');
            if (boardContainer) {
              const rect = boardContainer.getBoundingClientRect();
              fromPos = {
                x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 100,
                y: rect.top + rect.height / 2 + (Math.random() - 0.5) * 100,
              };
            } else {
              fromPos = {
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
                y: window.innerHeight / 3 + (Math.random() - 0.5) * 50,
              };
            }
          }

          newAnimations.push({
            id: `${playerId}-${resource}-${Date.now()}-${delay}`,
            resource: resource as ResourceType,
            playerId,
            playerColor: PLAYER_COLORS[playerColor] || playerColor,
            fromPosition: fromPos,
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
  }, [getPlayerPosition, getProducingTilesForPlayer]);

  // Handle animation completion
  const handleAnimationComplete = useCallback((id: string) => {
    setAnimations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Detect resource changes and trigger animations
  useEffect(() => {
    // Get the current dice roll total
    const currentRoll = lastRoll?.total ?? null;

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
          triggerResourceAnimation(player.id, gained, player.color, currentRoll);
        }
      }

      // Update ref
      prevResourcesRef.current[player.id] = { ...currentResources };
    }

    prevRollRef.current = currentRoll;
  }, [players, lastRoll, triggerResourceAnimation]);

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
