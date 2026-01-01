/**
 * Development Card Manager Module
 *
 * This module handles all development card operations in OpenCatan:
 * - Buying development cards from the deck
 * - Playing Knight, Road Building, Year of Plenty, and Monopoly cards
 * - Managing the Largest Army achievement
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
  Player,
  DevelopmentCard,
  DevelopmentCardType,
  ResourceCounts,
} from '../../types';

import { BUILDING_COSTS } from './buildingManager';

// Re-export types from devCards.ts
export { LargestArmyHolder } from './devCards';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of buying a development card
 */
export interface BuyDevCardResult {
  /** New game state after purchase */
  state: GameState;
  /** The type of card that was drawn */
  cardType: DevelopmentCardType;
}

// ============================================================================
// DECK MANAGEMENT
// ============================================================================

/**
 * Shuffles an array using Fisher-Yates algorithm with crypto random.
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
 * Creates and shuffles the initial development card deck.
 *
 * Standard distribution:
 * - 14 Knights
 * - 5 Victory Points
 * - 2 Road Building
 * - 2 Year of Plenty
 * - 2 Monopoly
 *
 * @returns Shuffled development card deck
 */
export function createDevelopmentDeck(): DevelopmentCardType[] {
  const deck: DevelopmentCardType[] = [
    ...Array(14).fill('knight' as DevelopmentCardType),
    ...Array(5).fill('victoryPoint' as DevelopmentCardType),
    ...Array(2).fill('roadBuilding' as DevelopmentCardType),
    ...Array(2).fill('yearOfPlenty' as DevelopmentCardType),
    ...Array(2).fill('monopoly' as DevelopmentCardType),
  ];

  return shuffleArray(deck);
}

// ============================================================================
// BUYING DEVELOPMENT CARDS
// ============================================================================

/**
 * Buys a development card for a player.
 *
 * Deducts resources (ore, grain, wool) and draws from deck.
 * The card cannot be played until the next turn.
 *
 * @param state - Current game state
 * @param playerId - ID of the player buying
 * @returns New game state with the card added to player's hand
 */
export function buyDevelopmentCard(state: GameState, playerId: string): GameState {
  if (state.developmentDeck.length === 0) {
    throw new Error('No development cards remaining');
  }

  // Draw the top card from the deck
  const [drawnCardType, ...remainingDeck] = state.developmentDeck;

  // Create the card object for the player's hand
  const newCard: DevelopmentCard = {
    id: `devcard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: drawnCardType,
    turnBought: state.turn,
    isPlayed: false,
  };

  // Update player's hand and resources
  const newPlayers = state.players.map(player => {
    if (player.id !== playerId) return player;

    return {
      ...player,
      resources: {
        ...player.resources,
        ore: player.resources.ore - BUILDING_COSTS.developmentCard.ore,
        grain: player.resources.grain - BUILDING_COSTS.developmentCard.grain,
        wool: player.resources.wool - BUILDING_COSTS.developmentCard.wool,
      },
      developmentCards: [...player.developmentCards, newCard],
      devCardsBoughtThisTurn: [...player.devCardsBoughtThisTurn, newCard.id],
    };
  });

  // Add resources to bank
  const newBank = {
    ...state.bank,
    ore: state.bank.ore + BUILDING_COSTS.developmentCard.ore,
    grain: state.bank.grain + BUILDING_COSTS.developmentCard.grain,
    wool: state.bank.wool + BUILDING_COSTS.developmentCard.wool,
  };

  return {
    ...state,
    players: newPlayers,
    developmentDeck: remainingDeck,
    developmentDeckCount: remainingDeck.length,
    bank: newBank,
  };
}

// ============================================================================
// PLAYING KNIGHT
// ============================================================================

/**
 * Plays a Knight development card.
 *
 * Effects:
 * 1. Marks the card as played
 * 2. Increments the player's army size
 * 3. Changes game phase to robber-move
 * 4. Sets hasPlayedDevCard flag
 *
 * @param state - Current game state
 * @param playerId - ID of the player playing the knight
 * @returns New game state with knight played
 */
export function playKnight(state: GameState, playerId: string): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  // Find the first playable knight card
  const knightCard = player.developmentCards.find(
    card =>
      card.type === 'knight' &&
      !card.isPlayed &&
      card.turnBought !== state.turn
  );

  if (!knightCard) {
    throw new Error('No playable knight card found');
  }

  // Update player's cards and army size
  const newPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;

    return {
      ...p,
      developmentCards: p.developmentCards.map(card =>
        card.id === knightCard.id ? { ...card, isPlayed: true } : card
      ),
      armySize: p.armySize + 1,
      hasPlayedDevCard: true,
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
 * 3. Sets roadBuildingRemaining to 2
 * 4. Sets hasPlayedDevCard flag
 *
 * @param state - Current game state
 * @param playerId - ID of the player playing the card
 * @returns New game state with road building phase active
 */
export function playRoadBuilding(state: GameState, playerId: string): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  // Find the first playable road building card
  const rbCard = player.developmentCards.find(
    card =>
      card.type === 'roadBuilding' &&
      !card.isPlayed &&
      card.turnBought !== state.turn
  );

  if (!rbCard) {
    throw new Error('No playable Road Building card found');
  }

  // Update player's cards
  const newPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;

    return {
      ...p,
      developmentCards: p.developmentCards.map(card =>
        card.id === rbCard.id ? { ...card, isPlayed: true } : card
      ),
      hasPlayedDevCard: true,
    };
  });

  return {
    ...state,
    players: newPlayers,
    phase: 'road-building',
    roadBuildingRemaining: 2,
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
 * 3. Sets hasPlayedDevCard flag
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
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  // Find the first playable Year of Plenty card
  const yopCard = player.developmentCards.find(
    card =>
      card.type === 'yearOfPlenty' &&
      !card.isPlayed &&
      card.turnBought !== state.turn
  );

  if (!yopCard) {
    throw new Error('No playable Year of Plenty card found');
  }

  const [resource1, resource2] = resources;

  // Validate bank has the resources
  const sameResource = resource1 === resource2;
  if (sameResource && state.bank[resource1] < 2) {
    throw new Error(`Bank does not have enough ${resource1}`);
  }
  if (!sameResource && (state.bank[resource1] < 1 || state.bank[resource2] < 1)) {
    throw new Error('Bank does not have the requested resources');
  }

  // Calculate resources to add
  const resourcesToAdd: Partial<ResourceCounts> = {};
  resourcesToAdd[resource1] = (resourcesToAdd[resource1] || 0) + 1;
  resourcesToAdd[resource2] = (resourcesToAdd[resource2] || 0) + 1;

  // Update player's cards and resources
  const newPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;

    return {
      ...p,
      developmentCards: p.developmentCards.map(card =>
        card.id === yopCard.id ? { ...card, isPlayed: true } : card
      ),
      resources: {
        brick: p.resources.brick + (resourcesToAdd.brick || 0),
        lumber: p.resources.lumber + (resourcesToAdd.lumber || 0),
        ore: p.resources.ore + (resourcesToAdd.ore || 0),
        grain: p.resources.grain + (resourcesToAdd.grain || 0),
        wool: p.resources.wool + (resourcesToAdd.wool || 0),
      },
      hasPlayedDevCard: true,
    };
  });

  // Deduct from bank
  const newBank = {
    brick: state.bank.brick - (resourcesToAdd.brick || 0),
    lumber: state.bank.lumber - (resourcesToAdd.lumber || 0),
    ore: state.bank.ore - (resourcesToAdd.ore || 0),
    grain: state.bank.grain - (resourcesToAdd.grain || 0),
    wool: state.bank.wool - (resourcesToAdd.wool || 0),
  };

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
 * 3. Sets hasPlayedDevCard flag
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
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  // Find the first playable Monopoly card
  const monCard = player.developmentCards.find(
    card =>
      card.type === 'monopoly' &&
      !card.isPlayed &&
      card.turnBought !== state.turn
  );

  if (!monCard) {
    throw new Error('No playable Monopoly card found');
  }

  // Calculate total resources to steal
  let totalStolen = 0;
  for (const p of state.players) {
    if (p.id !== playerId) {
      totalStolen += p.resources[resource];
    }
  }

  // Update all players
  const newPlayers = state.players.map(p => {
    if (p.id === playerId) {
      // Monopoly player - mark card and add stolen resources
      return {
        ...p,
        developmentCards: p.developmentCards.map(card =>
          card.id === monCard.id ? { ...card, isPlayed: true } : card
        ),
        resources: {
          ...p.resources,
          [resource]: p.resources[resource] + totalStolen,
        },
        hasPlayedDevCard: true,
      };
    } else {
      // Other player - lose all of this resource
      return {
        ...p,
        resources: {
          ...p.resources,
          [resource]: 0,
        },
      };
    }
  });

  return {
    ...state,
    players: newPlayers,
  };
}

// ============================================================================
// LARGEST ARMY
// ============================================================================

/**
 * Updates the Largest Army holder based on current army sizes.
 *
 * Rules:
 * - Need at least 3 knights to qualify
 * - Must have strictly more knights than current holder to take it
 * - Once obtained, Largest Army cannot be lost unless someone beats you
 *
 * @param state - Current game state
 * @returns New game state with updated largest army holder
 */
export function updateLargestArmyHolder(state: GameState): GameState {
  const MINIMUM_ARMY_SIZE = 3;

  // Find all players with their army sizes
  const playerArmies = state.players.map(player => ({
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

  let newHolder = currentHolder;

  if (currentHolder === null) {
    // No current holder - award to largest if they meet minimum
    newHolder = {
      playerId: topPlayer.playerId,
      value: topPlayer.armySize,
    };
  } else {
    // There's a current holder - someone must beat them to take it
    if (topPlayer.armySize > currentHolder.value) {
      newHolder = {
        playerId: topPlayer.playerId,
        value: topPlayer.armySize,
      };
    } else if (topPlayer.playerId === currentHolder.playerId) {
      // Update current holder's count
      newHolder = {
        playerId: currentHolder.playerId,
        value: topPlayer.armySize,
      };
    }
  }

  return {
    ...state,
    largestArmy: newHolder,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
  const player = state.players.find(p => p.id === playerId);

  const counts: Record<DevelopmentCardType, number> = {
    knight: 0,
    victoryPoint: 0,
    roadBuilding: 0,
    yearOfPlenty: 0,
    monopoly: 0,
  };

  if (!player) return counts;

  for (const card of player.developmentCards) {
    if (!card.isPlayed) {
      counts[card.type]++;
    }
  }

  return counts;
}

/**
 * Gets all development cards a player can play this turn.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Array of playable card types
 */
export function getPlayableDevCards(
  state: GameState,
  playerId: string
): DevelopmentCardType[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.hasPlayedDevCard) return [];

  const playable = new Set<DevelopmentCardType>();

  for (const card of player.developmentCards) {
    // Skip played cards
    if (card.isPlayed) continue;

    // Skip cards bought this turn (except VP which don't need to be played)
    if (card.turnBought === state.turn && card.type !== 'victoryPoint') continue;

    // VP cards don't need to be played
    if (card.type === 'victoryPoint') continue;

    playable.add(card.type);
  }

  return Array.from(playable);
}

/**
 * Counts the number of Victory Point cards a player has.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Number of VP cards
 */
export function countVictoryPointCards(
  state: GameState,
  playerId: string
): number {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return 0;

  return player.developmentCards.filter(
    card => card.type === 'victoryPoint' && !card.isPlayed
  ).length;
}

/**
 * Checks if a player can play a specific development card.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @param cardType - Type of card to check
 * @returns True if the player can play this card
 */
export function canPlayDevCard(
  state: GameState,
  playerId: string,
  cardType: DevelopmentCardType
): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return false;

  // Can't play if already played one this turn
  if (player.hasPlayedDevCard) return false;

  // VP cards don't need to be played
  if (cardType === 'victoryPoint') return false;

  // Find a playable card of this type
  const card = player.developmentCards.find(
    c =>
      c.type === cardType &&
      !c.isPlayed &&
      c.turnBought !== state.turn
  );

  return card !== undefined;
}
