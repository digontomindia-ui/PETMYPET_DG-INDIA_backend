import type { Express } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { createAdmin, signupAndVerify } = await import('../helpers/auth.js');
const { createApprovedProviderWithService } = await import('../helpers/provider.js');

function futureDate(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

async function createCoupon(
  app: Express,
  adminToken: string,
  overrides: Record<string, unknown> = {},
) {
  const res = await request(app)
    .post('/api/v1/coupons')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      code: `SAVE10-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minBookingAmount: 0,
      perUserLimit: 1,
      validFrom: futureDate(-1),
      validUntil: futureDate(24),
      ...overrides,
    })
    .expect(201);
  return res.body.data as { code: string; id: string };
}

describe('coupons applied to bookings', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies a percentage discount to a booking and records the redemption', async () => {
    const admin = await createAdmin(app);
    const coupon = await createCoupon(app, admin.accessToken, {
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });
    const { providerId, serviceId } = await createApprovedProviderWithService(app, { price: 1000 });
    const user = await signupAndVerify(app, { role: 'USER' });

    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart: futureDate(2), couponCode: coupon.code });

    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body.data.discountAmount).toBe(100);
    expect(bookingRes.body.data.couponCode).toBe(coupon.code);

    // Using it again exceeds this user's perUserLimit of 1.
    const secondBooking = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart: futureDate(5), couponCode: coupon.code });
    expect(secondBooking.status).toBe(400);
  });

  it('rejects a coupon below its minimum booking amount', async () => {
    const admin = await createAdmin(app);
    const coupon = await createCoupon(app, admin.accessToken, { minBookingAmount: 5000 });
    const { providerId, serviceId } = await createApprovedProviderWithService(app, { price: 1000 });
    const user = await signupAndVerify(app, { role: 'USER' });

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart: futureDate(2), couponCode: coupon.code });

    expect(res.status).toBe(400);
  });

  it('enforces a global usage limit across different users', async () => {
    const admin = await createAdmin(app);
    const coupon = await createCoupon(app, admin.accessToken, { usageLimit: 1, perUserLimit: 5 });
    const { providerId, serviceId } = await createApprovedProviderWithService(app, { price: 1000 });
    const userA = await signupAndVerify(app, { role: 'USER' });
    const userB = await signupAndVerify(app, { role: 'USER' });

    const first = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userA.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart: futureDate(2), couponCode: coupon.code });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userB.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart: futureDate(6), couponCode: coupon.code });
    expect(second.status).toBe(400);
  });
});
