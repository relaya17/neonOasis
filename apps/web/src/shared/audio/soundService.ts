/** Sound events for UI feedback */
export type SoundEvent =
  | 'click'
  | 'neon_click'
  | 'dice_roll'
  | 'dice_land'
  | 'win'
  | 'lose'
  | 'roll'
  | 'move'
  | 'notification'
  | 'coin'
  | 'card_flip'
  | 'chip_stack';

let enabled = true;
let volume = 1;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value));
}

/** Preload sound assets (no-op stub; can wire to Howler/Web Audio later) */
export function preloadSounds(): void {
  // Stub: no preload needed for now
}

/** Play a sound event (no-op stub; can wire to Howler/Web Audio later) */
export function playSound(_event: SoundEvent): void {
  if (!enabled || volume <= 0) return;
  // Stub: no actual audio playback yet
}
