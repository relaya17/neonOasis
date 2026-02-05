# 🔴 Redis Deployment Guide

**מטרה:** להוריד latency ב-70% על ידי caching של sessions, game states, ו-profiles

---

## 🎯 למה צריך Redis?

**בלי Redis:**
```
API Request → PostgreSQL Query (50-100ms) ❌
```

**עם Redis:**
```
API Request → Redis Cache (5-10ms) ✅
```

**Use Cases:**
- Session storage (user login states)
- Game state caching (live games)
- User profile caching
- Leaderboard caching
- Rate limiting

---

## 🚀 Deployment Options

### **Option A: Redis Cloud (Recommended) — Free 30MB**

1. **Sign up:** [redis.com/try-free](https://redis.com/try-free)
2. **Create database:**
   - Name: `neon-oasis`
   - Cloud: AWS
   - Region: `us-east-1` (or closest to your API)
   - Plan: Free (30MB)
3. **Get connection string:**
   ```
   redis://default:password@redis-12345.redis.cloud:12345
   ```

### **Option B: AWS ElastiCache — Production**

```bash
# 1. Create ElastiCache cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id neon-oasis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --region us-east-1

# 2. Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id neon-oasis \
  --show-cache-node-info
```

**Cost:** ~$13/month (t3.micro)

### **Option C: Docker (Local Development)**

```bash
# Run Redis in Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest

# Test connection
redis-cli ping
# Expected: PONG ✅
```

---

## 🔧 Backend Integration

### **1. Install Dependencies:**
```bash
cd apps/api
pnpm add ioredis
```

### **2. Environment Variables (.env):**
```bash
# Local
REDIS_URL=redis://localhost:6379

# Production (Redis Cloud)
REDIS_URL=redis://default:YOUR_PASSWORD@redis-12345.redis.cloud:12345

# Production (AWS ElastiCache)
REDIS_URL=redis://master.neon-oasis.abc123.use1.cache.amazonaws.com:6379
```

### **3. Already Integrated! ✅**
Redis client is already set up in:
- `apps/api/src/cache/redis.ts`

Test it:
```bash
# Start API
pnpm run dev

# Check logs
# Expected: "✅ Redis connected"
```

---

## 📊 Usage Examples

### **Cache User Profile:**
```typescript
import { cacheUserProfile, getCachedUserProfile } from './cache/redis';

// Get user profile
const cached = await getCachedUserProfile(userId);
if (cached) return cached; // ✅ Fast (5ms)

// If not cached, query DB
const profile = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Cache for 5 minutes
await cacheUserProfile(userId, profile);
return profile; // ❌ Slow first time (50ms), then fast
```

### **Rate Limiting:**
```typescript
import { checkRateLimit } from './cache/redis';

const { allowed, remaining } = await checkRateLimit('user:123', 100, 60);
if (!allowed) {
  return reply.status(429).send({ error: 'Too many requests' });
}
```

### **Session Storage:**
```typescript
import { cacheUserSession, getCachedUserSession } from './cache/redis';

// On login
await cacheUserSession(userId, { username, balance, ... });

// On request
const session = await getCachedUserSession(userId);
// No DB query needed! ✅
```

---

## 🧪 Testing

### **Test Redis Connection:**
```bash
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping((err, result) => {
  console.log('Redis:', result); // Expected: PONG
  redis.quit();
});
"
```

### **Performance Benchmark:**
```typescript
// Without Redis
console.time('DB Query');
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
console.timeEnd('DB Query'); // ~50ms ❌

// With Redis
console.time('Redis Cache');
const cachedUser = await getCachedUserProfile(userId);
console.timeEnd('Redis Cache'); // ~5ms ✅
```

**Result:** 10x faster! 🚀

---

## 📈 Monitoring

### **Redis CLI:**
```bash
# Connect
redis-cli -h redis-12345.redis.cloud -p 12345 -a YOUR_PASSWORD

# Check memory usage
INFO memory

# Check keys
KEYS *

# Get value
GET session:user-123

# Monitor all commands
MONITOR
```

### **Redis Insight (GUI):**
1. Download: [redis.com/redis-enterprise/redis-insight](https://redis.com/redis-enterprise/redis-insight)
2. Connect to your Redis instance
3. Visualize keys, memory, performance

---

## 🛡️ Security Best Practices

### **1. Use Strong Password:**
```bash
# Generate strong password
openssl rand -base64 32
```

### **2. Restrict Network Access:**
```bash
# Only allow API server IP
# → Configure in Redis Cloud or AWS Security Group
```

### **3. Use SSL/TLS (Production):**
```bash
REDIS_URL=rediss://default:password@redis.cloud:12345
#         ^^^^^^ 's' for SSL
```

### **4. Expire Sensitive Data:**
```typescript
// Don't cache passwords forever!
await redis.setex('token:abc123', 3600, 'sensitive-data'); // Expires in 1 hour
```

---

## 🔧 Troubleshooting

### **Issue: "Connection refused"**
```bash
# Check if Redis is running
docker ps | grep redis

# Or check port
nc -zv localhost 6379
```

### **Issue: "Authentication failed"**
```bash
# Check password in .env
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

### **Issue: "Out of memory"**
```bash
# Check memory usage
redis-cli INFO memory | grep used_memory_human

# Clear cache (careful!)
redis-cli FLUSHDB
```

---

## 📊 Expected Performance

| Metric | Without Redis | With Redis | Improvement |
|--------|--------------|------------|-------------|
| **Latency** | 100ms | 30ms | ↓70% ✅ |
| **DB Load** | 1000 queries/sec | 100 queries/sec | ↓90% ✅ |
| **Response Time** | 150ms | 50ms | ↓67% ✅ |
| **Cost** | $50/month (DB) | $13/month (Redis) | ↓74% ✅ |

---

## ✅ Checklist

- [ ] Choose deployment option (Redis Cloud recommended)
- [ ] Create Redis instance
- [ ] Add `REDIS_URL` to `.env`
- [ ] Test connection: `redis-cli ping`
- [ ] Restart API: `pnpm run dev`
- [ ] Check logs: "✅ Redis connected"
- [ ] Monitor performance: 100ms → 30ms ✅

---

**Status:** Redis is already integrated in the codebase! Just deploy and set `REDIS_URL`. 🚀
