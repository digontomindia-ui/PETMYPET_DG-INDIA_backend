import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { corsOrigins } from '../common/config/env.js';
import { registerChatGateway } from '../modules/chat/chat.gateway.js';
import { registerBookingWalkGateway } from '../modules/bookings/booking-walk.gateway.js';

let io: SocketIOServer | undefined;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: corsOrigins.length > 0 ? corsOrigins : true, credentials: true },
    // Recover a socket's rooms, data and any messages it missed across a brief drop (reverse-proxy
    // idle timeouts, mobile network blips) so chat keeps working after a reconnect without the
    // client having to re-join every room. This is the common cause of "chat works for a while then
    // silently stops": the socket reconnects but is no longer in its chat room. Beyond this window a
    // reconnect is a fresh session and the client must re-emit join_room.
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    // More tolerant of slow mobile networks before the server declares a client gone.
    pingInterval: 25_000,
    pingTimeout: 60_000,
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
