import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');
const { createApprovedProviderWithService } = await import('../helpers/provider.js');
const { completeBooking } = await import('../helpers/booking.js');

describe('reviews', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets a user review a completed booking and updates the provider rating', async () => {
    const { providerAccount, providerId, serviceId } = await createApprovedProviderWithService(app);
    const user = await signupAndVerify(app, { role: 'USER' });

    const bookingId = await completeBooking(
      app,
      user.tokens.accessToken,
      providerAccount.tokens.accessToken,
      providerId,
      serviceId,
    );

    const reviewRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ bookingId, rating: 4, comment: 'Great service!' });
    expect(reviewRes.status).toBe(201);

    const duplicateReview = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ bookingId, rating: 5, comment: 'Again?' });
    expect(duplicateReview.status).toBe(409);

    const providerRes = await request(app).get(`/api/v1/providers/${providerId}`);
    expect(providerRes.body.data.rating).toBe(4);
    expect(providerRes.body.data.ratingCount).toBe(1);

    const listRes = await request(app).get(`/api/v1/reviews?providerId=${providerId}`);
    expect(listRes.body.data).toHaveLength(1);
  });

  it('rejects a review for a booking that is not completed', async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app);
    const user = await signupAndVerify(app, { role: 'USER' });

    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({
        providerId,
        serviceId,
        scheduledStart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    const bookingId = bookingRes.body.data.id as string;

    const reviewRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ bookingId, rating: 3, comment: 'Too soon' });
    expect(reviewRes.status).toBe(400);
  });
});
