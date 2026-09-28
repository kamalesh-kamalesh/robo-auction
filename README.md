# 🤖 ROBO AUCTION — Real-Time Robot Component Auction & Build Challenge

A comprehensive, real-time multiplayer robotics competition game built with **Node.js**, **Express**, **Socket.io**, **TypeScript**, and **Svelte 5 (Runes)**.

> **"BUY SMART → BUILD SMART → TEST SMART → SCORE SMART"**  
> The winner is determined by **robot performance + efficient use of the given budget**, not simply by who spends the most money.

---

## 🎮 Core Game Concept & Tournament Flow

```text
TEAM REGISTRATION (Up to 70 Teams, ₹100,000 Starting Budget)
       ↓
AUCTION LOBBY (Real-Time Floor Standby)
       ↓
20 MAJOR COMPONENT AUCTIONS (3 Variants each: Basic, Advanced, Pro)
       ↓
BUDGET MANAGEMENT (Server-Authoritative Balance & Commitments)
       ↓
ROBOT ASSEMBLY (Visual Integration Schematic & Slotting)
       ↓
COMPATIBILITY VALIDATION (Current, Voltage, Bus, Payload & MIPS Checks)
       ↓
DIGITAL PERFORMANCE TESTS (6 Challenge Tasks, 800 Max Points)
       ↓
TASK-BASED SCORING & BUDGET EFFICIENCY
       ↓
FINAL SCORE CALCULATION: (Perf × 0.70) + (Efficiency × 0.30)
       ↓
LIVE LEADERBOARD (Immutable Published Results)
```

---

## ⚡ Key Features & System Architecture

### 1. Exactly 20 Major Robot Components
The auction contains exactly **20 major components** (no endless replenishment or arbitrary lots):
1. **Chassis Frame**
2. **Drive Motors**
3. **Motor Driver**
4. **Power Battery**
5. **Main Controller (Brain)**
6. **Ultrasonic Sensor**
7. **Infrared (IR) Sensor**
8. **Line Following Sensor**
9. **Servo Actuator**
10. **Wheel & Traction Set**
11. **Transmission Gearbox**
12. **Optical Wheel Encoder**
13. **Vision Camera**
14. **Communication Module**
15. **Robotic Gripper**
16. **Articulated Robotic Arm**
17. **Power Regulator (DC-DC)**
18. **IMU Gyro / Accelerometer**
19. **Precision Laser Distance Sensor (LiDAR)**
20. **Control Interface & Safety Telemetry**

### 2. Three Distinct Variants for Every Component
When a component opens on the trading floor, participants choose strategically between **3 variants**:
- **Basic**: Economical, standard specs, preserves budget for high efficiency score.
- **Advanced**: Mid-range price, balanced capabilities, solid all-round performance.
- **Pro**: High-performance, premium cost, maximum speed/torque/resolution capabilities.

### 3. Equal ₹100,000 Budget System
- Every team receives an identical ₹100,000 starting budget.
- Server strictly validates `availableBudget >= bidAmount`.
- Committed funds on active leading bids are locked to prevent over-bidding.
- Fixed increment bidding buttons (`+₹500`, `+₹1000`, `+₹2500`, `+₹5000`, `+₹10000`).

### 4. Interactive Robot Assembly Canvas
- Visual schematic layout mapping all 20 categories into functional robot bays.
- Real-time electrical and physical compatibility validation:
  - Motor Driver current capacity vs Motor stall draw.
  - Battery capacity and C-rating vs total system wattage.
  - Controller compute rate (MIPS) and buses (CSI, SPI, I2C, CAN) vs sensors/cameras.
  - Chassis maximum payload limit vs total component weight.
  - Arm, Gripper, and Servo articulation synergies.
- Compatibility score (0–100%) and actionable engineering diagnostic logs.

### 5. 6 Digital Performance Tests (800 Points Maximum)
1. **Speed & Acceleration Sprint** (100 pts) — Driven by motor RPM, gearbox ratio, wheel traction, and chassis lightness.
2. **Precision Trajectory & Line Tracking** (100 pts) — Driven by line sensor array, optical encoders, IMU gyro, and controller loop rates.
3. **Dynamic Obstacle Avoidance** (150 pts) — Driven by ultrasonic sensors, LiDAR distance sensors, and driver response times.
4. **Autonomous Object Recognition** (150 pts) — Driven by vision cameras, controller MIPS/NPU, and telemetry datalinks.
5. **Object Pick & Place Challenge** (200 pts) — Driven by articulated robotic arm degrees-of-freedom, gripper compliance, servos, and camera guidance.
6. **Energy & Power Efficiency** (100 pts) — Driven by battery chemistry, GaN power regulators, and motor electrical efficiency.

### 6. Transparent Scoring Engine
$$\text{Final Score} = (\text{Normalized Performance} \times 0.70) + (\text{Budget Efficiency} \times 0.30)$$
Where:
- $\text{Normalized Performance} = (\text{Raw Performance Score} / 800) \times 1000$ (0 to 1000 scale).
- $\text{Budget Efficiency} = (\text{Raw Performance Score} / \text{Total Spent}) \text{ normalized to 0–1000}$.
- Smart engineering with conservative spending is rewarded over reckless high spending.

### 7. Host Command Center & One-Click Demo Mode
- Master control room with phase state machine (`LOBBY` → `AUCTION` → `AUCTION_COMPLETE` → `ASSEMBLY` → `TESTING` → `LEADERBOARD` → `EVENT_COMPLETE`).
- Component selector, timer adjustments, pause/resume/reset controls.
- **⚡ Run Demo Simulation (70 Teams)**: Instantly simulates the entire auction, component assignments, assembly compatibility checks, and digital test runs for presentations.
- One-click **Audit JSON Export** (`GET /api/export`).

### 8. 16:9 Projector Arena View
- Optimized for large venue displays (`#stage`).
- Displays live countdown timer, open component, 3-variant cards, current bidders, recent winners, and top leaderboard podiums.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Svelte 5 (Runes: `$state`, `$derived`, `$props`), TypeScript, Vite 6, Canvas-Confetti, `@lucide/svelte` |
| **Backend** | Node.js, Express, Socket.io, TypeScript, tsx |
| **Styling** | Cyber-Industrial Dark Theme, Glassmorphism, Google Fonts (*Outfit*, *JetBrains Mono*, *Chakra Petch*) |
| **State** | Server-authoritative in-memory state with per-variant concurrency mutex queues |

---

## 🚀 Running Locally

### 1. Start Dev Server
```bash
npm run dev
```
- **Backend API & WebSockets**: `http://localhost:4000`
- **Frontend App**: `http://localhost:5173`

### 2. Available Routes
- **Participant Floor**: `http://localhost:5173/#team` (Default)
  - Navigation tabs: `🏷️ Live Auction`, `🧩 Robot Assembly`, `⚡ Performance Testing`, `📦 My Components`, `🏆 Leaderboard`.
- **Host Matrix**: `http://localhost:5173/#host` (Passcode: `host2026`)
- **Arena Projector**: `http://localhost:5173/#stage`

### 3. REST API Endpoints
- `GET /api/status` — General server and round status.
- `GET /api/event/status` — Current phase and active component metadata.
- `GET /api/components` — Catalogue of all 20 major components and 60 variants.
- `GET /api/team/:id` — Team budget, status, and assembly state (PIN redacted).
- `GET /api/team/:id/inventory` — Purchased modules, specifications, and prices.
- `GET /api/teams` — Registered teams directory.
- `GET /api/leaderboard` — Real-time competition standings and score breakdowns.
- `GET /api/export` — Full event audit stream exported as JSON.
- `POST /api/teams/register` — Register a squad (requires `code`, `pin`, optional `teamName`; max 70 teams).
- `POST /api/teams/login` — Authenticate team credentials (requires `code`, `pin`).
- `POST /api/start` — Start auction round (Requires Host Passcode).
- `POST /api/pause` — Pause auction round timers (Requires Host Passcode).
- `POST /api/resume` — Resume auction round timers (Requires Host Passcode).
- `POST /api/reset` — Reset tournament to initial lobby (Requires Host Passcode).
- `POST /api/demo` — Quick-trigger 70-team tournament simulation (Requires Host Passcode).
- `POST /api/phase` — Explicitly advance event phase (Requires Host Passcode, validated by state machine).

*Host-authenticated endpoints accept the passcode via `x-host-passcode` header, `Authorization: Bearer <passcode>`, or `body.hostPasscode`.*

---

## 🧪 Testing & Verification

Run the complete test suite:
```bash
npm test
```
Or run individual verification suites:
- **Comprehensive Test Suite (74 tests)**: Team authorization, PIN requirements, 70-team limits, duplicate rejection, socket anti-impersonation, host REST auth, bid/budget validation, phase transitions, and scoring immutability:
  ```bash
  npm run test --prefix server
  ```
- **Concurrency Test Suite**: Atomic variant mutex verification and anti-snipe race condition checks under 30 concurrent bids:
  ```bash
  npm run test:concurrency --prefix server
  ```

---

## 🏆 Acceptance Criteria Verified
- [x] **Team PIN & Identity**: Mandatory PIN for login and dynamic registration. Supports up to 70 teams (`TEAM-01` to `TEAM-70` or custom codes), and rejects duplicate team codes.
- [x] **Socket Anti-Impersonation**: Socket.IO bidding, assembly, and testing strictly bind to the authenticated socket's team identity and reject client-supplied `teamId` overrides.
- [x] **Protected Host REST Endpoints**: Administrative routes (`/api/start`, `/api/pause`, `/api/resume`, `/api/reset`, `/api/demo`, `/api/phase`) enforce HTTP `POST` and require valid host passcode authentication.
- [x] **Strict Server Bid Validation**: Rejects `NaN`, `Infinity`, strings, non-integers, non-positive values, invalid increments (multiples of ₹500), and bids exceeding available budget.
- [x] **Enforced Phase State Machine**: Formal state machine (`LOBBY` ➔ `AUCTION` ➔ `AUCTION_COMPLETE` ➔ `ASSEMBLY` ➔ `TESTING` ➔ `LEADERBOARD` ➔ `EVENT_COMPLETE`) rejects illegal transitions.
- [x] **Immutable Published Results**: Once results are published, bidding is locked, tests cannot overwrite scores, and leaderboard standings remain immutable.
- [x] **Budget System**: All teams receive equal ₹100,000 starting budget with automated commitment locks on leading bids and release on outbid.
- [x] **20 Components & 3 Variants**: Exactly 20 major categories with Basic, Advanced, and Pro tiers.
- [x] **Digital Assembly & Testing**: 20-category physical/electrical compatibility validation and 6-task digital performance lab totaling 800 points.
- [x] **Authoritative Scoring**: $(0.70 \times \text{Normalized Performance}) + (0.30 \times \text{Budget Efficiency})$.
- [x] **16:9 Arena Projector**: Responsive projector display for large venue auditoriums.

---

## 🔒 Production Deployment & Storage Configuration

1. **Environment Variables**:
   Copy [`server/.env.example`](file:///d:/robo%20auction/server/.env.example) to `server/.env` and configure:
   - `NODE_ENV=production`: Enables production safety protections.
   - `HOST_PASSCODE`: Set a secure passphrase for host console authentication.
   - `ALLOW_DEMO_MODE=false`: Disables `/api/demo` and Socket `RUN_DEMO` so mock simulations cannot accidentally overwrite real team data during a live tournament.
   - `RESTORE_SNAPSHOT=false`: Ensures the server starts with a clean `LOBBY` session rather than restoring old test data. Set to `true` only during crash recovery.
   - `STORAGE_FILE_PATH=./data/auction-snapshot.json`: Configurable storage location for periodic crash recovery snapshots.
   - `AUTO_SNAPSHOT=true` and `SNAPSHOT_INTERVAL_MS=20000`: Automated periodic snapshot writes with atomic file replacement (`.tmp` + rename).

2. **Security & Data Privacy (Preventing Public Repository Leaks)**:
   - The repository [`.gitignore`](file:///d:/robo%20auction/.gitignore) strictly ignores `server/data/`, `data/`, `*.snapshot.json`, `auction-snapshot.json`, and all `.env` files.
   - Real participant credentials, team PINs, and live event bid records are saved locally only in the runtime snapshot path and are never uploaded to a public repository.

---

## ⚠️ Remaining Limitations
1. **In-Memory State with Periodic Snapshots**: Tournament state is held in-memory and periodically written to `data/auction-snapshot.json` via atomic writes for crash recovery. For multi-datacenter distributed high-availability, an external Redis or PostgreSQL store would be required.
2. **Single Active Event**: The server engine currently manages one active tournament session per running instance.
3. **Socket Reconnection Semantics**: Clients rely on local storage for PIN persistence across browser refreshes; clearing browser local storage requires manual re-authentication.

