/**
 * Premium Sound Service with Howler.js
 * Includes voice narration, reverb, radio filter, and bilingual support
 */

import { Howl } from 'howler';

export type SoundEvent =
  | 'click'
  | 'neon_click'
  | 'dice_roll'
  | 'dice_land'
  | 'win'
  | 'lose'
  | 'notification'
  | 'coin'
  | 'gift_sent'
  | 'card_flip'
  | 'chip_stack';

export type VoiceEvent =
  | 'welcome' // "Welcome to the Oasis. The table is waiting."
  | 'stake' // "Stakes are high. Show them what you're made of."
  | 'win' // "Clean move." or "Legendary. The Oasis remembers."
  | 'big_win' // Big win variant
  | 'loss' // "Fortune favors the bold. Next time, it's yours."
  | 'reward' // "Another coin in the empire. Keep building."
  | 'guardian' // "The Oasis sees everything. Play fair, or don't play at all."
  | 'yalla'; // Hebrew: "Yalla, make your move." (for Israeli users)

interface AudioState {
  enabled: boolean;
  volume: number;
  voiceEnabled: boolean;
  voiceVolume: number;
  language: 'en' | 'he';
}

class PremiumSoundService {
  private state: AudioState = {
    enabled: true,
    volume: 0.7,
    voiceEnabled: true,
    voiceVolume: 0.8,
    language: 'en',
  };

  private sounds: Map<SoundEvent, Howl> = new Map();
  private voices: Map<VoiceEvent, Howl> = new Map();
  private preloaded = false;
  private audioContextResumed = false;

  /**
   * Resume AudioContext on first user interaction (required by browser autoplay policy).
   * Call this on first click/tap so that sounds can play.
   */
  private async resumeAudioContextIfNeeded(): Promise<void> {
    if (this.audioContextResumed || typeof window === 'undefined') return;
    const ctx = typeof (window as unknown as { Howler?: { ctx?: AudioContext } }).Howler?.ctx !== 'undefined'
      ? (window as unknown as { Howler: { ctx: AudioContext } }).Howler.ctx
      : null;
    if (ctx?.state === 'suspended') {
      await ctx.resume();
      this.audioContextResumed = true;
    }
  }

  /**
   * Base URL for sound files: from VITE_SOUNDS_BASE_URL (network/CDN) or same origin.
   * Use VITE_SOUNDS_BASE_URL to load from an allowed CORS origin (e.g. your CDN).
   */
  private getSoundBase(): string {
    const fromEnv =
      typeof import.meta !== 'undefined' &&
      (import.meta.env as { VITE_SOUNDS_BASE_URL?: string }).VITE_SOUNDS_BASE_URL;
    if (fromEnv && typeof fromEnv === 'string') {
      return fromEnv.endsWith('/') ? fromEnv.slice(0, -1) : fromEnv;
    }
    const base =
      (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '';
    const baseNorm = base.endsWith('/') ? base.slice(0, -1) : base;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return origin ? `${origin}${baseNorm || ''}` : baseNorm || '';
  }

  /**
   * Preload all sound assets (from same origin or VITE_SOUNDS_BASE_URL).
   */
  async preloadSounds(): Promise<void> {
    if (this.preloaded) return;

    const soundBase = this.getSoundBase();

    try {
      const soundEvents: SoundEvent[] = [
        'click',
        'neon_click',
        'dice_roll',
        'dice_land',
        'win',
        'lose',
        'notification',
        'coin',
        'gift_sent',
        'card_flip',
        'chip_stack',
      ];

      for (const event of soundEvents) {
        const file = event === 'gift_sent' ? 'coin' : event;
        const soundPath = `${soundBase}/sounds/${file}.mp3`;
        this.sounds.set(
          event,
          new Howl({
            src: [soundPath],
            volume: this.state.volume,
            html5: false,
            onloaderror: (_id, err) => {
              if (typeof console !== 'undefined' && console.debug) {
                console.debug(`Sound file not found: ${soundPath}`, err);
              }
            },
          })
        );
      }

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
        const voicePath = `${soundBase}/sounds/voice_${event}_${this.state.language}.mp3`;
        this.voices.set(
          event,
          new Howl({
            src: [voicePath],
            volume: this.state.voiceVolume,
            onloaderror: () => {
              if (typeof console !== 'undefined' && console.debug) {
                console.debug(`Voice file not found: ${voicePath}, using TTS fallback`);
              }
            },
          })
        );
      }

      this.preloaded = true;
    } catch (error) {
      console.error('Failed to preload sounds:', error);
    }
  }

  /**
   * Play a sound effect. Resumes AudioContext on first play so browser allows playback.
   */
  playSound(event: SoundEvent): void {
    if (!this.state.enabled || this.state.volume <= 0) return;

    const sound = this.sounds.get(event);
    const doPlay = () => {
      if (sound) {
        sound.volume(this.state.volume);
        sound.play();
      } else {
        this.playBeep(event);
      }
      // Howler may create ctx on first play(); resume so next play works
      setTimeout(() => this.resumeAudioContextIfNeeded(), 0);
    };
    this.resumeAudioContextIfNeeded().then(doPlay);
  }

  /**
   * Play voice narration
   */
  playVoice(event: VoiceEvent, options?: { language?: 'en' | 'he' }): void {
    if (!this.state.voiceEnabled || this.state.voiceVolume <= 0) return;

    const lang = options?.language || this.state.language;
    const voiceKey = event as VoiceEvent;
    const voice = this.voices.get(voiceKey);

    if (voice) {
      voice.volume(this.state.voiceVolume);
      voice.play();
    } else {
      // Fallback: Web Speech API (TTS)
      this.playTTS(event, lang);
    }
  }

  /**
   * Fallback: Browser beep for sound effects
   */
  private playBeep(event: SoundEvent): void {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different events
    const frequencies: Record<SoundEvent, number> = {
      click: 800,
      neon_click: 1200,
      dice_roll: 400,
      dice_land: 600,
      win: 1000,
      lose: 300,
      notification: 900,
      coin: 1500,
      gift_sent: 1500,
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
   * Fallback: Web Speech API (TTS) for voice narration
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
        he: 'התחרות מתלהטת. תראה להם ממה אתה עשוי.',
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
    utterance.rate = 0.95; // Slightly slower for dramatic effect
    utterance.pitch = 0.8; // Lower pitch for mysterious tone

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Set sound enabled/disabled
   */
  setSoundEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
  }

  /**
   * Set sound volume (0-1)
   */
  setSoundVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => sound.volume(this.state.volume));
  }

  /**
   * Set voice enabled/disabled
   */
  setVoiceEnabled(enabled: boolean): void {
    this.state.voiceEnabled = enabled;
  }

  /**
   * Set voice volume (0-1)
   */
  setVoiceVolume(volume: number): void {
    this.state.voiceVolume = Math.max(0, Math.min(1, volume));
    this.voices.forEach((voice) => voice.volume(this.state.voiceVolume));
  }

  /**
   * Set language
   */
  setLanguage(language: 'en' | 'he'): void {
    this.state.language = language;
  }

  /**
   * Get current state
   */
  getState(): AudioState {
    return { ...this.state };
  }
}

// Singleton instance
export const premiumSoundService = new PremiumSoundService();

// Convenience exports
export const preloadSounds = () => premiumSoundService.preloadSounds();
export const playSound = (event: SoundEvent) => premiumSoundService.playSound(event);
export const playVoice = (event: VoiceEvent, options?: { language?: 'en' | 'he' }) =>
  premiumSoundService.playVoice(event, options);
export const setSoundEnabled = (enabled: boolean) => premiumSoundService.setSoundEnabled(enabled);
export const setSoundVolume = (volume: number) => premiumSoundService.setSoundVolume(volume);
export const setVoiceEnabled = (enabled: boolean) => premiumSoundService.setVoiceEnabled(enabled);
export const setVoiceVolume = (volume: number) => premiumSoundService.setVoiceVolume(volume);
export const setLanguage = (language: 'en' | 'he') => premiumSoundService.setLanguage(language);
