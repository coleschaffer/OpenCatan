/**
 * Sound Effects - Sound file mappings for OpenCatan
 *
 * Defines all sound effects used in the game and their file paths.
 * Some sounds have multiple variants for variety (e.g., dice rolls).
 */

/**
 * Sound effect types used throughout the game
 */
export type SoundEffect =
  | 'dice_roll'
  | 'your_turn'
  | 'settlement_place'
  | 'city_place'
  | 'road_place'
  | 'ship_place'
  | 'devcard_bought'
  | 'devcard_used'
  | 'trade_accepted'
  | 'trade_rejected'
  | 'trade_proposed'
  | 'robber_place'
  | 'victory'
  | 'achievement'
  | 'longest_road'
  | 'largest_army'
  | 'click'
  | 'error'
  | 'notification'
  | 'chat_message'
  | 'player_joined'
  | 'player_left'
  | 'game_start'
  | 'timer_warning'
  | 'timer_expired'
  | 'resource_gained'
  | 'resource_lost'
  | 'knight_activate'
  | 'knight_upgrade'
  | 'knight_move'
  | 'knight_displace'
  | 'barbarian_advance'
  | 'barbarian_attack'
  | 'barbarian_victory'
  | 'barbarian_defeat'
  | 'city_wall_built'
  | 'metropolis_built'
  | 'progress_card_drawn'
  | 'monopoly'
  | 'year_of_plenty'
  | 'road_building'
  | 'discard';

/**
 * Sound file paths for each sound effect
 * Some effects have multiple variants for variety
 * Mapped to existing sound files in /public/assets/sounds/
 */
export const SOUND_FILES: Record<SoundEffect, string | string[]> = {
  // Dice - 4 random variants
  dice_roll: [
    '/assets/sounds/sfx_dice_roll_1.mp3',
    '/assets/sounds/sfx_dice_roll_2.mp3',
    '/assets/sounds/sfx_dice_roll_3.mp3',
    '/assets/sounds/sfx_dice_roll_4.mp3',
  ],

  // Turn notifications
  your_turn: '/assets/sounds/sfx_your_turn.mp3',

  // Building placement
  settlement_place: '/assets/sounds/sfx_settlement_place.mp3',
  city_place: '/assets/sounds/sfx_city_place.mp3',
  road_place: '/assets/sounds/sfx_road_place.mp3',
  ship_place: '/assets/sounds/sfx_ship_place.mp3',

  // Development cards
  devcard_bought: '/assets/sounds/sfx_devcard_bought.mp3',
  devcard_used: '/assets/sounds/sfx_devcard_used.mp3',

  // Trading
  trade_accepted: '/assets/sounds/sfx_offer_accepted.mp3',
  trade_rejected: '/assets/sounds/sfx_offer_rejected.mp3',
  trade_proposed: '/assets/sounds/sfx_offer_acceptable.mp3', // Use acceptable as proposed

  // Robber
  robber_place: '/assets/sounds/sfx_robber_place.mp3',

  // Victory and achievements
  victory: '/assets/sounds/sfx_victory.mp3',
  achievement: '/assets/sounds/sfx_achievement_ck_progress.mp3', // Use C&K progress as generic achievement
  longest_road: '/assets/sounds/sfx_achievement_longest_road.mp3',
  largest_army: '/assets/sounds/sfx_achievement_largest_army.mp3',

  // UI sounds
  click: '/assets/sounds/sfx_click.mp3',
  error: '/assets/sounds/sfx_offer_not_acceptable.mp3', // Use not-acceptable as error
  notification: '/assets/sounds/sfx_message_notification.mp3',

  // Lobby and player events
  chat_message: '/assets/sounds/sfx_message_notification.mp3',
  player_joined: '/assets/sounds/sfx_join_room.mp3',
  player_left: '/assets/sounds/sfx_leave_room.mp3',
  game_start: '/assets/sounds/sfx_game_started.mp3',

  // Timer
  timer_warning: '/assets/sounds/sfx_first_reminder.mp3',
  timer_expired: '/assets/sounds/sfx_vote_reminder.mp3',

  // Resources
  resource_gained: '/assets/sounds/sfx_settlement_phase_ended.mp3', // Reuse for resource gain
  resource_lost: '/assets/sounds/sfx_discard_notification.mp3',

  // Cities & Knights - Knight actions
  knight_activate: '/assets/sounds/sfx_knight_equip.mp3',
  knight_upgrade: '/assets/sounds/sfx_knight_upgrade.mp3',
  knight_move: '/assets/sounds/sfx_knight_place.mp3',
  knight_displace: '/assets/sounds/sfx_knight_place.mp3', // Reuse knight place

  // Cities & Knights - Barbarian events
  barbarian_advance: '/assets/sounds/sfx_clock_tick.mp3',
  barbarian_attack: '/assets/sounds/sfx_city_destroy.mp3',
  barbarian_victory: '/assets/sounds/sfx_city_destroy.mp3',
  barbarian_defeat: '/assets/sounds/sfx_achievement_ck_progress.mp3',

  // Cities & Knights - City improvements
  city_wall_built: '/assets/sounds/sfx_city_wall_place.mp3',
  metropolis_built: '/assets/sounds/sfx_metropolis_place.mp3',
  progress_card_drawn: '/assets/sounds/sfx_city_improvement.mp3',

  // Dev card specific actions
  monopoly: '/assets/sounds/sfx_devcard_monopoly.mp3',
  year_of_plenty: '/assets/sounds/sfx_devcard_used.mp3', // Reuse devcard used
  road_building: '/assets/sounds/sfx_road_place.mp3', // Reuse road place

  // Discard phase
  discard: '/assets/sounds/sfx_discard_broadcast.mp3',
};

/**
 * Get all unique sound file paths for preloading
 */
export function getAllSoundPaths(): string[] {
  const paths: string[] = [];

  Object.values(SOUND_FILES).forEach((pathOrPaths) => {
    if (Array.isArray(pathOrPaths)) {
      paths.push(...pathOrPaths);
    } else {
      paths.push(pathOrPaths);
    }
  });

  return paths;
}

/**
 * Get the file path(s) for a specific sound effect
 */
export function getSoundPath(sound: SoundEffect): string | string[] {
  return SOUND_FILES[sound];
}

/**
 * Get a random variant for sounds with multiple files
 */
export function getRandomSoundPath(sound: SoundEffect): string {
  const pathOrPaths = SOUND_FILES[sound];

  if (Array.isArray(pathOrPaths)) {
    const randomIndex = Math.floor(Math.random() * pathOrPaths.length);
    return pathOrPaths[randomIndex];
  }

  return pathOrPaths;
}

/**
 * Sound categories for volume control or muting specific types
 */
export type SoundCategory = 'ui' | 'game' | 'notification' | 'ambient';

/**
 * Categorization of sound effects
 */
export const SOUND_CATEGORIES: Record<SoundEffect, SoundCategory> = {
  // UI sounds
  click: 'ui',
  error: 'ui',

  // Game action sounds
  dice_roll: 'game',
  your_turn: 'game',
  settlement_place: 'game',
  city_place: 'game',
  road_place: 'game',
  ship_place: 'game',
  devcard_bought: 'game',
  devcard_used: 'game',
  trade_accepted: 'game',
  trade_rejected: 'game',
  trade_proposed: 'game',
  robber_place: 'game',
  resource_gained: 'game',
  resource_lost: 'game',
  knight_activate: 'game',
  knight_upgrade: 'game',
  knight_move: 'game',
  knight_displace: 'game',
  barbarian_advance: 'game',
  barbarian_attack: 'game',
  barbarian_victory: 'game',
  barbarian_defeat: 'game',
  city_wall_built: 'game',
  metropolis_built: 'game',
  progress_card_drawn: 'game',
  monopoly: 'game',
  year_of_plenty: 'game',
  road_building: 'game',
  discard: 'game',

  // Notification sounds
  notification: 'notification',
  chat_message: 'notification',
  player_joined: 'notification',
  player_left: 'notification',
  game_start: 'notification',
  timer_warning: 'notification',
  timer_expired: 'notification',
  victory: 'notification',
  achievement: 'notification',
  longest_road: 'notification',
  largest_army: 'notification',
};
