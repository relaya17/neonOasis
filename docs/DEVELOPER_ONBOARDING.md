# 👨‍💻 Developer Onboarding Guide

**Welcome to Neon Oasis!** This guide will get you up and running in 30 minutes.

---

## 🎯 What You're Building

Neon Oasis is a **high-end, 80's Vegas-themed social gaming platform** featuring:
- 🎲 3D skill-based games (Backgammon, Snooker)
- 🛡️ AI-driven age verification
- 📱 TikTok-style social feed
- 💰 Virtual economy with real-time transactions
- 🌍 Geo-fencing for legal compliance

**Think:** TikTok meets Vegas meets 3D gaming, but skill-based and compliant.

---

## 📚 Required Reading (15 minutes)

Before coding, read these in order:

1. **[README.md](./README.md)** (5 min) — Project overview
2. **[docs/PRD_MASTER_2026.md](./docs/PRD_MASTER_2026.md)** (10 min, skim) — Product vision
3. **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** (5 min) — What's built and what needs implementation
4. **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)** (5 min, skim) — What needs to be implemented

---

## 🛠️ Setup (15 minutes)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Git
- VS Code (recommended)

### 1. Clone & Install
```bash
# Clone the repo
git clone <repo-url>
cd neonOasis

# Install dependencies
pnpm install

# This installs all workspaces:
# - apps/web (frontend)
# - apps/api (backend)
# - packages/shared (types)
```

### 2. Environment Setup
```bash
# Copy example env
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL (PostgreSQL connection string)
# - REDIS_URL (optional, for caching)
# - CORS_ORIGIN (http://localhost:5273 for dev)
```

### 3. Database Setup
```bash
# Run schema
psql $DATABASE_URL -f apps/api/src/db/schema.sql

# Run migrations
psql $DATABASE_URL -f apps/api/src/db/migrations/001_coupons_referrals.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/002_leaderboard.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/003_admin.sql

# Create first admin user (after running the app once)
psql $DATABASE_URL -c "UPDATE users SET is_admin = true WHERE username = 'your_username';"
```

### 4. Start Development Servers
```bash
# Option 1: Start both (API + Web)
pnpm run dev

# Option 2: Start individually
pnpm run dev:api    # Backend → http://localhost:4000
pnpm run dev:web    # Frontend → http://localhost:5273
```

### 5. Verify Setup
Open http://localhost:5173 in your browser. You should see:
- Consent gate (Terms & Privacy)
- Login screen
- Vegas-themed UI with neon colors

---

## 📁 Project Structure

```
neonOasis/
├── apps/
│   ├── web/                    # Frontend (React 18 + Vite + TS)
│   │   ├── src/
│   │   │   ├── app/            # Theme, routing, global state
│   │   │   ├── features/       # Feature-based modules
│   │   │   │   ├── admin/      # Admin dashboard
│   │   │   │   ├── auth/       # Auth + legal pages
│   │   │   │   ├── backgammon/ # 3D backgammon game
│   │   │   │   ├── feed/       # TikTok-style feed
│   │   │   │   ├── store/      # Virtual coin store
│   │   │   │   ├── profile/    # User profile
│   │   │   │   └── ...
│   │   │   └── shared/         # Reusable components
│   │   └── public/
│   │       ├── manifest.json   # PWA config
│   │       └── favicon.svg     # Neon logo
│   │
│   └── api/                    # Backend (Node.js + Fastify + Socket.io)
│       └── src/
│           ├── app.ts          # Fastify server
│           ├── index.ts        # Entry point + Socket.io
│           ├── core/           # Socket initialization
│           ├── db/             # PostgreSQL + Prisma
│           ├── modules/        # Feature modules (room, ai)
│           └── services/       # Business logic
│
├── packages/
│   └── shared/                 # Shared types (client ↔ server)
│       └── src/
│           ├── game.ts         # Game types
│           ├── sync.ts         # Real-time sync
│           ├── user.ts         # User profiles
│           └── wallet.ts       # Transactions
│
├── docs/                       # Documentation
│   └── AI_GUARDIAN_GUIDE.md    # Age verification guide
│
├── PRD.md                      # Product requirements
├── IMPLEMENTATION_ROADMAP.md   # Step-by-step tasks
├── GAP_ANALYSIS.md             # Current vs. target
├── VISUAL_ROADMAP.md           # Visual timeline
└── package.json                # Monorepo config
```

---

## 🎨 Tech Stack Cheat Sheet

### Frontend
| Tech | Purpose | Docs |
|------|---------|------|
| React 18 | UI framework | [docs](https://react.dev) |
| Vite | Build tool | [docs](https://vitejs.dev) |
| TypeScript | Type safety | [docs](https://typescriptlang.org) |
| React Three Fiber | 3D rendering | [docs](https://docs.pmnd.rs/react-three-fiber) |
| Cannon.js | Physics engine | [docs](https://github.com/pmndrs/use-cannon) |
| Material-UI | Component library | [docs](https://mui.com) |
| Framer Motion | Animations | [docs](https://framer.com/motion) |
| Zustand | State management | [docs](https://zustand-demo.pmnd.rs) |
| Socket.io Client | Real-time | [docs](https://socket.io/docs/v4/client-api) |

### Backend
| Tech | Purpose | Docs |
|------|---------|------|
| Node.js 20 | Runtime | [docs](https://nodejs.org) |
| Fastify | Web framework | [docs](https://fastify.dev) |
| Socket.io | Real-time | [docs](https://socket.io/docs/v4) |
| PostgreSQL | Database | [docs](https://postgresql.org) |
| Prisma | ORM | [docs](https://prisma.io) |
| Redis | Caching (optional) | [docs](https://redis.io) |

---

## 🎮 Key Concepts

### 1. Real-Time Sync
**Problem:** Multiplayer games need instant updates.  
**Solution:** WebSocket-based sync with predictive UI.

```typescript
// Client predicts move immediately
const optimisticState = applyMove(currentState, move);
setState(optimisticState);

// Send to server
socket.emit('game:move', move);

// Server validates and broadcasts
socket.on('game:state', (authoritative) => {
  setState(authoritative); // Correct if prediction was wrong
});
```

### 2. Virtual Economy
**Problem:** Track coins, purchases, and transactions securely.  
**Solution:** PostgreSQL with atomic transactions.

```typescript
// All balance changes are atomic
await pool.query('BEGIN');
await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, userId]);
await pool.query('INSERT INTO transactions (user_id, type, amount) VALUES ($1, $2, $3)', [userId, 'bet', amount]);
await pool.query('COMMIT');
```

### 3. 3D Physics
**Problem:** Realistic dice rolls and ball physics.  
**Solution:** Cannon.js integrated with Three.js.

```typescript
// Create physics body
const [ref, api] = useBox(() => ({
  mass: 1,
  position: [0, 5, 0],
}));

// Apply force (dice roll)
api.applyImpulse([0, 10, 0], [0, 0, 0]);
```

### 4. Geo-Fencing
**Problem:** Comply with Israeli gaming laws (skill-based only).  
**Solution:** IP-based country detection.

```typescript
// Middleware checks IP
const location = GeoService.getLocation(request.ip);
if (location.country === 'IL') {
  request.allowedGames = ['backgammon', 'snooker']; // Skill-based only
} else {
  request.allowedGames = ['backgammon', 'snooker', 'poker', 'slots']; // All games
}
```

---

## 🔥 Common Tasks

### Add a New Feature
```bash
# 1. Create feature directory
mkdir apps/web/src/features/my-feature

# 2. Create component
touch apps/web/src/features/my-feature/MyFeature.tsx

# 3. Add route (if needed)
# Edit apps/web/src/app/App.tsx

# 4. Add types (if needed)
# Edit packages/shared/src/my-feature.ts
```

### Add a New API Endpoint
```typescript
// apps/api/src/routes/my-route.ts
export async function myRoutes(app: FastifyInstance) {
  app.get('/api/my-endpoint', async (request, reply) => {
    return { message: 'Hello!' };
  });
}

// apps/api/src/app.ts
import { myRoutes } from './routes/my-route';
app.register(myRoutes);
```

### Add a New Socket Event
```typescript
// packages/shared/src/socket-events.ts
export const SOCKET_EVENTS = {
  MY_EVENT: 'my:event',
};

// apps/api/src/core/socket.ts
socket.on(SOCKET_EVENTS.MY_EVENT, (data) => {
  // Handle event
});

// apps/web/src/features/sync/useSyncSocket.ts
socket.emit(SOCKET_EVENTS.MY_EVENT, data);
```

### Run Tests (when added)
```bash
# Unit tests
pnpm run test -C apps/web
pnpm run test -C apps/api

# E2E tests
pnpm run test:e2e
```

---

## 🐛 Debugging Tips

### Frontend Issues
```bash
# Check browser console (F12)
# Look for React errors, network failures, WebSocket disconnects

# Check Vite dev server
# Terminal shows build errors, HMR updates

# Use React DevTools
# Install: https://react.dev/learn/react-developer-tools
```

### Backend Issues
```bash
# Check API logs
pnpm run dev:api
# Look for error stack traces

# Check database
psql $DATABASE_URL
# Run queries to verify data

# Check WebSocket connections
# Use Socket.io admin UI: https://socket.io/docs/v4/admin-ui/
```

### Performance Issues
```bash
# Run Lighthouse
pnpm run lighthouse -C apps/web

# Check bundle size
pnpm run build -C apps/web
pnpm exec vite-bundle-visualizer

# Profile React components
# Use React DevTools Profiler
```

---

## 📝 Coding Standards

### TypeScript
- ✅ Use explicit types (avoid `any`)
- ✅ Use interfaces for objects
- ✅ Use enums for constants
- ❌ Don't use `var` (use `const` or `let`)

### React
- ✅ Use functional components
- ✅ Use hooks (useState, useEffect, etc.)
- ✅ Extract reusable logic to custom hooks
- ❌ Don't use class components

### Naming Conventions
- **Components:** PascalCase (`MyComponent.tsx`)
- **Hooks:** camelCase with `use` prefix (`useMyHook.ts`)
- **Files:** kebab-case for non-components (`my-utils.ts`)
- **Constants:** UPPER_SNAKE_CASE (`MY_CONSTANT`)

### File Organization
```typescript
// 1. Imports (external first, then internal)
import React from 'react';
import { Box } from '@mui/material';
import { MyComponent } from './MyComponent';

// 2. Types/Interfaces
interface MyProps {
  name: string;
}

// 3. Component
export const MyComponent: React.FC<MyProps> = ({ name }) => {
  // 4. Hooks
  const [state, setState] = useState(0);

  // 5. Effects
  useEffect(() => {
    // ...
  }, []);

  // 6. Handlers
  const handleClick = () => {
    // ...
  };

  // 7. Render
  return <Box>{name}</Box>;
};
```

---

## 🚀 Your First Task

### Beginner Task: Add a "Hello World" Page
1. Create `apps/web/src/features/hello/HelloWorld.tsx`
2. Add route in `apps/web/src/app/App.tsx`
3. Style with Material-UI (neon theme)
4. Test at http://localhost:5273/hello

### Intermediate Task: Add a New API Endpoint
1. Create `apps/api/src/routes/hello.ts`
2. Add `GET /api/hello` endpoint
3. Return `{ message: 'Hello from Neon Oasis!' }`
4. Test with `curl http://localhost:4000/api/hello`

### Advanced Task: Add a 3D Cube to the Feed
1. Edit `apps/web/src/features/feed/GameScene.tsx`
2. Add a rotating cube using React Three Fiber
3. Apply neon material (pink or blue)
4. Test in the feed at http://localhost:5273

---

## 🤝 Getting Help

### Documentation
- [PRD.md](./PRD.md) — Product vision
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) — Tasks
- [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) — What's missing
- [docs/AI_GUARDIAN_GUIDE.md](./docs/AI_GUARDIAN_GUIDE.md) — AI implementation

### Code Examples
- Look at existing features (e.g., `apps/web/src/features/backgammon/`)
- Check shared types (`packages/shared/src/`)
- Review API routes (`apps/api/src/routes/`)

### Ask Questions
- Open a GitHub issue
- Ask in team chat
- Schedule a code review

---

## 🎯 Current Priorities

### 🔴 Critical (Do First)
1. **AI Guardian** — Age verification (see [docs/AI_GUARDIAN_GUIDE.md](./docs/AI_GUARDIAN_GUIDE.md))
2. **Geo-Fencing** — Israeli IP detection
3. **Security** — Rate limiting, input validation

### 🟡 High Priority (Do Next)
1. **Certified RNG** — Provably fair dice
2. **Design Polish** — Orbitron font, animated splash
3. **Tournament System** — Elo ratings, brackets

### 🟢 Low Priority (Can Wait)
1. **Snooker Game** — Full implementation
2. **VIP Store** — 3D skins, badges
3. **Daily Rewards** — Spin the Wheel

See [VISUAL_ROADMAP.md](./VISUAL_ROADMAP.md) for full timeline.

---

## ✅ Onboarding Checklist

- [ ] Read README.md
- [ ] Read PRD.md (skim)
- [ ] Clone repo
- [ ] Install dependencies
- [ ] Set up database
- [ ] Start dev servers
- [ ] Verify app loads
- [ ] Explore codebase
- [ ] Complete "Your First Task"
- [ ] Join team chat
- [ ] Ask questions if stuck

---

## 🎉 Welcome to the Team!

You're now ready to build the future of social gaming. Remember:

- **Quality over speed** — Write clean, maintainable code
- **Ask questions** — No question is too small
- **Test your work** — Verify before committing
- **Have fun** — We're building something amazing!

🎰 **Let's make Neon Oasis legendary!** 💎🔥

---

**Next Steps:**
1. Complete the onboarding checklist
2. Pick a task from [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
3. Start coding!

**Questions?** Open a GitHub issue or ask in team chat.
