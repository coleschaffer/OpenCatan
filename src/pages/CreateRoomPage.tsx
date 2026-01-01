/**
 * CreateRoomPage - Page for creating a new game room
 *
 * Uses the CreateRoom component and connects to PartyKit on success.
 * Navigates to the lobby once room is created.
 */

import { useCallback } from 'react';
import { CreateRoom } from '@/components/lobby';
import { usePartyConnection } from '@/network/hooks';
import { useGameNavigation } from '@/hooks';

/**
 * Create room page
 *
 * Flow:
 * 1. User enters their name
 * 2. On submit, creates a room via PartyKit
 * 3. On success, navigates to /room/:code
 */
export function CreateRoomPage() {
  const { goToLobby } = useGameNavigation();
  const { createRoom, isConnecting, error } = usePartyConnection();

  const handleCreateRoom = useCallback(
    async (playerName: string) => {
      try {
        const roomCode = await createRoom(playerName);
        goToLobby(roomCode);
      } catch (err) {
        // Error is handled by usePartyConnection and stored in error state
        console.error('Failed to create room:', err);
      }
    },
    [createRoom, goToLobby]
  );

  return (
    <CreateRoom
      onCreateRoom={handleCreateRoom}
      isLoading={isConnecting}
      error={error}
    />
  );
}

export default CreateRoomPage;
