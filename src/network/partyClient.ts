/**
 * PartyClient - Singleton PartyKit connection wrapper for OpenCatan
 *
 * Provides a centralized WebSocket connection manager with:
 * - Type-safe message handling
 * - Automatic reconnection
 * - Session token management
 * - Event-based message routing
 */

import PartySocket from 'partysocket';
import type { ClientMessage, HostMessage, ServerMessage } from '@/types/network';
import {
  getSessionToken,
  setSessionToken,
  getPlayerId,
  setPlayerId,
  getRoomCode,
  setRoomCode,
  setPlayerName,
  saveSessionOnJoin,
  clearRoomSession,
  getReconnectionData,
} from './session';
import { PARTYKIT_HOST } from './constants';

// ============================================================================
// Types
// ============================================================================

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type MessageHandler<T extends HostMessage | ServerMessage = HostMessage | ServerMessage> = (
  data: T
) => void;

export interface PartyClientConfig {
  /** PartyKit host URL */
  host?: string;
  /** PartyKit party name */
  party?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Base delay between reconnection attempts in ms */
  reconnectDelay?: number;
  /** Ping interval to keep connection alive in ms */
  pingInterval?: number;
}

// ============================================================================
// PartyClient Class
// ============================================================================

/**
 * Singleton PartyKit client wrapper
 * Manages WebSocket connection and message routing
 */
class PartyClient {
  private socket: PartySocket | null = null;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private config: Required<PartyClientConfig>;
  private _connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private _roomCode: string | null = null;
  private _playerId: string | null = null;
  private _isHost = false;
  private isIntentionalDisconnect = false;
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;
  private connectionReject: ((error: Error) => void) | null = null;

  constructor(config: PartyClientConfig = {}) {
    this.config = {
      host: config.host || PARTYKIT_HOST,
      party: config.party || 'game',
      debug: config.debug || false,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      reconnectDelay: config.reconnectDelay || 1000,
      pingInterval: config.pingInterval || 30000,
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Connect to a room with the given code and player name
   */
  async connect(roomCode: string, playerName: string): Promise<void> {
    if (this.socket && this._connectionState !== 'disconnected') {
      this.log('Already connected or connecting, disconnecting first');
      await this.disconnect();
    }

    this.isIntentionalDisconnect = false;
    this._roomCode = roomCode.toUpperCase();
    this.reconnectAttempts = 0;
    this._connectionState = 'connecting';
    this.emitConnectionStateChange();

    const sessionToken = getSessionToken();
    setRoomCode(this._roomCode);
    setPlayerName(playerName);

    return this.createSocket(this._roomCode, sessionToken, playerName);
  }

  /**
   * Reconnect with session token
   */
  async reconnect(roomCode: string, sessionToken: string): Promise<void> {
    const playerId = getPlayerId();
    if (!playerId) {
      throw new Error('No player ID found for reconnection');
    }

    if (this.socket && this._connectionState !== 'disconnected') {
      await this.disconnect();
    }

    this.isIntentionalDisconnect = false;
    this._roomCode = roomCode.toUpperCase();
    this.reconnectAttempts = 0;
    this._connectionState = 'reconnecting';
    this.emitConnectionStateChange();

    return this.createSocket(this._roomCode, sessionToken, undefined, playerId);
  }

  /**
   * Disconnect from the current room
   */
  disconnect(): void {
    this.isIntentionalDisconnect = true;

    if (this.socket && this._connectionState === 'connected') {
      try {
        this.send({ type: 'LEAVE_ROOM' });
      } catch {
        // Ignore errors when leaving
      }
    }

    this.cleanup();
    clearRoomSession();
    this._connectionState = 'disconnected';
    this.emitConnectionStateChange();
  }

  /**
   * Send a message to the server
   */
  send(message: ClientMessage): void {
    if (!this.socket || this._connectionState !== 'connected') {
      this.log('Cannot send message: not connected');
      throw new Error('Not connected to server');
    }

    const serialized = JSON.stringify(message);
    this.log('Sending message:', message.type);
    this.socket.send(serialized);
  }

  /**
   * Register a message handler for a specific message type
   */
  on<T extends (HostMessage | ServerMessage)['type']>(
    type: T,
    handler: (data: Extract<HostMessage | ServerMessage, { type: T }>) => void
  ): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  /**
   * Remove a message handler
   */
  off(type: string, handler?: (data: any) => void): void {
    if (handler) {
      this.messageHandlers.get(type)?.delete(handler);
    } else {
      this.messageHandlers.delete(type);
    }
  }

  /**
   * Remove all handlers for a specific type or all handlers
   */
  offAll(type?: string): void {
    if (type) {
      this.messageHandlers.delete(type);
    } else {
      this.messageHandlers.clear();
    }
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  get isConnected(): boolean {
    return this._connectionState === 'connected';
  }

  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  get roomCode(): string | null {
    return this._roomCode;
  }

  get playerId(): string | null {
    return this._playerId;
  }

  get isHost(): boolean {
    return this._isHost;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private createSocket(
    roomCode: string,
    sessionToken: string,
    playerName?: string,
    existingPlayerId?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const isReconnect = !!existingPlayerId;

      this.connectionPromise = new Promise((res, rej) => {
        this.connectionResolve = res;
        this.connectionReject = rej;
      });

      this.socket = new PartySocket({
        host: this.config.host,
        party: this.config.party,
        room: roomCode,
        query: {
          sessionToken,
          ...(playerName && { playerName }),
          ...(existingPlayerId && { playerId: existingPlayerId }),
          reconnect: isReconnect ? 'true' : 'false',
        },
      });

      const connectionTimeout = setTimeout(() => {
        this.socket?.close();
        const error = new Error('Connection timeout');
        this.connectionReject?.(error);
        reject(error);
      }, 10000);

      this.socket.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
        this.log('Socket opened');

        // Send join or reconnect message
        if (isReconnect && existingPlayerId) {
          this.socket?.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              playerName: '',
              sessionToken,
            })
          );
        } else if (playerName) {
          this.socket?.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              playerName,
              sessionToken,
            })
          );
        }
      });

      this.socket.addEventListener('message', (event) => {
        this.handleMessage(event.data as string, resolve, reject, connectionTimeout);
      });

      this.socket.addEventListener('close', (event) => {
        clearTimeout(connectionTimeout);
        this.handleClose(event);
      });

      this.socket.addEventListener('error', (event) => {
        clearTimeout(connectionTimeout);
        this.log('Socket error:', event);
        this.emitMessage({ type: 'ERROR', code: 'CONNECTION_LOST', message: 'WebSocket error' });
      });
    });
  }

  private handleMessage(
    data: string,
    resolveConnect?: () => void,
    rejectConnect?: (error: Error) => void,
    connectionTimeout?: ReturnType<typeof setTimeout>
  ): void {
    let message: HostMessage | ServerMessage;

    try {
      message = JSON.parse(data);
    } catch {
      this.log('Failed to parse message:', data);
      return;
    }

    this.log('Received message:', message.type);

    // Handle connection-related messages
    switch (message.type) {
      case 'WELCOME':
        // Server sends WELCOME on successful join
        if (connectionTimeout) clearTimeout(connectionTimeout);
        if ('playerId' in message) {
          this._playerId = message.playerId;
          setPlayerId(message.playerId);
        }
        if ('sessionToken' in message) {
          setSessionToken(message.sessionToken);
        }
        if ('isHost' in message) {
          this._isHost = message.isHost;
        }
        if (this._roomCode && this._playerId) {
          saveSessionOnJoin(this._playerId, this._roomCode, '');
        }
        this._connectionState = 'connected';
        this.emitConnectionStateChange();
        this.startPingInterval();
        this.connectionResolve?.();
        resolveConnect?.();
        break;

      case 'ROOM_JOINED':
        if (connectionTimeout) clearTimeout(connectionTimeout);
        this._playerId = message.playerId;
        setPlayerId(message.playerId);
        setSessionToken(message.sessionToken);
        if (this._roomCode) {
          saveSessionOnJoin(message.playerId, this._roomCode, '');
        }
        this._connectionState = 'connected';
        this.emitConnectionStateChange();
        this.startPingInterval();
        this.connectionResolve?.();
        resolveConnect?.();
        break;

      case 'CONNECTION_ESTABLISHED':
        if (connectionTimeout) clearTimeout(connectionTimeout);
        this._playerId = message.playerId;
        setPlayerId(message.playerId);
        setSessionToken(message.sessionToken);
        this._connectionState = 'connected';
        this.emitConnectionStateChange();
        this.startPingInterval();
        this.connectionResolve?.();
        resolveConnect?.();
        break;

      case 'ROOM_NOT_FOUND':
      case 'ROOM_FULL':
      case 'ROOM_EXPIRED':
      case 'NAME_TAKEN':
        if (connectionTimeout) clearTimeout(connectionTimeout);
        this._connectionState = 'disconnected';
        this.emitConnectionStateChange();
        this.cleanup();
        const error = new Error(message.type);
        this.connectionReject?.(error);
        rejectConnect?.(error);
        break;

      case 'LOBBY_STATE':
        // Check if we're the host from lobby state
        if ('hostId' in message.state && this._playerId) {
          this._isHost = message.state.hostId === this._playerId;
        }
        break;

      case 'HOST_MIGRATED':
        if ('newHostId' in message) {
          this._isHost = message.newHostId === this._playerId;
        }
        break;

      case 'PONG':
        // Connection is healthy
        break;
    }

    // Emit message to all registered handlers
    this.emitMessage(message);
  }

  private handleClose(event: CloseEvent): void {
    this.log('Socket closed:', event.code, event.reason);
    this.stopPingInterval();

    if (this.isIntentionalDisconnect) {
      this._connectionState = 'disconnected';
      this.emitConnectionStateChange();
      return;
    }

    // Attempt reconnection
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      this._connectionState = 'disconnected';
      this.emitConnectionStateChange();
      this.emitMessage({
        type: 'ERROR',
        code: 'CONNECTION_LOST',
        message: 'Max reconnection attempts reached',
      });
    }
  }

  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempts++;
    this._connectionState = 'reconnecting';
    this.emitConnectionStateChange();

    // Exponential backoff
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    this.log(
      `Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`
    );

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
      }
    } else {
      this.log('No reconnection data, cannot reconnect');
      this._connectionState = 'disconnected';
      this.emitConnectionStateChange();
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingIntervalId = setInterval(() => {
      if (this._connectionState === 'connected' && this.socket) {
        try {
          this.socket.send(
            JSON.stringify({
              type: 'PING',
              timestamp: Date.now(),
            })
          );
        } catch {
          // Ping failed
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

  private cleanup(): void {
    this.stopPingInterval();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this._playerId = null;
    this._roomCode = null;
    this._isHost = false;
    this.connectionPromise = null;
    this.connectionResolve = null;
    this.connectionReject = null;
  }

  private emitMessage(message: HostMessage | ServerMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          this.log('Error in message handler:', error);
        }
      });
    }

    // Also emit to wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          this.log('Error in wildcard handler:', error);
        }
      });
    }
  }

  private emitConnectionStateChange(): void {
    // Emit a synthetic message for connection state changes
    const handlers = this.messageHandlers.get('CONNECTION_STATE_CHANGE');
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler({ type: 'CONNECTION_STATE_CHANGE', state: this._connectionState });
        } catch (error) {
          this.log('Error in connection state handler:', error);
        }
      });
    }
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[PartyClient]', ...args);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<PartyClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set the host flag (called by HostManager when we become host)
   */
  setIsHost(isHost: boolean): void {
    this._isHost = isHost;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Singleton instance of PartyClient
 * Use this throughout the application for network communication
 */
export const partyClient = new PartyClient({
  debug: process.env.NODE_ENV !== 'production',
});

export default partyClient;
