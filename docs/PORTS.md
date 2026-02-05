# פורטים (Ports)

| שירות | פורט | קובץ/משתנה |
|--------|------|-------------|
| **Web (Vite)** | **5273** | `apps/web/vite.config.ts` → `server.port` |
| **API** | **4000** | `apps/api/src/index.ts` → `process.env.PORT` או `.env` → `PORT=4000` |

## בדיקה שפורטים פנויים (Windows)

```powershell
# בדיקה אם פורט 5273 תפוס
netstat -ano | findstr :5273

# בדיקה אם פורט 4000 תפוס
netstat -ano | findstr :4000
```

אם הפורט תפוס — Vite ינסה פורט הבא אוטומטית (`strictPort: false`).  
לשינוי פורט ה-API: הגדר `PORT=4001` (או אחר) ב־`.env`.

## CORS / Web URL

ה-API מאפשר בקשות מ־`CORS_ORIGIN` (ברירת מחדל: `http://localhost:5273`).  
ב־`.env`: `CORS_ORIGIN=http://localhost:5273`.
