import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');
const { createApprovedProviderWithService } = await import('../helpers/provider.js');

function futureDate(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

describe('booking lifecycle', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs the full happy path: create -> accept -> on the way -> start OTP -> end OTP -> completed', async () => {
    const { providerAccount, providerId, serviceId } = await createApprovedProviderWithService(app);
    const user = await signupAndVerify(app, { role: 'USER' });

    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart: futureDate(2) });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('PENDING');
    expect(createRes.body.data.otpStart).toBeNull(); // not revealed until ACCEPTED
    const bookingId = createRes.body.data.id as string;

    const providerAuth = `Bearer ${providerAccount.tokens.accessToken}`;

    const acceptRes = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', providerAuth);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');

    const ownerViewAfterAccept = await request(app)
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    const startOtp = ownerViewAfterAccept.body.data.otpStart as string;
    expect(startOtp).toMatch(/^\d{6}$/);

    const onTheWayRes = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/on-the-way`)
      .set('Authorization', providerAuth);
    expect(onTheWayRes.body.data.status).toBe('ON_THE_WAY');

    const badStartOtp = await request(app)
      .post(`/api/v1/bookings/${bookingId}/otp/start`)
      .set('Authorization', providerAuth)
      .send({ code: '0000' });
    expect(badStartOtp.status).toBe(400);

    const startRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/otp/start`)
      .set('Authorization', providerAuth)
      .send({ code: startOtp });
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('STARTED');

    const ownerViewAfterStart = await request(app)
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    const endOtp = ownerViewAfterStart.body.data.otpEnd as string;
    expect(endOtp).toMatch(/^\d{6}$/);

    const endRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/otp/end`)
      .set('Authorization', providerAuth)
      .send({ code: endOtp });
    expect(endRes.status).toBe(200);
    expect(endRes.body.data.status).toBe('COMPLETED');

    // Terminal-ish state: cannot restart the flow from COMPLETED.
    const illegalTransition = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', providerAuth);
    expect(illegalTransition.status).toBe(400);
  });

  it('rejects double-booking a provider for an overlapping time slot', async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app, {
      durationMinutes: 60,
    });
    const user = await signupAndVerify(app, { role: 'USER' });
    const scheduledStart = futureDate(5);

    const first = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart });
    expect(second.status).toBe(409);
  });

  it("lets a user cancel their own pending booking but not access someone else's", async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app);
    const owner = await signupAndVerify(app, { role: 'USER' });
    const stranger = await signupAndVerify(app, { role: 'USER' });

    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${owner.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart: futureDate(3) });
    const bookingId = createRes.body.data.id as string;

    const strangerAccess = await request(app)
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${stranger.tokens.accessToken}`);
    expect(strangerAccess.status).toBe(403);

    const strangerCancel = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${stranger.tokens.accessToken}`)
      .send({ reason: 'not mine' });
    expect(strangerCancel.status).toBe(403);

    const ownerCancel = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${owner.tokens.accessToken}`)
      .send({ reason: 'change of plans' });
    expect(ownerCancel.status).toBe(200);
    expect(ownerCancel.body.data.status).toBe('CANCELLED');
    expect(ownerCancel.body.data.cancelledBy).toBe('USER');
  });

  it('cancels a pet-taxi booking through the same unified /bookings/:id/cancel route', async () => {
    const owner = await signupAndVerify(app, { role: 'USER' });
    const auth = `Bearer ${owner.tokens.accessToken}`;

    const petRes = await request(app)
      .post('/api/v1/pets')
      .set('Authorization', auth)
      .send({ name: 'Bruno', species: 'DOG' });
    expect(petRes.status).toBe(201);
    const petId = petRes.body.data.id as string;

    const taxiRes = await request(app)
      .post('/api/v1/pet-taxi/bookings')
      .set('Authorization', auth)
      .send({
        tripType: 'ONE_WAY',
        petIds: [petId],
        pickupAddress: '1 MG Road',
        dropAddress: '2 Brigade Road',
        pickupDate: futureDate(24).slice(0, 10),
        pickupTime: '10:00',
      });
    expect(taxiRes.status).toBe(201);
    expect(taxiRes.body.data.pets[0].name).toBe('Bruno');
    const taxiBookingId = taxiRes.body.data.id as string;

    // Same route SERVICE bookings use — no bookingType branching needed on the client.
    const cancelRes = await request(app)
      .patch(`/api/v1/bookings/${taxiBookingId}/cancel`)
      .set('Authorization', auth)
      .send({ reason: 'change of plans' });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');
    expect(cancelRes.body.data.bookingType).toBe('PET_TAXI');
    expect(cancelRes.body.data.pets[0].name).toBe('Bruno');
  });

  it('cancels a pet-relocation request through the same unified /bookings/:id/cancel route', async () => {
    const owner = await signupAndVerify(app, { role: 'USER' });
    const auth = `Bearer ${owner.tokens.accessToken}`;

    const petRes = await request(app)
      .post('/api/v1/pets')
      .set('Authorization', auth)
      .send({ name: 'Bruno', species: 'DOG' });
    const petId = petRes.body.data.id as string;

    const relocationRes = await request(app)
      .post('/api/v1/pet-relocation/requests')
      .set('Authorization', auth)
      .send({
        ownerName: 'Test Owner',
        ownerPhone: '+919876543210',
        ownerEmail: 'owner@example.com',
        petId,
        originAddress: '1 MG Road, Bangalore',
        destinationAddress: '2 Park Street, Kolkata',
        relocationDate: futureDate(48),
        transportType: 'ROAD',
        preferredTimeSlot: 'MORNING',
      });
    expect(relocationRes.status).toBe(201);
    const relocationId = relocationRes.body.data.id as string;

    const cancelRes = await request(app)
      .patch(`/api/v1/bookings/${relocationId}/cancel`)
      .set('Authorization', auth)
      .send({ reason: 'change of plans' });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');
    expect(cancelRes.body.data.bookingType).toBe('PET_RELOCATION');
  });

  it('cancels a pet-insurance application through the same unified /bookings/:id/cancel route', async () => {
    const owner = await signupAndVerify(app, { role: 'USER' });
    const auth = `Bearer ${owner.tokens.accessToken}`;

    const insuranceRes = await request(app)
      .post('/api/v1/pet-insurance/applications')
      .set('Authorization', auth)
      .send({
        ownerName: 'Test Owner',
        ownerEmail: 'owner@example.com',
        ownerPhone: '+919876543210',
        petName: 'Bruno',
        petType: 'DOG',
        petAge: '3 years',
        petBreed: 'Labrador',
        previousIllness: false,
        previousSurgery: false,
        vaccinated: false,
      });
    expect(insuranceRes.status).toBe(201);
    const applicationId = insuranceRes.body.data.id as string;

    const cancelRes = await request(app)
      .patch(`/api/v1/bookings/${applicationId}/cancel`)
      .set('Authorization', auth)
      .send({ reason: 'change of plans' });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');
    expect(cancelRes.body.data.bookingType).toBe('PET_INSURANCE');
  });
});
