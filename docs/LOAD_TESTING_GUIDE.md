# 🧪 Load Testing Guide — Artillery

**מטרה:** לוודא שהמערכת יכולה להחזיק 100+ משתמשים בו-זמנית ללא קריסה

---

## 🎯 למה צריך Load Testing?

**Without Testing:**
```
Launch → 1000 users join → Server crashes ❌
```

**With Testing:**
```
Test → Find bottlenecks → Fix → Launch → 1000 users → Stable ✅
```

**What We Test:**
- API endpoints (latency, errors)
- WebSocket connections (concurrent users)
- Database queries (under load)
- Redis caching (hit rate)
- Memory leaks
- CPU usage

---

## 🚀 Installation

```bash
# Install Artillery
pnpm add -D artillery

# Or globally
pnpm add -g artillery
```

---

## 📝 Test Scenarios

We have 2 test files:

### **1. HTTP/REST API Test (`load-test.yml`)**
Tests:
- Guest login (30%)
- Profile fetch (20%)
- Leaderboard (25%)
- Tournament list (15%)
- Health check (10%)

**Target:** 100 concurrent users, 200ms p95 latency

### **2. WebSocket Test (`load-test-websocket.yml`)**
Tests:
- Join room + Place bet
- Spectator mode

**Target:** 100 concurrent connections, 100ms p95 latency

---

## 🏃 Running Tests

### **Test 1: API Load Test**
```bash
# Start API server first
pnpm run dev

# Run test (in new terminal)
pnpm exec artillery run load-test.yml

# Expected output:
# --------------------------------
# Summary report
# --------------------------------
# http.codes.200: 5000 (100%)
# http.response_time.p95: 180ms ✅
# http.response_time.p99: 350ms ✅
# errors.ECONNREFUSED: 0 ✅
```

### **Test 2: WebSocket Load Test**
```bash
# Start API server
pnpm run dev

# Run WebSocket test
pnpm exec artillery run load-test-websocket.yml

# Expected output:
# socketio.emit: 1000
# socketio.response_time.p95: 85ms ✅
```

### **Test 3: Quick Stress Test**
```bash
# 100 requests to /api/health
pnpm exec artillery quick --count 100 --num 10 http://localhost:4000/api/health

# --count 100 = total requests
# --num 10 = concurrent users
```

---

## 📊 Interpreting Results

### **Good Results ✅**
```
http.codes.200: 5000 (100%)      ← All requests succeeded
http.response_time.p95: 180ms    ← 95% of requests < 200ms
http.response_time.p99: 350ms    ← 99% of requests < 500ms
errors: 0                         ← No errors
```

### **Bad Results ❌**
```
http.codes.200: 4500 (90%)       ← 10% failed ❌
http.codes.500: 500 (10%)        ← Server errors
http.response_time.p95: 850ms    ← Too slow ❌
errors.ECONNREFUSED: 200          ← Connection failures ❌
```

**If results are bad:**
1. Check API logs for errors
2. Check Redis connection
3. Check PostgreSQL connection pool
4. Increase server resources (CPU, RAM)
5. Add horizontal scaling (multiple API instances)

---

## 🔧 Advanced Testing

### **Ramp-up Test (Gradual Load)**
```yaml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 300  # 5 minutes
      arrivalRate: 1
      rampTo: 1000  # 1 → 1000 users
```

### **Spike Test (Sudden Load)**
```yaml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 10
      arrivalRate: 0  # Quiet
    - duration: 30
      arrivalRate: 500  # Sudden spike!
    - duration: 60
      arrivalRate: 100  # Back to normal
```

### **Soak Test (Long Duration)**
```yaml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 3600  # 1 hour
      arrivalRate: 50  # Constant load
```

---

## 📈 Monitoring During Tests

### **Monitor API Logs:**
```bash
# Terminal 1: Run test
pnpm exec artillery run load-test.yml

# Terminal 2: Watch logs
cd apps/api
pnpm run dev | tee api-load-test.log
```

### **Monitor System Resources:**
```bash
# CPU & Memory (Linux/Mac)
top -p $(pgrep -f "node.*apps/api")

# Windows
tasklist /FI "IMAGENAME eq node.exe"
```

### **Monitor PostgreSQL:**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### **Monitor Redis:**
```bash
redis-cli INFO stats
# Look for: total_commands_processed, instantaneous_ops_per_sec
```

---

## 🎯 Performance Goals

| Metric | Target | Critical |
|--------|--------|----------|
| **Success Rate** | > 99% | > 95% |
| **P95 Latency** | < 200ms | < 500ms |
| **P99 Latency** | < 500ms | < 1000ms |
| **Concurrent Users** | 100 | 50 |
| **Error Rate** | < 1% | < 5% |
| **Memory Usage** | < 512MB | < 1GB |
| **CPU Usage** | < 70% | < 90% |

---

## 🐛 Common Issues & Fixes

### **Issue: Connection Refused**
```
errors.ECONNREFUSED: 100
```
**Fix:**
- Check if API server is running: `curl http://localhost:4000/api/health`
- Check port: `netstat -an | grep 4000`

### **Issue: High Latency**
```
http.response_time.p95: 1200ms ❌
```
**Fix:**
1. Add Redis caching ✅
2. Optimize DB queries (add indexes)
3. Enable connection pooling
4. Add CDN for static assets

### **Issue: Memory Leak**
```
Memory usage keeps growing: 200MB → 500MB → 1GB → CRASH
```
**Fix:**
- Check for unclosed connections
- Clear caches periodically
- Use `--max-old-space-size=512` for Node.js

### **Issue: Database Timeouts**
```
errors.ETIMEDOUT: 50
```
**Fix:**
- Increase DB connection pool: `max: 20`
- Add DB read replicas
- Cache frequently accessed data in Redis

---

## ✅ Checklist Before Launch

- [ ] API can handle 100 concurrent users
- [ ] WebSocket can handle 100 connections
- [ ] P95 latency < 200ms
- [ ] Success rate > 99%
- [ ] No memory leaks (stable over 1 hour)
- [ ] Redis caching is working
- [ ] Database connection pool is optimized
- [ ] Error monitoring is set up (Sentry)

---

## 📊 Sample Report

```
All VUs finished. Total time: 4 minutes 0 seconds

Summary report @ 14:30:15(+0200)
  Scenarios launched:  5000
  Scenarios completed: 5000
  Requests completed:  15000
  Mean response/sec:   62.5
  Response time (msec):
    min: 12
    max: 487
    median: 145
    p95: 189  ✅
    p99: 342  ✅
  Scenario counts:
    Guest Login Flow: 1500 (30%)
    User Profile Fetch: 1000 (20%)
    Leaderboard Query: 1250 (25%)
    Tournament List: 750 (15%)
    Health Check: 500 (10%)
  Codes:
    200: 15000 (100%) ✅
  Errors:
    (none) ✅
```

**Verdict:** ✅ **Production Ready!**

---

## 🚀 Next Steps

1. Run tests locally
2. Fix any issues (latency, errors)
3. Run tests on staging
4. Run tests on production (during low traffic)
5. Monitor production metrics (Sentry, Grafana)

---

**Status:** Load testing configured and ready! Run `npx artillery run load-test.yml` to test. 🧪
