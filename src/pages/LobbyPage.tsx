/**
 * LobbyPage - Game lobby waiting room
 *
 * Displays the GameLobby component with player list, settings, and ready states.
 * Handles navigation when game starts or connection is lost.
 */

import { useEffect, useCallback } from 'react';
import { GameLobby } from '@/components/lobby';
import { usePartyConnection } from '@/network/hooks';
import { useGameNavigation, useRoomCode, useAppSelector, useAppDispatch, useLobbySounds } from '@/hooks';
import {
  selectLobbyPlayers,
  selectLocalPlayerId,
  selectIsHost,
  selectLobbySettings,
  selectGameStarted,
  selectConnectionStatus,
  setReady,
  setPlayerColor,
  updateLobbySettings,
} from '@/game/state';
import type { PlayerColor } from '@/types';
import type { LobbyPlayerInfo } from '@/components/lobby/PlayerList';
import type { LobbyGameSettings } from '@/components/lobby/GameSettings';

/**
 * Lobby page component
 *
 * Routes:
 * - /room/:code - This page
 * - Redirects to /game/:code when game starts
 * - Redirects to / when disconnected
 */
export function LobbyPage() {
  const dispatch = useAppDispatch();
  const { goToGame, goToLanding } = useGameNavigation();
  const { leaveRoom, isConnected, startGame } = usePartyConnection();
  const urlCode = useRoomCode();

  // Enable lobby sound effects
  useLobbySounds();

  // Redux state
  const players = useAppSelector(selectLobbyPlayers);
  const localPlayerId = useAppSelector(selectLocalPlayerId);
  const isHost = useAppSelector(selectIsHost);
  const settings = useAppSelector(selectLobbySettings);
  const gameStarted = useAppSelector(selectGameStarted);
  const connectionStatus = useAppSelector(selectConnectionStatus);

  // Navigate to game when it starts
  useEffect(() => {
    if (gameStarted && urlCode) {
      goToGame(urlCode);
    }
  }, [gameStarted, urlCode, goToGame]);

  // Redirect to landing if disconnected
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !isConnected) {
      // Small delay to avoid flash during reconnection
      const timeout = setTimeout(() => {
        goToLanding();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [connectionStatus, isConnected, goToLanding]);

  // Handle leaving the lobby
  const handleLeave = useCallback(() => {
    leaveRoom();
    goToLanding();
  }, [leaveRoom, goToLanding]);

  // Handle starting the game (host only)
  const handleStart = useCallback(() => {
    console.log('Starting game...');
    startGame();
  }, [startGame]);

  // Handle settings change (host only)
  const handleSettingsChange = useCallback(
    (newSettings: LobbyGameSettings) => {
      if (isHost) {
        dispatch(
          updateLobbySettings({
            mode: newSettings.mode,
            playerCount: newSettings.playerCount,
            victoryPoints: newSettings.victoryPoints,
            turnTimer: newSettings.turnTimer,
            discardLimit: newSettings.discardLimit,
            friendlyRobber: newSettings.friendlyRobber,
            mapType: newSettings.map,
          })
        );
      }
    },
    [dispatch, isHost]
  );

  // Handle color change
  const handleColorChange = useCallback(
    (color: PlayerColor) => {
      if (localPlayerId) {
        dispatch(setPlayerColor({ playerId: localPlayerId, color }));
      }
    },
    [dispatch, localPlayerId]
  );

  // Handle ready toggle
  const handleToggleReady = useCallback(() => {
    if (localPlayerId) {
      const currentPlayer = players.find((p) => p.id === localPlayerId);
      dispatch(
        setReady({
          playerId: localPlayerId,
          isReady: !currentPlayer?.isReady,
        })
      );
    }
  }, [dispatch, localPlayerId, players]);

  // Handle kicking a player (host only)
  const handleKick = useCallback(
    (playerId: string) => {
      if (isHost) {
        // This will be connected to the network layer
        console.log('Kicking player:', playerId);
      }
    },
    [isHost]
  );

  // Handle adding a bot (host only)
  const handleAddBot = useCallback(() => {
    if (isHost && players.length < settings.playerCount) {
      // Generate a unique bot ID and name
      const botNumber = players.filter(p => p.name.startsWith('Bot ')).length + 1;
      const botName = `Bot ${botNumber}`;

      // For now, just log the action
      // In a real implementation, this would send a message to the server
      // to add an AI player to the game
      console.log(`Adding bot: ${botName}`);
      alert(`Bot functionality coming soon! Would add "${botName}" to the game.`);
    }
  }, [isHost, players, settings.playerCount]);

  // Don't render if no room code
  if (!urlCode) {
    return (
      <div className="error-container">
        <h2>Invalid Room</h2>
        <p>No room code provided.</p>
        <button onClick={goToLanding}>Return to Home</button>
      </div>
    );
  }

  // Convert players to the format expected by GameLobby
  const lobbyPlayers: LobbyPlayerInfo[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    isReady: p.isReady,
    isHost: p.isHost,
    isConnected: p.isConnected,
  }));

  // Convert settings to the format expected by GameSettings
  const lobbySettings: LobbyGameSettings = {
    mode: settings.mode,
    playerCount: settings.playerCount,
    victoryPoints: settings.victoryPoints,
    turnTimer: settings.turnTimer,
    discardLimit: settings.discardLimit,
    friendlyRobber: settings.friendlyRobber,
    hideBankCards: settings.hideBankCards,
    map: settings.mapType,
  };

  return (
    <GameLobby
      roomCode={urlCode}
      players={lobbyPlayers}
      settings={lobbySettings}
      currentPlayerId={localPlayerId || ''}
      isHost={isHost}
      onStart={handleStart}
      onLeave={handleLeave}
      onSettingsChange={handleSettingsChange}
      onColorChange={handleColorChange}
      onToggleReady={handleToggleReady}
      onKick={isHost ? handleKick : undefined}
      onAddBot={isHost ? handleAddBot : undefined}
    />
  );
}

export default LobbyPage;
