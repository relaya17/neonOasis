# Scripts Directory

**תיקייה זו מכילה סקריפטים עזר לפרויקט**

---

## 🚀 Development Scripts

### הפעלה מהירה
- `run-dev.ps1` / `run-dev.cmd` — הפעלה מלאה (install + build + dev)
- `run-web-only.cmd` — הפעלת Web בלבד (ללא API)

**שימוש:**
```powershell
.\run-dev.ps1        # PowerShell
.\run-dev.cmd        # Windows CMD
.\run-web-only.cmd   # Web בלבד
```

**אלטרנטיבה:** השתמש ב-`pnpm run dev` ישירות

---

## 📦 Installation Scripts

- `install-everything.ps1` — התקנת כל התלויות (כולל Redis, 2FA, Howler.js)
- `setup-production.ps1` — הגדרה מלאה ל-production (env, install, build, DB)

**שימוש:**
```powershell
.\install-everything.ps1    # התקנה בלבד
.\setup-production.ps1       # הגדרה מלאה
```

**אלטרנטיבה:** השתמש ב-`pnpm install` ישירות

---

## 🧪 Load Testing Scripts

קבצי תצורה ל-Artillery לבדיקת ביצועים תחת עומס:

- `load-test.yml` — בדיקת API endpoints
- `load-test-websocket.yml` — בדיקת WebSocket connections

**שימוש:**
```bash
pnpm run test:load        # API load test
pnpm run test:load:ws     # WebSocket load test
```

**מתי להשתמש:**
- לפני Deploy ל-production
- אחרי שינויים גדולים ב-backend
- כדי למצוא bottlenecks

**ראה:** [docs/LOAD_TESTING_GUIDE.md](../docs/LOAD_TESTING_GUIDE.md)

---

## 🔧 Utility Scripts

- `push-to-github.ps1` — סקריפט PowerShell להעלאה אוטומטית ל-GitHub
- `verify-build.ps1` — בדיקת build ושמירת output ל-`build-output.txt`

**שימוש:**
```powershell
.\push-to-github.ps1    # Push ל-GitHub
.\verify-build.ps1      # בדיקת build
```

**אלטרנטיבה:** השתמש ב-git commands ידנית

---

## 📝 הערות

- **PowerShell scripts** (`.ps1`) — עבור Windows PowerShell
- **CMD scripts** (`.cmd`) — עבור Windows Command Prompt
- **YAML files** (`.yml`) — תצורות ל-Artillery

**אם אתה לא משתמש בסקריפטים האלה**, אפשר למחוק אותם — הכל אפשר לעשות גם עם `pnpm` commands ישירות.

---

**ראה גם:** [QUICK_START.md](../QUICK_START.md) — מדריך התחלה מהירה
