/**
 * OpenCatan Network Layer
 *
 * Client-side networking for real-time multiplayer via PartyKit.
 *
 * Architecture:
 * - partyClient: Singleton PartyKit WebSocket connection wrapper
 * - hostManager: Host-specific game logic (runs authoritative game state)
 * - peerManager: Non-host client logic (sends actions, receives state)
 * - networkMiddleware: Redux middleware for network synchronization
 * - hooks: React hooks for component integration
 * - session: Browser session management for reconnection
 * - messages: Type definitions for all network messages
 */

// ============================================================================
// Singleton Clients
// ============================================================================

export { partyClient, type ConnectionState } from './partyClient';
export { hostManager } from './hostManager';
export { peerManager } from './peerManager';

// ============================================================================
// Redux Middleware
// ============================================================================

export { networkMiddleware, createNetworkAction } from './networkMiddleware';

// ============================================================================
// React Hooks
// ============================================================================

export {
  usePartyConnection,
  useGameActions,
  useChat,
  type UsePartyConnectionReturn,
  type UseGameActionsReturn,
  type UseChatReturn,
  type TradeOfferInput,
  type ResourceTradeInput,
  type PlayDevCardParams,
  type ChatMessageDisplay,
} from './hooks';

// ============================================================================
// Constants
// ============================================================================

export {
  PARTYKIT_HOST,
  PARTYKIT_PARTY,
  CONNECTION_TIMEOUT_MS,
  PING_INTERVAL_MS,
  MAX_RECONNECT_ATTEMPTS,
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
  PLAYER_DISCONNECT_TIMEOUT_MS,
  STATE_SYNC_INTERVAL_MS,
  PENDING_ACTION_TIMEOUT_MS,
  ROOM_CODE_LENGTH,
  ROOM_CODE_CHARACTERS,
  ROOM_EXPIRATION_MS,
  generateRoomCode,
} from './constants';

// ============================================================================
// Session Management
// ============================================================================

export {
  // Constants
  SESSION_TOKEN_KEY,
  PLAYER_ID_KEY,
  ROOM_CODE_KEY,
  PLAYER_NAME_KEY,
  SESSION_EXPIRY_MS,

  // Types
  type SessionData,

  // Token Management
  getSessionToken,
  setSessionToken,
  generateSessionToken,
  refreshSessionExpiry,

  // Player ID
  getPlayerId,
  setPlayerId,
  clearPlayerId,

  // Room Code
  getRoomCode,
  setRoomCode,
  clearRoomCode,

  // Player Name
  getPlayerName,
  setPlayerName,
  clearPlayerName,

  // Full Session
  getSessionData,
  saveSessionOnJoin,
  clearSession,
  clearRoomSession,
  canReconnect,
  getReconnectionData,
} from './session';

// ============================================================================
// Messages (from existing messages.ts)
// ============================================================================

export {
  // Game Action Types
  type GameActionType,
  type GameAction,
  type BaseGameAction,
  type RollDiceAction,
  type BuildSettlementAction,
  type BuildCityAction,
  type BuildRoadAction,
  type BuildShipAction,
  type BuyDevelopmentCardAction,
  type PlayDevelopmentCardAction,
  type MoveRobberAction,
  type StealResourceAction,
  type DiscardResourcesAction,
  type EndTurnAction,
  type TradeOfferAction,
  type TradeAcceptAction,
  type TradeDeclineAction,
  type TradeCounterAction,
  type TradeCancelAction,
  type BankTradeAction,
  type ActivateKnightAction,
  type MoveKnightAction,
  type UpgradeKnightAction,
  type BuildCityImprovementAction,
  type MoveShipAction,

  // Lobby Types
  type LobbyPlayer,
  type LobbyState,

  // Client Messages
  type ClientMessage,
  type JoinRoomMessage,
  type SelectColorMessage,
  type MarkReadyMessage,
  type UpdateSettingsMessage,
  type StartGameMessage,
  type GameActionMessage,
  type ChatMessage,
  type LeaveRoomMessage,
  type ReconnectMessage,
  type PingMessage,

  // Host Messages
  type HostMessage,
  type LobbyStateMessage,
  type GameStateMessage,
  type ActionResultMessage,
  type ChatBroadcastMessage,
  type PlayerConnectedMessage,
  type PlayerDisconnectedMessage,
  type PlayerReconnectedMessage,
  type HostMigratedMessage,
  type JoinSuccessMessage,
  type JoinErrorMessage,
  type ReconnectSuccessMessage,
  type ReconnectErrorMessage,
  type GameStartingMessage,
  type GameStartedMessage,
  type GameEndedMessage,
  type PongMessage,
  type ErrorMessage,

  // Message Helpers
  createJoinMessage,
  createSelectColorMessage,
  createMarkReadyMessage,
  createUpdateSettingsMessage,
  createStartGameMessage,
  createActionMessage,
  createChatMessage,
  createLeaveMessage,
  createReconnectMessage,
  createPingMessage,
  parseMessage,
  serializeMessage,
  isClientMessage,
  isHostMessage,
  createGameAction,
} from './messages';

// ============================================================================
// Host Logic (from existing host.ts)
// ============================================================================

export {
  // Types
  type ValidationResult,
  type ActionResult,
  type HostState,
  type BroadcastFn,
  type SendToPlayerFn,

  // State Management
  createHostState,

  // Action Processing
  validateAction,
  processActionAsHost,

  // State Broadcasting
  createGameStateMessage,
  createLobbyStateMessage,
  broadcastState,

  // Player Management
  handlePlayerJoin,
  handlePlayerLeave,
  handlePlayerReconnect,

  // Host Migration
  migrateHost,
  selectNextHost,

  // Lobby Management
  initializeLobbyState,
  updateLobbySettings,
  handleColorSelection,
  handleReadyStatus,
  canStartGame,
} from './host';

// ============================================================================
// Peer Logic (from existing peer.ts)
// ============================================================================

export {
  // Types
  type PendingAction,
  type PeerState,
  type OptimisticUpdateResult,

  // State Management
  createPeerState,

  // Action Sending
  queueAction,
  createOptimisticUpdate,

  // State Updates
  handleStateUpdate,
  handleLobbyUpdate,

  // Action Results
  handleActionResult,
  handleActionRejected,

  // Optimistic Updates
  applyOptimisticUpdate,

  // Synchronization
  isSynchronized,
  getPendingActionCount,
  clearPendingActions,
  getPendingActionsForRetry,
  detectDesync,
  forceResync,
} from './peer';

// ============================================================================
// Legacy exports for backward compatibility
// ============================================================================

export {
  PartyKitClient,
  createPartyKitClient,
  type PartyKitClientConfig,
  type PartyKitClientCallbacks,
} from './PartyKitClient';

export {
  usePartyKit,
  usePartyKitConnection,
  usePartyKitLobby,
  usePartyKitGame,
  type UsePartyKitOptions,
  type UsePartyKitReturn,
} from './usePartyKit';
