import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');

describe('pets', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets a user create, list, get, update, and delete their own pet', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const auth = `Bearer ${user.tokens.accessToken}`;

    const createRes = await request(app)
      .post('/api/v1/pets')
      .set('Authorization', auth)
      .send({ name: 'Bruno', species: 'DOG', breed: 'Labrador' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Bruno');
    expect(createRes.body.data.gender).toBe('UNKNOWN');
    const petId = createRes.body.data.id as string;

    const listRes = await request(app).get('/api/v1/pets').set('Authorization', auth);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    const getRes = await request(app).get(`/api/v1/pets/${petId}`).set('Authorization', auth);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.breed).toBe('Labrador');

    const updateRes = await request(app)
      .put(`/api/v1/pets/${petId}`)
      .set('Authorization', auth)
      .send({ weightKg: 25.5 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.weightKg).toBe(25.5);

    const deleteRes = await request(app).delete(`/api/v1/pets/${petId}`).set('Authorization', auth);
    expect(deleteRes.status).toBe(200);

    const getAfterDeleteRes = await request(app)
      .get(`/api/v1/pets/${petId}`)
      .set('Authorization', auth);
    expect(getAfterDeleteRes.status).toBe(404);
  });

  it("rejects a user from accessing another user's pet", async () => {
    const owner = await signupAndVerify(app, { role: 'USER' });
    const stranger = await signupAndVerify(app, { role: 'USER' });

    const createRes = await request(app)
      .post('/api/v1/pets')
      .set('Authorization', `Bearer ${owner.tokens.accessToken}`)
      .send({ name: 'Whiskers', species: 'CAT' })
      .expect(201);
    const petId = createRes.body.data.id as string;

    const getRes = await request(app)
      .get(`/api/v1/pets/${petId}`)
      .set('Authorization', `Bearer ${stranger.tokens.accessToken}`);
    expect(getRes.status).toBe(403);

    const updateRes = await request(app)
      .put(`/api/v1/pets/${petId}`)
      .set('Authorization', `Bearer ${stranger.tokens.accessToken}`)
      .send({ name: 'Hijacked' });
    expect(updateRes.status).toBe(403);
  });

  it('adds a medical record and a vaccination to a pet', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const auth = `Bearer ${user.tokens.accessToken}`;

    const createRes = await request(app)
      .post('/api/v1/pets')
      .set('Authorization', auth)
      .send({ name: 'Rocky', species: 'DOG' })
      .expect(201);
    const petId = createRes.body.data.id as string;

    const medicalRes = await request(app)
      .post(`/api/v1/pets/${petId}/medical-records`)
      .set('Authorization', auth)
      .send({ title: 'Annual checkup', description: 'All good' });
    expect(medicalRes.status).toBe(201);
    expect(medicalRes.body.data.medicalRecords).toHaveLength(1);

    const vaccinationRes = await request(app)
      .post(`/api/v1/pets/${petId}/vaccinations`)
      .set('Authorization', auth)
      .send({ name: 'Rabies', administeredAt: '2025-01-01T00:00:00.000Z' });
    expect(vaccinationRes.status).toBe(201);
    expect(vaccinationRes.body.data.vaccinations).toHaveLength(1);
  });

  it('rejects an invalid species', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const res = await request(app)
      .post('/api/v1/pets')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ name: 'Mystery', species: 'DRAGON' });
    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/pets');
    expect(res.status).toBe(401);
  });
});
