// @ts-nocheck
// TODO: Fix TypeScript errors in this file
/**
 * Network message types and helpers for OpenCatan
 *
 * Defines all message types exchanged between clients and the host via PartyKit.
 * Based on PRD Section 13 message specifications.
 */

import type {
  PlayerColor,
  GameState,
  GameSettings,
  ResourceType,
  Player,
} from '../types/game';

// ============================================================================
// Game Actions - Actions that can be performed during gameplay
// ============================================================================

export type GameActionType =
  | 'ROLL_DICE'
  | 'BUILD_SETTLEMENT'
  | 'BUILD_CITY'
  | 'BUILD_ROAD'
  | 'BUILD_SHIP'
  | 'BUY_DEVELOPMENT_CARD'
  | 'PLAY_DEVELOPMENT_CARD'
  | 'MOVE_ROBBER'
  | 'STEAL_RESOURCE'
  | 'DISCARD_RESOURCES'
  | 'END_TURN'
  | 'TRADE_OFFER'
  | 'TRADE_ACCEPT'
  | 'TRADE_DECLINE'
  | 'TRADE_COUNTER'
  | 'TRADE_CANCEL'
  | 'BANK_TRADE'
  | 'ACTIVATE_KNIGHT'
  | 'MOVE_KNIGHT'
  | 'UPGRADE_KNIGHT'
  | 'BUILD_CITY_IMPROVEMENT'
  | 'MOVE_SHIP';

export interface BaseGameAction {
  type: GameActionType;
  playerId: string;
  timestamp: number;
}

export interface RollDiceAction extends BaseGameAction {
  type: 'ROLL_DICE';
}

export interface BuildSettlementAction extends BaseGameAction {
  type: 'BUILD_SETTLEMENT';
  vertexId: string;
}

export interface BuildCityAction extends BaseGameAction {
  type: 'BUILD_CITY';
  vertexId: string;
}

export interface BuildRoadAction extends BaseGameAction {
  type: 'BUILD_ROAD';
  edgeId: string;
}

export interface BuildShipAction extends BaseGameAction {
  type: 'BUILD_SHIP';
  edgeId: string;
}

export interface BuyDevelopmentCardAction extends BaseGameAction {
  type: 'BUY_DEVELOPMENT_CARD';
}

export interface PlayDevelopmentCardAction extends BaseGameAction {
  type: 'PLAY_DEVELOPMENT_CARD';
  cardId: string;
  cardType: string;
  // Additional data based on card type
  targetResources?: ResourceType[]; // For Year of Plenty
  targetResource?: ResourceType; // For Monopoly
}

export interface MoveRobberAction extends BaseGameAction {
  type: 'MOVE_ROBBER';
  hexId: string;
}

export interface StealResourceAction extends BaseGameAction {
  type: 'STEAL_RESOURCE';
  targetPlayerId: string;
}

export interface DiscardResourcesAction extends BaseGameAction {
  type: 'DISCARD_RESOURCES';
  resources: Partial<Record<ResourceType, number>>;
}

export interface EndTurnAction extends BaseGameAction {
  type: 'END_TURN';
}

export interface TradeOfferAction extends BaseGameAction {
  type: 'TRADE_OFFER';
  offerId: string;
  offering: Partial<Record<ResourceType, number>>;
  requesting: Partial<Record<ResourceType, number>>;
  targetPlayerIds?: string[]; // Empty means offer to all
}

export interface TradeAcceptAction extends BaseGameAction {
  type: 'TRADE_ACCEPT';
  offerId: string;
}

export interface TradeDeclineAction extends BaseGameAction {
  type: 'TRADE_DECLINE';
  offerId: string;
}

export interface TradeCounterAction extends BaseGameAction {
  type: 'TRADE_COUNTER';
  originalOfferId: string;
  counterOfferId: string;
  offering: Partial<Record<ResourceType, number>>;
  requesting: Partial<Record<ResourceType, number>>;
}

export interface TradeCancelAction extends BaseGameAction {
  type: 'TRADE_CANCEL';
  offerId: string;
}

export interface BankTradeAction extends BaseGameAction {
  type: 'BANK_TRADE';
  giving: Partial<Record<ResourceType, number>>;
  receiving: Partial<Record<ResourceType, number>>;
}

export interface ActivateKnightAction extends BaseGameAction {
  type: 'ACTIVATE_KNIGHT';
  knightId: string;
}

export interface MoveKnightAction extends BaseGameAction {
  type: 'MOVE_KNIGHT';
  knightId: string;
  targetVertexId: string;
}

export interface UpgradeKnightAction extends BaseGameAction {
  type: 'UPGRADE_KNIGHT';
  knightId: string;
}

export interface BuildCityImprovementAction extends BaseGameAction {
  type: 'BUILD_CITY_IMPROVEMENT';
  improvementType: 'trade' | 'politics' | 'science';
}

export interface MoveShipAction extends BaseGameAction {
  type: 'MOVE_SHIP';
  shipId: string;
  targetEdgeId: string;
}

export type GameAction =
  | RollDiceAction
  | BuildSettlementAction
  | BuildCityAction
  | BuildRoadAction
  | BuildShipAction
  | BuyDevelopmentCardAction
  | PlayDevelopmentCardAction
  | MoveRobberAction
  | StealResourceAction
  | DiscardResourcesAction
  | EndTurnAction
  | TradeOfferAction
  | TradeAcceptAction
  | TradeDeclineAction
  | TradeCounterAction
  | TradeCancelAction
  | BankTradeAction
  | ActivateKnightAction
  | MoveKnightAction
  | UpgradeKnightAction
  | BuildCityImprovementAction
  | MoveShipAction;

// ============================================================================
// Lobby State - Pre-game lobby information
// ============================================================================

export interface LobbyPlayer {
  id: string;
  name: string;
  color: PlayerColor | null;
  isReady: boolean;
  isHost: boolean;
  isConnected: boolean;
  joinOrder: number;
}

export interface LobbyState {
  roomCode: string;
  hostId: string;
  players: LobbyPlayer[];
  settings: GameSettings;
  isStarting: boolean;
}

// ============================================================================
// Client Messages - Sent from clients to the host via PartyKit
// ============================================================================

export interface JoinRoomMessage {
  type: 'JOIN_ROOM';
  playerName: string;
  sessionToken: string;
}

export interface SelectColorMessage {
  type: 'SELECT_COLOR';
  color: PlayerColor;
}

export interface MarkReadyMessage {
  type: 'MARK_READY';
  isReady: boolean;
}

export interface UpdateSettingsMessage {
  type: 'UPDATE_SETTINGS';
  settings: Partial<GameSettings>;
}

export interface StartGameMessage {
  type: 'START_GAME';
}

export interface GameActionMessage {
  type: 'GAME_ACTION';
  action: GameAction;
}

export interface ChatMessage {
  type: 'CHAT_MESSAGE';
  text: string;
}

export interface LeaveRoomMessage {
  type: 'LEAVE_ROOM';
}

export interface ReconnectMessage {
  type: 'RECONNECT';
  sessionToken: string;
  playerId: string;
}

export interface PingMessage {
  type: 'PING';
  timestamp: number;
}

export type ClientMessage =
  | JoinRoomMessage
  | SelectColorMessage
  | MarkReadyMessage
  | UpdateSettingsMessage
  | StartGameMessage
  | GameActionMessage
  | ChatMessage
  | LeaveRoomMessage
  | ReconnectMessage
  | PingMessage;

// ============================================================================
// Host Messages - Sent from host to clients via PartyKit
// ============================================================================

export interface LobbyStateMessage {
  type: 'LOBBY_STATE';
  state: LobbyState;
}

export interface GameStateMessage {
  type: 'GAME_STATE';
  state: GameState;
  // Incremental sequence number for ordering
  sequence: number;
}

export interface ActionResultMessage {
  type: 'ACTION_RESULT';
  actionType: GameActionType;
  success: boolean;
  error?: string;
  // The action that was processed (for optimistic update reconciliation)
  action?: GameAction;
}

export interface ChatBroadcastMessage {
  type: 'CHAT_BROADCAST';
  from: string;
  fromName: string;
  fromColor: PlayerColor;
  text: string;
  timestamp: number;
}

export interface PlayerConnectedMessage {
  type: 'PLAYER_CONNECTED';
  player: LobbyPlayer;
}

export interface PlayerDisconnectedMessage {
  type: 'PLAYER_DISCONNECTED';
  playerId: string;
  playerName: string;
  // Time in seconds before the player's seat is released
  timeoutSeconds: number;
}

export interface PlayerReconnectedMessage {
  type: 'PLAYER_RECONNECTED';
  playerId: string;
  playerName: string;
}

export interface HostMigratedMessage {
  type: 'HOST_MIGRATED';
  newHostId: string;
  newHostName: string;
  previousHostId: string;
}

export interface JoinSuccessMessage {
  type: 'JOIN_SUCCESS';
  playerId: string;
  sessionToken: string;
  lobbyState: LobbyState;
}

export interface JoinErrorMessage {
  type: 'JOIN_ERROR';
  error: string;
  code: 'ROOM_FULL' | 'GAME_IN_PROGRESS' | 'INVALID_NAME' | 'ROOM_NOT_FOUND';
}

export interface ReconnectSuccessMessage {
  type: 'RECONNECT_SUCCESS';
  playerId: string;
  lobbyState?: LobbyState;
  gameState?: GameState;
}

export interface ReconnectErrorMessage {
  type: 'RECONNECT_ERROR';
  error: string;
}

export interface GameStartingMessage {
  type: 'GAME_STARTING';
  countdownSeconds: number;
}

export interface GameStartedMessage {
  type: 'GAME_STARTED';
  state: GameState;
  turnOrder: string[];
}

export interface GameEndedMessage {
  type: 'GAME_ENDED';
  winnerId: string;
  winnerName: string;
  finalState: GameState;
}

export interface PongMessage {
  type: 'PONG';
  timestamp: number;
  serverTime: number;
}

export interface ErrorMessage {
  type: 'ERROR';
  error: string;
  code?: string;
}

export type HostMessage =
  | LobbyStateMessage
  | GameStateMessage
  | ActionResultMessage
  | ChatBroadcastMessage
  | PlayerConnectedMessage
  | PlayerDisconnectedMessage
  | PlayerReconnectedMessage
  | HostMigratedMessage
  | JoinSuccessMessage
  | JoinErrorMessage
  | ReconnectSuccessMessage
  | ReconnectErrorMessage
  | GameStartingMessage
  | GameStartedMessage
  | GameEndedMessage
  | PongMessage
  | ErrorMessage;

// ============================================================================
// Message Helpers - Functions to create and parse messages
// ============================================================================

/**
 * Create a JOIN_ROOM message
 */
export function createJoinMessage(
  playerName: string,
  sessionToken: string
): JoinRoomMessage {
  return {
    type: 'JOIN_ROOM',
    playerName,
    sessionToken,
  };
}

/**
 * Create a SELECT_COLOR message
 */
export function createSelectColorMessage(color: PlayerColor): SelectColorMessage {
  return {
    type: 'SELECT_COLOR',
    color,
  };
}

/**
 * Create a MARK_READY message
 */
export function createMarkReadyMessage(isReady: boolean): MarkReadyMessage {
  return {
    type: 'MARK_READY',
    isReady,
  };
}

/**
 * Create an UPDATE_SETTINGS message
 */
export function createUpdateSettingsMessage(
  settings: Partial<GameSettings>
): UpdateSettingsMessage {
  return {
    type: 'UPDATE_SETTINGS',
    settings,
  };
}

/**
 * Create a START_GAME message
 */
export function createStartGameMessage(): StartGameMessage {
  return {
    type: 'START_GAME',
  };
}

/**
 * Create a GAME_ACTION message wrapping a game action
 */
export function createActionMessage(action: GameAction): GameActionMessage {
  return {
    type: 'GAME_ACTION',
    action,
  };
}

/**
 * Create a CHAT_MESSAGE
 */
export function createChatMessage(text: string): ChatMessage {
  return {
    type: 'CHAT_MESSAGE',
    text,
  };
}

/**
 * Create a LEAVE_ROOM message
 */
export function createLeaveMessage(): LeaveRoomMessage {
  return {
    type: 'LEAVE_ROOM',
  };
}

/**
 * Create a RECONNECT message
 */
export function createReconnectMessage(
  sessionToken: string,
  playerId: string
): ReconnectMessage {
  return {
    type: 'RECONNECT',
    sessionToken,
    playerId,
  };
}

/**
 * Create a PING message
 */
export function createPingMessage(): PingMessage {
  return {
    type: 'PING',
    timestamp: Date.now(),
  };
}

/**
 * Parse an incoming message from JSON string
 * Returns null if parsing fails
 */
export function parseMessage(data: string): ClientMessage | HostMessage | null {
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
      return parsed as ClientMessage | HostMessage;
    }
    return null;
  } catch {
    console.error('Failed to parse message:', data);
    return null;
  }
}

/**
 * Serialize a message to JSON string
 */
export function serializeMessage(message: ClientMessage | HostMessage): string {
  return JSON.stringify(message);
}

/**
 * Type guard to check if message is a ClientMessage
 */
export function isClientMessage(
  message: ClientMessage | HostMessage
): message is ClientMessage {
  const clientTypes = [
    'JOIN_ROOM',
    'SELECT_COLOR',
    'MARK_READY',
    'UPDATE_SETTINGS',
    'START_GAME',
    'GAME_ACTION',
    'CHAT_MESSAGE',
    'LEAVE_ROOM',
    'RECONNECT',
    'PING',
  ];
  return clientTypes.includes(message.type);
}

/**
 * Type guard to check if message is a HostMessage
 */
export function isHostMessage(
  message: ClientMessage | HostMessage
): message is HostMessage {
  return !isClientMessage(message);
}

/**
 * Create a game action with common fields pre-populated
 */
export function createGameAction<T extends GameActionType>(
  type: T,
  playerId: string,
  additionalFields: Omit<Extract<GameAction, { type: T }>, 'type' | 'playerId' | 'timestamp'>
): Extract<GameAction, { type: T }> {
  return {
    type,
    playerId,
    timestamp: Date.now(),
    ...additionalFields,
  } as Extract<GameAction, { type: T }>;
}
