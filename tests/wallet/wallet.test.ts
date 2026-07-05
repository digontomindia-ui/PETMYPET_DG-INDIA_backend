import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');
const { walletService } = await import('../../src/modules/wallet/wallet.service.js');
const { WALLET_TRANSACTION_REASONS } = await import('../../src/modules/wallet/wallet.constants.js');

describe('wallet', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts at zero balance and reflects credits/debits with a running ledger', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });

    const initial = await request(app)
      .get('/api/v1/wallet/me')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(initial.body.data.balance).toBe(0);

    await walletService.credit(user.user.id, 500, WALLET_TRANSACTION_REASONS.BOOKING_REFUND, null, 'refund');
    await walletService.debit(user.user.id, 200, WALLET_TRANSACTION_REASONS.BOOKING_PAYMENT, null, 'paid');

    const after = await request(app)
      .get('/api/v1/wallet/me')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(after.body.data.balance).toBe(300);

    const history = await request(app)
      .get('/api/v1/wallet/me/transactions')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(history.body.data).toHaveLength(2);
    expect(history.body.data[0].type).toBe('DEBIT');
    expect(history.body.data[0].balanceAfter).toBe(300);
    expect(history.body.data[1].type).toBe('CREDIT');
    expect(history.body.data[1].balanceAfter).toBe(500);
  });

  it('rejects a debit that would overdraw the wallet, leaving the balance unchanged', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    await walletService.credit(user.user.id, 100, WALLET_TRANSACTION_REASONS.TOPUP);

    await expect(
      walletService.debit(user.user.id, 150, WALLET_TRANSACTION_REASONS.BOOKING_PAYMENT),
    ).rejects.toThrow(/insufficient/i);

    const balance = await walletService.getBalance(user.user.id);
    expect(balance.balance).toBe(100);
  });

  it('only allows one of two concurrent debits that would jointly overdraw the wallet', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    await walletService.credit(user.user.id, 100, WALLET_TRANSACTION_REASONS.TOPUP);

    const results = await Promise.allSettled([
      walletService.debit(user.user.id, 80, WALLET_TRANSACTION_REASONS.BOOKING_PAYMENT),
      walletService.debit(user.user.id, 80, WALLET_TRANSACTION_REASONS.BOOKING_PAYMENT),
    ]);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const balance = await walletService.getBalance(user.user.id);
    expect(balance.balance).toBe(20);
  });

  it('lets a super admin manually adjust a wallet', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const admin = await signupAndVerify(app, { role: 'USER' });
    const { UserModel } = await import('../../src/modules/users/user.schema.js');
    await UserModel.updateOne({ _id: admin.user.id }, { role: 'SUPER_ADMIN' });
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: admin.payload.email, password: admin.payload.password })
      .expect(200);
    const adminToken = adminLogin.body.data.tokens.accessToken as string;

    const res = await request(app)
      .post(`/api/v1/wallet/admin/${user.user.id}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'CREDIT', amount: 250, description: 'goodwill credit' });

    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe(250);
  });
});
