/**
 * Audio System - Central Export
 * Provides backward compatibility and new features
 * Version: 2.0 - Stable
 */

// ============================================
// BACKWARD COMPATIBLE EXPORTS (Safe to use)
// ============================================

// These work with both old and new code
export {
  type SoundEvent,
  type VoiceEvent,
} from './premiumSoundService';

// Basic sound controls (stable API)
export {
  setSoundEnabled,
  setSoundVolume,
  setVoiceEnabled,
  setVoiceVolume,
  setLanguage,
} from './premiumSoundService';

// ============================================
// DEFAULT EXPORTS - Using Premium Service
// ============================================

// Using premiumSoundService by default (stable, tested)
export {
  premiumSoundService,
  preloadSounds,
  playSound,
  playVoice,
} from './premiumSoundService';

// ============================================
// ADVANCED FEATURES (New, Optional)
// ============================================

// Advanced Sound Service (NEW - use when ready)
export {
  advancedSoundService,
  preloadSounds as preloadSoundsAdvanced,
  playSound as playSoundAdvanced,
  playVoice as playVoiceAdvanced,
  startMusic,
  stopMusic,
  setGameState,
  setListenerPosition,
  setListenerOrientation,
} from './advancedSoundService';

// TypeScript types for advanced features
export type {
  Position3D,
  GameState,
  MusicLayer,
} from './advancedSoundService';

// React Hooks for advanced features
export {
  useAudioInit,
  use3DAudioListener,
  useAdaptiveMusic,
  useSoundEffect,
  useVoiceNarration,
  useBackgroundMusic,
  useAudioSettings,
  useGameTimer,
  useDiceRoll,
} from './useAdvancedAudio';

// ============================================
// MIGRATION PATH
// ============================================
// 
// Current: Uses premiumSoundService (stable)
// Future: Can switch to advancedSoundService
//
// To migrate a component:
// 1. Import from './shared/audio' (no changes needed)
// 2. When ready, use advanced features:
//    import { useAudioInit, playSoundAdvanced } from './shared/audio'
// 3. Test thoroughly
// ============================================
