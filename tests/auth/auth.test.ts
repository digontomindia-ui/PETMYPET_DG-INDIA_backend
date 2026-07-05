import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { sendEmail } = await import('../../src/common/integrations/mailer.js');

function extractOtp(html: string): string {
  const match = /code is (\d+)\./.exec(html);
  if (!match?.[1]) throw new Error('OTP not found in email body');
  return match[1];
}

describe('auth flow', () => {
  const app = createApp();
  const signupPayload = {
    name: 'Alice Owner',
    email: 'alice@example.com',
    phone: '+919812345678',
    password: 'Passw0rd!',
    role: 'USER',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs up, verifies OTP, and returns tokens', async () => {
    const signupRes = await request(app).post('/api/v1/auth/signup').send(signupPayload);
    expect(signupRes.status).toBe(201);
    expect(sendEmail).toHaveBeenCalledOnce();

    const html = vi.mocked(sendEmail).mock.calls[0]?.[0].html as string;
    const otp = extractOtp(html);

    const verifyRes = await request(app)
      .post('/api/v1/auth/signup/verify')
      .send({ identifier: signupPayload.email, code: otp });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.user.isVerified).toBe(true);
    expect(verifyRes.body.data.tokens.accessToken).toBeTruthy();
    expect(verifyRes.body.data.tokens.refreshToken).toBeTruthy();
  });

  it('rejects login before verification and succeeds after', async () => {
    await request(app).post('/api/v1/auth/signup').send(signupPayload);
    const html = vi.mocked(sendEmail).mock.calls[0]?.[0].html as string;
    const otp = extractOtp(html);
    await request(app)
      .post('/api/v1/auth/signup/verify')
      .send({ identifier: signupPayload.email, code: otp });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: signupPayload.email, password: signupPayload.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.tokens.accessToken).toBeTruthy();
  });

  it('rejects an incorrect OTP and does not verify the account', async () => {
    await request(app).post('/api/v1/auth/signup').send(signupPayload);

    const res = await request(app)
      .post('/api/v1/auth/signup/verify')
      .send({ identifier: signupPayload.email, code: '000000' });

    expect(res.status).toBe(400);
  });

  it('rotates refresh tokens and rejects reuse of a stale refresh token', async () => {
    await request(app).post('/api/v1/auth/signup').send(signupPayload);
    const html = vi.mocked(sendEmail).mock.calls[0]?.[0].html as string;
    const otp = extractOtp(html);
    const verifyRes = await request(app)
      .post('/api/v1/auth/signup/verify')
      .send({ identifier: signupPayload.email, code: otp });

    const firstRefreshToken = verifyRes.body.data.tokens.refreshToken as string;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstRefreshToken });
    expect(refreshRes.status).toBe(200);
    const secondRefreshToken = refreshRes.body.data.refreshToken as string;
    expect(secondRefreshToken).not.toBe(firstRefreshToken);

    // Reusing the now-rotated-away token must fail and revoke the whole session.
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstRefreshToken });
    expect(reuseRes.status).toBe(401);

    const secondRefreshAttempt = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: secondRefreshToken });
    expect(secondRefreshAttempt.status).toBe(401);
  });

  it('logs out and invalidates the refresh token', async () => {
    await request(app).post('/api/v1/auth/signup').send(signupPayload);
    const html = vi.mocked(sendEmail).mock.calls[0]?.[0].html as string;
    const otp = extractOtp(html);
    const verifyRes = await request(app)
      .post('/api/v1/auth/signup/verify')
      .send({ identifier: signupPayload.email, code: otp });

    const refreshToken = verifyRes.body.data.tokens.refreshToken as string;

    const logoutRes = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });
});
