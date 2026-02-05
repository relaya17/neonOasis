# 🎵 Audio Integration Examples

## דוגמאות מעשיות לשילוב מערכת האודיו המתקדמת

---

## 1. Backgammon Board with 3D Spatial Audio

```typescript
// apps/web/src/features/backgammon/Board3D.tsx
import { useEffect, useRef } from 'react';
import { use3DAudioListener, useSoundEffect } from '@/shared/audio/useAdvancedAudio';
import { useThree } from '@react-three/fiber';

export function Board3D() {
  const { camera } = useThree();
  const playSound = useSoundEffect();
  
  // Sync listener with camera position
  use3DAudioListener({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  });

  const handleDiceRoll = (dicePosition: Vector3) => {
    // Play dice roll with 3D position
    playSound('dice_roll', {
      x: dicePosition.x,
      y: dicePosition.y,
      z: dicePosition.z,
    });

    // After animation completes, play landing sound
    setTimeout(() => {
      playSound('dice_land', {
        x: dicePosition.x,
        y: dicePosition.y,
        z: dicePosition.z,
      });
    }, 1000);
  };

  const handleCheckerMove = (checkerPosition: Vector3) => {
    // Play checker movement sound at checker position
    playSound('chip_stack', {
      x: checkerPosition.x,
      y: checkerPosition.y,
      z: checkerPosition.z,
    });
  };

  return (
    <group>
      <Dice onRoll={handleDiceRoll} />
      <Checker onMove={handleCheckerMove} />
    </group>
  );
}
```

---

## 2. Game with Adaptive Music

```typescript
// apps/web/src/features/game/GameBoard.tsx
import { useAdaptiveMusic, useBackgroundMusic, useVoiceNarration } from '@/shared/audio/useAdvancedAudio';

export function GameBoard() {
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [currentStake, setCurrentStake] = useState(10);
  const playVoice = useVoiceNarration();

  // Enable background music
  useBackgroundMusic(true);

  // Adaptive music responds to game state
  useAdaptiveMusic({
    timeRemaining,
    isHighStakes: currentStake > 100,
    playerCount: 2,
  });

  // Play welcome message when game starts
  useEffect(() => {
    playVoice('welcome', 'en');
  }, []);

  // Warn player when time is running out
  useEffect(() => {
    if (timeRemaining === 10) {
      playVoice('stake', 'en');
    }
  }, [timeRemaining]);

  const handleWin = () => {
    if (currentStake > 100) {
      playVoice('big_win', 'he');
    } else {
      playVoice('win', 'en');
    }
  };

  return (
    <div>
      <Timer time={timeRemaining} />
      <StakeDisplay amount={currentStake} />
    </div>
  );
}
```

---

## 3. Settings Panel with Audio Controls

```typescript
// apps/web/src/features/profile/AudioSettings.tsx
import { useAudioSettings } from '@/shared/audio/useAdvancedAudio';
import { Slider, Switch } from '@mui/material';

export function AudioSettings() {
  const {
    setSoundVolume,
    setVoiceVolume,
    setMusicVolume,
    setLanguage,
    setSpatialAudio,
    setDucking,
  } = useAudioSettings();

  return (
    <div>
      <h2>Audio Settings</h2>

      {/* Sound Effects Volume */}
      <div>
        <label>Sound Effects</label>
        <Slider
          min={0}
          max={100}
          defaultValue={70}
          onChange={(e, value) => setSoundVolume((value as number) / 100)}
        />
      </div>

      {/* Voice Narration Volume */}
      <div>
        <label>Voice Narration</label>
        <Slider
          min={0}
          max={100}
          defaultValue={80}
          onChange={(e, value) => setVoiceVolume((value as number) / 100)}
        />
      </div>

      {/* Background Music Volume */}
      <div>
        <label>Background Music</label>
        <Slider
          min={0}
          max={100}
          defaultValue={40}
          onChange={(e, value) => setMusicVolume((value as number) / 100)}
        />
      </div>

      {/* Language Selection */}
      <div>
        <label>Voice Language</label>
        <select onChange={(e) => setLanguage(e.target.value as 'en' | 'he')}>
          <option value="en">English</option>
          <option value="he">עברית</option>
        </select>
      </div>

      {/* 3D Spatial Audio */}
      <div>
        <label>3D Spatial Audio</label>
        <Switch defaultChecked onChange={(e) => setSpatialAudio(e.target.checked)} />
      </div>

      {/* Audio Ducking */}
      <div>
        <label>Audio Ducking</label>
        <Switch defaultChecked onChange={(e) => setDucking(e.target.checked)} />
      </div>
    </div>
  );
}
```

---

## 4. UI Interactions with Sound Feedback

```typescript
// apps/web/src/shared/components/NeonButton.tsx
import { useSoundEffect } from '@/shared/audio/useAdvancedAudio';
import { Button } from '@mui/material';

export function NeonButton({ onClick, children, ...props }) {
  const playSound = useSoundEffect();

  const handleClick = (e) => {
    // Play click sound
    playSound('neon_click');
    
    // Call original onClick
    if (onClick) onClick(e);
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}
```

---

## 5. Complete App Integration

```typescript
// apps/web/src/app/App.tsx
import { useEffect } from 'react';
import { useAudioInit } from '@/shared/audio/useAdvancedAudio';

export function App() {
  // Initialize audio system on app load
  useAudioInit();

  return (
    <Router>
      <Routes>
        {/* Your routes */}
      </Routes>
    </Router>
  );
}
```

---

## 🎯 Key Features Demonstrated

### ✅ 3D Spatial Audio
- קוביות שנופלות בצד ימין נשמעות באוזן ימנית
- הצליל מתחלש ככל שהמרחק גדל

### ✅ Audio Ducking
- מוזיקת רקע מורידה עוצמה אוטומטית בזמן:
  - זכיות גדולות
  - קריינות קולית
  - אירועים חשובים

### ✅ Adaptive Music
- BPM עולה כשנשארו 10 שניות
- שכבת מתח מתווספת בהימורים גבוהים
- המוזיקה מגיבה למצב המשחק בזמן אמת

### ✅ Voice Narration
- תמיכה בעברית ואנגלית
- 8 סוגי הודעות שונות
- TTS fallback אוטומטי

---

## 📋 Checklist for Implementation

- [ ] הוסף קבצי MP3 ל-`apps/web/public/sounds/`
- [ ] החלף `premiumSoundService` ב-`advancedSoundService`
- [ ] שלב `useAudioInit()` ב-`App.tsx`
- [ ] הוסף 3D audio ל-`Board3D.tsx`
- [ ] הוסף adaptive music ל-`GameBoard.tsx`
- [ ] צור פאנל הגדרות אודיו
- [ ] בדוק על מכשירים שונים

---

**Version:** 2.0 | **Date:** February 2026
