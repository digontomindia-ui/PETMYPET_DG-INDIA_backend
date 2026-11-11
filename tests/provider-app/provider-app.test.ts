import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { sendSms } = await import('../../src/common/integrations/sms.js');
const { createAdmin } = await import('../helpers/auth.js');
const { ProviderModel } = await import('../../src/modules/providers/provider.schema.js');
const { UserModel } = await import('../../src/modules/users/user.schema.js');

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

    // A pending vendor can finish onboarding but is gated out of the dashboard until approved.
    const pendingHome = await request(app)
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${token}`);
    expect(pendingHome.status).toBe(403);
    expect(pendingHome.body.details).toMatchObject({ kycStatus: 'PENDING' });

    // Admin approves KYC, which unlocks the dashboard.
    const provider = await ProviderModel.findOne({}).exec();
    const admin = await createAdmin(app);
    await request(app)
      .patch(`/api/v1/providers/${provider?._id.toString()}/kyc/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const homeRes = await request(app).get('/api/v1/home').set('Authorization', `Bearer ${token}`);
    expect(homeRes.status).toBe(200);
    expect(homeRes.body.success).toBe(true);
  });

  it('lets a number abandoned at OTP re-register as a different type, and hides the shell from admin', async () => {
    const phone = '+919812345010';
    const latestOtp = () => extractOtp(vi.mocked(sendSms).mock.calls.at(-1)?.[1] as string);

    // Sign up + verify as a groomer, then stop — no document upload (onboarding abandoned).
    await request(app).post('/api/v1/signin-signup').send({ role: 'pet-groomer', phone }).expect(200);
    await request(app)
      .post('/api/v1/verify-otp')
      .send({ role: 'pet-groomer', phone, otp: latestOtp() })
      .expect(200);

    // The shell exists with the placeholder name and the groomer type.
    const shell = await ProviderModel.findOne({}).exec();
    expect(shell?.providerType).toBe('GROOMER');
    expect(shell?.businessName).toBe('Pending onboarding');

    // Admin directory hides the shell (it's not a real vendor yet).
    const admin = await createAdmin(app);
    const list = await request(app)
      .get('/api/v1/admin/providers')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(list.body.data.some((p: { id: string }) => p.id === shell?._id.toString())).toBe(false);

    // Same number re-registers as a trainer — no "already registered" conflict.
    await request(app).post('/api/v1/signin-signup').send({ role: 'dogs-trainer', phone }).expect(200);
    await request(app)
      .post('/api/v1/verify-otp')
      .send({ role: 'dogs-trainer', phone, otp: latestOtp() })
      .expect(200);

    // The shell was retyped to TRAINER (not duplicated).
    const providers = await ProviderModel.find({}).exec();
    expect(providers).toHaveLength(1);
    expect(providers[0]?.providerType).toBe('TRAINER');
  });

  it('onboards a boarding provider with its role-specific fields and rejects missing details', async () => {
    const phone = '+919812345020';
    const latestOtp = () => extractOtp(vi.mocked(sendSms).mock.calls.at(-1)?.[1] as string);

    await request(app).post('/api/v1/signin-signup').send({ role: 'boarding-center', phone }).expect(200);
    const verify = await request(app)
      .post('/api/v1/verify-otp')
      .send({ role: 'boarding-center', phone, otp: latestOtp() })
      .expect(200);
    const token = verify.body.token as string;

    // Boarding requires name + address + founded + details — omitting them is rejected.
    await request(app)
      .post('/api/v1/upload-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ boarding_name: 'Happy Paws' })
      .expect(400);

    // Full boarding onboarding succeeds and stores the founded year.
    await request(app)
      .post('/api/v1/upload-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        boarding_name: 'Happy Paws Boarding',
        description: 'Spacious, air-conditioned kennels',
        founded: '2015',
        location: { address: '12 MG Road, Bengaluru', longtude: 77.6, latatude: 12.9 },
        documents: { adhar_card: 'https://example.com/a.pdf', pan_card: 'https://example.com/p.pdf' },
      })
      .expect(201);

    const provider = await ProviderModel.findOne({ providerType: 'BOARDING' }).exec();
    expect(provider?.businessName).toBe('Happy Paws Boarding');
    expect(provider?.metadata.boarding?.foundedYear).toBe(2015);
    // The person's name is mirrored from the boarding name, so admin never shows "No name yet".
    const user = await UserModel.findById(provider?.userId).exec();
    expect(user?.name).toBe('Happy Paws Boarding');
  });

  it('rejects a groomer onboarding that is missing a required detail (bio)', async () => {
    const phone = '+919812345030';
    const latestOtp = () => extractOtp(vi.mocked(sendSms).mock.calls.at(-1)?.[1] as string);

    await request(app).post('/api/v1/signin-signup').send({ role: 'pet-groomer', phone }).expect(200);
    const verify = await request(app)
      .post('/api/v1/verify-otp')
      .send({ role: 'pet-groomer', phone, otp: latestOtp() })
      .expect(200);

    await request(app)
      .post('/api/v1/upload-documents')
      .set('Authorization', `Bearer ${verify.body.token as string}`)
      .send({ name: 'Ravi', experience: 3, email: 'ravi@example.com' }) // no bio
      .expect(400);
  });

  it('rejects KYC documents sent as local device paths instead of uploaded URLs', async () => {
    const phone = '+919812345040';
    const latestOtp = () => extractOtp(vi.mocked(sendSms).mock.calls.at(-1)?.[1] as string);

    await request(app).post('/api/v1/signin-signup').send({ role: 'pet-groomer', phone }).expect(200);
    const verify = await request(app)
      .post('/api/v1/verify-otp')
      .send({ role: 'pet-groomer', phone, otp: latestOtp() })
      .expect(200);
    const token = verify.body.token as string;

    // A phone's local file path is not a usable document URL — must be rejected.
    await request(app)
      .post('/api/v1/upload-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Ravi',
        experience: 3,
        email: 'ravi@example.com',
        bio: 'Groomer',
        documents: {
          adhar_card: '/data/user/0/com.example.app/cache/scaled_abc.jpg',
          pan_card: '/data/user/0/com.example.app/cache/scaled_def.jpg',
        },
      })
      .expect(400);

    // An uploaded (https) URL is accepted.
    await request(app)
      .post('/api/v1/upload-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Ravi',
        experience: 3,
        email: 'ravi@example.com',
        bio: 'Groomer',
        documents: {
          adhar_card: 'https://patmypets-uploads.b-cdn.net/patmypets/kyc-documents/a.jpg',
          pan_card: 'https://patmypets-uploads.b-cdn.net/patmypets/kyc-documents/p.jpg',
        },
      })
      .expect(201);
  });
});
