/**
 * Session management for OpenCatan
 *
 * Handles browser session tokens stored in localStorage for:
 * - Reconnection after disconnect
 * - Restoring player seat on page refresh
 * - Linking player identity across connections
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Constants
// ============================================================================

/** LocalStorage key for session token */
export const SESSION_TOKEN_KEY = 'opencatan_session_token';

/** LocalStorage key for player ID (for reconnection) */
export const PLAYER_ID_KEY = 'opencatan_player_id';

/** LocalStorage key for current room code */
export const ROOM_CODE_KEY = 'opencatan_room_code';

/** LocalStorage key for player name */
export const PLAYER_NAME_KEY = 'opencatan_player_name';

/** Session expiry time in milliseconds (24 hours) */
export const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Types
// ============================================================================

export interface SessionData {
  token: string;
  playerId: string | null;
  roomCode: string | null;
  playerName: string | null;
  createdAt: number;
  expiresAt: number;
}

// ============================================================================
// Session Token Management
// ============================================================================

/**
 * Get the current session token from localStorage
 * Creates a new token if none exists or if expired
 */
export function getSessionToken(): string {
  try {
    const stored = localStorage.getItem(SESSION_TOKEN_KEY);

    if (stored) {
      const data = JSON.parse(stored);
      // Check if session is still valid
      if (data.expiresAt && data.expiresAt > Date.now()) {
        return data.token;
      }
    }

    // Generate new session token
    const newToken = generateSessionToken();
    setSessionToken(newToken);
    return newToken;
  } catch (error) {
    console.error('Error getting session token:', error);
    // Generate new token on error
    const newToken = generateSessionToken();
    setSessionToken(newToken);
    return newToken;
  }
}

/**
 * Set the session token in localStorage
 */
export function setSessionToken(token: string): void {
  try {
    const data = {
      token,
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
    };
    localStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting session token:', error);
  }
}

/**
 * Generate a new unique session token
 */
export function generateSessionToken(): string {
  return `session_${uuidv4()}`;
}

/**
 * Refresh the session expiry time
 * Call this on successful reconnection
 */
export function refreshSessionExpiry(): void {
  const token = getSessionToken();
  setSessionToken(token);
}

// ============================================================================
// Player ID Management
// ============================================================================

/**
 * Get the stored player ID for the current session
 */
export function getPlayerId(): string | null {
  try {
    return localStorage.getItem(PLAYER_ID_KEY);
  } catch (error) {
    console.error('Error getting player ID:', error);
    return null;
  }
}

/**
 * Set the player ID for the current session
 */
export function setPlayerId(playerId: string): void {
  try {
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  } catch (error) {
    console.error('Error setting player ID:', error);
  }
}

/**
 * Clear the stored player ID
 */
export function clearPlayerId(): void {
  try {
    localStorage.removeItem(PLAYER_ID_KEY);
  } catch (error) {
    console.error('Error clearing player ID:', error);
  }
}

// ============================================================================
// Room Code Management
// ============================================================================

/**
 * Get the stored room code
 */
export function getRoomCode(): string | null {
  try {
    return localStorage.getItem(ROOM_CODE_KEY);
  } catch (error) {
    console.error('Error getting room code:', error);
    return null;
  }
}

/**
 * Set the current room code
 */
export function setRoomCode(roomCode: string): void {
  try {
    localStorage.setItem(ROOM_CODE_KEY, roomCode);
  } catch (error) {
    console.error('Error setting room code:', error);
  }
}

/**
 * Clear the stored room code
 */
export function clearRoomCode(): void {
  try {
    localStorage.removeItem(ROOM_CODE_KEY);
  } catch (error) {
    console.error('Error clearing room code:', error);
  }
}

// ============================================================================
// Player Name Management
// ============================================================================

/**
 * Get the stored player name
 */
export function getPlayerName(): string | null {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY);
  } catch (error) {
    console.error('Error getting player name:', error);
    return null;
  }
}

/**
 * Set the player name
 */
export function setPlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch (error) {
    console.error('Error setting player name:', error);
  }
}

/**
 * Clear the stored player name
 */
export function clearPlayerName(): void {
  try {
    localStorage.removeItem(PLAYER_NAME_KEY);
  } catch (error) {
    console.error('Error clearing player name:', error);
  }
}

// ============================================================================
// Full Session Management
// ============================================================================

/**
 * Get complete session data
 */
export function getSessionData(): SessionData {
  const token = getSessionToken();
  const playerId = getPlayerId();
  const roomCode = getRoomCode();
  const playerName = getPlayerName();

  let createdAt = Date.now();
  let expiresAt = Date.now() + SESSION_EXPIRY_MS;

  try {
    const stored = localStorage.getItem(SESSION_TOKEN_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      expiresAt = data.expiresAt || expiresAt;
      createdAt = expiresAt - SESSION_EXPIRY_MS;
    }
  } catch {
    // Use defaults
  }

  return {
    token,
    playerId,
    roomCode,
    playerName,
    createdAt,
    expiresAt,
  };
}

/**
 * Save session data after successful room join
 */
export function saveSessionOnJoin(
  playerId: string,
  roomCode: string,
  playerName: string
): void {
  setPlayerId(playerId);
  setRoomCode(roomCode);
  setPlayerName(playerName);
  refreshSessionExpiry();
}

/**
 * Clear all session data
 * Call this on explicit logout or when leaving a room
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(PLAYER_ID_KEY);
    localStorage.removeItem(ROOM_CODE_KEY);
    localStorage.removeItem(PLAYER_NAME_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

/**
 * Clear room-specific session data but keep the session token
 * Use when leaving a room but potentially joining another
 */
export function clearRoomSession(): void {
  clearPlayerId();
  clearRoomCode();
  // Keep player name for convenience
}

/**
 * Check if we have valid session data for reconnection
 */
export function canReconnect(): boolean {
  const sessionData = getSessionData();
  return !!(
    sessionData.token &&
    sessionData.playerId &&
    sessionData.roomCode &&
    sessionData.expiresAt > Date.now()
  );
}

/**
 * Get reconnection data if available
 */
export function getReconnectionData(): {
  token: string;
  playerId: string;
  roomCode: string;
} | null {
  if (!canReconnect()) {
    return null;
  }

  const sessionData = getSessionData();

  return {
    token: sessionData.token,
    playerId: sessionData.playerId!,
    roomCode: sessionData.roomCode!,
  };
}
