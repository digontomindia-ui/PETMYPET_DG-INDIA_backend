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
const { sessionRepository } = await import('../../src/modules/auth/session.repository.js');

/** Socket auth checks the session row (logout revokes it), so tokens need a real session. */
async function tokenFor(userId: string): Promise<{ token: string; sessionId: string }> {
  const session = await sessionRepository.create(userId, 'hash', new Date(Date.now() + 60_000), {});
  const sessionId = session._id.toString();
  return { token: signAccessToken({ userId, role: 'USER', sessionId }), sessionId };
}

function connect(baseUrl: string, token: string) {
  return ioClient(baseUrl, { auth: { token }, reconnection: false, forceNew: true });
}

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

    const aliceToken = (await tokenFor(aliceId)).token;
    const bobToken = (await tokenFor(bobId)).token;

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

  it('rejects a token whose session was revoked (logged out)', async () => {
    const { token, sessionId } = await tokenFor('507f1f77bcf86cd799439021');
    await sessionRepository.revoke(sessionId);
    const client = connect(baseUrl, token);
    const error = await waitForEvent<Error>(client, 'connect_error');
    expect(error.message).toMatch(/session/i);
    client.close();
  });

  it('does not let a non-participant join a room, and delivers new_message + presence to the provider app', async () => {
    const ownerId = '507f1f77bcf86cd799439031';
    const providerId = '507f1f77bcf86cd799439032';
    const strangerId = '507f1f77bcf86cd799439033';
    const room = await chatRepository.findOrCreateRoom(ownerId, providerId);
    const roomId = room._id.toString();

    const [providerAuth, strangerAuth, ownerAuth] = await Promise.all([
      tokenFor(providerId),
      tokenFor(strangerId),
      tokenFor(ownerId),
    ]);
    const provider = connect(baseUrl, providerAuth.token);
    const stranger = connect(baseUrl, strangerAuth.token);
    await Promise.all([waitForEvent(provider, 'connect'), waitForEvent(stranger, 'connect')]);

    const offline = waitForEvent<{ user_id: string; is_online: boolean }>(provider, 'user_status');
    provider.emit('join_room', { room_id: roomId });
    expect(await offline).toMatchObject({ user_id: ownerId, is_online: false });

    let strangerGotMessage = false;
    stranger.on('new_message', () => (strangerGotMessage = true));
    stranger.emit('join_room', { room_id: roomId });

    const online = waitForEvent<{ is_online: boolean }>(provider, 'user_status');
    const owner = connect(baseUrl, ownerAuth.token);
    expect((await online).is_online).toBe(true);

    // Owner app sends via the chat:* contract; provider app (listening to new_message) still gets it.
    const received = waitForEvent<{ message: string; sender_id: string; type: string }>(provider, 'new_message');
    owner.emit('chat:message', { roomId, text: 'Is Bruno ready?' });
    expect(await received).toMatchObject({ message: 'Is Bruno ready?', sender_id: ownerId, type: 'TEXT' });

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(strangerGotMessage).toBe(false);

    const ack = await new Promise<{ status: string; id: string }>((resolve) =>
      provider.emit('send_message', { room_id: roomId, temp_id: 't1', message: 'Yes!' }, resolve),
    );
    expect(ack.status).toBe('SENT');

    owner.close();
    provider.close();
    stranger.close();
  });
});
