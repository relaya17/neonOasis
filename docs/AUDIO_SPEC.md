# Sound Architecture — מפרט טכני למתכנת

**מטרה:** צליל מסונכרן לאנימציה (Latency <20ms), חומרים "יקרים", חוויית סרט יוקרתי.

---

## ✅ מה כבר מיושם

- ✅ שירות אודיו מרכזי (`premiumSoundService.ts`) עם Howler.js
- ✅ Sound Effects: `click`, `neon_click`, `dice_roll`, `dice_land`, `win`, `lose`, `notification`, `coin`, `card_flip`, `chip_stack`
- ✅ Voice Narration: `welcome`, `stake`, `win`, `big_win`, `loss`, `reward`, `guardian`, `yalla` (עברית/אנגלית)
- ✅ TTS Fallback (Web Speech API) עד להוספת קבצי MP3
- ✅ Preload, Volume Control, Language Support

---

## 🎯 מה צריך ליישום עתידי

### 1. 3D Spatial Audio
**דרישה:** קוביות נפלו בצד ימין של הלוח → המשתמש שומע יותר באוזן ימנית.

**יישום:**
```typescript
// ב-premiumSoundService.ts
import { Howl } from 'howler';

playSound3D(event: SoundEvent, position: { x: number; y: number; z: number }): void {
  const sound = this.sounds.get(event);
  if (sound) {
    // Web Audio API PannerNode
    const panner = Howl.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;
    sound.play();
  }
}
```

**שימוש:**
```typescript
// ב-Board3D.tsx כשקוביה נופלת
const dicePosition = diceRef.current.position;
playSound3D('dice_land', { x: dicePosition.x, y: 0, z: dicePosition.z });
```

---

### 2. Audio Ducking
**דרישה:** בזמן זכייה, מוזיקת הרקע מורידה עוצמה אוטומטית.

**יישום:**
```typescript
// ב-premiumSoundService.ts
private backgroundMusic: Howl | null = null;
private duckingEnabled = true;

playSound(event: SoundEvent): void {
  // Duck background music during important sounds
  if (this.duckingEnabled && ['win', 'big_win', 'jackpot_explosion'].includes(event)) {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume(this.state.volume * 0.3); // Reduce to 30%
      setTimeout(() => {
        if (this.backgroundMusic) {
          this.backgroundMusic.volume(this.state.volume);
        }
      }, 2000); // Restore after 2 seconds
    }
  }
  // ... rest of playSound logic
}
```

---

### 3. Adaptive Music (Vaporwave Radio)
**דרישה:** המוזיקה משתנה לפי קצב המשחק. נשארו 10 שניות לתור → BPM עולה, בס דופק יותר.

**יישום:**
```typescript
// ב-premiumSoundService.ts
private adaptiveMusic: {
  base: Howl;
  tension: Howl;
} | null = null;

setGameState(state: { timeRemaining: number; isHighStakes: boolean }): void {
  if (!this.adaptiveMusic) return;
  
  // Increase tension when time is running out
  if (state.timeRemaining < 10) {
    this.adaptiveMusic.base.rate(1.1); // Speed up 10%
    this.adaptiveMusic.tension.volume(this.state.volume * 0.5); // Add tension layer
  } else {
    this.adaptiveMusic.base.rate(1.0);
    this.adaptiveMusic.tension.volume(0);
  }
}
```

**שימוש:**
```typescript
// ב-BoardContainer.tsx או GameBoard.tsx
useEffect(() => {
  const interval = setInterval(() => {
    const timeRemaining = calculateTimeRemaining();
    premiumSoundService.setGameState({ 
      timeRemaining, 
      isHighStakes: stake > 100 
    });
  }, 1000);
  return () => clearInterval(interval);
}, [stake]);
```

---

## 📋 רשימת קבצי אודיו נדרשים

**מיקום:** `apps/web/public/sounds/`

### Sound Effects:
- `click.mp3`, `neon_click.mp3`, `dice_roll.mp3`, `dice_land.mp3`
- `win.mp3`, `lose.mp3`, `notification.mp3`, `coin.mp3`
- `card_flip.mp3`, `chip_stack.mp3`

### Voice Narration (English + Hebrew):
- `voice_welcome_en.mp3`, `voice_welcome_he.mp3`
- `voice_stake_en.mp3`, `voice_stake_he.mp3`
- `voice_win_en.mp3`, `voice_win_he.mp3`
- `voice_big_win_en.mp3`, `voice_big_win_he.mp3`
- `voice_loss_en.mp3`, `voice_loss_he.mp3`
- `voice_reward_en.mp3`, `voice_reward_he.mp3`
- `voice_guardian_en.mp3`, `voice_guardian_he.mp3`
- `voice_yalla_en.mp3`, `voice_yalla_he.mp3`

**הערה:** עד להוספת הקבצים, המערכת משתמשת ב-TTS fallback.

---

## 🔧 אינטגרציה בקוד

**שימוש בסיסי:**
```typescript
import { playSound, playVoice, preloadSounds } from '@/shared/audio/premiumSoundService';

// Preload בעת טעינת האפליקציה
useEffect(() => {
  preloadSounds();
}, []);

// השמעת צליל
playSound('dice_land');
playVoice('big_win', { language: 'he' });
```

**סנכרון לאנימציה:**
```typescript
// ב-Board3D.tsx - כשקוביה נוחתת
useEffect(() => {
  if (diceLanded) {
    playSound('dice_land'); // קריאה מיידית, לא setTimeout
  }
}, [diceLanded]);
```

---

**גרסה:** 2.0 | **תאריך:** פברואר 2026
