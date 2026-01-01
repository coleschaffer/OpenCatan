// Modal Overlay Components
// These components provide modal dialogs and overlays for various game interactions

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { TradeModal } from './TradeModal';
export type {
  TradeModalProps,
  TradeTab,
  PlayerTradeOffer,
  BankTradeParams,
} from './TradeModal';

export { TradeOfferReceived } from './TradeOfferReceived';
export type { TradeOfferReceivedProps, IncomingTradeOffer } from './TradeOfferReceived';

export { IncomingTradeNotification } from './IncomingTradeNotification';
export type { IncomingTradeNotificationProps } from './IncomingTradeNotification';

export { TradeOffer, MiniTradeOffer } from './TradeOffer';
export type { TradeOfferProps, MiniTradeOfferProps } from './TradeOffer';

export { TradeResponses } from './TradeResponses';
export type {
  TradeResponsesProps,
  PlayerResponse,
  ResponseStatus,
} from './TradeResponses';

export { RobberModal } from './RobberModal';
export type { RobberModalProps } from './RobberModal';

export { StealSelector } from './StealSelector';
export type { StealSelectorProps, StealVictim } from './StealSelector';

export { DiscardModal } from './DiscardModal';
export type { DiscardModalProps } from './DiscardModal';

export { YearOfPlentyModal } from './YearOfPlentyModal';
export type { YearOfPlentyModalProps } from './YearOfPlentyModal';

export { MonopolyModal } from './MonopolyModal';
export type { MonopolyModalProps, ResourcePreview } from './MonopolyModal';

export { VictoryScreen } from './VictoryScreen';
export type {
  VictoryScreenProps,
  VictoryPlayer,
  VictoryGameStats,
} from './VictoryScreen';

export { BuildingCostReference } from './BuildingCostReference';
export type { BuildingCostReferenceProps } from './BuildingCostReference';

// Robber Phase Components
export { RobberOverlay } from './RobberOverlay';
export type { RobberOverlayProps, RobberPhase, PlayerDiscardStatus } from './RobberOverlay';

export { DiscardWaiting } from './DiscardWaiting';
export type { DiscardWaitingProps, PlayerDiscardInfo } from './DiscardWaiting';

export { RobberMoveSelector } from './RobberMoveSelector';
export type { RobberMoveSelectorProps, HexPlayerInfo } from './RobberMoveSelector';

// Development Card Components
export { DevCardModal } from './DevCardModal';
export type { DevCardModalProps } from './DevCardModal';

export { DevCardBuyConfirm } from './DevCardBuyConfirm';
export type { DevCardBuyConfirmProps } from './DevCardBuyConfirm';

export { KnightCardOverlay } from './KnightCardOverlay';
export type { KnightCardOverlayProps, KnightPhase } from './KnightCardOverlay';

export { RoadBuildingOverlay } from './RoadBuildingOverlay';
export type { RoadBuildingOverlayProps } from './RoadBuildingOverlay';

// Setup Phase Components
export { SetupOverlay } from './SetupOverlay';
export type { SetupOverlayProps } from './SetupOverlay';

export { SetupInstructions } from './SetupInstructions';

export { SetupTurnOrder } from './SetupTurnOrder';
