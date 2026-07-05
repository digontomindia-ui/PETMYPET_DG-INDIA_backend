import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { createAdmin, signupAndVerify } = await import('../helpers/auth.js');

describe('community posts', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a post, likes/unlikes it, comments on it, and lists the feed', async () => {
    const author = await signupAndVerify(app, { role: 'USER' });
    const viewer = await signupAndVerify(app, { role: 'USER' });

    const createRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${author.tokens.accessToken}`)
      .send({ content: 'My dog learned a new trick today!' });
    expect(createRes.status).toBe(201);
    const postId = createRes.body.data.id as string;

    const feed = await request(app).get('/api/v1/posts');
    expect(feed.status).toBe(200);
    expect(feed.body.data).toHaveLength(1);

    const likeRes = await request(app)
      .post(`/api/v1/posts/${postId}/like`)
      .set('Authorization', `Bearer ${viewer.tokens.accessToken}`);
    expect(likeRes.status).toBe(201);

    const duplicateLike = await request(app)
      .post(`/api/v1/posts/${postId}/like`)
      .set('Authorization', `Bearer ${viewer.tokens.accessToken}`);
    expect(duplicateLike.status).toBe(409);

    const postAfterLike = await request(app)
      .get(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${viewer.tokens.accessToken}`);
    expect(postAfterLike.body.data.likesCount).toBe(1);
    expect(postAfterLike.body.data.viewerHasLiked).toBe(true);

    await request(app)
      .delete(`/api/v1/posts/${postId}/like`)
      .set('Authorization', `Bearer ${viewer.tokens.accessToken}`)
      .expect(200);

    const commentRes = await request(app)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${viewer.tokens.accessToken}`)
      .send({ content: 'Nice!' });
    expect(commentRes.status).toBe(201);

    const commentsRes = await request(app).get(`/api/v1/posts/${postId}/comments`);
    expect(commentsRes.body.data).toHaveLength(1);

    const postFinal = await request(app).get(`/api/v1/posts/${postId}`);
    expect(postFinal.body.data.likesCount).toBe(0);
    expect(postFinal.body.data.commentsCount).toBe(1);
  });

  it('bookmarks a post and lists it under my bookmarks', async () => {
    const author = await signupAndVerify(app, { role: 'USER' });
    const viewer = await signupAndVerify(app, { role: 'USER' });

    const createRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${author.tokens.accessToken}`)
      .send({ content: 'Bookmark me' });
    const postId = createRes.body.data.id as string;

    await request(app)
      .post(`/api/v1/posts/${postId}/bookmark`)
      .set('Authorization', `Bearer ${viewer.tokens.accessToken}`)
      .expect(201);

    const bookmarks = await request(app)
      .get('/api/v1/posts/bookmarks/me')
      .set('Authorization', `Bearer ${viewer.tokens.accessToken}`);
    expect(bookmarks.body.data).toHaveLength(1);
    expect(bookmarks.body.data[0].id).toBe(postId);
  });

  it('lets a user report a post and an admin resolve or moderate-remove it', async () => {
    const author = await signupAndVerify(app, { role: 'USER' });
    const reporter = await signupAndVerify(app, { role: 'USER' });
    const admin = await createAdmin(app);

    const createRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${author.tokens.accessToken}`)
      .send({ content: 'Questionable content' });
    const postId = createRes.body.data.id as string;

    const reportRes = await request(app)
      .post(`/api/v1/posts/${postId}/report`)
      .set('Authorization', `Bearer ${reporter.tokens.accessToken}`)
      .send({ reason: 'Inappropriate' });
    expect(reportRes.status).toBe(201);
    const reportId = reportRes.body.data.id as string;

    const pendingReports = await request(app)
      .get('/api/v1/posts/reports?status=PENDING')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(pendingReports.body.data).toHaveLength(1);

    const resolveRes = await request(app)
      .patch(`/api/v1/posts/reports/${reportId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'RESOLVED' });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('RESOLVED');

    const moderateRes = await request(app)
      .delete(`/api/v1/posts/${postId}/moderate`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(moderateRes.status).toBe(200);

    const afterModeration = await request(app).get(`/api/v1/posts/${postId}`);
    expect(afterModeration.status).toBe(404);
  });

  it("only lets a post's author or an admin delete it", async () => {
    const author = await signupAndVerify(app, { role: 'USER' });
    const stranger = await signupAndVerify(app, { role: 'USER' });

    const createRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${author.tokens.accessToken}`)
      .send({ content: 'Mine only' });
    const postId = createRes.body.data.id as string;

    const strangerDelete = await request(app)
      .delete(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${stranger.tokens.accessToken}`);
    expect(strangerDelete.status).toBe(403);

    const ownerDelete = await request(app)
      .delete(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${author.tokens.accessToken}`);
    expect(ownerDelete.status).toBe(200);
  });
});
