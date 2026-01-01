/**
 * OpenCatan Utility Functions
 *
 * This module exports all hex grid coordinate utilities for the game.
 *
 * @module utils
 */

// ============================================================
// Hex Math Utilities (hexMath.ts)
// ============================================================
export {
  // Constants
  HEX_SIZE,

  // Types
  type HexCoord as HexCoordMath,
  type PixelCoord as PixelCoordMath,
  type VertexCoord as VertexCoordMath,
  type EdgeCoord as EdgeCoordMath,

  // Hex <-> Pixel conversion
  hexToPixel,
  hexCoordToPixel,
  pixelToHex,

  // Hex corners
  getHexCorners as getHexCornersString,
  getHexCornersArray,

  // Vertex positions
  getVertexPosition,
  vertexToPixel as vertexToPixelMath,

  // Edge positions
  getEdgePosition,
  edgeToPixel as edgeToPixelMath,
  getEdgeRotation as getEdgeRotationMath,

  // Neighbors
  getNeighbors,
  getHexNeighbors as getHexNeighborsMath,
  getNeighborInDirection,

  // Adjacent vertices/edges
  getAdjacentVertices as getAdjacentVerticesMath,
  getVertexEdges as getVertexEdgesMath,

  // Distance
  hexDistance,

  // Keys
  hexKey,
  vertexKey as vertexKeyMath,
  edgeKey as edgeKeyMath,

  // Equality
  hexEquals as hexEqualsMath,
  vertexEquals as vertexEqualsMath,
  edgeEquals as edgeEqualsMath,

  // Board generation helpers
  getHexesInRadius as getHexesInRadiusMath,
  generateStandardBoardHexes,
  generateExpandedBoardHexes,
  getHexVertices as getHexVerticesMath,
  getHexEdges as getHexEdgesMath,
  collectAllVertices,
  collectAllEdges,
  calculateBoardBounds,
} from './hexMath';

// ============================================================
// Board Generator Utilities (boardGenerator.ts)
// ============================================================
export {
  // Types
  type TerrainType as TerrainTypeGen,
  type BoardHexTile,
  type TileDistribution,
  type NumberDistribution,

  // Distributions
  STANDARD_TILE_DISTRIBUTION,
  EXPANDED_TILE_DISTRIBUTION,
  STANDARD_NUMBER_DISTRIBUTION,
  EXPANDED_NUMBER_DISTRIBUTION,

  // Probability helpers
  getNumberDots,
  isRedNumber,

  // Array creation
  createTerrainArray,
  createNumberArray,
  shuffle,

  // Validation
  isValidNumberPlacement,
  hasNoAdjacentSameNumbers,

  // Number token placement
  placeNumberTokens,

  // Board generation
  createBoardTiles as createBoardTilesGen,
  generateBaseBoard,
  generateExpandedBoard,
  generateBoard,
  generateBeginnerBoard,

  // Utility functions
  getTerrainResource,
  getTerrainColor,
  findDesertTiles,
  findRobberTile,
  moveRobber as moveRobberGen,
  getTilesForRoll,
  getTileProductionValue,
} from './boardGenerator';

// ============================================================
// Core hex utilities (hex.ts) - Original implementations
// ============================================================
export {
  // Types
  type HexCoord,
  type PixelCoord,
  type VertexCoord,
  type EdgeCoord,

  // Hex coordinate functions
  axialToPixel,
  pixelToAxial,
  getHexNeighbors,
  getHexNeighbor,
  getHexDistance,
  hexEquals,
  areHexesAdjacent,
  hexToString,
  stringToHex,
  addHex,
  subtractHex,
  scaleHex,
  getHexesInRadius,
  getHexRing,

  // Vertex functions (from hex.ts)
  vertexToPixel,
  vertexKey,
  getHexVertices,
  getVertexEdges,
  vertexEquals,

  // Edge functions (from hex.ts)
  edgeToPixel,
  edgeKey,
  getHexEdges,
  getEdgeVertices,
  getEdgeRotation,
  edgeEquals,

  // Rendering helpers
  getHexCorners,
  getHexPolygonPoints,
  generateStandardBoard,
} from './hex';

// Vertex utilities
export {
  type VertexDirection,
  getVertexPixelPosition,
  getAdjacentHexes as getVertexAdjacentHexes,
  getAdjacentVertices,
  getAdjacentEdges as getVertexAdjacentEdges,
  vertexToString,
  stringToVertex,
  verticesEqual,
  normalizeVertex,
  getAllBoardVertices,
  isVertexOnBoardEdge,
  getVertexDistance,
  areVerticesTooClose,
} from './vertex';

// Edge utilities
export {
  type EdgeDirection,
  getEdgePixelPosition,
  getEdgeEndpoints,
  getAdjacentEdges,
  getAdjacentHexes as getEdgeAdjacentHexes,
  edgeToString,
  stringToEdge,
  edgesEqual,
  normalizeEdge,
  getAllBoardEdges,
  isEdgeOnBoardPerimeter,
  getBoardPerimeterEdges,
  edgeConnectsToVertex,
  edgesAreConnected,
  getSharedVertex,
  getPathLength,
  isValidPath,
} from './edge';

// Board utilities
export {
  type TerrainType as TerrainTypeBoard,
  type BoardTile,
  type TileDistribution as TileDistributionBoard,
  type NumberDistribution as NumberDistributionBoard,
  type PortType,
  type Port,
  generateHexGrid,
  getStandardTileDistribution,
  getExpandedTileDistribution,
  getStandardNumberDistribution,
  createTerrainArray as createTerrainArrayBoard,
  createNumberArray as createNumberArrayBoard,
  shuffleTiles,
  isValidNumberPlacement as isValidNumberPlacementBoard,
  assignNumberTokens,
  createBoardTiles,
  generateRandomBoard,
  getNumberDots as getNumberDotsBoard,
  isRedNumber as isRedNumberBoard,
  getProductionValue,
  calculateVertexProductionValue,
  getAdjacentTiles,
  getTilesByTerrain,
  getTilesByNumber,
  getRobberTile,
  moveRobber,
  getStandardPortDistribution,
} from './board';
