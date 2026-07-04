import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { corsOrigins } from '../common/config/env.js';

let io: SocketIOServer | undefined;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: corsOrigins.length > 0 ? corsOrigins : true, credentials: true },
  });

  // Namespace-specific gateways (chat, live tracking, etc.) register themselves here
  // as each module is implemented.

  return io;
}

export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server has not been initialized yet');
  }
  return io;
}
