import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { AuctionEngine } from './engine/AuctionEngine.js';
import { setupSocketHandlers } from './socket/socketHandlers.js';
import { createApiRouter } from './routes/apiRoutes.js';

const PORT = process.env.PORT || 4000;
const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Initialize Auction State Machine with configurable production storage
const engine = new AuctionEngine();

// Check if crash recovery snapshot exists and should be restored
if (process.env.RESTORE_SNAPSHOT === 'true') {
  const restored = engine.loadSnapshot();
  if (restored) {
    console.log(`🔄 Restored state from snapshot: ${engine.getSnapshotPath()}`);
  } else {
    console.log(`ℹ️ No valid previous snapshot found at: ${engine.getSnapshotPath()}`);
  }
} else {
  console.log(`✨ Starting fresh in-memory session (RESTORE_SNAPSHOT is false)`);
}

// Start periodic JSON snapshot for crash recovery if enabled
if (process.env.AUTO_SNAPSHOT !== 'false') {
  const snapshotInterval = parseInt(process.env.SNAPSHOT_INTERVAL_MS || '20000', 10);
  engine.startAutoSnapshot(snapshotInterval);
  console.log(`💾 Auto-snapshot enabled (every ${snapshotInterval / 1000}s) -> ${engine.getSnapshotPath()}`);
} else {
  console.log(`💾 Auto-snapshot is DISABLED`);
}

// Setup WebSocket communication
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
setupSocketHandlers(io, engine);

// Setup REST APIs
app.use('/api', createApiRouter(engine));

// Serve client build if available (production mode)
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (_, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🤖 ROBO AUCTION SERVER ONLINE`);
  console.log(`📡 HTTP & WebSocket: http://localhost:${PORT}`);
  console.log(`👑 Host Passcode: ${process.env.HOST_PASSCODE || 'host2026'}`);
  console.log(`🛡️ Dynamic participant registrations enabled (20 major robot components, 3 variants each)`);
  console.log(`====================================================`);
});
