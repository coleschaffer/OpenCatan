/**
 * Game Engine Index
 *
 * This file exports all game engine functions for OpenCatan.
 * Import from this file to access the complete game engine API.
 *
 * @example
 * import {
 *   initializeGame,
 *   processAction,
 *   checkVictory,
 *   rollDice,
 *   // ... etc
 * } from '@/game/engine';
 */

// ============================================================================
// GAME ENGINE - Main entry points
// ============================================================================
export {
  initializeGame,
  processAction,
  checkVictory,
  calculateVictoryPoints,
  type ActionResult,
  type VictoryResult,
} from './gameEngine';

// ============================================================================
// TURN MANAGER - Turn and phase management
// ============================================================================
export {
  getValidActions,
  advancePhase,
  nextTurn,
  getSetupOrder,
  advanceSetup,
  hasResources,
  canPlayDevCard as canPlayDevCardTurn,
  type ValidAction,
} from './turnManager';

// ============================================================================
// DICE ROLLER - Dice rolling and resource production
// ============================================================================
export {
  rollDice,
  rollDiceSeeded,
  getResourcesForRoll,
  getProducingTiles,
  getRollProbability,
  getNumberDots,
  isHighValueNumber,
  toDiceRoll,
  type DiceRollResult,
} from './diceRoller';

// ============================================================================
// RESOURCE MANAGER - Resource distribution and management
// ============================================================================
export {
  distributeResources,
  canAfford,
  deductResources,
  addResources,
  getPlayersWhoMustDiscard,
  getDiscardAmount,
  processDiscard,
  getTotalResourceCount,
  singleResource,
  mergeResourceCounts,
  isResourcesEmpty,
  type DistributionResult,
} from './resourceManager';

// ============================================================================
// BUILDING MANAGER - Building placement and validation
// ============================================================================
export {
  getValidRoadPlacements,
  getValidSettlementPlacements,
  getValidCityPlacements,
  isValidRoadPlacement,
  isValidSettlementPlacement,
  isValidCityPlacement,
  placeRoad,
  placeSettlement,
  placeCity,
  getPlayerBuildings,
  getPlayerRoads,
  countSettlements,
  countCities,
  countRoads,
  BUILDING_COSTS,
} from './buildingManager';

// ============================================================================
// LONGEST ROAD - Longest road calculation
// ============================================================================
export {
  calculateLongestRoad,
  updateLongestRoadHolder,
  isRoadBroken,
  getBreakingVertices,
  type LongestRoadResult,
  type LongestRoadHolder,
} from './longestRoad';

// ============================================================================
// ROBBER MANAGER - Robber mechanics
// ============================================================================
export {
  getValidRobberPlacements,
  moveRobber,
  getStealTargets,
  stealCard,
  hasRobber,
  getRobberLocation,
  getValidPiratePlacements,
  movePirate,
  type StealResult,
} from './robberManager';

// ============================================================================
// DEV CARD MANAGER - Development cards
// ============================================================================
export {
  createDevelopmentDeck,
  buyDevelopmentCard,
  playKnight,
  playRoadBuilding,
  playYearOfPlenty,
  playMonopoly,
  updateLargestArmyHolder,
  getDevCardCounts,
  getPlayableDevCards,
  countVictoryPointCards,
  canPlayDevCard,
  type BuyDevCardResult,
} from './devCardManager';

// ============================================================================
// TYPES - Re-export commonly used types
// ============================================================================
export type {
  GameState,
  GameAction,
  GameSettings,
  GamePhase,
  Player,
  HexTile,
  Building,
  Road,
  Port,
  DevelopmentCard,
  DevelopmentCardType,
  HexCoord,
  VertexCoord,
  EdgeCoord,
  ResourceType,
  ResourceCounts,
} from '../../types';
