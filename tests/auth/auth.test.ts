import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { sendEmail } = await import('../../src/common/integrations/mailer.js');
const { sendSms } = await import('../../src/common/integrations/sms.js');

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
      .send({ identifier: signupPayload.email, password: signupPayload.password });

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

  // This is the real LogIn screen's flow (both apps): phone number only, no separate
  // signup form — a brand-new phone number gets an account auto-created right here.
  it('auto-creates an account on first OTP request for an unrecognized phone number, then logs in on verify', async () => {
    const phone = '+919900011122';

    const requestRes = await request(app)
      .post('/api/v1/auth/login/otp/request')
      .send({ identifier: phone });
    expect(requestRes.status).toBe(200);
    expect(requestRes.body.data.isRegistered).toBe(false);
    expect(sendSms).toHaveBeenCalledOnce();

    const message = vi.mocked(sendSms).mock.calls[0]?.[1] as string;
    const otp = extractOtp(message);

    const verifyRes = await request(app)
      .post('/api/v1/auth/login/otp/verify')
      .send({ identifier: phone, code: otp });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.user.phone).toBe(phone);
    expect(verifyRes.body.data.user.isVerified).toBe(true);
    expect(verifyRes.body.data.tokens.accessToken).toBeTruthy();
    // Onboarding (PUT /users/me setting a name) hasn't happened yet, so this must still be
    // false right after verify too — not just on the follow-up request below.
    expect(verifyRes.body.data.isRegistered).toBe(false);

    // A second OTP request for the same phone must not re-create anything, but since onboarding
    // was never completed, it must still route back to onboarding, not Home.
    const secondRequestRes = await request(app)
      .post('/api/v1/auth/login/otp/request')
      .send({ identifier: phone });
    expect(secondRequestRes.body.data.isRegistered).toBe(false);
  });

  // Regression test for the exact bug reported: a new user verifies OTP, closes the app before
  // finishing onboarding, then reopens it later — must be sent back into onboarding, not Home,
  // no matter how many more times they request/verify OTP for the same number in between.
  it('keeps routing to onboarding across repeated OTP request/verify cycles until PUT /users/me actually sets a name', async () => {
    const phone = '+919900033344';

    async function requestAndVerifyOtp() {
      const requestRes = await request(app)
        .post('/api/v1/auth/login/otp/request')
        .send({ identifier: phone });
      const message = vi.mocked(sendSms).mock.calls.at(-1)?.[1] as string;
      const otp = extractOtp(message);
      const verifyRes = await request(app)
        .post('/api/v1/auth/login/otp/verify')
        .send({ identifier: phone, code: otp });
      return { requestRes, verifyRes };
    }

    // First ever OTP cycle: brand-new account, no onboarding done yet.
    const first = await requestAndVerifyOtp();
    expect(first.requestRes.body.data.isRegistered).toBe(false);
    expect(first.verifyRes.body.data.isRegistered).toBe(false);
    const accessToken = first.verifyRes.body.data.tokens.accessToken as string;

    // "App closed mid-onboarding, reopened" — request/verify OTP again for the same number,
    // still without ever having called PUT /users/me. Must still say onboarding is needed.
    const second = await requestAndVerifyOtp();
    expect(second.requestRes.body.data.isRegistered).toBe(false);
    expect(second.verifyRes.body.data.isRegistered).toBe(false);

    // Now actually complete onboarding.
    await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'New User' })
      .expect(200);

    // From here on, isRegistered must be true.
    const third = await requestAndVerifyOtp();
    expect(third.requestRes.body.data.isRegistered).toBe(true);
    expect(third.verifyRes.body.data.isRegistered).toBe(true);
  });

  it('does not create an account for an unrecognized email identifier (auto-signup is phone-only)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login/otp/request')
      .send({ identifier: 'nobody-here@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.isRegistered).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
