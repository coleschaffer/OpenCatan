/**
 * Audio Module - Public exports for OpenCatan audio system
 *
 * This module provides all audio functionality for the game including:
 * - Sound effect management via SoundManager
 * - Sound effect types and file mappings
 * - Audio initialization component
 */

// Sound Manager
export { soundManager, SoundManager } from './SoundManager';

// Sound effects types and utilities
export {
  type SoundEffect,
  type SoundCategory,
  SOUND_FILES,
  SOUND_CATEGORIES,
  getAllSoundPaths,
  getSoundPath,
  getRandomSoundPath,
} from './soundEffects';

// Audio initialization component
export { AudioInitializer } from './AudioInitializer';
