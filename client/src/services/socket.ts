/// <reference types="vite/client" />
import { io, Socket } from 'socket.io-client';

const URL = (import.meta as any).env?.VITE_BACKEND_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:4000` : 'http://localhost:4000');

export const socket: Socket = io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});
