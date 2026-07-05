import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');

describe('chat REST layer', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a room, sends messages, tracks unread counts, and marks read', async () => {
    const alice = await signupAndVerify(app, { role: 'USER' });
    const bob = await signupAndVerify(app, { role: 'USER' });

    const roomRes = await request(app)
      .post('/api/v1/chat/rooms')
      .set('Authorization', `Bearer ${alice.tokens.accessToken}`)
      .send({ participantId: bob.user.id });
    expect(roomRes.status).toBe(201);
    const roomId = roomRes.body.data.id as string;
    expect(roomRes.body.data.otherParticipantId).toBe(bob.user.id);

    // Fetching/creating again from the other side returns the same room.
    const roomAgain = await request(app)
      .post('/api/v1/chat/rooms')
      .set('Authorization', `Bearer ${bob.tokens.accessToken}`)
      .send({ participantId: alice.user.id });
    expect(roomAgain.body.data.id).toBe(roomId);

    const sendRes = await request(app)
      .post(`/api/v1/chat/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${alice.tokens.accessToken}`)
      .send({ text: 'Hello Bob' });
    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.text).toBe('Hello Bob');

    const bobRooms = await request(app)
      .get('/api/v1/chat/rooms')
      .set('Authorization', `Bearer ${bob.tokens.accessToken}`);
    expect(bobRooms.body.data[0].unreadCount).toBe(1);
    expect(bobRooms.body.data[0].lastMessagePreview).toBe('Hello Bob');

    const messages = await request(app)
      .get(`/api/v1/chat/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${bob.tokens.accessToken}`);
    expect(messages.body.data).toHaveLength(1);

    await request(app)
      .patch(`/api/v1/chat/rooms/${roomId}/read`)
      .set('Authorization', `Bearer ${bob.tokens.accessToken}`)
      .expect(200);

    const bobRoomsAfterRead = await request(app)
      .get('/api/v1/chat/rooms')
      .set('Authorization', `Bearer ${bob.tokens.accessToken}`);
    expect(bobRoomsAfterRead.body.data[0].unreadCount).toBe(0);
  });

  it('rejects access to a room by a non-participant', async () => {
    const alice = await signupAndVerify(app, { role: 'USER' });
    const bob = await signupAndVerify(app, { role: 'USER' });
    const stranger = await signupAndVerify(app, { role: 'USER' });

    const roomRes = await request(app)
      .post('/api/v1/chat/rooms')
      .set('Authorization', `Bearer ${alice.tokens.accessToken}`)
      .send({ participantId: bob.user.id });
    const roomId = roomRes.body.data.id as string;

    const res = await request(app)
      .post(`/api/v1/chat/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${stranger.tokens.accessToken}`)
      .send({ text: 'sneaky' });
    expect(res.status).toBe(403);
  });

  it('rejects an empty message with no text or image', async () => {
    const alice = await signupAndVerify(app, { role: 'USER' });
    const bob = await signupAndVerify(app, { role: 'USER' });

    const roomRes = await request(app)
      .post('/api/v1/chat/rooms')
      .set('Authorization', `Bearer ${alice.tokens.accessToken}`)
      .send({ participantId: bob.user.id });
    const roomId = roomRes.body.data.id as string;

    const res = await request(app)
      .post(`/api/v1/chat/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${alice.tokens.accessToken}`)
      .send({ text: '   ' });
    expect(res.status).toBe(400);
  });
});
