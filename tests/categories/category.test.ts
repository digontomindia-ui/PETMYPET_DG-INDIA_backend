import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify, createAdmin } = await import('../helpers/auth.js');

function uniqueSlug(): string {
  return `grooming-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe('categories', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admins from creating a category', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ name: 'Grooming', slug: uniqueSlug() });
    expect(res.status).toBe(403);
  });

  it('lets an admin create, list, get, update, and delete a category', async () => {
    const admin = await createAdmin(app);
    const slug = uniqueSlug();

    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Grooming', slug, providerTypes: ['GROOMER'] });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.slug).toBe(slug);
    expect(createRes.body.data.isActive).toBe(true);
    const categoryId = createRes.body.data.id as string;

    const listRes = await request(app).get('/api/v1/categories');
    expect(listRes.status).toBe(200);
    const categories = listRes.body.data as { id: string }[];
    expect(categories.some((c) => c.id === categoryId)).toBe(true);

    const getRes = await request(app).get(`/api/v1/categories/${categoryId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Grooming');

    const updateRes = await request(app)
      .put(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Pet Grooming' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Pet Grooming');

    const deleteRes = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteRes.status).toBe(200);

    const getAfterDeleteRes = await request(app).get(`/api/v1/categories/${categoryId}`);
    expect(getAfterDeleteRes.status).toBe(404);
  });

  it('rejects a duplicate slug', async () => {
    const admin = await createAdmin(app);
    const slug = uniqueSlug();

    await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Boarding', slug })
      .expect(201);

    const dupRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Boarding Again', slug });
    expect(dupRes.status).toBe(409);
  });

  it('rejects an invalid slug format', async () => {
    const admin = await createAdmin(app);
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Bad Slug', slug: 'Not A Valid Slug!' });
    expect(res.status).toBe(400);
  });
});
