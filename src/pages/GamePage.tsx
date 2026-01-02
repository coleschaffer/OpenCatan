// @ts-nocheck
// TODO: Fix TypeScript errors in this file
/**
 * GamePage - Complete game screen for OpenCatan
 *
 * Layout structure:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        GAME HEADER                              │
 * ├───────────────────────────────────────────┬─────────────────────┤
 * │                                           │                     │
 * │                                           │   PLAYER PANELS     │
 * │              GAME BOARD                   │   (right sidebar)   │
 * │              (center)                     │                     │
 * │                                           │                     │
 * ├───────────────────────────────────────────┼─────────────────────┤
 * │         PLAYER HAND + ACTION BAR          │    CHAT / LOG       │
 * │              (bottom left)                │   (bottom right)    │
 * └───────────────────────────────────────────┴─────────────────────┘
 *
 * Integrates all game components:
 * - GameHeader (top)
 * - GameBoard (center)
 * - PlayerPanelList (right sidebar)
 * - PlayerHand + ActionBar (bottom left)
 * - Chat/GameLog (bottom right)
 * - Overlays (setup, robber, trade, dev card, victory)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useGamePhase, useGameBoard, useRoomCode, useGameNavigation, useSetupPhase, useGameSounds, useTradeRates } from '@/hooks';
import { usePartyConnection } from '@/network/hooks';
import { useGameActions } from '@/network/hooks/useGameActions';
import { useChat } from '@/network/hooks/useChat';
import { hostManager } from '@/network/hostManager';
import { partyClient } from '@/network/partyClient';
import { useRobberPhase } from '@/hooks/useRobberPhase';
import { useDevCards } from '@/hooks/useDevCards';
import { useVictory } from '@/hooks/useVictory';
import { generateBeginnerBoard } from '@/utils/boardGenerator';

// Game state selectors
import {
  selectConnectionStatus,
  selectGameStarted,
  selectPlayers,
  selectLocalPlayerId,
  selectCurrentPlayerId,
  selectTurnTimeRemaining,
  selectBank,
  selectLastRoll,
  selectDevDeckCount,
  selectGameLongestRoad,
  selectGameLargestArmy,
  selectChat,
  selectLog,
  selectPendingDiscard,
  selectGameSettings,
  selectLobbyPlayers,
  selectLobbySettings,
  selectIsHost,
  // UI state
  selectBuildMode,
  selectModal,
  selectSoundEnabled,
  selectVolume,
  selectIsFullscreen,
  selectIncomingTradeOffers,
  // UI actions
  setBuildMode,
  openModal,
  closeModal,
  setSoundEnabled,
  setVolume,
  setFullscreen,
  addToast,
  // Game initialization
  startGame,
  setTiles,
  setPorts,
  setPlayers,
  setTurnOrder,
  setSetupState,
  // Timer
  tickTimer,
  // Trade state
  selectPendingIncomingOffers,
  removeIncomingOffer,
  setActiveCounterOffer,
  clearActiveCounterOffer,
  selectActiveCounterOffer,
} from '@/game/state';

// Components
import { GameContainer, GameLoadingScreen, DisconnectedOverlay } from '@/components/game';
import { GameBoard } from '@/components/board';
import {
  GameHeader,
  PlayerPanelList,
  PlayerHand,
  ActionBar,
  Chat,
  BuildModeSelector,
  DiceDisplay,
  TurnTimer,
} from '@/components/panels';
import {
  SetupOverlay,
  RobberOverlay,
  TradeModal,
  DevCardModal,
  VictoryScreen,
  DiscardModal,
  YearOfPlentyModal,
  MonopolyModal,
  BuildingCostReference,
  TradeOfferReceived,
  DevCardBuyConfirm,
  RoadBuildingOverlay,
  KnightCardOverlay,
} from '@/components/overlays';
import { ResourceAnimationContainer } from '@/components/animations';
import { useResourceAnimations } from '@/hooks/useResourceAnimations';

import styles from './GamePage.module.css';

// Types
import type { ResourceType, ResourceCounts } from '@/types/common';
import type { BuildMode } from '@/game/state/slices/uiSlice';

/**
 * GamePage - Main game screen component
 */
export function GamePage() {
  const dispatch = useAppDispatch();
  const { goToLanding } = useGameNavigation();
  const { isConnected, reconnect } = usePartyConnection();
  const roomCode = useRoomCode();

  // Enable sound effects for game events
  useGameSounds();

  // Game phase hook
  const {
    phase,
    isMyTurn,
    currentPlayerId,
    localPlayerId,
    turnTimeRemaining,
    lastRoll,
    // Overlay visibility
    showSetupOverlay,
    showRobberOverlay,
    showRollButton,
    showDiscardModal,
    showVictoryScreen,
    showRoadBuildingOverlay,
    showYearOfPlentyModal,
    showMonopolyModal,
    // Action availability
    canBuild,
    canTrade,
    canBuyDevCard,
    canPlayDevCard,
    canEndTurn,
    // Phase categories
    isSetupPhase,
    isMainPhase,
    isRobberPhase,
    // Road building
    roadBuildingRemaining,
  } = useGamePhase();

  // Game board hook
  const {
    tiles,
    buildings,
    roads,
    robberLocation,
    pirateLocation,
    currentPlayerColor,
    buildMode,
    validSettlementVertices,
    validCityVertices,
    validRoadEdges,
    validRobberHexes,
    handlePlaceSettlement,
    handlePlaceCity,
    handlePlaceRoad,
    handleMoveRobber,
    handleClickRobber,
    setBuildMode: handleSetBuildMode,
    cancelBuildMode,
    disabled: boardDisabled,
  } = useGameBoard();

  // Game actions
  const {
    rollDice,
    buyDevCard,
    endTurn,
    discardResources,
    sendTradeOffer,
    bankTrade,
    respondToTrade,
    counterOffer,
    cancelTrade,
  } = useGameActions();

  // Chat hook
  const { sendMessage: sendChatMessage } = useChat();

  // Setup phase hook
  const setupPhaseState = useSetupPhase(localPlayerId || undefined);

  // Robber phase hook
  const robberPhaseState = useRobberPhase();

  // Dev cards hook
  const devCardsState = useDevCards();

  // Victory hook
  const victoryState = useVictory();

  // Resource animations hook
  const { animations: resourceAnimations, handleAnimationComplete } = useResourceAnimations();

  // Redux state
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const gameStarted = useAppSelector(selectGameStarted);
  const players = useAppSelector(selectPlayers);
  const bank = useAppSelector(selectBank);
  const devDeckCount = useAppSelector(selectDevDeckCount);
  const longestRoad = useAppSelector(selectGameLongestRoad);
  const largestArmy = useAppSelector(selectGameLargestArmy);
  const chatMessages = useAppSelector(selectChat);
  const gameLog = useAppSelector(selectLog);
  const pendingDiscardPlayers = useAppSelector(selectPendingDiscard);
  const settings = useAppSelector(selectGameSettings);
  const modal = useAppSelector(selectModal);
  const soundEnabled = useAppSelector(selectSoundEnabled);
  const volume = useAppSelector(selectVolume);
  const isFullscreen = useAppSelector(selectIsFullscreen);
  const incomingTradeOffers = useAppSelector(selectIncomingTradeOffers);
  const pendingIncomingOffers = useAppSelector(selectPendingIncomingOffers);
  const activeCounterOffer = useAppSelector(selectActiveCounterOffer);

  // Lobby state for initialization
  const lobbyPlayers = useAppSelector(selectLobbyPlayers);
  const lobbySettings = useAppSelector(selectLobbySettings);
  const isHost = useAppSelector(selectIsHost);

  // Initialize game when gameStarted becomes true but game state is not set up
  // Only the HOST should generate the board and initialize the game state
  // Peers will receive the game state via GAME_STATE messages
  const [gameInitialized, setGameInitialized] = useState(false);
  useEffect(() => {
    if (gameStarted && phase === 'lobby' && !gameInitialized && lobbyPlayers.length > 0) {
      // Both host and peers need to initialize their local state
      // But only the host generates the board - peers will receive it via broadcast
      console.log(`Initializing game state from lobby data... (isHost: ${isHost})`);

      // Convert lobby settings to game settings
      const gameSettings = {
        mode: lobbySettings?.mode || 'base',
        playerCount: lobbySettings?.playerCount || 4,
        victoryPoints: lobbySettings?.victoryPoints || 10,
        turnTimer: lobbySettings?.turnTimer || 90,
        discardLimit: lobbySettings?.discardLimit || 7,
        map: lobbySettings?.mapType || 'random',
        friendlyRobber: lobbySettings?.friendlyRobber || false,
      };

      // Convert lobby players to game players
      const gamePlayers = lobbyPlayers.map((lp) => ({
        id: lp.id,
        name: lp.name,
        color: lp.color,
        isHost: lp.isHost,
        isConnected: lp.isConnected,
        victoryPoints: 0,
        resources: { brick: 0, lumber: 0, ore: 0, grain: 0, wool: 0 },
        commodities: undefined,
        developmentCards: [],
        progressCards: undefined,
        hasPlayedDevCard: false,
        devCardsBoughtThisTurn: [],
        roadsRemaining: 15,
        settlementsRemaining: 5,
        citiesRemaining: 4,
        shipsRemaining: 0,
        cityWallsRemaining: 0,
        knightsRemaining: 0,
        longestRoadLength: 0,
        armySize: 0,
        cityImprovements: undefined,
        totalResourcesCollected: 0,
        totalTradesMade: 0,
        timesRobbed: 0,
        timesWasRobbed: 0,
      }));

      try {
        // Generate the board - using beginnerBoard for consistent layout across all clients
        // This ensures all players see the same board without needing network sync
        // TODO: In production, host should broadcast board to peers for random boards
        const tiles = generateBeginnerBoard();
        if (!tiles) {
          throw new Error('Failed to generate board');
        }

        // Convert tiles to the format expected by Redux (add missing properties)
        const hexTiles = tiles.map((t) => ({
          ...t,
          hasPirate: false,
          isFog: false,
        }));

        // Use a consistent turn order - the server sent this in GAME_STARTED
        // For now, sort by join order (host first) for consistency
        const playerIds = gamePlayers.map(p => p.id);
        // Sort deterministically - players are already sorted by join order from server
        const turnOrder = [...playerIds];

        // Ensure localPlayerId is set for local testing
        // If not set, default to the first player (host)
        if (!localPlayerId && turnOrder.length > 0) {
          dispatch({ type: 'lobby/setLocalPlayerId', payload: turnOrder[0] });
        }

        // Dispatch actions to set up the game
        dispatch(startGame({
          settings: gameSettings as any,
          firstPlayerId: turnOrder[0],
        }));

        dispatch(setTiles(hexTiles));
        dispatch(setPorts([])); // TODO: Generate ports
        dispatch(setPlayers(gamePlayers as any));
        dispatch(setTurnOrder(turnOrder));

        // Initialize setup state
        const playerPlacements: Record<string, any> = {};
        turnOrder.forEach((pid) => {
          playerPlacements[pid] = { settlement1: null, road1: null, settlement2: null, road2: null };
        });
        dispatch(setSetupState({
          currentPlacementIndex: 0,
          lastPlacedSettlement: null,
          placementsComplete: false,
          playerPlacements,
        }));

        // Initialize the host manager for state management
        // For local testing without network, we act as the host
        const shouldBeHost = isHost || !partyClient.isConnected;
        if (shouldBeHost) {
          console.log(`Initializing as host (isHost: ${isHost}, connected: ${partyClient.isConnected})`);
          // Create a minimal initial game state for the host manager
          const initialGameState = {
            roomCode: roomCode || 'local',
            mode: gameSettings.mode,
            settings: gameSettings,
            version: 0,
            lastUpdated: Date.now(),
            phase: 'setup-settlement-1' as const,
            turn: 0,
            currentPlayerId: turnOrder[0],
            turnTimeRemaining: gameSettings.turnTimer || 90,
            turnStartedAt: Date.now(),
            tiles: hexTiles,
            buildings: [],
            roads: [],
            ports: [],
            knights: [],
            players: gamePlayers,
            turnOrder: turnOrder,
            playersNeedingToDiscard: [],
            discardAmounts: {},
            robberLocation: hexTiles.find(t => t.terrain === 'desert')?.coord || { q: 0, r: 0 },
            pirateLocation: null,
            developmentDeck: [],
            developmentDeckCount: 25,
            bank: { brick: 19, lumber: 19, ore: 19, grain: 19, wool: 19 },
            longestRoad: null,
            largestArmy: null,
            activeOffers: [],
            log: [],
            chat: [],
          };
          hostManager.initializeAsHost(initialGameState as any);
        }

        setGameInitialized(true);
        console.log('Game initialized successfully!', { turnOrder, tiles: hexTiles.length, isHost });
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    }
  }, [gameStarted, phase, gameInitialized, lobbyPlayers, lobbySettings, isHost, dispatch]);

  // Timer tick effect - decrement timer every second during active game
  useEffect(() => {
    // Only tick the timer if:
    // 1. Game has started and initialized
    // 2. We're not in the lobby phase
    // 3. Turn timer is enabled (> 0)
    const timerEnabled = settings.turnTimer && settings.turnTimer > 0;
    const shouldTick = gameStarted && gameInitialized && phase !== 'lobby' && phase !== 'ended' && timerEnabled;

    if (!shouldTick) return;

    const intervalId = setInterval(() => {
      dispatch(tickTimer());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameStarted, gameInitialized, phase, settings.turnTimer, dispatch]);

  // Local state
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [showCostReference, setShowCostReference] = useState(false);

  // Counter-offer state
  const [counterOfferMode, setCounterOfferMode] = useState(false);
  const [counterOfferData, setCounterOfferData] = useState<{
    originalOfferId: string;
    toPlayerId: string;
    offering: Partial<ResourceCounts>;
    requesting: Partial<ResourceCounts>;
  } | null>(null);

  // Get current player
  const currentPlayer = useMemo(() => {
    return players.find(p => p.id === currentPlayerId);
  }, [players, currentPlayerId]);

  // Get local player
  const localPlayer = useMemo(() => {
    return players.find(p => p.id === localPlayerId);
  }, [players, localPlayerId]);

  // Player's resources
  const myResources = localPlayer?.resources || {
    brick: 0,
    lumber: 0,
    ore: 0,
    grain: 0,
    wool: 0,
  };

  // Get bank trade rates for local player based on their port access
  const { rates: bankRates } = useTradeRates(localPlayerId);

  // Other players for trading
  const otherPlayers = useMemo(() => {
    return players.filter(p => p.id !== localPlayerId && p.isConnected);
  }, [players, localPlayerId]);

  // Player data for panels
  const playerPanelData = useMemo(() => {
    return players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      victoryPoints: p.victoryPoints || 0,
      resourceCount: Object.values(p.resources).reduce((sum, val) => sum + val, 0),
      devCardCount: p.developmentCards?.length || 0,
      knightCount: p.armySize || 0,
      longestRoadLength: p.longestRoadLength || 0,
      isConnected: p.isConnected,
      hasLongestRoad: longestRoad?.playerId === p.id,
      hasLargestArmy: largestArmy?.playerId === p.id,
    }));
  }, [players, longestRoad, largestArmy]);

  // Handlers
  const handleAction = useCallback((action: 'build' | 'trade' | 'buyDevCard' | 'endTurn' | 'rollDice' | 'cancelAction') => {
    switch (action) {
      case 'rollDice':
        rollDice();
        break;
      case 'build':
        setShowBuildMenu(prev => !prev);
        break;
      case 'trade':
        dispatch(openModal({ type: 'trade' }));
        break;
      case 'buyDevCard':
        dispatch(openModal({ type: 'development-card' }));
        break;
      case 'endTurn':
        endTurn();
        break;
      case 'cancelAction':
        cancelBuildMode();
        setShowBuildMenu(false);
        break;
    }
  }, [rollDice, endTurn, cancelBuildMode, dispatch]);

  const handleBuildSelect = useCallback((type: BuildMode) => {
    handleSetBuildMode(type);
    setShowBuildMenu(false);
  }, [handleSetBuildMode]);

  const handleSettingsClick = useCallback(() => {
    dispatch(openModal({ type: 'settings' }));
  }, [dispatch]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    dispatch(setVolume(newVolume));
  }, [dispatch]);

  const handleMuteToggle = useCallback(() => {
    dispatch(setSoundEnabled(!soundEnabled));
  }, [dispatch, soundEnabled]);

  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      dispatch(setFullscreen(true));
    } else {
      document.exitFullscreen().catch(console.error);
      dispatch(setFullscreen(false));
    }
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const handleSendChat = useCallback((text: string) => {
    sendChatMessage(text);
  }, [sendChatMessage]);

  // Trade handlers
  const handleAcceptTrade = useCallback((offerId: string) => {
    respondToTrade(offerId, 'accept');
    dispatch(removeIncomingOffer(offerId));
  }, [respondToTrade, dispatch]);

  const handleDeclineTrade = useCallback((offerId: string) => {
    respondToTrade(offerId, 'decline');
    dispatch(removeIncomingOffer(offerId));
  }, [respondToTrade, dispatch]);

  const handleCounterOffer = useCallback((offer: {
    id: string;
    fromPlayerId: string;
    offering: Partial<ResourceCounts>;
    requesting: Partial<ResourceCounts>;
  }) => {
    // Swap offering/requesting for counter-offer (what they offered becomes what we request)
    setCounterOfferData({
      originalOfferId: offer.id,
      toPlayerId: offer.fromPlayerId,
      offering: offer.requesting, // We offer what they were requesting
      requesting: offer.offering, // We request what they were offering
    });
    setCounterOfferMode(true);
    dispatch(openModal({ type: 'trade' }));
    dispatch(removeIncomingOffer(offer.id));
  }, [dispatch]);

  const handleSubmitCounterOffer = useCallback((originalOfferId: string, offer: {
    offering: Partial<ResourceCounts>;
    requesting: Partial<ResourceCounts>;
    targetPlayerId: string | 'all';
  }) => {
    counterOffer(originalOfferId, {
      toPlayerId: offer.targetPlayerId === 'all' ? null : offer.targetPlayerId,
      offering: offer.offering,
      requesting: offer.requesting,
    });
    setCounterOfferMode(false);
    setCounterOfferData(null);
    dispatch(closeModal());
  }, [counterOffer, dispatch]);

  const handleCloseTradeModal = useCallback(() => {
    setCounterOfferMode(false);
    setCounterOfferData(null);
    dispatch(closeModal());
  }, [dispatch]);

  // Check for required state
  if (!roomCode) {
    return (
      <div className={styles.errorContainer}>
        <h2>Invalid Game</h2>
        <p>No room code provided.</p>
        <button onClick={goToLanding} className={styles.homeButton}>
          Return to Home
        </button>
      </div>
    );
  }

  // Show loading while game is initializing
  if (gameStarted && phase === 'lobby') {
    return (
      <div className={styles.errorContainer}>
        <h2>Starting Game...</h2>
        <p>Initializing the game board...</p>
      </div>
    );
  }

  if (!gameStarted && phase === 'lobby') {
    return (
      <div className={styles.errorContainer}>
        <h2>Game Not Started</h2>
        <p>This game has not started yet.</p>
        <button onClick={goToLanding} className={styles.homeButton}>
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <GameContainer>
      <div className={styles.gamePage}>
        {/* Header row */}
        <header className={styles.header}>
          <GameHeader
            onSettingsClick={handleSettingsClick}
            volume={volume}
            isMuted={!soundEnabled}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            isFullscreen={isFullscreen}
            onFullscreenToggle={handleFullscreenToggle}
          />
        </header>

        {/* Main content area */}
        <main className={styles.mainArea}>
          {/* Game board container */}
          <div className={styles.boardContainer}>
            {/* Dice display */}
            {lastRoll && (
              <div className={styles.diceOverlay}>
                <DiceDisplay
                  die1={lastRoll.die1}
                  die2={lastRoll.die2}
                  total={lastRoll.total}
                  eventDie={lastRoll.eventDie}
                  isRolling={false}
                />
              </div>
            )}

            {/* Build mode selector */}
            {showBuildMenu && (
              <div className={styles.buildMenuOverlay}>
                <BuildModeSelector
                  currentMode={buildMode}
                  onSelectMode={handleBuildSelect}
                  onCancel={() => setShowBuildMenu(false)}
                  resources={myResources}
                  canBuild={canBuild}
                />
              </div>
            )}

            {/* The game board */}
            <GameBoard
              tiles={tiles}
              buildings={buildings}
              roads={roads}
              robberLocation={robberLocation}
              pirateLocation={pirateLocation}
              currentPlayerColor={currentPlayerColor}
              buildMode={buildMode}
              validSettlementVertices={validSettlementVertices}
              validCityVertices={validCityVertices}
              validRoadEdges={validRoadEdges}
              validRobberHexes={validRobberHexes}
              onPlaceSettlement={handlePlaceSettlement}
              onPlaceCity={handlePlaceCity}
              onPlaceRoad={handlePlaceRoad}
              onMoveRobber={handleMoveRobber}
              onClickRobber={handleClickRobber}
              disabled={boardDisabled}
            />
          </div>

          {/* Right sidebar - Chat/Log */}
          <aside className={styles.sidebar}>
            <Chat
              messages={chatMessages.map(m => ({
                id: m.id,
                playerId: m.playerId,
                playerName: players.find(p => p.id === m.playerId)?.name || 'Unknown',
                playerColor: players.find(p => p.id === m.playerId)?.color || 'white',
                text: m.message || m.text || '',
                timestamp: m.timestamp,
              }))}
              logEntries={gameLog.map(entry => ({
                id: entry.id,
                timestamp: entry.timestamp,
                eventType: entry.type || 'turn_start',
                message: entry.message,
                playerId: entry.playerId || '',
                playerName: players.find(p => p.id === entry.playerId)?.name || 'System',
                playerColor: players.find(p => p.id === entry.playerId)?.color || 'white',
                visibility: 'public' as const,
              }))}
              onSend={handleSendChat}
              myPlayerId={localPlayerId || ''}
            />
          </aside>
        </main>

        {/* Bottom area */}
        <footer className={styles.bottomArea}>
          {/* Players area - moved from sidebar */}
          <div className={styles.playersArea}>
            <PlayerPanelList
              players={playerPanelData}
              currentPlayerId={currentPlayerId}
              localPlayerId={localPlayerId}
            />
          </div>

          {/* Player hand + action bar */}
          <div className={styles.handArea}>
            <ActionBar
              phase={phase as any}
              canBuild={canBuild}
              canTrade={canTrade}
              canBuyDevCard={canBuyDevCard}
              canEndTurn={canEndTurn}
              isMyTurn={isMyTurn}
              turnTimeRemaining={turnTimeRemaining}
              onAction={handleAction}
            />
            <PlayerHand
              resources={myResources}
              devCards={localPlayer?.developmentCards || []}
              phase={phase}
              canPlayDevCard={canPlayDevCard}
              onPlayDevCard={(cardId) => {
                dispatch(openModal({
                  type: 'development-card',
                  data: { cardId },
                }));
              }}
            />
          </div>
        </footer>

        {/* ============================================ */}
        {/* Overlays - rendered conditionally based on phase */}
        {/* ============================================ */}

        {/* Setup overlay */}
        {showSetupOverlay && setupPhaseState.currentPlayer && (
          <SetupOverlay
            players={players}
            currentPlayer={setupPhaseState.currentPlayer}
            isMyTurn={setupPhaseState.isMyTurn}
            placementType={setupPhaseState.currentPlacementType}
            setupRound={setupPhaseState.setupRound}
            placementIndex={setupPhaseState.placementsMade}
            totalPlacements={setupPhaseState.totalPlacements}
            timeRemaining={setupPhaseState.timeRemaining}
            validSettlements={setupPhaseState.validSettlements}
            validRoads={setupPhaseState.validRoads}
            onPlaceSettlement={setupPhaseState.placeSettlement}
            onPlaceRoad={setupPhaseState.placeRoad}
            isSecondSettlement={setupPhaseState.isSecondSettlement}
            completedPlacements={setupPhaseState.completedPlacements}
          />
        )}

        {/* Robber overlay */}
        {showRobberOverlay && (
          <RobberOverlay
            isOpen={true}
            onClose={() => {}}
            phase={robberPhaseState.phase}
            localPlayerId={localPlayerId || ''}
            activePlayerId={currentPlayerId || ''}
            activePlayerName={currentPlayer?.name || ''}
            isActivePlayer={isMyTurn}
            playersNeedingDiscard={robberPhaseState.playersNeedingDiscard}
            localPlayerMustDiscard={robberPhaseState.mustDiscard}
            localPlayerHand={myResources}
            localDiscardCount={robberPhaseState.discardCount}
            onDiscard={(resources) => discardResources(resources)}
            validRobberHexes={validRobberHexes}
            currentRobberLocation={robberLocation}
            onMoveRobber={handleMoveRobber}
            stealVictims={robberPhaseState.stealTargets}
            onSteal={(victimId) => {
              robberPhaseState.stealFrom(victimId);
            }}
            onSkipSteal={() => {
              robberPhaseState.skipSteal();
            }}
            friendlyRobberEnabled={settings.friendlyRobber}
          />
        )}

        {/* Discard modal (when player needs to discard) */}
        {showDiscardModal && localPlayer && (
          <DiscardModal
            isOpen={true}
            onClose={() => {}}
            hand={myResources}
            discardCount={Math.floor(Object.values(myResources).reduce((a, b) => a + b, 0) / 2)}
            onSubmit={(resources) => discardResources(resources)}
          />
        )}

        {/* Victory screen */}
        {showVictoryScreen && victoryState.winner && (
          <VictoryScreen
            isOpen={true}
            winner={victoryState.winner}
            players={victoryState.finalPlayers}
            stats={victoryState.gameStats}
            onReturnToLobby={victoryState.returnToLobby}
            onCreateNewRoom={victoryState.createNewRoom}
          />
        )}

        {/* Trade modal */}
        {modal.type === 'trade' && (
          <TradeModal
            isOpen={true}
            onClose={handleCloseTradeModal}
            myResources={myResources}
            players={otherPlayers}
            bankRates={bankRates}
            bankResources={bank}
            onPlayerTrade={(offer) => {
              console.log('Player trade:', offer);
              sendTradeOffer({
                toPlayerId: offer.targetPlayerId === 'all' ? null : offer.targetPlayerId,
                offering: offer.offering,
                requesting: offer.requesting,
              });
              handleCloseTradeModal();
            }}
            onBankTrade={(params) => {
              console.log('Bank trade:', params);
              bankTrade(
                { resource: params.giveResource, amount: params.giveAmount },
                { resource: params.receiveResource, amount: params.receiveAmount }
              );
              handleCloseTradeModal();
            }}
            onCancel={handleCloseTradeModal}
            canTrade={canTrade}
            counterOfferData={counterOfferMode ? counterOfferData : null}
            onCounterOffer={(originalOfferId, offer) => {
              handleSubmitCounterOffer(originalOfferId, offer);
            }}
          />
        )}

        {/* Development card modal */}
        {modal.type === 'development-card' && (
          <DevCardModal
            isOpen={true}
            onClose={handleCloseModal}
            cards={devCardsState.myDevCards || []}
            currentTurn={devCardsState.currentTurn}
            hasPlayedThisTurn={devCardsState.hasPlayedThisTurn}
            isPlayerTurn={devCardsState.isPlayerTurn}
            onPlayCard={(cardType, cardId) => {
              // Handle each card type appropriately
              switch (cardType) {
                case 'knight':
                  // Knight card triggers robber move phase via action
                  devCardsState.playKnight({ q: 0, r: 0 });
                  handleCloseModal();
                  break;
                case 'roadBuilding':
                  // Road Building triggers road-building phase
                  devCardsState.playRoadBuilding();
                  handleCloseModal();
                  break;
                case 'yearOfPlenty':
                  // Open Year of Plenty modal
                  handleCloseModal();
                  dispatch(openModal({ type: 'year-of-plenty' }));
                  break;
                case 'monopoly':
                  // Open Monopoly modal
                  handleCloseModal();
                  dispatch(openModal({ type: 'monopoly' }));
                  break;
              }
            }}
          />
        )}

        {/* Year of Plenty modal - shown when phase is year-of-plenty OR modal type is year-of-plenty */}
        {(showYearOfPlentyModal || modal.type === 'year-of-plenty') && (
          <YearOfPlentyModal
            isOpen={true}
            onClose={handleCloseModal}
            bankResources={bank}
            onSubmit={(resources) => {
              // Submit year of plenty selection with two resources
              if (resources.length >= 2) {
                devCardsState.playYearOfPlenty(resources[0], resources[1]);
              } else if (resources.length === 1) {
                devCardsState.playYearOfPlenty(resources[0], resources[0]);
              }
              handleCloseModal();
            }}
          />
        )}

        {/* Monopoly modal - shown when phase is monopoly OR modal type is monopoly */}
        {(showMonopolyModal || modal.type === 'monopoly') && (
          <MonopolyModal
            isOpen={true}
            onClose={handleCloseModal}
            onSubmit={(resource) => {
              // Submit monopoly selection
              devCardsState.playMonopoly(resource);
              handleCloseModal();
            }}
          />
        )}

        {/* Road building overlay */}
        {showRoadBuildingOverlay && (
          <RoadBuildingOverlay
            isOpen={true}
            onClose={() => {}}
            roadsRemaining={roadBuildingRemaining}
            validEdges={validRoadEdges}
            onPlaceRoad={handlePlaceRoad}
          />
        )}

        {/* Incoming trade offers - only show offers not from the local player */}
        {pendingIncomingOffers
          .filter(offer => offer.fromPlayerId !== localPlayerId)
          .map(offer => {
            const fromPlayer = players.find(p => p.id === offer.fromPlayerId);
            // Calculate time remaining based on createdAt and timeoutMs
            const elapsed = Date.now() - offer.createdAt;
            const timeRemaining = Math.max(0, Math.floor((offer.timeoutMs - elapsed) / 1000));

            return (
              <TradeOfferReceived
                key={offer.id}
                isOpen={true}
                onClose={() => handleDeclineTrade(offer.id)}
                offer={{
                  id: offer.id,
                  offering: offer.offering as ResourceCounts,
                  requesting: offer.requesting as ResourceCounts,
                }}
                from={{
                  id: offer.fromPlayerId,
                  name: fromPlayer?.name || 'Unknown',
                  color: fromPlayer?.color || 'white',
                }}
                onAccept={() => handleAcceptTrade(offer.id)}
                onDecline={() => handleDeclineTrade(offer.id)}
                onCounter={() => handleCounterOffer({
                  id: offer.id,
                  fromPlayerId: offer.fromPlayerId,
                  offering: offer.offering,
                  requesting: offer.requesting,
                })}
                timeRemaining={timeRemaining > 0 ? timeRemaining : undefined}
              />
            );
          })
        }

        {/* Building cost reference */}
        {showCostReference && (
          <BuildingCostReference
            isOpen={true}
            onClose={() => setShowCostReference(false)}
          />
        )}

        {/* Resource animations overlay */}
        <ResourceAnimationContainer
          animations={resourceAnimations}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>
    </GameContainer>
  );
}

export default GamePage;
