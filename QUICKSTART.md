# 🎮 Neon Oasis - Quick Start Guide

## ⚡ הפעלה מהירה (Quick Start)

### 1. התקנה (Installation)
```bash
# If not already installed
npm install -g pnpm

# Install dependencies
pnpm install
```

### 2. הפעלת השרתים (Start Development)
```bash
# Terminal 1: Start API + Web
pnpm run dev

# OR start separately:
# Terminal 1: API only
pnpm -C apps/api run dev

# Terminal 2: Web only  
pnpm -C apps/web run dev
```

### 3. פתיחת האפליקציה (Open App)
```
Web: http://localhost:5273
API: http://localhost:4000
```

---

## ✅ מצב הפרויקט (Project Status)

### כל הבדיקות עוברות! (All Checks Pass!)
```bash
✅ TypeScript: No errors
✅ Build: Successful
✅ Audio System: Integrated
```

### בדיקות (Verify)
```bash
# Check types
pnpm run typecheck

# Build everything
pnpm run build
```

---

## 🎵 מערכת אודיו (Audio System)

### מה זה כולל? (What's Included?)
- ✅ צלילי משחק (Game sounds)
- ✅ קריינות קולית (Voice narration) 
- ✅ הגדרות אודיו (Audio settings)
- ✅ חזרה אוטומטית ל-TTS (Auto TTS fallback)

### איפה ההגדרות? (Where are Settings?)
- כפתור ההגדרות בפינה הימנית העליונה (Settings button top-right)
- ניתן לשלוט בווליום ולהפעיל/לכבות (Control volume & toggle on/off)

### קבצי סאונד (Sound Files)
- **מיקום:** `apps/web/public/sounds/`
- **מצב נוכחי:** TTS fallback פעיל (TTS active for missing files)
- **ליצירת קבצים:** פתח את `scripts/generate-sounds.html` בדפדפן

---

## 🔧 פקודות שימושיות (Useful Commands)

```bash
# Development
pnpm run dev              # Start all services
pnpm run build            # Build all packages
pnpm run typecheck        # Check TypeScript

# Individual packages
pnpm -C apps/api run dev      # API only
pnpm -C apps/web run dev      # Web only
pnpm -C packages/shared run build  # Shared package

# Testing
pnpm run lighthouse       # Performance test (after build)
```

---

## 📦 מבנה הפרויקט (Project Structure)

```
neonOasis-main/
├── apps/
│   ├── api/          # Backend server (Fastify + Socket.io)
│   └── web/          # Frontend app (React + Three.js)
├── packages/
│   └── shared/       # Shared types & utils
├── scripts/          # Utility scripts
│   └── generate-sounds.html  # Sound generator
└── docs/            # Documentation
    ├── AUDIO_SPEC.md
    ├── IMPLEMENTATION_STATUS.md
    └── ...
```

---

## 🎮 תכונות מרכזיות (Key Features)

### משחקים (Games)
- ✅ שש-בש 3D (3D Backgammon)
- ✅ פיזיקת קוביות (Dice physics)
- ✅ אנימציות ניאון (Neon animations)

### אודיו (Audio)
- ✅ צלילי משחק (Game sounds)
- ✅ קריינות AI (AI narration)
- ✅ הגדרות מתקדמות (Advanced settings)
- ✅ TTS fallback אוטומטי

### משתמש (User Features)
- ✅ ארנק דיגיטלי (Digital wallet)
- ✅ דירוגי ELO (ELO ratings)
- ✅ טורנירים (Tournaments)
- ✅ משחקים הוכחתיים (Provably fair)

---

## 🐛 בעיות נפוצות (Common Issues)

### 1. "API לא זמין" (API Not Available)
```bash
# Make sure API is running
pnpm -C apps/api run dev
```

### 2. שגיאות TypeScript (TypeScript Errors)
```bash
# Should be zero - if not, run:
pnpm run typecheck
```

### 3. בעיות סאונד (Sound Issues)
- פתח את הגדרות האודיו (כפתור למעלה מימין)
- ודא שהסאונד מופעל
- TTS יעבוד גם ללא קבצי MP3

### 4. פורט תפוס (Port Busy)
```bash
# Find process on port 4000
netstat -ano | findstr :4000

# Kill it (Windows)
taskkill /PID <PID> /F
```

---

## 📖 תיעוד נוסף (Additional Docs)

- `docs/IMPLEMENTATION_STATUS.md` - מצב מפורט של הפרויקט
- `docs/AUDIO_SPEC.md` - מפרט מערכת האודיו
- `docs/AUDIO_SYSTEM_COMPLETE.md` - סיכום מערכת האודיו
- `docs/AUDIO_INTEGRATION_EXAMPLES.md` - דוגמאות קוד

---

## 🚀 מוכן לפיתוח! (Ready to Develop!)

הכל מוגדר ועובד. פשוט הרץ:
```bash
pnpm run dev
```

ופתח את `http://localhost:5273` בדפדפן.

**בהצלחה! 🎮🎵✨**

---

*Last Updated: February 5, 2026*
