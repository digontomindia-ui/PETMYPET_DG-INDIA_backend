import type { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../../common/utils/logger.js';
import type { AuthenticatedSocket } from '../../sockets/authenticate-socket.js';
import { bookingRepository } from './booking.repository.js';
import { providerRepository } from '../providers/provider.repository.js';
import { bookingService } from './booking.service.js';
import { WALK_SOCKET_EVENTS } from './booking.constants.js';

async function canAccessBooking(bookingId: string, userId: string): Promise<boolean> {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) return false;
  if (booking.userId.toString() === userId) return true;

  const provider = await providerRepository.findByUserId(userId);
  return provider !== null && booking.providerId.toString() === provider._id.toString();
}

export function registerBookingWalkGateway(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    const { userId } = (socket as AuthenticatedSocket).data;

    socket.on(WALK_SOCKET_EVENTS.JOIN, ({ bookingId }: { bookingId: string }) => {
      canAccessBooking(bookingId, userId)
        .then((allowed) => {
          if (allowed) void socket.join(`booking:${bookingId}`);
        })
        .catch((err: unknown) => logger.error({ err }, 'Failed to authorize walk:join'));
    });

    socket.on(
      WALK_SOCKET_EVENTS.UPDATE,
      (payload: {
        bookingId: string;
        distanceMeters: number;
        durationSeconds: number;
        steps: number;
        calories: number;
      }) => {
        bookingService
          .updateWalkStats(payload.bookingId, userId, {
            distanceMeters: Number(payload.distanceMeters) || 0,
            durationSeconds: Number(payload.durationSeconds) || 0,
            steps: Number(payload.steps) || 0,
            calories: Number(payload.calories) || 0,
          })
          .catch((err: unknown) => logger.error({ err }, 'Failed to persist walk stats update'));
      },
    );
  });
}
