/**
 * SoundManager - Central sound management for OpenCatan
 *
 * Handles all audio playback using the Web Audio API for low-latency,
 * high-quality sound effects. Supports:
 * - Preloading of all sound effects
 * - Volume control and muting
 * - Random variants for certain sounds (e.g., dice rolls)
 * - Graceful fallback when audio is unavailable
 */

import {
  SoundEffect,
  SOUND_FILES,
  getAllSoundPaths,
  getRandomSoundPath,
} from './soundEffects';

/**
 * SoundManager class - Singleton pattern for global audio management
 */
class SoundManager {
  /** Web Audio API context */
  private audioContext: AudioContext | null = null;

  /** Master gain node for volume control */
  private masterGain: GainNode | null = null;

  /** Cached audio buffers for each sound file */
  private sounds: Map<string, AudioBuffer> = new Map();

  /** Current volume level (0.0 - 1.0) */
  private volume: number = 0.8;

  /** Whether audio is muted */
  private muted: boolean = false;

  /** Whether the audio context has been initialized */
  private initialized: boolean = false;

  /** Whether sounds have been preloaded */
  private preloaded: boolean = false;

  /** Pending preload promise (to avoid duplicate loading) */
  private preloadPromise: Promise<void> | null = null;

  /** Callbacks for initialization state changes */
  private initCallbacks: Set<(initialized: boolean) => void> = new Set();

  /**
   * Initialize the audio context
   * Must be called after a user gesture (click, keypress, etc.)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create audio context
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) {
        console.warn('Web Audio API is not supported in this browser');
        return;
      }

      this.audioContext = new AudioContextClass();

      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.muted ? 0 : this.volume;

      // Resume context if suspended (Safari requires this)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.initialized = true;
      this.notifyInitCallbacks();

      console.log('SoundManager: Audio context initialized');

      // Start preloading sounds in the background
      this.preloadSounds();
    } catch (error) {
      console.error('SoundManager: Failed to initialize audio context', error);
    }
  }

  /**
   * Check if the audio context is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Register a callback for initialization state changes
   */
  onInitialized(callback: (initialized: boolean) => void): () => void {
    this.initCallbacks.add(callback);
    // Immediately call with current state
    callback(this.initialized);
    // Return unsubscribe function
    return () => {
      this.initCallbacks.delete(callback);
    };
  }

  /**
   * Notify all initialization callbacks
   */
  private notifyInitCallbacks(): void {
    this.initCallbacks.forEach((callback) => callback(this.initialized));
  }

  /**
   * Preload all sound effects
   */
  async preloadSounds(): Promise<void> {
    // Return existing promise if already loading
    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    if (this.preloaded) {
      return;
    }

    if (!this.audioContext) {
      console.warn('SoundManager: Cannot preload - audio context not initialized');
      return;
    }

    this.preloadPromise = this.doPreload();
    return this.preloadPromise;
  }

  /**
   * Perform the actual preloading
   */
  private async doPreload(): Promise<void> {
    const paths = getAllSoundPaths();
    const loadPromises = paths.map((path) => this.loadSound(path));

    try {
      await Promise.allSettled(loadPromises);
      this.preloaded = true;
      console.log(`SoundManager: Preloaded ${this.sounds.size} sounds`);
    } catch (error) {
      console.error('SoundManager: Error during preload', error);
    }
  }

  /**
   * Load a single sound file
   */
  private async loadSound(path: string): Promise<void> {
    if (this.sounds.has(path)) {
      return; // Already loaded
    }

    if (!this.audioContext) {
      return;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(path, audioBuffer);
    } catch (error) {
      // Log but don't throw - sounds are non-critical
      console.warn(`SoundManager: Failed to load sound: ${path}`, error);
    }
  }

  /**
   * Play a sound effect
   */
  play(sound: SoundEffect): void {
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    if (this.muted) {
      return;
    }

    // Get the sound path (random if multiple variants)
    const path = getRandomSoundPath(sound);
    const buffer = this.sounds.get(path);

    if (!buffer) {
      // Try to load and play
      this.loadSound(path).then(() => {
        const loadedBuffer = this.sounds.get(path);
        if (loadedBuffer) {
          this.playBuffer(loadedBuffer);
        }
      });
      return;
    }

    this.playBuffer(buffer);
  }

  /**
   * Play an audio buffer
   */
  private playBuffer(buffer: AudioBuffer): void {
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    try {
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create buffer source
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.masterGain);
      source.start(0);
    } catch (error) {
      console.error('SoundManager: Error playing sound', error);
    }
  }

  /**
   * Play dice roll sound (convenience method with random variant)
   */
  playDiceRoll(): void {
    this.play('dice_roll');
  }

  /**
   * Play click sound (convenience method)
   */
  playClick(): void {
    this.play('click');
  }

  /**
   * Set the master volume
   * @param volume - Volume level from 0.0 to 1.0
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    if (this.masterGain && !this.muted) {
      this.masterGain.gain.setValueAtTime(
        this.volume,
        this.audioContext?.currentTime ?? 0
      );
    }
  }

  /**
   * Get the current volume level
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Set the muted state
   */
  setMuted(muted: boolean): void {
    this.muted = muted;

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        muted ? 0 : this.volume,
        this.audioContext?.currentTime ?? 0
      );
    }
  }

  /**
   * Check if audio is muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Suspend the audio context (for background/inactive states)
   */
  suspend(): void {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  /**
   * Resume the audio context
   */
  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
    this.sounds.clear();
    this.initialized = false;
    this.preloaded = false;
    this.preloadPromise = null;
    this.initCallbacks.clear();
  }
}

/**
 * Singleton instance of SoundManager
 */
export const soundManager = new SoundManager();

/**
 * Export class for testing
 */
export { SoundManager };
