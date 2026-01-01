/**
 * useKeyboardShortcuts - Global keyboard shortcuts hook
 *
 * Handles keyboard shortcuts for common game actions during the main phase.
 * Shortcuts are only active when it's the player's turn and in the main phase.
 */

import { useEffect, useCallback } from 'react';
import { useAppSelector } from './useAppSelector';
import { useAppDispatch } from './useAppDispatch';
import {
  setBuildMode,
  openTradeModal,
  clearSelectedAction,
  openModal,
  closeModal,
  selectModal,
  selectBuildMode,
} from '@/game/state/slices/uiSlice';

export interface KeyboardShortcut {
  /** The key that triggers this shortcut */
  key: string;
  /** Description of what the shortcut does */
  description: string;
  /** Action category for grouping */
  category: 'building' | 'actions' | 'navigation';
}

/**
 * All available keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'R', description: 'Build Road', category: 'building' },
  { key: 'S', description: 'Build Settlement', category: 'building' },
  { key: 'C', description: 'Build City', category: 'building' },
  { key: 'T', description: 'Open Trade', category: 'actions' },
  { key: 'D', description: 'Buy Dev Card', category: 'actions' },
  { key: 'E', description: 'End Turn', category: 'actions' },
  { key: 'Escape', description: 'Cancel / Close', category: 'navigation' },
];

export interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
  /** Custom handler for end turn (if not using default) */
  onEndTurn?: () => void;
  /** Custom handler for buy dev card (if not using default) */
  onBuyDevCard?: () => void;
  /** Custom handler for roll dice (if not using default) */
  onRollDice?: () => void;
}

export interface UseKeyboardShortcutsReturn {
  /** List of all keyboard shortcuts */
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook for handling global keyboard shortcuts
 *
 * @param options - Configuration options
 * @returns Object containing the list of shortcuts
 *
 * @example
 * ```typescript
 * // In your game component
 * useKeyboardShortcuts({
 *   onEndTurn: () => gameActions.endTurn(),
 *   onBuyDevCard: () => gameActions.buyDevCard(),
 * });
 * ```
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn {
  const { enabled = true, onEndTurn, onBuyDevCard, onRollDice } = options;

  const dispatch = useAppDispatch();

  // Get game state
  const localPlayerId = useAppSelector((state) => state.lobby.localPlayerId);
  const currentPlayerId = useAppSelector((state) => state.game?.currentPlayerId);
  const phase = useAppSelector((state) => state.game?.phase ?? 'lobby');
  const modal = useAppSelector(selectModal);
  const buildMode = useAppSelector(selectBuildMode);

  // Determine if it's the player's turn
  const isMyTurn = localPlayerId === currentPlayerId;

  // Determine if we're in a phase that accepts shortcuts
  const isMainPhase = phase === 'main';
  const isRollPhase = phase === 'roll';
  const canUseShortcuts = enabled && isMyTurn && (isMainPhase || isRollPhase);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts if typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Always handle Escape for closing modals/canceling
      if (event.key === 'Escape') {
        event.preventDefault();

        // If a modal is open, close it
        if (modal.type !== 'none') {
          dispatch(closeModal());
          return;
        }

        // If in build mode, cancel it
        if (buildMode !== 'none') {
          dispatch(clearSelectedAction());
          return;
        }

        return;
      }

      // Other shortcuts only work during gameplay
      if (!canUseShortcuts) {
        return;
      }

      const key = event.key.toLowerCase();

      // Roll phase shortcuts
      if (isRollPhase) {
        if (key === ' ' || key === 'enter') {
          event.preventDefault();
          onRollDice?.();
        }
        return;
      }

      // Main phase shortcuts
      if (isMainPhase) {
        switch (key) {
          case 'r':
            event.preventDefault();
            dispatch(setBuildMode('road'));
            break;

          case 's':
            event.preventDefault();
            dispatch(setBuildMode('settlement'));
            break;

          case 'c':
            event.preventDefault();
            dispatch(setBuildMode('city'));
            break;

          case 't':
            event.preventDefault();
            dispatch(openTradeModal());
            break;

          case 'd':
            event.preventDefault();
            onBuyDevCard?.();
            break;

          case 'e':
          case 'enter':
            event.preventDefault();
            onEndTurn?.();
            break;

          case 'b':
            event.preventDefault();
            // Toggle build menu or cycle through build modes
            dispatch(openModal({ type: 'help' }));
            break;

          case '?':
          case 'h':
            event.preventDefault();
            dispatch(openModal({ type: 'help' }));
            break;

          case ',':
            event.preventDefault();
            dispatch(openModal({ type: 'settings' }));
            break;
        }
      }
    },
    [
      canUseShortcuts,
      isMainPhase,
      isRollPhase,
      modal,
      buildMode,
      dispatch,
      onEndTurn,
      onBuyDevCard,
      onRollDice,
    ]
  );

  /**
   * Set up and clean up event listener
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts: KEYBOARD_SHORTCUTS,
  };
}

export default useKeyboardShortcuts;
