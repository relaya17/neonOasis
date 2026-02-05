# 🛡️ AI Guardian Implementation Guide

**Purpose:** Step-by-step guide to implement age verification and geo-fencing for Neon Oasis.

---

## Overview

The AI Guardian is a critical compliance feature that:
1. **Verifies users are 18+** using face detection (no photo storage)
2. **Detects user location** to enforce Israeli gaming laws
3. **Protects privacy** by only storing encrypted hashes

---

## Architecture

```
┌─────────────────┐
│   User Device   │
│                 │
│  📷 Camera      │
│  Face Detection │
│  (Face-API.js)  │
└────────┬────────┘
         │
         │ Encrypted Hash
         │
         ▼
┌─────────────────┐
│   Backend API   │
│                 │
│  🔐 Verify Hash │
│  🌍 Check IP    │
│  💾 Store Flag  │
└─────────────────┘
```

---

## Part 1: Face Detection (Age Verification)

### Step 1: Install Dependencies

```bash
cd apps/web
pnpm add face-api.js
```

### Step 2: Download AI Models

Create a public directory for models:

```bash
mkdir -p apps/web/public/models
```

Download models from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Required files:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `age_gender_model-weights_manifest.json`
- `age_gender_model-shard1`

Place in `apps/web/public/models/`

### Step 3: Create Age Verification Component

**File:** `apps/web/src/features/auth/AgeVerification.tsx`

```typescript
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { motion } from 'framer-motion';

interface AgeVerificationProps {
  onVerified: (hash: string) => void;
  onFailed: (error: string) => void;
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({
  onVerified,
  onFailed,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load AI models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.ageGenderNet.loadFromUri('/models');
        setModelsLoaded(true);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load AI models. Please refresh.');
        setIsLoading(false);
      }
    };
    loadModels();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  // Scan face
  const scanFace = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    setIsScanning(true);
    setError(null);

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withAgeAndGender();

      if (!detections) {
        setError('No face detected. Please position your face in the frame.');
        setIsScanning(false);
        return;
      }

      const { age, gender, genderProbability } = detections;

      // Check if 18+
      if (age < 18) {
        onFailed('You must be 18 or older to use this app.');
        setIsScanning(false);
        return;
      }

      // Generate hash (no photo storage)
      const hash = await generateHash(detections);
      onVerified(hash);

    } catch (err) {
      setError('Verification failed. Please try again.');
      setIsScanning(false);
    }
  };

  // Generate encrypted hash
  const generateHash = async (detections: any): Promise<string> => {
    const data = JSON.stringify({
      age: Math.round(detections.age),
      gender: detections.gender,
      timestamp: Date.now(),
    });
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0b 0%, #1a0a1f 100%)',
        padding: 3,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Orbitron', monospace",
            color: '#ff00ff',
            textShadow: '0 0 20px #ff00ff',
            mb: 2,
          }}
        >
          Age Verification
        </Typography>

        <Typography variant="body1" sx={{ color: '#fff', mb: 3, textAlign: 'center' }}>
          We need to verify you're 18+ to comply with gaming regulations.
          <br />
          <strong>Your photo is NOT stored.</strong> Only an encrypted hash is saved.
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <CircularProgress sx={{ color: '#00ffff' }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!isLoading && (
          <>
            <Box
              sx={{
                position: 'relative',
                width: 640,
                height: 480,
                border: '2px solid #ff00ff',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)',
                mb: 3,
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                width={640}
                height={480}
                style={{ display: 'block' }}
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{ position: 'absolute', top: 0, left: 0 }}
              />

              {/* Face frame overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 300,
                  height: 400,
                  border: '3px dashed #00ffff',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={scanFace}
              disabled={isScanning}
              sx={{
                background: 'linear-gradient(45deg, #ff00ff 30%, #00ffff 90%)',
                color: '#fff',
                fontFamily: "'Orbitron', monospace",
                fontSize: '1.2rem',
                padding: '12px 48px',
                boxShadow: '0 0 20px rgba(255, 0, 255, 0.5)',
                '&:hover': {
                  boxShadow: '0 0 30px rgba(255, 0, 255, 0.8)',
                },
              }}
            >
              {isScanning ? 'Scanning...' : 'Verify My Age'}
            </Button>

            {!videoRef.current?.srcObject && (
              <Button
                variant="outlined"
                onClick={startCamera}
                sx={{ mt: 2, color: '#00ffff', borderColor: '#00ffff' }}
              >
                Enable Camera
              </Button>
            )}
          </>
        )}
      </motion.div>
    </Box>
  );
};
```

### Step 4: Integrate into Auth Flow

**File:** `apps/web/src/features/auth/AuthGuard.tsx`

```typescript
import { AgeVerification } from './AgeVerification';
import { useAuthStore } from '../../stores/authStore';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAgeVerified, setAgeVerified } = useAuthStore();

  const handleVerified = async (hash: string) => {
    // Send to backend
    const response = await fetch('/api/auth/verify-age', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    });

    if (response.ok) {
      setAgeVerified(true);
    }
  };

  const handleFailed = (error: string) => {
    alert(error);
  };

  if (!isAgeVerified) {
    return <AgeVerification onVerified={handleVerified} onFailed={handleFailed} />;
  }

  return <>{children}</>;
};
```

---

## Part 2: Geo-Fencing (IP Detection)

### Step 1: Install Dependencies

```bash
cd apps/api
pnpm add geoip-lite
```

### Step 2: Create Geo Service

**File:** `apps/api/src/services/geoService.ts`

```typescript
import geoip from 'geoip-lite';

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  ll: [number, number]; // latitude, longitude
}

export class GeoService {
  /**
   * Get location from IP address
   */
  static getLocation(ip: string): GeoLocation | null {
    const geo = geoip.lookup(ip);
    if (!geo) return null;

    return {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      ll: geo.ll,
    };
  }

  /**
   * Check if IP is from Israel
   */
  static isIsraeliIP(ip: string): boolean {
    const geo = this.getLocation(ip);
    return geo?.country === 'IL';
  }

  /**
   * Get allowed game types based on location
   */
  static getAllowedGames(ip: string): string[] {
    const isIsrael = this.isIsraeliIP(ip);

    if (isIsrael) {
      // Israel: Only skill-based games
      return ['backgammon', 'snooker', 'chess'];
    }

    // Other countries: All games
    return ['backgammon', 'snooker', 'chess', 'poker', 'slots', 'roulette'];
  }
}
```

### Step 3: Create Middleware

**File:** `apps/api/src/middleware/geoCheck.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { GeoService } from '../services/geoService';

export async function geoCheckMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const ip = request.ip || request.headers['x-forwarded-for'] as string || 'unknown';
  
  // Skip for localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown') {
    request.userCountry = 'US'; // Default for dev
    return;
  }

  const location = GeoService.getLocation(ip);
  request.userCountry = location?.country || 'unknown';

  // Store in request for later use
  request.allowedGames = GeoService.getAllowedGames(ip);
}

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    userCountry?: string;
    allowedGames?: string[];
  }
}
```

### Step 4: Apply Middleware

**File:** `apps/api/src/app.ts`

```typescript
import { geoCheckMiddleware } from './middleware/geoCheck';

// Apply to all routes
app.addHook('onRequest', geoCheckMiddleware);

// Add endpoint to get allowed games
app.get('/api/games/allowed', async (request, reply) => {
  return {
    country: request.userCountry,
    allowedGames: request.allowedGames,
  };
});
```

### Step 5: Frontend Integration

**File:** `apps/web/src/features/lobby/LobbyView.tsx`

```typescript
import { useEffect, useState } from 'react';

export const LobbyView = () => {
  const [allowedGames, setAllowedGames] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/games/allowed')
      .then(res => res.json())
      .then(data => setAllowedGames(data.allowedGames));
  }, []);

  const games = [
    { id: 'backgammon', name: 'Backgammon', icon: '🎲' },
    { id: 'snooker', name: 'Snooker', icon: '🎱' },
    { id: 'poker', name: 'Poker', icon: '🃏' },
  ];

  return (
    <Box>
      {games.map(game => {
        const isAllowed = allowedGames.includes(game.id);
        return (
          <Card key={game.id} sx={{ opacity: isAllowed ? 1 : 0.5 }}>
            <CardContent>
              <Typography variant="h5">{game.icon} {game.name}</Typography>
              {!isAllowed && (
                <Chip label="Not available in your region" color="error" />
              )}
            </CardContent>
            <CardActions>
              <Button disabled={!isAllowed}>Play</Button>
            </CardActions>
          </Card>
        );
      })}
    </Box>
  );
};
```

---

## Part 3: Backend Verification

### Step 1: Database Migration

**File:** `apps/api/src/db/migrations/004_age_verification.sql`

```sql
-- Add verification fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_age_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);

-- Create verification log table
CREATE TABLE IF NOT EXISTS age_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  verification_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  country_code VARCHAR(2),
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_age_verifications_user_id ON age_verifications(user_id);
CREATE INDEX idx_users_verification_hash ON users(verification_hash);
```

### Step 2: Verification Endpoint

**File:** `apps/api/src/routes/auth.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { pool } from '../db/pool';
import { GeoService } from '../services/geoService';

export async function authRoutes(app: FastifyInstance) {
  // Age verification endpoint
  app.post('/api/auth/verify-age', async (request, reply) => {
    const { hash, userId } = request.body as { hash: string; userId: number };

    if (!hash || !userId) {
      return reply.code(400).send({ error: 'Missing hash or userId' });
    }

    const ip = request.ip;
    const location = GeoService.getLocation(ip);

    try {
      // Check if hash already used (prevent reuse)
      const existing = await pool.query(
        'SELECT id FROM users WHERE verification_hash = $1 AND id != $2',
        [hash, userId]
      );

      if (existing.rows.length > 0) {
        return reply.code(400).send({ error: 'Verification hash already used' });
      }

      // Update user
      await pool.query(
        `UPDATE users 
         SET is_age_verified = true, 
             verification_hash = $1, 
             verified_at = NOW(),
             country_code = $2,
             last_ip = $3
         WHERE id = $4`,
        [hash, location?.country || 'unknown', ip, userId]
      );

      // Log verification
      await pool.query(
        `INSERT INTO age_verifications (user_id, verification_hash, ip_address, country_code)
         VALUES ($1, $2, $3, $4)`,
        [userId, hash, ip, location?.country || 'unknown']
      );

      return { success: true, verified: true };
    } catch (error) {
      console.error('Age verification error:', error);
      return reply.code(500).send({ error: 'Verification failed' });
    }
  });

  // Check verification status
  app.get('/api/auth/verification-status/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    const result = await pool.query(
      'SELECT is_age_verified, verified_at, country_code FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return result.rows[0];
  });
}
```

---

## Part 4: Privacy & Security

### Best Practices

1. **No Photo Storage**
   - ✅ Only store SHA-256 hash
   - ✅ Hash includes timestamp (unique per verification)
   - ❌ Never save camera frames or face data

2. **Encrypted Transmission**
   - ✅ Use HTTPS in production
   - ✅ Hash generated client-side
   - ✅ Only hash sent to server

3. **Rate Limiting**
   ```typescript
   // apps/api/src/app.ts
   import rateLimit from '@fastify/rate-limit';

   app.register(rateLimit, {
     max: 5, // 5 attempts
     timeWindow: '15 minutes',
     errorResponseBuilder: (request, context) => ({
       error: 'Too many verification attempts. Please try again later.',
     }),
   });
   ```

4. **Audit Trail**
   - ✅ Log all verification attempts
   - ✅ Track IP and country
   - ✅ Admin can review in dashboard

---

## Part 5: Testing

### Test Cases

1. **Age Detection**
   - [ ] User 18+ → Pass
   - [ ] User <18 → Fail
   - [ ] No face detected → Error
   - [ ] Multiple faces → Error

2. **Geo-Fencing**
   - [ ] Israeli IP → Only skill games
   - [ ] US IP → All games
   - [ ] VPN detection (optional)

3. **Hash Uniqueness**
   - [ ] Same user, different time → Different hash
   - [ ] Reused hash → Rejected

### Manual Testing

```bash
# 1. Start dev servers
pnpm run dev

# 2. Open browser
http://localhost:5273

# 3. Test age verification
# - Allow camera access
# - Position face in frame
# - Click "Verify My Age"
# - Check console for hash

# 4. Test geo-fencing
# - Check Network tab for /api/games/allowed
# - Verify allowedGames array
# - Try accessing restricted game
```

---

## Part 6: Admin Dashboard Integration

### Add Verification Stats

**File:** `apps/web/src/features/admin/Dashboard.tsx`

```typescript
const [verificationStats, setVerificationStats] = useState({
  total: 0,
  successful: 0,
  failed: 0,
  byCountry: {},
});

useEffect(() => {
  fetch('/api/admin/verification-stats')
    .then(res => res.json())
    .then(setVerificationStats);
}, []);

return (
  <StatsCard
    title="Age Verifications"
    value={verificationStats.successful}
    subtitle={`${verificationStats.failed} failed`}
    icon={<VerifiedUser />}
  />
);
```

---

## Troubleshooting

### Camera Not Working
- Check browser permissions (chrome://settings/content/camera)
- Ensure HTTPS in production (camera requires secure context)
- Test on different devices

### Models Not Loading
- Verify models are in `public/models/`
- Check network tab for 404 errors
- Ensure correct file names

### Geo-Detection Inaccurate
- Use paid service (MaxMind GeoIP2) for better accuracy
- Implement VPN detection (check for proxy headers)
- Allow manual country selection with verification

---

## Next Steps

1. ✅ Implement age verification component
2. ✅ Set up geo-fencing middleware
3. ✅ Create database migration
4. ✅ Add admin dashboard stats
5. [ ] Test with real users
6. [ ] Deploy to production
7. [ ] Monitor success rates

---

**Questions? Check the main PRD or open a GitHub issue.**

🛡️ **Privacy First. Security Always.** 🛡️
