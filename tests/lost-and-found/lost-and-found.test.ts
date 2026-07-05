import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { createAdmin, signupAndVerify } = await import('../helpers/auth.js');

describe('lost & found', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires admin approval before a post is publicly visible, then supports geo search', async () => {
    const reporter = await signupAndVerify(app, { role: 'USER' });
    const admin = await createAdmin(app);

    const createRes = await request(app)
      .post('/api/v1/lost-and-found')
      .set('Authorization', `Bearer ${reporter.tokens.accessToken}`)
      .send({
        type: 'LOST',
        petName: 'Rex',
        species: 'Dog',
        breed: 'Labrador',
        description: 'Lost near the park',
        coordinates: [72.8777, 19.076],
        contactPhone: '+919812345678',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.approvalStatus).toBe('PENDING');
    const postId = createRes.body.data.id as string;

    const publicListBefore = await request(app).get('/api/v1/lost-and-found?type=LOST');
    expect(publicListBefore.body.data).toHaveLength(0);

    const pendingList = await request(app)
      .get('/api/v1/lost-and-found/pending')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(pendingList.body.data).toHaveLength(1);

    await request(app)
      .patch(`/api/v1/lost-and-found/${postId}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const publicListAfter = await request(app).get('/api/v1/lost-and-found?type=LOST');
    expect(publicListAfter.body.data).toHaveLength(1);

    const geoSearch = await request(app).get(
      '/api/v1/lost-and-found?lat=19.076&lng=72.8777&radiusMeters=50000',
    );
    expect(geoSearch.body.data).toHaveLength(1);

    await request(app)
      .patch(`/api/v1/lost-and-found/${postId}/resolve`)
      .set('Authorization', `Bearer ${reporter.tokens.accessToken}`)
      .expect(200);

    const afterResolve = await request(app).get(`/api/v1/lost-and-found/${postId}`);
    expect(afterResolve.body.data.status).toBe('RESOLVED');
  });

  it('rejects a pending post and prevents it from ever going public', async () => {
    const reporter = await signupAndVerify(app, { role: 'USER' });
    const admin = await createAdmin(app);

    const createRes = await request(app)
      .post('/api/v1/lost-and-found')
      .set('Authorization', `Bearer ${reporter.tokens.accessToken}`)
      .send({
        type: 'FOUND',
        species: 'Cat',
        description: 'Found wandering',
        contactPhone: '+919812345678',
      });
    const postId = createRes.body.data.id as string;

    const rejectRes = await request(app)
      .patch(`/api/v1/lost-and-found/${postId}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Duplicate listing' });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.approvalStatus).toBe('REJECTED');

    const publicFetch = await request(app).get(`/api/v1/lost-and-found/${postId}`);
    expect(publicFetch.status).toBe(404);
  });
});
