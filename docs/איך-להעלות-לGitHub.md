# איך להעלות את הפרויקט ל-GitHub – צעד אחר צעד

**חשוב:** אחרי Push – ב-GitHub הקובץ `LoginView.tsx` חייב להיות **מלא** (עם `<Box>`, `<Paper>`, `<Typography>` וכו'). אם Netlify עדיין נכשל – עשׂי **Commit + Push שוב** (וודאי ש־`apps/web/src/features/auth/LoginView.tsx` מופיע ב־Changes).

---

בחרי **אחת** מהדרכים. אם אחת לא עובדת, נסי את השנייה.

---

## דרך 1: GitHub Desktop (הכי פשוט – בלחיצות)

זו תוכנה של GitHub. אין צורך להקליד שום דבר או לפתוח טרמינל.

### שלב 1: התקנה
1. גלשי לכתובת: **https://desktop.github.com**
2. לחצי **Download for Windows**.
3. אחרי ההורדה – הרצי את הקובץ והתקיני (Next, Next).
4. אם יבקש – **Sign in to GitHub.com** (התחברי עם המשתמש relaya17).

### שלב 2: חיבור הפרויקט
1. פתחי את **GitHub Desktop**.
2. בתפריט למעלה: **File** → **Add local repository**.
3. בלחצן **Choose...** בחרי את התיקייה:
   ```
   C:\Users\ארלט\Documents\GitHub\neonOasis
   ```
   (אפשר להעתיק את הנתיב מסייר הקבצים: קליק ימני על התיקייה → "Copy address" / "העתקת נתיב".)
4. אם יאמר "This directory does not appear to be a Git repository" – לחצי **create a repository** במקום. אז תבחרי שוב את אותה תיקייה. אם כבר יש Git – פשוט תיפתח.

### שלב 3: העלאה (Push)
1. משמאל יופיעו "Changes" – רשימת הקבצים ששונו.
2. למטה משמאל: בשדה **Summary** כתבי: `fix Netlify build`
3. לחצי על הכפתור הכחול **Commit to main**.
4. אחרי ה-Commit – לחצי למעלה על **Push origin**.
5. אם יבקשו התחברות – התחברי ל-GitHub. אחרי זה אמור להופיע שההעלאה הצליחה.

זהו. הפרויקט מעודכן ב-GitHub ו-Netlify יבנה מחדש.

---

## דרך 2: לחיצה כפולה על קובץ (בלי GitHub Desktop)

1. פתחי **סייר קבצים** (לא Cursor).
2. בחרי בתיקייה:
   ```
   C:\Users\ארלט\Documents\GitHub\neonOasis
   ```
3. **לחיצה כפולה** על הקובץ: **push-to-github.cmd**
4. ייפתח חלון שחור (CMD):
   - אם יופיע **חלון או דפדפן** של GitHub – **התחברי** (אל תסגרי את החלון השחור).
   - חכי עד שיופיע **"Done!"** – אז אפשר לסגור.

אם מופיעה שגיאה:
- **"git is not recognized"** – צריך להתקין Git: https://git-scm.com/download/win
- **"Permission denied"** או **"Authentication failed"** – צריך להתחבר ל-GitHub (חלון/דפדפן שיופיע).

---

## אם עדיין לא עובד

כתבי לי בדיוק:
1. איזו דרך ניסית (1 או 2).
2. מה **בדיוק** מופיע על המסך (או צילום מסך).
3. האם נפתח איזה חלון התחברות של GitHub – והאם התחברת.

אז אוכל לכוון אותך צעד־אחר־צעד לפי מה שאת רואה.
