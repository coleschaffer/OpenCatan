/**
 * useTradeRates Hook
 *
 * Calculates the best bank trade rates for a player based on their port access.
 * Ports are determined by settlements/cities placed on port vertices.
 *
 * Trade rates:
 * - Default: 4:1 (give 4 of one resource, receive 1 of another)
 * - Generic port (3:1): Any 3 resources for 1 of another
 * - Specialized port (2:1): 2 of a specific resource for 1 of another
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../game/state/store';
import type { ResourceType, Port, VertexCoord } from '../types';

/**
 * Bank trade rate type - can be 2:1, 3:1, or 4:1
 */
export type BankTradeRate = 2 | 3 | 4;

/**
 * Record of trade rates for each resource
 */
export type TradeRates = Record<ResourceType, BankTradeRate>;

/**
 * Return type for the useTradeRates hook
 */
export interface UseTradeRatesReturn {
  /** Best trade rate for each resource */
  rates: TradeRates;
  /** Ports the player has access to */
  accessiblePorts: Port[];
  /** Whether player has any port (better than 4:1) */
  hasAnyPort: boolean;
  /** Whether player has a generic 3:1 port */
  hasGenericPort: boolean;
  /** Get the rate for a specific resource */
  getRateForResource: (resource: ResourceType) => BankTradeRate;
}

/**
 * Helper to compare vertex coordinates
 */
function vertexCoordsEqual(a: VertexCoord, b: VertexCoord): boolean {
  return a.hex.q === b.hex.q && a.hex.r === b.hex.r && a.direction === b.direction;
}

/**
 * Hook to calculate bank trade rates based on player's port access
 *
 * @param playerId - The player to calculate rates for (defaults to local player)
 * @returns Trade rates and port information
 */
export function useTradeRates(playerId?: string): UseTradeRatesReturn {
  // Get local player ID from lobby state if not provided
  const localPlayerId = useSelector((state: RootState) => state.lobby.localPlayerId);
  const targetPlayerId = playerId ?? localPlayerId;

  // Get ports and buildings from state
  const ports = useSelector((state: RootState) => state.board.ports);
  const buildings = useSelector((state: RootState) => state.board.buildings);

  // Calculate rates based on player's port access
  const result = useMemo(() => {
    // Default rates (4:1 for all)
    const rates: TradeRates = {
      brick: 4,
      lumber: 4,
      ore: 4,
      grain: 4,
      wool: 4,
    };

    // If no player ID, return default rates
    if (!targetPlayerId) {
      return {
        rates,
        accessiblePorts: [] as Port[],
        hasAnyPort: false,
        hasGenericPort: false,
      };
    }

    // Get vertices where the player has buildings
    const playerBuildings = buildings.filter(b => b.playerId === targetPlayerId);
    const playerVertices = playerBuildings.map(b => b.vertex);

    // Find ports the player has access to
    const accessiblePorts: Port[] = [];

    for (const port of ports) {
      // Check if player has a building on any of this port's vertices
      const hasAccess = port.vertices?.some(portVertex =>
        playerVertices.some(playerVertex =>
          vertexCoordsEqual(portVertex, playerVertex)
        )
      );

      if (hasAccess) {
        accessiblePorts.push(port);

        if (port.type === 'generic') {
          // Generic 3:1 port - improves all resources to 3:1 (if currently 4:1)
          const resourceTypes: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];
          for (const resource of resourceTypes) {
            if (rates[resource] > 3) {
              rates[resource] = 3;
            }
          }
        } else {
          // Specialized 2:1 port - improves specific resource to 2:1
          const resourceType = port.type as ResourceType;
          if (rates[resourceType] > 2) {
            rates[resourceType] = 2;
          }
        }
      }
    }

    const hasAnyPort = accessiblePorts.length > 0;
    const hasGenericPort = accessiblePorts.some(p => p.type === 'generic');

    return {
      rates,
      accessiblePorts,
      hasAnyPort,
      hasGenericPort,
    };
  }, [targetPlayerId, ports, buildings]);

  // Create the getRateForResource helper function
  const getRateForResource = useMemo(() => {
    return (resource: ResourceType): BankTradeRate => {
      return result.rates[resource];
    };
  }, [result.rates]);

  return {
    ...result,
    getRateForResource,
  };
}

/**
 * Get default trade rates (4:1 for all resources)
 */
export function getDefaultTradeRates(): TradeRates {
  return {
    brick: 4,
    lumber: 4,
    ore: 4,
    grain: 4,
    wool: 4,
  };
}

export default useTradeRates;
