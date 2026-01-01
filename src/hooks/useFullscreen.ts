/**
 * useFullscreen - Fullscreen management hook
 *
 * Provides methods to enter, exit, and toggle fullscreen mode,
 * with state tracking for the current fullscreen status.
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseFullscreenReturn {
  /** Whether the document is currently in fullscreen mode */
  isFullscreen: boolean;
  /** Enter fullscreen mode */
  enterFullscreen: () => Promise<void>;
  /** Exit fullscreen mode */
  exitFullscreen: () => Promise<void>;
  /** Toggle fullscreen mode */
  toggleFullscreen: () => Promise<void>;
  /** Whether fullscreen is supported by the browser */
  isSupported: boolean;
}

/**
 * Hook for managing fullscreen mode
 *
 * @returns Fullscreen state and control methods
 *
 * @example
 * ```typescript
 * const { isFullscreen, toggleFullscreen } = useFullscreen();
 *
 * return (
 *   <button onClick={toggleFullscreen}>
 *     {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
 *   </button>
 * );
 * ```
 */
export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Check if fullscreen API is supported
  const isSupported =
    typeof document !== 'undefined' &&
    (document.fullscreenEnabled ||
      (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
      (document as unknown as { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
      (document as unknown as { msFullscreenEnabled?: boolean }).msFullscreenEnabled);

  /**
   * Enter fullscreen mode
   */
  const enterFullscreen = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      console.warn('Fullscreen API is not supported in this browser');
      return;
    }

    const element = document.documentElement;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (element as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      } else if ((element as unknown as { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) {
        await (element as unknown as { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen();
      } else if ((element as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
        await (element as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, [isSupported]);

  /**
   * Exit fullscreen mode
   */
  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      return;
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
        await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
      } else if ((document as unknown as { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) {
        await (document as unknown as { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen();
      } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
        await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, [isSupported]);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  /**
   * Check current fullscreen state
   */
  const checkFullscreenState = useCallback((): boolean => {
    return !!(
      document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
      (document as unknown as { mozFullScreenElement?: Element }).mozFullScreenElement ||
      (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
    );
  }, []);

  /**
   * Listen for fullscreen changes
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(checkFullscreenState());
    };

    // Set initial state
    setIsFullscreen(checkFullscreenState());

    // Add listeners for all vendor prefixes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [checkFullscreenState]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    isSupported,
  };
}

export default useFullscreen;
