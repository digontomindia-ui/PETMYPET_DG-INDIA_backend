import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { createAdmin, signupAndVerify } = await import('../helpers/auth.js');

describe('support tickets', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a ticket, exchanges messages, and lets an admin update its status', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const stranger = await signupAndVerify(app, { role: 'USER' });
    const admin = await createAdmin(app);

    const createRes = await request(app)
      .post('/api/v1/support-tickets')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ subject: 'Payment issue', message: 'My payment failed twice', priority: 'HIGH' });
    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.data.id as string;

    const strangerAccess = await request(app)
      .get(`/api/v1/support-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${stranger.tokens.accessToken}`);
    expect(strangerAccess.status).toBe(403);

    const detail = await request(app)
      .get(`/api/v1/support-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(detail.body.data.messages).toHaveLength(1);

    await request(app)
      .post(`/api/v1/support-tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ content: "We're looking into it" })
      .expect(201);

    const detailAfterReply = await request(app)
      .get(`/api/v1/support-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(detailAfterReply.body.data.messages).toHaveLength(2);

    const adminList = await request(app)
      .get('/api/v1/support-tickets/admin?status=OPEN')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminList.body.data).toHaveLength(1);

    const statusRes = await request(app)
      .patch(`/api/v1/support-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'RESOLVED' });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('RESOLVED');

    const userStatusChangeAttempt = await request(app)
      .patch(`/api/v1/support-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ status: 'CLOSED' });
    expect(userStatusChangeAttempt.status).toBe(403);
  });
});
