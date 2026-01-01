/**
 * useRoomCode - Hook to get room code from URL params
 *
 * Extracts the room code from the URL and normalizes it to uppercase.
 * Used by lobby and game pages to access the current room.
 */

import { useParams } from 'react-router-dom';

/**
 * Get the room code from URL parameters
 *
 * @returns The uppercase room code or null if not present
 */
export function useRoomCode(): string | null {
  const { code } = useParams<{ code: string }>();
  return code?.toUpperCase() || null;
}

export default useRoomCode;
