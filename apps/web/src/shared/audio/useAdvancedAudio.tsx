/**
 * React Hooks for Advanced Audio System
 * Easy integration with game components
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import {
  advancedSoundService,
  preloadSounds,
  playSound,
  playVoice,
  startMusic,
  stopMusic,
  setGameState,
  setListenerPosition,
  type SoundEvent,
  type VoiceEvent,
} from './advancedSoundService';

/**
 * Hook to initialize audio system
 */
export function useAudioInit() {
  useEffect(() => {
    preloadSounds();
    return () => {
      stopMusic();
    };
  }, []);
}

/**
 * Hook for 3D spatial audio - syncs with camera/player position
 */
export function use3DAudioListener(position: { x: number; y: number; z: number }) {
  useEffect(() => {
    setListenerPosition(position);
  }, [position.x, position.y, position.z]);
}

/**
 * Hook for adaptive music based on game state
 */
export function useAdaptiveMusic(gameState: {
  timeRemaining: number;
  isHighStakes: boolean;
  playerCount?: number;
}) {
  useEffect(() => {
    setGameState(gameState);
  }, [gameState.timeRemaining, gameState.isHighStakes, gameState.playerCount]);
}

/**
 * Hook for sound effects with positional audio
 */
export function useSoundEffect() {
  return useCallback((event: SoundEvent, position?: { x: number; y: number; z: number }) => {
    playSound(event, position);
  }, []);
}

/**
 * Hook for voice narration
 */
export function useVoiceNarration() {
  return useCallback((event: VoiceEvent, lang?: 'en' | 'he') => {
    playVoice(event, { language: lang });
  }, []);
}

/**
 * Hook for background music control
 */
export function useBackgroundMusic(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [enabled]);
}

/**
 * Hook for audio settings
 */
export function useAudioSettings() {
  const setSoundVolume = useCallback((volume: number) => {
    advancedSoundService.setSoundVolume(volume);
  }, []);

  const setVoiceVolume = useCallback((volume: number) => {
    advancedSoundService.setVoiceVolume(volume);
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    advancedSoundService.setMusicVolume(volume);
  }, []);

  const setLanguage = useCallback((lang: 'en' | 'he') => {
    advancedSoundService.setLanguage(lang);
  }, []);

  const setSpatialAudio = useCallback((enabled: boolean) => {
    advancedSoundService.setSpatialAudioEnabled(enabled);
  }, []);

  const setDucking = useCallback((enabled: boolean) => {
    advancedSoundService.setDuckingEnabled(enabled);
  }, []);

  return {
    setSoundVolume,
    setVoiceVolume,
    setMusicVolume,
    setLanguage,
    setSpatialAudio,
    setDucking,
  };
}

/**
 * Example: Game Timer with Adaptive Music
 */
export function useGameTimer(initialTime: number, isHighStakes: boolean) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);

  // Update adaptive music based on time
  useAdaptiveMusic({
    timeRemaining,
    isHighStakes,
  });

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  return timeRemaining;
}

/**
 * Example: Dice Roll with 3D Audio
 */
export function useDiceRoll() {
  const playSound = useSoundEffect();

  const rollDice = useCallback(
    (dicePosition: { x: number; y: number; z: number }) => {
      // Play roll sound
      playSound('dice_roll', dicePosition);

      // After animation, play land sound
      setTimeout(() => {
        playSound('dice_land', dicePosition);
      }, 1000);
    },
    [playSound]
  );

  return rollDice;
}
