/**
 * Game State Type Definitions for OpenCatan
 *
 * Defines game phases, modes, settings, and the main game state interface.
 */

import type { ResourceType, ResourceCounts, CommodityType } from './common';
import type { Player } from './player';
import type { HexCoord, VertexCoord, EdgeCoord } from './coordinates';
import type { HexTile, Building, Road, Knight, Port, MetropolisType } from './board';
import type { DevelopmentCardType, ProgressCardCategory } from './cards';

/**
 * All possible game phases
 */
export type GamePhase =
  // Pre-game
  | 'lobby'              // Waiting for players, configuring settings

  // Setup phases (snake draft)
  | 'setup-settlement-1' // First settlement placement (1->2->3->4)
  | 'setup-road-1'       // Road after first settlement
  | 'setup-settlement-2' // Second settlement placement (4->3->2->1)
  | 'setup-road-2'       // Road after second settlement

  // Turn phases
  | 'roll'               // Must roll dice
  | 'discard'            // Players with >7 cards must discard half
  | 'robber-move'        // Active player moves robber
  | 'robber-steal'       // Active player chooses victim to steal from
  | 'pirate-move'        // Active player moves pirate (Seafarers)
  | 'pirate-steal'       // Active player steals from ship owner

  // Main phase
  | 'main'               // Can build, trade, play dev cards

  // Special action phases
  | 'road-building'      // Placing roads from Road Building card
  | 'year-of-plenty'     // Selecting 2 resources from bank
  | 'monopoly'           // Selecting resource type to monopolize

  // C&K specific phases
  | 'knight-move'        // Moving a knight
  | 'knight-action'      // Performing knight action (chase robber, etc.)
  | 'barbarian-attack'   // Resolving barbarian invasion
  | 'progress-card'      // Resolving a progress card effect

  // Game end
  | 'ended';             // Game has concluded

/**
 * Game mode determines which rules and components are used
 */
export type GameMode =
  | 'base'               // Base game (3-4 players)
  | 'base-5-6'           // Base game with 5-6 player extension
  | 'cities-knights'     // Cities & Knights expansion
  | 'cities-knights-5-6' // C&K with 5-6 player extension
  | 'seafarers'          // Seafarers expansion
  | 'seafarers-5-6';     // Seafarers with 5-6 player extension

/**
 * Turn timer options in seconds
 */
export type TurnTimerOption = 60 | 90 | 120 | 180 | 0; // 0 = unlimited

/**
 * Victory point target options
 */
export type VictoryPointTarget = 8 | 10 | 12 | 14;

/**
 * Discard limit (hand size before must discard on 7)
 */
export type DiscardLimit = 7 | 8 | 9 | 10;

/**
 * Map type selection
 */
export type MapType = 'random' | string; // 'random' or preset name

/**
 * Game settings configured in the lobby
 */
export interface GameSettings {
  /** Game mode (base, C&K, Seafarers, etc.) */
  mode: GameMode;
  /** Number of players (3-6 depending on mode) */
  playerCount: number;
  /** Victory points needed to win */
  victoryPoints: VictoryPointTarget;
  /** Turn timer in seconds (0 = unlimited) */
  turnTimer: TurnTimerOption;
  /** Hand size before discard on 7 */
  discardLimit: DiscardLimit;
  /** Map selection (random or preset name) */
  map: MapType;
  /** Friendly robber rule - can't place on low VP players */
  friendlyRobber: boolean;
  /** Hide bank card counts (show ? instead of numbers) */
  hideBankCards: boolean;
  /** Random seed for reproducible board generation */
  randomSeed?: number;
}

/**
 * Default game settings
 */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  mode: 'base',
  playerCount: 4,
  victoryPoints: 10,
  turnTimer: 90,
  discardLimit: 7,
  map: 'random',
  friendlyRobber: false,
  hideBankCards: false,
};

/**
 * Dice roll result
 */
export interface DiceRoll {
  /** First die value (1-6) */
  die1: number;
  /** Second die value (1-6) */
  die2: number;
  /** Sum of both dice */
  total: number;
  /** Event die result for C&K (null if not C&K) */
  eventDie?: EventDieResult;
}

/**
 * Event die faces for Cities & Knights
 */
export type EventDieResult =
  | 'barbarian'  // Barbarians advance
  | 'trade'      // Trade progress card
  | 'politics'   // Politics progress card
  | 'science';   // Science progress card

/**
 * Response status for a trade offer
 */
export type TradeResponseStatus = 'pending' | 'accepted' | 'declined' | 'countered';

/**
 * Trade offer status
 */
export type TradeOfferStatus = 'pending' | 'completed' | 'cancelled' | 'expired';

/**
 * Counter-offer details
 */
export interface TradeCounterOffer {
  offering: Partial<ResourceCounts>;
  requesting: Partial<ResourceCounts>;
}

/**
 * Trade offer between players
 */
export interface TradeOffer {
  /** Unique identifier for this offer */
  id: string;
  /** Player making the offer */
  fromPlayerId: string;
  /** Specific player the offer is to (null = all players) */
  toPlayerId: string | null;
  /** Target player IDs for the trade offer */
  targetPlayerIds?: string[];
  /** Resources being offered */
  offering: Partial<ResourceCounts>;
  /** Resources being requested */
  requesting: Partial<ResourceCounts>;
  /** Commodities being offered (C&K) */
  offeringCommodities?: Partial<Record<CommodityType, number>>;
  /** Commodities being requested (C&K) */
  requestingCommodities?: Partial<Record<CommodityType, number>>;
  /** Players who have declined */
  declinedBy: string[];
  /** Whether the trade is still active */
  isActive: boolean;
  /** Timestamp when offer was created */
  createdAt: number;
  /** Response status for each player */
  responses?: Record<string, TradeResponseStatus>;
  /** Counter-offers from players */
  counterOffers?: Record<string, TradeCounterOffer>;
  /** Overall status of the trade offer */
  status?: TradeOfferStatus;
}

/**
 * Merchant piece location (C&K)
 */
export interface MerchantState {
  /** Hex where the merchant is placed */
  hex: HexCoord;
  /** Player who controls the merchant */
  playerId: string;
}

/**
 * Achievement state (Longest Road, Largest Army)
 */
export interface AchievementState {
  /** Player who currently holds this achievement */
  playerId: string;
  /** Current value (road length or army size) */
  value?: number;
  /** Road length for longest road */
  length?: number;
  /** Army size for largest army */
  count?: number;
  [key: string]: string | number | undefined;
}

/**
 * A log entry recording a game event
 */
export interface LogEntry {
  /** Unique log entry ID */
  id: string;
  /** Type of log entry */
  type: string;
  /** Primary player involved (if any) */
  playerId?: string;
  /** Player name for display */
  playerName?: string;
  /** Player color for display */
  playerColor?: import('./common').PlayerColor;
  /** Human-readable message */
  message: string;
  /** Timestamp of the event */
  timestamp: number;
  /** Turn number when this happened */
  turn?: number;
  /** Additional data for this log entry */
  data?: Record<string, unknown>;
  /** Visibility level for this log entry */
  visibility?: 'public' | 'private' | 'spectator' | 'hidden' | 'all' | 'self' | 'involved';
}

/**
 * A chat message from a player
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** ID of the player who sent the message */
  playerId: string;
  /** Player name for display */
  playerName?: string;
  /** Player color for display */
  playerColor?: import('./common').PlayerColor;
  /** Message text content */
  text?: string;
  /** Alias for text */
  message?: string;
  /** Timestamp when message was sent */
  timestamp: number;
}

/**
 * Complete game state - the authoritative state managed by host
 */
export interface GameState {
  // --- Meta ---

  /** Unique room code for this game */
  roomCode: string;
  /** Game mode */
  mode: GameMode;
  /** Game configuration settings */
  settings: GameSettings;
  /** Version counter for state synchronization */
  version: number;
  /** Timestamp of last state update */
  lastUpdated: number;

  // --- Phase ---

  /** Current game phase */
  phase: GamePhase;
  /** Current turn number (0 during setup) */
  turn: number;
  /** ID of the player whose turn it is */
  currentPlayerId: string;
  /** Seconds remaining in current turn */
  turnTimeRemaining: number;
  /** Timestamp when turn started */
  turnStartedAt: number;

  // --- Board ---

  /** All hex tiles on the board */
  tiles: HexTile[];
  /** All buildings (settlements and cities) */
  buildings: Building[];
  /** All roads and ships */
  roads: Road[];
  /** All ports */
  ports: Port[];
  /** All knights on the board (C&K) */
  knights?: Knight[];

  // --- Players ---

  /** All players in the game */
  players: Player[];
  /** Turn order (array of player IDs) */
  turnOrder: string[];
  /** Player IDs who need to discard (during discard phase) */
  playersNeedingToDiscard: string[];
  /** Resources each player must discard (during discard phase) */
  discardAmounts: Record<string, number>;

  // --- Special Pieces ---

  /** Current robber location */
  robberLocation: HexCoord;
  /** Current pirate location (Seafarers) */
  pirateLocation?: HexCoord;
  /** Merchant piece state (C&K) */
  merchant?: MerchantState;

  // --- Decks ---

  /** Development card deck (card types, not instances) */
  developmentDeck: DevelopmentCardType[];
  /** Number of development cards remaining */
  developmentDeckCount: number;
  /** Progress card decks remaining count (C&K) */
  progressDecks?: Record<ProgressCardCategory, number>;

  // --- Bank ---

  /** Bank resource supply */
  bank: ResourceCounts;

  // --- Achievements ---

  /** Longest Road holder */
  longestRoad: AchievementState | null;
  /** Largest Army holder (base game) */
  largestArmy: AchievementState | null;
  /** Defender of Catan holder (C&K) */
  defenderOfCatan?: AchievementState | null;
  /** Metropolis holders (C&K) - one per type */
  metropolises?: Record<MetropolisType, string | null>;

  // --- C&K Specific ---

  /** Barbarian track position (0-7, attack at 7) */
  barbarianPosition?: number;
  /** Barbarian strength (number of cities on the board) */
  barbarianStrength?: number;
  /** Total knight strength of all active knights */
  totalKnightStrength?: number;

  // --- Active Trades ---

  /** Currently active trade offers */
  activeOffers: TradeOffer[];

  // --- Action State ---

  /** Last dice roll result */
  lastRoll?: DiceRoll;
  /** Roads remaining to place (Road Building card) */
  roadBuildingRemaining?: number;
  /** Alias for roadBuildingRemaining */
  roadBuildingRoadsPlaced?: number;
  /** Resources remaining to select (Year of Plenty) */
  yearOfPlentyRemaining?: number;
  /** Pending trade offers */
  pendingTradeOffers?: TradeOffer[];
  /** Setup phase: which player index is placing */
  setupPlayerIndex?: number;
  /** Setup phase: whether going forward or backward in snake draft */
  setupDirection?: 'forward' | 'backward';

  // --- History ---

  /** Game log entries */
  log: LogEntry[];
  /** Chat messages */
  chat: ChatMessage[];

  // --- Winner ---

  /** ID of the winning player (only set when phase is 'ended') */
  winnerId?: string;
  /** Final scores for all players (only set when phase is 'ended') */
  finalScores?: Record<string, number>;
}

// --- Game Actions ---

/**
 * All possible game actions that can be performed by players
 */
export type GameAction =
  // Setup actions
  | { type: 'PLACE_SETTLEMENT'; vertex: VertexCoord }
  | { type: 'PLACE_ROAD'; edge: EdgeCoord }
  | { type: 'PLACE_SHIP'; edge: EdgeCoord }

  // Roll phase
  | { type: 'ROLL_DICE' }

  // Discard phase
  | { type: 'DISCARD_RESOURCES'; resources: Partial<ResourceCounts> }

  // Robber/Pirate
  | { type: 'MOVE_ROBBER'; hex: HexCoord }
  | { type: 'MOVE_PIRATE'; hex: HexCoord }
  | { type: 'STEAL_RESOURCE'; victimId: string }
  | { type: 'SKIP_STEAL' } // When no valid victims

  // Building (main phase)
  | { type: 'BUILD_ROAD'; edge: EdgeCoord }
  | { type: 'BUILD_SHIP'; edge: EdgeCoord }
  | { type: 'BUILD_SETTLEMENT'; vertex: VertexCoord }
  | { type: 'BUILD_CITY'; vertex: VertexCoord }
  | { type: 'BUILD_CITY_WALL'; vertex: VertexCoord }
  | { type: 'MOVE_SHIP'; from: EdgeCoord; to: EdgeCoord }

  // Development cards
  | { type: 'BUY_DEVELOPMENT_CARD' }
  | { type: 'PLAY_KNIGHT'; hex: HexCoord; victimId?: string }
  | { type: 'PLAY_ROAD_BUILDING' }
  | { type: 'PLAY_YEAR_OF_PLENTY'; resources: [ResourceType, ResourceType] }
  | { type: 'PLAY_MONOPOLY'; resource: ResourceType }
  | { type: 'COMPLETE_ROAD_BUILDING' } // When done placing roads

  // Trading
  | { type: 'OFFER_TRADE'; offer: Omit<TradeOffer, 'id' | 'declinedBy' | 'isActive' | 'createdAt'> }
  | { type: 'ACCEPT_TRADE'; offerId: string }
  | { type: 'DECLINE_TRADE'; offerId: string }
  | { type: 'CANCEL_TRADE'; offerId: string }
  | { type: 'COUNTER_OFFER'; originalOfferId: string; counterOffer: Omit<TradeOffer, 'id' | 'declinedBy' | 'isActive' | 'createdAt'> }
  | { type: 'BANK_TRADE'; give: { resource: ResourceType; amount: number }; receive: { resource: ResourceType; amount: number } }

  // Turn management
  | { type: 'END_TURN' }

  // C&K Knights
  | { type: 'BUILD_KNIGHT'; vertex: VertexCoord }
  | { type: 'ACTIVATE_KNIGHT'; knightId: string }
  | { type: 'UPGRADE_KNIGHT'; knightId: string }
  | { type: 'MOVE_KNIGHT'; knightId: string; vertex: VertexCoord }
  | { type: 'KNIGHT_CHASE_ROBBER'; knightId: string; hex: HexCoord }
  | { type: 'KNIGHT_DISPLACE'; knightId: string; targetKnightId: string }

  // C&K City Improvements
  | { type: 'BUILD_CITY_IMPROVEMENT'; improvementType: MetropolisType }

  // C&K Progress Cards
  | { type: 'PLAY_PROGRESS_CARD'; cardId: string; params?: Record<string, unknown> }

  // 5-6 Player Extension
  | { type: 'SPECIAL_BUILD' }; // Enter special build phase

/**
 * Result of processing a game action
 */
export interface ActionResult {
  /** Whether the action was successful */
  success: boolean;
  /** Error message if action failed */
  error?: string;
  /** Updated game state (only if successful) */
  newState?: GameState;
}

/**
 * Game event types for UI/audio feedback
 */
export type GameEventType =
  | 'DICE_ROLLED'
  | 'RESOURCES_DISTRIBUTED'
  | 'SETTLEMENT_BUILT'
  | 'CITY_BUILT'
  | 'ROAD_BUILT'
  | 'DEV_CARD_BOUGHT'
  | 'DEV_CARD_PLAYED'
  | 'ROBBER_MOVED'
  | 'CARD_STOLEN'
  | 'TRADE_COMPLETED'
  | 'LONGEST_ROAD_CHANGED'
  | 'LARGEST_ARMY_CHANGED'
  | 'VICTORY'
  | 'TURN_STARTED'
  | 'PHASE_CHANGED';

/**
 * Game event for UI/audio feedback
 */
export interface GameEvent {
  type: GameEventType;
  data?: Record<string, unknown>;
  timestamp: number;
}
