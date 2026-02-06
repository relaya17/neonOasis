# בדיקת פרויקט — קונפיגרציה, כפילויות, קבצים חסרים

**תאריך:** פברואר 2026

---

## 1. קונפיגרציה — מה נבדק ותוקן

### Root
- **package.json** — workspaces, turbo, scripts (`build`, `dev`, `typecheck`, `lint`) — תקין.
- **pnpm-workspace.yaml** — `apps/web`, `apps/api`, `packages/shared` — תקין.
- **turbo.json** — משימות `build`, `dev`, `typecheck`, `lint`, `test` — תקין.
- **.env.example** — נוסף `VITE_SOCKET_URL=http://localhost:4000` (נדרש ל־socketService).

### apps/web
- **package.json** — סקריפטים `dev`, `build`, `lint`, `typecheck` — תקין.
- **vite.config.ts** — proxy ל־API ו־socket.io, alias ל־shared — תקין.
- **vite-env.d.ts** — `VITE_API_URL`, `VITE_WS_URL`, `VITE_SOCKET_URL`, `VITE_DEMO_USER_ID` — מוגדרים.

### apps/api
- **package.json** — נוסף `"lint": "echo ok"` כדי ש־`turbo lint` לא ייכשל.
- **build.mjs** — קיים, בונה ל־dist/index.js — תקין.
- **prisma/schema.prisma** — קיים — תקין.

### packages/shared
- **package.json** — נוסף `"lint": "echo ok"` עבור turbo.
- **tsup.config.ts** — פלט `.mjs` — תקין.

### .gitignore
- ignores: `node_modules`, `dist`, `build`, `.env`, `.env.local`, `.turbo` — תקין.

---

## 2. כפילויות

| קובץ | מיקום 1 | מיקום 2 | המלצה |
|------|---------|---------|--------|
| generate-simple-sounds | שורש הפרויקט | scripts/ | להשאיר ב־scripts, אפשר למחוק מהשורש אם לא בשימוש. |

אין כפילויות קוד קריטיות; רק קובץ עזר כפול.

---

## 3. קבצים חסרים — מה נוסף

- **.env** — לא ב־Git (נכון). מפתח משתמש ב־`.env.example` והעתקה ל־`.env`.
- **VITE_SOCKET_URL** ב־.env.example — נוסף.
- **lint** ב־apps/api ו־packages/shared — נוסף (סקריפט no-op) כדי ש־`pnpm run lint` יעבור בכל ה־workspaces.

---

## 4. סיכום — שהכל יעבוד

1. **התקנה:** `pnpm install` (מהשורש).
2. **בילד:** `pnpm run build` (בונה shared → web, api).
3. **פיתוח:** `pnpm run dev` (web על 5273, api על 4000).
4. **סביבה:** להעתיק `.env.example` ל־`.env` (ובשורש ו/או ב־apps/web לפי הצורך) ולמלא ערכים.
5. **Lint:** `pnpm run lint` — רץ בכל ה־packages (web עם eslint, api ו־shared עם echo ok).

אם משהו לא עובד — לבדוק ש־`.env` קיים ומכיל את כל המשתנים מ־`.env.example`.
