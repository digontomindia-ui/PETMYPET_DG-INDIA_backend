import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify, createAdmin } = await import('../helpers/auth.js');

describe('cities and zones', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets an admin create a city and rejects non-admins', async () => {
    const admin = await createAdmin(app);
    const user = await signupAndVerify(app, { role: 'USER' });

    const forbiddenRes = await request(app)
      .post('/api/v1/cities')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ name: 'Mumbai', state: 'Maharashtra' });
    expect(forbiddenRes.status).toBe(403);

    const createRes = await request(app)
      .post('/api/v1/cities')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Mumbai', state: 'Maharashtra' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Mumbai');
    expect(createRes.body.data.country).toBe('India');
    expect(createRes.body.data.isActive).toBe(true);

    const cityId = createRes.body.data.id as string;

    const listRes = await request(app).get('/api/v1/cities');
    expect(listRes.status).toBe(200);
    const cities = listRes.body.data as { id: string }[];
    expect(cities.some((city) => city.id === cityId)).toBe(true);

    const getRes = await request(app).get(`/api/v1/cities/${cityId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(cityId);

    const updateRes = await request(app)
      .put(`/api/v1/cities/${cityId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isActive: false });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.isActive).toBe(false);

    const deleteRes = await request(app)
      .delete(`/api/v1/cities/${cityId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteRes.status).toBe(200);

    const getAfterDeleteRes = await request(app).get(`/api/v1/cities/${cityId}`);
    expect(getAfterDeleteRes.status).toBe(404);
  });

  it('lets an admin create a zone and find it via nearby search', async () => {
    const admin = await createAdmin(app);

    const cityRes = await request(app)
      .post('/api/v1/cities')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Pune', state: 'Maharashtra' })
      .expect(201);
    const cityId = cityRes.body.data.id as string;

    const zoneRes = await request(app)
      .post('/api/v1/zones')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Koregaon Park',
        cityId,
        coordinates: [73.8993, 18.5362],
        radiusMeters: 3000,
      });
    expect(zoneRes.status).toBe(201);
    expect(zoneRes.body.data.cityId).toBe(cityId);
    const zoneId = zoneRes.body.data.id as string;

    const listRes = await request(app).get('/api/v1/zones');
    expect(listRes.status).toBe(200);
    const zones = listRes.body.data as { id: string }[];
    expect(zones.some((zone) => zone.id === zoneId)).toBe(true);

    const nearbyRes = await request(app).get('/api/v1/zones/nearby?lat=18.5362&lng=73.8993');
    expect(nearbyRes.status).toBe(200);
    const nearbyZones = nearbyRes.body.data as { id: string }[];
    expect(nearbyZones.some((zone) => zone.id === zoneId)).toBe(true);

    const updateRes = await request(app)
      .put(`/api/v1/zones/${zoneId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Koregaon Park Extended' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Koregaon Park Extended');

    const deleteRes = await request(app)
      .delete(`/api/v1/zones/${zoneId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteRes.status).toBe(200);
  });

  it('rejects malformed zone coordinates', async () => {
    const admin = await createAdmin(app);
    const cityRes = await request(app)
      .post('/api/v1/cities')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Nashik', state: 'Maharashtra' })
      .expect(201);

    const res = await request(app)
      .post('/api/v1/zones')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Bad Zone',
        cityId: cityRes.body.data.id,
        coordinates: [200, 18.5362],
      });
    expect(res.status).toBe(400);
  });
});
