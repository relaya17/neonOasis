# 🖼️ Images Folder

## מה לשים כאן:

### תמונות כלליות:
- `logo.png` - לוגו האפליקציה
- `background.jpg` - רקע
- `*.png`, `*.jpg`, `*.webp` - כל תמונה

### Avatars (אווטרים):
```
avatars/
├── avatar-1.png
├── avatar-2.png
└── ...
```

### Icons (אייקונים):
```
icons/
├── dice.png
├── cards.png
└── ...
```

---

## 📱 PWA Icons (חובה ל-App Store):

### בתיקייה הראשית (public/):
```
icon-192.png      (192x192 pixels)
icon-512.png      (512x512 pixels)  
apple-touch-icon.png (180x180 pixels)
```

**איך ליצור:**
1. קח את `favicon.svg`
2. המר ל-PNG בגדלים הנדרשים
3. שמור בשמות הנכונים

---

## ✅ **לאחר הוספת קבצים:**

```bash
# הרץ:
upload-assets.cmd

# או ידנית:
git add apps/web/public/
git commit -m "feat: add images"
git push
```

Netlify יעדכן אוטומטית!
