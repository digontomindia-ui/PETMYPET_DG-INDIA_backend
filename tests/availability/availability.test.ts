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
      durationMinutes: 60,
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
        durationMinutes: 60,
      },
    );

    const date = futureDateString(7);
    const weekday = WEEKDAY_BY_JS_DAY_INDEX[new Date(`${date}T00:00:00.000Z`).getUTCDay()];

    await request(app)
      .put('/api/v1/providers/me')
      .set('Authorization', `Bearer ${providerAccount.tokens.accessToken}`)
      .send({
        workingHours: [{ day: weekday, openTime: '09:00', closeTime: '12:00', isClosed: false }],
      })
      .expect(200);

    const beforeRes = await request(app).get(
      `/api/v1/availability?providerId=${providerId}&serviceId=${serviceId}&date=${date}`,
    );
    expect(beforeRes.status).toBe(200);
    const beforeSlots = beforeRes.body.data.slots as { isAvailable: boolean }[];
    // 09:00 to 12:00, 60-minute slots stepped every 30 minutes: 09:00..11:00 inclusive => 5 slots
    expect(beforeSlots).toHaveLength(5);
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
    expect(slotsByStart.get(bookingStart)).toBe(false);
    // The 09:30 slot (09:30-10:30) overlaps the 10:00-11:00 booking too.
    expect(slotsByStart.get(`${date}T09:30:00.000Z`)).toBe(false);
    // The 08:00 range doesn't exist; 09:00 slot (09:00-10:00) does not overlap a 10:00 start.
    expect(slotsByStart.get(`${date}T09:00:00.000Z`)).toBe(true);
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
