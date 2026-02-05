# 📱 Capacitor Setup Guide — PWA to Native App

**מטרה:** להמיר את האפליקציה מ-PWA ל-Native iOS/Android לפרסום ב-App Store

---

## 🎯 למה Capacitor?

**PWA (Web):**
```
✅ Works in browser
❌ Can't publish to App Store
❌ Limited native features
```

**Capacitor (Native):**
```
✅ Publish to App Store ✅
✅ Publish to Google Play ✅
✅ Full native API access
✅ Better performance
```

---

## 🚀 Step 1: Install Capacitor

```bash
cd apps/web

# Install Capacitor
pnpm add @capacitor/core @capacitor/cli
pnpm add @capacitor/ios @capacitor/android

# Initialize Capacitor
pnpm exec cap init
# → App name: Neon Oasis
# → App ID: com.neonoasis.app (reverse domain)
# → Web dir: dist
```

---

## 📝 Step 2: Configure Capacitor

### **Create `capacitor.config.ts`:**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neonoasis.app',
  appName: 'Neon Oasis',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For development (change to production URL later)
    url: 'http://localhost:5273',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
};

export default config;
```

---

## 🍎 Step 3: iOS Setup

### **Prerequisites:**
- Mac with macOS (required for iOS development)
- Xcode 14+ (free from App Store)
- Apple Developer Account ($99/year)

### **Commands:**
```bash
# Add iOS platform
pnpm exec cap add ios

# Build web assets
pnpm run build

# Copy web assets to iOS
pnpm exec cap copy ios

# Open in Xcode
pnpm exec cap open ios
```

### **In Xcode:**
1. **Set Team:** Select your Apple Developer account
2. **Set Bundle ID:** `com.neonoasis.app`
3. **Set Version:** `1.0.0`
4. **Set Display Name:** `Neon Oasis`
5. **Add Icon:** Use 1024x1024 PNG in `App/Assets.xcassets/AppIcon.appiconset/`
6. **Add Splash Screen:** Edit `LaunchScreen.storyboard`

### **Build & Run:**
```bash
# Run on simulator
pnpm exec cap run ios

# Or in Xcode: Product → Run (⌘R)
```

---

## 🤖 Step 4: Android Setup

### **Prerequisites:**
- Android Studio (free)
- JDK 11+ (included in Android Studio)

### **Commands:**
```bash
# Add Android platform
pnpm exec cap add android

# Build web assets
pnpm run build

# Copy web assets to Android
pnpm exec cap copy android

# Open in Android Studio
pnpm exec cap open android
```

### **In Android Studio:**
1. **Set Package Name:** `com.neonoasis.app`
2. **Set Version Code:** `1`
3. **Set Version Name:** `1.0.0`
4. **Add Icon:** Use `mipmap-` folders in `android/app/src/main/res/`
5. **Add Splash Screen:** Edit `res/drawable/splash.xml`

### **Build & Run:**
```bash
# Run on emulator
pnpm exec cap run android

# Or in Android Studio: Run → Run 'app' (Shift+F10)
```

---

## 🎨 Step 5: Assets (Icons & Splash Screens)

### **Generate Icons Automatically:**
```bash
# Install icon generator
pnpm add -g @capacitor/assets

# Generate from a single 1024x1024 PNG
pnpm exec @capacitor/assets generate --iconBackgroundColor '#000000' --iconBackgroundColorDark '#000000'
```

### **Manual Icon Sizes:**

**iOS:**
- `1024x1024` — App Store
- `180x180` — iPhone 3x
- `120x120` — iPhone 2x
- `167x167` — iPad Pro

**Android:**
- `512x512` — Play Store
- `192x192` — xxxhdpi
- `144x144` — xxhdpi
- `96x96` — xhdpi
- `72x72` — hdpi
- `48x48` — mdpi

---

## 🔧 Step 6: Native Features (Optional)

### **Haptics:**
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function hapticClick() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Not supported on web
  }
}
```

### **Status Bar:**
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Dark mode
await StatusBar.setStyle({ style: Style.Dark });
await StatusBar.setBackgroundColor({ color: '#000000' });
```

### **Push Notifications:**
```bash
pnpm add @capacitor/push-notifications
```

---

## 📦 Step 7: Build for Release

### **iOS (App Store):**
```bash
# 1. Build web assets
pnpm run build

# 2. Copy to iOS
pnpm exec cap copy ios

# 3. Open Xcode
pnpm exec cap open ios

# 4. In Xcode:
# Product → Archive
# → Distribute App → App Store Connect
# → Upload
```

### **Android (Google Play):**
```bash
# 1. Build web assets
pnpm run build

# 2. Copy to Android
pnpm exec cap copy android

# 3. Open Android Studio
pnpm exec cap open android

# 4. In Android Studio:
# Build → Generate Signed Bundle / APK
# → Android App Bundle (AAB)
# → Upload to Google Play Console
```

---

## 🍎 Step 8: App Store Submission

### **Prerequisites:**
- [ ] Apple Developer Account ($99/year)
- [ ] Privacy Policy (public URL)
- [ ] Terms of Service (public URL)
- [ ] App Icon (1024x1024)
- [ ] Screenshots (6.5" iPhone, 12.9" iPad)

### **App Store Connect:**
1. **Create App:** [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Fill Information:**
   - Name: Neon Oasis
   - Subtitle: The Future of Skill Gaming
   - Category: Games → Strategy
   - Age Rating: 17+ (gambling content)
   - Privacy Policy URL
   - Terms URL
3. **Upload Build:** (from Xcode)
4. **Submit for Review**
5. **Wait:** 2-7 days

### **Common Rejection Reasons:**
❌ Real money gambling (use play money only)
❌ Missing age gate (✅ you have AI Guardian)
❌ Poor performance (✅ fixed with optimizations)
❌ Missing privacy policy (add public URL)

---

## 🤖 Step 9: Google Play Submission

### **Prerequisites:**
- [ ] Google Play Developer Account ($25 one-time)
- [ ] Privacy Policy (public URL)
- [ ] Content Rating (ESRB/PEGI)
- [ ] Feature Graphic (1024x500)
- [ ] Screenshots (phone + tablet)

### **Google Play Console:**
1. **Create App:** [play.google.com/console](https://play.google.com/console)
2. **Fill Information:**
   - App Name: Neon Oasis
   - Short Description: Skill-based gaming
   - Full Description: (200-4000 chars)
   - Category: Strategy
   - Content Rating: ESRB Teen
3. **Upload AAB:** (from Android Studio)
4. **Submit for Review**
5. **Wait:** 1-3 days (faster than Apple!)

---

## 🧪 Step 10: TestFlight Beta (iOS)

```bash
# 1. Archive in Xcode
# Product → Archive

# 2. Distribute for Testing
# Distribute App → TestFlight

# 3. Invite Testers
# Add emails in App Store Connect → TestFlight

# 4. Testers install TestFlight app
# They get invite link → Install → Test!
```

**Beta Testing Checklist:**
- [ ] Invite 10-100 testers
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Release new beta build
- [ ] Repeat until stable

---

## 📊 Expected Timeline

| Step | Time | Notes |
|------|------|-------|
| Capacitor Setup | 2 hours | One-time |
| iOS Build | 1 hour | First time |
| Android Build | 1 hour | First time |
| Asset Creation | 4 hours | Icons, screenshots |
| TestFlight Beta | 1 week | Testing + fixes |
| App Store Review | 3-7 days | Apple review |
| Google Play Review | 1-3 days | Faster than Apple |
| **Total** | **2-3 weeks** | From start to live |

---

## 🎯 Optimization Tips

### **Reduce App Size:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three', '@react-three/fiber'],
        },
      },
    },
  },
});
```

### **Optimize Assets:**
```bash
# Compress images
pnpm add -g imagemin-cli
imagemin public/*.png --out-dir=public/optimized

# Compress sounds
pnpm add -g @ffmpeg-installer/ffmpeg
ffmpeg -i sound.mp3 -b:a 128k sound-compressed.mp3
```

---

## ✅ Checklist

- [ ] Capacitor installed
- [ ] iOS platform added
- [ ] Android platform added
- [ ] Icons created (1024x1024)
- [ ] Splash screens added
- [ ] Privacy Policy URL added
- [ ] Terms of Service URL added
- [ ] TestFlight beta tested
- [ ] App Store listing created
- [ ] Google Play listing created
- [ ] Submitted for review
- [ ] 🎉 **LIVE ON APP STORES!**

---

## 🚀 Quick Commands Reference

```bash
# Initial setup
pnpm exec cap init
pnpm exec cap add ios
pnpm exec cap add android

# Development
pnpm run build && pnpm exec cap sync  # Build + Copy to native
pnpm exec cap open ios               # Open Xcode
pnpm exec cap open android           # Open Android Studio

# Run on device
pnpm exec cap run ios                # Run on iOS simulator
pnpm exec cap run android            # Run on Android emulator

# Update native projects
pnpm exec cap sync                   # Copy web assets to native
pnpm exec cap update                 # Update Capacitor plugins

# Clean & rebuild
pnpm exec cap copy ios               # Force copy to iOS
pnpm exec cap copy android           # Force copy to Android
```

---

**Status:** Ready to convert to native app! Follow steps 1-10 and you'll be on the App Store in 2-3 weeks. 🍎📱
