/**
 * useChat - React hook for chat functionality
 *
 * Provides chat message sending and receiving with network sync
 */

import { useCallback, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/game/state/store';
import type { ChatMessage, PlayerColor } from '@/types';
import { partyClient } from '../partyClient';
import { addChatMessage, selectChat, selectRecentChat } from '@/game/state/slices/logSlice';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessageDisplay {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: PlayerColor;
  message: string;
  timestamp: number;
  isLocal: boolean;
}

export interface UseChatReturn {
  /** All chat messages */
  messages: ChatMessage[];
  /** Recent chat messages (last 50) */
  recentMessages: ChatMessage[];
  /** Send a chat message */
  sendMessage: (text: string) => void;
  /** Whether chat is available (connected) */
  isAvailable: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for chat functionality
 */
export function useChat(): UseChatReturn {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const allMessages = useSelector(selectChat);
  const localPlayerId = useSelector((state: RootState) => state.lobby.localPlayerId);
  const players = useSelector((state: RootState) => state.lobby.players);

  // Get recent messages
  const recentMessages = useMemo(() => {
    return allMessages.slice(-50);
  }, [allMessages]);

  // Check if chat is available
  const isAvailable = partyClient.isConnected;

  // ==========================================================================
  // Message Handlers
  // ==========================================================================

  useEffect(() => {
    // Handle incoming chat messages
    partyClient.on('CHAT_BROADCAST', (message) => {
      if ('message' in message) {
        const chatMessage = message.message as ChatMessage;
        // Only add if not from local player (already added optimistically)
        if (chatMessage.playerId !== localPlayerId) {
          dispatch(addChatMessage(chatMessage));
        }
      }
    });

    return () => {
      partyClient.off('CHAT_BROADCAST');
    };
  }, [dispatch, localPlayerId]);

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * Send a chat message
   */
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) {
      return;
    }

    // Find local player info
    const localPlayer = players.find(p => p.id === localPlayerId);
    const playerName = localPlayer?.name || 'Unknown';
    const playerColor = localPlayer?.color || 'white';

    // Create chat message
    const chatMessage: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: localPlayerId || '',
      playerName,
      playerColor,
      message: text.trim(),
      timestamp: Date.now(),
    };

    // Add optimistically to local state
    dispatch(addChatMessage(chatMessage));

    // Send to server if connected
    if (partyClient.isConnected) {
      partyClient.send({
        type: 'CHAT_MESSAGE',
        text: text.trim(),
      });
    }
  }, [dispatch, localPlayerId, players]);

  // ==========================================================================
  // Return Value
  // ==========================================================================

  return useMemo(() => ({
    messages: allMessages,
    recentMessages,
    sendMessage,
    isAvailable,
  }), [
    allMessages,
    recentMessages,
    sendMessage,
    isAvailable,
  ]);
}

export default useChat;
