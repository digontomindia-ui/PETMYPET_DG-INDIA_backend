import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify, createAdmin } = await import('../helpers/auth.js');

describe('admin', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admins from every admin endpoint', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const auth = `Bearer ${user.tokens.accessToken}`;

    await request(app).get('/api/v1/admin/dashboard').set('Authorization', auth).expect(403);
    await request(app).get('/api/v1/admin/feature-flags').set('Authorization', auth).expect(403);
    await request(app).get('/api/v1/admin/settings').set('Authorization', auth).expect(403);
    await request(app).get('/api/v1/admin/banners').set('Authorization', auth).expect(403);
    await request(app).get('/api/v1/admin/audit-logs').set('Authorization', auth).expect(403);
  });

  it('lets a super admin manage feature flags', async () => {
    const admin = await createAdmin(app);
    const auth = `Bearer ${admin.accessToken}`;

    const upsertRes = await request(app)
      .put('/api/v1/admin/feature-flags/new-checkout')
      .set('Authorization', auth)
      .send({ isEnabled: true, description: 'Rollout of the new checkout flow' });
    expect(upsertRes.status).toBe(200);
    expect(upsertRes.body.data.key).toBe('new-checkout');
    expect(upsertRes.body.data.isEnabled).toBe(true);

    const listRes = await request(app)
      .get('/api/v1/admin/feature-flags')
      .set('Authorization', auth);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    const publicRes = await request(app).get('/api/v1/feature-flags');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data[0].key).toBe('new-checkout');
  });

  it('lets a super admin manage platform settings', async () => {
    const admin = await createAdmin(app);
    const auth = `Bearer ${admin.accessToken}`;

    const upsertRes = await request(app)
      .put('/api/v1/admin/settings/max-booking-radius-km')
      .set('Authorization', auth)
      .send({ value: 25, description: 'Max radius for provider search' });
    expect(upsertRes.status).toBe(200);
    expect(upsertRes.body.data.value).toBe(25);

    const listRes = await request(app).get('/api/v1/admin/settings').set('Authorization', auth);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
  });

  it('lets a super admin manage banners and exposes only active ones publicly', async () => {
    const admin = await createAdmin(app);
    const auth = `Bearer ${admin.accessToken}`;

    const createRes = await request(app)
      .post('/api/v1/admin/banners')
      .set('Authorization', auth)
      .send({ title: 'Summer Sale', imageUrl: 'https://example.com/banner.png', order: 1 });
    expect(createRes.status).toBe(201);
    const bannerId = createRes.body.data.id as string;
    expect(createRes.body.data.isActive).toBe(true);

    const activeRes = await request(app).get('/api/v1/banners');
    expect(activeRes.status).toBe(200);
    expect(activeRes.body.data).toHaveLength(1);

    const deactivateRes = await request(app)
      .put(`/api/v1/admin/banners/${bannerId}`)
      .set('Authorization', auth)
      .send({ isActive: false });
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.isActive).toBe(false);

    const activeAfterRes = await request(app).get('/api/v1/banners');
    expect(activeAfterRes.body.data).toHaveLength(0);

    const allRes = await request(app).get('/api/v1/admin/banners').set('Authorization', auth);
    expect(allRes.body.data).toHaveLength(1);

    const removeRes = await request(app)
      .delete(`/api/v1/admin/banners/${bannerId}`)
      .set('Authorization', auth);
    expect(removeRes.status).toBe(200);

    const allAfterRemoveRes = await request(app)
      .get('/api/v1/admin/banners')
      .set('Authorization', auth);
    expect(allAfterRemoveRes.body.data).toHaveLength(0);
  });

  it('records an audit log entry when an admin blocks a user, and lists it', async () => {
    const admin = await createAdmin(app);
    const auth = `Bearer ${admin.accessToken}`;
    const user = await signupAndVerify(app, { role: 'USER' });

    const blockRes = await request(app)
      .patch(`/api/v1/users/${user.user.id}/block`)
      .set('Authorization', auth);
    expect(blockRes.status).toBe(200);
    expect(blockRes.body.data.isBlocked).toBe(true);

    const auditRes = await request(app)
      .get('/api/v1/admin/audit-logs?entityType=User')
      .set('Authorization', auth);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(auditRes.body.data[0].action).toBe('USER_BLOCKED');
    expect(auditRes.body.data[0].entityId).toBe(user.user.id);
  });

  it('aggregates the dashboard overview for a super admin', async () => {
    const admin = await createAdmin(app);
    const dashboardRes = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.data.pendingModeration).toBeDefined();
    expect(dashboardRes.body.data.pendingModeration.providerKyc).toBeGreaterThanOrEqual(0);
  });
});
