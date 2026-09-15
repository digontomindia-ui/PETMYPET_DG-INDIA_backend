import type { Express } from 'express';
import request from 'supertest';

export async function completeBooking(
  app: Express,
  userToken: string,
  providerToken: string,
  providerId: string,
  serviceId: string,
) {
  const scheduledStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  // The end-OTP step geofences the provider's location against the owner's default address —
  // needs one on file or verifyEndOtp rejects with "No service address found for this booking".
  await request(app)
    .post('/api/v1/users/me/addresses')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      label: 'Home',
      addressLine1: '221B Baker Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      coordinates: [77.5946, 12.9716],
      isDefault: true,
    })
    .expect(201);

  const createRes = await request(app)
    .post('/api/v1/bookings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ providerId, serviceId, scheduledStart })
    .expect(201);
  const bookingId = createRes.body.data.id as string;

  await request(app)
    .patch(`/api/v1/bookings/${bookingId}/accept`)
    .set('Authorization', `Bearer ${providerToken}`)
    .expect(200);
  await request(app)
    .patch(`/api/v1/bookings/${bookingId}/on-the-way`)
    .set('Authorization', `Bearer ${providerToken}`)
    .expect(200);

  const ownerView = await request(app)
    .get(`/api/v1/bookings/${bookingId}`)
    .set('Authorization', `Bearer ${userToken}`);
  const otpStart = ownerView.body.data.otpStart as string;

  await request(app)
    .post(`/api/v1/bookings/${bookingId}/otp/start`)
    .set('Authorization', `Bearer ${providerToken}`)
    .send({ code: otpStart })
    .expect(200);

  const ownerViewAfterStart = await request(app)
    .get(`/api/v1/bookings/${bookingId}`)
    .set('Authorization', `Bearer ${userToken}`);
  const otpEnd = ownerViewAfterStart.body.data.otpEnd as string;

  await request(app)
    .post(`/api/v1/bookings/${bookingId}/otp/end`)
    .set('Authorization', `Bearer ${providerToken}`)
    .send({ code: otpEnd, lat: 12.9716, lng: 77.5946 })
    .expect(200);

  return bookingId;
}
