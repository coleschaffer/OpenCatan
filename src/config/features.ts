/**
 * Feature flags configuration for OpenCatan
 * These flags control experimental features that are not ready for production
 */

interface FeatureFlags {
  /** Enable bot functionality in the lobby (for testing only) */
  ENABLE_BOTS: boolean;
}

/**
 * Feature flags
 * Toggle these to enable/disable features during development
 */
export const FEATURES: FeatureFlags = {
  // Enable bots in the lobby for testing purposes
  // WARNING: This should NEVER be enabled in production
  ENABLE_BOTS: process.env.NODE_ENV !== 'production',
};