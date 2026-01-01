import { useCallback } from 'react';
import type { GameMode, MapType } from '@/types';
import styles from './lobby.module.css';

/**
 * Game settings configurable in the lobby
 */
export interface LobbyGameSettings {
  mode: GameMode;
  playerCount: number;
  victoryPoints: number;
  turnTimer: number;
  discardLimit: number;
  map: MapType;
  friendlyRobber: boolean;
  hideBankCards: boolean;
}

interface GameSettingsProps {
  settings: LobbyGameSettings;
  onChange: (settings: LobbyGameSettings) => void;
  disabled: boolean;
}

// Timer presets
const TIMER_OPTIONS = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 120, label: '2 min' },
  { value: 0, label: 'Unlimited' },
];

// Discard limit presets
const DISCARD_OPTIONS = [
  7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 25, 0, // 0 = unlimited
];

/**
 * GameSettings - Host settings panel for configuring game options
 *
 * Features:
 * - Mode selector: Base, Cities & Knights, Seafarers
 * - Player count: 2-8 dropdown
 * - Victory points: 3-20 dropdown
 * - Turn timer: Preset options (15s, 30s, 60s, 2min, Unlimited)
 * - Discard limit: Preset options (7-15, 20, 25, Unlimited)
 * - Map type: Random, Beginner
 * - Friendly robber checkbox
 * - Non-hosts see settings as read-only
 */
export function GameSettings({ settings, onChange, disabled }: GameSettingsProps) {
  const updateSetting = useCallback(
    <K extends keyof LobbyGameSettings>(key: K, value: LobbyGameSettings[K]) => {
      onChange({ ...settings, [key]: value });
    },
    [settings, onChange]
  );

  return (
    <div className={`${styles.settingsContainer} ${disabled ? styles.settingsDisabledOverlay : ''}`}>
      {/* Game Mode */}
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel} htmlFor="mode">
          Game Mode
        </label>
        <select
          id="mode"
          className={styles.settingsSelect}
          value={settings.mode}
          onChange={(e) => updateSetting('mode', e.target.value as GameMode)}
          disabled={disabled}
        >
          <option value="base">Base Game</option>
          <option value="cities-knights">Cities & Knights</option>
          <option value="seafarers">Seafarers</option>
        </select>
      </div>

      {/* Player Count: 2-8 dropdown */}
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel} htmlFor="playerCount">
          Players
        </label>
        <select
          id="playerCount"
          className={styles.settingsSelect}
          value={settings.playerCount}
          onChange={(e) => updateSetting('playerCount', parseInt(e.target.value, 10))}
          disabled={disabled}
        >
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n} Players
            </option>
          ))}
        </select>
      </div>

      {/* Victory Points: 3-20 dropdown */}
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel} htmlFor="victoryPoints">
          Victory Points
        </label>
        <select
          id="victoryPoints"
          className={styles.settingsSelect}
          value={settings.victoryPoints}
          onChange={(e) => updateSetting('victoryPoints', parseInt(e.target.value, 10))}
          disabled={disabled}
        >
          {Array.from({ length: 18 }, (_, i) => i + 3).map((n) => (
            <option key={n} value={n}>
              {n} VP
            </option>
          ))}
        </select>
      </div>

      {/* Turn Timer: preset options dropdown */}
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel} htmlFor="turnTimer">
          Turn Timer
        </label>
        <select
          id="turnTimer"
          className={styles.settingsSelect}
          value={settings.turnTimer}
          onChange={(e) => updateSetting('turnTimer', parseInt(e.target.value, 10))}
          disabled={disabled}
        >
          {TIMER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Discard Limit: preset options dropdown */}
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel} htmlFor="discardLimit">
          Discard Limit
        </label>
        <select
          id="discardLimit"
          className={styles.settingsSelect}
          value={settings.discardLimit}
          onChange={(e) => updateSetting('discardLimit', parseInt(e.target.value, 10))}
          disabled={disabled}
        >
          {DISCARD_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n === 0 ? 'Unlimited' : `${n} cards`}
            </option>
          ))}
        </select>
      </div>

      {/* Map Type */}
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel} htmlFor="map">
          Map
        </label>
        <select
          id="map"
          className={styles.settingsSelect}
          value={settings.map}
          onChange={(e) => updateSetting('map', e.target.value as MapType)}
          disabled={disabled}
        >
          <option value="random">Random</option>
          <option value="beginner">Beginner</option>
        </select>
      </div>

      {/* Friendly Robber Toggle */}
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel} htmlFor="friendlyRobber">
          Friendly Robber
        </label>
        <div className={styles.settingsToggleContainer}>
          <button
            type="button"
            id="friendlyRobber"
            className={`${styles.settingsToggle} ${settings.friendlyRobber ? styles.settingsToggleActive : ''}`}
            onClick={() => updateSetting('friendlyRobber', !settings.friendlyRobber)}
            disabled={disabled}
            aria-pressed={settings.friendlyRobber}
          />
          <span className={styles.settingsToggleLabel}>
            {settings.friendlyRobber ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Hide Bank Cards Toggle */}
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel} htmlFor="hideBankCards">
          Hide Bank Cards
        </label>
        <div className={styles.settingsToggleContainer}>
          <button
            type="button"
            id="hideBankCards"
            className={`${styles.settingsToggle} ${settings.hideBankCards ? styles.settingsToggleActive : ''}`}
            onClick={() => updateSetting('hideBankCards', !settings.hideBankCards)}
            disabled={disabled}
            aria-pressed={settings.hideBankCards}
          />
          <span className={styles.settingsToggleLabel}>
            {settings.hideBankCards ? 'Hidden' : 'Visible'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default GameSettings;
