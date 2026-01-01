// @ts-nocheck
// TODO: Fix TypeScript errors in this file
/**
 * Development Card Module
 *
 * This module handles all development card operations in OpenCatan:
 * - Buying development cards from the deck
 * - Playing Knight cards (move robber, increment army)
 * - Playing Road Building cards (2 free roads)
 * - Playing Year of Plenty cards (take 2 resources from bank)
 * - Playing Monopoly cards (take all of one resource type)
 * - Tracking and updating Largest Army
 *
 * Development cards cannot be played on the turn they are purchased,
 * except for Victory Point cards which are revealed automatically.
 * Only one development card can be played per turn.
 *
 * All functions are pure and return new state objects without mutations.
 */

import {
  GameState,
  HexCoord,
  ResourceType,
  DevelopmentCard,
  DevelopmentCardType,
  Player,
  AchievementState,
  BUILDING_COSTS,
} from '../../types';
import { payToBank, takeFromBank, subtractResources, addResources } from './resources';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of buying a development card.
 */
export interface BuyDevCardResult {
  /** New game state after purchase */
  state: GameState;
  /** The card that was drawn */
  card: DevelopmentCardType;
}

/**
 * Information about the largest army holder.
 * Uses AchievementState with `count` for army size.
 */
export type LargestArmyHolder = AchievementState & { count: number };

// ============================================================================
// DECK MANAGEMENT
// ============================================================================

/**
 * Shuffles the development card deck using Fisher-Yates algorithm.
 *
 * @param deck - Array of card types to shuffle
 * @returns New shuffled array
 */
export function shuffleDeck(deck: DevelopmentCardType[]): DevelopmentCardType[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use crypto.getRandomValues for true randomness if available
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
 * Creates an initial development card deck for the base game.
 * Standard distribution:
 * - 14 Knights
 * - 5 Victory Points
 * - 2 Road Building
 * - 2 Year of Plenty
 * - 2 Monopoly
 *
 * @returns Shuffled development card deck
 */
export function createDevCardDeck(): DevelopmentCardType[] {
  const deck: DevelopmentCardType[] = [
    // Knights
    ...Array(14).fill('knight' as DevelopmentCardType),
    // Victory Points
    ...Array(5).fill('victoryPoint' as DevelopmentCardType),
    // Road Building
    ...Array(2).fill('roadBuilding' as DevelopmentCardType),
    // Year of Plenty
    ...Array(2).fill('yearOfPlenty' as DevelopmentCardType),
    // Monopoly
    ...Array(2).fill('monopoly' as DevelopmentCardType),
  ];

  return shuffleDeck(deck);
}

// ============================================================================
// BUYING DEVELOPMENT CARDS
// ============================================================================

/**
 * Buys a development card for a player.
 * Deducts resources (ore, grain, wool) and draws from deck.
 *
 * Does NOT validate - use validation module to check first.
 *
 * @param state - Current game state
 * @param playerId - ID of the player buying
 * @returns Result with new state and the drawn card
 */
export function buyDevCard(
  state: GameState,
  playerId: string
): BuyDevCardResult {
  // Draw the top card from the deck
  const [drawnCard, ...remainingDeck] = state.developmentDeck;

  // Create the card object for the player's hand
  const newCard: DevelopmentCard = {
    type: drawnCard,
    purchasedTurn: state.turn,
    played: false,
  };

  // Update player's hand and resources
  const newPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;

    return {
      ...player,
      resources: subtractResources(player.resources, BUILDING_COSTS.devCard),
      developmentCards: [...player.developmentCards, newCard],
    };
  });

  // Add resources to bank
  const newBank = {
    ...state.bank,
    ore: state.bank.ore + 1,
    grain: state.bank.grain + 1,
    wool: state.bank.wool + 1,
  };

  const newState: GameState = {
    ...state,
    players: newPlayers,
    developmentDeck: remainingDeck,
    bank: newBank,
  };

  return {
    state: newState,
    card: drawnCard,
  };
}

// ============================================================================
// PLAYING KNIGHT CARDS
// ============================================================================

/**
 * Plays a Knight development card.
 *
 * Effects:
 * 1. Marks the card as played
 * 2. Increments the player's army size
 * 3. Changes game phase to robber-move
 * 4. Sets hasPlayedDevCardThisTurn flag
 *
 * The actual robber movement and stealing is handled by the robber module.
 *
 * @param state - Current game state
 * @param playerId - ID of the player playing the knight
 * @returns New game state with knight played
 */
export function playKnight(state: GameState, playerId: string): GameState {
  // Find and mark the knight card as played
  let cardFound = false;
  const newPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;

    const newCards = player.developmentCards.map((card) => {
      // Find first unplayed knight that wasn't bought this turn
      if (
        !cardFound &&
        card.type === 'knight' &&
        !card.played &&
        card.purchasedTurn !== state.turn
      ) {
        cardFound = true;
        return { ...card, played: true };
      }
      return card;
    });

    return {
      ...player,
      developmentCards: newCards,
      armySize: player.armySize + 1,
      hasPlayedDevCardThisTurn: true,
    };
  });

  return {
    ...state,
    players: newPlayers,
    phase: 'robber-move',
  };
}

// ============================================================================
// PLAYING ROAD BUILDING
// ============================================================================

/**
 * Plays a Road Building development card.
 *
 * Effects:
 * 1. Marks the card as played
 * 2. Changes game phase to road-building
 * 3. Initializes road building counter to 0
 * 4. Sets hasPlayedDevCardThisTurn flag
 *
 * The player can then place up to 2 roads for free.
 *
 * @param state - Current game state
 * @param playerId - ID of the player playing the card
 * @returns New game state with road building phase active
 */
export function playRoadBuilding(state: GameState, playerId: string): GameState {
  // Find and mark the card as played
  let cardFound = false;
  const newPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;

    const newCards = player.developmentCards.map((card) => {
      if (
        !cardFound &&
        card.type === 'roadBuilding' &&
        !card.played &&
        card.purchasedTurn !== state.turn
      ) {
        cardFound = true;
        return { ...card, played: true };
      }
      return card;
    });

    return {
      ...player,
      developmentCards: newCards,
      hasPlayedDevCardThisTurn: true,
    };
  });

  return {
    ...state,
    players: newPlayers,
    phase: 'road-building',
    roadBuildingRoadsPlaced: 0,
  };
}

/**
 * Increments the road building counter when a road is placed.
 * Returns to main phase when 2 roads have been placed or player has no more roads.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns New game state with updated counter/phase
 */
export function incrementRoadBuildingCounter(
  state: GameState,
  playerId: string
): GameState {
  const roadsPlaced = (state.roadBuildingRoadsPlaced || 0) + 1;
  const player = state.players.find((p) => p.id === playerId);

  // Check if done (2 roads placed or no more roads available)
  const isDone = roadsPlaced >= 2 || (player && player.roadsRemaining <= 0);

  return {
    ...state,
    roadBuildingRoadsPlaced: roadsPlaced,
    phase: isDone ? 'main' : 'road-building',
  };
}

// ============================================================================
// PLAYING YEAR OF PLENTY
// ============================================================================

/**
 * Plays a Year of Plenty development card.
 *
 * Effects:
 * 1. Marks the card as played
 * 2. Gives player 2 resources of their choice from the bank
 * 3. Sets hasPlayedDevCardThisTurn flag
 *
 * @param state - Current game state
 * @param playerId - ID of the player playing the card
 * @param resources - Tuple of 2 resource types to take
 * @returns New game state with resources taken
 */
export function playYearOfPlenty(
  state: GameState,
  playerId: string,
  resources: [ResourceType, ResourceType]
): GameState {
  const [resource1, resource2] = resources;

  // Validate bank has the resources
  const resource1Count = state.bank[resource1];
  const resource2Count =
    resource1 === resource2
      ? state.bank[resource1] - 1 // Need 2 of same type
      : state.bank[resource2];

  if (resource1Count < 1) {
    throw new Error(`Bank does not have ${resource1}`);
  }
  if (resource2Count < 1) {
    throw new Error(`Bank does not have ${resource2}`);
  }

  // Find and mark the card as played
  let cardFound = false;
  const newPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;

    const newCards = player.developmentCards.map((card) => {
      if (
        !cardFound &&
        card.type === 'yearOfPlenty' &&
        !card.played &&
        card.purchasedTurn !== state.turn
      ) {
        cardFound = true;
        return { ...card, played: true };
      }
      return card;
    });

    // Add the two resources
    const resourcesToAdd = {
      [resource1]: 1,
      [resource2]: 1,
    };
    // Handle case where both resources are the same
    if (resource1 === resource2) {
      resourcesToAdd[resource1] = 2;
    }

    return {
      ...player,
      developmentCards: newCards,
      resources: addResources(player.resources, resourcesToAdd),
      hasPlayedDevCardThisTurn: true,
    };
  });

  // Deduct from bank
  const newBank = { ...state.bank };
  newBank[resource1] -= 1;
  newBank[resource2] -= 1;

  return {
    ...state,
    players: newPlayers,
    bank: newBank,
  };
}

// ============================================================================
// PLAYING MONOPOLY
// ============================================================================

/**
 * Plays a Monopoly development card.
 *
 * Effects:
 * 1. Marks the card as played
 * 2. Takes ALL of the chosen resource type from all other players
 * 3. Sets hasPlayedDevCardThisTurn flag
 *
 * @param state - Current game state
 * @param playerId - ID of the player playing the card
 * @param resource - Resource type to monopolize
 * @returns New game state with resources redistributed
 */
export function playMonopoly(
  state: GameState,
  playerId: string,
  resource: ResourceType
): GameState {
  // First, calculate total resources to take
  let totalStolen = 0;

  // Update all players
  let cardFound = false;
  const newPlayers = state.players.map((player) => {
    if (player.id === playerId) {
      // This is the monopoly player - mark card as played
      const newCards = player.developmentCards.map((card) => {
        if (
          !cardFound &&
          card.type === 'monopoly' &&
          !card.played &&
          card.purchasedTurn !== state.turn
        ) {
          cardFound = true;
          return { ...card, played: true };
        }
        return card;
      });

      // Will add stolen resources after we know the total
      return {
        ...player,
        developmentCards: newCards,
        hasPlayedDevCardThisTurn: true,
      };
    } else {
      // Other player - take their resources of this type
      const resourceCount = player.resources[resource];
      totalStolen += resourceCount;

      return {
        ...player,
        resources: {
          ...player.resources,
          [resource]: 0,
        },
      };
    }
  });

  // Now add stolen resources to monopoly player
  const finalPlayers = newPlayers.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        resources: {
          ...player.resources,
          [resource]: player.resources[resource] + totalStolen,
        },
      };
    }
    return player;
  });

  return {
    ...state,
    players: finalPlayers,
  };
}

// ============================================================================
// LARGEST ARMY
// ============================================================================

/**
 * Checks and updates the Largest Army holder.
 *
 * Rules:
 * - Need at least 3 knights to qualify
 * - Must have strictly more knights than current holder to take it
 * - Unlike Longest Road, Largest Army cannot be lost once obtained
 *   (unless someone beats you)
 *
 * @param state - Current game state
 * @returns New game state with updated largest army holder
 */
export function checkLargestArmy(state: GameState): GameState {
  const MINIMUM_ARMY_SIZE = 3;

  // Find all players with their army sizes
  const playerArmies = state.players.map((player) => ({
    playerId: player.id,
    armySize: player.armySize,
  }));

  // Sort by army size descending
  playerArmies.sort((a, b) => b.armySize - a.armySize);

  const currentHolder = state.largestArmy;
  const topPlayer = playerArmies[0];

  // Nobody qualifies
  if (topPlayer.armySize < MINIMUM_ARMY_SIZE) {
    return state;
  }

  let newHolder: LargestArmyHolder | null = currentHolder;

  if (currentHolder === null) {
    // No current holder - award to largest if they meet minimum
    newHolder = {
      playerId: topPlayer.playerId,
      count: topPlayer.armySize,
    };
  } else {
    // There's a current holder - someone must beat them to take it
    if (topPlayer.armySize > currentHolder.count) {
      newHolder = {
        playerId: topPlayer.playerId,
        count: topPlayer.armySize,
      };
    } else {
      // Update current holder's count if still holder
      const holderArmy = playerArmies.find(
        (p) => p.playerId === currentHolder.playerId
      );
      if (holderArmy) {
        newHolder = {
          playerId: currentHolder.playerId,
          count: holderArmy.armySize,
        };
      }
    }
  }

  return {
    ...state,
    largestArmy: newHolder,
  };
}

// ============================================================================
// VICTORY POINT CARDS
// ============================================================================

/**
 * Counts the number of unplayed Victory Point cards a player has.
 * These are "hidden" VP that only reveal when the player wins.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Number of VP cards
 */
export function countVictoryPointCards(
  state: GameState,
  playerId: string
): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 0;

  return player.developmentCards.filter(
    (card) => card.type === 'victoryPoint' && !card.played
  ).length;
}

/**
 * Reveals all Victory Point cards for a player (when they win).
 * Marks all VP cards as "played" for display purposes.
 *
 * @param state - Current game state
 * @param playerId - ID of the winning player
 * @returns New game state with VP cards revealed
 */
export function revealVictoryPointCards(
  state: GameState,
  playerId: string
): GameState {
  const newPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;

    const newCards = player.developmentCards.map((card) => {
      if (card.type === 'victoryPoint') {
        return { ...card, played: true };
      }
      return card;
    });

    return {
      ...player,
      developmentCards: newCards,
    };
  });

  return {
    ...state,
    players: newPlayers,
  };
}

// ============================================================================
// CARD QUERIES
// ============================================================================

/**
 * Gets all unplayed development cards a player can play.
 * Excludes cards bought this turn (except VP cards, which don't need to be played).
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Array of playable card types
 */
export function getPlayableDevCards(
  state: GameState,
  playerId: string
): DevelopmentCardType[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];

  // If player already played a card this turn, nothing is playable
  if (player.hasPlayedDevCardThisTurn) {
    return [];
  }

  const playable = new Set<DevelopmentCardType>();

  for (const card of player.developmentCards) {
    // Skip already played cards
    if (card.played) continue;

    // Skip cards bought this turn (except VP which don't need to be played)
    if (card.purchasedTurn === state.turn && card.type !== 'victoryPoint') {
      continue;
    }

    // VP cards don't need to be played
    if (card.type === 'victoryPoint') continue;

    playable.add(card.type);
  }

  return Array.from(playable);
}

/**
 * Gets the count of each development card type in a player's hand.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Record of card types to counts
 */
export function getDevCardCounts(
  state: GameState,
  playerId: string
): Record<DevelopmentCardType, number> {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return {
      knight: 0,
      victoryPoint: 0,
      roadBuilding: 0,
      yearOfPlenty: 0,
      monopoly: 0,
    };
  }

  const counts: Record<DevelopmentCardType, number> = {
    knight: 0,
    victoryPoint: 0,
    roadBuilding: 0,
    yearOfPlenty: 0,
    monopoly: 0,
  };

  for (const card of player.developmentCards) {
    if (!card.played) {
      counts[card.type]++;
    }
  }

  return counts;
}
