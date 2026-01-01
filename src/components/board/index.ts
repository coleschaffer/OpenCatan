/**
 * Board components barrel export
 * SVG-based React components for the Catan hex board
 *
 * Components:
 * - GameBoard: Main interactive board container with build modes
 * - HexGrid: Core grid with zoom/pan
 * - HexTile: Individual hex terrain tile
 * - Vertex: Building placement intersection
 * - Edge: Road/ship placement edge
 * - Building: Settlement/City piece
 * - RoadPiece: Road segment piece
 * - Robber: Robber piece with animation
 * - NumberToken: Dice number chit on tiles
 */

// Main container components
export { default as GameBoard } from './GameBoard';
export type { BuildMode, GameBoardProps } from './GameBoard';

// Core grid components
export { default as HexGrid } from './HexGrid';
export { default as HexTile } from './HexTile';
export { default as Vertex } from './Vertex';
export { default as Edge } from './Edge';

// Piece components
export { default as Building } from './Building';
export { default as RoadPiece } from './RoadPiece';
export { default as KnightPiece } from './KnightPiece';
export { default as Robber } from './Robber';
export { default as NumberToken } from './NumberToken';
