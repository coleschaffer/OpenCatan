/**
 * useSound - React hook for sound playback in OpenCatan
 *
 * Provides a simple interface for playing sounds throughout the game.
 * Syncs with Redux UI state for volume and mute settings.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from './index';
import { selectSoundEnabled, selectVolume, setVolume, setSoundEnabled } from '@/game/state/slices/uiSlice';
import { soundManager, type SoundEffect } from '@/audio';

/**
 * Return type for useSound hook
 */
export interface UseSoundReturn {
  /** Play a sound effect */
  playSound: (sound: SoundEffect) => void;
  /** Play the click sound (convenience) */
  playClick: () => void;
  /** Play the dice roll sound (convenience) */
  playDiceRoll: () => void;
  /** Whether sound is enabled */
  soundEnabled: boolean;
  /** Current volume (0-100) */
  volume: number;
  /** Set volume (0-100) */
  setVolume: (volume: number) => void;
  /** Toggle sound on/off */
  toggleSound: () => void;
  /** Whether audio is initialized */
  isInitialized: boolean;
}

/**
 * Hook for playing sound effects with Redux state sync
 */
export function useSound(): UseSoundReturn {
  const dispatch = useAppDispatch();
  const soundEnabled = useAppSelector(selectSoundEnabled);
  const volume = useAppSelector(selectVolume);
  const [isInitialized, setIsInitialized] = useState(soundManager.isInitialized());

  /**
   * Sync muted state with Redux
   */
  useEffect(() => {
    soundManager.setMuted(!soundEnabled);
  }, [soundEnabled]);

  /**
   * Sync volume with Redux (convert from 0-100 to 0-1)
   */
  useEffect(() => {
    soundManager.setVolume(volume / 100);
  }, [volume]);

  /**
   * Subscribe to SoundManager initialization state
   */
  useEffect(() => {
    const unsubscribe = soundManager.onInitialized((initialized) => {
      setIsInitialized(initialized);
    });
    return unsubscribe;
  }, []);

  /**
   * Play a sound effect
   */
  const playSound = useCallback((sound: SoundEffect) => {
    soundManager.play(sound);
  }, []);

  /**
   * Play click sound
   */
  const playClick = useCallback(() => {
    soundManager.playClick();
  }, []);

  /**
   * Play dice roll sound
   */
  const playDiceRoll = useCallback(() => {
    soundManager.playDiceRoll();
  }, []);

  /**
   * Set volume via Redux (expects 0-100)
   */
  const handleSetVolume = useCallback(
    (newVolume: number) => {
      dispatch(setVolume(newVolume));
    },
    [dispatch]
  );

  /**
   * Toggle sound enabled state
   */
  const toggleSound = useCallback(() => {
    dispatch(setSoundEnabled(!soundEnabled));
  }, [dispatch, soundEnabled]);

  return {
    playSound,
    playClick,
    playDiceRoll,
    soundEnabled,
    volume,
    setVolume: handleSetVolume,
    toggleSound,
    isInitialized,
  };
}

export default useSound;
