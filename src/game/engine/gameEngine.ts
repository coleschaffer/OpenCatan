/**
 * Game Engine Module
 *
 * This is the main game engine for OpenCatan. It provides the core functions
 * for initializing games, processing actions, and checking victory conditions.
 *
 * The host's browser runs this authoritative game logic, validating all actions
 * before applying state changes.
 *
 * All functions are pure and return new state objects without mutations.
 */

import {
  GameState,
  GameAction,
  GameSettings,
  GamePhase,
  Player,
  HexTile,
  Port,
  ResourceCounts,
  DevelopmentCardType,
  createPlayer,
  createEmptyResources,
  INITIAL_BANK_RESOURCES,
  DEFAULT_GAME_SETTINGS,
  createDevelopmentDeck,
  hexToKey,
  vertexToKey,
  HexCoord,
  VertexCoord,
  EdgeCoord,
  TERRAIN_RESOURCE_MAP,
} from '../../types';

import { rollDice, getResourcesForRoll } from './diceRoller';
import {
  distributeResources,
  canAfford,
  deductResources,
  addResources as addResourcesToPlayer,
  getPlayersWhoMustDiscard,
  processDiscard,
} from './resourceManager';
import {
  getValidRoadPlacements,
  getValidSettlementPlacements,
  getValidCityPlacements,
  placeRoad,
  placeSettlement,
  placeCity,
  isValidRoadPlacement,
  isValidSettlementPlacement,
  BUILDING_COSTS,
} from './buildingManager';
import { updateLongestRoadHolder, calculateLongestRoad } from './longestRoad';
import {
  getValidRobberPlacements,
  moveRobber,
  getStealTargets,
  stealCard,
} from './robberManager';
import {
  buyDevelopmentCard,
  playKnight,
  playRoadBuilding,
  playYearOfPlenty,
  playMonopoly,
  updateLargestArmyHolder,
} from './devCardManager';
import { getValidActions, advancePhase, nextTurn, advanceSetup } from './turnManager';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of processing a game action
 */
export interface ActionResult {
  /** The new game state after the action */
  newState: GameState;
  /** Whether the action was successful */
  success: boolean;
  /** Error message if the action failed */
  error?: string;
}

/**
 * Result of checking for victory
 */
export interface VictoryResult {
  /** ID of the winning player, or null if game is not over */
  winner: string | null;
  /** Current scores for all players */
  scores: Record<string, number>;
}

// ============================================================================
// BOARD GENERATION
// ============================================================================

/**
 * Standard Catan board tile distribution
 */
const STANDARD_TERRAIN_DISTRIBUTION: Array<keyof typeof TERRAIN_RESOURCE_MAP | 'desert'> = [
  'hills', 'hills', 'hills',           // 3 hills (brick)
  'forest', 'forest', 'forest', 'forest', // 4 forests (lumber)
  'mountains', 'mountains', 'mountains', // 3 mountains (ore)
  'fields', 'fields', 'fields', 'fields', // 4 fields (grain)
  'pasture', 'pasture', 'pasture', 'pasture', // 4 pastures (wool)
  'desert', // 1 desert
];

/**
 * Standard number token distribution
 */
const STANDARD_NUMBER_DISTRIBUTION = [
  5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11,
];

/**
 * Standard hex positions for a 4-player board
 */
const STANDARD_HEX_POSITIONS: HexCoord[] = [
  // Top row (3 hexes)
  { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
  // Second row (4 hexes)
  { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 },
  // Middle row (5 hexes)
  { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
  // Fourth row (4 hexes)
  { q: -2, r: 1 }, { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 },
  // Bottom row (3 hexes)
  { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 },
];

/**
 * Standard port configuration
 */
const STANDARD_PORTS: Array<{ type: 'generic' | 'brick' | 'lumber' | 'ore' | 'grain' | 'wool'; vertices: [VertexCoord, VertexCoord] }> = [
  { type: 'generic', vertices: [{ hex: { q: 0, r: -2 }, direction: 'N' }, { hex: { q: 1, r: -2 }, direction: 'N' }] },
  { type: 'grain', vertices: [{ hex: { q: 2, r: -2 }, direction: 'N' }, { hex: { q: 2, r: -1 }, direction: 'N' }] },
  { type: 'ore', vertices: [{ hex: { q: 2, r: 0 }, direction: 'N' }, { hex: { q: 2, r: 0 }, direction: 'S' }] },
  { type: 'generic', vertices: [{ hex: { q: 1, r: 1 }, direction: 'S' }, { hex: { q: 0, r: 2 }, direction: 'N' }] },
  { type: 'wool', vertices: [{ hex: { q: -1, r: 2 }, direction: 'S' }, { hex: { q: -2, r: 2 }, direction: 'S' }] },
  { type: 'generic', vertices: [{ hex: { q: -2, r: 1 }, direction: 'S' }, { hex: { q: -2, r: 0 }, direction: 'S' }] },
  { type: 'brick', vertices: [{ hex: { q: -2, r: 0 }, direction: 'N' }, { hex: { q: -2, r: -1 }, direction: 'N' }] },
  { type: 'lumber', vertices: [{ hex: { q: -1, r: -1 }, direction: 'N' }, { hex: { q: 0, r: -2 }, direction: 'N' }] },
  { type: 'generic', vertices: [{ hex: { q: 1, r: -2 }, direction: 'N' }, { hex: { q: 2, r: -2 }, direction: 'N' }] },
];

/**
 * Fisher-Yates shuffle algorithm with crypto random
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j: number;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      j = randomArray[0] % (i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generates the hex tiles for a standard Catan board
 */
function generateTiles(randomSeed?: number): HexTile[] {
  // Shuffle terrain types
  const shuffledTerrain = shuffleArray([...STANDARD_TERRAIN_DISTRIBUTION]);

  // Find desert index and prepare numbers (desert doesn't get a number)
  let desertIndex = shuffledTerrain.indexOf('desert');
  let numberIndex = 0;

  const tiles: HexTile[] = STANDARD_HEX_POSITIONS.map((coord, index) => {
    const terrain = shuffledTerrain[index];
    const isDesert = terrain === 'desert';

    return {
      id: `tile-${hexToKey(coord)}`,
      coord,
      terrain: terrain as HexTile['terrain'],
      number: isDesert ? undefined : STANDARD_NUMBER_DISTRIBUTION[numberIndex++],
      hasRobber: isDesert, // Robber starts on desert
      hasPirate: false,
      isFog: false,
    };
  });

  return tiles;
}

/**
 * Generates the ports for a standard Catan board
 */
function generatePorts(): Port[] {
  return STANDARD_PORTS.map((portConfig, index) => ({
    id: `port-${index}`,
    edge: { hex: portConfig.vertices[0].hex, direction: 'E' as const },
    type: portConfig.type,
    ratio: portConfig.type === 'generic' ? 3 : 2,
    vertices: portConfig.vertices,
  }));
}

/**
 * Finds the desert hex (initial robber location)
 */
function findDesertHex(tiles: HexTile[]): HexCoord {
  const desert = tiles.find(t => t.terrain === 'desert');
  return desert?.coord || { q: 0, r: 0 };
}

// ============================================================================
// GAME INITIALIZATION
// ============================================================================

/**
 * Initializes a new game with the given players and settings.
 *
 * @param players - Array of players joining the game
 * @param settings - Game configuration settings
 * @returns Initial game state ready for setup phase
 */
export function initializeGame(
  players: Player[],
  settings: GameSettings = DEFAULT_GAME_SETTINGS
): GameState {
  // Validate player count
  if (players.length < 2 || players.length > 6) {
    throw new Error('Game requires 2-6 players');
  }

  // Generate board
  const tiles = generateTiles(settings.randomSeed);
  const ports = generatePorts();
  const robberLocation = findDesertHex(tiles);

  // Create and shuffle development card deck
  const developmentDeck = shuffleArray(createDevelopmentDeck());

  // Determine turn order (randomized)
  const turnOrder = shuffleArray(players.map(p => p.id));

  // Initialize game state
  const gameState: GameState = {
    // Meta
    roomCode: generateRoomCode(),
    mode: settings.mode,
    settings,
    version: 1,
    lastUpdated: Date.now(),

    // Phase
    phase: 'setup-settlement-1',
    turn: 0,
    currentPlayerId: turnOrder[0],
    turnTimeRemaining: settings.turnTimer,
    turnStartedAt: Date.now(),

    // Board
    tiles,
    buildings: [],
    roads: [],
    ports,

    // Players
    players: players.map(p => ({
      ...p,
      resources: createEmptyResources(),
      developmentCards: [],
      hasPlayedDevCard: false,
      devCardsBoughtThisTurn: [],
      roadsRemaining: 15,
      settlementsRemaining: 5,
      citiesRemaining: 4,
      longestRoadLength: 0,
      armySize: 0,
      totalResourcesCollected: 0,
      totalTradesMade: 0,
      timesRobbed: 0,
      timesWasRobbed: 0,
    })),
    turnOrder,
    playersNeedingToDiscard: [],
    discardAmounts: {},

    // Special pieces
    robberLocation,

    // Decks
    developmentDeck,
    developmentDeckCount: developmentDeck.length,

    // Bank
    bank: { ...INITIAL_BANK_RESOURCES },

    // Achievements
    longestRoad: null,
    largestArmy: null,

    // Trades
    activeOffers: [],

    // Setup tracking
    setupPlayerIndex: 0,
    setupDirection: 'forward',

    // History
    log: [],
    chat: [],
  };

  return gameState;
}

/**
 * Generates a random room code
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      code += chars[randomArray[0] % chars.length];
    } else {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return code;
}

// ============================================================================
// ACTION PROCESSING
// ============================================================================

/**
 * Processes a game action and returns the new state.
 *
 * This is the main entry point for all game actions. It validates the action,
 * applies the changes, and returns the new state.
 *
 * @param state - Current game state
 * @param action - The action to process
 * @param playerId - ID of the player performing the action
 * @returns Action result with new state or error
 */
export function processAction(
  state: GameState,
  action: GameAction,
  playerId: string
): ActionResult {
  try {
    // Get valid actions for this player in current phase
    const validActions = getValidActions(state, playerId);

    // Check if action type is valid for current phase
    const actionTypes = validActions.map(a => a.type);
    if (!actionTypes.includes(action.type)) {
      return {
        newState: state,
        success: false,
        error: `Action ${action.type} is not valid in the current phase (${state.phase})`,
      };
    }

    let newState = state;

    switch (action.type) {
      // ==================== DICE ROLLING ====================
      case 'ROLL_DICE': {
        if (state.phase !== 'roll') {
          return { newState: state, success: false, error: 'Cannot roll dice in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const roll = rollDice();
        newState = {
          ...state,
          lastRoll: roll,
        };

        if (roll.total === 7) {
          // Check for players who need to discard
          const mustDiscard = getPlayersWhoMustDiscard(newState);
          if (mustDiscard.length > 0) {
            newState = {
              ...newState,
              phase: 'discard',
              playersNeedingToDiscard: mustDiscard,
            };
          } else {
            newState = {
              ...newState,
              phase: 'robber-move',
            };
          }
        } else {
          // Distribute resources
          newState = distributeResources(newState, roll.total);
          newState = {
            ...newState,
            phase: 'main',
          };
        }
        break;
      }

      // ==================== DISCARD ====================
      case 'DISCARD_RESOURCES': {
        if (state.phase !== 'discard') {
          return { newState: state, success: false, error: 'Cannot discard in this phase' };
        }
        if (!state.playersNeedingToDiscard.includes(playerId)) {
          return { newState: state, success: false, error: 'You do not need to discard' };
        }

        newState = processDiscard(state, playerId, action.resources);

        // Check if all players have discarded
        if (newState.playersNeedingToDiscard.length === 0) {
          newState = {
            ...newState,
            phase: 'robber-move',
          };
        }
        break;
      }

      // ==================== ROBBER ====================
      case 'MOVE_ROBBER': {
        if (state.phase !== 'robber-move') {
          return { newState: state, success: false, error: 'Cannot move robber in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const validPlacements = getValidRobberPlacements(state, state.settings.friendlyRobber);
        const isValid = validPlacements.some(
          h => h.q === action.hex.q && h.r === action.hex.r
        );
        if (!isValid) {
          return { newState: state, success: false, error: 'Invalid robber placement' };
        }

        newState = moveRobber(state, action.hex);

        // Check if there are steal targets
        const stealTargets = getStealTargets(newState, action.hex, playerId);
        if (stealTargets.length > 0) {
          newState = {
            ...newState,
            phase: 'robber-steal',
          };
        } else {
          newState = {
            ...newState,
            phase: 'main',
          };
        }
        break;
      }

      case 'STEAL_RESOURCE': {
        if (state.phase !== 'robber-steal') {
          return { newState: state, success: false, error: 'Cannot steal in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const targets = getStealTargets(state, state.robberLocation, playerId);
        if (!targets.includes(action.victimId)) {
          return { newState: state, success: false, error: 'Invalid steal target' };
        }

        newState = stealCard(state, action.victimId, playerId);
        newState = {
          ...newState,
          phase: 'main',
        };
        break;
      }

      case 'SKIP_STEAL': {
        if (state.phase !== 'robber-steal') {
          return { newState: state, success: false, error: 'Cannot skip steal in this phase' };
        }
        newState = {
          ...state,
          phase: 'main',
        };
        break;
      }

      // ==================== BUILDING ====================
      case 'BUILD_ROAD': {
        if (state.phase !== 'main' && state.phase !== 'road-building') {
          return { newState: state, success: false, error: 'Cannot build road in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const isFree = state.phase === 'road-building';
        if (!isValidRoadPlacement(state, playerId, action.edge)) {
          return { newState: state, success: false, error: 'Invalid road placement' };
        }

        if (!isFree && !canAfford(state.players.find(p => p.id === playerId)!, BUILDING_COSTS.road)) {
          return { newState: state, success: false, error: 'Cannot afford road' };
        }

        newState = placeRoad(state, playerId, action.edge, isFree);
        newState = updateLongestRoadHolder(newState);

        // Check for immediate victory after road (might gain longest road bonus)
        const roadVictory = checkVictory(newState);
        if (roadVictory.winner) {
          newState = {
            ...newState,
            phase: 'ended',
            winnerId: roadVictory.winner,
            finalScores: roadVictory.scores,
          };
          break;
        }

        // Handle road building card
        if (state.phase === 'road-building') {
          const remaining = (state.roadBuildingRemaining || 2) - 1;
          if (remaining <= 0) {
            newState = { ...newState, phase: 'main', roadBuildingRemaining: undefined };
          } else {
            newState = { ...newState, roadBuildingRemaining: remaining };
          }
        }
        break;
      }

      case 'BUILD_SETTLEMENT': {
        if (state.phase !== 'main' && !state.phase.startsWith('setup-')) {
          return { newState: state, success: false, error: 'Cannot build settlement in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        if (!isValidSettlementPlacement(state, playerId, action.vertex, false)) {
          return { newState: state, success: false, error: 'Invalid settlement placement' };
        }

        const player = state.players.find(p => p.id === playerId)!;
        if (!canAfford(player, BUILDING_COSTS.settlement)) {
          return { newState: state, success: false, error: 'Cannot afford settlement' };
        }

        newState = placeSettlement(state, playerId, action.vertex, false);
        newState = updateLongestRoadHolder(newState);

        // Check for immediate victory after building
        const settlementVictory = checkVictory(newState);
        if (settlementVictory.winner) {
          newState = {
            ...newState,
            phase: 'ended',
            winnerId: settlementVictory.winner,
            finalScores: settlementVictory.scores,
          };
        }
        break;
      }

      case 'BUILD_CITY': {
        if (state.phase !== 'main') {
          return { newState: state, success: false, error: 'Cannot build city in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const citySpots = getValidCityPlacements(state, playerId);
        const isValidSpot = citySpots.some(
          v => v.hex.q === action.vertex.hex.q &&
               v.hex.r === action.vertex.hex.r &&
               v.direction === action.vertex.direction
        );
        if (!isValidSpot) {
          return { newState: state, success: false, error: 'Invalid city placement' };
        }

        const cityPlayer = state.players.find(p => p.id === playerId)!;
        if (!canAfford(cityPlayer, BUILDING_COSTS.city)) {
          return { newState: state, success: false, error: 'Cannot afford city' };
        }

        newState = placeCity(state, playerId, action.vertex);

        // Check for immediate victory after building a city (gives +1 VP over settlement)
        const cityVictory = checkVictory(newState);
        if (cityVictory.winner) {
          newState = {
            ...newState,
            phase: 'ended',
            winnerId: cityVictory.winner,
            finalScores: cityVictory.scores,
          };
        }
        break;
      }

      // ==================== SETUP PHASE ====================
      case 'PLACE_SETTLEMENT': {
        if (!state.phase.startsWith('setup-settlement')) {
          return { newState: state, success: false, error: 'Cannot place setup settlement in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        if (!isValidSettlementPlacement(state, playerId, action.vertex, true)) {
          return { newState: state, success: false, error: 'Invalid settlement placement' };
        }

        newState = placeSettlement(state, playerId, action.vertex, true);

        // Move to road placement phase
        if (state.phase === 'setup-settlement-1') {
          newState = { ...newState, phase: 'setup-road-1' };
        } else {
          newState = { ...newState, phase: 'setup-road-2' };
        }
        break;
      }

      case 'PLACE_ROAD': {
        if (!state.phase.startsWith('setup-road')) {
          return { newState: state, success: false, error: 'Cannot place setup road in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        // During setup, road must connect to just-placed settlement
        if (!isValidRoadPlacement(state, playerId, action.edge)) {
          return { newState: state, success: false, error: 'Invalid road placement' };
        }

        newState = placeRoad(state, playerId, action.edge, true);

        // Advance setup phase
        newState = advanceSetup(newState);
        break;
      }

      // ==================== DEVELOPMENT CARDS ====================
      case 'BUY_DEVELOPMENT_CARD': {
        if (state.phase !== 'main') {
          return { newState: state, success: false, error: 'Cannot buy development card in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const buyPlayer = state.players.find(p => p.id === playerId)!;
        if (!canAfford(buyPlayer, BUILDING_COSTS.developmentCard)) {
          return { newState: state, success: false, error: 'Cannot afford development card' };
        }

        if (state.developmentDeck.length === 0) {
          return { newState: state, success: false, error: 'No development cards remaining' };
        }

        newState = buyDevelopmentCard(state, playerId);
        break;
      }

      case 'PLAY_KNIGHT': {
        if (state.phase !== 'main' && state.phase !== 'roll') {
          return { newState: state, success: false, error: 'Cannot play knight in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const knightPlayer = state.players.find(p => p.id === playerId)!;
        if (knightPlayer.hasPlayedDevCard) {
          return { newState: state, success: false, error: 'Already played a development card this turn' };
        }

        newState = playKnight(state, playerId);
        newState = updateLargestArmyHolder(newState);

        // Check for immediate victory after playing knight (might gain largest army bonus)
        const knightVictory = checkVictory(newState);
        if (knightVictory.winner) {
          newState = {
            ...newState,
            phase: 'ended',
            winnerId: knightVictory.winner,
            finalScores: knightVictory.scores,
          };
        }
        break;
      }

      case 'PLAY_ROAD_BUILDING': {
        if (state.phase !== 'main') {
          return { newState: state, success: false, error: 'Cannot play road building in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const rbPlayer = state.players.find(p => p.id === playerId)!;
        if (rbPlayer.hasPlayedDevCard) {
          return { newState: state, success: false, error: 'Already played a development card this turn' };
        }

        newState = playRoadBuilding(state, playerId);
        break;
      }

      case 'PLAY_YEAR_OF_PLENTY': {
        if (state.phase !== 'main') {
          return { newState: state, success: false, error: 'Cannot play year of plenty in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const yopPlayer = state.players.find(p => p.id === playerId)!;
        if (yopPlayer.hasPlayedDevCard) {
          return { newState: state, success: false, error: 'Already played a development card this turn' };
        }

        // Validate bank has resources
        const [res1, res2] = action.resources;
        if (state.bank[res1] < 1 || (res1 === res2 ? state.bank[res1] < 2 : state.bank[res2] < 1)) {
          return { newState: state, success: false, error: 'Bank does not have requested resources' };
        }

        newState = playYearOfPlenty(state, playerId, action.resources);
        break;
      }

      case 'PLAY_MONOPOLY': {
        if (state.phase !== 'main') {
          return { newState: state, success: false, error: 'Cannot play monopoly in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        const monPlayer = state.players.find(p => p.id === playerId)!;
        if (monPlayer.hasPlayedDevCard) {
          return { newState: state, success: false, error: 'Already played a development card this turn' };
        }

        newState = playMonopoly(state, playerId, action.resource);
        break;
      }

      // ==================== TURN MANAGEMENT ====================
      case 'END_TURN': {
        if (state.phase !== 'main') {
          return { newState: state, success: false, error: 'Cannot end turn in this phase' };
        }
        if (state.currentPlayerId !== playerId) {
          return { newState: state, success: false, error: 'It is not your turn' };
        }

        // Check for victory before ending turn
        const victoryCheck = checkVictory(state);
        if (victoryCheck.winner) {
          newState = {
            ...state,
            phase: 'ended',
            winnerId: victoryCheck.winner,
            finalScores: victoryCheck.scores,
          };
        } else {
          newState = nextTurn(state);
        }
        break;
      }

      default:
        return {
          newState: state,
          success: false,
          error: `Unknown action type: ${(action as GameAction).type}`,
        };
    }

    // Update version and timestamp
    newState = {
      ...newState,
      version: state.version + 1,
      lastUpdated: Date.now(),
    };

    return {
      newState,
      success: true,
    };
  } catch (error) {
    return {
      newState: state,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// VICTORY CHECKING
// ============================================================================

/**
 * Calculates the victory points for a player
 */
function calculateVictoryPoints(state: GameState, playerId: string): number {
  let vp = 0;

  // Count settlements (1 VP each)
  const settlements = state.buildings.filter(
    b => b.playerId === playerId && b.type === 'settlement'
  );
  vp += settlements.length;

  // Count cities (2 VP each)
  const cities = state.buildings.filter(
    b => b.playerId === playerId && b.type === 'city'
  );
  vp += cities.length * 2;

  // Longest road (2 VP)
  if (state.longestRoad?.playerId === playerId) {
    vp += 2;
  }

  // Largest army (2 VP)
  if (state.largestArmy?.playerId === playerId) {
    vp += 2;
  }

  // Victory point cards
  const player = state.players.find(p => p.id === playerId);
  if (player) {
    const vpCards = player.developmentCards.filter(
      c => c.type === 'victoryPoint' && !c.isPlayed
    );
    vp += vpCards.length;
  }

  return vp;
}

/**
 * Checks if any player has won the game.
 *
 * @param state - Current game state
 * @returns Victory result with winner (if any) and all scores
 */
export function checkVictory(state: GameState): VictoryResult {
  const scores: Record<string, number> = {};
  let winner: string | null = null;

  for (const player of state.players) {
    const vp = calculateVictoryPoints(state, player.id);
    scores[player.id] = vp;

    if (vp >= state.settings.victoryPoints) {
      winner = player.id;
    }
  }

  return { winner, scores };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  calculateVictoryPoints,
  generateRoomCode,
};
