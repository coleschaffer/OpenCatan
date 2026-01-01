/**
 * useSettings - Settings management hook for OpenCatan
 *
 * Provides access to audio, display, and game settings from Redux state,
 * along with actions to modify them.
 */

import { useCallback } from 'react';
import { useAppSelector } from './useAppSelector';
import { useAppDispatch } from './useAppDispatch';
import {
  selectSoundEnabled,
  selectVolume,
  selectShowBuildCosts,
  selectShowDiceStats,
  selectCompactPlayerPanels,
  selectIsFullscreen,
  selectZoomLevel,
  setSoundEnabled,
  setVolume,
  toggleBuildCosts,
  toggleDiceStats,
  toggleCompactPlayerPanels,
  setFullscreen,
  setZoomLevel,
  closeModal,
} from '@/game/state/slices/uiSlice';
import {
  selectRoomCode,
  selectLobbySettings,
  selectLobbyPlayers,
  selectIsHost,
  selectLocalPlayerId,
  resetLobby,
} from '@/game/state/slices/lobbySlice';
import { useFullscreen } from './useFullscreen';

export interface UseSettingsReturn {
  // Audio settings
  /** Whether sound effects are enabled */
  soundEnabled: boolean;
  /** Master volume level (0-100) */
  volume: number;
  /** Set sound enabled state */
  setSoundEnabled: (enabled: boolean) => void;
  /** Set volume level */
  setVolume: (volume: number) => void;

  // Display settings
  /** Whether in fullscreen mode */
  isFullscreen: boolean;
  /** Toggle fullscreen mode */
  toggleFullscreen: () => void;
  /** Whether fullscreen is supported */
  fullscreenSupported: boolean;
  /** Whether to show build cost tooltips */
  showTooltips: boolean;
  /** Toggle tooltips display */
  toggleTooltips: () => void;
  /** Whether to show dice statistics */
  showDiceStats: boolean;
  /** Toggle dice stats display */
  toggleDiceStats: () => void;
  /** Whether player panels are compact */
  compactPanels: boolean;
  /** Toggle compact panel mode */
  toggleCompactPanels: () => void;
  /** Current zoom level */
  zoomLevel: number;
  /** Set zoom level */
  setZoomLevel: (level: number) => void;

  // Game info
  /** Current room code */
  roomCode: string | null;
  /** Current game mode */
  gameMode: string;
  /** Victory points target */
  victoryPoints: number;
  /** Turn timer setting (0 = unlimited) */
  turnTimer: number;
  /** Current turn number */
  turnNumber: number;
  /** Players list with connection status */
  players: Array<{
    id: string;
    name: string;
    color: string | null;
    isConnected: boolean;
    isHost: boolean;
  }>;
  /** Whether local player is host */
  isHost: boolean;
  /** Local player ID */
  localPlayerId: string | null;

  // Actions
  /** Leave the current game */
  leaveGame: () => void;
  /** Close the settings modal */
  closeSettings: () => void;
  /** Copy room code to clipboard */
  copyRoomCode: () => Promise<boolean>;
}

/**
 * Hook for managing game settings
 *
 * @returns Settings state and control methods
 *
 * @example
 * ```typescript
 * const { soundEnabled, setSoundEnabled, volume, setVolume } = useSettings();
 *
 * return (
 *   <>
 *     <Toggle checked={soundEnabled} onChange={setSoundEnabled} label="Sound" />
 *     <Slider value={volume} onChange={setVolume} label="Volume" />
 *   </>
 * );
 * ```
 */
export function useSettings(): UseSettingsReturn {
  const dispatch = useAppDispatch();
  const {
    isFullscreen: fullscreenState,
    toggleFullscreen: toggleFullscreenFn,
    isSupported: fullscreenSupported,
  } = useFullscreen();

  // Audio settings from Redux
  const soundEnabled = useAppSelector(selectSoundEnabled);
  const volume = useAppSelector(selectVolume);

  // Display settings from Redux
  const showTooltips = useAppSelector(selectShowBuildCosts);
  const showDiceStats = useAppSelector(selectShowDiceStats);
  const compactPanels = useAppSelector(selectCompactPlayerPanels);
  const zoomLevel = useAppSelector(selectZoomLevel);
  const reduxFullscreen = useAppSelector(selectIsFullscreen);

  // Game info from Redux
  const roomCode = useAppSelector(selectRoomCode);
  const lobbySettings = useAppSelector(selectLobbySettings);
  const lobbyPlayers = useAppSelector(selectLobbyPlayers);
  const isHost = useAppSelector(selectIsHost);
  const localPlayerId = useAppSelector(selectLocalPlayerId);

  // Get turn number from game state
  const turnNumber = useAppSelector((state) => state.game?.turn ?? 0);

  // Use actual fullscreen state, synced with Redux
  const isFullscreen = fullscreenState || reduxFullscreen;

  // Audio actions
  const handleSetSoundEnabled = useCallback(
    (enabled: boolean) => {
      dispatch(setSoundEnabled(enabled));
    },
    [dispatch]
  );

  const handleSetVolume = useCallback(
    (vol: number) => {
      dispatch(setVolume(vol));
    },
    [dispatch]
  );

  // Display actions
  const handleToggleFullscreen = useCallback(async () => {
    await toggleFullscreenFn();
    dispatch(setFullscreen(!isFullscreen));
  }, [toggleFullscreenFn, dispatch, isFullscreen]);

  const handleToggleTooltips = useCallback(() => {
    dispatch(toggleBuildCosts());
  }, [dispatch]);

  const handleToggleDiceStats = useCallback(() => {
    dispatch(toggleDiceStats());
  }, [dispatch]);

  const handleToggleCompactPanels = useCallback(() => {
    dispatch(toggleCompactPlayerPanels());
  }, [dispatch]);

  const handleSetZoomLevel = useCallback(
    (level: number) => {
      dispatch(setZoomLevel(level));
    },
    [dispatch]
  );

  // Game actions
  const handleLeaveGame = useCallback(() => {
    // Reset lobby state - this would trigger navigation in the app
    dispatch(resetLobby());
    // Close any open modals
    dispatch(closeModal());
    // In a real app, this would also disconnect from the network
    // and potentially navigate to the home page
  }, [dispatch]);

  const handleCloseSettings = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const handleCopyRoomCode = useCallback(async (): Promise<boolean> => {
    if (!roomCode) return false;

    try {
      await navigator.clipboard.writeText(roomCode);
      return true;
    } catch (error) {
      console.error('Failed to copy room code:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = roomCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        return false;
      }
    }
  }, [roomCode]);

  // Map lobby players to simplified format
  const players = lobbyPlayers.map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    isConnected: player.isConnected,
    isHost: player.isHost,
  }));

  return {
    // Audio
    soundEnabled,
    volume,
    setSoundEnabled: handleSetSoundEnabled,
    setVolume: handleSetVolume,

    // Display
    isFullscreen,
    toggleFullscreen: handleToggleFullscreen,
    fullscreenSupported,
    showTooltips,
    toggleTooltips: handleToggleTooltips,
    showDiceStats,
    toggleDiceStats: handleToggleDiceStats,
    compactPanels,
    toggleCompactPanels: handleToggleCompactPanels,
    zoomLevel,
    setZoomLevel: handleSetZoomLevel,

    // Game info
    roomCode,
    gameMode: lobbySettings.mode,
    victoryPoints: lobbySettings.victoryPoints,
    turnTimer: lobbySettings.turnTimer,
    turnNumber,
    players,
    isHost,
    localPlayerId,

    // Actions
    leaveGame: handleLeaveGame,
    closeSettings: handleCloseSettings,
    copyRoomCode: handleCopyRoomCode,
  };
}

export default useSettings;
