import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { initSocketServer } = await import('../../src/sockets/index.js');
const { signAccessToken } = await import('../../src/common/utils/jwt.js');
const { chatRepository } = await import('../../src/modules/chat/chat.repository.js');

function waitForEvent<T>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

describe('chat Socket.io gateway', () => {
  let httpServer: ReturnType<typeof createServer>;
  let baseUrl: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const app = createApp();
    httpServer = createServer(app);
    initSocketServer(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterEach(() => {
    httpServer.close();
  });

  it('rejects a connection with no auth token', async () => {
    const client = ioClient(baseUrl, { auth: {}, reconnection: false, forceNew: true });
    const error = await waitForEvent<Error>(client, 'connect_error');
    expect(error.message).toMatch(/authentication token/i);
    client.close();
  });

  it('delivers a real-time message and read receipt between two connected users', async () => {
    const aliceId = '507f1f77bcf86cd799439011';
    const bobId = '507f1f77bcf86cd799439012';
    const room = await chatRepository.findOrCreateRoom(aliceId, bobId);

    const aliceToken = signAccessToken({ userId: aliceId, role: 'USER', sessionId: 's1' });
    const bobToken = signAccessToken({ userId: bobId, role: 'USER', sessionId: 's2' });

    const alice = ioClient(baseUrl, {
      auth: { token: aliceToken },
      reconnection: false,
      forceNew: true,
    });
    const bob = ioClient(baseUrl, {
      auth: { token: bobToken },
      reconnection: false,
      forceNew: true,
    });

    await Promise.all([waitForEvent(alice, 'connect'), waitForEvent(bob, 'connect')]);

    alice.emit('chat:join', { roomId: room._id.toString() });
    bob.emit('chat:join', { roomId: room._id.toString() });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const bobReceived = waitForEvent<{ text: string; senderId: string }>(bob, 'chat:message');
    alice.emit('chat:message', { roomId: room._id.toString(), text: 'Hey Bob' });
    const message = await bobReceived;
    expect(message.text).toBe('Hey Bob');
    expect(message.senderId).toBe(aliceId);

    const aliceSeesTyping = waitForEvent<{ userId: string }>(alice, 'chat:typing');
    bob.emit('chat:typing', { roomId: room._id.toString() });
    const typingEvent = await aliceSeesTyping;
    expect(typingEvent.userId).toBe(bobId);

    const aliceSeesRead = waitForEvent<{ readerId: string }>(alice, 'chat:read');
    bob.emit('chat:read', { roomId: room._id.toString() });
    const readEvent = await aliceSeesRead;
    expect(readEvent.readerId).toBe(bobId);

    alice.close();
    bob.close();
  });
});
