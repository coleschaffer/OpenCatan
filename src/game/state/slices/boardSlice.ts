/**
 * Board Slice - Board state management for OpenCatan
 *
 * Manages:
 * - Hex tiles and terrain
 * - Buildings (settlements, cities)
 * - Roads and ships
 * - Ports
 * - Robber and pirate positions
 * - Knights (C&K)
 * - Merchant (C&K)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  HexCoord,
  VertexCoord,
  EdgeCoord,
  HexTile,
  TerrainType,
  Building,
  Road,
  Port,
  Knight,
  MerchantState,
  MetropolisType,
  hexEquals,
  vertexEquals,
  edgeEquals,
} from '@/types';

/**
 * Board slice state
 */
export interface BoardSliceState {
  /** All hex tiles on the board */
  tiles: HexTile[];

  /** All buildings (settlements and cities) */
  buildings: Building[];

  /** All roads and ships */
  roads: Road[];

  /** All ports on the board */
  ports: Port[];

  /** All knights on the board (C&K) */
  knights: Knight[];

  /** Current robber location */
  robberLocation: HexCoord;

  /** Current pirate location (Seafarers) */
  pirateLocation: HexCoord | null;

  /** Merchant piece state (C&K) */
  merchantLocation: MerchantState | null;
}

const initialState: BoardSliceState = {
  tiles: [],
  buildings: [],
  roads: [],
  ports: [],
  knights: [],
  robberLocation: { q: 0, r: 0 },
  pirateLocation: null,
  merchantLocation: null,
};

// Helper functions for coordinate comparison
const hexCoordsEqual = (a: HexCoord, b: HexCoord): boolean =>
  a.q === b.q && a.r === b.r;

const vertexCoordsEqual = (a: VertexCoord, b: VertexCoord): boolean =>
  hexCoordsEqual(a.hex, b.hex) && a.direction === b.direction;

const edgeCoordsEqual = (a: EdgeCoord, b: EdgeCoord): boolean =>
  hexCoordsEqual(a.hex, b.hex) && a.direction === b.direction;

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    /**
     * Set all tiles (used during board generation)
     */
    setTiles: (state, action: PayloadAction<HexTile[]>) => {
      state.tiles = action.payload;
      // Find initial robber location (desert tile)
      const desertTile = action.payload.find((t) => t.terrain === 'desert');
      if (desertTile) {
        state.robberLocation = desertTile.coord;
      }
    },

    /**
     * Update a single tile (e.g., reveal fog)
     */
    updateTile: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<HexTile> }>
    ) => {
      const tile = state.tiles.find((t) => t.id === action.payload.id);
      if (tile) {
        Object.assign(tile, action.payload.updates);
      }
    },

    /**
     * Set all ports
     */
    setPorts: (state, action: PayloadAction<Port[]>) => {
      state.ports = action.payload;
    },

    /**
     * Add a building to the board
     */
    placeBuilding: (state, action: PayloadAction<Building>) => {
      state.buildings.push(action.payload);
    },

    /**
     * Upgrade a settlement to a city
     */
    upgradeToCity: (state, action: PayloadAction<string>) => {
      const building = state.buildings.find((b) => b.id === action.payload);
      if (building && building.type === 'settlement') {
        building.type = 'city';
      }
    },

    /**
     * Add city wall to a city (C&K)
     */
    addCityWall: (state, action: PayloadAction<string>) => {
      const building = state.buildings.find((b) => b.id === action.payload);
      if (building && building.type === 'city') {
        building.hasWall = true;
      }
    },

    /**
     * Set metropolis on a city (C&K)
     */
    setMetropolis: (
      state,
      action: PayloadAction<{ buildingId: string; type: MetropolisType }>
    ) => {
      // Remove metropolis from any existing city of this type
      state.buildings.forEach((b) => {
        if (b.hasMetropolis === action.payload.type) {
          b.hasMetropolis = undefined;
        }
      });
      // Add to new city
      const building = state.buildings.find(
        (b) => b.id === action.payload.buildingId
      );
      if (building && building.type === 'city') {
        building.hasMetropolis = action.payload.type;
      }
    },

    /**
     * Pillage a city back to settlement (barbarian attack - C&K)
     */
    pillageCity: (state, action: PayloadAction<string>) => {
      const building = state.buildings.find((b) => b.id === action.payload);
      if (building && building.type === 'city') {
        building.type = 'settlement';
        building.hasWall = false;
        building.hasMetropolis = undefined;
      }
    },

    /**
     * Remove a building (rarely used)
     */
    removeBuilding: (state, action: PayloadAction<string>) => {
      state.buildings = state.buildings.filter((b) => b.id !== action.payload);
    },

    /**
     * Add a road or ship to the board
     */
    placeRoad: (state, action: PayloadAction<Road>) => {
      state.roads.push(action.payload);
    },

    /**
     * Move a ship (Seafarers - can move open-ended ships)
     */
    moveShip: (
      state,
      action: PayloadAction<{ id: string; newEdge: EdgeCoord }>
    ) => {
      const road = state.roads.find((r) => r.id === action.payload.id);
      if (road && road.type === 'ship') {
        road.edge = action.payload.newEdge;
      }
    },

    /**
     * Remove a road/ship (rarely used)
     */
    removeRoad: (state, action: PayloadAction<string>) => {
      state.roads = state.roads.filter((r) => r.id !== action.payload);
    },

    /**
     * Move the robber to a new hex
     */
    moveRobber: (state, action: PayloadAction<HexCoord>) => {
      // Clear robber from old location
      const oldTile = state.tiles.find((t) =>
        hexCoordsEqual(t.coord, state.robberLocation)
      );
      if (oldTile) {
        oldTile.hasRobber = false;
      }

      // Set robber at new location
      state.robberLocation = action.payload;
      const newTile = state.tiles.find((t) =>
        hexCoordsEqual(t.coord, action.payload)
      );
      if (newTile) {
        newTile.hasRobber = true;
      }
    },

    /**
     * Move the pirate to a new hex (Seafarers)
     */
    movePirate: (state, action: PayloadAction<HexCoord>) => {
      // Clear pirate from old location
      if (state.pirateLocation) {
        const oldTile = state.tiles.find((t) =>
          hexCoordsEqual(t.coord, state.pirateLocation!)
        );
        if (oldTile) {
          oldTile.hasPirate = false;
        }
      }

      // Set pirate at new location
      state.pirateLocation = action.payload;
      const newTile = state.tiles.find((t) =>
        hexCoordsEqual(t.coord, action.payload)
      );
      if (newTile) {
        newTile.hasPirate = true;
      }
    },

    /**
     * Set the merchant location (C&K)
     */
    setMerchant: (state, action: PayloadAction<MerchantState | null>) => {
      state.merchantLocation = action.payload;
    },

    /**
     * Add a knight to the board (C&K)
     */
    placeKnight: (state, action: PayloadAction<Knight>) => {
      state.knights.push(action.payload);
    },

    /**
     * Update knight state (activate, upgrade, etc.) (C&K)
     */
    updateKnight: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Knight> }>
    ) => {
      const knight = state.knights.find((k) => k.id === action.payload.id);
      if (knight) {
        Object.assign(knight, action.payload.updates);
      }
    },

    /**
     * Move a knight to a new vertex (C&K)
     */
    moveKnight: (
      state,
      action: PayloadAction<{ id: string; newVertex: VertexCoord }>
    ) => {
      const knight = state.knights.find((k) => k.id === action.payload.id);
      if (knight) {
        knight.vertex = action.payload.newVertex;
        knight.hasActedThisTurn = true;
      }
    },

    /**
     * Remove a knight from the board (C&K - displaced)
     */
    removeKnight: (state, action: PayloadAction<string>) => {
      state.knights = state.knights.filter((k) => k.id !== action.payload);
    },

    /**
     * Deactivate all knights (after barbarian attack - C&K)
     */
    deactivateAllKnights: (state) => {
      state.knights.forEach((k) => {
        k.isActive = false;
      });
    },

    /**
     * Reset knight turn flags (at start of turn)
     */
    resetKnightTurnFlags: (state) => {
      state.knights.forEach((k) => {
        k.wasActivatedThisTurn = false;
        k.hasActedThisTurn = false;
      });
    },

    /**
     * Reveal a fog tile (Seafarers)
     */
    revealFogTile: (
      state,
      action: PayloadAction<{
        id: string;
        terrain: TerrainType;
        number: number | undefined;
      }>
    ) => {
      const tile = state.tiles.find((t) => t.id === action.payload.id);
      if (tile && tile.isFog) {
        tile.isFog = false;
        tile.terrain = action.payload.terrain;
        tile.number = action.payload.number;
        tile.revealedTerrain = action.payload.terrain;
        tile.revealedNumber = action.payload.number;
      }
    },

    /**
     * Sync board state (from host)
     */
    syncBoard: (state, action: PayloadAction<BoardSliceState>) => {
      return action.payload;
    },

    /**
     * Reset board state
     */
    resetBoard: () => initialState,
  },
});

// Export actions
export const {
  setTiles,
  updateTile,
  setPorts,
  placeBuilding,
  upgradeToCity,
  addCityWall,
  setMetropolis,
  pillageCity,
  removeBuilding,
  placeRoad,
  moveShip,
  removeRoad,
  moveRobber,
  movePirate,
  setMerchant,
  placeKnight,
  updateKnight,
  moveKnight,
  removeKnight,
  deactivateAllKnights,
  resetKnightTurnFlags,
  revealFogTile,
  syncBoard,
  resetBoard,
} = boardSlice.actions;

// Selectors
export const selectTiles = (state: RootState) => state.board.tiles;
export const selectBuildings = (state: RootState) => state.board.buildings;
export const selectRoads = (state: RootState) => state.board.roads;
export const selectPorts = (state: RootState) => state.board.ports;
export const selectKnights = (state: RootState) => state.board.knights;
export const selectRobberLocation = (state: RootState) =>
  state.board.robberLocation;
export const selectPirateLocation = (state: RootState) =>
  state.board.pirateLocation;
export const selectMerchantLocation = (state: RootState) =>
  state.board.merchantLocation;

/**
 * Get tile at specific hex coordinate
 */
export const selectTileAt = (state: RootState, coord: HexCoord) =>
  state.board.tiles.find((t) => hexCoordsEqual(t.coord, coord));

/**
 * Get building at specific vertex
 */
export const selectBuildingAt = (state: RootState, vertex: VertexCoord) =>
  state.board.buildings.find((b) => vertexCoordsEqual(b.vertex, vertex));

/**
 * Get road at specific edge
 */
export const selectRoadAt = (state: RootState, edge: EdgeCoord) =>
  state.board.roads.find((r) => edgeCoordsEqual(r.edge, edge));

/**
 * Get all roads/ships for a specific player
 */
export const selectRoadsForPlayer = (state: RootState, playerId: string) =>
  state.board.roads.filter((r) => r.playerId === playerId);

/**
 * Get all buildings for a specific player
 */
export const selectBuildingsForPlayer = (state: RootState, playerId: string) =>
  state.board.buildings.filter((b) => b.playerId === playerId);

/**
 * Get settlements for a specific player
 */
export const selectSettlementsForPlayer = (
  state: RootState,
  playerId: string
) =>
  state.board.buildings.filter(
    (b) => b.playerId === playerId && b.type === 'settlement'
  );

/**
 * Get cities for a specific player
 */
export const selectCitiesForPlayer = (state: RootState, playerId: string) =>
  state.board.buildings.filter(
    (b) => b.playerId === playerId && b.type === 'city'
  );

/**
 * Get all knights for a specific player (C&K)
 */
export const selectKnightsForPlayer = (state: RootState, playerId: string) =>
  state.board.knights.filter((k) => k.playerId === playerId);

/**
 * Get all active knights for a specific player (C&K)
 */
export const selectActiveKnightsForPlayer = (
  state: RootState,
  playerId: string
) => state.board.knights.filter((k) => k.playerId === playerId && k.isActive);

/**
 * Get tiles with a specific number token (excluding robber)
 */
export const selectTilesWithNumber = (state: RootState, number: number) =>
  state.board.tiles.filter((t) => t.number === number && !t.hasRobber);

/**
 * Get knight at specific vertex (C&K)
 */
export const selectKnightAt = (state: RootState, vertex: VertexCoord) =>
  state.board.knights.find((k) => vertexCoordsEqual(k.vertex, vertex));

/**
 * Get total knight strength for a player (C&K)
 */
export const selectPlayerKnightStrength = (
  state: RootState,
  playerId: string
) => {
  const knights = state.board.knights.filter(
    (k) => k.playerId === playerId && k.isActive
  );
  return knights.reduce((sum, k) => sum + k.level, 0);
};

/**
 * Get all ports a player has access to (based on buildings)
 */
export const selectPlayerPorts = (state: RootState, playerId: string) => {
  const playerBuildings = state.board.buildings.filter(
    (b) => b.playerId === playerId
  );
  const accessiblePorts: Port[] = [];

  for (const port of state.board.ports) {
    const hasAccess = port.vertices.some((portVertex) =>
      playerBuildings.some((building) =>
        vertexCoordsEqual(building.vertex, portVertex)
      )
    );
    if (hasAccess) {
      accessiblePorts.push(port);
    }
  }

  return accessiblePorts;
};

/**
 * Check if a vertex is occupied by a building
 */
export const selectIsVertexOccupied = (
  state: RootState,
  vertex: VertexCoord
) => state.board.buildings.some((b) => vertexCoordsEqual(b.vertex, vertex));

/**
 * Check if an edge is occupied by a road
 */
export const selectIsEdgeOccupied = (state: RootState, edge: EdgeCoord) =>
  state.board.roads.some((r) => edgeCoordsEqual(r.edge, edge));

export default boardSlice.reducer;
