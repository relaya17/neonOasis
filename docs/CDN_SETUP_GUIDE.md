# 🌐 CDN Setup Guide — Cloudflare

**מטרה:** להפחית latency ב-80% על ידי caching של assets ב-edge locations ברחבי העולם

---

## 🎯 למה צריך CDN?

**בלי CDN:**
```
User (Israel) → Server (US) → 200ms latency ❌
```

**עם CDN:**
```
User (Israel) → Cloudflare (Tel Aviv) → 15ms latency ✅
```

**Assets שצריכים CDN:**
- 3D Models (`.glb`, `.gltf`)
- Textures (`.jpg`, `.png`)
- Sounds (`.mp3`, `.ogg`)
- Fonts (`.woff2`)
- Images (`.svg`, `.webp`)

---

## 📦 Setup עם Cloudflare (Free Plan)

### **Step 1: הרשמה ל-Cloudflare**
1. עבור ל-[cloudflare.com](https://cloudflare.com)
2. הירשם (חינם)
3. הוסף את הדומיין שלך (למשל: `neonoasis.com`)
4. שנה את ה-Nameservers כפי שמבקש Cloudflare

### **Step 2: הגדר Caching Rules**

```javascript
// Cloudflare Workers (Optional)
// File: workers/cdn-cache.js

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Cache static assets for 1 year
  const staticAssets = ['.glb', '.gltf', '.mp3', '.ogg', '.jpg', '.png', '.webp', '.woff2', '.svg']
  const isStatic = staticAssets.some(ext => url.pathname.endsWith(ext))
  
  if (isStatic) {
    const cache = caches.default
    let response = await cache.match(request)
    
    if (!response) {
      response = await fetch(request)
      // Clone response and cache it
      const cacheResponse = response.clone()
      event.waitUntil(cache.put(request, cacheResponse))
    }
    
    return response
  }
  
  return fetch(request)
}
```

### **Step 3: הגדרות בCloudflare Dashboard**

#### **Page Rules:**
```
1. neonoasis.com/sounds/*
   → Cache Level: Cache Everything
   → Edge Cache TTL: 1 year

2. neonoasis.com/models/*
   → Cache Level: Cache Everything
   → Edge Cache TTL: 1 year

3. neonoasis.com/assets/*
   → Cache Level: Cache Everything
   → Edge Cache TTL: 1 month
```

#### **Caching:**
- Configuration → Caching → Caching Level: **Standard**
- Browser Cache TTL: **1 year**

#### **Speed:**
- Auto Minify: ✅ JavaScript, CSS, HTML
- Brotli: ✅
- Early Hints: ✅
- Rocket Loader: ❌ (conflicts with React)

---

## 🔧 Frontend Integration

### **Vite Config (apps/web/vite.config.ts):**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
    // Generate content-based file names for cache busting
    chunkSizeWarningLimit: 1000,
  },
  // CDN base URL (optional, if using separate CDN domain)
  base: process.env.VITE_CDN_URL || '/',
});
```

### **Environment Variables:**

```bash
# .env.production
VITE_CDN_URL=https://cdn.neonoasis.com
```

### **HTML Preloading (index.html):**

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    
    <!-- Preconnect to CDN -->
    <link rel="preconnect" href="https://cdn.neonoasis.com" />
    <link rel="dns-prefetch" href="https://cdn.neonoasis.com" />
    
    <!-- Preload critical assets -->
    <link rel="preload" href="/sounds/neon_click.mp3" as="audio" />
    <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin />
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Neon Oasis</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 📊 Performance Testing

### **Before CDN:**
```bash
curl -w "@curl-format.txt" -o /dev/null -s https://neonoasis.com/sounds/win.mp3

time_namelookup:    0.012
time_connect:       0.156
time_total:         0.842  # 842ms ❌
```

### **After CDN:**
```bash
curl -w "@curl-format.txt" -o /dev/null -s https://neonoasis.com/sounds/win.mp3

time_namelookup:    0.003
time_connect:       0.018
time_total:         0.045  # 45ms ✅ (18x faster!)
```

---

## 🌍 Alternative CDNs

| CDN | Free Tier | Best For | Speed |
|-----|-----------|----------|-------|
| **Cloudflare** | ✅ Unlimited | Global | ⭐⭐⭐⭐⭐ |
| **Vercel** | ✅ 100GB | Next.js/React | ⭐⭐⭐⭐⭐ |
| **Netlify** | ✅ 100GB | Static sites | ⭐⭐⭐⭐ |
| **AWS CloudFront** | ❌ Pay-as-you-go | Enterprise | ⭐⭐⭐⭐⭐ |
| **Google Cloud CDN** | ❌ Pay-as-you-go | Global | ⭐⭐⭐⭐⭐ |

**Recommendation:** **Cloudflare** (free + best performance)

---

## 🚀 Quick Start

```bash
# 1. Build for production
pnpm run build

# 2. Upload to Cloudflare Pages (easiest)
pnpm add -g wrangler
wrangler login
wrangler pages publish dist --project-name neon-oasis

# 3. Done! Your app is now on CDN ✅
```

---

## ✅ Verification

```bash
# Check if CDN is working
curl -I https://neonoasis.com/sounds/win.mp3 | grep -i cf-cache-status

# Expected output:
cf-cache-status: HIT  # ✅ Cached on CDN
# Or:
cf-cache-status: MISS # First request, not cached yet
```

---

## 🎯 Expected Results

| Metric | Before CDN | After CDN | Improvement |
|--------|-----------|-----------|-------------|
| **Load Time** | 3s | 0.8s | ↓73% ✅ |
| **TTFB** | 800ms | 50ms | ↓94% ✅ |
| **Latency** | 200ms | 15ms | ↓93% ✅ |
| **Bandwidth Cost** | $100/month | $0 | ↓100% ✅ |

---

**Status:** Ready to deploy! 🚀
