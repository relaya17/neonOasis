/**
 * Advanced Sound Service - Premium Edition
 * Features: 3D Spatial Audio, Audio Ducking, Adaptive Music
 * Author: Sound Engineer + Dev Team
 * Date: February 2026
 */

import { Howl, Howler } from 'howler';

export type SoundEvent =
  | 'click'
  | 'neon_click'
  | 'dice_roll'
  | 'dice_land'
  | 'win'
  | 'lose'
  | 'notification'
  | 'coin'
  | 'card_flip'
  | 'chip_stack';

export type VoiceEvent =
  | 'welcome'
  | 'stake'
  | 'win'
  | 'big_win'
  | 'loss'
  | 'reward'
  | 'guardian'
  | 'yalla';

export type MusicLayer = 'base' | 'tension' | 'victory' | 'ambient';

interface AudioState {
  enabled: boolean;
  volume: number;
  voiceEnabled: boolean;
  voiceVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  language: 'en' | 'he';
  spatialAudioEnabled: boolean;
  duckingEnabled: boolean;
}

export interface GameState {
  timeRemaining: number;
  isHighStakes: boolean;
  tensionLevel: number; // 0-1
  playerCount: number;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

class AdvancedSoundService {
  private state: AudioState = {
    enabled: true,
    volume: 0.7,
    voiceEnabled: true,
    voiceVolume: 0.8,
    musicEnabled: true,
    musicVolume: 0.4,
    language: 'en',
    spatialAudioEnabled: true,
    duckingEnabled: true,
  };

  private sounds: Map<SoundEvent, Howl> = new Map();
  private voices: Map<VoiceEvent, Howl> = new Map();
  private music: Map<MusicLayer, Howl> = new Map();
  private preloaded = false;

  // Advanced features
  private gameState: GameState = {
    timeRemaining: 60,
    isHighStakes: false,
    tensionLevel: 0,
    playerCount: 1,
  };

  private duckingTimeout: number | null = null;
  private originalMusicVolume: number = 0.4;

  /**
   * Initialize and preload all audio assets
   */
  async preloadSounds(): Promise<void> {
    if (this.preloaded) return;

    try {
      // Load sound effects
      await this.loadSoundEffects();
      // Load voice narration
      await this.loadVoiceNarration();
      // Load background music layers
      await this.loadBackgroundMusic();

      this.preloaded = true;
      console.log('🎵 Advanced Sound Service initialized');
    } catch (error) {
      console.error('Failed to preload sounds:', error);
    }
  }

  /**
   * Load sound effects with spatial audio support
   */
  private async loadSoundEffects(): Promise<void> {
    const soundEvents: SoundEvent[] = [
      'click',
      'neon_click',
      'dice_roll',
      'dice_land',
      'win',
      'lose',
      'notification',
      'coin',
      'card_flip',
      'chip_stack',
    ];

    for (const event of soundEvents) {
      const soundPath = `/sounds/${event}.mp3`;
      this.sounds.set(
        event,
        new Howl({
          src: [soundPath],
          volume: this.state.volume,
          preload: true,
          onloaderror: () => {
            console.warn(`Sound file not found: ${soundPath}, using fallback`);
          },
        })
      );
    }
  }

  /**
   * Load voice narration
   */
  private async loadVoiceNarration(): Promise<void> {
    const voiceEvents: VoiceEvent[] = [
      'welcome',
      'stake',
      'win',
      'big_win',
      'loss',
      'reward',
      'guardian',
      'yalla',
    ];

    for (const event of voiceEvents) {
      const voicePath = `/sounds/voice_${event}_${this.state.language}.mp3`;
      this.voices.set(
        event,
        new Howl({
          src: [voicePath],
          volume: this.state.voiceVolume,
          preload: true,
          onloaderror: () => {
            console.warn(`Voice file not found: ${voicePath}, using TTS fallback`);
          },
        })
      );
    }
  }

  /**
   * Load background music layers for adaptive music
   */
  private async loadBackgroundMusic(): Promise<void> {
    const musicLayers: { layer: MusicLayer; file: string }[] = [
      { layer: 'base', file: 'bgm_base_loop.mp3' },
      { layer: 'tension', file: 'bgm_tension_layer.mp3' },
      { layer: 'victory', file: 'bgm_victory_layer.mp3' },
      { layer: 'ambient', file: 'bgm_ambient_pad.mp3' },
    ];

    for (const { layer, file } of musicLayers) {
      this.music.set(
        layer,
        new Howl({
          src: [`/sounds/${file}`],
          volume: layer === 'base' ? this.state.musicVolume : 0,
          loop: true,
          preload: true,
          onloaderror: () => {
            console.warn(`Music file not found: ${file}`);
          },
        })
      );
    }
  }

  /**
   * Play sound with optional 3D spatial positioning
   */
  playSound(event: SoundEvent, position?: Position3D): number | null {
    if (!this.state.enabled || this.state.volume <= 0) return null;

    const sound = this.sounds.get(event);
    if (sound) {
      // Apply audio ducking if enabled
      if (this.state.duckingEnabled && ['win', 'big_win', 'jackpot'].includes(event)) {
        this.duckMusic();
      }

      // Play with spatial audio if position provided and enabled
      if (position && this.state.spatialAudioEnabled) {
        return this.playSound3D(sound, position);
      }

      sound.volume(this.state.volume);
      return sound.play();
    } else {
      // Fallback: browser beep
      this.playBeep(event);
      return null;
    }
  }

  /**
   * Play sound with 3D spatial positioning
   */
  private playSound3D(sound: Howl, position: Position3D): number {
    const soundId = sound.play();

    // Set 3D position
    sound.pos(position.x, position.y, position.z, soundId);

    // Configure spatial audio parameters
    sound.pannerAttr({
      panningModel: 'HRTF',
      refDistance: 1,
      rolloffFactor: 1,
      distanceModel: 'inverse',
      maxDistance: 10,
    }, soundId);

    return soundId;
  }

  /**
   * Play voice narration
   */
  playVoice(event: VoiceEvent, options?: { language?: 'en' | 'he' }): void {
    if (!this.state.voiceEnabled || this.state.voiceVolume <= 0) return;

    const lang = options?.language || this.state.language;
    const voice = this.voices.get(event);

    if (voice) {
      // Apply audio ducking
      if (this.state.duckingEnabled) {
        this.duckMusic(2000);
      }

      voice.volume(this.state.voiceVolume);
      voice.play();
    } else {
      // Fallback: TTS
      this.playTTS(event, lang);
    }
  }

  /**
   * Audio Ducking - Lower background music volume during important sounds
   */
  private duckMusic(duration: number = 1500): void {
    if (!this.state.musicEnabled) return;

    // Clear existing ducking timeout
    if (this.duckingTimeout) {
      clearTimeout(this.duckingTimeout);
    }

    // Duck all music layers
    this.music.forEach((howl) => {
      const currentVol = howl.volume();
      if (currentVol > 0) {
        howl.fade(currentVol, currentVol * 0.25, 200);
      }
    });

    // Restore after duration
    this.duckingTimeout = window.setTimeout(() => {
      this.music.forEach((howl) => {
        const currentVol = howl.volume();
        if (currentVol > 0) {
          const targetVol = this.originalMusicVolume * (howl === this.music.get('base') ? 1 : this.gameState.tensionLevel);
          howl.fade(currentVol, targetVol, 500);
        }
      });
      this.duckingTimeout = null;
    }, duration);
  }

  /**
   * Update game state for adaptive music
   */
  setGameState(state: Partial<GameState>): void {
    this.gameState = { ...this.gameState, ...state };
    this.updateAdaptiveMusic();
  }

  /**
   * Adaptive Music System - Dynamic music based on game state
   */
  private updateAdaptiveMusic(): void {
    if (!this.state.musicEnabled) return;

    const base = this.music.get('base');
    const tension = this.music.get('tension');
    const ambient = this.music.get('ambient');

    if (!base || !tension || !ambient) return;

    // Calculate tension level based on time remaining
    let tensionLevel = 0;
    if (this.gameState.timeRemaining <= 10) {
      tensionLevel = 1 - (this.gameState.timeRemaining / 10);
    }

    // Adjust for high stakes
    if (this.gameState.isHighStakes) {
      tensionLevel = Math.min(1, tensionLevel + 0.2);
    }

    this.gameState.tensionLevel = tensionLevel;

    // Base layer: Speed up slightly when tense
    const baseRate = 1.0 + (tensionLevel * 0.15);
    base.rate(baseRate);

    // Tension layer: Fade in as tension increases
    const tensionVol = this.state.musicVolume * tensionLevel * 0.6;
    tension.fade(tension.volume(), tensionVol, 1000);

    // Ambient layer: Subtle presence
    const ambientVol = this.state.musicVolume * 0.3;
    ambient.fade(ambient.volume(), ambientVol, 1000);
  }

  /**
   * Start background music
   */
  startMusic(): void {
    if (!this.state.musicEnabled) return;

    this.music.forEach((howl, layer) => {
      if (layer === 'base') {
        howl.play();
      }
    });
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    this.music.forEach((howl) => {
      howl.stop();
    });
  }

  /**
   * Fallback: Browser beep
   */
  private playBeep(event: SoundEvent): void {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const frequencies: Record<SoundEvent, number> = {
      click: 800,
      neon_click: 1200,
      dice_roll: 400,
      dice_land: 600,
      win: 1000,
      lose: 300,
      notification: 900,
      coin: 1500,
      card_flip: 700,
      chip_stack: 500,
    };

    oscillator.frequency.value = frequencies[event] || 440;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(this.state.volume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  /**
   * Fallback: TTS
   */
  private playTTS(event: VoiceEvent, lang: 'en' | 'he'): void {
    if (!('speechSynthesis' in window)) return;

    const texts: Record<VoiceEvent, { en: string; he: string }> = {
      welcome: {
        en: 'Welcome to the Oasis. The table is waiting.',
        he: 'ברוכים הבאים לנווה המדבר. השולחן מחכה.',
      },
      stake: {
        en: 'Stakes are high. Show them what you are made of.',
        he: 'ההימור גבוה. תראה להם ממה אתה עשוי.',
      },
      win: {
        en: 'Clean move.',
        he: 'מהלך נקי.',
      },
      big_win: {
        en: 'Legendary. The Oasis remembers.',
        he: 'אגדי. הנווה זוכר.',
      },
      loss: {
        en: 'Fortune favors the bold. Next time, it is yours.',
        he: 'המזל משרת את האמיצים. בפעם הבאה, זה שלך.',
      },
      reward: {
        en: 'Another coin in the empire. Keep building.',
        he: 'עוד מטבע באימפריה. המשך לבנות.',
      },
      guardian: {
        en: 'The Oasis sees everything. Play fair, or do not play at all.',
        he: 'הנווה רואה הכל. שחק הוגן, או אל תשחק בכלל.',
      },
      yalla: {
        en: 'Yalla, make your move.',
        he: 'יאללה, תעשה את המהלך שלך.',
      },
    };

    const utterance = new SpeechSynthesisUtterance(texts[event][lang]);
    utterance.lang = lang === 'he' ? 'he-IL' : 'en-US';
    utterance.volume = this.state.voiceVolume;
    utterance.rate = 0.95;
    utterance.pitch = 0.8;

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Set listener position for 3D audio
   */
  setListenerPosition(position: Position3D): void {
    Howler.pos(position.x, position.y, position.z);
  }

  /**
   * Set listener orientation for 3D audio
   */
  setListenerOrientation(forward: Position3D, up: Position3D): void {
    Howler.orientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
  }

  // Settings
  setSoundEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
  }

  setSoundVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => sound.volume(this.state.volume));
  }

  setVoiceEnabled(enabled: boolean): void {
    this.state.voiceEnabled = enabled;
  }

  setVoiceVolume(volume: number): void {
    this.state.voiceVolume = Math.max(0, Math.min(1, volume));
    this.voices.forEach((voice) => voice.volume(this.state.voiceVolume));
  }

  setMusicEnabled(enabled: boolean): void {
    this.state.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setMusicVolume(volume: number): void {
    this.state.musicVolume = Math.max(0, Math.min(1, volume));
    this.originalMusicVolume = this.state.musicVolume;
    this.music.forEach((howl) => {
      howl.volume(this.state.musicVolume);
    });
  }

  setLanguage(language: 'en' | 'he'): void {
    this.state.language = language;
    // Reload voice files with new language
    this.loadVoiceNarration();
  }

  setSpatialAudioEnabled(enabled: boolean): void {
    this.state.spatialAudioEnabled = enabled;
  }

  setDuckingEnabled(enabled: boolean): void {
    this.state.duckingEnabled = enabled;
  }

  getState(): AudioState {
    return { ...this.state };
  }
}

// Singleton instance
export const advancedSoundService = new AdvancedSoundService();

// Convenience exports
export const preloadSounds = () => advancedSoundService.preloadSounds();
export const playSound = (event: SoundEvent, position?: Position3D) =>
  advancedSoundService.playSound(event, position);
export const playVoice = (event: VoiceEvent, options?: { language?: 'en' | 'he' }) =>
  advancedSoundService.playVoice(event, options);
export const startMusic = () => advancedSoundService.startMusic();
export const stopMusic = () => advancedSoundService.stopMusic();
export const setGameState = (state: Partial<GameState>) => advancedSoundService.setGameState(state);
export const setListenerPosition = (position: Position3D) =>
  advancedSoundService.setListenerPosition(position);
export const setListenerOrientation = (forward: Position3D, up: Position3D) =>
  advancedSoundService.setListenerOrientation(forward, up);
