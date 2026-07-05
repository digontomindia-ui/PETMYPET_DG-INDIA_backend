import type { Express } from 'express';
import request from 'supertest';
import { vi } from 'vitest';

interface SignupOverrides {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: 'USER' | 'SERVICE_PROVIDER';
}

let counter = 0;

export async function signupAndVerify(app: Express, overrides: SignupOverrides = {}) {
  counter += 1;
  const payload = {
    name: overrides.name ?? `Test User ${counter}`,
    email: overrides.email ?? `test-user-${counter}@example.com`,
    phone: overrides.phone ?? `+9198${String(10000000 + counter).slice(0, 8)}`,
    password: overrides.password ?? 'Passw0rd!',
    role: overrides.role ?? 'USER',
  };

  const mailer = await import('../../src/common/integrations/mailer.js');
  await request(app).post('/api/v1/auth/signup').send(payload).expect(201);

  const calls = vi.mocked(mailer.sendEmail).mock.calls;
  const lastCall = calls[calls.length - 1];
  if (!lastCall) throw new Error('sendEmail was not called during signup');
  const html = lastCall[0].html;
  const match = /code is (\d+)\./.exec(html);
  if (!match?.[1]) throw new Error('OTP not found in email body');

  const verifyRes = await request(app)
    .post('/api/v1/auth/signup/verify')
    .send({ identifier: payload.email, code: match[1] })
    .expect(200);

  return {
    payload,
    user: verifyRes.body.data.user as { id: string; role: string },
    tokens: verifyRes.body.data.tokens as { accessToken: string; refreshToken: string },
  };
}
