/**
 * Common types shared across the OpenCatan application
 */

// Player Colors (12 total for large game support)
export type PlayerColor =
  | 'red'
  | 'blue'
  | 'orange'
  | 'white'
  | 'green'
  | 'purple'
  | 'black'
  | 'bronze'
  | 'gold'
  | 'silver'
  | 'pink'
  | 'mysticblue';

// Base resources (available in all game modes)
export type ResourceType = 'brick' | 'lumber' | 'ore' | 'grain' | 'wool';

// Commodities (Cities & Knights expansion only)
export type CommodityType = 'cloth' | 'coin' | 'paper';

// Terrain types for hex tiles
export type TerrainType =
  | 'hills'      // Produces brick
  | 'forest'     // Produces lumber
  | 'mountains'  // Produces ore
  | 'fields'     // Produces grain
  | 'pasture'    // Produces wool
  | 'desert'     // No production
  | 'water'      // Ocean tiles (Seafarers)
  | 'gold'       // Gold river (player chooses resource)
  | 'fog';       // Fog of war (Explorers scenario)

// Resource counts mapping
export type ResourceCounts = Record<ResourceType, number>;

// Commodity counts mapping (C&K)
export type CommodityCounts = Record<CommodityType, number>;

// Mapping of terrain to produced resource
export const TERRAIN_RESOURCE_MAP: Partial<Record<TerrainType, ResourceType>> = {
  hills: 'brick',
  forest: 'lumber',
  mountains: 'ore',
  fields: 'grain',
  pasture: 'wool',
} as const;

// All player colors as an array for iteration
export const PLAYER_COLORS: readonly PlayerColor[] = [
  'red',
  'blue',
  'orange',
  'white',
  'green',
  'purple',
  'black',
  'bronze',
  'gold',
  'silver',
  'pink',
  'mysticblue',
] as const;

// All resource types as an array for iteration
export const RESOURCE_TYPES: readonly ResourceType[] = [
  'brick',
  'lumber',
  'ore',
  'grain',
  'wool',
] as const;

// All commodity types as an array for iteration
export const COMMODITY_TYPES: readonly CommodityType[] = [
  'cloth',
  'coin',
  'paper',
] as const;

// Display names for player colors
export const PLAYER_COLOR_NAMES: Record<PlayerColor, string> = {
  red: 'Red',
  blue: 'Blue',
  orange: 'Orange',
  white: 'White',
  green: 'Green',
  purple: 'Purple',
  black: 'Black',
  bronze: 'Bronze',
  gold: 'Gold',
  silver: 'Silver',
  pink: 'Pink',
  mysticblue: 'Mystic Blue',
};

// Hex color codes for player colors
export const PLAYER_COLOR_HEX: Record<PlayerColor, string> = {
  red: '#E53935',
  blue: '#1E88E5',
  orange: '#FB8C00',
  white: '#FAFAFA',
  green: '#43A047',
  purple: '#8E24AA',
  black: '#212121',
  bronze: '#8D6E63',
  gold: '#FDD835',
  silver: '#90A4AE',
  pink: '#EC407A',
  mysticblue: '#0D47A1',
};

// Color configuration with display names and hex values
export interface ColorInfo {
  name: string;
  hex: string;
}

export const COLOR_CONFIG: Record<PlayerColor, ColorInfo> = {
  red: { name: 'Red', hex: '#E53935' },
  blue: { name: 'Blue', hex: '#1E88E5' },
  orange: { name: 'Orange', hex: '#FB8C00' },
  white: { name: 'White', hex: '#FAFAFA' },
  green: { name: 'Green', hex: '#43A047' },
  purple: { name: 'Purple', hex: '#8E24AA' },
  black: { name: 'Black', hex: '#212121' },
  bronze: { name: 'Bronze', hex: '#8D6E63' },
  gold: { name: 'Gold', hex: '#FDD835' },
  silver: { name: 'Silver', hex: '#90A4AE' },
  pink: { name: 'Pink', hex: '#EC407A' },
  mysticblue: { name: 'Mystic Blue', hex: '#0D47A1' },
};
