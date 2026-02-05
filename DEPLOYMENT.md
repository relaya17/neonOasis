# 🚀 מדריך פריסה - Vercel & Render

## 📋 סיכום מהיר

- **Frontend (Web):** Vercel
- **Backend (API):** Render
- **Database:** Render PostgreSQL
- **Redis:** Render Redis
- **GitHub:** https://github.com/relaya17/neonOasis

---

## 1️⃣ הכנה - Push ל-GitHub

### צעדים:

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "feat: complete neon oasis platform with turborepo"

# Add remote (if not already added)
git remote add origin https://github.com/relaya17/neonOasis.git

# Push to GitHub
git push -u origin main
```

### אם יש בעיות:
```bash
# Force push (if needed)
git push -u origin main --force

# או sync with existing
git pull origin main --rebase
git push -u origin main
```

---

## 2️⃣ פריסת API ל-Render

### A. יצירת שירות חדש

1. **גש ל-Render:** https://render.com
2. **New → Web Service**
3. **Connect GitHub repo:** relaya17/neonOasis
4. **הגדרות:**

```
Name: neon-oasis-api
Region: Frankfurt (EU)
Branch: main
Runtime: Node
Build Command: pnpm install && pnpm run build
Start Command: cd apps/api && node dist/index.js
Plan: Starter ($7/month)
```

### B. משתני סביבה (Environment Variables)

לחץ "Environment" והוסף:

```bash
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://your-app.vercel.app

# Database (ייווצר אוטומטית אם תוסיף PostgreSQL)
DATABASE_URL=<will-be-set-by-render>

# Redis (אופציונלי - או השתמש ב-Render Redis)
# REDIS_URL=<from-render-redis>
```

### C. הוספת PostgreSQL

1. בעמוד השירות, לחץ **"New +"**
2. **PostgreSQL**
3. **הגדרות:**
```
Name: neon-oasis-db
Plan: Starter (Free)
Region: Frankfurt
Database Name: neonoasis
```

4. העתק את ה-`Internal Database URL`
5. הוסף כ-`DATABASE_URL` ב-Environment Variables של ה-API

### D. הרצת Schema

```bash
# Connect to Render database
psql <RENDER_DATABASE_URL>

# Run schema
\i apps/api/src/db/schema.sql

# Or from file:
psql <RENDER_DATABASE_URL> -f apps/api/src/db/schema.sql
```

### E. הוספת Redis (אופציונלי)

1. **New + → Redis**
2. **הגדרות:**
```
Name: neon-oasis-redis
Plan: Starter (Free)
Region: Frankfurt
```

3. העתק `Internal Redis URL`
4. הוסף כ-`REDIS_URL`

---

## 3️⃣ פריסת Web ל-Vercel

### A. יבוא פרויקט

1. **גש ל-Vercel:** https://vercel.com
2. **New Project**
3. **Import Git Repository:** relaya17/neonOasis
4. **הגדרות:**

```
Framework Preset: Vite
Root Directory: apps/web
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
Node Version: 20.x
```

### B. משתני סביבה

בעמוד ההגדרות, לחץ **Environment Variables:**

```bash
VITE_API_URL=https://neon-oasis-api.onrender.com
VITE_WS_URL=wss://neon-oasis-api.onrender.com
VITE_SOCKET_URL=https://neon-oasis-api.onrender.com
```

**⚠️ חשוב:** החלף את ה-URL ב-URL האמיתי של ה-API שלך מ-Render!

### C. Deploy!

לחץ **Deploy** וVercel יבנה את האפליקציה.

---

## 4️⃣ עדכון CORS ב-API

אחרי שVercel נותן לך URL (למשל: `https://neon-oasis.vercel.app`):

### ב-Render, עדכן:
```
CORS_ORIGIN=https://neon-oasis.vercel.app
```

---

## 5️⃣ בדיקה

### בדוק ש:
1. ✅ Web App נטען: `https://your-app.vercel.app`
2. ✅ API עובד: `https://your-api.onrender.com/api/health`
3. ✅ Socket.io מתחבר (בקונסול לא אמור להיות שגיאה)
4. ✅ משחקים עובדים

---

## 📝 Troubleshooting

### Web App לא נטען:
- בדוק Build Logs ב-Vercel
- ודא ש-`VITE_API_URL` מוגדר נכון

### API לא עובד:
- בדוק Logs ב-Render
- ודא ש-`DATABASE_URL` מוגדר
- בדוק ש-Port 4000 לא hard-coded (השתמש ב-`process.env.PORT`)

### Socket.io לא מתחבר:
- ודא ש-`CORS_ORIGIN` כולל את ה-Vercel URL
- בדוק שה-WebSocket נתמך (Render תומך)

### Database Errors:
- הרץ את schema.sql על ה-Render DB
- בדוק connection string

---

## 🔄 עדכונים עתידיים

### לכל שינוי בקוד:

```bash
# Commit changes
git add .
git commit -m "feat: your update"
git push origin main
```

**Vercel:** ידפלוי אוטומטית! ⚡  
**Render:** ידפלוי אוטומטית! ⚡

---

## 💰 עלויות משוערות

### Render:
- Web Service: $7/month (Starter)
- PostgreSQL: Free (Starter) או $7/month
- Redis: Free (Starter) או $10/month
- **סה"כ:** $7-24/month

### Vercel:
- Hobby: Free (עד 100GB bandwidth)
- Pro: $20/month (אם צריך יותר)

### סה"כ משוער:
- **מינימום:** $7/month (Render API + Vercel Free)
- **מומלץ:** $27-44/month (כל השירותים)

---

## ✅ Checklist

### לפני Deploy:
- [x] Code pushed to GitHub
- [x] turbo.json configured
- [x] vercel.json created
- [x] render.yaml created
- [x] .env.example updated
- [ ] Icons/splash screens (אופציונלי)

### אחרי Deploy:
- [ ] Test all features in production
- [ ] Configure custom domain (אופציונלי)
- [ ] Set up monitoring (Vercel Analytics, Render metrics)
- [ ] Enable HTTPS (אוטומטי ב-Vercel ו-Render)

---

**מוכן לפריסה! 🚀**

*Next: Push to GitHub ואז Deploy*
