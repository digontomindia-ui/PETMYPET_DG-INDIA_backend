import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');
const { createApprovedProviderWithService } = await import('../helpers/provider.js');

function futureDate(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

describe('notifications', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('notifies the provider when a booking is created and the user when it is accepted', async () => {
    const { providerAccount, providerId, serviceId } = await createApprovedProviderWithService(app);
    const user = await signupAndVerify(app, { role: 'USER' });

    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart: futureDate(2) })
      .expect(201);
    const bookingId = bookingRes.body.data.id as string;

    const providerNotifications = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`);
    // The provider also received a KYC_APPROVED notification when the helper approved them.
    const providerNotificationList = providerNotifications.body.data.notifications as { type: string }[];
    const types = providerNotificationList.map((n) => n.type);
    expect(types).toContain('BOOKING_CREATED');
    expect(types).toContain('KYC_APPROVED');

    await request(app)
      .patch(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`)
      .expect(200);

    const userNotifications = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(userNotifications.body.data.notifications).toHaveLength(1);
    expect(userNotifications.body.data.notifications[0].type).toBe('BOOKING_ACCEPTED');

    const notificationId = userNotifications.body.data.notifications[0].id as string;
    const markReadRes = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(markReadRes.status).toBe(200);
    expect(markReadRes.body.data.isRead).toBe(true);

    const afterRead = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(afterRead.body.data.unreadCount).toBe(0);
  });
});
