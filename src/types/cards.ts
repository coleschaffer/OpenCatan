/**
 * Card Type Definitions for OpenCatan
 *
 * Defines development cards (base game) and progress cards (C&K).
 */

/**
 * Development card types in the base game
 */
export type DevelopmentCardType =
  | 'knight'         // Move robber, counts toward Largest Army
  | 'victoryPoint'   // Worth 1 VP, revealed only at game end
  | 'roadBuilding'   // Place 2 roads for free
  | 'yearOfPlenty'   // Take any 2 resources from bank
  | 'monopoly';      // Take all of one resource type from all players

/**
 * A development card instance
 */
export interface DevelopmentCard {
  /** Unique identifier for this card */
  id?: string;
  /** Type of development card */
  type: DevelopmentCardType;
  /** Turn number when this card was bought (cannot play same turn) */
  turnBought?: number;
  /** Alias for turnBought for backward compatibility */
  purchasedTurn?: number;
  /** Whether this card has been played */
  isPlayed?: boolean;
  /** Alias for isPlayed for backward compatibility */
  played?: boolean;
}

/**
 * Development card counts in a standard deck (25 cards total)
 */
export const DEVELOPMENT_CARD_COUNTS: Record<DevelopmentCardType, number> = {
  knight: 14,
  victoryPoint: 5,
  roadBuilding: 2,
  yearOfPlenty: 2,
  monopoly: 2,
};

/**
 * Display names for development cards
 */
export const DEVELOPMENT_CARD_NAMES: Record<DevelopmentCardType, string> = {
  knight: 'Knight',
  victoryPoint: 'Victory Point',
  roadBuilding: 'Road Building',
  yearOfPlenty: 'Year of Plenty',
  monopoly: 'Monopoly',
};

/**
 * Descriptions for development cards
 */
export const DEVELOPMENT_CARD_DESCRIPTIONS: Record<DevelopmentCardType, string> = {
  knight: 'Move the robber. Steal 1 resource from a player adjacent to the new robber location.',
  victoryPoint: 'Worth 1 Victory Point. Revealed when you win.',
  roadBuilding: 'Place 2 roads as if you just built them.',
  yearOfPlenty: 'Take any 2 resources from the bank.',
  monopoly: 'Name a resource. All other players must give you all their cards of that type.',
};

// --- Cities & Knights Progress Cards ---

/**
 * Progress card categories in Cities & Knights
 */
export type ProgressCardCategory = 'trade' | 'politics' | 'science';

/**
 * Trade progress card types (yellow deck)
 */
export type TradeProgressCardType =
  | 'commercialHarbor'  // Force trade with opponent
  | 'masterMerchant'    // Look at opponent's cards, steal 2
  | 'merchant'          // Place merchant, 2:1 trade on that hex
  | 'merchantFleet'     // Choose a resource for 2:1 this turn
  | 'resourceMonopoly'  // Each player gives you 2 of one resource
  | 'tradeMonopoly';    // All players give you commodity of choice

/**
 * Politics progress card types (green deck)
 */
export type PoliticsProgressCardType =
  | 'bishop'       // Move robber, steal from all adjacent players
  | 'constitution' // Worth 1 VP
  | 'deserter'     // Remove opponent's knight
  | 'diplomat'     // Remove or displace a road
  | 'intrigue'     // Displace opponent's knight
  | 'saboteur'     // All players with more VP lose half their cards
  | 'spy'          // Steal a progress card
  | 'warlord'      // Activate all knights for free
  | 'wedding';     // Each player with more VP gives you 2 resources/commodities

/**
 * Science progress card types (blue deck)
 */
export type ScienceProgressCardType =
  | 'alchemist'    // Choose dice roll result
  | 'crane'        // Build city improvement at 1 less cost
  | 'engineer'     // Build city wall for free
  | 'inventor'     // Swap two number tokens
  | 'irrigation'   // Collect 2 grain for each grain hex with your building
  | 'medicine'     // Build city at 2 ore, 1 grain
  | 'mining'       // Collect 2 ore for each ore hex with your building
  | 'printer'      // Worth 1 VP
  | 'roadBuilding' // Build 2 roads for free
  | 'smith';       // Upgrade 2 knights for free

/**
 * All progress card types
 */
export type ProgressCardType =
  | TradeProgressCardType
  | PoliticsProgressCardType
  | ScienceProgressCardType;

/**
 * A progress card instance (C&K)
 */
export interface ProgressCard {
  /** Unique identifier for this card */
  id: string;
  /** Type of progress card */
  type: ProgressCardType;
  /** Category of this progress card */
  category: ProgressCardCategory;
  /** Turn number when this card was acquired */
  turnAcquired: number;
  /** Whether this card has been played */
  isPlayed: boolean;
}

/**
 * Progress card counts per deck (C&K)
 */
export const PROGRESS_CARD_COUNTS: Record<ProgressCardCategory, Record<string, number>> = {
  trade: {
    commercialHarbor: 2,
    masterMerchant: 2,
    merchant: 6,
    merchantFleet: 2,
    resourceMonopoly: 4,
    tradeMonopoly: 2,
  },
  politics: {
    bishop: 2,
    constitution: 1,
    deserter: 2,
    diplomat: 2,
    intrigue: 2,
    saboteur: 2,
    spy: 3,
    warlord: 2,
    wedding: 2,
  },
  science: {
    alchemist: 2,
    crane: 2,
    engineer: 1,
    inventor: 2,
    irrigation: 2,
    medicine: 2,
    mining: 2,
    printer: 1,
    roadBuilding: 2,
    smith: 2,
  },
};

/**
 * Display names for progress cards
 */
export const PROGRESS_CARD_NAMES: Record<ProgressCardType, string> = {
  // Trade
  commercialHarbor: 'Commercial Harbor',
  masterMerchant: 'Master Merchant',
  merchant: 'Merchant',
  merchantFleet: 'Merchant Fleet',
  resourceMonopoly: 'Resource Monopoly',
  tradeMonopoly: 'Trade Monopoly',
  // Politics
  bishop: 'Bishop',
  constitution: 'Constitution',
  deserter: 'Deserter',
  diplomat: 'Diplomat',
  intrigue: 'Intrigue',
  saboteur: 'Saboteur',
  spy: 'Spy',
  warlord: 'Warlord',
  wedding: 'Wedding',
  // Science
  alchemist: 'Alchemist',
  crane: 'Crane',
  engineer: 'Engineer',
  inventor: 'Inventor',
  irrigation: 'Irrigation',
  medicine: 'Medicine',
  mining: 'Mining',
  printer: 'Printer',
  roadBuilding: 'Road Building',
  smith: 'Smith',
};

/**
 * Progress card descriptions
 */
export const PROGRESS_CARD_DESCRIPTIONS: Record<ProgressCardType, string> = {
  // Trade
  commercialHarbor: 'Force any opponent to trade with you at 2:1.',
  masterMerchant: "Look at any opponent's cards and steal 2 resources of your choice.",
  merchant: "Place the merchant on any hex. You get 2:1 trade for that hex's resource.",
  merchantFleet: 'Choose a resource. Trade it 2:1 for the rest of your turn.',
  resourceMonopoly: 'Name a resource. Each opponent gives you 2 of that resource.',
  tradeMonopoly: 'Name a commodity. Each opponent gives you 1 of that commodity.',
  // Politics
  bishop: 'Move the robber. Steal 1 resource from each player adjacent to the new location.',
  constitution: 'Worth 1 Victory Point. Cannot be stolen.',
  deserter: "Remove any opponent's knight from the board.",
  diplomat: 'Remove any open road from the board, or move your own.',
  intrigue: "Displace any opponent's knight with one of your own.",
  saboteur: 'Each player with more VP than you discards half their cards.',
  spy: "Look at any opponent's progress cards and steal one.",
  warlord: 'Activate all your knights for free.',
  wedding: 'Each player with more VP than you gives you 2 resources/commodities.',
  // Science
  alchemist: 'Before rolling, choose the result of both dice.',
  crane: 'Build a city improvement for 1 fewer commodity.',
  engineer: 'Build a city wall for free.',
  inventor: 'Swap any two number tokens on the board (except 6 and 8).',
  irrigation: 'Collect 2 grain for each grain hex where you have a building.',
  medicine: 'Build a city for only 2 ore and 1 grain.',
  mining: 'Collect 2 ore for each ore hex where you have a building.',
  printer: 'Worth 1 Victory Point. Cannot be stolen.',
  roadBuilding: 'Build 2 roads for free.',
  smith: 'Upgrade 2 of your knights for free.',
};

/**
 * Maps progress card types to their category
 */
export function getProgressCardCategory(type: ProgressCardType): ProgressCardCategory {
  if (type in PROGRESS_CARD_COUNTS.trade) return 'trade';
  if (type in PROGRESS_CARD_COUNTS.politics) return 'politics';
  return 'science';
}

/**
 * Creates the initial development card deck (shuffled)
 */
export function createDevelopmentDeck(): DevelopmentCardType[] {
  const deck: DevelopmentCardType[] = [];

  for (const [type, count] of Object.entries(DEVELOPMENT_CARD_COUNTS)) {
    for (let i = 0; i < count; i++) {
      deck.push(type as DevelopmentCardType);
    }
  }

  return deck;
}

/**
 * Creates the initial progress card deck for a category (C&K)
 */
export function createProgressDeck(category: ProgressCardCategory): ProgressCardType[] {
  const deck: ProgressCardType[] = [];
  const counts = PROGRESS_CARD_COUNTS[category];

  for (const [type, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      deck.push(type as ProgressCardType);
    }
  }

  return deck;
}

/**
 * Total number of development cards in the deck
 */
export const TOTAL_DEVELOPMENT_CARDS = Object.values(DEVELOPMENT_CARD_COUNTS).reduce(
  (sum, count) => sum + count,
  0
);
