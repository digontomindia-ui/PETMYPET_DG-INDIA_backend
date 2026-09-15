import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { sendSms } = await import('../../src/common/integrations/sms.js');

function extractOtp(message: string): string {
  const match = /code is (\d+)\./.exec(message);
  if (!match?.[1]) throw new Error('OTP not found in SMS body');
  return match[1];
}

describe('provider app', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs up a new groomer, verifies OTP, submits documents, and loads the home screen', async () => {
    const phone = '+919609226659';

    const signinRes = await request(app)
      .post('/api/v1/signin-signup')
      .send({ role: 'pet-groomer', phone });
    expect(signinRes.status).toBe(200);
    expect(sendSms).toHaveBeenCalledOnce();

    const message = vi.mocked(sendSms).mock.calls[0]?.[1] as string;
    const otp = extractOtp(message);

    const verifyRes = await request(app)
      .post('/api/v1/verify-otp')
      .send({ role: 'pet-groomer', phone, otp });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.isDocumentSubmited).toBe(false);
    expect(verifyRes.body.isDocumentApproved).toBe(false);
    const token = verifyRes.body.token as string;
    expect(token).toBeTruthy();

    const uploadRes = await request(app)
      .post('/api/v1/upload-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Ravi Groomer',
        experience: 5,
        email: 'ravi.groomer@example.com',
        bio: 'Loves dogs',
        profile_image: 'https://example.com/profile.jpg',
        documents: { adhar_card: 'https://example.com/adhar.pdf', pan_card: 'https://example.com/pan.pdf' },
      });
    expect(uploadRes.status).toBe(201);

    const homeRes = await request(app).get('/api/v1/home').set('Authorization', `Bearer ${token}`);
    expect(homeRes.status).toBe(200);
    expect(homeRes.body.success).toBe(true);
  });
});
