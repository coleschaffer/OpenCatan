/**
 * UI Slice - UI state management for OpenCatan
 *
 * Manages:
 * - Build mode and selections
 * - Trade modal and pending trades
 * - Audio settings
 * - View settings (zoom, fullscreen)
 * - Hover states
 * - Toast notifications
 * - Loading states
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  HexCoord,
  VertexCoord,
  EdgeCoord,
  TradeOffer,
  ResourceType,
  CommodityType,
} from '@/types';

/**
 * Build mode types
 */
export type BuildMode =
  | 'none'
  | 'road'
  | 'settlement'
  | 'city'
  | 'ship'
  | 'knight'
  | 'city-wall'
  | 'city-improvement';

/**
 * Selected action state
 */
export type SelectedAction =
  | { type: 'none' }
  | { type: 'build'; mode: BuildMode }
  | { type: 'move-robber' }
  | { type: 'move-pirate' }
  | { type: 'move-knight'; knightId: string }
  | { type: 'move-ship'; shipId: string }
  | { type: 'select-steal-victim' }
  | { type: 'road-building'; roadsPlaced: number }
  | { type: 'year-of-plenty'; resourcesChosen: ResourceType[] }
  | { type: 'monopoly' }
  | { type: 'place-merchant' };

/**
 * Modal types
 */
export type ModalType =
  | 'none'
  | 'trade'
  | 'trade-incoming'
  | 'discard'
  | 'steal-victim'
  | 'year-of-plenty'
  | 'monopoly'
  | 'development-card'
  | 'progress-card'
  | 'city-improvement'
  | 'settings'
  | 'help'
  | 'victory'
  | 'confirm-end-turn';

/**
 * Modal state
 */
export interface ModalState {
  type: ModalType;
  data?: Record<string, unknown>;
}

/**
 * Toast notification
 */
export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  createdAt: number;
}

/**
 * UI slice state
 */
export interface UISliceState {
  /** Current build mode */
  buildMode: BuildMode;

  /** Currently selected hex */
  selectedHex: HexCoord | null;

  /** Trade modal open state */
  tradeModalOpen: boolean;

  /** Pending trade offer being created/viewed */
  pendingTrade: TradeOffer | null;

  /** Incoming trade offers */
  incomingTradeOffers: TradeOffer[];

  /** Currently selected action */
  selectedAction: SelectedAction;

  /** Current modal state */
  modal: ModalState;

  /** Toast notifications */
  toasts: ToastMessage[];

  /** Sound enabled */
  soundEnabled: boolean;

  /** Volume level (0-100) */
  volume: number;

  /** Show build costs tooltip */
  showBuildCosts: boolean;

  /** Show dice statistics */
  showDiceStats: boolean;

  /** Compact player panels */
  compactPlayerPanels: boolean;

  /** Fullscreen mode */
  isFullscreen: boolean;

  /** Zoom level (0.5 - 2.0) */
  zoomLevel: number;

  /** Hovered hex coordinate */
  hoveredHex: HexCoord | null;

  /** Hovered vertex coordinate */
  hoveredVertex: VertexCoord | null;

  /** Hovered edge coordinate */
  hoveredEdge: EdgeCoord | null;

  /** Loading state */
  isLoading: boolean;

  /** Loading message */
  loadingMessage: string | null;
}

const initialState: UISliceState = {
  buildMode: 'none',
  selectedHex: null,
  tradeModalOpen: false,
  pendingTrade: null,
  incomingTradeOffers: [],
  selectedAction: { type: 'none' },
  modal: { type: 'none' },
  toasts: [],
  soundEnabled: true,
  volume: 80,
  showBuildCosts: false,
  showDiceStats: false,
  compactPlayerPanels: false,
  isFullscreen: false,
  zoomLevel: 1.0,
  hoveredHex: null,
  hoveredVertex: null,
  hoveredEdge: null,
  isLoading: false,
  loadingMessage: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Set build mode
     */
    setBuildMode: (state, action: PayloadAction<BuildMode>) => {
      state.buildMode = action.payload;
      if (action.payload !== 'none') {
        state.selectedAction = { type: 'build', mode: action.payload };
      } else {
        state.selectedAction = { type: 'none' };
      }
    },

    /**
     * Set selected hex
     */
    setSelectedHex: (state, action: PayloadAction<HexCoord | null>) => {
      state.selectedHex = action.payload;
    },

    /**
     * Set the currently selected action
     */
    setSelectedAction: (state, action: PayloadAction<SelectedAction>) => {
      state.selectedAction = action.payload;
      // Sync build mode
      if (action.payload.type === 'build') {
        state.buildMode = action.payload.mode;
      } else {
        state.buildMode = 'none';
      }
    },

    /**
     * Clear the selected action
     */
    clearSelectedAction: (state) => {
      state.selectedAction = { type: 'none' };
      state.buildMode = 'none';
    },

    /**
     * Open trade modal
     */
    openTradeModal: (state) => {
      state.tradeModalOpen = true;
      state.modal = { type: 'trade' };
    },

    /**
     * Close trade modal
     */
    closeTradeModal: (state) => {
      state.tradeModalOpen = false;
      if (state.modal.type === 'trade') {
        state.modal = { type: 'none' };
      }
    },

    /**
     * Set pending trade offer
     */
    setPendingTrade: (state, action: PayloadAction<TradeOffer | null>) => {
      state.pendingTrade = action.payload;
    },

    /**
     * Update pending trade offer
     */
    updatePendingTrade: (state, action: PayloadAction<Partial<TradeOffer>>) => {
      if (state.pendingTrade) {
        Object.assign(state.pendingTrade, action.payload);
      }
    },

    /**
     * Add an incoming trade offer
     */
    addIncomingTradeOffer: (state, action: PayloadAction<TradeOffer>) => {
      if (!state.incomingTradeOffers.find((o) => o.id === action.payload.id)) {
        state.incomingTradeOffers.push(action.payload);
      }
    },

    /**
     * Update an incoming trade offer
     */
    updateIncomingTradeOffer: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<TradeOffer> }>
    ) => {
      const offer = state.incomingTradeOffers.find(
        (o) => o.id === action.payload.id
      );
      if (offer) {
        Object.assign(offer, action.payload.updates);
      }
    },

    /**
     * Remove an incoming trade offer
     */
    removeIncomingTradeOffer: (state, action: PayloadAction<string>) => {
      state.incomingTradeOffers = state.incomingTradeOffers.filter(
        (o) => o.id !== action.payload
      );
    },

    /**
     * Clear all incoming trade offers
     */
    clearIncomingTradeOffers: (state) => {
      state.incomingTradeOffers = [];
    },

    /**
     * Open a modal
     */
    openModal: (
      state,
      action: PayloadAction<{ type: ModalType; data?: Record<string, unknown> }>
    ) => {
      state.modal = {
        type: action.payload.type,
        data: action.payload.data,
      };
      if (action.payload.type === 'trade') {
        state.tradeModalOpen = true;
      }
    },

    /**
     * Close the current modal
     */
    closeModal: (state) => {
      state.modal = { type: 'none' };
      state.tradeModalOpen = false;
    },

    /**
     * Toggle sound on/off
     */
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },

    /**
     * Set sound enabled state
     */
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },

    /**
     * Set volume level
     */
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = Math.max(0, Math.min(100, action.payload));
    },

    /**
     * Add a toast notification
     */
    addToast: (
      state,
      action: PayloadAction<{
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
        duration?: number;
      }>
    ) => {
      const toast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: action.payload.message,
        type: action.payload.type,
        duration: action.payload.duration ?? 3000,
        createdAt: Date.now(),
      };
      state.toasts.push(toast);
    },

    /**
     * Remove a toast notification
     */
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    /**
     * Clear all toasts
     */
    clearToasts: (state) => {
      state.toasts = [];
    },

    /**
     * Toggle build costs display
     */
    toggleBuildCosts: (state) => {
      state.showBuildCosts = !state.showBuildCosts;
    },

    /**
     * Toggle dice stats display
     */
    toggleDiceStats: (state) => {
      state.showDiceStats = !state.showDiceStats;
    },

    /**
     * Toggle compact player panels
     */
    toggleCompactPlayerPanels: (state) => {
      state.compactPlayerPanels = !state.compactPlayerPanels;
    },

    /**
     * Set fullscreen mode
     */
    setFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload;
    },

    /**
     * Set zoom level
     */
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = Math.max(0.5, Math.min(2.0, action.payload));
    },

    /**
     * Zoom in
     */
    zoomIn: (state) => {
      state.zoomLevel = Math.min(2.0, state.zoomLevel + 0.1);
    },

    /**
     * Zoom out
     */
    zoomOut: (state) => {
      state.zoomLevel = Math.max(0.5, state.zoomLevel - 0.1);
    },

    /**
     * Reset zoom to default
     */
    resetZoom: (state) => {
      state.zoomLevel = 1.0;
    },

    /**
     * Set hovered hex
     */
    setHoveredHex: (state, action: PayloadAction<HexCoord | null>) => {
      state.hoveredHex = action.payload;
    },

    /**
     * Set hovered vertex
     */
    setHoveredVertex: (state, action: PayloadAction<VertexCoord | null>) => {
      state.hoveredVertex = action.payload;
    },

    /**
     * Set hovered edge
     */
    setHoveredEdge: (state, action: PayloadAction<EdgeCoord | null>) => {
      state.hoveredEdge = action.payload;
    },

    /**
     * Set loading state
     */
    setLoading: (
      state,
      action: PayloadAction<{ isLoading: boolean; message?: string }>
    ) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message ?? null;
    },

    /**
     * Reset UI state
     */
    resetUi: () => initialState,
  },
});

// Export actions
export const {
  setBuildMode,
  setSelectedHex,
  setSelectedAction,
  clearSelectedAction,
  openTradeModal,
  closeTradeModal,
  setPendingTrade,
  updatePendingTrade,
  addIncomingTradeOffer,
  updateIncomingTradeOffer,
  removeIncomingTradeOffer,
  clearIncomingTradeOffers,
  openModal,
  closeModal,
  toggleSound,
  setSoundEnabled,
  setVolume,
  addToast,
  removeToast,
  clearToasts,
  toggleBuildCosts,
  toggleDiceStats,
  toggleCompactPlayerPanels,
  setFullscreen,
  setZoomLevel,
  zoomIn,
  zoomOut,
  resetZoom,
  setHoveredHex,
  setHoveredVertex,
  setHoveredEdge,
  setLoading,
  resetUi,
} = uiSlice.actions;

// Selectors
export const selectBuildMode = (state: RootState) => state.ui.buildMode;
export const selectSelectedHex = (state: RootState) => state.ui.selectedHex;
export const selectSelectedAction = (state: RootState) =>
  state.ui.selectedAction;
export const selectTradeModalOpen = (state: RootState) =>
  state.ui.tradeModalOpen;
export const selectPendingTrade = (state: RootState) => state.ui.pendingTrade;
export const selectIncomingTradeOffers = (state: RootState) =>
  state.ui.incomingTradeOffers;
export const selectModal = (state: RootState) => state.ui.modal;
export const selectToasts = (state: RootState) => state.ui.toasts;
export const selectSoundEnabled = (state: RootState) => state.ui.soundEnabled;
export const selectVolume = (state: RootState) => state.ui.volume;
export const selectShowBuildCosts = (state: RootState) =>
  state.ui.showBuildCosts;
export const selectShowDiceStats = (state: RootState) => state.ui.showDiceStats;
export const selectCompactPlayerPanels = (state: RootState) =>
  state.ui.compactPlayerPanels;
export const selectIsFullscreen = (state: RootState) => state.ui.isFullscreen;
export const selectZoomLevel = (state: RootState) => state.ui.zoomLevel;
export const selectHoveredHex = (state: RootState) => state.ui.hoveredHex;
export const selectHoveredVertex = (state: RootState) => state.ui.hoveredVertex;
export const selectHoveredEdge = (state: RootState) => state.ui.hoveredEdge;
export const selectIsLoading = (state: RootState) => state.ui.isLoading;
export const selectLoadingMessage = (state: RootState) =>
  state.ui.loadingMessage;

/**
 * Check if a modal is open
 */
export const selectIsModalOpen = (state: RootState) =>
  state.ui.modal.type !== 'none';

/**
 * Check if a specific modal is open
 */
export const selectIsModalType = (state: RootState, type: ModalType) =>
  state.ui.modal.type === type;

/**
 * Check if in build mode
 */
export const selectIsBuildMode = (state: RootState) =>
  state.ui.buildMode !== 'none';

/**
 * Check if there are pending incoming trade offers
 */
export const selectHasPendingTradeOffers = (state: RootState) =>
  state.ui.incomingTradeOffers.some((o) => o.isActive);

/**
 * Get count of pending incoming trade offers
 */
export const selectPendingTradeOffersCount = (state: RootState) =>
  state.ui.incomingTradeOffers.filter((o) => o.isActive).length;

export default uiSlice.reducer;
