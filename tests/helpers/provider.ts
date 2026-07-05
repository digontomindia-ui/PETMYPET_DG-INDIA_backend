import type { Express } from 'express';
import request from 'supertest';
import { signupAndVerify } from './auth.js';

export async function createApprovedProviderWithService(
  app: Express,
  overrides: { price?: number; durationMinutes?: number } = {},
) {
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
      metadata: { groomer: { specializations: ['dog'] } },
    })
    .expect(201);

  const providerId = profileRes.body.data.id as string;

  const { UserModel } = await import('../../src/modules/users/user.schema.js');
  const admin = await signupAndVerify(app, { role: 'USER' });
  await UserModel.updateOne({ _id: admin.user.id }, { role: 'SUPER_ADMIN' });
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: admin.payload.email, password: admin.payload.password })
    .expect(200);
  const adminToken = adminLogin.body.data.tokens.accessToken as string;

  await request(app)
    .patch(`/api/v1/providers/${providerId}/kyc/approve`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  const categoryRes = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Grooming',
      slug: `grooming-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    })
    .expect(201);

  const serviceRes = await request(app)
    .post('/api/v1/services')
    .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`)
    .send({
      categoryId: categoryRes.body.data.id,
      name: 'Full Grooming Package',
      price: overrides.price ?? 1000,
      durationMinutes: overrides.durationMinutes ?? 60,
    })
    .expect(201);

  return {
    providerAccount,
    providerId,
    serviceId: serviceRes.body.data.id as string,
    adminToken,
  };
}
