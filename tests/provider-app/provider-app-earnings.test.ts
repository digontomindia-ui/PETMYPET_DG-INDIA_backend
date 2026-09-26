import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');
const { createApprovedProviderWithService } = await import('../helpers/provider.js');
const { completeBooking } = await import('../helpers/booking.js');
const { walletService } = await import('../../src/modules/wallet/wallet.service.js');
const { WALLET_TRANSACTION_REASONS } = await import('../../src/modules/wallet/wallet.constants.js');

describe('provider app: earnings, withdrawals, reviews, admin payouts', () => {
  const app = createApp();

  it('credits online-paid completed bookings to the provider wallet once, and runs the withdraw → admin reject/paid flow', async () => {
    const { providerAccount, providerId, serviceId, adminToken } = await createApprovedProviderWithService(app);
    const providerToken = providerAccount.tokens.accessToken;
    const customer = await signupAndVerify(app, { role: 'USER' });
    const customerToken = customer.tokens.accessToken;

    const bookingId = await completeBooking(app, customerToken, providerToken, providerId, serviceId);

    // Unpaid completion: counted as earnings, nothing in the wallet yet.
    let earnings = await request(app).get('/api/v1/earnings').set('Authorization', `Bearer ${providerToken}`);
    expect(earnings.status).toBe(200);
    expect(earnings.body.data.wallet_balance).toBe(0);
    expect(earnings.body.data.chart).toHaveLength(7);
    const payout = earnings.body.data.transactions[0].earning as number;
    expect(payout).toBeGreaterThan(0);
    expect(earnings.body.data.summary.today).toBe(payout);

    // Customer pays from wallet after completion → provider credited exactly once.
    await walletService.credit(customer.user.id, 5000, WALLET_TRANSACTION_REASONS.TOPUP, null, 'test');
    await request(app)
      .post(`/api/v1/payments/bookings/${bookingId}/order`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ method: 'WALLET' })
      .expect(201);

    earnings = await request(app).get('/api/v1/earnings').set('Authorization', `Bearer ${providerToken}`);
    expect(earnings.body.data.wallet_balance).toBe(payout);
    expect(earnings.body.data.transactions[0]).toMatchObject({ credited_to_wallet: true, payment_method: 'WALLET' });

    // Withdraw needs a bank account.
    await request(app)
      .post('/api/v1/earnings/withdraw')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ amount: 100 })
      .expect(400);
    await request(app)
      .put('/api/v1/profile/bank-account')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        account_holder_name: 'Test Groomer',
        bank_name: 'HDFC Bank',
        account_number: '50100482910394',
        confirm_account_number: '50100482910395',
        ifsc_code: 'HDFC0000452',
      })
      .expect(400); // mismatch
    const bank = await request(app)
      .put('/api/v1/profile/bank-account')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        account_holder_name: 'Test Groomer',
        bank_name: 'HDFC Bank',
        account_number: '50100482910394',
        confirm_account_number: '50100482910394',
        ifsc_code: 'hdfc0000452',
      })
      .expect(200);
    expect(bank.body.data.bank_account).toMatchObject({ account_number_last4: '0394', ifsc_code: 'HDFC0000452' });
    expect(JSON.stringify(bank.body)).not.toContain('50100482910394');

    const withdraw = await request(app)
      .post('/api/v1/earnings/withdraw')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ amount: 100 })
      .expect(201);
    expect(withdraw.body.data.wallet_balance).toBe(payout - 100);
    await request(app)
      .post('/api/v1/earnings/withdraw')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ amount: payout * 10 })
      .expect(400); // insufficient

    const queue = await request(app)
      .get('/api/v1/admin/payouts?status=REQUESTED')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const payoutRow = queue.body.data.find((p: { userId: string }) => p.userId === providerAccount.user.id);
    expect(payoutRow.bankAccount.accountNumber).toBe('50100482910394');

    await request(app)
      .patch(`/api/v1/admin/payouts/${payoutRow.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Bank details unverifiable' })
      .expect(200);
    // Second settle attempt must not double-credit.
    await request(app)
      .patch(`/api/v1/admin/payouts/${payoutRow.id}/mark-paid`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ referenceNumber: 'UTR123' })
      .expect(400);

    earnings = await request(app).get('/api/v1/earnings').set('Authorization', `Bearer ${providerToken}`);
    expect(earnings.body.data.wallet_balance).toBe(payout);

    const history = await request(app)
      .get('/api/v1/earnings/withdrawals')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);
    expect(history.body.data.withdrawals[0]).toMatchObject({ status: 'REJECTED', adminNote: 'Bank details unverifiable' });
  });

  it('shows reviews with summary, lets the provider reply, and lets admin delete (rating recomputed)', async () => {
    const { providerAccount, providerId, serviceId, adminToken } = await createApprovedProviderWithService(app);
    const providerToken = providerAccount.tokens.accessToken;
    const customer = await signupAndVerify(app, { role: 'USER' });
    const bookingId = await completeBooking(app, customer.tokens.accessToken, providerToken, providerId, serviceId);

    await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customer.tokens.accessToken}`)
      .send({ bookingId, rating: 4, comment: 'Good job' })
      .expect(201);

    const reviews = await request(app)
      .get('/api/v1/reviews-ratings')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);
    expect(reviews.body.data.summary).toMatchObject({ average_rating: 4, total_reviews: 1 });
    expect(reviews.body.data.summary.breakdown.find((b: { star: number }) => b.star === 4).percentage).toBe(100);
    const reviewId = reviews.body.data.reviews[0].id as string;
    expect(reviews.body.data.reviews[0].service_name).toBe('Full Grooming Package');

    await request(app)
      .post(`/api/v1/reviews-ratings/${reviewId}/reply`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ reply: 'Thank you!' })
      .expect(200);
    const publicReviews = await request(app).get(`/api/v1/reviews?providerId=${providerId}`).expect(200);
    expect(publicReviews.body.data[0].reply.text).toBe('Thank you!');

    // Another provider can't reply to it.
    const other = await createApprovedProviderWithService(app);
    await request(app)
      .post(`/api/v1/reviews-ratings/${reviewId}/reply`)
      .set('Authorization', `Bearer ${other.providerAccount.tokens.accessToken}`)
      .send({ reply: 'Hijack' })
      .expect(404);

    await request(app)
      .delete(`/api/v1/admin/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const provider = await request(app)
      .get(`/api/v1/admin/providers/${providerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(provider.body.data).toMatchObject({ rating: 0, ratingCount: 0 });
    expect(provider.body.data.stats.completedBookings).toBe(1);
  });

  it('admin suspension hides the provider and blocks self-reactivation', async () => {
    const { providerAccount, providerId, adminToken } = await createApprovedProviderWithService(app);
    await request(app)
      .patch(`/api/v1/admin/providers/${providerId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false, reason: 'Complaints' })
      .expect(200);
    await request(app)
      .patch('/api/v1/providers/me/active')
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`)
      .send({ isActive: true })
      .expect(403);
    const list = await request(app)
      .get('/api/v1/admin/providers?isActive=false')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body.data.some((p: { id: string }) => p.id === providerId)).toBe(true);
  });
});
