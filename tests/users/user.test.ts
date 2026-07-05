import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify, createAdmin } = await import('../helpers/auth.js');

describe('users', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets a user fetch and update their own profile', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const auth = `Bearer ${user.tokens.accessToken}`;

    const meRes = await request(app).get('/api/v1/users/me').set('Authorization', auth);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(user.payload.email);

    const updateRes = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', auth)
      .send({ name: 'Updated Name', preferences: { smsNotifications: false } });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Updated Name');
    expect(updateRes.body.data.preferences.smsNotifications).toBe(false);
  });

  it('lets a user manage addresses, making the first one default automatically', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const auth = `Bearer ${user.tokens.accessToken}`;

    const addRes = await request(app)
      .post('/api/v1/users/me/addresses')
      .set('Authorization', auth)
      .send({
        label: 'Home',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        coordinates: [72.8777, 19.076],
      });
    expect(addRes.status).toBe(201);
    expect(addRes.body.data.addresses).toHaveLength(1);
    expect(addRes.body.data.addresses[0].isDefault).toBe(true);
    const addressId = addRes.body.data.addresses[0]._id as string;

    const removeRes = await request(app)
      .delete(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', auth);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.addresses).toHaveLength(0);
  });

  it('lets a user register and remove a device token', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const auth = `Bearer ${user.tokens.accessToken}`;

    const registerRes = await request(app)
      .post('/api/v1/users/me/device-tokens')
      .set('Authorization', auth)
      .send({ deviceToken: 'fcm-token-abc' });
    expect(registerRes.status).toBe(200);

    const removeRes = await request(app)
      .delete('/api/v1/users/me/device-tokens')
      .set('Authorization', auth)
      .send({ deviceToken: 'fcm-token-abc' });
    expect(removeRes.status).toBe(200);
  });

  it('rejects a plain user from listing or fetching other users', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const other = await signupAndVerify(app, { role: 'USER' });

    const listRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(listRes.status).toBe(403);

    const getRes = await request(app)
      .get(`/api/v1/users/${other.user.id}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(getRes.status).toBe(403);
  });

  it('lets an admin list, search, and soft-delete a user', async () => {
    const admin = await createAdmin(app);
    const target = await signupAndVerify(app, { name: 'Findable Person', role: 'USER' });

    const listRes = await request(app)
      .get('/api/v1/users?search=Findable')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    const users = listRes.body.data as { id: string }[];
    expect(users.some((u) => u.id === target.user.id)).toBe(true);

    const deleteRes = await request(app)
      .delete(`/api/v1/users/${target.user.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteRes.status).toBe(200);

    const getAfterDeleteRes = await request(app)
      .get(`/api/v1/users/${target.user.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(getAfterDeleteRes.status).toBe(404);
  });

  it('lets a user delete their own account', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });
    const deleteRes = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(deleteRes.status).toBe(200);
  });
});
