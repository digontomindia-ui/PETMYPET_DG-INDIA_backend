import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { corsOrigins } from '../common/config/env.js';
import { registerChatGateway } from '../modules/chat/chat.gateway.js';
import { registerBookingWalkGateway } from '../modules/bookings/booking-walk.gateway.js';

let io: SocketIOServer | undefined;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: corsOrigins.length > 0 ? corsOrigins : true, credentials: true },
  });

  registerChatGateway(io);
  registerBookingWalkGateway(io);

  return io;
}

export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server has not been initialized yet');
  }
  return io;
}

/** Non-throwing variant for best-effort real-time emission from code paths (like REST handlers or
 * tests) that may run before the socket server exists. */
export function tryGetSocketServer(): SocketIOServer | undefined {
  return io;
}
