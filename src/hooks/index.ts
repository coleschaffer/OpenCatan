/**
 * Custom React hooks for OpenCatan
 *
 * Re-exports all custom hooks for easy importing.
 */

// Redux typed hooks
export { useAppSelector } from './useAppSelector';
export { useAppDispatch } from './useAppDispatch';

// Navigation hooks
export { useGameNavigation, type UseGameNavigationReturn } from './useGameNavigation';
export { useRoomCode } from './useRoomCode';

// Game phase hooks
export { useSetupPhase } from './useSetupPhase';
export type { UseSetupPhaseResult } from './useSetupPhase';

export { useGamePhase } from './useGamePhase';
export type { UseGamePhaseReturn } from './useGamePhase';

// Game board hooks
export { useGameBoard } from './useGameBoard';
export type { UseGameBoardReturn } from './useGameBoard';

// Game statistics hooks
export { useGameStats } from './useGameStats';
export type { UseGameStatsReturn } from './useGameStats';

// Victory state hooks
export { useVictory } from './useVictory';
export type { UseVictoryReturn } from './useVictory';

// Robber phase hooks
export { useRobberPhase } from './useRobberPhase';
export type { UseRobberPhaseReturn, RobberPhaseType } from './useRobberPhase';

// Development card hooks
export { useDevCards } from './useDevCards';
export type { UseDevCardsReturn } from './useDevCards';

// Sound hooks
export { useSound } from './useSound';
export type { UseSoundReturn } from './useSound';

export { useGameSounds } from './useGameSounds';

export { useLobbySounds } from './useLobbySounds';

// Settings and UI hooks
export { useFullscreen } from './useFullscreen';
export type { UseFullscreenReturn } from './useFullscreen';

export { useSettings } from './useSettings';
export type { UseSettingsReturn } from './useSettings';

export { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from './useKeyboardShortcuts';
export type { KeyboardShortcut, UseKeyboardShortcutsOptions, UseKeyboardShortcutsReturn } from './useKeyboardShortcuts';

// Trade rate hooks
export { useTradeRates, getDefaultTradeRates } from './useTradeRates';
export type { BankTradeRate, TradeRates, UseTradeRatesReturn } from './useTradeRates';

// Trade hooks
export { useTrade } from './useTrade';
export type { TradeOfferInput, BankTradeInput, TradeValidation, UseTradeReturn } from './useTrade';
