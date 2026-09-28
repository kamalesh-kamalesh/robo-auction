# 🚀 Robo Auction — Supabase & Production Hosting Guide

This guide details how your entire Robo Auction platform is connected to **Supabase** for database persistence and prepared for high-performance hosting on **Vercel (Client)** and **Render/Fly.io (Server)** with **zero data confusion or data loss**.

---

## 🏗️ Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │            Supabase Postgres           │
                      │  • Sessions & Phase State              │
                      │  • Teams & Budgets (Constraints)       │
                      │  • Component Variants & Bids Log       │
                      │  • Purchases & Robot Assemblies        │
                      │  • Leaderboards & Atomic Snapshots     │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
       Database Sync & Audit (REST / Service Role)    Optional Direct Client Reads / Realtime
                 │                                               │
                 ▼                                               ▼
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│     Node.js / Express Server    │◄───────────►│       Svelte 5 Client (SPA)     │
│   (Render / Fly.io / Docker)    │  WebSocket  │        (Hosted on Vercel)       │
│                                 │ (Socket.io) │                                 │
│ • In-Memory Auction State Engine│             │ • Host Dashboard                │
│ • Sub-second Bidding & Anti-Snipe             │ • Team Portal & Bidding Screen  │
│ • Supabase Auto-Persistence Sync│             │ • Robot Assembly Canvas         │
│ • Crash Disaster Recovery       │             │ • Live Testing Arena & Results  │
└─────────────────────────────────┘             └─────────────────────────────────┘
```

---

## 📦 What Was Built & Connected

### 1. Database Schema & Disaster Recovery ([`supabase/schema.sql`](file:///d:/robo%20auction/supabase/schema.sql))
- **`tournament_sessions`**: Global auction phases, active components, timers, and round counters.
- **`teams`**: Participating team registry with strict check constraints (`balance >= 0`, `spent_amount >= 0`) to prevent budget overruns.
- **`robot_components` & `component_variants`**: Master catalog of the 20 major modules (Basic, Advanced, Pro tiers).
- **`bids`**: Immutable audit ledger of every bid placed with `anti_snipe_triggered` flag for dispute-free auditing.
- **`team_purchases`**: Official registry of acquired modules.
- **`robot_assemblies`**: 20-slot modular robot configurations and validation metrics.
- **`testing_scores`**: Performance rankings, budget efficiency scores, and final standings.
- **`auction_snapshots`**: Full state disaster-recovery snapshots saved periodically to Supabase Postgres.
- **Row-Level Security (RLS)**: Public read access enabled for spectators and leaderboards; mutations locked to the backend `service_role` to prevent client tampering.

### 2. Server Persistence Service ([`server/src/services/supabaseService.ts`](file:///d:/robo%20auction/server/src/services/supabaseService.ts))
- Automatically saves bids, completed sales, assemblies, and final rankings in real-time.
- Runs periodic atomic snapshot synchronization to Supabase Postgres every 20 seconds.
- On server startup, **automatically restores state from Supabase** so dyno sleeps or restarts never erase tournament progress.

### 3. Client Dynamic Connectivity ([`client/src/services/socket.ts`](file:///d:/robo%20auction/client/src/services/socket.ts) & [`client/src/services/supabase.ts`](file:///d:/robo%20auction/client/src/services/supabase.ts))
- Seamless URL resolution via `VITE_SERVER_URL` or `VITE_BACKEND_URL`.
- Direct Supabase client for reading public tournament tables and realtime events.
- Automatic reconnect policies with exponential backoff.

### 4. Hosting Configurations
- **Vercel**: [`client/vercel.json`](file:///d:/robo%20auction/client/vercel.json) with SPA rewrites and security headers.
- **Render**: [`render.yaml`](file:///d:/robo%20auction/render.yaml) for zero-config server deployment with health checks.
- **Docker**: [`server/Dockerfile`](file:///d:/robo%20auction/server/Dockerfile) for deployment to Fly.io, Railway, or Google Cloud Run.

---

## ⚡ 5-Step Setup Guide

### Step 1: Create a Free Supabase Project
1. Log in to [supabase.com](https://supabase.com) and click **"New Project"**.
2. Set a name (e.g. `robo-auction`) and choose a strong database password and nearest region.

### Step 2: Run the SQL Schema
1. In your Supabase Dashboard, navigate to **SQL Editor** (left navigation).
2. Click **"New Query"**.
3. Copy the entire contents of [`supabase/schema.sql`](file:///d:/robo%20auction/supabase/schema.sql) and paste it into the editor.
4. Click **Run**. All 9 tables, indexes, RLS policies, and triggers will be created.

### Step 3: Configure Server Environment Variables
1. In your Supabase Dashboard, go to **Project Settings** -> **API**.
2. Copy:
   - **Project URL**
   - **service_role secret key** (under `Project API keys` - click reveal)
3. In [`server/.env`](file:///d:/robo%20auction/server/.env) (or Render environment variables), set:
   ```env
   NODE_ENV=production
   PORT=4000
   HOST_PASSCODE=your_secret_host_passcode
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   RESTORE_SNAPSHOT=true
   AUTO_SNAPSHOT=true
   CORS_ORIGIN=*
   ```

### Step 4: Deploy Server to Render or Fly.io
#### Deploying to Render:
1. Push your repository to GitHub.
2. In Render, select **"New Blueprint Instance"** and link your repo (it automatically detects [`render.yaml`](file:///d:/robo%20auction/render.yaml)).
3. Or create a **New Web Service**:
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Add environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `HOST_PASSCODE`, etc.).
4. Note your public backend URL: `https://your-server-app.onrender.com`.

### Step 5: Deploy Client to Vercel
1. In [Vercel](https://vercel.com), click **"Add New Project"** and import your repository.
2. Configure project settings:
   - Root Directory: `client`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add Environment Variables:
   - `VITE_SERVER_URL`: `https://your-server-app.onrender.com`
   - `VITE_SUPABASE_URL`: `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
4. Click **Deploy**.
5. Once deployed, update `CORS_ORIGIN` in your Render server settings to your Vercel URL (e.g. `https://robo-auction.vercel.app`) for strict security.

---

## 🛠️ Testing Locally Before Deploying

You can test the full stack with local fallback right now:

```bash
# Terminal 1 - Start Server
cd server
npm run dev

# Terminal 2 - Start Client
cd client
npm run dev
```

Even without Supabase keys set up yet, the server gracefully falls back to local snapshots so you can test immediately!
