import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { createAdmin, signupAndVerify } = await import('../helpers/auth.js');

describe('provider profile lifecycle', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets a service provider create a profile pending KYC, then admin approves it and it becomes searchable nearby', async () => {
    const provider = await signupAndVerify(app, { role: 'SERVICE_PROVIDER' });

    const createRes = await request(app)
      .post('/api/v1/providers/me')
      .set('Authorization', `Bearer ${provider.tokens.accessToken}`)
      .send({
        providerType: 'GROOMER',
        businessName: 'Bubbles Grooming',
        address: '221B Baker Street, Mumbai',
        coordinates: [72.8777, 19.076],
        zoneIds: [],
        workingHours: [],
        metadata: { groomer: { specializations: ['dog', 'cat'] } },
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.kycStatus).toBe('PENDING');

    // Not yet visible in nearby search: KYC is still pending.
    const nearbyBeforeApproval = await request(app).get(
      '/api/v1/providers/nearby?lat=19.076&lng=72.8777&radiusMeters=50000',
    );
    expect(nearbyBeforeApproval.body.data).toHaveLength(0);

    const admin = await createAdmin(app);
    const adminToken = admin.accessToken;

    const pendingList = await request(app)
      .get('/api/v1/providers/pending-kyc')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingList.body.data).toHaveLength(1);

    const providerId = createRes.body.data.id as string;
    const approveRes = await request(app)
      .patch(`/api/v1/providers/${providerId}/kyc/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.kycStatus).toBe('APPROVED');

    const nearbyAfterApproval = await request(app).get(
      '/api/v1/providers/nearby?lat=19.076&lng=72.8777&radiusMeters=50000',
    );
    expect(nearbyAfterApproval.body.data).toHaveLength(1);
    expect(nearbyAfterApproval.body.data[0].id).toBe(providerId);
  });

  it('rejects creating more than one provider profile per account', async () => {
    const provider = await signupAndVerify(app, { role: 'SERVICE_PROVIDER' });
    const body = {
      providerType: 'VET',
      businessName: 'City Vet Clinic',
      address: 'Some address',
      coordinates: [72.8, 19.0],
      zoneIds: [],
      workingHours: [],
      metadata: { vet: { consultationFee: 500, licenseNumber: 'VET-123', specializations: [] } },
    };

    await request(app)
      .post('/api/v1/providers/me')
      .set('Authorization', `Bearer ${provider.tokens.accessToken}`)
      .send(body)
      .expect(201);

    const secondAttempt = await request(app)
      .post('/api/v1/providers/me')
      .set('Authorization', `Bearer ${provider.tokens.accessToken}`)
      .send(body);

    expect(secondAttempt.status).toBe(409);
  });

  it('rejects a USER account trying to create a provider profile', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });

    const res = await request(app)
      .post('/api/v1/providers/me')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({
        providerType: 'GROOMER',
        businessName: 'Should Fail',
        address: 'Nowhere',
        coordinates: [72.8, 19.0],
        zoneIds: [],
        workingHours: [],
        metadata: {},
      });

    expect(res.status).toBe(403);
  });
});
