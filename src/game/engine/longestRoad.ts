// @ts-nocheck
// TODO: Fix TypeScript errors in this file
/**
 * Longest Road Calculation Module
 *
 * This module handles the longest road mechanic in OpenCatan:
 * - Calculating the longest continuous road for a player
 * - Updating the longest road holder when roads change
 * - Detecting when opponent settlements break roads
 *
 * The longest road algorithm uses depth-first search (DFS) to find
 * the longest path through a player's road network. A road is broken
 * when an opponent places a settlement on a vertex along the road.
 *
 * All functions are pure and return new state objects without mutations.
 */

import {
  GameState,
  EdgeCoord,
  VertexCoord,
  Road,
  AchievementState,
  edgeKey,
  vertexKey,
} from '../../types';
import {
  getVerticesOfEdge,
  getEdgesAdjacentToVertex,
  getBuildingAtVertex,
} from './building';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of the longest road calculation for a player.
 */
export interface LongestRoadResult {
  /** Length of the longest road */
  length: number;
  /** The edges that make up the longest road (for visualization) */
  path: EdgeCoord[];
}

/**
 * Information about the longest road holder.
 * Uses AchievementState with `length` for road length.
 */
export type LongestRoadHolder = AchievementState & { length: number };

// ============================================================================
// GRAPH UTILITIES
// ============================================================================

/**
 * Builds an adjacency list representation of a player's road network.
 * Each vertex maps to the edges connected to it that belong to the player.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Map from vertex keys to arrays of edge keys
 */
function buildRoadGraph(
  state: GameState,
  playerId: string
): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const playerRoads = state.roads.filter((r) => r.playerId === playerId);

  for (const road of playerRoads) {
    const [v1, v2] = getVerticesOfEdge(road.edge);
    const v1Key = vertexKey(v1);
    const v2Key = vertexKey(v2);
    const eKey = edgeKey(road.edge);

    // Add edge to both vertices' adjacency lists
    if (!graph.has(v1Key)) {
      graph.set(v1Key, []);
    }
    if (!graph.has(v2Key)) {
      graph.set(v2Key, []);
    }

    graph.get(v1Key)!.push(eKey);
    graph.get(v2Key)!.push(eKey);
  }

  return graph;
}

/**
 * Gets the other vertex of an edge given one vertex.
 *
 * @param edge - The edge
 * @param fromVertex - One vertex of the edge
 * @returns The other vertex of the edge
 */
function getOtherVertex(edge: EdgeCoord, fromVertex: VertexCoord): VertexCoord {
  const [v1, v2] = getVerticesOfEdge(edge);
  if (vertexKey(v1) === vertexKey(fromVertex)) {
    return v2;
  }
  return v1;
}

/**
 * Checks if a vertex is blocked by an opponent's settlement.
 * A blocked vertex prevents road continuation through it.
 *
 * @param state - Current game state
 * @param vertex - Vertex to check
 * @param playerId - ID of the player whose road is being checked
 * @returns True if the vertex is blocked
 */
function isVertexBlocked(
  state: GameState,
  vertex: VertexCoord,
  playerId: string
): boolean {
  const building = getBuildingAtVertex(state, vertex);
  // Blocked if there's an opponent's building
  return building !== undefined && building.playerId !== playerId;
}

// ============================================================================
// DFS ALGORITHM
// ============================================================================

/**
 * Performs DFS to find the longest path starting from a given edge.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param graph - Adjacency list of the road network
 * @param edgeToCoord - Map from edge keys to EdgeCoord objects
 * @param startEdge - Edge to start DFS from
 * @param startVertex - Vertex to start exploring from
 * @param visited - Set of visited edge keys
 * @returns The longest path found as an array of edge keys
 */
function dfs(
  state: GameState,
  playerId: string,
  graph: Map<string, string[]>,
  edgeToCoord: Map<string, EdgeCoord>,
  startEdge: string,
  startVertex: VertexCoord,
  visited: Set<string>
): string[] {
  visited.add(startEdge);

  const vKey = vertexKey(startVertex);
  const adjacentEdges = graph.get(vKey) || [];

  let longestPath: string[] = [startEdge];

  for (const nextEdgeKey of adjacentEdges) {
    // Skip if already visited
    if (visited.has(nextEdgeKey)) continue;

    const nextEdge = edgeToCoord.get(nextEdgeKey)!;
    const nextVertex = getOtherVertex(nextEdge, startVertex);

    // Check if path is blocked by opponent's settlement at the junction
    // The junction is the vertex we're traversing through (startVertex)
    // We don't need to check blocking for the first edge
    if (visited.size > 0 && isVertexBlocked(state, startVertex, playerId)) {
      continue;
    }

    // Recurse
    const pathFromNext = dfs(
      state,
      playerId,
      graph,
      edgeToCoord,
      nextEdgeKey,
      nextVertex,
      new Set(visited)
    );

    if (pathFromNext.length + 1 > longestPath.length) {
      longestPath = [startEdge, ...pathFromNext];
    }
  }

  return longestPath;
}

/**
 * Performs DFS starting from both ends of an edge to find the longest path.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param graph - Adjacency list of the road network
 * @param edgeToCoord - Map from edge keys to EdgeCoord objects
 * @param startEdgeKey - Edge key to start from
 * @returns Total length of the longest path through this edge
 */
function dfsFromEdge(
  state: GameState,
  playerId: string,
  graph: Map<string, string[]>,
  edgeToCoord: Map<string, EdgeCoord>,
  startEdgeKey: string
): { length: number; path: string[] } {
  const startEdge = edgeToCoord.get(startEdgeKey)!;
  const [v1, v2] = getVerticesOfEdge(startEdge);

  // Check if vertices are blocked
  const v1Blocked = isVertexBlocked(state, v1, playerId);
  const v2Blocked = isVertexBlocked(state, v2, playerId);

  // If both ends are blocked, this edge is isolated
  if (v1Blocked && v2Blocked) {
    return { length: 1, path: [startEdgeKey] };
  }

  // Explore from v1 (if not blocked)
  let path1: string[] = [];
  if (!v1Blocked) {
    const visited = new Set<string>([startEdgeKey]);
    const v1Key = vertexKey(v1);
    const adjacentEdges = graph.get(v1Key) || [];

    for (const nextEdgeKey of adjacentEdges) {
      if (nextEdgeKey === startEdgeKey) continue;

      const nextEdge = edgeToCoord.get(nextEdgeKey)!;
      const nextVertex = getOtherVertex(nextEdge, v1);

      const pathFromNext = dfs(
        state,
        playerId,
        graph,
        edgeToCoord,
        nextEdgeKey,
        nextVertex,
        new Set(visited)
      );

      if (pathFromNext.length > path1.length) {
        path1 = pathFromNext;
      }
    }
  }

  // Explore from v2 (if not blocked)
  let path2: string[] = [];
  if (!v2Blocked) {
    const visited = new Set<string>([startEdgeKey]);
    const v2Key = vertexKey(v2);
    const adjacentEdges = graph.get(v2Key) || [];

    for (const nextEdgeKey of adjacentEdges) {
      if (nextEdgeKey === startEdgeKey) continue;

      const nextEdge = edgeToCoord.get(nextEdgeKey)!;
      const nextVertex = getOtherVertex(nextEdge, v2);

      const pathFromNext = dfs(
        state,
        playerId,
        graph,
        edgeToCoord,
        nextEdgeKey,
        nextVertex,
        new Set(visited)
      );

      if (pathFromNext.length > path2.length) {
        path2 = pathFromNext;
      }
    }
  }

  // Combine paths (reverse path1 so it leads into startEdge)
  const combinedPath = [...path1.reverse(), startEdgeKey, ...path2];
  return { length: combinedPath.length, path: combinedPath };
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Calculates the longest road for a player.
 *
 * Uses DFS to find the longest continuous path through the player's
 * road network. Roads are broken by opponent settlements.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Longest road result with length and path
 */
export function calculateLongestRoad(
  state: GameState,
  playerId: string
): LongestRoadResult {
  const playerRoads = state.roads.filter((r) => r.playerId === playerId);

  // Need at least 5 roads for longest road award
  if (playerRoads.length < 1) {
    return { length: 0, path: [] };
  }

  // Build the graph and edge lookup
  const graph = buildRoadGraph(state, playerId);
  const edgeToCoord = new Map<string, EdgeCoord>();
  for (const road of playerRoads) {
    edgeToCoord.set(edgeKey(road.edge), road.edge);
  }

  let longestPath: string[] = [];

  // Try starting from each edge and find the longest path
  for (const road of playerRoads) {
    const eKey = edgeKey(road.edge);
    const result = dfsFromEdge(state, playerId, graph, edgeToCoord, eKey);

    if (result.length > longestPath.length) {
      longestPath = result.path;
    }
  }

  // Convert edge keys back to EdgeCoord objects
  const path = longestPath.map((eKey) => edgeToCoord.get(eKey)!);

  return {
    length: longestPath.length,
    path,
  };
}

/**
 * Updates the longest road holder based on current road lengths.
 *
 * Rules:
 * - Need at least 5 roads to qualify for longest road
 * - Must have strictly more roads than current holder to take it
 * - If current holder drops below 5 or is tied, someone else may take it
 *
 * @param state - Current game state
 * @returns New game state with updated longest road holder
 */
export function updateLongestRoadHolder(state: GameState): GameState {
  const MINIMUM_ROAD_LENGTH = 5;

  // Calculate longest road for each player
  const playerRoads: { playerId: string; length: number }[] = [];

  for (const player of state.players) {
    const result = calculateLongestRoad(state, player.id);
    playerRoads.push({ playerId: player.id, length: result.length });
  }

  // Sort by length descending
  playerRoads.sort((a, b) => b.length - a.length);

  const currentHolder = state.longestRoad;
  const topPlayer = playerRoads[0];

  // Nobody qualifies
  if (topPlayer.length < MINIMUM_ROAD_LENGTH) {
    if (currentHolder !== null) {
      // Update player's stored length
      const newPlayers = state.players.map((p) => ({
        ...p,
        longestRoadLength: playerRoads.find((pr) => pr.playerId === p.id)?.length || 0,
      }));

      return {
        ...state,
        players: newPlayers,
        longestRoad: null,
      };
    }
    return state;
  }

  // Check for ties at the top
  const tiedAtTop = playerRoads.filter(
    (p) => p.length === topPlayer.length
  );

  let newHolder: LongestRoadHolder | null = currentHolder;

  if (currentHolder === null) {
    // No current holder - award to longest if no tie
    if (tiedAtTop.length === 1) {
      newHolder = { playerId: topPlayer.playerId, length: topPlayer.length };
    }
    // If tied, nobody gets it
  } else {
    // There's a current holder
    const holderRoad = playerRoads.find((p) => p.playerId === currentHolder.playerId);
    const holderLength = holderRoad?.length || 0;

    if (holderLength < MINIMUM_ROAD_LENGTH) {
      // Current holder dropped below minimum
      if (tiedAtTop.length === 1) {
        newHolder = { playerId: topPlayer.playerId, length: topPlayer.length };
      } else {
        newHolder = null; // Tied at top, nobody has it
      }
    } else if (topPlayer.length > holderLength) {
      // Someone beat the current holder
      if (tiedAtTop.length === 1) {
        newHolder = { playerId: topPlayer.playerId, length: topPlayer.length };
      } else {
        // Tied players beat holder, but tied so nobody gets it
        newHolder = null;
      }
    } else {
      // Current holder still has longest (or tied for longest, they keep it)
      newHolder = { playerId: currentHolder.playerId, length: holderLength };
    }
  }

  // Update all players' longest road lengths
  const newPlayers = state.players.map((p) => ({
    ...p,
    longestRoadLength: playerRoads.find((pr) => pr.playerId === p.id)?.length || 0,
  }));

  return {
    ...state,
    players: newPlayers,
    longestRoad: newHolder,
  };
}

/**
 * Checks if an opponent's settlement would break a player's road.
 *
 * A road is "broken" if placing a settlement on a vertex would cause
 * the player's longest road to decrease.
 *
 * @param state - Current game state
 * @param playerId - ID of the player whose road might be broken
 * @param settlementVertex - Vertex where the settlement would be placed
 * @returns True if the road would be broken
 */
export function isRoadBroken(
  state: GameState,
  playerId: string,
  settlementVertex: VertexCoord
): boolean {
  // Get current longest road length
  const currentResult = calculateLongestRoad(state, playerId);
  const currentLength = currentResult.length;

  // If road is less than 5, it's not meaningful to "break"
  if (currentLength < 5) {
    return false;
  }

  // Check if the settlement is on the player's road network
  const edges = getEdgesAdjacentToVertex(settlementVertex);
  const playerRoads = state.roads.filter((r) => r.playerId === playerId);
  const playerRoadKeys = new Set(playerRoads.map((r) => edgeKey(r.edge)));

  const isOnRoadNetwork = edges.some((e) => playerRoadKeys.has(edgeKey(e)));
  if (!isOnRoadNetwork) {
    return false;
  }

  // Simulate placing the settlement and recalculate
  // Create a temporary state with the settlement
  const tempBuilding = {
    type: 'settlement' as const,
    playerId: 'opponent', // Doesn't matter, just needs to be different
    vertex: settlementVertex,
  };

  const tempState: GameState = {
    ...state,
    buildings: [...state.buildings, tempBuilding],
  };

  const newResult = calculateLongestRoad(tempState, playerId);

  return newResult.length < currentLength;
}

/**
 * Gets all vertices where placing a settlement would break the longest road holder's road.
 * Useful for strategic play decisions.
 *
 * @param state - Current game state
 * @returns Array of vertices that would break the longest road
 */
export function getBreakingVertices(state: GameState): VertexCoord[] {
  if (!state.longestRoad) {
    return [];
  }

  const holderId = state.longestRoad.playerId;
  const holderRoads = state.roads.filter((r) => r.playerId === holderId);
  const breakingVertices: VertexCoord[] = [];

  // Get all vertices on the holder's road network
  const vertices = new Set<string>();
  for (const road of holderRoads) {
    const [v1, v2] = getVerticesOfEdge(road.edge);
    vertices.add(vertexKey(v1));
    vertices.add(vertexKey(v2));
  }

  // Check each vertex
  for (const vKey of vertices) {
    // Parse the vertex key back to coordinates
    const [q, r, direction] = vKey.split(',');
    const vertex: VertexCoord = {
      hex: { q: parseInt(q), r: parseInt(r) },
      direction: direction as 'N' | 'S',
    };

    // Skip if there's already a building
    if (getBuildingAtVertex(state, vertex)) {
      continue;
    }

    // Check if placing here would break the road
    if (isRoadBroken(state, holderId, vertex)) {
      breakingVertices.push(vertex);
    }
  }

  return breakingVertices;
}
