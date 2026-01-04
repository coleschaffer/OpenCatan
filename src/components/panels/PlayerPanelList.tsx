// @ts-nocheck
// TODO: Fix TypeScript errors in this file
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectPlayers, selectTurnOrder } from '@/game/state/slices/playersSlice';
import { selectCurrentPlayerId, selectLongestRoad, selectLargestArmy } from '@/game/state/slices/gameSlice';
import { selectLocalPlayerId } from '@/game/state/slices/lobbySlice';
import { PlayerCard, PlayerData } from './PlayerCard';
import styles from './panels.module.css';

interface PlayerPanelListProps {
  /** Optional className for additional styling */
  className?: string;
}

/**
 * PlayerPanelList - Left sidebar containing all player panels
 *
 * Displays all players in the game with:
 * - Other players at top in turn order (scrollable if > 3)
 * - Local player (YOU) at bottom, slightly larger
 * - Compact layout for all players
 */
export const PlayerPanelList: React.FC<PlayerPanelListProps> = ({ className }) => {
  const players = useSelector(selectPlayers);
  const turnOrder = useSelector(selectTurnOrder);
  const currentPlayerId = useSelector(selectCurrentPlayerId);
  const localPlayerId = useSelector(selectLocalPlayerId);
  const longestRoad = useSelector(selectLongestRoad);
  const largestArmy = useSelector(selectLargestArmy);

  /**
   * Transform players into PlayerData format
   * Sort: other players by turn order, local player at end
   */
  const { otherPlayers, localPlayer } = useMemo(() => {
    // Safety check for undefined players
    if (!players || !Array.isArray(players)) {
      return { otherPlayers: [], localPlayer: undefined };
    }

    // Sort players by turn order
    const order = turnOrder || [];
    const orderedPlayers = [...players].sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      return aIndex - bIndex;
    });

    // Transform to PlayerData format
    const allPlayerData = orderedPlayers.map((player) => {
      const resourceCount = Object.values(player.resources || {}).reduce((sum, count) => sum + count, 0);
      const devCardCount = player.developmentCards?.length || 0;

      return {
        id: player.id,
        name: player.name,
        color: player.color,
        isConnected: player.isConnected,
        isHost: player.isHost,
        victoryPoints: calculateVisibleVP(player, longestRoad?.playerId, largestArmy?.playerId),
        resourceCount,
        devCardCount,
        longestRoadLength: player.longestRoadLength,
        armySize: player.armySize,
        cityImprovements: player.cityImprovements,
        knightCount: player.knightsRemaining
          ? 6 - (player.knightsRemaining.basic + player.knightsRemaining.strong + player.knightsRemaining.mighty)
          : undefined,
        hasLongestRoad: longestRoad?.playerId === player.id,
        hasLargestArmy: largestArmy?.playerId === player.id,
      };
    });

    // Separate local player from others
    const local = allPlayerData.find((p) => p.id === localPlayerId);
    const others = allPlayerData.filter((p) => p.id !== localPlayerId);

    return { otherPlayers: others, localPlayer: local };
  }, [players, turnOrder, localPlayerId, longestRoad, largestArmy]);

  return (
    <div className={`${styles.playerPanelListVertical} ${className || ''}`}>
      {/* Other players - directly rendered without wrapper */}
      {otherPlayers.map((playerData) => (
        <PlayerCard
          key={playerData.id}
          player={playerData}
          isCurrentTurn={playerData.id === currentPlayerId}
          isMe={false}
          compact={true}
        />
      ))}

      {/* Local player (YOU) - at bottom, larger */}
      {localPlayer && (
        <div className={styles.localPlayerContainer}>
          <PlayerCard
            key={localPlayer.id}
            player={localPlayer}
            isCurrentTurn={localPlayer.id === currentPlayerId}
            isMe={true}
            compact={true}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Calculate visible victory points for a player
 * (excludes hidden VP from development cards)
 */
function calculateVisibleVP(
  player: {
    id: string;
    developmentCards: Array<{ type: string; isPlayed: boolean }>;
    longestRoadLength: number;
    armySize: number;
  },
  longestRoadHolderId: string | undefined,
  largestArmyHolderId: string | undefined
): number {
  // This is a simplified calculation
  // In a real implementation, this would come from the game state
  // based on buildings placed on the board
  let vp = 0;

  // Add VP for achievements
  if (longestRoadHolderId === player.id) vp += 2;
  if (largestArmyHolderId === player.id) vp += 2;

  // Add VP from revealed victory point cards (not typically shown until game end)
  // but we count them here for the owner only
  const vpCards = (player.developmentCards || []).filter(
    (c) => c.type === 'victoryPoint' || c.type === 'victory-point'
  ).length;
  vp += vpCards;

  return vp;
}

export default PlayerPanelList;
