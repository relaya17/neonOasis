# 🎵 Sound Files Directory

This directory should contain all audio files for the Neon Oasis application.

## Required Files

### Sound Effects (10 files)
- `click.mp3` - UI click sound
- `neon_click.mp3` - Special neon button click
- `dice_roll.mp3` - Dice rolling sound
- `dice_land.mp3` - Dice landing sound
- `win.mp3` - Win celebration
- `lose.mp3` - Loss sound
- `notification.mp3` - Notification alert
- `coin.mp3` - Coin sound
- `card_flip.mp3` - Card flip sound
- `chip_stack.mp3` - Chip stacking sound

### Voice Narration (16 files)
**English:**
- `voice_welcome_en.mp3`
- `voice_stake_en.mp3`
- `voice_win_en.mp3`
- `voice_big_win_en.mp3`
- `voice_loss_en.mp3`
- `voice_reward_en.mp3`
- `voice_guardian_en.mp3`
- `voice_yalla_en.mp3`

**Hebrew:**
- `voice_welcome_he.mp3`
- `voice_stake_he.mp3`
- `voice_win_he.mp3`
- `voice_big_win_he.mp3`
- `voice_loss_he.mp3`
- `voice_reward_he.mp3`
- `voice_guardian_he.mp3`
- `voice_yalla_he.mp3`

### Background Music (4 files) - Optional
- `bgm_base_loop.mp3` - Main background music
- `bgm_tension_layer.mp3` - Tension layer for adaptive music
- `bgm_victory_layer.mp3` - Victory celebration layer
- `bgm_ambient_pad.mp3` - Ambient atmospheric layer

## File Specifications

- **Format:** MP3
- **Bitrate:** 128-192 kbps
- **Sample Rate:** 44.1 kHz
- **Channels:** Stereo
- **Sound Effects Duration:** 50ms - 1000ms
- **Voice Duration:** 1s - 5s
- **Music:** Seamless loops

## How to Generate

Use the sound generator tool:
```bash
# Open in browser
start scripts/generate-sounds.html

# Generate all sounds
# Convert WAV → MP3
# Place here
```

## Fallback Behavior

If sound files are missing, the app will:
1. Display a console warning
2. Use browser beep sounds (Web Audio API)
3. Use Text-to-Speech for voice narration
4. Continue working normally

The app is designed to work without audio files for development purposes.

## Status

- [ ] Sound Effects Generated
- [ ] Voice Narration Recorded
- [ ] Background Music Created
- [x] Fallback System Active

Last Updated: February 2026
