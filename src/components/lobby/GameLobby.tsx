import { useCallback, useMemo, useState } from 'react';
import { PLAYER_COLORS } from '@/types';
import type { PlayerColor } from '@/types';
import { PlayerList, type LobbyPlayerInfo } from './PlayerList';
import { ColorPicker } from './ColorPicker';
import { type LobbyGameSettings } from './GameSettings';
import styles from './lobby.module.css';

interface GameLobbyProps {
  roomCode: string;
  players: LobbyPlayerInfo[];
  settings: LobbyGameSettings;
  currentPlayerId: string;
  isHost: boolean;
  onStart: () => void;
  onLeave: () => void;
  onSettingsChange: (settings: LobbyGameSettings) => void;
  onColorChange: (color: PlayerColor) => void;
  onToggleReady: () => void;
  onKick?: (playerId: string) => void;
}

// Game mode options
const GAME_MODES = [
  { id: 'standard', icon: '🎲', label: 'Standard', description: 'Classic Catan' },
  { id: 'cities', icon: '🏰', label: 'Cities & Knights', description: 'Coming soon', disabled: true },
  { id: 'seafarers', icon: '⛵', label: 'Seafarers', description: 'Coming soon', disabled: true },
];

// Map options
const MAP_OPTIONS = [
  { id: 'standard', icon: '🗺️', label: 'Standard', description: '3-4 players' },
  { id: 'expansion', icon: '🌍', label: 'Expansion', description: '5-6 players', disabled: true },
  { id: 'custom', icon: '✏️', label: 'Custom', description: 'Coming soon', disabled: true },
];

// Rule toggles
const RULE_OPTIONS = [
  { id: 'friendlyRobber', label: 'Friendly Robber' },
  { id: 'randomTurnOrder', label: 'Random Turn Order' },
  { id: 'speedMode', label: 'Speed Mode' },
  { id: 'hiddenVPs', label: 'Hidden VPs' },
];

/**
 * GameLobby - Bento grid layout for game lobby
 */
export function GameLobby({
  roomCode,
  players,
  settings,
  currentPlayerId,
  isHost,
  onStart,
  onLeave,
  onSettingsChange,
  onColorChange,
  onToggleReady,
  onKick,
}: GameLobbyProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages] = useState<{ author: string; text: string }[]>([]);

  // Local settings state for UI
  const [gameMode, setGameMode] = useState('standard');
  const [mapType, setMapType] = useState('standard');
  const [rules, setRules] = useState<Record<string, boolean>>({
    friendlyRobber: false,
    randomTurnOrder: true,
    speedMode: false,
    hiddenVPs: false,
  });
  const [advancedSettings, setAdvancedSettings] = useState({
    turnTimer: 90,
    maxPlayers: 4,
    victoryPoints: 10,
    discardLimit: 7,
  });

  // Get current player
  const currentPlayer = useMemo(
    () => players.find((p) => p.id === currentPlayerId),
    [players, currentPlayerId]
  );

  // Calculate available colors (not taken by other players)
  const availableColors = useMemo(() => {
    const takenColors = new Set(
      players
        .filter((p) => p.id !== currentPlayerId && p.color)
        .map((p) => p.color as PlayerColor)
    );
    return PLAYER_COLORS.filter((color) => !takenColors.has(color));
  }, [players, currentPlayerId]);

  // Check if all players are ready (and have colors selected)
  const allPlayersReady = useMemo(
    () =>
      players.length > 0 &&
      players.every((p) => p.isReady && p.color !== null),
    [players]
  );

  const minPlayers = 1;
  const canStart = isHost && players.length >= minPlayers && allPlayersReady;

  const handleKick = useCallback(
    (playerId: string) => {
      if (isHost && onKick) {
        onKick(playerId);
      }
    },
    [isHost, onKick]
  );

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [roomCode]);

  const handleRuleToggle = (ruleId: string) => {
    if (!isHost) return;
    setRules(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  const handleAdvancedChange = (key: string, value: number) => {
    if (!isHost) return;
    setAdvancedSettings(prev => ({ ...prev, [key]: value }));
    // Sync with parent settings if needed
    if (key === 'maxPlayers') {
      onSettingsChange({ ...settings, playerCount: value });
    } else if (key === 'victoryPoints') {
      onSettingsChange({ ...settings, victoryPoints: value });
    }
  };

  return (
    <div className={styles.gameLobbyContainer}>
      {/* Room ID Header */}
      <div className={styles.gameLobbyHeader}>
        <div className={styles.gameLobbyRoomHeader}>
          <span className={styles.gameLobbyRoomLabel}>Room</span>
          <span className={styles.gameLobbyRoomCode}>{roomCode}</span>
          <button
            className={`${styles.gameLobbyInviteCopyButton} ${copiedLink ? styles.copied : ''}`}
            onClick={handleCopyCode}
          >
            {copiedLink ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>

      {/* 3-Column Bento Grid */}
      <div className={styles.gameLobbyContent}>
        {/* Left Column - Players */}
        <div className={styles.gameLobbyPlayersColumn}>
          <div className={`${styles.gameLobbyPanel} ${styles.gameLobbyPlayersPanel}`}>
            <h3 className={styles.gameLobbyPanelTitle}>
              Players ({players.length}/{advancedSettings.maxPlayers})
            </h3>
            <PlayerList
              players={players}
              currentPlayerId={currentPlayerId}
              maxPlayers={advancedSettings.maxPlayers}
              isHost={isHost}
              onKick={isHost ? handleKick : undefined}
            />

            {/* Add Bot Button */}
            {players.length < advancedSettings.maxPlayers && isHost && (
              <button className={styles.gameLobbyAddBotButton}>
                + Add Bot
              </button>
            )}

            {/* Color Picker */}
            <div className={styles.gameLobbyColorSection}>
              <label className={styles.gameLobbyColorLabel}>Your Color</label>
              <ColorPicker
                selectedColor={currentPlayer?.color || null}
                availableColors={availableColors}
                onChange={onColorChange}
              />
            </div>
          </div>
        </div>

        {/* Center Column - Settings */}
        <div className={styles.gameLobbySettingsColumn}>
          {/* Game Mode */}
          <div className={styles.gameLobbyPanel}>
            <h3 className={styles.gameLobbyPanelTitle}>Game Mode</h3>
            <div className={styles.gameLobbyCardSelector}>
              {GAME_MODES.map((mode) => (
                <div
                  key={mode.id}
                  className={`${styles.gameLobbyCardOption} ${gameMode === mode.id ? styles.selected : ''} ${mode.disabled ? styles.disabled : ''}`}
                  onClick={() => !mode.disabled && isHost && setGameMode(mode.id)}
                >
                  <div className={styles.gameLobbyCardIcon}>{mode.icon}</div>
                  <div className={styles.gameLobbyCardLabel}>{mode.label}</div>
                  <div className={styles.gameLobbyCardDescription}>{mode.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Selection */}
          <div className={styles.gameLobbyPanel}>
            <h3 className={styles.gameLobbyPanelTitle}>Map</h3>
            <div className={styles.gameLobbyCardSelector}>
              {MAP_OPTIONS.map((map) => (
                <div
                  key={map.id}
                  className={`${styles.gameLobbyCardOption} ${mapType === map.id ? styles.selected : ''} ${map.disabled ? styles.disabled : ''}`}
                  onClick={() => !map.disabled && isHost && setMapType(map.id)}
                >
                  <div className={styles.gameLobbyCardIcon}>{map.icon}</div>
                  <div className={styles.gameLobbyCardLabel}>{map.label}</div>
                  <div className={styles.gameLobbyCardDescription}>{map.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className={styles.gameLobbyPanel}>
            <h3 className={styles.gameLobbyPanelTitle}>Rules</h3>
            <div className={styles.gameLobbyRulesGrid}>
              {RULE_OPTIONS.map((rule) => (
                <div
                  key={rule.id}
                  className={`${styles.gameLobbyRuleToggle} ${rules[rule.id] ? styles.active : ''} ${!isHost ? styles.disabled : ''}`}
                  onClick={() => handleRuleToggle(rule.id)}
                >
                  <span className={styles.gameLobbyRuleLabel}>{rule.label}</span>
                  <div className={styles.gameLobbyRuleIndicator} />
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className={styles.gameLobbyPanel}>
            <h3 className={styles.gameLobbyPanelTitle}>Advanced</h3>
            <div className={styles.gameLobbyAdvancedGrid}>
              <div className={styles.gameLobbySliderRow}>
                <span className={styles.gameLobbySliderLabel}>Turn Timer</span>
                <input
                  type="range"
                  className={styles.gameLobbySlider}
                  min={30}
                  max={300}
                  step={15}
                  value={advancedSettings.turnTimer}
                  onChange={(e) => handleAdvancedChange('turnTimer', Number(e.target.value))}
                  disabled={!isHost}
                />
                <span className={styles.gameLobbySliderValue}>{advancedSettings.turnTimer}s</span>
              </div>
              <div className={styles.gameLobbySliderRow}>
                <span className={styles.gameLobbySliderLabel}>Max Players</span>
                <input
                  type="range"
                  className={styles.gameLobbySlider}
                  min={2}
                  max={6}
                  step={1}
                  value={advancedSettings.maxPlayers}
                  onChange={(e) => handleAdvancedChange('maxPlayers', Number(e.target.value))}
                  disabled={!isHost}
                />
                <span className={styles.gameLobbySliderValue}>{advancedSettings.maxPlayers}</span>
              </div>
              <div className={styles.gameLobbySliderRow}>
                <span className={styles.gameLobbySliderLabel}>Victory Points</span>
                <input
                  type="range"
                  className={styles.gameLobbySlider}
                  min={8}
                  max={15}
                  step={1}
                  value={advancedSettings.victoryPoints}
                  onChange={(e) => handleAdvancedChange('victoryPoints', Number(e.target.value))}
                  disabled={!isHost}
                />
                <span className={styles.gameLobbySliderValue}>{advancedSettings.victoryPoints}</span>
              </div>
              <div className={styles.gameLobbySliderRow}>
                <span className={styles.gameLobbySliderLabel}>Discard Limit</span>
                <input
                  type="range"
                  className={styles.gameLobbySlider}
                  min={5}
                  max={10}
                  step={1}
                  value={advancedSettings.discardLimit}
                  onChange={(e) => handleAdvancedChange('discardLimit', Number(e.target.value))}
                  disabled={!isHost}
                />
                <span className={styles.gameLobbySliderValue}>{advancedSettings.discardLimit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className={styles.gameLobbyChatColumn}>
          <div className={`${styles.gameLobbyPanel} ${styles.gameLobbyChatPanel}`}>
            <h3 className={styles.gameLobbyPanelTitle}>Chat</h3>
            <div className={styles.gameLobbyChatMessages}>
              {chatMessages.length === 0 ? (
                <div className={styles.gameLobbyChatEmpty}>
                  No messages yet...
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={styles.gameLobbyChatMessage}>
                    <span className={styles.gameLobbyChatMessageAuthor}>{msg.author}:</span>
                    <span className={styles.gameLobbyChatMessageText}>{msg.text}</span>
                  </div>
                ))
              )}
            </div>
            <div className={styles.gameLobbyChatInputContainer}>
              <input
                type="text"
                className={styles.gameLobbyChatInput}
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatMessage.trim()) {
                    // TODO: Send chat message
                    setChatMessage('');
                  }
                }}
              />
              <button className={styles.gameLobbyChatSendButton}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.gameLobbyFooter}>
        <button
          type="button"
          className={styles.gameLobbyLeaveButton}
          onClick={onLeave}
        >
          Leave
        </button>

        {isHost ? (
          <button
            type="button"
            className={styles.gameLobbyStartButton}
            onClick={onStart}
            disabled={!canStart}
          >
            Start Game
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.gameLobbyReadyButton} ${currentPlayer?.isReady ? styles.ready : ''}`}
            onClick={onToggleReady}
            disabled={!currentPlayer?.color}
          >
            {currentPlayer?.isReady ? 'Ready!' : 'Ready Up'}
          </button>
        )}
      </div>
    </div>
  );
}

export default GameLobby;
