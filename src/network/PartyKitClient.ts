/**
 * PartyKitClient - Main WebSocket client wrapper for OpenCatan
 *
 * Provides a clean interface for connecting to PartyKit rooms with:
 * - Automatic reconnection handling
 * - Session token management
 * - Type-safe message sending/receiving
 * - Connection state management
 */

import PartySocket from 'partysocket';
import {
  type ClientMessage,
  type HostMessage,
  serializeMessage,
  parseMessage,
  createJoinMessage,
  createReconnectMessage,
  createPingMessage,
  createLeaveMessage,
} from './messages';
import {
  getSessionToken,
  setSessionToken,
  getPlayerId,
  setPlayerId,
  setRoomCode,
  setPlayerName,
  clearRoomSession,
  getReconnectionData,
  saveSessionOnJoin,
} from './session';

// ============================================================================
// Types
// ============================================================================

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface PartyKitClientConfig {
  /** PartyKit host URL (defaults to window.location.host in development) */
  host?: string;
  /** PartyKit party name (defaults to 'game') */
  party?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Reconnection attempts before giving up (default: 10) */
  maxReconnectAttempts?: number;
  /** Base delay between reconnection attempts in ms (default: 1000) */
  reconnectDelay?: number;
  /** Ping interval in ms to keep connection alive (default: 30000) */
  pingInterval?: number;
}

export interface PartyKitClientCallbacks {
  /** Called when a message is received from the server */
  onMessage?: (message: HostMessage) => void;
  /** Called when connection state changes */
  onConnectionChange?: (state: ConnectionState) => void;
  /** Called when disconnected (after reconnection attempts exhausted) */
  onDisconnect?: (reason: string) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when successfully joined a room */
  onJoined?: (playerId: string, roomCode: string) => void;
  /** Called when reconnected to a room */
  onReconnected?: (playerId: string, roomCode: string) => void;
}

// ============================================================================
// PartyKitClient Class
// ============================================================================

export class PartyKitClient {
  private socket: PartySocket | null = null;
  private config: Required<PartyKitClientConfig>;
  private callbacks: PartyKitClientCallbacks;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private currentRoomCode: string | null = null;
  private currentPlayerId: string | null = null;
  private isIntentionalDisconnect = false;

  constructor(
    config: PartyKitClientConfig = {},
    callbacks: PartyKitClientCallbacks = {}
  ) {
    this.config = {
      host: config.host || this.getDefaultHost(),
      party: config.party || 'game',
      debug: config.debug || false,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      reconnectDelay: config.reconnectDelay || 1000,
      pingInterval: config.pingInterval || 30000,
    };
    this.callbacks = callbacks;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Connect to a room with the given code and player name
   * @param roomCode - The room code to join
   * @param playerName - The player's display name
   */
  async connect(roomCode: string, playerName: string): Promise<void> {
    if (this.socket && this.connectionState !== 'disconnected') {
      this.log('Already connected or connecting, disconnecting first');
      await this.disconnect();
    }

    this.isIntentionalDisconnect = false;
    this.currentRoomCode = roomCode.toUpperCase();
    this.reconnectAttempts = 0;

    this.setConnectionState('connecting');

    const sessionToken = getSessionToken();
    setRoomCode(this.currentRoomCode);
    setPlayerName(playerName);

    try {
      await this.createSocket(this.currentRoomCode, sessionToken, playerName);
    } catch (error) {
      this.setConnectionState('disconnected');
      throw error;
    }
  }

  /**
   * Attempt to reconnect to a previous session
   * Returns false if no valid session data exists
   */
  async tryReconnect(): Promise<boolean> {
    const reconnectionData = getReconnectionData();

    if (!reconnectionData) {
      this.log('No valid reconnection data found');
      return false;
    }

    this.isIntentionalDisconnect = false;
    this.currentRoomCode = reconnectionData.roomCode;
    this.currentPlayerId = reconnectionData.playerId;
    this.reconnectAttempts = 0;

    this.setConnectionState('reconnecting');

    try {
      await this.createSocket(
        reconnectionData.roomCode,
        reconnectionData.token,
        undefined,
        reconnectionData.playerId
      );
      return true;
    } catch (error) {
      this.setConnectionState('disconnected');
      this.log('Reconnection failed:', error);
      return false;
    }
  }

  /**
   * Disconnect from the current room
   */
  async disconnect(): Promise<void> {
    this.isIntentionalDisconnect = true;

    // Send leave message before closing
    if (this.socket && this.connectionState === 'connected') {
      try {
        this.send(createLeaveMessage());
      } catch {
        // Ignore errors when leaving
      }
    }

    this.cleanup();
    clearRoomSession();
    this.setConnectionState('disconnected');
  }

  /**
   * Send a message to the server
   */
  send(message: ClientMessage): void {
    if (!this.socket || this.connectionState !== 'connected') {
      this.log('Cannot send message: not connected');
      throw new Error('Not connected to server');
    }

    const serialized = serializeMessage(message);
    this.log('Sending message:', message.type);
    this.socket.send(serialized);
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Get the current room code
   */
  getRoomCode(): string | null {
    return this.currentRoomCode;
  }

  /**
   * Get the current player ID
   */
  getPlayerId(): string | null {
    return this.currentPlayerId;
  }

  /**
   * Update callbacks
   */
  setCallbacks(callbacks: Partial<PartyKitClientCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private getDefaultHost(): string {
    // In development, PartyKit typically runs on localhost:1999
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost') {
        return 'localhost:1999';
      }
      return window.location.host;
    }
    return 'localhost:1999';
  }

  private async createSocket(
    roomCode: string,
    sessionToken: string,
    playerName?: string,
    existingPlayerId?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const isReconnect = !!existingPlayerId;

      this.socket = new PartySocket({
        host: this.config.host,
        party: this.config.party,
        room: roomCode,
        // Pass session info as query parameters for initial connection
        query: {
          sessionToken,
          ...(playerName && { playerName }),
          ...(existingPlayerId && { playerId: existingPlayerId }),
          reconnect: isReconnect ? 'true' : 'false',
        },
      });

      const connectionTimeout = setTimeout(() => {
        this.socket?.close();
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
        this.log('Socket opened');

        // Send join or reconnect message
        if (isReconnect && existingPlayerId) {
          this.socket?.send(
            serializeMessage(createReconnectMessage(sessionToken, existingPlayerId))
          );
        } else if (playerName) {
          this.socket?.send(
            serializeMessage(createJoinMessage(playerName, sessionToken))
          );
        }
      });

      this.socket.addEventListener('message', (event) => {
        this.handleMessage(event.data as string, resolve, reject);
      });

      this.socket.addEventListener('close', (event) => {
        clearTimeout(connectionTimeout);
        this.handleClose(event);
      });

      this.socket.addEventListener('error', (event) => {
        clearTimeout(connectionTimeout);
        this.log('Socket error:', event);
        this.callbacks.onError?.(new Error('WebSocket error'));
      });
    });
  }

  private handleMessage(
    data: string,
    resolveConnect?: () => void,
    rejectConnect?: (error: Error) => void
  ): void {
    const message = parseMessage(data);

    if (!message) {
      this.log('Failed to parse message:', data);
      return;
    }

    this.log('Received message:', message.type);

    // Handle special connection-related messages
    switch (message.type) {
      case 'JOIN_SUCCESS':
        this.currentPlayerId = message.playerId;
        setPlayerId(message.playerId);
        setSessionToken(message.sessionToken);
        if (this.currentRoomCode) {
          saveSessionOnJoin(
            message.playerId,
            this.currentRoomCode,
            message.lobbyState.players.find(p => p.id === message.playerId)?.name || ''
          );
        }
        this.setConnectionState('connected');
        this.startPingInterval();
        this.callbacks.onJoined?.(message.playerId, this.currentRoomCode || '');
        resolveConnect?.();
        break;

      case 'JOIN_ERROR':
        this.setConnectionState('disconnected');
        this.cleanup();
        rejectConnect?.(new Error(message.error));
        return;

      case 'RECONNECT_SUCCESS':
        this.currentPlayerId = message.playerId;
        this.setConnectionState('connected');
        this.startPingInterval();
        this.callbacks.onReconnected?.(message.playerId, this.currentRoomCode || '');
        resolveConnect?.();
        break;

      case 'RECONNECT_ERROR':
        this.setConnectionState('disconnected');
        this.cleanup();
        clearRoomSession();
        rejectConnect?.(new Error(message.error));
        return;

      case 'HOST_MIGRATED':
        // Handle host migration - may need special handling
        break;

      case 'PONG':
        // Handle pong - connection is healthy
        break;
    }

    // Forward all messages to callback
    this.callbacks.onMessage?.(message as HostMessage);
  }

  private handleClose(event: CloseEvent): void {
    this.log('Socket closed:', event.code, event.reason);
    this.stopPingInterval();

    // If this was intentional, don't try to reconnect
    if (this.isIntentionalDisconnect) {
      this.setConnectionState('disconnected');
      this.callbacks.onDisconnect?.('intentional');
      return;
    }

    // Attempt reconnection
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      this.setConnectionState('disconnected');
      this.callbacks.onDisconnect?.('max_attempts_reached');
    }
  }

  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');

    // Exponential backoff
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    this.log(`Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`);

    await this.sleep(delay);

    if (this.isIntentionalDisconnect) {
      return;
    }

    const reconnectionData = getReconnectionData();

    if (reconnectionData) {
      try {
        await this.createSocket(
          reconnectionData.roomCode,
          reconnectionData.token,
          undefined,
          reconnectionData.playerId
        );
      } catch (error) {
        this.log('Reconnection attempt failed:', error);
        // Will try again on next close event
      }
    } else if (this.currentRoomCode) {
      // Fall back to re-joining if we have a room code
      this.log('No reconnection data, cannot reconnect');
      this.setConnectionState('disconnected');
      this.callbacks.onDisconnect?.('no_session_data');
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingIntervalId = setInterval(() => {
      if (this.connectionState === 'connected' && this.socket) {
        try {
          this.socket.send(serializeMessage(createPingMessage()));
        } catch {
          // Ping failed, connection may be dead
        }
      }
    }, this.config.pingInterval);
  }

  private stopPingInterval(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.callbacks.onConnectionChange?.(state);
    }
  }

  private cleanup(): void {
    this.stopPingInterval();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.currentPlayerId = null;
    this.currentRoomCode = null;
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[PartyKitClient]', ...args);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new PartyKitClient instance
 */
export function createPartyKitClient(
  config?: PartyKitClientConfig,
  callbacks?: PartyKitClientCallbacks
): PartyKitClient {
  return new PartyKitClient(config, callbacks);
}

export default PartyKitClient;
