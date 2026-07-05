import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { createAdmin, signupAndVerify } = await import('../helpers/auth.js');

describe('blogs / CMS', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only shows published posts publicly and lets an admin manage them', async () => {
    const admin = await createAdmin(app);

    const draftRes = await request(app)
      .post('/api/v1/blogs')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Draft post', slug: 'draft-post', content: 'wip', isPublished: false });
    expect(draftRes.status).toBe(201);

    const publishedRes = await request(app)
      .post('/api/v1/blogs')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        title: 'How to groom your dog',
        slug: 'how-to-groom-your-dog',
        content: 'Full guide...',
        tags: ['grooming'],
        isPublished: true,
      });
    expect(publishedRes.status).toBe(201);
    expect(publishedRes.body.data.publishedAt).not.toBeNull();

    const listRes = await request(app).get('/api/v1/blogs');
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].slug).toBe('how-to-groom-your-dog');

    const draftFetch = await request(app).get('/api/v1/blogs/draft-post');
    expect(draftFetch.status).toBe(404);

    const publishedFetch = await request(app).get('/api/v1/blogs/how-to-groom-your-dog');
    expect(publishedFetch.status).toBe(200);
  });

  it('rejects a non-admin from creating a blog post', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const res = await request(app)
      .post('/api/v1/blogs')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ title: 'Should fail', slug: 'should-fail', content: 'nope' });
    expect(res.status).toBe(403);
  });
});
