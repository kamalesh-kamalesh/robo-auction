/// <reference types="vite/client" />
import { io, Socket } from 'socket.io-client';

function getBackendUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_SERVER_URL || (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl;
  }

  // If running in browser
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return `${window.location.protocol}//${window.location.hostname}:4000`;
    }
    // In production (Render, custom domain, etc.) connect to current origin
    return window.location.origin;
  }

  // Fallback default
  return 'http://localhost:4000';
}

const URL = getBackendUrl();
console.log(`🔌 [Socket.io] Connecting to Auction Backend at: ${URL}`);

export const socket: Socket = io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

socket.on('connect', () => {
  console.log(`✅ [Socket.io] Connected successfully [ID: ${socket.id}]`);
});

socket.on('connect_error', (err) => {
  console.warn(`⚠️ [Socket.io] Connection issue to ${URL}:`, err.message);
});
