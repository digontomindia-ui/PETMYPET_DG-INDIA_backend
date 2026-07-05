import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { createAdmin, signupAndVerify } = await import('../helpers/auth.js');
const { createApprovedProviderWithService } = await import('../helpers/provider.js');

describe('analytics', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admin access and reports an overview reflecting real data', async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app, { price: 400 });
    const user = await signupAndVerify(app, { role: 'USER' });
    const admin = await createAdmin(app);

    const userAttempt = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(userAttempt.status).toBe(403);

    await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({
        providerId,
        serviceId,
        scheduledStart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const overviewRes = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.totalBookings).toBeGreaterThanOrEqual(1);
    expect(overviewRes.body.data.activeBookings).toBeGreaterThanOrEqual(1);

    const topServicesRes = await request(app)
      .get('/api/v1/analytics/top-services')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(topServicesRes.status).toBe(200);
    expect(topServicesRes.body.data.length).toBeGreaterThan(0);

    const growthRes = await request(app)
      .get('/api/v1/analytics/user-growth')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(growthRes.status).toBe(200);
    expect(Array.isArray(growthRes.body.data)).toBe(true);
  });
});
