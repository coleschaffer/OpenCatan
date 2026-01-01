/**
 * SettingsModal - In-game settings modal
 *
 * Provides access to audio, display, controls, and game info settings
 * through a tabbed interface.
 */

import React, { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Tabs, Tab } from '../ui/Tabs';
import { Toggle } from '../ui/Toggle';
import { Slider } from '../ui/Slider';
import { LeaveGameConfirm } from './LeaveGameConfirm';
import { useSettings } from '@/hooks/useSettings';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import styles from './SettingsModal.module.css';

export interface SettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
}

/**
 * Get color value from player color name
 */
const getPlayerColorValue = (color: string | null): string => {
  const colorMap: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    orange: '#f97316',
    white: '#f5f5f5',
    brown: '#a16207',
  };
  return color ? colorMap[color] || '#888888' : '#888888';
};

/**
 * Format game mode for display
 */
const formatGameMode = (mode: string): string => {
  const modeNames: Record<string, string> = {
    base: 'Base Game',
    'base-5-6': 'Base Game (5-6 Players)',
    'cities-knights': 'Cities & Knights',
    'cities-knights-5-6': 'Cities & Knights (5-6 Players)',
    seafarers: 'Seafarers',
    'seafarers-5-6': 'Seafarers (5-6 Players)',
  };
  return modeNames[mode] || mode;
};

/**
 * Format turn timer for display
 */
const formatTurnTimer = (seconds: number): string => {
  if (seconds === 0) return 'Unlimited';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

/**
 * Audio settings tab content
 */
const AudioTab: React.FC = () => {
  const { soundEnabled, setSoundEnabled, volume, setVolume } = useSettings();

  return (
    <div className={styles.settingsContent}>
      <div className={styles.section}>
        <Slider
          value={volume}
          onChange={setVolume}
          min={0}
          max={100}
          step={5}
          label="Master Volume"
          showValue
          formatValue={(v) => `${v}%`}
          disabled={!soundEnabled}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Sound Effects</span>
            <span className={styles.settingDescription}>
              Play sounds for game events
            </span>
          </div>
          <Toggle
            checked={soundEnabled}
            onChange={setSoundEnabled}
          />
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Music</span>
            <span className={styles.settingDescription}>
              Background music (when available)
            </span>
          </div>
          <Toggle
            checked={false}
            onChange={() => {}}
            disabled
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Display settings tab content
 */
const DisplayTab: React.FC = () => {
  const {
    isFullscreen,
    toggleFullscreen,
    fullscreenSupported,
    showTooltips,
    toggleTooltips,
    showDiceStats,
    toggleDiceStats,
    compactPanels,
    toggleCompactPanels,
    zoomLevel,
    setZoomLevel,
  } = useSettings();

  return (
    <div className={styles.settingsContent}>
      <div className={styles.section}>
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Fullscreen</span>
            <span className={styles.settingDescription}>
              Play in fullscreen mode
            </span>
          </div>
          <Toggle
            checked={isFullscreen}
            onChange={toggleFullscreen}
            disabled={!fullscreenSupported}
          />
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Show Tooltips</span>
            <span className={styles.settingDescription}>
              Display building cost hints
            </span>
          </div>
          <Toggle
            checked={showTooltips}
            onChange={toggleTooltips}
          />
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Show Dice Stats</span>
            <span className={styles.settingDescription}>
              Display dice roll statistics
            </span>
          </div>
          <Toggle
            checked={showDiceStats}
            onChange={toggleDiceStats}
          />
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Compact Panels</span>
            <span className={styles.settingDescription}>
              Use smaller player panels
            </span>
          </div>
          <Toggle
            checked={compactPanels}
            onChange={toggleCompactPanels}
          />
        </div>
      </div>

      <div className={styles.sectionDivider} />

      <div className={styles.section}>
        <Slider
          value={zoomLevel * 100}
          onChange={(v) => setZoomLevel(v / 100)}
          min={50}
          max={200}
          step={10}
          label="Board Zoom"
          showValue
          formatValue={(v) => `${v}%`}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Colorblind Mode</span>
            <span className={styles.settingDescription}>
              Enhanced color contrast (coming soon)
            </span>
          </div>
          <Toggle
            checked={false}
            onChange={() => {}}
            disabled
          />
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Animation Speed</span>
          </div>
          <select className={styles.select} disabled>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
            <option value="off">Off</option>
          </select>
        </div>
      </div>
    </div>
  );
};

/**
 * Controls/Keyboard shortcuts tab content
 */
const ControlsTab: React.FC = () => {
  return (
    <div className={styles.settingsContent}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Keyboard Shortcuts</h3>
        <div className={styles.shortcutsList}>
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <div key={shortcut.key} className={styles.shortcutItem}>
              <span className={styles.shortcutAction}>{shortcut.description}</span>
              <kbd className={styles.shortcutKey}>{shortcut.key}</kbd>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sectionDivider} />

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Additional Controls</h3>
        <div className={styles.shortcutsList}>
          <div className={styles.shortcutItem}>
            <span className={styles.shortcutAction}>Roll Dice</span>
            <kbd className={styles.shortcutKey}>Space</kbd>
          </div>
          <div className={styles.shortcutItem}>
            <span className={styles.shortcutAction}>Confirm / End Turn</span>
            <kbd className={styles.shortcutKey}>Enter</kbd>
          </div>
          <div className={styles.shortcutItem}>
            <span className={styles.shortcutAction}>Open Help</span>
            <kbd className={styles.shortcutKey}>?</kbd>
          </div>
          <div className={styles.shortcutItem}>
            <span className={styles.shortcutAction}>Open Settings</span>
            <kbd className={styles.shortcutKey}>,</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Game info tab content
 */
const GameInfoTab: React.FC<{ onLeaveGame: () => void }> = ({ onLeaveGame }) => {
  const {
    roomCode,
    gameMode,
    victoryPoints,
    turnTimer,
    turnNumber,
    players,
    isHost,
    localPlayerId,
    copyRoomCode,
  } = useSettings();

  const [copied, setCopied] = useState(false);

  const handleCopyRoomCode = async () => {
    const success = await copyRoomCode();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.settingsContent}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Game Details</h3>
        <div className={styles.infoTable}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Room Code</span>
            <button
              className={styles.infoValueClickable}
              onClick={handleCopyRoomCode}
              title="Click to copy"
              type="button"
            >
              <span className={`${styles.infoValue} ${styles.roomCode}`}>
                {roomCode || '----'}
              </span>
              {copied ? (
                <span className={styles.copyFeedback}>Copied!</span>
              ) : (
                <svg
                  className={styles.copyIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </button>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Game Mode</span>
            <span className={styles.infoValue}>{formatGameMode(gameMode)}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Victory Points</span>
            <span className={styles.infoValue}>{victoryPoints} points to win</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Turn Timer</span>
            <span className={styles.infoValue}>{formatTurnTimer(turnTimer)}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Current Turn</span>
            <span className={styles.infoValue}>Turn {turnNumber}</span>
          </div>
        </div>
      </div>

      <div className={styles.sectionDivider} />

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Players</h3>
        <div className={styles.playersList}>
          {players.map((player) => (
            <div key={player.id} className={styles.playerRow}>
              <div
                className={styles.playerColor}
                style={{ backgroundColor: getPlayerColorValue(player.color) }}
              />
              <span className={styles.playerName}>{player.name}</span>
              {player.isHost && (
                <span className={`${styles.playerBadge} ${styles.hostBadge}`}>
                  Host
                </span>
              )}
              {player.id === localPlayerId && (
                <span className={`${styles.playerBadge} ${styles.youBadge}`}>
                  You
                </span>
              )}
              <div className={styles.playerStatus}>
                <div
                  className={`${styles.statusDot} ${
                    player.isConnected ? styles.statusConnected : styles.statusDisconnected
                  }`}
                />
                <span className={styles.statusText}>
                  {player.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sectionDivider} />

      <div className={styles.dangerZone}>
        <h4 className={styles.dangerTitle}>Danger Zone</h4>
        <p className={styles.dangerDescription}>
          Leaving the game will remove you from the match. The game will continue without you.
          {isHost && ' As host, another player will become the new host.'}
        </p>
        <button
          className={styles.dangerButton}
          onClick={onLeaveGame}
          type="button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Leave Game
        </button>
      </div>
    </div>
  );
};

/**
 * In-game settings modal with tabbed interface
 *
 * Tabs:
 * - Audio: Volume, sound effects, music toggles
 * - Display: Fullscreen, tooltips, colorblind mode, animation speed
 * - Controls: Keyboard shortcuts reference
 * - Game Info: Room code, game mode, players list, leave game
 *
 * @param isOpen - Whether modal is visible
 * @param onClose - Callback to close modal
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('audio');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { isHost, leaveGame, closeSettings } = useSettings();

  const handleLeaveClick = useCallback(() => {
    setShowLeaveConfirm(true);
  }, []);

  const handleLeaveConfirm = useCallback(() => {
    setShowLeaveConfirm(false);
    leaveGame();
    onClose();
  }, [leaveGame, onClose]);

  const handleLeaveCancel = useCallback(() => {
    setShowLeaveConfirm(false);
  }, []);

  const handleClose = useCallback(() => {
    closeSettings();
    onClose();
  }, [closeSettings, onClose]);

  const tabs: Tab[] = [
    {
      id: 'audio',
      label: 'Audio',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
      ),
      content: <AudioTab />,
    },
    {
      id: 'display',
      label: 'Display',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      content: <DisplayTab />,
    },
    {
      id: 'controls',
      label: 'Controls',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01" />
          <path d="M8 12h8" />
          <path d="M6 16h.01M10 16h.01M14 16h.01M18 16h.01" />
        </svg>
      ),
      content: <ControlsTab />,
    },
    {
      id: 'game-info',
      label: 'Game Info',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      content: <GameInfoTab onLeaveGame={handleLeaveClick} />,
    },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Settings"
        size="large"
        className={styles.settingsModal}
        footer={
          <div className={styles.modalFooter}>
            <div className={styles.footerLeft} />
            <div className={styles.footerRight}>
              <button
                className={styles.closeButton}
                onClick={handleClose}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          align="stretch"
        />
      </Modal>

      <LeaveGameConfirm
        isOpen={showLeaveConfirm}
        onClose={handleLeaveCancel}
        onConfirm={handleLeaveConfirm}
        isHost={isHost}
      />
    </>
  );
};

export default SettingsModal;
