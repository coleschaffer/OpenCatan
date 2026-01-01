/**
 * OpenCatan PartyKit Server Utilities
 *
 * Helper functions for room management, code generation, and session handling.
 */

// =============================================================================
// ROOM CODE GENERATION
// =============================================================================

/**
 * Characters allowed in room codes.
 * Excludes ambiguous characters that could be confused:
 * - 0 (zero) and O (letter O)
 * - 1 (one), I (letter I), and L (letter L)
 *
 * This leaves us with:
 * - Numbers: 2, 3, 4, 5, 6, 7, 8, 9
 * - Letters: A, B, C, D, E, F, G, H, J, K, M, N, P, Q, R, S, T, U, V, W, X, Y, Z
 */
const ROOM_CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Length of generated room codes.
 */
const ROOM_CODE_LENGTH = 6;

/**
 * Generates a unique 6-character alphanumeric room code.
 *
 * The code avoids ambiguous characters (0/O, 1/I/L) for easy verbal sharing.
 * With 31 possible characters and 6 positions, there are 31^6 = 887,503,681
 * possible combinations, making collisions extremely unlikely.
 *
 * @returns A 6-character uppercase alphanumeric room code
 *
 * @example
 * generateRoomCode() // Returns something like "OCEAN7" or "BRICK2"
 */
export function generateRoomCode(): string {
  let code = '';

  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[randomIndex];
  }

  return code;
}

/**
 * Validates a room code format.
 *
 * @param code - The code to validate
 * @returns True if the code is valid format
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || code.length !== ROOM_CODE_LENGTH) {
    return false;
  }

  const upperCode = code.toUpperCase();

  for (const char of upperCode) {
    if (!ROOM_CODE_CHARS.includes(char)) {
      return false;
    }
  }

  return true;
}

/**
 * Alias for isValidRoomCode for API consistency.
 * Validates a room code format.
 *
 * @param code - The code to validate
 * @returns True if the code is valid format
 */
export const validateRoomCode = isValidRoomCode;

/**
 * Normalizes a room code to uppercase.
 * Room codes are case-insensitive when entered by users.
 *
 * @param code - The code to normalize
 * @returns The uppercase normalized code
 */
export function normalizeRoomCode(code: string): string {
  return code.toUpperCase().trim();
}

// =============================================================================
// SESSION TOKEN GENERATION
// =============================================================================

/**
 * Characters used in session tokens.
 * Uses full alphanumeric set for maximum entropy since tokens
 * are not meant to be typed by users.
 */
const SESSION_TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Length of session tokens.
 * 32 characters with 62 possible chars = very high entropy.
 */
const SESSION_TOKEN_LENGTH = 32;

/**
 * Generates a unique session token for player identification.
 *
 * Session tokens are used to:
 * - Identify a player across reconnections
 * - Link a returning browser to their game seat
 * - Prevent session hijacking (tokens are secret)
 *
 * The token is stored in the client's localStorage and sent
 * on reconnection to restore their player state.
 *
 * @returns A 32-character alphanumeric session token
 *
 * @example
 * generateSessionToken() // Returns something like "aB3dEf7HiJkLmN0pQrStUvWxYz123456"
 */
export function generateSessionToken(): string {
  let token = '';

  for (let i = 0; i < SESSION_TOKEN_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * SESSION_TOKEN_CHARS.length);
    token += SESSION_TOKEN_CHARS[randomIndex];
  }

  return token;
}

// =============================================================================
// PLAYER ID GENERATION
// =============================================================================

/**
 * Generates a unique player ID.
 *
 * Player IDs are used internally to track players across the game.
 * They are different from connection IDs (which change on reconnect)
 * and session tokens (which are secret).
 *
 * @returns A unique player ID with timestamp prefix for debugging
 */
export function generatePlayerId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `player_${timestamp}_${random}`;
}

// =============================================================================
// PLAYER NAME VALIDATION
// =============================================================================

/**
 * Minimum length for player names.
 */
const MIN_NAME_LENGTH = 1;

/**
 * Maximum length for player names.
 */
const MAX_NAME_LENGTH = 20;

/**
 * Validates and sanitizes a player name.
 *
 * @param name - The raw player name input
 * @returns Object with validated name and any errors
 */
export function validatePlayerName(name: string): { valid: boolean; sanitized: string; error?: string } {
  // Trim whitespace
  const trimmed = name.trim();

  // Check length
  if (trimmed.length < MIN_NAME_LENGTH) {
    return { valid: false, sanitized: '', error: 'Name is required' };
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      sanitized: trimmed.substring(0, MAX_NAME_LENGTH),
      error: `Name must be ${MAX_NAME_LENGTH} characters or less`
    };
  }

  // Remove any potentially problematic characters (basic XSS prevention)
  const sanitized = trimmed
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/&/g, '&amp;') // Escape ampersands
    .trim();

  if (sanitized.length < MIN_NAME_LENGTH) {
    return { valid: false, sanitized: '', error: 'Name contains invalid characters' };
  }

  return { valid: true, sanitized };
}

// =============================================================================
// TIME UTILITIES
// =============================================================================

/**
 * Gets the current timestamp in milliseconds.
 * Wrapper for testability.
 *
 * @returns Current time in milliseconds since epoch
 */
export function now(): number {
  return Date.now();
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "2m 30s" or "45s"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Shuffles an array using Fisher-Yates algorithm.
 * Used for randomizing turn order.
 *
 * @param array - Array to shuffle
 * @returns New shuffled array (does not modify original)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// =============================================================================
// MESSAGE UTILITIES
// =============================================================================

/**
 * Safely parses a JSON message string.
 *
 * @param data - Raw message data (string or other)
 * @returns Parsed object or null if invalid
 */
export function parseMessage<T>(data: unknown): T | null {
  try {
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    }
    return data as T;
  } catch {
    return null;
  }
}

/**
 * Creates a JSON string from an object for sending.
 *
 * @param message - Message object to stringify
 * @returns JSON string
 */
export function stringifyMessage(message: unknown): string {
  return JSON.stringify(message);
}

// =============================================================================
// LOGGING UTILITIES
// =============================================================================

/**
 * Log levels for server logging.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Creates a prefixed logger for a room.
 *
 * @param roomCode - The room code to prefix logs with
 * @returns Logger object with level methods
 */
export function createLogger(roomCode: string) {
  const prefix = `[Room ${roomCode}]`;

  return {
    debug: (message: string, ...args: unknown[]) => {
      console.debug(`${prefix} ${message}`, ...args);
    },
    info: (message: string, ...args: unknown[]) => {
      console.info(`${prefix} ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`${prefix} ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`${prefix} ${message}`, ...args);
    },
  };
}
