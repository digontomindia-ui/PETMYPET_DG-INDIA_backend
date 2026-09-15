import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');
const { createApprovedProviderWithService } = await import('../helpers/provider.js');

const WEEKDAY_BY_JS_DAY_INDEX = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function futureDateString(daysAhead: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

describe('availability', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty slot list for a day the provider has not configured', async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app, {
      durationMinutes: 90,
    });
    const date = futureDateString(7);

    const res = await request(app).get(
      `/api/v1/availability?providerId=${providerId}&serviceId=${serviceId}&date=${date}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.slots).toEqual([]);
  });

  it('lists 30-minute-stepped slots across the working hours, then marks a booked slot unavailable', async () => {
    const { providerAccount, providerId, serviceId } = await createApprovedProviderWithService(
      app,
      {
        durationMinutes: 90,
      },
    );

    const date = futureDateString(7);
    const weekday = WEEKDAY_BY_JS_DAY_INDEX[new Date(`${date}T00:00:00.000Z`).getUTCDay()];

    await request(app)
      .put('/api/v1/providers/me')
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`)
      .send({
        workingHours: [{ day: weekday, openTime: '09:00', closeTime: '15:00', isClosed: false }],
      })
      .expect(200);

    const beforeRes = await request(app).get(
      `/api/v1/availability?providerId=${providerId}&serviceId=${serviceId}&date=${date}`,
    );
    expect(beforeRes.status).toBe(200);
    const beforeSlots = beforeRes.body.data.slots as { isAvailable: boolean }[];
    // 09:00 to 15:00, 90-minute slots stepped every 30 minutes: last start is 13:30
    // (13:30 + 90min = 15:00) => 09:00..13:30 inclusive => 10 slots.
    expect(beforeSlots).toHaveLength(10);
    expect(beforeSlots.every((slot) => slot.isAvailable)).toBe(true);

    const user = await signupAndVerify(app, { role: 'USER' });
    const bookingStart = `${date}T10:00:00.000Z`;
    await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ providerId, serviceId, scheduledStart: bookingStart })
      .expect(201);

    const afterRes = await request(app).get(
      `/api/v1/availability?providerId=${providerId}&serviceId=${serviceId}&date=${date}`,
    );
    const slotsByStart = new Map(
      (afterRes.body.data.slots as { start: string; isAvailable: boolean }[]).map((slot) => [
        slot.start,
        slot.isAvailable,
      ]),
    );
    // The booking runs 10:00-11:30 (90 min). Every slot starting from 09:00 through 11:00
    // (each also 90 min) overlaps that window; 11:30 onward starts exactly when the booking
    // ends, so it doesn't.
    expect(slotsByStart.get(bookingStart)).toBe(false);
    expect(slotsByStart.get(`${date}T09:30:00.000Z`)).toBe(false);
    expect(slotsByStart.get(`${date}T09:00:00.000Z`)).toBe(false);
    expect(slotsByStart.get(`${date}T11:00:00.000Z`)).toBe(false);
    expect(slotsByStart.get(`${date}T11:30:00.000Z`)).toBe(true);
  });

  it('rejects a serviceId that does not belong to the given provider', async () => {
    const { serviceId } = await createApprovedProviderWithService(app);
    const other = await createApprovedProviderWithService(app);
    const date = futureDateString(7);

    const res = await request(app).get(
      `/api/v1/availability?providerId=${other.providerId}&serviceId=${serviceId}&date=${date}`,
    );
    expect(res.status).toBe(400);
  });

  it('rejects a malformed date', async () => {
    const { providerId, serviceId } = await createApprovedProviderWithService(app);
    const res = await request(app).get(
      `/api/v1/availability?providerId=${providerId}&serviceId=${serviceId}&date=not-a-date`,
    );
    expect(res.status).toBe(400);
  });
});
