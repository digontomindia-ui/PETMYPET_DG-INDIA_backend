import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify, createAdmin } = await import('../helpers/auth.js');

async function createCategory(app: Awaited<ReturnType<typeof createApp>>, adminToken: string) {
  const res = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Grooming',
      slug: `grooming-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    })
    .expect(201);
  return res.body.data.id as string;
}

async function createProvider(app: Awaited<ReturnType<typeof createApp>>) {
  const providerAccount = await signupAndVerify(app, { role: 'SERVICE_PROVIDER' });
  const profileRes = await request(app)
    .post('/api/v1/providers/me')
    .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`)
    .send({
      providerType: 'GROOMER',
      businessName: 'Test Grooming Co',
      address: 'Test address',
      coordinates: [72.8777, 19.076],
      zoneIds: [],
      workingHours: [],
    })
    .expect(201);
  return { providerAccount, providerId: profileRes.body.data.id as string };
}

describe('services', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a plain user from creating a service', async () => {
    const admin = await createAdmin(app);
    const categoryId = await createCategory(app, admin.accessToken);
    const user = await signupAndVerify(app, { role: 'USER' });

    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ categoryId, name: 'Full Grooming', price: 500, durationMinutes: 45 });
    expect(res.status).toBe(403);
  });

  it('lets a provider create, search, get, update, and remove their own service', async () => {
    const admin = await createAdmin(app);
    const categoryId = await createCategory(app, admin.accessToken);
    const { providerAccount, providerId } = await createProvider(app);

    const createRes = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`)
      .send({ categoryId, name: 'Full Grooming', price: 500, durationMinutes: 45 });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.providerId).toBe(providerId);
    const serviceId = createRes.body.data.id as string;

    const searchRes = await request(app).get(`/api/v1/services?categoryId=${categoryId}`);
    expect(searchRes.status).toBe(200);
    const searchedServices = searchRes.body.data as { id: string }[];
    expect(searchedServices.some((s) => s.id === serviceId)).toBe(true);

    const priceFilterRes = await request(app).get('/api/v1/services?minPrice=1000');
    const priceFilteredServices = priceFilterRes.body.data as { id: string }[];
    expect(priceFilteredServices.some((s) => s.id === serviceId)).toBe(false);

    const getRes = await request(app).get(`/api/v1/services/${serviceId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Full Grooming');

    const updateRes = await request(app)
      .put(`/api/v1/services/${serviceId}`)
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`)
      .send({ price: 600 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.price).toBe(600);

    const removeRes = await request(app)
      .delete(`/api/v1/services/${serviceId}`)
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`);
    expect(removeRes.status).toBe(200);

    const getAfterRemoveRes = await request(app).get(`/api/v1/services/${serviceId}`);
    expect(getAfterRemoveRes.status).toBe(404);
  });

  it("rejects a provider from updating or deleting another provider's service", async () => {
    const admin = await createAdmin(app);
    const categoryId = await createCategory(app, admin.accessToken);
    const { providerAccount: ownerAccount } = await createProvider(app);
    const { providerAccount: otherAccount } = await createProvider(app);

    const createRes = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${ownerAccount.tokens.accessToken}`)
      .send({ categoryId, name: 'Full Grooming', price: 500, durationMinutes: 45 })
      .expect(201);
    const serviceId = createRes.body.data.id as string;

    const updateRes = await request(app)
      .put(`/api/v1/services/${serviceId}`)
      .set('Authorization', `Bearer ${otherAccount.tokens.accessToken}`)
      .send({ price: 1 });
    expect(updateRes.status).toBe(403);

    const removeRes = await request(app)
      .delete(`/api/v1/services/${serviceId}`)
      .set('Authorization', `Bearer ${otherAccount.tokens.accessToken}`);
    expect(removeRes.status).toBe(403);
  });

  it('rejects a provider from creating a service before they have a provider profile', async () => {
    const providerAccount = await signupAndVerify(app, { role: 'SERVICE_PROVIDER' });
    const admin = await createAdmin(app);
    const categoryId = await createCategory(app, admin.accessToken);

    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`)
      .send({ categoryId, name: 'Full Grooming', price: 500, durationMinutes: 45 });
    expect(res.status).toBe(404);
  });
});
