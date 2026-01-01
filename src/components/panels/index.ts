/**
 * Game UI Panels
 *
 * This module exports all panel components used in the game UI.
 * These components handle player information, game actions, chat,
 * and other game-related displays.
 */

// ============================================================================
// Header Components
// ============================================================================

export { GameHeader } from './GameHeader';

// ============================================================================
// Player Components
// ============================================================================

export { PlayerCard } from './PlayerCard';
export type { PlayerData, PlayerColor } from './PlayerCard';

export { PlayerPanel } from './PlayerPanel';

export { PlayerPanelList } from './PlayerPanelList';

// ============================================================================
// Resource and Card Display
// ============================================================================

export { ResourceHand } from './ResourceHand';
export type { ResourceType, DevCardType, DevCard, Resources } from './ResourceHand';

export { PlayerHand } from './PlayerHand';

export { Bank } from './Bank';

// ============================================================================
// Action Components
// ============================================================================

export { ActionBar } from './ActionBar';
export type { ActionType, GamePhase as ActionBarGamePhase } from './ActionBar';

export { BuildMenu, BUILDING_COSTS } from './BuildMenu';
export type { BuildingType, BuildingCost } from './BuildMenu';

export { BuildModeSelector, BUILDING_COSTS as BUILD_COSTS } from './BuildModeSelector';
export type { BuildingType as BuildType, BuildingCost as BuildCost } from './BuildModeSelector';

export { BuildingToolbar } from './BuildingToolbar';

// ============================================================================
// Log and Chat
// ============================================================================

export { GameLog } from './GameLog';
export type { LogEntry, LogEventType, LogVisibility } from './GameLog';

export { ChatPanel } from './ChatPanel';
export type { ChatMessage as ChatPanelMessage } from './ChatPanel';

export { Chat } from './Chat';
export type { ChatMessage } from './Chat';

export { ChatLogPanel } from './ChatLogPanel';

// ============================================================================
// Timer and Display Components
// ============================================================================

export { TimerDisplay } from './TimerDisplay';

export { TurnTimer } from './TurnTimer';

export { DiceDisplay } from './DiceDisplay';
export type { EventDieValue } from './DiceDisplay';

// ============================================================================
// Trade Components
// ============================================================================

export { TradePanel } from './TradePanel';
export type { TradePanelProps } from './TradePanel';

