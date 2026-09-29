import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { AuctionEngine } from './engine/AuctionEngine.js';
import { setupSocketHandlers } from './socket/socketHandlers.js';
import { createApiRouter } from './routes/apiRoutes.js';
import { supabaseService } from './services/supabaseService.js';

const PORT = process.env.PORT || 4000;
const app = express();
const httpServer = createServer(app);

// Dynamic CORS configuration allowing Cloudflare, Vercel client domains & local dev
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
  : ['*'];

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.includes(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Initialize Auction State Machine
const engine = new AuctionEngine();

async function startServer() {
  // Check if crash recovery snapshot exists and should be restored
  if (process.env.RESTORE_SNAPSHOT === 'true') {
    const restored = await engine.loadSnapshotAsync();
    if (restored) {
      console.log(`🔄 Restored tournament state successfully (Supabase/Local snapshot).`);
    } else {
      console.log(`ℹ️ No previous snapshot found; starting fresh.`);
    }
  } else {
    console.log(`✨ Starting fresh tournament session (RESTORE_SNAPSHOT is false)`);
  }

  // Start periodic snapshot saves for crash recovery
  if (process.env.AUTO_SNAPSHOT !== 'false') {
    const snapshotInterval = parseInt(process.env.SNAPSHOT_INTERVAL_MS || '20000', 10);
    engine.startAutoSnapshot(snapshotInterval);
    console.log(`💾 Auto-snapshot enabled (every ${snapshotInterval / 1000}s) -> Supabase + Local backup`);
  } else {
    console.log(`💾 Auto-snapshot is DISABLED`);
  }

  // Setup WebSocket communication
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isOriginAllowed(origin));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  setupSocketHandlers(io, engine);

  // Setup REST APIs
  app.use('/api', createApiRouter(engine));

  // Health check endpoint for Render / Fly.io / monitoring
  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      supabaseConnected: supabaseService.isConnected(),
      timestamp: new Date().toISOString()
    });
  });

  // Serve client build if available (single-container production mode on Render / Docker / cloud)
  const candidateClientPaths = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist')
  ];
  const clientDistPath = candidateClientPaths.find(p => fs.existsSync(p));
  if (clientDistPath) {
    console.log(`🌐 Serving client frontend from: ${clientDistPath}`);
    app.use(express.static(clientDistPath));
    app.get('*', (_, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  } else {
    console.log(`ℹ️ Client dist not found (checked: ${candidateClientPaths.join(', ')}). Running in API/WebSocket mode only.`);
  }

  httpServer.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🤖 ROBO AUCTION SERVER ONLINE`);
    console.log(`📡 HTTP & WebSocket: http://localhost:${PORT}`);
    console.log(`⚡ Supabase Persistence: ${supabaseService.isConnected() ? 'ONLINE & SYNCED' : 'OFFLINE (Fallback to local snapshot)'}`);
    console.log(`👑 Host Passcode: ${process.env.HOST_PASSCODE || 'host2026'}`);
    console.log(`🛡️ Dynamic participant registrations enabled (20 major robot components, 3 variants each)`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

