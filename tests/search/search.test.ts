import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { createAdmin } = await import('../helpers/auth.js');
const { createApprovedProviderWithService } = await import('../helpers/provider.js');

describe('search', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds services and providers via global search and suggestions', async () => {
    await createApprovedProviderWithService(app);

    const searchRes = await request(app).get('/api/v1/search?q=Grooming');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.services.length).toBeGreaterThan(0);
    expect(searchRes.body.data.providers.length).toBeGreaterThan(0);

    const suggestRes = await request(app).get('/api/v1/search/suggestions?q=Full');
    expect(suggestRes.status).toBe(200);
    expect(Array.isArray(suggestRes.body.data)).toBe(true);
    expect(suggestRes.body.data.length).toBeGreaterThan(0);
  });

  it('finds published blogs via search', async () => {
    const admin = await createAdmin(app);
    await request(app)
      .post('/api/v1/blogs')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        title: 'Grooming tips for beginners',
        slug: 'grooming-tips-beginners',
        content: 'Everything about grooming your pet',
        isPublished: true,
      })
      .expect(201);

    const searchRes = await request(app).get('/api/v1/search?q=grooming');
    expect(searchRes.body.data.blogs.length).toBeGreaterThan(0);
  });
});
