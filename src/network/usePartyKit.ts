// @ts-nocheck
// TODO: Fix TypeScript errors in this file
/**
 * usePartyKit - React hook for PartyKit network connection
 *
 * Manages the PartyKitClient lifecycle and integrates with Redux.
 * Provides a clean React interface for:
 * - Connection management
 * - Message sending
 * - State synchronization
 * - Error handling
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../game/state/store';
import {
  PartyKitClient,
  createPartyKitClient,
  type ConnectionState,
  type PartyKitClientConfig,
} from './PartyKitClient';
import type {
  ClientMessage,
  HostMessage,
  GameAction,
  LobbyPlayer,
  LobbyState,
} from './messages';
import {
  createActionMessage,
  createSelectColorMessage,
  createMarkReadyMessage,
  createUpdateSettingsMessage,
  createStartGameMessage,
  createChatMessage,
} from './messages';
import { createPeerState, handleStateUpdate, handleLobbyUpdate, handleActionResult } from './peer';
import {
  createHostState,
  processActionAsHost,
  handlePlayerJoin,
  handlePlayerLeave,
  handlePlayerReconnect,
  handleColorSelection,
  handleReadyStatus,
  canStartGame,
  broadcastState,
} from './host';
import type { GameSettings, PlayerColor } from '../types/game';
import { getSessionData, canReconnect as checkCanReconnect } from './session';

// ============================================================================
// Types
// ============================================================================

export interface UsePartyKitOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Auto-reconnect on mount if session exists */
  autoReconnect?: boolean;
  /** PartyKit host URL */
  host?: string;
}

export interface UsePartyKitReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: ConnectionState;
  error: string | null;

  // Room info
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  players: LobbyPlayer[];
  lobbyState: LobbyState | null;

  // Actions
  connect: (roomCode: string, playerName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  tryReconnect: () => Promise<boolean>;

  // Game actions
  send: (message: ClientMessage) => void;
  sendAction: (action: GameAction) => void;
  selectColor: (color: PlayerColor) => void;
  setReady: (isReady: boolean) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  startGame: () => void;
  sendChat: (text: string) => void;

  // Host actions (only work if isHost)
  canStart: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePartyKit(options: UsePartyKitOptions = {}): UsePartyKitReturn {
  const { debug = false, autoReconnect = true, host } = options;

  const dispatch = useDispatch<AppDispatch>();

  // Refs for stable references
  const clientRef = useRef<PartyKitClient | null>(null);
  const peerStateRef = useRef(createPeerState());
  const hostStateRef = useRef(createHostState());

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);

  // Derived state
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting' || connectionState === 'reconnecting';
  const players = lobbyState?.players || [];
  const canStart = isHost && lobbyState ? canStartGame(hostStateRef.current) : false;

  // ============================================================================
  // Message Handler
  // ============================================================================

  const handleMessage = useCallback((message: HostMessage) => {
    if (debug) {
      console.log('[usePartyKit] Received message:', message.type);
    }

    switch (message.type) {
      case 'LOBBY_STATE':
        setLobbyState(message.state);
        hostStateRef.current.lobbyState = message.state;
        handleLobbyUpdate(message.state, peerStateRef.current, dispatch);
        break;

      case 'GAME_STATE':
        handleStateUpdate(message, peerStateRef.current, dispatch);
        break;

      case 'ACTION_RESULT':
        handleActionResult(message, peerStateRef.current, dispatch);
        if (!message.success && message.error) {
          setError(message.error);
          // Clear error after a delay
          setTimeout(() => setError(null), 5000);
        }
        break;

      case 'JOIN_SUCCESS':
        setPlayerId(message.playerId);
        setLobbyState(message.lobbyState);
        hostStateRef.current.lobbyState = message.lobbyState;
        // Check if we're the host
        const isHostPlayer = message.lobbyState.hostId === message.playerId;
        setIsHost(isHostPlayer);
        hostStateRef.current.isHost = isHostPlayer;
        break;

      case 'JOIN_ERROR':
        setError(message.error);
        break;

      case 'RECONNECT_SUCCESS':
        setPlayerId(message.playerId);
        if (message.lobbyState) {
          setLobbyState(message.lobbyState);
          hostStateRef.current.lobbyState = message.lobbyState;
        }
        break;

      case 'RECONNECT_ERROR':
        setError(message.error);
        break;

      case 'PLAYER_CONNECTED':
        if (lobbyState) {
          const newPlayers = [...lobbyState.players, message.player];
          setLobbyState({ ...lobbyState, players: newPlayers });
        }
        break;

      case 'PLAYER_DISCONNECTED':
        if (lobbyState) {
          const updatedPlayers = lobbyState.players.map(p =>
            p.id === message.playerId ? { ...p, isConnected: false } : p
          );
          setLobbyState({ ...lobbyState, players: updatedPlayers });
        }
        break;

      case 'PLAYER_RECONNECTED':
        if (lobbyState) {
          const updatedPlayers = lobbyState.players.map(p =>
            p.id === message.playerId ? { ...p, isConnected: true } : p
          );
          setLobbyState({ ...lobbyState, players: updatedPlayers });
        }
        break;

      case 'HOST_MIGRATED':
        const isNewHost = message.newHostId === playerId;
        setIsHost(isNewHost);
        hostStateRef.current.isHost = isNewHost;
        if (lobbyState) {
          const updatedPlayers = lobbyState.players.map(p => ({
            ...p,
            isHost: p.id === message.newHostId,
          }));
          setLobbyState({
            ...lobbyState,
            hostId: message.newHostId,
            players: updatedPlayers,
          });
        }
        break;

      case 'GAME_STARTING':
        // Could show countdown UI
        break;

      case 'GAME_STARTED':
        // Game has started - update state
        handleStateUpdate(
          { type: 'GAME_STATE', state: message.state, sequence: 1 },
          peerStateRef.current,
          dispatch
        );
        break;

      case 'GAME_ENDED':
        // Game ended - could show victory screen
        break;

      case 'CHAT_BROADCAST':
        // Handle chat message - dispatch to log slice
        // dispatch(addChatMessage(message));
        break;

      case 'ERROR':
        setError(message.error);
        setTimeout(() => setError(null), 5000);
        break;

      case 'PONG':
        // Connection is healthy
        break;
    }
  }, [dispatch, debug, lobbyState, playerId]);

  // ============================================================================
  // Client Creation
  // ============================================================================

  useEffect(() => {
    // Create client on mount
    const config: PartyKitClientConfig = {
      debug,
      host,
    };

    const client = createPartyKitClient(config, {
      onMessage: handleMessage,
      onConnectionChange: (state) => {
        setConnectionState(state);
        if (state === 'disconnected') {
          setError(null);
        }
      },
      onDisconnect: (reason) => {
        if (reason !== 'intentional') {
          setError(`Disconnected: ${reason}`);
        }
      },
      onError: (err) => {
        setError(err.message);
      },
      onJoined: (id, code) => {
        setPlayerId(id);
        setRoomCode(code);
        setError(null);
      },
      onReconnected: (id, code) => {
        setPlayerId(id);
        setRoomCode(code);
        setError(null);
      },
    });

    clientRef.current = client;

    // Auto-reconnect if session exists
    if (autoReconnect && checkCanReconnect()) {
      client.tryReconnect().catch((err) => {
        if (debug) {
          console.log('[usePartyKit] Auto-reconnect failed:', err);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, []); // Only run on mount

  // Update callbacks when they change
  useEffect(() => {
    clientRef.current?.setCallbacks({
      onMessage: handleMessage,
    });
  }, [handleMessage]);

  // ============================================================================
  // Action Methods
  // ============================================================================

  const connect = useCallback(async (code: string, playerName: string) => {
    if (!clientRef.current) {
      throw new Error('Client not initialized');
    }

    setError(null);
    setRoomCode(code.toUpperCase());

    await clientRef.current.connect(code, playerName);
  }, []);

  const disconnect = useCallback(async () => {
    if (!clientRef.current) {
      return;
    }

    await clientRef.current.disconnect();
    setRoomCode(null);
    setPlayerId(null);
    setIsHost(false);
    setLobbyState(null);
    setError(null);
  }, []);

  const tryReconnect = useCallback(async () => {
    if (!clientRef.current) {
      return false;
    }

    setError(null);
    return clientRef.current.tryReconnect();
  }, []);

  const send = useCallback((message: ClientMessage) => {
    if (!clientRef.current) {
      throw new Error('Client not initialized');
    }

    clientRef.current.send(message);
  }, []);

  const sendAction = useCallback((action: GameAction) => {
    if (!clientRef.current) {
      throw new Error('Client not initialized');
    }

    clientRef.current.send(createActionMessage(action));
  }, []);

  const selectColor = useCallback((color: PlayerColor) => {
    send(createSelectColorMessage(color));
  }, [send]);

  const setReady = useCallback((isReady: boolean) => {
    send(createMarkReadyMessage(isReady));
  }, [send]);

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    if (!isHost) {
      console.warn('Only host can update settings');
      return;
    }
    send(createUpdateSettingsMessage(settings));
  }, [send, isHost]);

  const startGame = useCallback(() => {
    if (!isHost) {
      console.warn('Only host can start game');
      return;
    }
    send(createStartGameMessage());
  }, [send, isHost]);

  const sendChat = useCallback((text: string) => {
    send(createChatMessage(text));
  }, [send]);

  // ============================================================================
  // Return Value
  // ============================================================================

  return useMemo(() => ({
    // Connection state
    isConnected,
    isConnecting,
    connectionState,
    error,

    // Room info
    roomCode,
    playerId,
    isHost,
    players,
    lobbyState,

    // Actions
    connect,
    disconnect,
    tryReconnect,
    send,
    sendAction,
    selectColor,
    setReady,
    updateSettings,
    startGame,
    sendChat,

    // Host actions
    canStart,
  }), [
    isConnected,
    isConnecting,
    connectionState,
    error,
    roomCode,
    playerId,
    isHost,
    players,
    lobbyState,
    connect,
    disconnect,
    tryReconnect,
    send,
    sendAction,
    selectColor,
    setReady,
    updateSettings,
    startGame,
    sendChat,
    canStart,
  ]);
}

// ============================================================================
// Additional Hooks
// ============================================================================

/**
 * Hook for just the connection status
 */
export function usePartyKitConnection() {
  const { isConnected, isConnecting, connectionState, error, connect, disconnect, tryReconnect } = usePartyKit();

  return {
    isConnected,
    isConnecting,
    connectionState,
    error,
    connect,
    disconnect,
    tryReconnect,
  };
}

/**
 * Hook for lobby-specific functionality
 */
export function usePartyKitLobby() {
  const {
    isConnected,
    roomCode,
    playerId,
    isHost,
    players,
    lobbyState,
    canStart,
    selectColor,
    setReady,
    updateSettings,
    startGame,
  } = usePartyKit();

  const currentPlayer = useMemo(() => {
    return players.find(p => p.id === playerId) || null;
  }, [players, playerId]);

  const availableColors = useMemo(() => {
    const takenColors = new Set(players.map(p => p.color).filter(Boolean));
    const allColors: PlayerColor[] = [
      'red', 'blue', 'orange', 'white', 'green', 'purple',
      'black', 'bronze', 'gold', 'silver', 'pink', 'mysticblue',
    ];
    return allColors.filter(c => !takenColors.has(c));
  }, [players]);

  const allPlayersReady = useMemo(() => {
    return players.every(p => p.isReady && p.color !== null);
  }, [players]);

  return {
    isConnected,
    roomCode,
    playerId,
    isHost,
    players,
    lobbyState,
    currentPlayer,
    availableColors,
    allPlayersReady,
    canStart,
    selectColor,
    setReady,
    updateSettings,
    startGame,
  };
}

/**
 * Hook for game-specific functionality
 */
export function usePartyKitGame() {
  const { isConnected, isHost, sendAction, sendChat, error } = usePartyKit();

  const gameState = useSelector((state: RootState) => state.game);
  const playersState = useSelector((state: RootState) => state.players);

  const isMyTurn = useMemo(() => {
    const currentPlayerId = getSessionData().playerId;
    return gameState.currentPlayerId === currentPlayerId;
  }, [gameState.currentPlayerId]);

  return {
    isConnected,
    isHost,
    isMyTurn,
    phase: gameState.phase,
    turn: gameState.turn,
    diceRoll: gameState.diceRoll,
    sendAction,
    sendChat,
    error,
  };
}

export default usePartyKit;
