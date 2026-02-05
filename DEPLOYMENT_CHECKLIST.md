# ✅ Deployment Checklist - Neon Oasis

## 🎯 מה עשינו:

### ✅ 1. GitHub
- [x] Repository: https://github.com/relaya17/neonOasis
- [x] כל הקבצים הועלו (350+ files)
- [x] Turborepo configured
- [x] Deployment configs ready

---

## 🚀 הצעדים הבאים:

### 📱 2. Deploy Frontend ל-Vercel

#### A. חבר ל-Vercel:
1. גש ל: **https://vercel.com/new**
2. **Import Git Repository**
3. בחר: **relaya17/neonOasis**
4. לחץ **Import**

#### B. הגדרות פרויקט:
```
Project Name: neon-oasis
Framework Preset: Vite
Root Directory: apps/web
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```

#### C. Environment Variables:
לחץ **Environment Variables** והוסף:

```
VITE_API_URL=https://neon-oasis-api.onrender.com
VITE_WS_URL=wss://neon-oasis-api.onrender.com  
VITE_SOCKET_URL=https://neon-oasis-api.onrender.com
```

**⚠️ חשוב:** אלו ה-URLs יתעדכנו אחרי שתעלה ל-Render!

#### D. Deploy:
לחץ **Deploy** וחכי ~2 דקות.

---

### 🔧 3. Deploy Backend ל-Render

#### A. צור שירות חדש:
1. גש ל: **https://dashboard.render.com**
2. **New +** → **Web Service**
3. **Connect GitHub:** relaya17/neonOasis
4. לחץ **Connect**

#### B. הגדרות שירות:
```
Name: neon-oasis-api
Region: Frankfurt (EU)
Branch: main
Runtime: Node
Root Directory: (leave empty)
Build Command: pnpm install && pnpm run build
Start Command: cd apps/api && node dist/index.js
Instance Type: Starter ($7/month)
```

#### C. Environment Variables:
```
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

**⚠️ יתעדכן אחרי Vercel!**

#### D. הוסף Database:
1. באותו דף, גלול ל-**Databases**
2. **Create Database** → **PostgreSQL**
3. הגדרות:
```
Name: neon-oasis-db
Plan: Starter (Free)
```
4. העתק את ה-**Internal Database URL**
5. הוסף ל-Environment של API:
```
DATABASE_URL=<paste-here>
```

#### E. Create & Deploy:
לחץ **Create Web Service** וחכי ~3-5 דקות.

---

## 🔄 4. עדכן URLs הדדיים

### A. אחרי Render Deploy:
קיבלת URL כמו: `https://neon-oasis-api.onrender.com`

**חזור ל-Vercel** ועדכן:
```
VITE_API_URL=https://neon-oasis-api.onrender.com
VITE_WS_URL=wss://neon-oasis-api.onrender.com
VITE_SOCKET_URL=https://neon-oasis-api.onrender.com
```

לחץ **Redeploy** ב-Vercel.

### B. אחרי Vercel Deploy:
קיבלת URL כמו: `https://neon-oasis.vercel.app`

**חזור ל-Render** ועדכן:
```
CORS_ORIGIN=https://neon-oasis.vercel.app
```

---

## 🗄️ 5. הרץ Database Schema

### חבר ל-Render PostgreSQL:
```bash
# Get connection string from Render Dashboard
psql <RENDER_DATABASE_URL>

# Run schema
\i apps/api/src/db/schema.sql
```

**או** העתק את התוכן של `schema.sql` והדבק ב-Render SQL Editor.

---

## ✅ 6. בדיקה סופית

### בדוק שהכל עובד:

1. **API Health:**
   ```
   https://neon-oasis-api.onrender.com/api/health
   ```
   צריך להחזיר: `{"ok":true}`

2. **Web App:**
   ```
   https://neon-oasis.vercel.app
   ```
   צריך לטעון את דף הכניסה

3. **משחקים:**
   - לחץ "כניסה כאורח"
   - בחר משחק (שש-בש/טאצ)
   - וודא שהכל עובד!

---

## 📊 סטטוס Deployment:

```
✅ GitHub: LIVE
□ Vercel: Pending
□ Render API: Pending
□ Render DB: Pending
□ URLs Updated: Pending
□ Schema Run: Pending
□ Testing: Pending
```

---

## 💰 עלויות:

```
Vercel: Free (Hobby Plan)
Render API: $7/month (Starter)
Render PostgreSQL: Free
Total: $7/month
```

---

## 🎯 צעדים מהירים:

1. ✅ **GitHub** - בוצע!
2. ⏭️ **Vercel** - לך ל-vercel.com/new
3. ⏭️ **Render** - לך ל-dashboard.render.com
4. ⏭️ **עדכן URLs** - שני הכיוונים
5. ⏭️ **הרץ Schema** - על Render DB
6. ⏭️ **בדוק** - שהכל עובד!

---

**הפרויקט ב-GitHub! צעד ראשון הושלם! 🎉**

**Next: Deploy to Vercel & Render**

https://github.com/relaya17/neonOasis ✅
