# 📤 מדריך העלאה ל-GitHub

## ⚠️ Git לא מותקן - 2 אפשרויות:

---

## אפשרות 1: התקנת Git (מומלץ)

### צעדים:

1. **הורד Git:**
   - גש ל: https://git-scm.com/download/win
   - הורד והתקן (Next → Next → Finish)

2. **פתח PowerShell חדש** (אחרי ההתקנה)

3. **הגדר Git:**
```bash
git config --global user.name "relaya17"
git config --global user.email "your-email@example.com"
```

4. **Initialize ו-Push:**
```bash
cd C:\Users\User\Desktop\neonOasis-main

# Initialize
git init

# Add all files
git add .

# Commit
git commit -m "feat: complete neon oasis platform - turborepo, games, mobile ready"

# Add remote
git remote add origin https://github.com/relaya17/neonOasis.git

# Push
git push -u origin main --force
```

---

## אפשרות 2: GitHub Desktop (ללא Git בשורת הפקודה)

### צעדים:

1. **הורד GitHub Desktop:**
   - https://desktop.github.com
   - התקן

2. **פתח GitHub Desktop**

3. **Add Existing Repository:**
   - File → Add Local Repository
   - בחר: `C:\Users\User\Desktop\neonOasis-main`
   
4. **Publish:**
   - Repository → Repository Settings
   - Name: neonOasis
   - Owner: relaya17
   - לחץ "Publish Repository"

---

## אפשרות 3: Upload ידני דרך GitHub Web

### צעדים:

1. **גש ל:** https://github.com/relaya17/neonOasis

2. **Upload Files:**
   - Add file → Upload files
   - גרור את כל התיקייה `neonOasis-main`
   - Commit changes

**⚠️ הערה:** זה יעבוד אבל לא אידיאלי לפרויקט גדול.

---

## ✅ אחרי ההעלאה

### וודא שהקבצים הבאים הועלו:

```
✅ turbo.json
✅ vercel.json
✅ render.yaml
✅ apps/web/vercel.json
✅ .env (לא! צריך להישאר מקומי)
✅ .env.example (כן!)
✅ DEPLOYMENT.md
✅ ENV_SETUP.md
```

---

## 🚀 הצעד הבא: Deploy!

אחרי שהקוד ב-GitHub:

1. **Vercel:**
   - https://vercel.com/new
   - Import: relaya17/neonOasis
   - Deploy!

2. **Render:**
   - https://dashboard.render.com/new
   - Select: relaya17/neonOasis
   - Deploy!

---

**בחר אפשרות והתחל! 📤**
