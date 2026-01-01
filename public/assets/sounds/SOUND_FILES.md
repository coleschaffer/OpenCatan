# OpenCatan Sound Effects

This document lists all 46 sound effect files needed for the game.
Replace these placeholder descriptions with actual MP3 files.

## Sound File List

### Dice Sounds (4 variants)
- `sfx_dice_roll_1.mp3` - Dice rolling sound variant 1
- `sfx_dice_roll_2.mp3` - Dice rolling sound variant 2
- `sfx_dice_roll_3.mp3` - Dice rolling sound variant 3
- `sfx_dice_roll_4.mp3` - Dice rolling sound variant 4

### Turn Notifications
- `sfx_your_turn.mp3` - Notification when it's your turn

### Building Placement
- `sfx_settlement_place.mp3` - Settlement placed sound
- `sfx_city_place.mp3` - City placed/upgraded sound
- `sfx_road_place.mp3` - Road placed sound
- `sfx_ship_place.mp3` - Ship placed sound (Seafarers)

### Development Cards
- `sfx_devcard_bought.mp3` - Development card purchased
- `sfx_devcard_used.mp3` - Development card played

### Trading
- `sfx_offer_accepted.mp3` - Trade offer accepted
- `sfx_offer_rejected.mp3` - Trade offer rejected
- `sfx_trade_proposed.mp3` - New trade offer received

### Robber
- `sfx_robber_place.mp3` - Robber moved to new location

### Victory and Achievements
- `sfx_victory.mp3` - Game won celebration
- `sfx_achievement.mp3` - Generic achievement sound
- `sfx_achievement_longest_road.mp3` - Longest road achieved
- `sfx_achievement_largest_army.mp3` - Largest army achieved

### UI Sounds
- `sfx_click.mp3` - Button click sound
- `sfx_error.mp3` - Error/invalid action sound
- `sfx_notification.mp3` - Generic notification sound

### Lobby and Player Events
- `sfx_chat.mp3` - Chat message received
- `sfx_player_joined.mp3` - Player joined the game
- `sfx_player_left.mp3` - Player left the game
- `sfx_game_start.mp3` - Game starting sound

### Timer
- `sfx_timer_warning.mp3` - Timer running low warning
- `sfx_timer_expired.mp3` - Turn timer expired

### Resources
- `sfx_resource_gained.mp3` - Resources collected
- `sfx_resource_lost.mp3` - Resources lost/discarded

### Cities & Knights - Knight Actions
- `sfx_knight_activate.mp3` - Knight activated
- `sfx_knight_upgrade.mp3` - Knight upgraded
- `sfx_knight_move.mp3` - Knight moved
- `sfx_knight_displace.mp3` - Knight displaced another

### Cities & Knights - Barbarian Events
- `sfx_barbarian_advance.mp3` - Barbarians advance one space
- `sfx_barbarian_attack.mp3` - Barbarians attack
- `sfx_barbarian_victory.mp3` - Barbarians won (city pillaged)
- `sfx_barbarian_defeat.mp3` - Barbarians defeated

### Cities & Knights - City Improvements
- `sfx_city_wall.mp3` - City wall built
- `sfx_metropolis.mp3` - Metropolis achieved
- `sfx_progress_card.mp3` - Progress card drawn

### Dev Card Specific Actions
- `sfx_monopoly.mp3` - Monopoly card played
- `sfx_year_of_plenty.mp3` - Year of Plenty card played
- `sfx_road_building.mp3` - Road Building card played

### Discard Phase
- `sfx_discard.mp3` - Discard phase sound

---

## Notes

- All files should be in MP3 format
- Recommended sample rate: 44.1kHz
- Recommended bit rate: 128kbps or higher
- Keep file sizes small for faster loading (aim for under 50KB per file)
- Sound effects should be short (0.5-2 seconds typical)
- Victory and game start sounds can be longer (2-5 seconds)

## Placeholder Generation

For development/testing, you can generate silent placeholder files:

```bash
# Using ffmpeg to create silent MP3 placeholders
for file in sfx_dice_roll_1 sfx_dice_roll_2 sfx_dice_roll_3 sfx_dice_roll_4 \
  sfx_your_turn sfx_settlement_place sfx_city_place sfx_road_place sfx_ship_place \
  sfx_devcard_bought sfx_devcard_used sfx_offer_accepted sfx_offer_rejected \
  sfx_trade_proposed sfx_robber_place sfx_victory sfx_achievement \
  sfx_achievement_longest_road sfx_achievement_largest_army sfx_click sfx_error \
  sfx_notification sfx_chat sfx_player_joined sfx_player_left sfx_game_start \
  sfx_timer_warning sfx_timer_expired sfx_resource_gained sfx_resource_lost \
  sfx_knight_activate sfx_knight_upgrade sfx_knight_move sfx_knight_displace \
  sfx_barbarian_advance sfx_barbarian_attack sfx_barbarian_victory \
  sfx_barbarian_defeat sfx_city_wall sfx_metropolis sfx_progress_card \
  sfx_monopoly sfx_year_of_plenty sfx_road_building sfx_discard; do
  ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 "${file}.mp3"
done
```

## Recommended Sound Sources

- [Freesound.org](https://freesound.org) - Free sound effects library
- [OpenGameArt.org](https://opengameart.org) - Game assets
- [ZapSplat](https://www.zapsplat.com) - Free sound effects
- Custom recordings or synthesized sounds
