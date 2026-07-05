import type { Express } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));
vi.mock('../../src/common/integrations/razorpay.js', () => ({
  getRazorpayClient: vi.fn(() => ({
    orders: { create: vi.fn(() => ({ id: 'order_fake_123' })) },
    payments: { refund: vi.fn(() => ({ id: 'rfnd_fake_123' })) },
  })),
  verifyWebhookSignature: vi.fn(() => true),
}));

const { createApp } = await import('../../src/app.js');
const { createAdmin, signupAndVerify } = await import('../helpers/auth.js');
const { createApprovedProviderWithService } = await import('../helpers/provider.js');
const { walletService } = await import('../../src/modules/wallet/wallet.service.js');
const { WALLET_TRANSACTION_REASONS } = await import('../../src/modules/wallet/wallet.constants.js');
const { PaymentModel } = await import('../../src/modules/payments/payment.schema.js');

function futureDate(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

async function createBooking(
  app: Express,
  userToken: string,
  providerId: string,
  serviceId: string,
) {
  const res = await request(app)
    .post('/api/v1/bookings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ providerId, serviceId, scheduledStart: futureDate(2) })
    .expect(201);
  return res.body.data as { id: string; price: number };
}

describe('payments', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pays for a booking from the wallet and marks it paid', async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app, { price: 800 });
    const user = await signupAndVerify(app, { role: 'USER' });
    await walletService.credit(user.user.id, 1000, WALLET_TRANSACTION_REASONS.TOPUP);

    const booking = await createBooking(app, user.tokens.accessToken, providerId, serviceId);

    const payRes = await request(app)
      .post(`/api/v1/payments/bookings/${booking.id}/order`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ method: 'WALLET' });

    expect(payRes.status).toBe(201);
    expect(payRes.body.data.payment.status).toBe('CAPTURED');

    const walletBalance = await walletService.getBalance(user.user.id);
    expect(walletBalance.balance).toBe(200);

    const bookingCheck = await request(app)
      .get(`/api/v1/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(bookingCheck.body.data.paymentStatus).toBe('PAID');
  });

  it('rejects a wallet payment when the balance is insufficient', async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app, { price: 800 });
    const user = await signupAndVerify(app, { role: 'USER' });

    const booking = await createBooking(app, user.tokens.accessToken, providerId, serviceId);

    const payRes = await request(app)
      .post(`/api/v1/payments/bookings/${booking.id}/order`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ method: 'WALLET' });

    expect(payRes.status).toBe(400);
  });

  it('creates a pending cash payment and lets the assigned provider mark it collected', async () => {
    const { providerAccount, providerId, serviceId } = await createApprovedProviderWithService(
      app,
      { price: 500 },
    );
    const user = await signupAndVerify(app, { role: 'USER' });
    const booking = await createBooking(app, user.tokens.accessToken, providerId, serviceId);

    const orderRes = await request(app)
      .post(`/api/v1/payments/bookings/${booking.id}/order`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ method: 'CASH' });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.payment.status).toBe('CREATED');
    const paymentId = orderRes.body.data.payment.id as string;

    const strangerProvider = await signupAndVerify(app, { role: 'SERVICE_PROVIDER' });
    const strangerAttempt = await request(app)
      .patch(`/api/v1/payments/${paymentId}/mark-cash-collected`)
      .set('Authorization', `Bearer ${strangerProvider.tokens.accessToken}`);
    expect(strangerAttempt.status).toBe(403);

    const collectRes = await request(app)
      .patch(`/api/v1/payments/${paymentId}/mark-cash-collected`)
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`);
    expect(collectRes.status).toBe(200);
    expect(collectRes.body.data.status).toBe('CAPTURED');
  });

  it('captures a Razorpay payment via the webhook and reflects it on the booking', async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app, { price: 1200 });
    const user = await signupAndVerify(app, { role: 'USER' });
    const booking = await createBooking(app, user.tokens.accessToken, providerId, serviceId);

    const orderRes = await request(app)
      .post(`/api/v1/payments/bookings/${booking.id}/order`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ method: 'RAZORPAY' });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.razorpayOrderId).toBe('order_fake_123');

    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_fake_123', order_id: 'order_fake_123' } } },
    });

    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'fake-signature')
      .send(webhookPayload);
    expect(webhookRes.status).toBe(200);

    const payment = await PaymentModel.findOne({ razorpayOrderId: 'order_fake_123' });
    expect(payment?.status).toBe('CAPTURED');

    const bookingCheck = await request(app)
      .get(`/api/v1/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(bookingCheck.body.data.paymentStatus).toBe('PAID');
  });

  it('refunds a wallet-paid, cancelled booking back to the wallet', async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app, { price: 600 });
    const user = await signupAndVerify(app, { role: 'USER' });
    await walletService.credit(user.user.id, 600, WALLET_TRANSACTION_REASONS.TOPUP);
    const booking = await createBooking(app, user.tokens.accessToken, providerId, serviceId);

    await request(app)
      .post(`/api/v1/payments/bookings/${booking.id}/order`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ method: 'WALLET' })
      .expect(201);

    await request(app)
      .patch(`/api/v1/bookings/${booking.id}/cancel`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ reason: 'change of plans' })
      .expect(200);

    const admin = await createAdmin(app);
    const refundRes = await request(app)
      .post(`/api/v1/payments/bookings/${booking.id}/refund`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(refundRes.status).toBe(200);
    expect(refundRes.body.data.status).toBe('REFUNDED');

    const walletBalance = await walletService.getBalance(user.user.id);
    expect(walletBalance.balance).toBe(600);

    const bookingCheck = await request(app)
      .get(`/api/v1/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(bookingCheck.body.data.status).toBe('REFUNDED');
  });
});
